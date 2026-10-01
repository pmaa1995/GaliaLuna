// Run against a local preview with STOREFRONT_URL, PLAYWRIGHT_MODULE and optional CHROME_PATH.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.STOREFRONT_URL;
if (!baseURL || !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) throw new Error('STOREFRONT_URL must point to a local preview.');
const report = { checks: [], errors: [], hydrationErrors: [], screenshots: [] };
const check = (name, condition) => { assert.ok(condition, name); report.checks.push(name); };

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(120000);
    page.setDefaultTimeout(45000);
    page.on('pageerror', err => report.errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error' && /hydration|did not match|server rendered html/i.test(msg.text())) report.hydrationErrors.push(msg.text()); });
    await page.goto(new URL('/coleccion', baseURL).href, { waitUntil: 'domcontentloaded' });
    const productCard = page.locator('.shop-product-card').filter({ has: page.locator('button:not([disabled])') }).first();
    await productCard.waitFor();
    const name = (await productCard.locator('h3').textContent()).trim();
    const productHref = await productCard.locator('.shop-product-image').getAttribute('href');
    await productCard.locator('.shop-product-image').click();
    await page.waitForURL(`**${productHref}`);
    const summary = page.locator('.pdp__summary');
    const gallery = page.locator('.pdp__gallery');
    await summary.waitFor();
    check('Collection opens the selected product', (await page.locator('h1').textContent()).trim() === name);
    check('PDP has one main and one h1', await page.locator('main').count() === 1 && await page.locator('h1').count() === 1);
    check('PDP uses the shared header and footer', await page.locator('.shop-header').count() === 1 && await page.locator('.shop-footer').count() === 1);
    const aspect = await page.locator('.pdp__image-stage').evaluate(el => { const r = el.getBoundingClientRect(); return r.width / r.height; });
    check('Main photograph reserves a portrait 4:5 frame', Math.abs(aspect - 0.8) < 0.01);
    const categoryLink = page.getByRole('navigation', { name: 'Migas de pan' }).getByRole('link').last();
    const categoryHref = await categoryLink.getAttribute('href');
    await categoryLink.click();
    await page.waitForURL(`**${categoryHref}`);
    check('Breadcrumb navigates to the category collection', new URL(page.url()).pathname.startsWith('/coleccion/'));
    await page.goto(new URL(productHref, baseURL).href, { waitUntil: 'domcontentloaded' });

    const openZoom = page.getByRole('button', { name: `Ampliar imagen de ${name}`, exact: true });
    await openZoom.click();
    const zoom = page.getByRole('dialog', { name, exact: true });
    await zoom.waitFor();
    check('Zoom takes focus and makes summary inert', await zoom.evaluate(el => el.contains(document.activeElement)) && await summary.evaluate(el => Boolean(el.closest('[inert]'))));
    check('Zoom locks background scrolling', await page.evaluate(() => document.body.style.overflow === 'hidden'));
    await page.keyboard.press('Shift+Tab');
    check('Zoom traps backwards keyboard navigation', await zoom.evaluate(el => el.contains(document.activeElement)));
    await page.keyboard.press('Tab');
    check('Zoom traps forwards keyboard navigation', await zoom.evaluate(el => el.contains(document.activeElement)));
    const thumbnails = page.locator('.pdp__thumbnail');
    if (await thumbnails.count() > 1) {
      await page.keyboard.press('ArrowRight');
      check('Zoom supports arrow-key gallery navigation', (await zoom.getByRole('status').textContent()).includes('Imagen 2'));
    }
    await page.keyboard.press('Escape');
    await zoom.waitFor({ state: 'detached' });
    check('Closing zoom restores focus and background', await openZoom.evaluate(el => el === document.activeElement) && await summary.evaluate(el => !el.closest('[inert]')));
    if (await thumbnails.count() > 1) {
      await thumbnails.first().click();
      await gallery.getByRole('button', { name: 'Ver foto siguiente', exact: true }).click();
      check('Gallery controls update selected thumbnail', await thumbnails.nth(1).getAttribute('aria-pressed') === 'true');
    }
    await summary.locator('summary').filter({ hasText: 'Entrega y atención' }).click();
    check('Delivery policy is available next to purchase details', await summary.getByRole('link', { name: /Consultar envíos/ }).isVisible());
    await summary.locator('summary').filter({ hasText: 'Cambios y devoluciones' }).click();
    check('Returns policy is available next to purchase details', await summary.getByRole('link', { name: 'Ver la política' }).isVisible());

    const add = summary.getByRole('button', { name: 'Añadir al pedido', exact: true });
    await add.click();
    const cart = page.locator('[role="dialog"][aria-labelledby="cart-title"]');
    await cart.waitFor();
    check('Primary purchase action opens cart with the selected piece', (await cart.textContent()).includes(name));
    check('Shared shell removes duplicate floating cart trigger', await page.getByRole('button', { name: 'Abrir pedido (1)', exact: true }).count() === 0);
    await page.keyboard.press('Escape');
    await cart.waitFor({ state: 'detached' });
    check('Cart returns focus to primary action', await add.evaluate(el => el === document.activeElement));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Abrir pedido \(1 piezas\)$/ }).waitFor();
    check('PDP reload preserves cart without hydration mismatch', true);

    let status = 503;
    let submitted;
    let requestCount = 0;
    const code = 'GL-20261001-0123456789ABCDEF0123456789ABCDEF';
    await page.route('**/api/orders/whatsapp', async route => {
      requestCount++;
      submitted = route.request().postDataJSON();
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(status === 200 ? { ok: true, persisted: true, orderCode: code } : { ok: false, persisted: false, orderCode: null, error: 'Fallo simulado de registro' }) });
    });
    await page.evaluate(() => {
      window.__pdpTest = { redirects: [], closed: 0 };
      window.open = () => ({ opener: null, close: () => { window.__pdpTest.closed++; }, location: { replace: url => window.__pdpTest.redirects.push(url) } });
    });
    const direct = summary.getByRole('button', { name: 'Comprar esta pieza por WhatsApp', exact: true });
    await direct.click();
    const checkout = page.getByRole('dialog', { name: 'Confirmar pedido por WhatsApp', exact: true });
    await checkout.waitFor();
    check('Lazy direct checkout receives focus', await checkout.evaluate(el => el.contains(document.activeElement)));
    await checkout.getByLabel('Nombre completo *', { exact: true }).fill('Prueba de interfaz');
    await checkout.getByLabel('Telefono *', { exact: true }).fill('8090000000');
    await checkout.getByLabel('Provincia *', { exact: true }).fill('Prueba');
    await checkout.getByLabel('Ciudad / Municipio *', { exact: true }).fill('Prueba');
    await checkout.getByLabel('Direccion principal *', { exact: true }).fill('Datos ficticios, no enviar');
    await checkout.getByRole('button', { name: 'Enviar por WhatsApp', exact: true }).click();
    await checkout.getByRole('alert').waitFor();
    check('Direct checkout sends one selected piece with product source', submitted.source === 'product' && submitted.items.length === 1 && submitted.items[0].quantity === 1 && submitted.items[0].name === name);
    check('Failed direct checkout retains cart and avoids WhatsApp navigation', await page.evaluate(() => JSON.parse(localStorage.getItem('galia-luna-cart-v1')).state.items.length === 1 && window.__pdpTest.redirects.length === 0));
    status = 200;
    await checkout.getByRole('button', { name: 'Enviar por WhatsApp', exact: true }).click();
    await checkout.waitFor({ state: 'detached' });
    check('Successful direct checkout prepares one intercepted WhatsApp message', requestCount === 2 && await page.evaluate(() => window.__pdpTest.redirects.length === 1));
    check('Direct checkout leaves the separate cart intact', await page.evaluate(() => JSON.parse(localStorage.getItem('galia-luna-cart-v1')).state.items.length === 1));
    check('Direct checkout restores focus to its opener', await direct.evaluate(el => el === document.activeElement));
    check('Confirmation shows code and asks to send WhatsApp message', (await page.locator('.pdp__confirmation').textContent()).includes(code) && (await page.locator('.pdp__confirmation').textContent()).includes('Confirma el envío'));

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        return [...document.querySelectorAll('.pdp h1,.pdp h2,.pdp button,.pdp a,.pdp__confirmation p')].filter(el => !el.closest('.pdp__thumbnails') && el.getClientRects().length > 0).filter(el => { const r = el.getBoundingClientRect(); return r.left < -1 || r.right > viewport + 1 || el.scrollWidth > el.clientWidth + 1; }).map(el => el.textContent?.trim().slice(0, 80));
      });
      check(`PDP controls and long order code fit viewport ${width}: ${JSON.stringify(overflow)}`, overflow.length === 0);
    }
    if (process.env.STOREFRONT_SCREENSHOTS) {
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(new URL(productHref, baseURL).href, { waitUntil: 'domcontentloaded' });
        await summary.waitFor();
        await page.evaluate(() => { window.scrollTo(0, 0); return document.fonts.ready; });
        await page.waitForFunction(() => [...document.images].filter(img => img.getBoundingClientRect().top < innerHeight).every(img => img.complete));
        const screenshot = path.join(process.env.STOREFRONT_SCREENSHOTS, `galia-redesign-pdp-${width}.png`);
        await page.screenshot({ path: screenshot, fullPage: true });
        report.screenshots.push(screenshot);
      }
    }
    check('No uncaught runtime errors', report.errors.length === 0);
    check('No hydration errors', report.hydrationErrors.length === 0);
  } finally {
    await browser.close();
    if (process.env.STOREFRONT_REPORT) fs.writeFileSync(process.env.STOREFRONT_REPORT, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
