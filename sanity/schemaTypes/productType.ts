import { defineArrayMember, defineField, defineType } from "sanity";

import { PRODUCT_CATEGORIES } from "../../types/product";

const SANITY_API_VERSION = "2025-02-25";
const TARGET_RATIO = 4 / 5;
const RATIO_TOLERANCE = 0.03;
const MIN_WIDTH = 1200;
const MIN_HEIGHT = 1500;
const IDEAL_WIDTH = 2000;
const IDEAL_HEIGHT = 2500;
const MAX_IMAGE_SIZE_BYTES = 700 * 1024;
const MAX_IMAGE_SIZE_KB = Math.round(MAX_IMAGE_SIZE_BYTES / 1024);

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
  width?: number;
  height?: number;
  size?: number;
};

const IMAGE_STANDARD_HELP_TEXT =
  "Estandar recomendado: 4:5 vertical (ideal 2000x2500), JPG/WebP, 150-450 KB (max 700 KB).";

function normalizeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function imageRatioIsValid(width: number, height: number): boolean {
  const ratio = width / height;
  return Math.abs(ratio - TARGET_RATIO) <= RATIO_TOLERANCE;
}

async function getAssetMetadata(
  value: ProductImageValue | undefined,
  context: ValidationContext,
): Promise<AssetMetadata | null> {
  const assetRef = value?.asset?._ref;
  if (!assetRef || !context.getClient) return null;

  const client = context.getClient({ apiVersion: SANITY_API_VERSION });
  const query = `
    *[_id == $id][0]{
      "width": metadata.dimensions.width,
      "height": metadata.dimensions.height,
      "size": coalesce(size, metadata.size)
    }
  `;

  try {
    return await client.fetch<AssetMetadata | null>(query, { id: assetRef });
  } catch {
    return null;
  }
}

async function validateProductImage(
  value: ProductImageValue | undefined,
  context: ValidationContext,
) {
  if (!value?.asset?._ref) return true;

  const metadata = await getAssetMetadata(value, context);
  if (!metadata) return true;

  const width = normalizeNumber(metadata.width);
  const height = normalizeNumber(metadata.height);
  const size = normalizeNumber(metadata.size);

  if (width && height) {
    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      return `Imagen muy pequena. Minimo: ${MIN_WIDTH}x${MIN_HEIGHT}. Ideal: ${IDEAL_WIDTH}x${IDEAL_HEIGHT}.`;
    }

    if (!imageRatioIsValid(width, height)) {
      return "La imagen debe usar proporcion 4:5 vertical (ejemplo 2000x2500).";
    }
  }

  if (size && size > MAX_IMAGE_SIZE_BYTES) {
    const currentKB = Math.round(size / 1024);
    return `La imagen pesa ${currentKB} KB. Maximo permitido: ${MAX_IMAGE_SIZE_KB} KB.`;
  }

  return true;
}

export const productType = defineType({
  name: "product",
  title: "Producto",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nombre",
      type: "string",
      validation: (rule) => rule.required().min(2),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Categoria",
      type: "string",
      options: {
        list: PRODUCT_CATEGORIES.map((category) => ({
          title: category,
          value: category,
        })),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Descripcion",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required().min(10),
    }),
    defineField({
      name: "price",
      title: "Precio",
      type: "number",
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: "currency",
      title: "Moneda",
      type: "string",
      initialValue: "DOP",
      options: { list: [{ title: "Peso dominicano (DOP)", value: "DOP" }] },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "images",
      title: "Imagenes",
      description: IMAGE_STANDARD_HELP_TEXT,
      type: "array",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          validation: (rule) => rule.custom(validateProductImage),
          fields: [
            defineField({
              name: "alt",
              title: "Texto alternativo (alt)",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
        }),
      ],
      validation: (rule) => rule.min(1).required(),
    }),
    defineField({
      name: "isActive",
      title: "Mostrar en tienda",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "badge",
      title: "Etiqueta",
      description: "Ej.: Nuevo, Best Seller, Edicion limitada",
      type: "string",
    }),
    defineField({
      name: "inventory",
      title: "Inventario disponible",
      type: "number",
      validation: (rule) => rule.min(0).integer(),
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "category",
      media: "images.0",
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      return {
        title,
        subtitle: subtitle ? `${subtitle}` : "Producto",
        media,
      };
    },
  },
});
