import { defineArrayMember, defineField, defineType } from "sanity";

export const homeSettingsType = defineType({
  name: "homeSettings",
  title: "Portada de la tienda",
  type: "document",
  fields: [
    defineField({
      name: "heroProducts",
      title: "Productos de respaldo para la portada",
      description:
        "Selecciona hasta 3 productos. Se usa el primero disponible si no hay una pieza principal seleccionada.",
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "product" }],
        }),
      ],
      validation: (rule) => rule.max(3),
    }),
    defineField({
      name: "featuredProduct",
      title: "Pieza principal de la portada",
      type: "reference",
      to: [{ type: "product" }],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Configuración de la portada",
        subtitle: "Pieza principal y productos de respaldo",
      };
    },
  },
});

