// art-hero.mjs: shared hero widgets, the typing role line and the live "since you tuned in" clock.
import { Doc, rng, keyframes, pct, r1, r2, fmtInt, b64 } from './kit.mjs';

const C = {
  void: '#04020c', ink: '#eaf6ff', dim: '#8fa3c7', cyan: '#7df9ff', cyan2: '#29e7ff',
  magenta: '#ff3dbb', violet: '#7b2cff', gold: '#ffd36e', planet: '#06031a',
};


// ---- typed role cycler: per-glyph visibility keyframes + stepping cursor ----
export function typer(doc, css, { x, y, size, roles, align = 'center', colors = {} }) {
  const font = 'mono';
  const cw = doc.measure('M', { font, size }); // monospace advance
  const prefix = '> ';
  const maxLen = Math.max(...roles.map((r) => r.length));
  const totalW = (prefix.length + maxLen) * cw;
  const x0 = align === 'left' ? x : x - totalW / 2; // left-align the block, centred on longest role
  const typeDt = 0.055, delDt = 0.022, hold = 1.9, gap = 0.35, lead = 0.3;
  let t = 0; const slots = [];
  roles.forEach((r, i) => {
    const holdK = i === roles.length - 1 ? hold * 1.9 : hold;
    const s = { r, t0: t + lead, t1: 0, t2: 0, t3: 0 };
    s.t1 = s.t0 + r.length * typeDt; s.t2 = s.t1 + holdK; s.t3 = s.t2 + r.length * delDt; t = s.t3 + gap; slots.push(s);
  });
  const T = t;
  const P = (v) => (v / T) * 100;
  const out = [];
  out.push(doc.text(prefix, { font: 'monob', size, x: x0, y, fill: colors.prefix || '#ff3dbb' }));
  const rx = x0 + prefix.length * cw;
  // per-glyph visibility
  let gid = 0;
  const kf = [];
  slots.forEach((s, k) => {
    const n = s.r.length;
    const g = doc.text(s.r, {
      font, size, x: rx, y, fill: k === slots.length - 1 ? (colors.last || '#7df9ff') : (colors.text || '#dfe8ff'), cls: k === slots.length - 1 ? 'tyl' : undefined,
      perChar: (i) => { const c = `ty${(gid++).toString(36)}`; const on = s.t0 + (i + 1) * typeDt; const off = s.t2 + (n - i) * delDt; kf.push([c, on, off]); return ` class="${c}"`; },
    });
    out.push(g);
  });
  kf.forEach(([c, on, off]) => {
    css.push(`.${c}{animation:${c} ${r2(T)}s steps(1) infinite;opacity:0}` + keyframes(c, [[0, 'opacity:0'], [P(on), 'opacity:1'], [P(off), 'opacity:0']]));
  });
  // cursor
  const stops = [[0, 'transform:translateX(0)']];
  slots.forEach((s) => {
    const n = s.r.length;
    stops.push([P(s.t0), `transform:translateX(0);animation-timing-function:steps(${n},end)`]);
    stops.push([P(s.t1), `transform:translateX(${r1(n * cw)}px)`]);
    stops.push([P(s.t2), `transform:translateX(${r1(n * cw)}px);animation-timing-function:steps(${n},end)`]);
    stops.push([P(s.t3), 'transform:translateX(0)']);
  });
  stops.push([100, 'transform:translateX(0)']);
  css.push(`.tcur{animation:tcur ${r2(T)}s linear infinite}` + keyframes('tcur', stops));
  css.push(`.tblink{animation:tblink 1s steps(1) infinite}` + keyframes('tblink', [[0, 'opacity:1'], [50, 'opacity:0'], [100, 'opacity:1']]));
  out.push(`<g class="tblink"><rect class="tcur" x="${r1(rx + 1)}" y="${r1(y - size * 0.78)}" width="${r1(cw * 0.62)}" height="${r1(size * 0.98)}" fill="${colors.cursor || '#7df9ff'}"/></g>`);
  return `<g>${out.join('')}</g>`;
}

// ---- odometer mission clock: T+ HH:MM:SS that starts when the image loads ----
export function clock(doc, css, { xRight, y, size, accent = '#7df9ff' }) {
  const font = 'monob';
  const cw = doc.measure('0', { font, size });
  const lh = size * 1.35;
  const label = 'T+ 00:00:00';
  const w = cw * label.length;
  const x0 = xRight - w;
  const out = [];
  out.push(doc.text('T+', { font, size, x: x0, y, fill: accent }));
  // digit positions in "T+ HH:MM:SS"
  const digits = [
    { i: 3, n: 10, period: 360000 }, { i: 4, n: 10, period: 36000 },
    { i: 6, n: 6, period: 3600 }, { i: 7, n: 10, period: 600 },
    { i: 9, n: 6, period: 60 }, { i: 10, n: 10, period: 10 },
  ];
  out.push(doc.text(':', { font, size, x: x0 + 5 * cw, y, fill: accent }));
  out.push(doc.text(':', { font, size, x: x0 + 8 * cw, y, fill: accent }));
  digits.forEach((d, k) => {
    const dx = x0 + d.i * cw;
    const id = `clk${k}`;
    doc.def(id, `<clipPath id="${id}"><rect x="${r1(dx - 1)}" y="${r1(y - size * 0.95)}" width="${r1(cw + 2)}" height="${r1(size * 1.2)}"/></clipPath>`);
    let strip = '';
    for (let v = 0; v <= d.n; v++) strip += doc.text(String(v % d.n), { font, size, x: dx, y: y + v * lh, fill: '#eaf6ff' });
    out.push(`<g clip-path="url(#${id})"><g class="${id}">${strip}</g></g>`);
    const roll = Math.min(0.22, d.period / d.n * 0.3);
    const stops = [];
    for (let v = 0; v < d.n; v++) {
      const a = (v / d.n) * 100, b = ((v + 1) / d.n) * 100 - (roll / d.period) * 100;
      stops.push([a, `transform:translateY(-${r2(v * lh)}px)`]);
      stops.push([b, `transform:translateY(-${r2(v * lh)}px)`]);
    }
    stops.push([100, `transform:translateY(-${r2(d.n * lh)}px)`]);
    css.push(`.${id}{animation:${id} ${d.period}s cubic-bezier(.6,0,.4,1) infinite}` + keyframes(id, stops));
  });
  return `<g>${out.join('')}</g>`;
}
