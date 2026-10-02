const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const vm = require("node:vm");
const ts = require("typescript");

const script = path.join(__dirname, "../scripts/audit-catalog.mjs");
const audit = import(pathToFileURL(script).href);

function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} };
  vm.runInNewContext(code, { module: loadedModule, exports: loadedModule.exports, URL, require(name) {
    if (name in dependencies) return dependencies[name];
    throw new Error("Unexpected dependency " + name);
  } });
  return loadedModule.exports;
}

function product(overrides = {}) {
  return { _id: "p", _type: "product", name: "Anillo", slug: { current: "anillo" }, price: 100,
    currency: "DOP", category: "Anillos", inventory: 1, isActive: true,
    images: [{ assetId: "image-1", url: "https://cdn.sanity.io/images/test/production/photo.jpg", width: 1200, height: 1500, size: 100_000 }], ...overrides };
}

test("catalog audit matches real storefront mapping, active defaults and duplicate ordering", async () => {
  const { auditProducts } = await audit;
  const types = load("types/product.ts");
  const { mapSanityProduct } = load("sanity/lib/mappers.ts", { "../../types/product": types });
  const variants = [
    {}, { _id: null }, { name: "" }, { slug: {} }, { price: null }, { price: "100" },
    { price: -1 }, { price: Infinity }, { price: NaN }, { price: 0 }, { currency: "USD" },
    { currency: null }, { currency: undefined }, { isActive: false }, { isActive: null },
    { isActive: "false" }, { inventory: null }, { inventory: 0 }, { inventory: -2 },
    { category: "aretes" }, { category: "unknown" }, { category: " Aretes " }, { name: " " },
  ];
  const rows = variants.map((variant, index) => product({ _id: "p" + index, ...variant }));
  rows.push(product({ _id: "duplicate", isActive: false }), product({ _id: "duplicate", isActive: true }));
  const seen = new Set();
  const mapped = rows.map(mapSanityProduct).filter(Boolean).filter((entry) => {
    if (seen.has(entry._id)) return false;
    seen.add(entry._id);
    return true;
  }).filter((entry) => entry.isActive);
  const report = auditProducts(rows);
  assert.deepEqual(report.products.filter((entry) => entry.status === "visible").map((entry) => [entry.id, entry.category]), mapped.map((entry) => [entry._id, entry.category]));
  assert.equal(report.summary.inactive, 2);
  assert.equal(report.summary.duplicateIdsExcluded, 1);
  assert.equal(report.summary.published, report.summary.visible + report.summary.inactive + report.summary.invalid + report.summary.duplicateIdsExcluded);
  assert.ok(report.products.find((entry) => entry.id === "p16").warnings.includes("inventory_unknown"));
});

test("image and duplicate warnings identify review work without hiding valid products", async () => {
  const { auditProducts } = await audit;
  const report = auditProducts([
    product({ _id: "a", name: " Gargantilla de Caracol ", images: [
      { assetId: "shared", url: "https://cdn.sanity.io/images/a/b/photo.jpg", width: 1086, height: 1448, size: 2_000_000 },
      { assetId: null, url: null },
    ] }),
    product({ _id: "b", name: "gargantilla de caracol", images: [{ assetId: "shared", url: "https://cdn.sanity.io/images/a/b/photo.jpg" }] }),
    product({ _id: "c", images: [] }),
  ]);
  assert.equal(report.summary.visible, 3);
  assert.equal(report.products[0].usableImageCount, 1);
  for (const code of ["missing_image_asset", "image_below_recommended_dimensions", "large_original_image", "duplicate_name", "shared_image"]) {
    assert.ok(report.products[0].warnings.includes(code), code);
  }
  assert.ok(report.products[2].warnings.includes("placeholder_image"));
  assert.deepEqual(report.sharedImages[0].productIds, ["a", "b"]);
  assert.deepEqual(report.duplicateNames[0].productIds, ["a", "b"]);
});

test("public audit never requests authorization, redirects, drafts or release versions", async () => {
  const { publicConfig, fetchPublicProducts } = await audit;
  const config = publicConfig({ NEXT_PUBLIC_SANITY_PROJECT_ID: "nepto6np", NEXT_PUBLIC_SANITY_DATASET: "production", SANITY_READ_TOKEN: "do-not-use" });
  const calls = [];
  const products = await fetchPublicProducts(config, async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ result: [product()] }) };
  });
  assert.equal(products.length, 1);
  assert.equal(calls.length, 1);
  const { url, options } = calls[0];
  assert.equal(url.origin, "https://nepto6np.api.sanity.io");
  assert.equal(url.searchParams.get("perspective"), "published");
  assert.match(url.searchParams.get("query"), /drafts\.\*\*/);
  assert.match(url.searchParams.get("query"), /versions\.\*\*/);
  assert.equal(options.method, "GET");
  assert.equal(options.credentials, "omit");
  assert.equal(options.redirect, "error");
  assert.deepEqual(options.headers, { Accept: "application/json" });
  assert.equal(JSON.stringify({ url, options }).includes("do-not-use"), false);
  for (const projectId of ["evil.com", "../../", "user@host", "a\nheader"]) {
    assert.throws(() => publicConfig({ NEXT_PUBLIC_SANITY_PROJECT_ID: projectId }), /inválido/);
  }
  assert.throws(() => publicConfig({ NEXT_PUBLIC_SANITY_DATASET: "production?perspective=drafts" }), /inválido/);
});

test("invalid responses fail before exporting private content or a misleading empty catalog", async () => {
  const { auditProducts, fetchPublicProducts, publicConfig } = await audit;
  for (const id of ["drafts.private", "versions.release.private"]) {
    assert.throws(() => auditProducts([product({ _id: id })]), /no publicado/);
  }
  assert.throws(() => auditProducts([{ _type: "order", customerEmail: "private@example.com" }]), /ajeno/);
  await assert.rejects(fetchPublicProducts(publicConfig(), async () => ({ ok: false, status: 403 })), /HTTP 403/);
  await assert.rejects(fetchPublicProducts(publicConfig(), async () => ({ ok: true, json: async () => ({ result: null }) })), /inválida/);
  assert.equal(auditProducts([]).summary.published, 0);
  const report = auditProducts([product({ secret: "never-export", customerEmail: "private@example.com" })]);
  assert.equal(JSON.stringify(report).includes("never-export"), false);
  assert.equal(JSON.stringify(report).includes("private@example.com"), false);
});

test("CSV preserves published URL case and quoting while neutralizing spreadsheet formulas", async () => {
  const { auditProducts, catalogCsv } = await audit;
  const csv = catalogCsv(auditProducts([
    product({ name: '=HYPERLINK("evil")', slug: { current: "Cadena/Original" } }),
    product({ _id: "inactive", isActive: false, name: "No exportar" }),
  ]));
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"\'=HYPERLINK(""evil"")"'));
  assert.ok(csv.includes("https://www.galialuna.com/product/Cadena%2FOriginal"));
  assert.equal(csv.includes("No exportar"), false);
});

test("CLI import has no network or filesystem effects and explicit paths cannot collide", async () => {
  const { parseArguments } = await audit;
  assert.throws(() => parseArguments(["--output"]), /ruta/);
  assert.throws(() => parseArguments(["--token", "secret"]), /desconocida/);
  assert.throws(() => parseArguments(["--output", "same.json", "--csv", "same.json"]), /diferentes/);
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", `globalThis.fetch = () => { throw new Error('Unexpected request'); }; await import(${JSON.stringify(pathToFileURL(script).href)});`], { encoding: "utf8" });
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout, "");
});
