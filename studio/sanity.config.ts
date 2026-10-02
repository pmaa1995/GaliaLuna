import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";

// The home page reads a single settings document, so the Studio exposes it as one fixed page.
const SINGLETON_TYPES = new Set(["homeSettings"]);

export default defineConfig({
  name: "default",
  title: "Galia Luna Studio",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "nepto6np",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Contenido")
          .items([
            S.documentTypeListItem("product").title("Productos"),
            S.divider(),
            S.listItem()
              .title("Portada")
              .id("homeSettings")
              .child(S.document().schemaType("homeSettings").documentId("homeSettings").title("Portada")),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETON_TYPES.has(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) =>
      SINGLETON_TYPES.has(schemaType)
        ? actions.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action))
        : actions,
  },
});
