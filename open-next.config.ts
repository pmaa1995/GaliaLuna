import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

// Minimal Cloudflare setup to keep deploy simple and low-maintenance.
// R2 incremental cache can be added later if you need stronger ISR persistence.
export default defineCloudflareConfig({});
