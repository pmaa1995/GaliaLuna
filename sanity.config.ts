import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import {
  SANITY_DATASET,
  SANITY_PROJECT_ID,
  SANITY_STUDIO_BASE_PATH,
} from "./sanity/env";
import { schemaTypes } from "./sanity/schemaTypes";

export default defineConfig({
  name: "default",
  title: "Galia Luna Studio",
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  basePath: SANITY_STUDIO_BASE_PATH,
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});

