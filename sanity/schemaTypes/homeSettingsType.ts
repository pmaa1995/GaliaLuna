import { defineArrayMember, defineField, defineType } from "sanity";

export const homeSettingsType = defineType({
  name: "homeSettings",
  title: "Home Settings",
  type: "document",
  fields: [
    defineField({
      name: "heroProducts",
      title: "Productos del collage principal",
      description:
        "Selecciona hasta 3 productos. El orden define izquierda, centro y derecha en el home.",
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
      title: "Producto destacado (panel derecho)",
      type: "reference",
      to: [{ type: "product" }],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Configuración del Home",
        subtitle: "Collage principal y producto destacado",
      };
    },
  },
});

