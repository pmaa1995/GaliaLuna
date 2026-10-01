const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/sanityImageLoader.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const loaded={exports:{}};
vm.runInNewContext(source,{module:loaded,exports:loaded.exports,URL});
const loader=loaded.exports.default;
test('Sanity images use the requested responsive width without double encoding and preserve crop',()=>{
 const url=new URL(loader({src:'https://cdn.sanity.io/images/project/production/image.jpg?w=1800&q=80&rect=0,0,600,800',width:420,quality:70}));
 assert.equal(url.hostname,'cdn.sanity.io'); assert.equal(url.searchParams.get('w'),'420'); assert.equal(url.searchParams.get('q'),'70'); assert.equal(url.searchParams.get('auto'),'format'); assert.equal(url.searchParams.get('fit'),'max'); assert.equal(url.searchParams.get('rect'),'0,0,600,800');
});
test('Image loader preserves local fallback and refuses unsupported external or script URLs',()=>{
 const fallback='/images/product-placeholder.svg';
 for(const src of ['javascript:alert(1)','https://other.example/image.jpg','http://cdn.sanity.io/images/a.jpg','https://user:password@cdn.sanity.io/images/a.jpg','https://cdn.sanity.io:444/images/a.jpg','https://cdn.sanity.io/files/a.pdf','//other.example/image.jpg']) assert.equal(loader({src,width:420}),fallback);
 assert.equal(loader({src:fallback,width:420}),fallback);
});
test('Invalid dimensions and quality cannot generate unbounded CDN variants',()=>{
 const src='https://cdn.sanity.io/images/project/production/a.jpg#fragment';
 const capped=new URL(loader({src,width:1e9,quality:Infinity}));
 assert.equal(capped.searchParams.get('w'),'2400'); assert.equal(capped.searchParams.get('q'),'75'); assert.equal(capped.hash,'');
 assert.equal(new URL(loader({src,width:NaN})).searchParams.get('w'),'1200');
});
