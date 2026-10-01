const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.STOREFRONT_URL;
const mockOrderCode = 'GL-20261001-0123456789ABCDEF0123456789ABCDEF';
if (!baseURL) throw new Error('Set STOREFRONT_URL to the local preview URL.');
if (!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) throw new Error('Run this interactive smoke test against a local preview only.');
const report = { checks: [], screenshots: [], labMetrics: [], pageErrors: [], hydrationErrors: [] };
const check = (label, condition) => { assert.ok(condition, label); report.checks.push(label); };

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      history.scrollRestoration = 'manual';
      window.__storefrontMetrics = { cls: 0, lcpMs: null, shiftSources: [] };
      let sessionStart = 0;
      let lastShift = 0;
      let sessionValue = 0;
      if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.hadRecentInput) continue;
            if (entry.startTime - lastShift > 1000 || entry.startTime - sessionStart > 5000) {
              sessionStart = entry.startTime;
              sessionValue = entry.value;
            } else sessionValue += entry.value;
            lastShift = entry.startTime;
            window.__storefrontMetrics.cls = Math.max(window.__storefrontMetrics.cls, sessionValue);
            window.__storefrontMetrics.shiftSources.push({ value: entry.value, atMs: entry.startTime, nodes: (entry.sources || []).map(s => s.node?.tagName).filter(Boolean) });
          }
        }).observe({ type: 'layout-shift', buffered: true });
      }
      if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) window.__storefrontMetrics.lcpMs = entry.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      }
    });
    const page = await context.newPage();
    page.on('pageerror', err => report.pageErrors.push(err.message));
    page.on('console', msg => { if (/hydration|did not match|server rendered html/i.test(msg.text()) && msg.type() === 'error') report.hydrationErrors.push(msg.text()); });
    const response = await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    check('Home responds successfully', response.ok());
    const results = page.locator('#resultados-catalogo');
    await results.locator('article').first().waitFor();
    const total = await results.locator('article').count();
    check('Real catalogue is populated', total > 0);
    check('Home has one main landmark', await page.locator('main').count() === 1);
    check('Home has one h1', await page.locator('h1').count() === 1);
    const productName = (await results.locator('article h3').first().textContent()).trim();
    const productHref = await results.locator('article a[href^="/product/"]').first().getAttribute('href');
    const search = page.getByRole('searchbox', { name: 'Buscar piezas' });
    await page.getByRole('button', { name: 'Buscar piezas', exact: true }).click();
    check('Header search button focuses the search field', await search.evaluate(el => el === document.activeElement));
    const normalizedName = productName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    await search.fill(normalizedName);
    await page.waitForFunction(name => document.querySelector('#resultados-catalogo')?.textContent.includes(name), productName);
    check('Search matches the product with case and accents normalized', await results.locator('article').count() >= 1);
    const accentedName = normalizedName.replace(/[AEIOU]/g, c => ({ A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú' }[c]));
    await search.fill(accentedName);
    await page.waitForFunction(name => document.querySelector('#resultados-catalogo')?.textContent.includes(name), productName);
    check('Search accepts accented input', await results.locator('article').count() >= 1);
    await search.fill('sin-resultados-prueba-zz991');
    await page.getByText('No encontramos piezas con esa búsqueda.', { exact: true }).waitFor();
    check('Unmatched search has zero products', await results.locator('article').count() === 0);
    await page.getByRole('button', { name: 'Ver todas las piezas', exact: true }).click();
    check('Empty-state recovery restores all products', await results.locator('article').count() === total && await search.inputValue() === '');
    const category = page.getByRole('group', { name: 'Filtrar por categoría' }).getByRole('button', { name: 'Aretes', exact: true });
    await category.click();
    check('Category marks itself selected', await category.getAttribute('aria-pressed') === 'true');
    check('Category narrows results correctly', await results.locator('article > div > p:first-child, article > div > div > div > p:first-child').evaluateAll(nodes => nodes.filter(n => /Anillos|Aretes|Cadenas|Carteras|Collares/.test(n.textContent)).every(n => n.textContent.includes('Aretes'))));
    await page.getByRole('button', { name: 'Todas', exact: true }).click();
    const add = results.getByRole('button', { name: 'Agregar al pedido', exact: true }).first();
    await add.click();
    const cart = page.locator('[role="dialog"][aria-labelledby="cart-title"]');
    await cart.waitFor();
    check('Cart opens as modal', await cart.getAttribute('aria-modal') === 'true');
    check('Background is inert while cart is open', await page.locator('.storefront').evaluate(el => Boolean(el.closest('[inert]'))));
    check('Page scrolling is locked while cart is open', await page.evaluate(() => document.body.style.overflow === 'hidden'));
    const close = cart.getByRole('button', { name: 'Cerrar pedido' });
    check('Cart initially focuses close', await close.evaluate(el => el === document.activeElement));
    await page.keyboard.press('Shift+Tab');
    check('Shift+Tab wraps inside cart', await cart.getByRole('button', { name: 'Vaciar pedido' }).evaluate(el => el === document.activeElement));
    await page.keyboard.press('Tab');
    check('Tab wraps back to first cart control', await close.evaluate(el => el === document.activeElement));
    const startCheckout = cart.getByRole('button', { name: 'Enviar pedido por WhatsApp', exact: true });
    await startCheckout.click();
    await page.waitForFunction(() => document.querySelectorAll('[role="dialog"]').length === 2);
    check('Nested checkout receives focus', await page.evaluate(() => { const active = document.activeElement?.closest('[role="dialog"]'); return Boolean(active && active.getAttribute('aria-labelledby') !== 'cart-title'); }));
    check('Cart becomes inert behind checkout', await cart.evaluate(el => Boolean(el.closest('[inert]'))));
    const nestedCheckout = page.getByRole('dialog', { name: 'Confirmar pedido por WhatsApp', exact: true });
    check('Checkout initially focuses the name field', await nestedCheckout.getByLabel('Nombre completo *', { exact: true }).evaluate(el => el === document.activeElement));
    const closeCheckout = nestedCheckout.getByRole('button', { name: 'Cerrar confirmacion de pedido' });
    await closeCheckout.focus();
    await page.keyboard.press('Shift+Tab');
    check('Shift+Tab wraps inside nested checkout', await nestedCheckout.getByRole('button', { name: 'Enviar por WhatsApp', exact: true }).evaluate(el => el === document.activeElement));
    await page.keyboard.press('Tab');
    check('Tab wraps back inside nested checkout', await closeCheckout.evaluate(el => el === document.activeElement));
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.querySelectorAll('[role="dialog"]').length === 1);
    check('Escape closes checkout only', await cart.isVisible());
    check('Checkout returns focus to its opener', await startCheckout.evaluate(el => el === document.activeElement));
    check('Scroll lock persists for remaining cart', await page.evaluate(() => document.body.style.overflow === 'hidden'));
    await page.keyboard.press('Escape');
    await cart.waitFor({ state: 'detached' });
    check('Escape closes cart and restores background', await page.locator('.storefront').evaluate(el => !el.closest('[inert]')));
    check('Cart returns focus to add button', await add.evaluate(el => el === document.activeElement));
    check('Page scroll lock is restored', await page.evaluate(() => document.body.style.overflow !== 'hidden'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Abrir pedido \([1-9]\d* piezas\)$/ }).waitFor();
    check('Persisted cart survives reload', (await page.getByRole('button', { name: /^Abrir pedido \(\d+ piezas\)$/ }).getAttribute('aria-label')) !== 'Abrir pedido (0 piezas)');
    await page.goto(new URL(productHref, baseURL).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    check('Product navigation loads correct title', (await page.locator('h1').textContent()).trim() === productName);
    check('Product has one main landmark', await page.locator('main').count() === 1);
    if (await page.getByRole('button', { name: 'Ver foto siguiente' }).count()) {
      await page.getByRole('button', { name: 'Ver foto siguiente' }).click();
      check('Product gallery reports selected image', await page.getByRole('button', { name: 'Ver imagen 2', exact: true }).getAttribute('aria-pressed') === 'true');
    }
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Abrir pedido \(\d+ piezas\)$/ }).click();
    await cart.getByRole('button', { name: 'Enviar pedido por WhatsApp', exact: true }).click();
    const checkout = page.getByRole('dialog', { name: 'Confirmar pedido por WhatsApp', exact: true });
    await checkout.getByLabel('Nombre completo *', { exact: true }).fill('Prueba de interfaz');
    await checkout.getByLabel('Telefono *', { exact: true }).fill('8090000000');
    await checkout.getByLabel('Provincia *', { exact: true }).fill('Prueba');
    await checkout.getByLabel('Ciudad / Municipio *', { exact: true }).fill('Prueba');
    await checkout.getByLabel('Direccion principal *', { exact: true }).fill('Datos ficticios, no enviar');
    await page.evaluate(() => {
      window.__checkoutBrowserTest = { opened: [], closed: 0, redirected: [] };
      window.open = url => {
        window.__checkoutBrowserTest.opened.push(url);
        return { opener: null, location: { replace: target => window.__checkoutBrowserTest.redirected.push(target) }, close: () => { window.__checkoutBrowserTest.closed++; } };
      };
    });
    let pendingRoute;
    let requested = 0;
    let routeMode = 'hold';
    let onRequest;
    const requestStarted = new Promise(resolve => { onRequest = resolve; });
    await page.route('**/api/orders/whatsapp', async route => {
      requested++;
      if (routeMode === 'hold') { pendingRoute = route; onRequest(); return; }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, persisted: true, orderCode: mockOrderCode }) });
    });
    await checkout.getByRole('button', { name: 'Enviar por WhatsApp', exact: true }).click();
    await requestStarted;
    await page.keyboard.press('Escape');
    check('Pending checkout cannot be dismissed by Escape', await checkout.isVisible());
    check('Pending checkout disables its close control', await checkout.getByRole('button', { name: 'Cerrar confirmacion de pedido' }).isDisabled());
    await checkout.locator('form').evaluate(form => { form.requestSubmit(); form.requestSubmit(); });
    check('Submitting guard prevents duplicate requests', requested === 1);
    await pendingRoute.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, persisted: false, orderCode: null, error: 'Fallo de registro simulado' }) });
    await checkout.getByRole('alert').waitFor();
    check('Failed checkout announces its error', (await checkout.getByRole('alert').textContent()).includes('Fallo de registro simulado'));
    check('Failed checkout preserves the cart', await page.evaluate(() => JSON.parse(localStorage.getItem('galia-luna-cart-v1')).state.items.length > 0));
    check('Failed checkout never redirects to WhatsApp', await page.evaluate(() => window.__checkoutBrowserTest.redirected.length === 0));
    check('Failed checkout closes the unused bridge', await page.evaluate(() => window.__checkoutBrowserTest.closed === 1));
    routeMode = 'success';
    await checkout.getByRole('button', { name: 'Enviar por WhatsApp', exact: true }).click();
    await checkout.waitFor({ state: 'detached' });
    check('Successful persisted checkout clears cart', await page.evaluate(() => JSON.parse(localStorage.getItem('galia-luna-cart-v1')).state.items.length === 0));
    check('Successful checkout prepares exactly one WhatsApp redirect', await page.evaluate(code => window.__checkoutBrowserTest.redirected.length === 1 && window.__checkoutBrowserTest.redirected[0].includes(code), mockOrderCode));
    check('Success message asks user to confirm WhatsApp send', (await cart.textContent()).includes('Confirma el envío del mensaje en WhatsApp.'));
    check('Success keeps focus in cart when checkout opener disappears', await cart.evaluate(el => el.contains(document.activeElement)));
    await page.setViewportSize({ width: 320, height: 900 });
    check('Long order confirmation code fits cart on mobile', await cart.evaluate(el => el.scrollWidth <= el.clientWidth && [...el.querySelectorAll('p')].every(p => p.scrollWidth <= p.clientWidth)));
    await page.keyboard.press('Escape');
    await cart.waitFor({ state: 'detached' });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    for (const width of [320, 390, 1440]) {
      await cdp.send('Network.clearBrowserCache');
      await page.setViewportSize({ width, height: 900 });
      await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.getByRole('searchbox', { name: 'Buscar piezas' }).waitFor();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => [...document.images].filter(img => img.getBoundingClientRect().top < innerHeight).every(img => img.complete), undefined, { timeout: 15000 });
      await page.waitForTimeout(3000);
      report.labMetrics.push({ width, mode: `${process.env.STOREFRONT_MODE || 'Local preview'}, unthrottled, reduced motion, 3s settling; browser cache cleared and disabled`, ...await page.evaluate(() => window.__storefrontMetrics) });
      const geometry = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const overflow = [...document.querySelectorAll('a,button,input,h1,h2,h3,article')].filter(el => { const r = el.getBoundingClientRect(); return r.height > 0 && (r.left < -1 || r.right > width + 1); }).map(el => ({ tag: el.tagName, text: el.textContent?.trim().slice(0, 60) }));
        return { width, scrollWidth: document.documentElement.scrollWidth, overflow };
      });
      check(`Viewport ${width} has no horizontal scroll overflow`, geometry.scrollWidth <= geometry.width);
      check(`Viewport ${width} has no offscreen content controls: ${JSON.stringify(geometry.overflow)}`, geometry.overflow.length === 0);
      if (process.env.STOREFRONT_SCREENSHOTS) {
        const screenshot = path.join(process.env.STOREFRONT_SCREENSHOTS, `galia-final-${width}.png`);
        await page.screenshot({ path: screenshot, fullPage: false });
        report.screenshots.push(screenshot);
      }
      await page.getByRole('button', { name: 'Buscar piezas', exact: true }).click();
      check(`Search stays usable at ${width}`, await page.getByRole('searchbox').evaluate(el => { const r = el.getBoundingClientRect(); return document.activeElement === el && r.width > 100 && r.top >= 0 && r.bottom <= window.innerHeight; }));
    }
    check('No uncaught page errors', report.pageErrors.length === 0);
    check('No hydration errors, including reload with cart data', report.hydrationErrors.length === 0);
  } finally { await browser.close(); console.log(JSON.stringify(report, null, 2)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
