const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, dependencies = {}, env = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, {
    module: loaded, exports: loaded.exports, URL, process: { env },
    require(name) {
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  return loaded.exports;
}

const jsx = (type, props) => ({ type, props });
const uiDependencies = {
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "next/link": "Link",
  "lucide-react": new Proxy({}, { get: (_target, name) => name }),
};

test("Clerk availability follows runtime bindings after modules have already loaded", () => {
  const env = { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_public" };
  const { isClerkServerConfigured } = load("lib/clerkConfig.ts", {}, env);
  assert.equal(isClerkServerConfigured(), false);
  env.CLERK_SECRET_KEY = "test-only-runtime-binding";
  assert.equal(isClerkServerConfigured(), true);
  delete env.CLERK_SECRET_KEY;
  assert.equal(isClerkServerConfigured(), false);
});

test("middleware initialized before bindings still protects accounts and preserves anonymous checkout", async () => {
  const env = { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_public" };
  const config = load("lib/clerkConfig.ts", {}, env);
  let middlewareCalls = 0;
  let authCalls = 0;
  let sdkImports = 0;
  let secretAtSDKImport;
  const middleware = load("middleware.ts", {
    "./lib/clerkConfig": config,
    "next/server": { NextResponse: { next: () => "next", redirect: (url) => url.href } },
    get "@clerk/nextjs/server"() {
      sdkImports++;
      secretAtSDKImport = env.CLERK_SECRET_KEY;
      return {
        createRouteMatcher: () => (req) => /^\/(mi-cuenta|admin)/.test(new URL(req.url).pathname),
        clerkMiddleware: (handler) => (req) => {
          middlewareCalls++;
          return handler(async () => { authCalls++; return { userId: null }; }, req);
        },
      };
    },
  }, env).default;
  const account = { url: "https://www.galialuna.com/mi-cuenta" };
  assert.equal(await middleware(account), "next");
  assert.equal(middlewareCalls, 0);
  assert.equal(sdkImports, 0);
  env.CLERK_SECRET_KEY = "test-only-runtime-binding";
  const redirect = new URL(await middleware(account));
  assert.equal(redirect.pathname, "/iniciar-sesion");
  assert.equal(redirect.searchParams.get("redirect_url"), account.url);
  assert.equal(secretAtSDKImport, env.CLERK_SECRET_KEY);
  assert.equal(authCalls, 1);
  assert.equal(await middleware({ url: "https://www.galialuna.com/api/orders/whatsapp" }), undefined);
  assert.equal(middlewareCalls, 2);
  assert.equal(authCalls, 1);
  assert.equal(sdkImports, 1);
});

test("account pages loaded without a secret reach session checks once runtime bindings exist", async () => {
  const cases = [
    ["app/mi-cuenta/page.tsx", "../../", {}, false],
    ["app/mi-cuenta/pedidos/page.tsx", "../../../", {}, true],
    ["app/mi-cuenta/pedidos/[codigo]/page.tsx", "../../../../", { params: Promise.resolve({ codigo: "GL-TEST" }) }, true],
  ];
  for (const [file, prefix, props, initiallyRedirects] of cases) {
    const env = { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_public" };
    let authCalls = 0;
    const dependencies = {
      ...uiDependencies,
      "next/navigation": { redirect: (url) => { throw new Error("redirect:" + url); } },
      "@clerk/nextjs/server": { auth: async () => { authCalls++; return { userId: null }; } },
      react: { Suspense: "Suspense" },
      [prefix + "lib/clerkConfig"]: load("lib/clerkConfig.ts", {}, env),
      [prefix + "components/account/AccountOrderHistoryPanel"]: "History",
      [prefix + "components/auth/AccountSignOutButton"]: "SignOut",
      [prefix + "lib/admin/auth"]: {},
      [prefix + "lib/contact"]: {},
      [prefix + "lib/orders/customerRepository"]: {},
      [prefix + "components/account/orderUi"]: {},
      "./actions": {},
    };
    const page = load(file, dependencies, env).default;
    if (initiallyRedirects) await assert.rejects(page(props), /redirect:\/mi-cuenta$/);
    else assert.match(JSON.stringify(await page(props)), /Acceso de cuenta disponible pronto/);
    assert.equal(authCalls, 0, file);
    env.CLERK_SECRET_KEY = "test-only-runtime-binding";
    await assert.rejects(page(props), /redirect:\/iniciar-sesion/);
    assert.equal(authCalls, 1, file);
  }
});

test("security page re-evaluates runtime availability and the account layout opts out of prerendering", () => {
  const env = { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_public" };
  const page = load("app/mi-cuenta/seguridad/[[...index]]/page.tsx", {
    ...uiDependencies,
    "@clerk/nextjs": { UserProfile: "UserProfile" },
    "../../../../lib/clerkConfig": load("lib/clerkConfig.ts", {}, env),
  }, env).default;
  assert.match(JSON.stringify(page()), /cuando Clerk este configurado/);
  env.CLERK_SECRET_KEY = "test-only-runtime-binding";
  assert.match(JSON.stringify(page()), /UserProfile/);
  const layout = load("app/mi-cuenta/layout.tsx");
  assert.equal(layout.dynamic, "force-dynamic");
  assert.equal(layout.metadata.robots.index, false);
});
