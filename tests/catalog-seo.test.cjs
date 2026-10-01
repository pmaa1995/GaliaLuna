const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} };
  vm.runInNewContext(code, { module: loadedModule, exports: loadedModule.exports, URL, console: { warn() {} }, require: (name) => {
    if (name in dependencies) return dependencies[name];
    throw new Error("Unexpected dependency " + name);
  } });
  return loadedModule.exports;
}

function catalog(fetch) {
  const calls = [];
  const client = { fetch: (...args) => { calls.push(args); return fetch(...args); }, withConfig: (config) => { calls.push(config); return client; } };
  return { calls, ...load("lib/catalogData.ts", {
    react: { cache: (fn) => fn },
    "./catalog": {
      catalogProducts: [{ _id: "demo", isActive: true }], homeSettings: {},
      filterActiveProducts: (products) => products.filter((p) => p.isActive),
      getResolvedHomeShowcase: (products) => ({ heroProducts: products, featuredProduct: products[0] }),
      getRelatedProductsFromList: () => [],
    },
    "../sanity/env": { isSanityEnvironmentConfigured: true },
    "../sanity/lib/client": { sanityClient: client },
    "../sanity/lib/queries": { allProductsQuery: "products", activeProductSlugsQuery: "slugs", homeSettingsQuery: "home" },
    "../sanity/lib/mappers": { mapSanityProduct: (p) => p },
    "./cacheTags": { SANITY_CACHE_TAGS: { products: "products", productSlugs: "slugs", homeSettings: "home" } },
  }) };
}

test("an empty published catalog stays empty instead of selling demo products", async () => {
  const api = catalog(async (query) => query === "home" ? null : []);
  const result = await api.getCatalogSource();
  assert.equal(result.source, "sanity");
  assert.equal(result.activeProducts.length, 0);
  assert.equal((await api.getActiveProductSlugs()).length, 0);
});

test("catalog outage and invalid data fail safely without demo fallback", async () => {
  await assert.rejects(catalog(async () => { throw new Error("offline"); }).getCatalogSource(), /offline/);
  await assert.rejects(catalog(async () => null).getCatalogSource(), /Invalid catalog/);
});

test("home curation outage preserves the valid published catalog", async () => {
  const product = { _id: "real", isActive: true };
  const result = await catalog(async (query) => {
    if (query === "home") throw new Error("home unavailable");
    return [product];
  }).getCatalogSource();
  assert.equal(result.activeProducts[0]._id, "real");
  assert.equal(result.homeShowcase.heroProducts[0]._id, "real");
});

test("checkout reads fresh authoritative catalog without CDN or Next cache", async () => {
  const api = catalog(async () => [{ _id: "real" }]);
  assert.equal((await api.getCheckoutProducts())[0]._id, "real");
  assert.equal(api.calls[0].useCdn, false);
  assert.equal(api.calls[1][2].cache, "no-store");
  await assert.rejects(catalog(async () => null).getCheckoutProducts(), /Invalid catalog/);
});

test("CMS content cannot break out of JSON-LD scripts", () => {
  const { serializeJsonLd } = load("lib/seo.ts");
  const payload = { name: '</script><script>alert("test")</script>' };
  const result = serializeJsonLd(payload);
  assert.equal(result.includes("<"), false);
  assert.deepEqual(JSON.parse(result), payload);
});

test("structured data respects known stock and escapes product URL segments", () => {
  const { productSchema } = load("lib/seo.ts");
  const product = { _id:"p", slug:{current:"a/b"}, name:"Anillo", price:200, currency:"DOP", images:[], inventory:0 };
  const schema = productSchema(product);
  assert.equal(schema.offers.availability, "https://schema.org/OutOfStock");
  assert.equal(schema.url, "https://www.galialuna.com/product/a%2Fb");
  assert.equal(productSchema({...product, inventory:null}).offers.availability, undefined);
});

test("invalid CMS prices and foreign currencies never become free DOP products", () => {
  const types = load("types/product.ts");
  const { mapSanityProduct } = load("sanity/lib/mappers.ts", { "../../types/product": types });
  const product = { _id:"p", name:"Anillo", slug:{ current:"anillo" }, price:450, currency:"DOP", images:[] };
  for (const price of [null, undefined, "450", NaN, Infinity, -1]) {
    assert.equal(mapSanityProduct({...product, price}), null);
  }
  assert.equal(mapSanityProduct({...product, currency:"USD"}), null);
  assert.equal(mapSanityProduct({...product, currency:undefined}).currency, "DOP");
  assert.equal(types.formatDOP(450.25), "RD$450.25");
  assert.equal(types.formatDOP(450), "RD$450");
});
