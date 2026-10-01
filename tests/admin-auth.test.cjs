const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../lib/admin/auth.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function loadAuth({ allowlist = "", user = null, userId = "user_test" } = {}) {
  const loadedModule = { exports: {} };
  vm.runInNewContext(compiled, {
    exports: loadedModule.exports,
    module: loadedModule,
    process: { env: { ADMIN_EMAIL_ALLOWLIST: allowlist } },
    require(name) {
      if (name === "@clerk/nextjs/server") {
        return { auth: async () => ({ userId }), currentUser: async () => user };
      }
      if (name === "next/navigation") {
        return { redirect: (url) => { throw new Error(`REDIRECT:${url}`); } };
      }
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return loadedModule.exports;
}

function email(address, status = "verified") {
  return { emailAddress: address, verification: status === null ? null : { status } };
}

function account(overrides = {}) {
  return { primaryEmailAddress: null, emailAddresses: [], publicMetadata: {}, privateMetadata: {}, unsafeMetadata: {}, ...overrides };
}

test("user-controlled metadata never grants administrator access", () => {
  const { isAdminFromClerkUser } = loadAuth();
  assert.equal(isAdminFromClerkUser(null), false);
  assert.equal(isAdminFromClerkUser(account()), false);
  assert.equal(isAdminFromClerkUser(account({ unsafeMetadata: { galiaLunaRole: "admin" } })), false);
  assert.equal(isAdminFromClerkUser(account({ publicMetadata: { galiaLunaRole: { admin: true } } })), false);
});

test("server-controlled public and private administrator roles remain authorized", () => {
  const { isAdminFromClerkUser } = loadAuth();
  assert.equal(isAdminFromClerkUser(account({ publicMetadata: { galiaLunaRole: "admin" } })), true);
  assert.equal(isAdminFromClerkUser(account({ privateMetadata: { galiaLunaRole: "ADMIN" } })), true);
  assert.equal(isAdminFromClerkUser(account({ publicMetadata: { galiaLunaRole: "customer" } })), false);
});

test("allowlist only trusts verified matching email addresses", () => {
  const { isAdminFromClerkUser } = loadAuth({ allowlist: "owner@example.test; SECOND@example.test\nthird@example.test" });
  for (const status of [null, "unverified", "expired", "failed"]) {
    assert.equal(isAdminFromClerkUser(account({ primaryEmailAddress: email("owner@example.test", status) })), false);
    assert.equal(isAdminFromClerkUser(account({ emailAddresses: [email("owner@example.test", status)] })), false);
  }
  assert.equal(isAdminFromClerkUser(account({ primaryEmailAddress: email("OWNER@example.test") })), true);
  assert.equal(isAdminFromClerkUser(account({ emailAddresses: [email("second@example.test")] })), true);
  assert.equal(isAdminFromClerkUser(account({ emailAddresses: [email("outsider@example.test")] })), false);
});

test("page guard rejects anonymous and self-assigned administrators", async () => {
  await assert.rejects(loadAuth({ userId: null }).requireAdminUser(), /REDIRECT:\/iniciar-sesion/);
  await assert.rejects(loadAuth({ user: account({ unsafeMetadata: { galiaLunaRole: "admin" } }) }).requireAdminUser(), /REDIRECT:\/mi-cuenta/);
});

test("request guard returns 401 or 403 and accepts trusted administrator", async () => {
  assert.equal((await loadAuth({ userId: null }).assertAdminRequest()).status, 401);
  assert.equal((await loadAuth({ user: account({ unsafeMetadata: { galiaLunaRole: "admin" } }) }).assertAdminRequest()).status, 403);
  const user = account({ publicMetadata: { galiaLunaRole: "admin" } });
  assert.equal(await loadAuth({ user }).requireAdminUser(), user);
  assert.equal((await loadAuth({ user }).assertAdminRequest()).ok, true);
});