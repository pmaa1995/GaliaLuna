import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || "nepto6np",
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  // Existing hosted Studio: https://galialuna-nepto6np.sanity.studio
  studioHost: "galialuna-nepto6np",
  deployment: {
    appId: "kiuf1ncon6noyed0ifkoltqk",
  },
});
