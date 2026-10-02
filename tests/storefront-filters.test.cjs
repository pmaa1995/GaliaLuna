const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const loadedModule = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../lib/storefront.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(code, {
  module: loadedModule, exports: loadedModule.exports, URLSearchParams,
  require(name) { throw new Error("Unexpected storefront dependency: " + name); },
});
const { categoryFromSlug, categoryHref, collectionCategories, defaultFilters,
  filtersQuery, parseStoreFilters, searchParamsToURL, selectProducts, selectHomeProducts } = loadedModule.exports;

function product(id, overrides = {}) {
  return {
    _id: id, _type: "product", name: "Pieza " + id, slug: { current: id },
    category: "Collares", description: "Una pieza artesanal.", price: 100,
    currency: "DOP", inventory: 2, isActive: true, images: [], ...overrides,
  };
}
function filters(query = "") { return parseStoreFilters(new URLSearchParams(query)); }
function ids(products) { return Array.from(products, (entry) => entry._id); }
function plain(value) { return JSON.parse(JSON.stringify(value)); }

test("homepage selection represents categories without duplicate, inactive or repeated hero products", () => {
  const hero = product("hero");
  const products = Object.freeze([hero, product("necklace"), product("another-necklace"),
    product("inactive", { category: "Anillos", isActive: false }),
    product("ring", { category: "Anillos" }), product("ring", { category: "Anillos" }),
    product("earrings", { category: "Aretes" }), product("chain", { category: "Cadenas" })]);
  assert.deepEqual(ids(selectHomeProducts(products, "hero")), ["ring", "earrings", "chain", "necklace"]);
  assert.deepEqual(ids(selectHomeProducts(products.slice(0, 3), "hero")), ["necklace", "another-necklace"]);
  assert.deepEqual(ids(selectHomeProducts([hero], "hero")), ["hero"]);
  assert.deepEqual(ids(selectHomeProducts([product("inactive", { isActive: false })])), []);
  assert.deepEqual(ids(selectHomeProducts([])), []);
});

test("catalog search ignores case and accents and requires every word across product fields", () => {
  const products = [
    product("match", { name: "Órbita", description: "Acabado BAÑADO a mano" }),
    product("partial", { name: "Órbita", description: "Acabado pulido" }),
    product("inactive", { name: "Órbita", description: "Acabado bañado", isActive: false }),
  ];
  assert.deepEqual(ids(selectProducts(products, { ...defaultFilters, q: "  ORBITA\t collares  banado  " })), ["match"]);
  assert.deepEqual(ids(selectProducts(products, { ...defaultFilters, q: "o\u0301rbita BAÑADO" })), ["match"]);
  assert.deepEqual(ids(selectProducts(products, { ...defaultFilters, q: "órbita inexistente" })), []);
  assert.deepEqual(ids(selectProducts(products, defaultFilters)), ["match", "partial"]);
});

test("filter parser validates numeric limits and caps safe positive page numbers", () => {
  for (const raw of ["", " ", "no", "NaN", "Infinity", "-1", "1000000001"]) {
    assert.equal(filters("hasta=" + encodeURIComponent(raw)).maxPrice, "", raw);
  }
  assert.equal(filters("hasta=0").maxPrice, "0");
  assert.equal(filters("hasta=0012.30").maxPrice, "12.3");
  assert.equal(filters("hasta=1000000000").maxPrice, "1000000000");
  for (const raw of ["", " ", "no", "NaN", "Infinity", "-1", "0", "1.5", "9007199254740992"]) {
    assert.equal(filters("pagina=" + encodeURIComponent(raw)).page, 1, raw);
  }
  assert.equal(filters("pagina=2").page, 2);
  assert.equal(filters("pagina=1001").page, 1000);
  assert.equal(filters("pagina=9007199254740991").page, 1000);
  assert.equal(filters("orden=unknown&stock=true").sort, "selection");
  assert.equal(filters("stock=true").inStock, false);
  assert.equal(filters("stock=1").inStock, true);
  assert.equal(filters("q=" + encodeURIComponent("  " + "a".repeat(140) + "  ")).q.length, 120);
});

test("repeated URL filters select the same first value on server and client", () => {
  const query = new URLSearchParams("q=oro&q=plata&orden=price-asc&orden=price-desc&hasta=125.50&hasta=500&stock=1&stock=0&pagina=2&pagina=4");
  const serverParams = Object.fromEntries(Array.from(new Set(query.keys()), (key) => [key, query.getAll(key)]));
  for (const value of Object.values(serverParams)) Object.freeze(value);
  Object.freeze(serverParams);
  const client = parseStoreFilters(query);
  assert.equal(client.q, "oro");
  assert.equal(client.sort, "price-asc");
  assert.equal(client.maxPrice, "125.5");
  assert.equal(client.inStock, true);
  assert.equal(client.page, 2);
  assert.deepEqual(plain(parseStoreFilters(searchParamsToURL(serverParams))), plain(client));
  assert.deepEqual(plain(parseStoreFilters(searchParamsToURL({ q: [], orden: undefined }))), plain(defaultFilters));
});

test("price filtering includes exact cent boundaries and preserves equal-price catalog order", () => {
  const products = [product("later-name", { price: 12.35 }), product("cheap", { price: 12.34 }),
    product("first-name", { price: 12.35 }), product("high", { price: 12.36 }), product("free", { price: 0 })];
  assert.deepEqual(ids(selectProducts(products, filters("hasta=12.35"))), ["later-name", "cheap", "first-name", "free"]);
  assert.deepEqual(ids(selectProducts(products, filters("hasta=0"))), ["free"]);
  assert.deepEqual(ids(selectProducts(products, filters("orden=price-asc"))), ["free", "cheap", "later-name", "first-name", "high"]);
  assert.deepEqual(ids(selectProducts(products, filters("orden=price-desc"))), ["high", "later-name", "first-name", "cheap", "free"]);
});

test("confirmed-stock filter excludes unknown, empty and invalid stock without hiding inquiries by default", () => {
  const products = [product("known", { inventory: 1 }), product("unknown", { inventory: null }),
    product("missing", { inventory: undefined }), product("empty", { inventory: 0 }),
    product("negative", { inventory: -1 }), product("fractional", { inventory: 0.5 }),
    product("nonfinite", { inventory: Infinity }), product("inactive", { inventory: 10, isActive: false })];
  assert.deepEqual(ids(selectProducts(products, filters("stock=1"))), ["known"]);
  const allIds = ids(selectProducts(products, defaultFilters));
  assert.equal(allIds.includes("unknown"), true);
  assert.equal(allIds.includes("missing"), true);
  assert.equal(allIds.includes("empty"), true);
  assert.equal(allIds.includes("inactive"), false);
});

test("filters compose and sorting never mutates catalog objects or their input order", () => {
  const products = Object.freeze([
    Object.freeze(product("too-expensive", { price: 30, name: "Luna" })),
    Object.freeze(product("unknown", { price: 10, name: "Luna", inventory: null })),
    Object.freeze(product("wrong-search", { price: 10, name: "Sol" })),
    Object.freeze(product("match", { price: 12.35, name: "Luna" })),
    Object.freeze(product("inactive", { price: 10, name: "Luna", isActive: false })),
  ]);
  const before = JSON.stringify(products);
  const selected = selectProducts(products, filters("q=luna&hasta=12.35&stock=1&orden=price-desc"));
  assert.deepEqual(ids(selected), ["match"]);
  assert.equal(selected[0], products[3]);
  assert.equal(JSON.stringify(products), before);
  assert.notEqual(selectProducts(products, defaultFilters), products);
});

test("filter serialization canonically round-trips escaped text and drops defaults and unknown parameters", () => {
  assert.equal(filtersQuery(filters("")), "");
  assert.equal(filtersQuery(filters("orden=selection&stock=0&pagina=1&extra=ignored")), "");
  const initial = new URLSearchParams({ q: "  Órbita & luna + 100%  ", orden: "price-desc", hasta: "0012.30", stock: "1", pagina: "1001", extra: "ignored" });
  const parsed = parseStoreFilters(initial);
  const canonical = filtersQuery(parsed);
  assert.equal(canonical, "?q=%C3%93rbita+%26+luna+%2B+100%25&orden=price-desc&hasta=12.3&stock=1&pagina=1000");
  assert.deepEqual(plain(filters(canonical)), plain(parsed));
  assert.equal(filtersQuery(filters(canonical)), canonical);
  assert.equal(initial.get("q"), "  Órbita & luna + 100%  ");
});

test("category links and route lookup round-trip every supported collection", () => {
  for (const category of collectionCategories) {
    assert.equal(categoryHref(category.label), "/coleccion/" + category.slug);
    assert.equal(categoryFromSlug(category.slug), category);
  }
  for (const slug of ["", "../anillos", "unknown", "Anillos"]) assert.equal(categoryFromSlug(slug), undefined);
});
