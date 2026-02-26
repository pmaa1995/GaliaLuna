import { createClient } from "next-sanity";

import {
  SANITY_API_VERSION,
  SANITY_DATASET,
  SANITY_PROJECT_ID,
  SANITY_WRITE_TOKEN,
} from "../env";

export const sanityWriteClient = SANITY_WRITE_TOKEN
  ? createClient({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET,
      apiVersion: SANITY_API_VERSION,
      useCdn: false,
      token: SANITY_WRITE_TOKEN,
      perspective: "published",
    })
  : null;

