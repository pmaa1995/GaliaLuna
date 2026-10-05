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
    module: loaded, exports: loaded.exports, TextEncoder, Uint8Array, Uint32Array, DataView, ArrayBuffer, Intl, Date, crypto: require("node:crypto").webcrypto,
    require(name) {
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  return loaded.exports;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

test("xlsx writer produces a valid stored ZIP with escaped inline strings and RD$ cells", () => {
  const { buildXlsx } = load("lib/xlsx.ts");
  const bytes = buildXlsx([{ name: "Pedidos/2026", header: ["Código", "Total"], rows: [["Ana & <Luz>\u0001", 3200.5], [null, 0]], currencyColumns: [1] }]);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const endOffset = bytes.length - 22;
  assert.equal(view.getUint32(endOffset, true), 0x06054b50);
  const entries = view.getUint16(endOffset + 10, true);
  let offset = view.getUint32(endOffset + 16, true);
  const files = {};
  for (let i = 0; i < entries; i++) {
    assert.equal(view.getUint32(offset, true), 0x02014b50);
    const crc = view.getUint32(offset + 16, true);
    const size = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const data = bytes.subarray(localOffset + 30 + localNameLength, localOffset + 30 + localNameLength + size);
    assert.equal(crc32(data), crc, name);
    files[name] = new TextDecoder().decode(data);
    offset += 46 + nameLength;
  }
  assert.ok(files["xl/workbook.xml"].includes('name="Pedidos 2026"'));
  const sheet = files["xl/worksheets/sheet1.xml"];
  assert.ok(sheet.includes("<t xml:space=\"preserve\">Ana &amp; &lt;Luz&gt;</t>"));
  assert.ok(sheet.includes('<c r="B2" s="2"><v>3200.5</v></c>'));
  assert.ok(sheet.includes('<c r="A1" t="inlineStr" s="1">'));
  assert.ok(!sheet.includes('r="A3"'), "empty cells are omitted");
});

test("monthly keys follow Santo Domingo time across month boundaries", () => {
  const { recentLocalMonths } = load("lib/orders/adminRepository.ts", { "@opennextjs/cloudflare": { getCloudflareContext: async () => ({ env: {} }) } });
  // 02:00 UTC on 1 October is still 30 September in Santo Domingo (UTC-4).
  assert.deepEqual([...recentLocalMonths(3, new Date("2026-10-01T02:00:00Z"))], ["2026-09", "2026-08", "2026-07"]);
  assert.deepEqual([...recentLocalMonths(2, new Date("2026-01-15T12:00:00Z"))], ["2026-01", "2025-12"]);
});

test("stored D1 timestamps are read as UTC and shown in store time", () => {
  const { parseStoredDate, formatStoreDateTimeISO, formatMonthLabel } = load("lib/orders/dates.ts");
  assert.equal(parseStoredDate("2026-09-18 16:23:00").toISOString(), "2026-09-18T16:23:00.000Z");
  assert.equal(formatStoreDateTimeISO("2026-09-18 16:23:00"), "2026-09-18 12:23");
  assert.equal(formatMonthLabel("2026-10"), "octubre de 2026");
});

test("pending orders older than 48 hours are flagged as stale", () => {
  const { isStalePending, STALE_PENDING_HOURS } = load("lib/orders/adminRepository.ts", { "@opennextjs/cloudflare": { getCloudflareContext: async () => ({ env: {} }) } });
  const now = Date.parse("2026-10-05T12:00:00Z");
  assert.equal(STALE_PENDING_HOURS, 48);
  assert.equal(isStalePending({ status: "pending_confirmation", createdAt: "2026-10-03 11:59:00" }, now), true);
  assert.equal(isStalePending({ status: "pending_confirmation", createdAt: "2026-10-03 12:01:00" }, now), false);
  assert.equal(isStalePending({ status: "confirmed", createdAt: "2026-09-01 10:00:00" }, now), false);
});

test("cancelled orders give stock back once, and only if it was taken", async () => {
  function fakeSanity({ adjusted, restored, inventory = 3 }) {
    const committed = [];
    const client = {
      fetch: async () => ({ adjusted: adjusted ? { _id: "a" } : null, restored: restored ? { _id: "r" } : null, products: [{ _id: "p1", _rev: "rev1", inventory }] }),
      transaction() {
        const ops = [];
        const tx = {
          create: (doc) => { ops.push(["create", doc._type]); return tx; },
          patch: (id, fn) => { const patch = { ifRevisionId: (rev) => { ops.push(["rev", id, rev]); return patch; }, inc: (value) => { ops.push(["inc", id, value]); return patch; } }; fn(patch); return tx; },
          commit: async () => { committed.push(ops); },
        };
        return tx;
      },
    };
    return { client, committed };
  }
  const order = { orderCode: "GL-20260918-365", items: [{ productId: "p1", quantity: 2 }, { productId: "p1", quantity: 1 }] };
  for (const [state, expectCommit] of [[{ adjusted: false }, false], [{ adjusted: true, restored: true }, false], [{ adjusted: true }, true]]) {
    const { client, committed } = fakeSanity(state);
    const { restoreSanityInventoryForOrder } = load("lib/orders/inventorySync.ts", { "../../sanity/lib/writeClient": { sanityWriteClient: client } });
    const result = await restoreSanityInventoryForOrder(order);
    assert.equal(result.ok, true);
    assert.equal(committed.length, expectCommit ? 1 : 0, JSON.stringify(state));
    // Objects built inside the vm context have another realm's prototypes; compare by content.
    if (expectCommit) assert.equal(JSON.stringify(committed[0]), JSON.stringify([["create", "orderInventoryRestore"], ["rev", "p1", "rev1"], ["inc", "p1", { inventory: 3 }]]));
  }
});
