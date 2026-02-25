import { createClient } from "next-sanity";

import {
  SANITY_API_VERSION,
  SANITY_DATASET,
  SANITY_PROJECT_ID,
  SANITY_READ_TOKEN,
} from "../env";

export const sanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: !SANITY_READ_TOKEN,
  token: SANITY_READ_TOKEN,
  perspective: "published",
});

