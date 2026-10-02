import { defineArrayMember, defineField, defineType } from "sanity";

import { PRODUCT_CATEGORIES } from "../../types/product";
import {
  IMAGE_STANDARD_HELP_TEXT,
  validateProductImageAsset,
  validateProductImageQuality,
} from "../../sanity/lib/productImageValidation";

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
      title: "Dirección web",
      description: "Se crea desde el nombre. Evita cambiarla después de publicar: cambiaría el enlace de la pieza.",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Categoría",
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
      title: "Descripción",
      description: "Material, piedra y detalles que ayuden a elegir. Aparece en la ficha de la pieza.",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required().min(10),
    }),
    defineField({
      name: "price",
      title: "Precio (RD$)",
      type: "number",
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: "currency",
      title: "Moneda",
      type: "string",
      // Only DOP is sold; kept in the data for checkout validation, not shown to editors.
      hidden: true,
      initialValue: "DOP",
      options: { list: [{ title: "Peso dominicano (DOP)", value: "DOP" }] },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "images",
      title: "Imágenes",
      description: IMAGE_STANDARD_HELP_TEXT,
      type: "array",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          validation: (rule) => [
            rule.custom(validateProductImageAsset).error(),
            rule.custom(validateProductImageQuality).warning(),
          ],
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
      description: "Desactívalo para ocultar la pieza sin borrarla.",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "badge",
      title: "Etiqueta (opcional)",
      description: "Úsala solo en piezas especiales: si todas la llevan, deja de destacar. Ej.: Nuevo, Edición limitada, Por pedido.",
      type: "string",
    }),
    defineField({
      name: "inventory",
      title: "Inventario disponible",
      description: "Piezas en existencia. En 0 la pieza aparece como agotada; vacío significa disponibilidad por confirmar.",
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
