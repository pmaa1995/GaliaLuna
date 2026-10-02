import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CATEGORIES = ["Anillos", "Aretes", "Cadenas", "Carteras", "Collares"];
const SITE_URL = "https://www.galialuna.com";
const API_VERSION = "2025-02-25";
const PRODUCT_QUERY = `*[_type == "product" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))] | order(_createdAt asc) {
  _id, _type, name, slug, category, price, currency, isActive, inventory,
  "images": images[]{"assetId": asset._ref, "url": asset->url,
    "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height,
    "size": asset->size}
}`;

export function publicConfig(env = process.env) {
  const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID || "nepto6np";
  const dataset = env.NEXT_PUBLIC_SANITY_DATASET || "production";
  if (!/^[a-z0-9]{1,64}$/.test(projectId) || !/^[a-z0-9_-]{1,64}$/.test(dataset)) {
    throw new Error("El proyecto o dataset público de Sanity tiene un formato inválido.");
  }
  return { projectId, dataset };
}

export function publicQueryUrl(config) {
  const { projectId, dataset } = publicConfig({
    NEXT_PUBLIC_SANITY_PROJECT_ID: config.projectId,
    NEXT_PUBLIC_SANITY_DATASET: config.dataset,
  });
  const url = new URL(`https://${projectId}.api.sanity.io/v${API_VERSION}/data/query/${dataset}`);
  url.searchParams.set("perspective", "published");
  url.searchParams.set("query", PRODUCT_QUERY);
  return url;
}

export async function fetchPublicProducts(config, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(publicQueryUrl(config), {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "omit",
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`No se pudo leer el catálogo público (HTTP ${response.status}).`);
  const payload = await response.json();
  if (!Array.isArray(payload?.result)) throw new Error("Respuesta de catálogo público inválida.");
  return payload.result;
}

function text(value) { return typeof value === "string" ? value : null; }
function finite(value) { return typeof value === "number" && Number.isFinite(value); }
function warning(entry, code) {
  if (!entry.warnings.includes(code)) entry.warnings.push(code);
}

// Match sanity/lib/mappers.ts and lib/catalogData.ts. Regression tests compare
// these rules against the actual mapper so an eligibility change cannot drift.
export function auditProducts(documents, config = publicConfig(), auditedAt = new Date().toISOString()) {
  if (!Array.isArray(documents)) throw new Error("Respuesta de catálogo público inválida.");
  const seen = new Set();
  const names = new Map();
  const assets = new Map();
  const products = documents.map((raw) => {
    if (!raw || typeof raw !== "object" || raw._type !== "product") {
      throw new Error("La respuesta contiene un documento ajeno al catálogo público.");
    }
    // Never write draft/release content to a report, even if an upstream response is wrong.
    if (typeof raw._id === "string" && /^(drafts|versions)\./.test(raw._id)) {
      throw new Error("La respuesta contiene contenido no publicado; se canceló la auditoría.");
    }
    const id = text(raw._id);
    const name = text(raw.name);
    const slug = text(raw.slug?.current);
    const sourceCategory = text(raw.category);
    const category = CATEGORIES.find((value) => value.toLowerCase() === sourceCategory?.toLowerCase()) ?? CATEGORIES[0];
    const errors = [];
    if (!id) errors.push("missing_id");
    if (!name) errors.push("missing_name");
    if (!slug) errors.push("missing_slug");
    if (!finite(raw.price) || raw.price < 0) errors.push("invalid_price");
    if (raw.currency != null && raw.currency !== "DOP") errors.push("unsupported_currency");
    const active = typeof raw.isActive === "boolean" ? raw.isActive : true;
    let status = "invalid";
    if (errors.length === 0) {
      status = seen.has(id) ? "duplicate_id" : active ? "visible" : "inactive";
      seen.add(id);
    }
    const entry = {
      id, name, slug, category, sourceCategory,
      price: finite(raw.price) ? raw.price : null,
      currency: text(raw.currency),
      inventory: finite(raw.inventory) ? raw.inventory : null,
      active, status, errors, warnings: [],
      url: slug ? `${SITE_URL}/product/${encodeURIComponent(slug)}` : null,
      imageCount: Array.isArray(raw.images) ? raw.images.length : 0,
      usableImageCount: 0,
    };
    if (!CATEGORIES.some((value) => value.toLowerCase() === sourceCategory?.toLowerCase())) {
      warning(entry, "category_defaults_to_anillos");
    }
    if (raw.inventory == null || !finite(raw.inventory)) warning(entry, "inventory_unknown");
    else if (!Number.isSafeInteger(raw.inventory) || raw.inventory < 0) warning(entry, "inventory_invalid");
    if (raw.currency == null) warning(entry, "currency_defaults_to_dop");
    if (name && (!name.trim() || name !== name.trim())) warning(entry, "name_whitespace");
    if (slug && (slug !== slug.toLowerCase() || slug !== slug.trim())) warning(entry, "nonstandard_slug_preserve_url");
    if (!entry.imageCount) warning(entry, "placeholder_image");
    for (const image of Array.isArray(raw.images) ? raw.images : []) {
      const url = text(image?.url)?.trim();
      if (url) entry.usableImageCount += 1;
      if (!image?.assetId || !url) warning(entry, "missing_image_asset");
      if (finite(image?.width) && finite(image?.height) && (image.width < 1200 || image.height < 1500)) {
        warning(entry, "image_below_recommended_dimensions");
      }
      if (finite(image?.size) && image.size > 700 * 1024) warning(entry, "large_original_image");
      if (typeof image?.assetId === "string" && id) {
        if (!assets.has(image.assetId)) assets.set(image.assetId, new Set());
        assets.get(image.assetId).add(id);
      }
    }
    if (!entry.usableImageCount) warning(entry, "placeholder_image");
    if (name?.trim() && id) {
      const normalizedName = name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
      if (!names.has(normalizedName)) names.set(normalizedName, new Set());
      names.get(normalizedName).add(id);
    }
    return entry;
  });
  const duplicateNames = Array.from(names, ([name, ids]) => ({ name, productIds: [...ids] }))
    .filter((group) => group.productIds.length > 1);
  const sharedImages = Array.from(assets, ([assetId, ids]) => ({ assetId, productIds: [...ids] }))
    .filter((group) => group.productIds.length > 1);
  for (const [groups, code] of [[duplicateNames, "duplicate_name"], [sharedImages, "shared_image"]]) {
    const affected = new Set(groups.flatMap((group) => group.productIds));
    for (const product of products) if (affected.has(product.id)) warning(product, code);
  }
  const visible = products.filter((product) => product.status === "visible");
  return {
    schemaVersion: 1,
    auditedAt,
    source: { projectId: config.projectId, dataset: config.dataset, perspective: "published", origin: publicQueryUrl(config).origin, authenticated: false },
    scope: "Solo productos publicados de la API pública. No permite descartar borradores privados ni comprueba la caché de la web desplegada.",
    summary: {
      published: products.length,
      visible: visible.length,
      inactive: products.filter((product) => product.status === "inactive").length,
      invalid: products.filter((product) => product.status === "invalid").length,
      duplicateIdsExcluded: products.filter((product) => product.status === "duplicate_id").length,
      withWarnings: products.filter((product) => product.warnings.length > 0).length,
      categories: Object.fromEntries(CATEGORIES.map((category) => [category, visible.filter((product) => product.category === category).length])),
    },
    warningNotes: {
      inventory_unknown: "Se muestra como consulta; no significa disponibilidad confirmada.",
      inventory_invalid: "La tienda puede mostrarlo, pero el inventario inválido debe revisarse antes de venderlo.",
      image_below_recommended_dimensions: "Recomendación de calidad; no excluye un producto publicado.",
      large_original_image: "Peso del original; no equivale al tamaño optimizado entregado por el CDN.",
      duplicate_name: "Revisar variantes; no demuestra que los registros deban eliminarse.",
      shared_image: "Revisar fotografías; compartir un asset puede ser intencional.",
      nonstandard_slug_preserve_url: "Conservar el enlace publicado o crear una redirección al modificarlo.",
    },
    duplicateNames,
    sharedImages,
    products,
  };
}

function csvCell(value) {
  let cell = value == null ? "" : String(value);
  // Product names are editable content; don't turn CSV cells into spreadsheet formulas.
  if (/^\s*[=+\-@]/u.test(cell) || /^[\t\r\n]/u.test(cell)) cell = `'${cell}`;
  return `"${cell.replace(/"/g, '""')}"`;
}

export function catalogCsv(report) {
  const rows = [["Nombre", "Categoría", "Precio (DOP)", "Inventario", "URL"],
    ...report.products.filter((product) => product.status === "visible")
      .map((product) => [product.name, product.category, product.price, product.inventory, product.url])];
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function parseArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help") { options.help = true; continue; }
    if (arg !== "--output" && arg !== "--csv") throw new Error("Opción desconocida. Usa --help.");
    const key = arg.slice(2);
    const value = args[++index];
    if (options[key] || !value || value.startsWith("-") || !value.trim()) throw new Error("Indica una ruta única después de --output o --csv.");
    options[key] = resolve(value);
  }
  if (options.output && options.output === options.csv) throw new Error("El informe JSON y el CSV necesitan rutas diferentes.");
  return options;
}

export async function main(args = process.argv.slice(2)) {
  const options = parseArguments(args);
  if (options.help) {
    process.stdout.write("Uso: node scripts/audit-catalog.mjs [--output informe.json] [--csv productos.csv]\nSolo lectura pública, sin tokens. Sin --output, imprime JSON en stdout.\nVariables opcionales: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET.\n");
    return;
  }
  const config = publicConfig();
  const report = auditProducts(await fetchPublicProducts(config), config);
  const json = JSON.stringify(report, null, 2) + "\n";
  for (const [file, content] of [[options.output, json], [options.csv, catalogCsv(report)]]) {
    if (file) { await mkdir(dirname(file), { recursive: true }); await writeFile(file, content, "utf8"); }
  }
  if (!options.output) process.stdout.write(json);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`Auditoría cancelada: ${error.message}\n`);
    process.exitCode = 1;
  });
}
