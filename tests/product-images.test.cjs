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
  const loaded = { exports: {} };
  vm.runInNewContext(code, {
    module: loaded, exports: loaded.exports, URL,
    require(name) {
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  return loaded.exports;
}

const validation = load("sanity/lib/productImageValidation.ts");
const types = load("types/product.ts");
const { mapSanityProduct } = load("sanity/lib/mappers.ts", { "../../types/product": types });
const image = { asset: { _ref: "image-real-1086x1448-jpg" } };
const contextWith = (metadata) => ({ getClient: () => ({ fetch: async () => metadata }) });
const product = { _id: "p", name: "Collar", slug: { current: "collar" }, category: "Collares", price: 450, currency: "DOP" };

test("empty image slots and confirmed deleted assets block publication", async () => {
  for (const value of [undefined, null, {}, { asset: {} }, { asset: { _ref: "  " } }]) {
    assert.match(await validation.validateProductImageAsset(value, {}), /Añade un archivo/);
  }
  assert.match(await validation.validateProductImageAsset(image, contextWith(null)), /ya no existe/);
});

test("existing low-resolution originals remain publishable with quality guidance", async () => {
  const metadata = { _id: image.asset._ref, width: 1086, height: 1448, size: 200 * 1024 };
  assert.equal(await validation.validateProductImageAsset(image, contextWith(metadata)), true);
  const warning = await validation.validateProductImageQuality(image, contextWith(metadata));
  assert.match(warning, /1200×1500/);
  assert.match(warning, /4:5/);
  assert.match(warning, /Puedes publicar/);
});

test("source size guidance distinguishes the uploaded original from delivered CDN images", () => {
  const warning = validation.productImageQualityWarning({ width: 2000, height: 2500, size: 5 * 1024 * 1024 });
  assert.match(warning, /original pesa 5120 KB/);
  assert.match(warning, /no es el peso que recibe el visitante/);
  assert.match(warning, /CDN/);
  assert.equal(validation.productImageQualityWarning({ width: 2000, height: 2500, size: 700 * 1024 }), true);
});

test("unavailable or incomplete metadata does not misreport valid references as missing files", async () => {
  const offline = { getClient: () => ({ fetch: async () => { throw new Error("offline"); } }) };
  assert.equal(await validation.validateProductImageAsset(image, offline), true);
  assert.equal(await validation.validateProductImageQuality(image, offline), true);
  assert.equal(await validation.validateProductImageAsset(image, {}), true);
  assert.equal(validation.productImageQualityWarning({ width: NaN, height: Infinity, size: -1 }), true);
  assert.equal(await validation.validateProductImageQuality({}, {}), true);
});

test("Studio registers asset problems as errors, quality as warnings, and still requires alt text", () => {
  const identity = (value) => value;
  const { productType } = load("studio/schemaTypes/productType.ts", {
    sanity: { defineType: identity, defineField: identity, defineArrayMember: identity },
    "../../types/product": types,
    "../../sanity/lib/productImageValidation": validation,
  });
  const imageField = productType.fields.find((field) => field.name === "images");
  const rules = imageField.of[0].validation({
    custom(validator) {
      return {
        validator,
        error() { this.severity = "error"; return this; },
        warning() { this.severity = "warning"; return this; },
      };
    },
  });
  assert.equal(rules[0].validator, validation.validateProductImageAsset);
  assert.equal(rules[0].severity, "error");
  assert.equal(rules[1].validator, validation.validateProductImageQuality);
  assert.equal(rules[1].severity, "warning");
  const required = Symbol("required");
  const altField = imageField.of[0].fields.find((field) => field.name === "alt");
  assert.equal(altField.validation({ required: () => required }), required);
});

test("gallery mapping skips asset-less entries and keeps real photos in their original order", () => {
  const first = "https://cdn.sanity.io/images/project/production/first-1086x1448.jpg";
  const second = "https://cdn.sanity.io/images/project/production/second-1200x1500.jpg";
  const mapped = mapSanityProduct({ ...product, images: [
    null, {}, { url: null }, { url: "   " },
    { url: ` ${first} `, width: 1086, height: 1448, alt: "Detalle del collar" },
    { url: "" }, { url: second, width: 1200, height: 1500 },
  ] });
  assert.equal(mapped.images.length, 2);
  assert.equal(new URL(mapped.images[0].url).pathname, new URL(first).pathname);
  assert.equal(mapped.images[0].alt, "Detalle del collar");
  assert.equal(mapped.images[0].width, 1086);
  assert.equal(mapped.images[0].height, 1448);
  assert.equal(new URL(mapped.images[1].url).pathname, new URL(second).pathname);
  assert.equal(mapped.images[1].alt, "Collar de Galia Luna");
  assert.equal(new URL(mapped.images[0].url).searchParams.get("auto"), "format");
});

test("an entirely asset-less gallery retains one complete placeholder", () => {
  for (const images of [undefined, null, [], [null, {}, { url: null }, { url: "  " }]]) {
    const mapped = mapSanityProduct({ ...product, images });
    assert.equal(mapped.images.length, 1);
    assert.equal(mapped.images[0], types.FALLBACK_PRODUCT_IMAGE);
  }
});
