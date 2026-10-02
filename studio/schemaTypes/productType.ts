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
