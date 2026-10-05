const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const ts = require("typescript");

function load(file, imports = {}, globals = {}) {
  const loadedModule = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, {
    module: loadedModule, exports: loadedModule.exports,
    require(name) {
      if (Object.hasOwn(imports, name)) return imports[name];
      throw new Error("Unexpected import: " + name);
    },
    crypto: webcrypto, TextEncoder, TextDecoder, URL, URLSearchParams, AbortSignal,
    console: { error() {}, warn() {} }, setTimeout, clearTimeout, ...globals,
  }, { filename: file });
  return loadedModule.exports;
}
const validation = load("lib/orders/validation.ts");
const customer = {
  fullName: "Cliente de prueba", email: "prueba@example.test", phone: "8090000000",
  province: "Provincia de prueba", city: "Ciudad de prueba", sector: "",
  addressLine1: "Direccion ficticia 1", addressLine2: "", reference: "", deliveryNotes: "",
};
const item = { id: "p1", name: "Nombre manipulado", category: "Aretes", price: 1250, quantity: 2, currency: "DOP" };
const product = { _id: "p1", name: "Pieza del catalogo", category: "Anillos", price: 1250, currency: "DOP", inventory: 4, isActive: true, images: [{ url: "/images/product-placeholder.svg" }] };
function payload(overrides = {}) { return { source: "cart", customer: { ...customer }, items: [{ ...item }], ...overrides }; }

test("checkout rejects coerced, non-finite, fractional and excessive quantities", () => {
  for (const quantity of [null, true, false, "2", 0, -1, 1.5, NaN, Infinity, 100, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => validation.parseCheckoutPayload(payload({ items: [{ ...item, quantity }] })), /carrito/);
  }
  assert.equal(validation.parseCheckoutPayload(payload({ items: [{ ...item, quantity: 99 }] })).items[0].quantity, 99);
});

test("checkout validates money, duplicate IDs and bounded orders", () => {
  for (const price of [null, true, "1", NaN, Infinity, -1, 1.001, 1_000_001]) {
    assert.throws(() => validation.parseCheckoutPayload(payload({ items: [{ ...item, price }] })), /carrito/);
  }
  assert.equal(validation.parseCheckoutPayload(payload({ items: [{ ...item, price: 12.35 }] })).items[0].price, 12.35);
  assert.throws(() => validation.parseCheckoutPayload(payload({ items: [item, item] })), /carrito/);
  assert.throws(() => validation.parseCheckoutPayload(payload({ items: Array.from({ length: 51 }, (_, i) => ({ ...item, id: "p" + i })) })), /demasiados/);
  assert.throws(() => validation.parseCheckoutPayload(payload({ items: Array.from({ length: 3 }, (_, i) => ({ ...item, id: "p" + i, quantity: 99 })) })), /limite/);
  assert.throws(() => validation.parseCheckoutPayload(payload({ items: [{ ...item, price: 1_000_000, quantity: 11 }] })), /limite/);
  for (const id of ["", "drafts.p1", "versions.x.p1", "p1\n", "x".repeat(121)]) {
    assert.throws(() => validation.parseCheckoutPayload(payload({ items: [{ ...item, id }] })), /carrito/);
  }
});

test("checkout enforces customer length, required and contact fields", () => {
  for (const change of [{ fullName: "" }, { city: [] }, { phone: "abc" }, { email: "bad@" }, { fullName: "x".repeat(141) }]) {
    assert.throws(() => validation.parseCheckoutPayload(payload({ customer: { ...customer, ...change } })));
  }
});

test("checkout rejects junk contact data and honeypot submissions", () => {
  for (const phone of ["809809809", "1234567", "5555555555", "+12", "809-555-12345"]) {
    assert.throws(() => validation.parseCheckoutPayload(payload({ customer: { ...customer, phone } })), /tel/i, phone);
  }
  for (const phone of ["809-555-1234", "(829) 555 1234", "1 849 555 1234", "+1 809 555 1234", "+34 612 345 678", "+1 305 555 1234"]) {
    assert.equal(validation.parseCheckoutPayload(payload({ customer: { ...customer, phone } })).customer.phone, phone);
  }
  for (const change of [{ fullName: "Dd" }, { city: "x" }, { addressLine1: "C/1" }]) {
    assert.throws(() => validation.parseCheckoutPayload(payload({ customer: { ...customer, ...change } })), /nombre|direcci/i);
  }
  assert.throws(() => validation.parseCheckoutPayload(payload({ website: "https://spam.test" })), /No se pudo/);
  assert.equal(validation.parseCheckoutPayload(payload({ website: "" })).customer.fullName, customer.fullName);
});

test("order receipts accept only order codes and round-trip on the device", () => {
  const store = new Map();
  const receipt = load("lib/orders/receipt.ts", {}, { window: { localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) } } });
  assert.equal(receipt.isOrderCode("GL-20260918-365"), true);
  for (const value of ["", "GL-", "<script>", "GL-12 34", "XX-20260918-365", null]) assert.equal(receipt.isOrderCode(value), false);
  const data = { orderCode: "GL-20260918-365", createdAt: "2026-09-18T12:23:00.000Z", items: [{ name: "Anillo", quantity: 1, price: 3200 }], total: 3200, whatsappUrl: "https://api.whatsapp.com/send?phone=1", whatsappOpened: true, signedIn: false };
  receipt.saveOrderReceipt(data);
  assert.equal(receipt.readOrderReceipt("GL-20260918-365").total, 3200);
  assert.equal(receipt.readOrderReceipt("GL-OTRO-1"), null);
});

test("province matching maps earlier free text to the canonical list", () => {
  const { matchProvince, DR_PROVINCES } = load("lib/orders/provinces.ts");
  assert.equal(DR_PROVINCES.length, 32);
  assert.equal(matchProvince(" distrito nacional "), "Distrito Nacional");
  assert.equal(matchProvince("SAMANA"), "Samaná");
  assert.equal(matchProvince("Santo doming"), "");
});

test("current catalog owns product data, price, activity and known stock", () => {
  const parsed = validation.parseCheckoutPayload(payload());
  const verified = validation.validateCheckoutCatalog(parsed, [product]);
  assert.equal(verified.items[0].name, product.name);
  assert.equal(verified.items[0].category, product.category);
  assert.equal(verified.items[0].imageUrl, product.images[0].url);
  for (const products of [[], [{ ...product, isActive: false }], [{ ...product, price: 1300 }],
    [{ ...product, inventory: 0 }], [{ ...product, inventory: 1 }], [{ ...product, inventory: NaN }]]) {
    assert.throws(() => validation.validateCheckoutCatalog(parsed, products), (error) => error.status === 409);
  }
  assert.equal(validation.validateCheckoutCatalog(parsed, [{ ...product, inventory: null }]).items.length, 1,
    "unknown stock remains a pending inquiry");
});

function loadRoute({ catalog = [product], persisted = true, catalogError = false, allowed = true, save } = {}) {
  return load("app/api/orders/whatsapp/route.ts", {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@clerk/nextjs/server": { auth: async () => ({ userId: null }) },
    "../../../../lib/catalogData": { getCheckoutProducts: async () => { if (catalogError) throw new Error("offline"); return catalog; } },
    "../../../../lib/orders/repository": { createWhatsAppOrderRecord: save || (async () => ({ persisted, orderCode: persisted ? "GL-TEST" : null })) },
    "../../../../lib/orders/validation": validation,
    "../../../../lib/server/rateLimit": { consumeOrderRateLimit: async () => ({ allowed, remaining: null, retryAfterSeconds: 60 }) },
  });
}
function request(body) {
  return new Request("https://example.test/api/orders/whatsapp", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });
}
test("API persists canonical data and fails closed for unpersisted/catalog failure", async () => {
  let saved;
  const route = loadRoute({ save: async (data) => { saved = data; return { persisted: true, orderCode: "GL-TEST" }; } });
  assert.equal((await route.POST(request(payload()))).status, 200);
  assert.equal(saved.items[0].name, product.name);
  for (const options of [{ persisted: false }, { catalogError: true }]) {
    const response = await loadRoute(options).POST(request(payload()));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ok, false);
  }
});
test("API rejects invalid JSON, too-large body, invalid payload, stale price and rate limit", async () => {
  assert.equal((await loadRoute().POST(request("{"))).status, 400);
  assert.equal((await loadRoute().POST(request(" ".repeat(validation.MAX_CHECKOUT_BODY_BYTES + 1)))).status, 413);
  const declaredLarge = request(payload());
  declaredLarge.headers.set("content-length", String(validation.MAX_CHECKOUT_BODY_BYTES + 1));
  assert.equal((await loadRoute().POST(declaredLarge)).status, 413);
  assert.equal((await loadRoute().POST(request(payload({ items: [{ ...item, quantity: true }] })))).status, 400);
  assert.equal((await loadRoute({ catalog: [{ ...product, price: 1300 }] }).POST(request(payload()))).status, 409);
  const throttled = await loadRoute({ allowed: false }).POST(request(payload()));
  assert.equal(throttled.status, 429);
  assert.equal(throttled.headers.get("retry-after"), "60");
});

function sqliteD1() {
  const db = new DatabaseSync(":memory:");
  db.exec(fs.readFileSync(path.join(__dirname, "../migrations/0001_create_orders.sql"), "utf8"));
  let batches = 0;
  return {
    db, get batches() { return batches; },
    prepare(sql) { return { bind(...values) { return { sql, values }; } }; },
    async batch(statements) {
      batches++;
      db.exec("BEGIN");
      try {
        const result = statements.map(({ sql, values }) => { db.prepare(sql).run(...values); return { success: true }; });
        db.exec("COMMIT");
        return result;
      } catch (error) { db.exec("ROLLBACK"); throw error; }
    },
  };
}
function repository(db) {
  return load("lib/orders/repository.ts", {
    "@opennextjs/cloudflare": { getCloudflareContext: async () => ({ env: { GALIA_LUNA_DB: db } }) },
  });
}
test("order and all line items use one transaction with the correct parent ID", async () => {
  const db = sqliteD1();
  const result = await repository(db).createWhatsAppOrderRecord({ ...payload({ items: [item, { ...item, id: "p2" }] }), clerkUserId: null });
  assert.equal(result.persisted, true);
  assert.match(result.orderCode, /^GL-\d{8}-[A-F0-9]{32}$/);
  assert.equal(db.batches, 1);
  assert.equal(db.db.prepare("SELECT count(*) n FROM orders").get().n, 1);
  assert.equal(db.db.prepare("SELECT count(*) n FROM order_items WHERE order_id=(SELECT id FROM orders)").get().n, 2);
  db.db.close();
});
test("a failed line insert rolls back the whole order", async () => {
  const db = sqliteD1();
  db.db.exec("CREATE TRIGGER fail_test_line BEFORE INSERT ON order_items WHEN NEW.product_id = 'p2' BEGIN SELECT RAISE(ABORT, 'synthetic failure'); END;");
  await assert.rejects(repository(db).createWhatsAppOrderRecord({ ...payload({ items: [item, { ...item, id: "p2" }] }), clerkUserId: null }), /synthetic failure/);
  assert.equal(db.db.prepare("SELECT count(*) n FROM orders").get().n, 0);
  assert.equal(db.db.prepare("SELECT count(*) n FROM order_items").get().n, 0);
  db.db.close();
});

function cartModule() {
  let options;
  const products = load("types/product.ts");
  const store = load("store/cartStore.ts", {
    "../lib/orders/validation": validation,
    "../types/product": products,
    "zustand": { create: () => (creator) => {
      let state;
      const set = (update) => { state = { ...state, ...(typeof update === "function" ? update(state) : update) }; };
      state = creator(set, () => state);
      return { getState: () => state };
    } },
    "zustand/middleware": { createJSONStorage: () => undefined, persist: (creator, settings) => { options = settings; return creator; } },
  });
  return { ...store, get options() { return options; } };
}
test("cart sanitizes corrupt persistence, duplicates, unsafe images and known stock", () => {
  const cart = cartModule();
  assert.equal(cart.sanitizeCartItems(null).length, 0);
  const valid = { ...item, imageUrl: "javascript:alert(1)", imageAlt: "", inventory: 3 };
  const clean = cart.sanitizeCartItems([valid, { ...valid, quantity: 2 }, { ...valid, id: "p2", quantity: Infinity }]);
  assert.equal(clean.length, 1);
  assert.equal(clean[0].quantity, 3);
  assert.equal(clean[0].inventory, 3);
  const conflicting = cart.sanitizeCartItems([{ ...valid, inventory: 5, quantity: 5 }, { ...valid, inventory: 2 }]);
  assert.equal(conflicting[0].quantity, 5);
  assert.ok(cart.calculateCartTotal(conflicting) >= 0);
  assert.equal(clean[0].imageUrl, "/images/product-placeholder.svg");
  assert.equal(cart.sanitizeCartItems([{ ...valid, inventory: 0 }]).length, 0);
  assert.equal(cart.sanitizeCartItems([{ ...valid, price: "1" }]).length, 0);
  const initial = cart.useCartStore.getState();
  const restored = cart.options.merge({ items: [valid], isOpen: true, clearCart: "broken" }, initial);
  assert.equal(restored.isOpen, false);
  assert.equal(typeof restored.clearCart, "function");
});
test("cart mutations cap stock and refuse NaN/Infinity instead of corrupting totals", () => {
  const cart = cartModule();
  const state = () => cart.useCartStore.getState();
  state().addItem({ ...item, inventory: 3, imageUrl: "/test.png", imageAlt: "Test" }, 2);
  state().addItem({ ...item, inventory: 3, imageUrl: "/test.png", imageAlt: "Test" }, 2);
  assert.equal(state().items[0].quantity, 3);
  for (const quantity of [NaN, Infinity, 1.5]) state().setQuantity("p1", quantity);
  assert.equal(state().items[0].quantity, 3);
  state().setQuantity("p1", 99);
  assert.equal(state().items[0].quantity, 3);
  state().setQuantity("p1", 0);
  assert.equal(state().items.length, 0);
});

function inventoryClient(initial = [{ _id: "p1", _rev: "r1", inventory: 5 }]) {
  const rows = new Map(initial.map((row) => [row._id, { ...row }]));
  const markers = new Set();
  let commits = 0;
  let conflictOnce = false;
  return {
    rows, markers, get commits() { return commits; },
    conflictNext() { conflictOnce = true; },
    async fetch(_query, { markerId, ids }) {
      return { marker: markers.has(markerId) ? { _id: markerId } : null, products: ids.filter((id) => rows.has(id)).map((id) => ({ ...rows.get(id) })) };
    },
    transaction() {
      let marker;
      const patches = [];
      const transaction = {
        create(doc) { marker = doc._id; return transaction; },
        patch(id, build) {
          const mutation = { id };
          build({ ifRevisionId(rev) { mutation.rev = rev; return this; }, dec(change) { mutation.quantity = change.inventory; return this; } });
          patches.push(mutation);
          return transaction;
        },
        async commit() {
          commits++;
          if (conflictOnce) {
            conflictOnce = false;
            const row = rows.get("p1"); row.inventory -= 1; row._rev += "-concurrent";
          }
          if (markers.has(marker) || patches.some((patch) => rows.get(patch.id)._rev !== patch.rev)) {
            throw Object.assign(new Error("Conflict"), { statusCode: 409 });
          }
          for (const patch of patches) { const row = rows.get(patch.id); row.inventory -= patch.quantity; row._rev += "-updated"; }
          markers.add(marker);
        },
      };
      return transaction;
    },
  };
}
function inventory(client) {
  return load("lib/orders/inventorySync.ts", { "../../sanity/lib/writeClient": { sanityWriteClient: client } });
}
const order = { orderCode: "GL-TEST", status: "confirmed", inventoryAdjustedAt: null, items: [{ productId: "p1", quantity: 2 }] };
test("inventory retries the same order without a second decrement, including concurrent attempts", async () => {
  const client = inventoryClient();
  const adjust = inventory(client).adjustSanityInventoryForConfirmedOrder;
  const results = await Promise.all([adjust(order), adjust(order)]);
  assert.equal(results.every((result) => result.ok), true);
  assert.equal(client.rows.get("p1").inventory, 3);
  const before = client.commits;
  assert.equal((await adjust(order)).adjusted, true);
  assert.equal(client.commits, before);
  assert.equal(client.markers.size, 1);
});
test("inventory revision conflicts refresh stock; insufficient multi-product order never partially applies", async () => {
  const client = inventoryClient();
  client.conflictNext();
  assert.equal((await inventory(client).adjustSanityInventoryForConfirmedOrder(order)).ok, true);
  assert.equal(client.rows.get("p1").inventory, 2, "concurrent deduction and this order are both retained");
  const insufficient = inventoryClient([{ _id: "p1", _rev: "r1", inventory: 5 }, { _id: "p2", _rev: "r2", inventory: 0 }]);
  const result = await inventory(insufficient).adjustSanityInventoryForConfirmedOrder({
    ...order, items: [...order.items, { productId: "p2", quantity: 1 }],
  });
  assert.equal(result.ok, false);
  assert.equal(insufficient.commits, 0);
  assert.equal(insufficient.rows.get("p1").inventory, 5);
});

function runBridge(target) {
  const html = fs.readFileSync(path.join(__dirname, "../public/whatsapp-bridge.html"), "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const timers = [], navigations = [], nodes = {
    panel: { classList: { add() {} } }, message: { textContent: "" }, manualLink: { href: "#" },
  };
  vm.runInNewContext(script, {
    URL, URLSearchParams, document: { getElementById: (id) => nodes[id] },
    window: { location: { search: "?to=" + encodeURIComponent(target), pathname: "/whatsapp-bridge.html", replace: (url) => navigations.push(url) }, history: { replaceState() {} }, close() {} },
    setTimeout: (callback) => timers.push(callback),
  });
  for (const callback of timers) callback();
  return { navigations, nodes };
}
test("WhatsApp bridge blocks script and external redirects and accepts only approved HTTPS routes", () => {
  for (const target of ["javascript:alert(1)", "https://evil.test", "http://wa.me/18090000000",
    "https://api.whatsapp.com.evil.test/send?phone=18090000000", "https://user@wa.me/18090000000",
    "https://wa.me:8443/18090000000", "https://wa.me/not-a-number",
    "https://api.whatsapp.com/send?phone=18090000000&redirect=https://evil.test"]) {
    const result = runBridge(target);
    assert.equal(result.navigations.length, 0, target);
    assert.equal(result.nodes.manualLink.href, "#");
  }
  for (const target of ["https://wa.me/18090000000?text=Prueba", "https://api.whatsapp.com/send?phone=18090000000&text=Prueba"]) {
    assert.equal(runBridge(target).navigations[0], target);
  }
});
test("client rejects HTTP failure, unpersisted response and malformed JSON before WhatsApp", async () => {
  function dialog(fetch) {
    return load("components/store/WhatsAppCheckoutDialog.tsx", {
      "react/jsx-runtime": {}, "lucide-react": {}, react: {},
      "./useModalAccessibility": {},
      "../../lib/clerkBrowser": {},
      "next/navigation": { useRouter: () => ({ push() {} }) },
      "../../lib/orders/receipt": load("lib/orders/receipt.ts"),
      "../../lib/orders/provinces": load("lib/orders/provinces.ts"),
      "../../lib/orders/validation": validation,
      "../../lib/contact": {},
      "../../types/product": load("types/product.ts"),
    }, { fetch });
  }
  for (const response of [
    Response.json({ ok: true, persisted: true, orderCode: "GL-TEST" }, { status: 500 }),
    Response.json({ ok: true, persisted: false, orderCode: null }),
    new Response("not JSON"),
  ]) {
    const result = await dialog(async () => response).saveOrderBeforeWhatsApp({ items: [item], values: customer, source: "cart" });
    assert.ok(!result?.ok);
  }
  const success = await dialog(async () => Response.json({ ok: true, persisted: true, orderCode: "GL-TEST" }))
    .saveOrderBeforeWhatsApp({ items: [item], values: customer, source: "cart" });
  assert.equal(success.ok, true);
});
