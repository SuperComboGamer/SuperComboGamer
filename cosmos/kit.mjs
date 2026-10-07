// kit.mjs — tiny SVG toolkit: text-as-paths, defs registry, prng, helpers. Zero dependencies.
import { readFileSync } from 'node:fs';

export function loadFonts(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// deterministic PRNG (mulberry32)
export function rng(seed) {
  let a = typeof seed === 'string' ? hash(seed) : seed >>> 0;
  const f = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.range = (lo, hi) => lo + f() * (hi - lo);
  f.int = (lo, hi) => Math.floor(lo + f() * (hi - lo + 1));
  f.pick = (arr) => arr[Math.floor(f() * arr.length)];
  f.gauss = () => { let u = 0, v = 0; while (!u) u = f(); while (!v) v = f(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  return f;
}

export function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export const r1 = (v) => Math.round(v * 10) / 10;
export const r2 = (v) => Math.round(v * 100) / 100;
export const r3 = (v) => Math.round(v * 1000) / 1000;
export const fmtInt = (n) => Math.round(n).toLocaleString('en-US');
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A document collects defs + css and emits a self-contained SVG.
export class Doc {
  constructor({ width, height, fonts, title = '', desc = '' }) {
    this.w = width; this.h = height; this.fonts = fonts;
    this.title = title; this.desc = desc;
    this.defs = new Map();     // id -> markup
    this.css = [];
    this.glyphIds = new Map(); // fontKey|ch -> id
    this._uid = 0;
  }
  uid(prefix = 'u') { return `${prefix}${(this._uid++).toString(36)}`; }
  def(id, markup) { if (!this.defs.has(id)) this.defs.set(id, markup); return id; }
  style(css) { this.css.push(css); }

  font(key) {
    const f = this.fonts[key];
    if (!f) throw new Error(`font ${key} missing`);
    return f;
  }
  glyph(fontKey, ch) {
    const k = fontKey + '|' + ch;
    if (this.glyphIds.has(k)) return this.glyphIds.get(k);
    const f = this.font(fontKey);
    const g = f.glyphs[ch];
    if (!g) return null;
    const id = `${f.id}${ch.codePointAt(0).toString(36)}`;
    this.glyphIds.set(k, id);
    if (g[1]) this.defs.set(id, `<path id="${id}" d="${g[1]}"/>`);
    else this.defs.set(id, `<path id="${id}" d=""/>`);
    return id;
  }
  measure(str, { font, size, tracking = 0 }) {
    const f = this.font(font);
    let w = 0; const chars = [...str];
    chars.forEach((ch, i) => {
      const g = f.glyphs[ch] || f.glyphs['?'];
      w += g[0];
      if (i < chars.length - 1) w += tracking * f.upm + kern(f, ch, chars[i + 1]);
    });
    return w * size / f.upm;
  }
  // per-character x offsets (in px) for a run; useful for typing effects
  advances(str, { font, size, tracking = 0 }) {
    const f = this.font(font); const s = size / f.upm;
    const xs = []; let x = 0; const chars = [...str];
    chars.forEach((ch, i) => { xs.push(x * s); const g = f.glyphs[ch] || f.glyphs['?']; x += g[0] + tracking * f.upm + (i < chars.length - 1 ? kern(f, ch, chars[i + 1]) : 0); });
    xs.push(x * s - tracking * f.upm * s);
    return xs;
  }
  // text as <use> glyph references. Returns markup for a <g>.
  text(str, { font, size, x = 0, y = 0, anchor = 'start', tracking = 0, fill, cls, attrs = '', perChar = null }) {
    const f = this.font(font); const s = size / f.upm;
    const width = this.measure(str, { font, size, tracking });
    let x0 = x; if (anchor === 'middle') x0 = x - width / 2; else if (anchor === 'end') x0 = x - width;
    let pen = 0; const uses = []; const chars = [...str];
    chars.forEach((ch, i) => {
      const gch = f.glyphs[ch] ? ch : '?';
      const adv = f.glyphs[gch][0];
      if (ch !== ' ') {
        const id = this.glyph(font, gch);
        const extra = perChar ? perChar(i, ch) : '';
        uses.push(`<use href="#${id}" x="${Math.round(pen)}"${extra}/>`);
      }
      pen += adv + tracking * f.upm + (i < chars.length - 1 ? kern(f, ch, chars[i + 1]) : 0);
    });
    const a = [`transform="translate(${r2(x0)} ${r2(y)}) scale(${r3(s)} ${r3(-s)})"`];
    if (fill) a.push(`fill="${fill}"`);
    if (cls) a.push(`class="${cls}"`);
    if (attrs) a.push(attrs);
    return `<g ${a.join(' ')}>${uses.join('')}</g>`;
  }
  // text as ONE combined path (absolute canvas coords) — for clipping / continuous gradients
  textD(str, { font, size, x = 0, y = 0, anchor = 'start', tracking = 0, prec = 1 }) {
    const f = this.font(font); const s = size / f.upm;
    const width = this.measure(str, { font, size, tracking });
    let x0 = x; if (anchor === 'middle') x0 = x - width / 2; else if (anchor === 'end') x0 = x - width;
    const k = Math.pow(10, prec); const R = (v) => Math.round(v * k) / k;
    let pen = 0; const out = []; const chars = [...str];
    for (let ci = 0; ci < chars.length; ci++) {
      const ch = chars[ci];
      const gch = f.glyphs[ch] ? ch : '?';
      const [adv, d] = f.glyphs[gch];
      if (d) {
        const ox = x0 + pen * s;
        const toks = d.match(/[MLHVQCZ]|-?[\d.]+/g);
        let i = 0, cmd = '', cx = 0, cy = 0;
        while (i < toks.length) {
          const t = toks[i];
          if (/[MLHVQCZ]/.test(t)) { cmd = t; i++; if (cmd === 'Z') { out.push('Z'); } continue; }
          if (cmd === 'H') { cx = +toks[i++]; out.push('H' + R(ox + cx * s)); continue; }
          if (cmd === 'V') { cy = +toks[i++]; out.push('V' + R(y - cy * s)); continue; }
          const n = cmd === 'Q' ? 2 : cmd === 'C' ? 3 : 1; const pts = [];
          for (let j = 0; j < n; j++) { const px = +toks[i++], py = +toks[i++]; pts.push(R(ox + px * s) + ' ' + R(y - py * s)); cx = px; cy = py; }
          out.push(cmd + pts.join(' '));
        }
      }
      pen += adv + tracking * f.upm + (ci < chars.length - 1 ? kern(f, ch, chars[ci + 1]) : 0);
    }
    return out.join('');
  }
  render(body) {
    const defs = [...this.defs.values()].join('');
    const css = this.css.join('\n');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" role="img" aria-label="${esc(this.title)}">`
      + (this.title ? `<title>${esc(this.title)}</title>` : '')
      + (this.desc ? `<desc>${esc(this.desc)}</desc>` : '')
      + (css ? `<style>${css}</style>` : '')
      + `<defs>${defs}</defs>${body}</svg>`;
  }
}

function kern(f, a, b) { return (f.kern && f.kern[a + b]) || 0; }

// assign short ids to fonts
export function prepFonts(raw) {
  const out = {}; let i = 0;
  for (const [k, v] of Object.entries(raw)) { out[k] = { ...v, id: 'abcdefghijklmnopqrstuvwxyz'[i++] }; }
  return out;
}

// CSS helpers
export const pct = (v) => `${Math.round(v * 1000) / 1000}%`;
export function keyframes(name, stops) {
  // stops: [[percent, 'css decls'], ...]
  return `@keyframes ${name}{${stops.map(([p, d]) => `${Array.isArray(p) ? p.map(pct).join(',') : pct(p)}{${d}}`).join('')}}`;
}
export const b64 = (buf) => Buffer.from(buf).toString('base64');

// greedy word wrap using real glyph metrics
export function wrap(doc, text, { font, size, tracking = 0, width }) {
  const words = text.split(/\s+/); const lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (doc.measure(t, { font, size, tracking }) <= width || !cur) cur = t; else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// text along a circle arc. side 'top' reads clockwise over the top; 'bottom' reads left→right under the bottom.
export function arcText(doc, str, { font, size, r, tracking = 0, side = 'top', fill, cx = 0, cy = 0, attrs = '' }) {
  const f = doc.font(font); const s = size / f.upm;
  const xs = doc.advances(str, { font, size, tracking });
  const total = xs[xs.length - 1];
  const chars = [...str];
  const out = [];
  chars.forEach((ch, i) => {
    if (ch === ' ') return;
    const g = f.glyphs[ch] ? ch : '?';
    const adv = f.glyphs[g][0] * s;
    const mid = xs[i] + adv / 2 - total / 2; // px along arc from centre
    const id = doc.glyph(font, g);
    if (side === 'top') {
      const a = (mid / r) * 180 / Math.PI; // degrees from 12 o'clock, clockwise
      out.push(`<use href="#${id}" transform="translate(${cx} ${cy}) rotate(${r2(a)}) translate(${r2(-adv / 2)} ${-r}) scale(${r3(s)} ${r3(-s)})"/>`);
    } else {
      const a = -(mid / r) * 180 / Math.PI; // from 6 o'clock, counter-clockwise for left→right reading
      const capH = (f.cap || f.upm * 0.7) * s;
      out.push(`<use href="#${id}" transform="translate(${cx} ${cy}) rotate(${r2(a)}) translate(${r2(-adv / 2)} ${r2(r + capH)}) scale(${r3(s)} ${r3(-s)})"/>`);
    }
  });
  return `<g${fill ? ` fill="${fill}"` : ''} ${attrs}>${out.join('')}</g>`;
}
