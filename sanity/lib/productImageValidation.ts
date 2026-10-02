const SANITY_API_VERSION = "2025-02-25";
const TARGET_RATIO = 4 / 5;
const RATIO_TOLERANCE = 0.03;
const MIN_WIDTH = 1200;
const MIN_HEIGHT = 1500;
const RECOMMENDED_SOURCE_SIZE_BYTES = 700 * 1024;

type ProductImageValue = {
  asset?: {
    _ref?: string;
  };
};

type ValidationContext = {
  getClient?: (options: { apiVersion: string }) => {
    fetch: <T>(query: string, params?: Record<string, string>) => Promise<T>;
  };
};

type AssetMetadata = {
  _id?: string;
  width?: number;
  height?: number;
  size?: number;
};

export const IMAGE_STANDARD_HELP_TEXT =
  "Original recomendado: vertical 4:5, ideal 2000×2500 px. El tamaño y el peso del original son orientativos: la tienda sirve versiones adaptadas y optimizadas desde el CDN. La proporción no impide publicar.";

async function getAssetMetadata(
  assetRef: string,
  context: ValidationContext,
): Promise<AssetMetadata | null | undefined> {
  // undefined means the lookup could not run; null means a confirmed missing asset.
  if (!context.getClient) return undefined;
  try {
    return await context.getClient({ apiVersion: SANITY_API_VERSION }).fetch<AssetMetadata | null>(
      `*[_id == $id][0]{_id, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "size": coalesce(size, metadata.size)}`,
      { id: assetRef },
    );
  } catch {
    return undefined;
  }
}

function getAssetRef(value: ProductImageValue | undefined): string | null {
  const ref = value?.asset?._ref;
  return typeof ref === "string" && ref.trim() ? ref.trim() : null;
}

export async function validateProductImageAsset(
  value: ProductImageValue | undefined,
  context: ValidationContext,
) {
  const ref = getAssetRef(value);
  if (!ref) return "Añade un archivo de imagen o elimina esta entrada vacía de la galería.";
  const metadata = await getAssetMetadata(ref, context);
  return metadata === null
    ? "El archivo de esta imagen ya no existe. Vuelve a subirlo o elimina esta entrada de la galería."
    : true;
}

function positiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function productImageQualityWarning(metadata: AssetMetadata | null | undefined) {
  if (!metadata) return true;
  const warnings: string[] = [];
  const { width, height, size } = metadata;
  if (positiveNumber(width) && positiveNumber(height)) {
    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      warnings.push(`Para conservar detalle al ampliar, se recomienda un original de al menos ${MIN_WIDTH}×${MIN_HEIGHT} px (ideal 2000×2500 px).`);
    }
    if (Math.abs(width / height - TARGET_RATIO) > RATIO_TOLERANCE) {
      warnings.push("La proporción 4:5 vertical ayuda a mantener una galería uniforme. Revisa el encuadre de la pieza en las tarjetas de la tienda.");
    }
  }
  if (positiveNumber(size) && size > RECOMMENDED_SOURCE_SIZE_BYTES) {
    warnings.push(`El original pesa ${Math.round(size / 1024)} KB; comprimirlo puede agilizar las subidas. Este no es el peso que recibe el visitante: el CDN entrega una versión adaptada y optimizada.`);
  }
  return warnings.length ? `${warnings.join(" ")} Puedes publicar con esta imagen.` : true;
}

export async function validateProductImageQuality(
  value: ProductImageValue | undefined,
  context: ValidationContext,
) {
  const ref = getAssetRef(value);
  if (!ref) return true;
  return productImageQualityWarning(await getAssetMetadata(ref, context));
}
