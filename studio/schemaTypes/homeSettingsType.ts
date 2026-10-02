import { defineArrayMember, defineField, defineType } from "sanity";

export const homeSettingsType = defineType({
  name: "homeSettings",
  title: "Portada",
  type: "document",
  fields: [
    defineField({
      name: "heroProducts",
      title: "Productos de respaldo para la portada",
      // Legacy fallback list; the web only needs the featured piece below.
      hidden: true,
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
      title: "Pieza de portada",
      description: "La pieza que aparece grande al inicio de la web. Si la dejas vacía, se usa la primera de la colección.",
      type: "reference",
      to: [{ type: "product" }],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Portada",
        subtitle: "Pieza destacada del inicio",
      };
    },
  },
});

