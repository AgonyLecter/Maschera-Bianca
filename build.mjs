/* ============================================================
   MASCHERA BIANCA — build
   src/index.html (sorgente leggibile, si modifica SOLO questo)
     -> index.html (pubblicato: JS minificato, cifrato, anti-ispezione)

   Uso:  npm install  &&  npm run build
   ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { minify } from 'terser';

const SRC = 'src/index.html', OUT = 'index.html';
let html = readFileSync(SRC, 'utf8');

/* ---------- helpers ---------- */
const seed32 = () => randomBytes(4).readUInt32LE(0) || 1;
// XOR with an LCG keystream, then base64. Decoder lives in the page (see loader()).
function encrypt(text, seed) {
  const bytes = Buffer.from(text, 'utf8'); let s = seed >>> 0;
  for (let i = 0; i < bytes.length; i++) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; bytes[i] ^= s >>> 24; }
  return bytes.toString('base64');
}
const DEC = 'function(b,s){b=atob(b);for(var u=new Uint8Array(b.length),i=0;i<b.length;i++){s=Math.imul(s,1103515245)+12345>>>0;u[i]=b.charCodeAt(i)^s>>>24}return new TextDecoder().decode(u)}';
function loader(code, module) {
  const seed = seed32(), data = encrypt(code, seed), v = '_' + randomBytes(3).toString('hex');
  return `<script>(function(${v}){var e=document.createElement('script');${module ? "e.type='module';" : ''}e.textContent=${v}("${data}",${seed});document.currentScript.after(e)})(${DEC})</script>`;
}
const cut = (open, close = '</script>') => {
  const a = html.indexOf(open); if (a < 0) throw new Error('script non trovato: ' + open);
  const b = html.indexOf(close, a); return { a, b: b + close.length, body: html.slice(a + open.length, b) };
};

/* ---------- 1. Firebase config: never in clear text ---------- */
const mod = cut('<script type="module">');
let modCode = mod.body.replace(/const firebaseConfig = (\{[\s\S]*?\});/, (_, obj) => {
  const json = JSON.stringify(Function('return ' + obj)()), seed = seed32();
  return `const firebaseConfig = JSON.parse((${DEC})("${encrypt(json, seed)}",${seed}));`;
});
if (modCode === mod.body) throw new Error('firebaseConfig non trovato');

/* ---------- 2. minify both scripts ---------- */
const main = cut('<script>\n\'use strict\';');
const terserOpts = { compress: { passes: 2, drop_console: ['log', 'info', 'debug'] }, mangle: true, format: { comments: false } };
const mainMin = (await minify("'use strict';" + main.body, terserOpts)).code;
const modMin = (await minify(modCode, { ...terserOpts, module: true })).code;

/* ---------- 3. anti-inspect guard (runs first, in <head>) ---------- */
const guardSrc = `(function(){
  var dead=false, stop=function(e){e.preventDefault();e.stopPropagation();return false;};
  document.addEventListener('contextmenu',stop,true);
  document.addEventListener('dragstart',stop,true);
  document.addEventListener('selectstart',function(e){var t=e.target;if(!(t&&t.closest&&t.closest('input,textarea')))stop(e);},true);
  document.addEventListener('keydown',function(e){
    var k=(e.code||'').replace('Key','')||'?',c=e.ctrlKey||e.metaKey;
    if(e.keyCode===123||e.key==='F12'||(c&&e.shiftKey&&'IJCK'.indexOf(k)>=0)||(e.metaKey&&e.altKey&&'IJCU'.indexOf(k)>=0)||(c&&!e.shiftKey&&(k==='U'||k==='S'||k==='P')))return stop(e);
  },true);
  function lock(){
    if(dead)return;dead=true;
    try{window.Sound&&Sound.ctx&&Sound.ctx.close();}catch(_){}
    document.documentElement.innerHTML='<head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Maschera Bianca</title></head><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#050407;color:#d3122a;font:700 7vmin Georgia,serif;text-align:center;letter-spacing:.08em">TI STO GUARDANDO.<br><small style="font-size:2.6vmin;color:#8a8494;letter-spacing:.3em">chiudi gli strumenti per sviluppatori e ricarica</small></body>';
    setInterval(function(){(function(){}).constructor('debugger')();},50);
  }
  // DevTools open => the debugger statement pauses execution: measure it.
  setInterval(function(){var t=performance.now();(function(){}).constructor('debugger')();if(performance.now()-t>150)lock();},900);
  try{console.log('%cALT.','color:#d3122a;font:700 48px Georgia');console.log('%cQuesto spazio non è per te. La Maschera Bianca ti osserva.','color:#8a8494;font:16px Georgia');}catch(_){}
})();`;
const guard = (await minify(guardSrc, { compress: true, mangle: true })).code;

/* ---------- 4. assemble ---------- */
const parts = [[mod.a, mod.b, loader(modMin, true)], [main.a, main.b, loader(mainMin, false)]].sort((x, y) => y[0] - x[0]);
for (const [a, b, rep] of parts) html = html.slice(0, a) + rep + html.slice(b);
html = html.replace('<head>', `<head>\n<script>${guard}</script>`)
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace('<html lang="it">', '<!-- Maschera Bianca · build ' + new Date().toISOString().slice(0, 10) + ' · sorgente in src/ -->\n<html lang="it">');
writeFileSync(OUT, html);
console.log(`OK ${OUT}: ${(html.length / 1024).toFixed(0)} KB (sorgente ${(readFileSync(SRC).length / 1024).toFixed(0)} KB)`);
