export const SANITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "nepto6np";
export const SANITY_DATASET =
  process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const SANITY_API_VERSION =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-02-25";
export const SANITY_STUDIO_BASE_PATH = "/studio";

export const SANITY_READ_TOKEN = process.env.SANITY_READ_TOKEN;

export const isSanityEnvironmentConfigured = Boolean(
  SANITY_PROJECT_ID && SANITY_DATASET,
);

