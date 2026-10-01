const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function compileFile(filename, mocks = {}) {
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(path.dirname(filename));
  const ordinaryRequire = instance.require.bind(instance);
  instance.require = name => Object.prototype.hasOwnProperty.call(mocks, name) ? mocks[name] : ordinaryRequire(name);
  instance._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
  return instance.exports;
}
const productTypes = compileFile(path.join(root, 'types/product.ts'));
// Infrastructure and images are inert in this server-render test. Purchase decisions
// and the product summary execute the actual component without a browser or network.
const ProductDetailView = compileFile(path.join(root, 'components/store/ProductDetailView.tsx'), {
  'next/dynamic': () => () => null,
  'next/link': ({ children, ...props }) => React.createElement('a', props, children),
  '../../lib/contact': { WHATSAPP_OWNER_NUMBER: '00000000000' },
  '../../lib/storefront': { categoryHref: () => '/coleccion/anillos' },
  '../../store/cartStore': { useCartStore: selector => selector({ addItem() {}, openCart() {} }) },
  '../../types/product': productTypes,
  './ProductCard': () => null,
  './ProgressiveImage': ({ alt }) => React.createElement('img', { alt }),
  './useModalAccessibility': () => {},
  './product-detail.css': {},
}).default;
const product = { _id: 'ui-fixture', _type: 'product', name: 'Pieza de prueba', slug: { current: 'pieza-de-prueba' }, category: 'Anillos', description: 'Descripción del catálogo.', price: 500, currency: 'DOP', images: [], isActive: true };
const render = inventory => renderToStaticMarkup(React.createElement(ProductDetailView, { product: { ...product, inventory }, relatedProducts: [] }));
const primaryButton = markup => markup.match(/<button[^>]*class="pdp__button pdp__button--primary"[^>]*>/)?.[0];

test('PDP lets unknown stock become an enquiry order without claiming availability', () => {
  for (const inventory of [undefined, null]) {
    const markup = render(inventory);
    assert.match(markup, /Disponibilidad por confirmar/);
    assert.ok(primaryButton(markup) && !primaryButton(markup).includes('disabled'));
    assert.match(markup, /Comprar esta pieza por WhatsApp/);
    assert.doesNotMatch(markup, /piezas disponibles/);
  }
});
test('PDP blocks exhausted and invalid known stock but keeps a WhatsApp enquiry link', () => {
  for (const inventory of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    const markup = render(inventory);
    assert.match(primaryButton(markup), /disabled/);
    assert.doesNotMatch(markup, /Comprar esta pieza por WhatsApp/);
    assert.match(markup, /Consultar por WhatsApp/);
  }
});
test('PDP displays confirmed stock and enables both purchase paths', () => {
  for (const inventory of [1, 3]) {
    const markup = render(inventory);
    assert.match(markup, inventory === 1 ? /1 pieza disponible/ : /3 piezas disponibles/);
    assert.ok(primaryButton(markup) && !primaryButton(markup).includes('disabled'));
    assert.match(markup, /Comprar esta pieza por WhatsApp/);
  }
});
