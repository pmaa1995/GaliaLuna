// Local-only integration checks. All order POSTs and WhatsApp navigation are intercepted.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.STOREFRONT_URL;
if (!baseURL || !['127.0.0.1', 'localhost'].includes(new URL(baseURL).hostname)) throw new Error('Use a local STOREFRONT_URL.');
const report = { checks: [], errors: [], hydrationErrors: [], screenshots: [] };
const check = (label, condition) => { assert.ok(condition, label); report.checks.push(label); };
const code = 'GL-20261001-0123456789ABCDEF0123456789ABCDEF';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(120000);
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && /hydration|did not match|server rendered html/i.test(message.text())) report.hydrationErrors.push(message.text()); });
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    check('Home has one main and one h1', await page.locator('main').count() === 1 && await page.locator('h1').count() === 1);
    check('Home has a direct collection CTA', await page.getByRole('link', { name: 'Explorar la colección', exact: true }).count() === 1);
    check('Home explains its limited selection and links the full catalog', await page.locator('.shop-selection-more').getByRole('link', { name: 'Ver colección completa', exact: true }).count() === 1 && /\d+ piezas para descubrir/.test(await page.locator('.shop-hero-note').textContent()));
    const searchButton = page.getByRole('button', { name: 'Buscar piezas', exact: true });
    await searchButton.click();
    const searchDialog = page.getByRole('dialog', { name: 'Encuentra tu próxima pieza' });
    const globalSearch = searchDialog.getByRole('searchbox', { name: 'Buscar piezas' });
    check('Global search focuses its field and makes page inert', await globalSearch.evaluate(el => el === document.activeElement) && await page.locator('main').evaluate(el => !!el.closest('[inert]')));
    await page.keyboard.press('Escape');
    check('Search closes with Escape and restores focus', await searchButton.evaluate(el => el === document.activeElement));
    await searchButton.click();
    await globalSearch.fill('anillo');
    await searchDialog.getByRole('button', { name: 'Buscar en la colección' }).click();
    await page.waitForURL('**/coleccion?q=anillo');
    await page.locator('#catalog-search').waitFor();
    check('Native global search navigates and SSR applies query', await page.locator('#catalog-search').inputValue() === 'anillo' && await page.locator('.shop-product-card').count() > 0);
    await page.goto(new URL('/coleccion', baseURL).href, { waitUntil: 'networkidle' });
    const cards = page.locator('#resultados-catalogo .shop-product-card');
    const initialCount = await cards.count();
    const totalCount = parseInt(await page.locator('.shop-results-summary p').textContent(), 10);
    check('Collection renders all products up to 24 with an accurate total', initialCount === Math.min(totalCount, 24) && initialCount > 0 && await page.locator('h1').count() === 1);
    const productName = (await cards.first().locator('h3').textContent()).trim();
    const search = page.locator('#catalog-search');
    await search.fill(productName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase());
    await page.waitForFunction(count => document.querySelectorAll('.shop-product-card').length < count, initialCount);
    check('Search ignores case and accent differences', (await cards.first().locator('h3').textContent()).trim() === productName);
    await search.fill('zz-no-existe-928341');
    await page.getByText('No encontramos esa combinación.', { exact: true }).waitFor();
    check('Empty search has useful recovery', await cards.count() === 0);
    await page.getByRole('link', { name: 'Ver todas las piezas', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.shop-product-card').length > 1);
    check('Recovery clears query and restores collection', await search.inputValue() === '' && await cards.count() === initialCount);
    await page.locator('#catalog-sort').selectOption('price-asc');
    const prices = await cards.evaluateAll(nodes => nodes.map(node => Number(node.dataset.productPrice)));
    check('Ascending price order is applied', prices.every((price, index) => index === 0 || price >= prices[index - 1]));
    await page.getByRole('button', { name: 'Filtros', exact: true }).click();
    await page.locator('#catalog-price').fill('3500');
    check('Price limit applies including cents', (await cards.evaluateAll(nodes => nodes.map(node => Number(node.dataset.productPrice)))).every(price => price <= 3500));
    const filteredURL = page.url();
    const filteredNames = await cards.locator('h3').allTextContents();
    await cards.first().locator('.shop-product-image').click();
    await page.waitForURL('**/product/**');
    await page.goBack({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#catalog-price')?.value === '3500');
    check('Back from PDP restores URL, controls and filtered products', page.url() === filteredURL && JSON.stringify(await cards.locator('h3').allTextContents()) === JSON.stringify(filteredNames) && await page.locator('#catalog-sort').inputValue() === 'price-asc');
    await page.getByRole('link', { name: 'Limpiar', exact: true }).click();
    const more = page.getByRole('link', { name: 'Ver más piezas', exact: true });
    if (await more.count()) {
      await more.click();
      await page.waitForFunction(count => document.querySelectorAll('.shop-product-card').length > count, initialCount);
    } else {
      check('Small catalogs have no hidden second page', initialCount === totalCount);
    }
    {
      const expandedCount = await cards.count();
      const lastCard = cards.last();
      await lastCard.scrollIntoViewIfNeeded();
      const scrollBefore = await page.evaluate(() => scrollY);
      await lastCard.locator('.shop-product-image').click();
      await page.waitForURL('**/product/**');
      await page.goBack({ waitUntil: 'networkidle' });
      await page.waitForFunction(count => document.querySelectorAll('.shop-product-card').length === count, expandedCount);
      check('Back restores the complete visible catalog', await cards.count() === expandedCount && (expandedCount <= 24 || page.url().includes('pagina=2')));
      await page.waitForFunction(expected => Math.abs(scrollY - expected) < 180, scrollBefore, { timeout: 5000 }).catch(async () => { throw new Error('Scroll restoration: ' + JSON.stringify({ before: scrollBefore, after: await page.evaluate(() => scrollY), history: await page.evaluate(() => history.state?.galiaCatalog) })); });
      check('Back restores catalog scroll position', Math.abs(await page.evaluate(() => scrollY) - scrollBefore) < 180);
    }
    await page.locator('.shop-category-nav').getByRole('link', { name: 'Aretes', exact: true }).click();
    await page.waitForURL('**/coleccion/aretes');
    check('Category has its own route and correct products', (await page.locator('h1').textContent()).trim() === 'Aretes' && (await cards.locator('.shop-product-category').allTextContents()).every(text => text === 'Aretes'));
    const add = cards.getByRole('button', { name: /^Añadir / }).first();
    await add.click();
    const cart = page.locator('[role="dialog"][aria-labelledby="cart-title"]');
    await cart.waitFor();
    check('Cart loads on demand and locks background', await page.locator('main').evaluate(el => !!el.closest('[inert]')) && await page.evaluate(() => document.body.style.overflow === 'hidden'));
    const closeCart = cart.getByRole('button', { name: 'Cerrar pedido' });
    check('Cart receives initial focus', await closeCart.evaluate(el => el === document.activeElement));
    await page.keyboard.press('Shift+Tab');
    check('Cart traps reverse keyboard navigation', await cart.getByRole('button', { name: 'Vaciar pedido' }).evaluate(el => el === document.activeElement));
    await page.keyboard.press('Tab');
    const checkoutButton = cart.getByRole('button', { name: 'Enviar pedido por WhatsApp', exact: true });
    await checkoutButton.click();
    const checkout = page.getByRole('dialog', { name: 'Confirmar pedido por WhatsApp', exact: true });
    await checkout.waitFor();
    check('Nested checkout makes cart inert', await cart.evaluate(el => !!el.closest('[inert]')));
    await page.keyboard.press('Escape');
    check('Escape returns focus to the cart opener', await checkoutButton.evaluate(el => el === document.activeElement));
    await checkoutButton.click();
    await checkout.getByLabel('Nombre completo *', { exact: true }).fill('Prueba de interfaz');
    await checkout.getByLabel('Telefono *', { exact: true }).fill('8090000000');
    await checkout.getByLabel('Provincia *', { exact: true }).fill('Prueba');
    await checkout.getByLabel('Ciudad / Municipio *', { exact: true }).fill('Prueba');
    await checkout.getByLabel('Direccion principal *', { exact: true }).fill('Datos ficticios, no enviar');
    await page.evaluate(() => {
      window.__checkoutTest = { closed: 0, redirects: [] };
      window.open = () => ({ opener: null, location: { replace: target => window.__checkoutTest.redirects.push(target) }, close: () => window.__checkoutTest.closed++ });
    });
    let pendingRoute, requested = 0, succeed = false, started;
    const requestStarted = new Promise(resolve => { started = resolve; });
    await page.route('**/api/orders/whatsapp', async route => {
      requested++;
      if (!succeed) { pendingRoute = route; started(); }
      else await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, persisted: true, orderCode: code }) });
    });
    await checkout.getByRole('button', { name: 'Enviar por WhatsApp', exact: true }).click();
    await requestStarted;
    await page.keyboard.press('Escape');
    check('Pending checkout prevents closing', await checkout.isVisible() && await checkout.getByRole('button', { name: 'Cerrar confirmacion de pedido' }).isDisabled());
    await checkout.locator('form').evaluate(form => { form.requestSubmit(); form.requestSubmit(); });
    check('Pending checkout prevents duplicate POSTs', requested === 1);
    await pendingRoute.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, persisted: false, error: 'Fallo de registro simulado' }) });
    await checkout.getByRole('alert').waitFor();
    check('Failed order retains cart and never navigates to WhatsApp', await page.evaluate(() => JSON.parse(localStorage.getItem('galia-luna-cart-v1')).state.items.length > 0 && window.__checkoutTest.redirects.length === 0 && window.__checkoutTest.closed === 1));
    succeed = true;
    await checkout.getByRole('button', { name: 'Enviar por WhatsApp', exact: true }).click();
    await checkout.waitFor({ state: 'detached' });
    check('Persisted success clears cart and prepares one intercepted redirect', await page.evaluate(() => JSON.parse(localStorage.getItem('galia-luna-cart-v1')).state.items.length === 0 && window.__checkoutTest.redirects.length === 1));
    check('Success still requires WhatsApp confirmation', (await cart.textContent()).includes('Confirma el envío del mensaje en WhatsApp.'));
    await page.keyboard.press('Escape');
    await cart.waitFor({ state: 'detached' });
    check('Cart dismissal restores background', await page.locator('main').evaluate(el => !el.closest('[inert]')));
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ['/', '/coleccion']) {
        await page.goto(new URL(route, baseURL).href, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        check(`${route} at ${width}px has no document overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
        if (process.env.STOREFRONT_SCREENSHOTS && [390, 1440].includes(width)) {
          const file = path.join(process.env.STOREFRONT_SCREENSHOTS, `redesign-${route === '/' ? 'home' : 'collection'}-${width}.png`);
          await page.screenshot({ path: file, fullPage: true }); report.screenshots.push(file);
        }
      }
    }
    const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
    const native = await noJS.newPage();
    await native.goto(new URL('/coleccion?orden=price-asc', baseURL).href, { waitUntil: 'networkidle', timeout: 120000 });
    check('Price and stock controls are accessible without JavaScript', await native.locator('#catalog-price').isVisible() && await native.getByLabel('Solo stock confirmado', { exact: false }).isVisible());
    await native.locator('#catalog-price').fill('3500');
    await native.getByRole('button', { name: 'Aplicar búsqueda' }).click();
    await native.waitForURL('**hasta=3500**');
    check('Native GET filters work without JavaScript', (await native.locator('.shop-product-card').evaluateAll(nodes => nodes.map(node => Number(node.dataset.productPrice)))).every(price => price <= 3500));
    await noJS.close();
    check('No runtime errors', report.errors.length === 0);
    check('No hydration errors', report.hydrationErrors.length === 0);
  } finally {
    await browser.close();
    if (process.env.STOREFRONT_REPORT) fs.writeFileSync(process.env.STOREFRONT_REPORT, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
