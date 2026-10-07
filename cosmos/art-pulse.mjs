// art-pulse.mjs: the aipulsedaily side of the profile: hero, follow button, live drop pulse, NYC test, charts.
import { Doc, rng, keyframes, r1, r2, fmtInt, b64, wrap, esc } from './kit.mjs';
import { typer, clock } from './art-hero.mjs';

export const A = {
  navy: '#0A0E1C', void: '#04060E', cyan: '#50BEFF', hi: '#8FE3FF', ice: '#D9F3FF', white: '#FFFFFF',
  dim: '#8FA8C9', faint: '#5A6F91', violet: '#8F7BFF', gold: '#FFC163', amber: '#FF9A3D', green: '#5DFFB0', red: '#FF5F7E',
};
export const fmtK = (n) => { if (n == null) return 'n/a'; if (n >= 1e6) return (Math.round(n / 1e5) / 10).toString().replace(/\.0$/, '') + 'M'; if (n >= 1e4) return Math.round(n / 1e3) + 'K'; if (n >= 1e3) return (Math.round(n / 100) / 10).toString().replace(/\.0$/, '') + 'K'; return String(n); };
export const stamp = (iso) => iso ? `${iso.slice(5, 10).replace('-', '/')} ${iso.slice(11, 16)} UTC` : '';
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const corner = (W, H, col = A.cyan) => {
  const br = (x, y, sx, sy) => `<path d="M${x} ${y + sy * 24}V${y}H${x + sx * 24}" fill="none" stroke="${col}" stroke-opacity=".7" stroke-width="1.5"/>`;
  return br(24, 24, 1, 1) + br(W - 24, 24, -1, 1) + br(24, H - 24, 1, -1) + br(W - 24, H - 24, -1, -1);
};
const frameRect = (W, H, col = A.cyan, op = 0.28) => `<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="21.5" fill="none" stroke="${col}" stroke-opacity="${op}" stroke-width="1.5"/>`;
const starfield = (R, W, H, n, tint = ['#dff4ff', '#bfe9ff', '#ffffff']) => {
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${r1(R() * W)}" cy="${r1(R() * H)}" r="${r2(R.range(0.35, 1.1))}" fill="${R.pick(tint)}" opacity="${r2(R.range(0.2, 0.8))}"${R() < 0.22 ? ` class="tw" style="animation-delay:-${r1(R() * 5)}s"` : ''}/>`;
  return s;
};
const twCss = (css) => css.push(`.tw{animation:tw 3.8s ease-in-out infinite}`, keyframes('tw', [[0, 'opacity:.2'], [50, 'opacity:1'], [100, 'opacity:.2']]));
// the brand badge: brain logo + wordmark in a navy box with a cyan rim and a soft glow
function badge(doc, { cx, cy, logo, size = 56, filterId = 'fBadge' }) {
  const word = 'aipulsedaily';
  const tw = doc.measure(word, { font: 'bodyb', size, tracking: -0.01 });
  const lr = size * 0.62, pad = size * 0.42, gap = size * 0.3;
  const w = pad + lr * 2 + gap + tw + pad * 1.1, h = size * 1.6;
  const x = cx - w / 2, y = cy - h / 2;
  doc.def(filterId, `<filter id="${filterId}" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="${r1(size * 0.22)}"/></filter>`);
  doc.def('cLogo' + filterId, `<clipPath id="cLogo${filterId}"><circle cx="${r1(x + pad + lr)}" cy="${cy}" r="${r1(lr)}"/></clipPath>`);
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(h * 0.24)}" fill="none" stroke="${A.cyan}" stroke-width="5" opacity=".55" filter="url(#${filterId})"/>`
    + `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(h * 0.24)}" fill="${A.navy}" fill-opacity=".92" stroke="${A.cyan}" stroke-width="2"/>`
    + `<image href="data:image/jpeg;base64,${b64(logo)}" x="${r1(x + pad)}" y="${r1(cy - lr)}" width="${r1(lr * 2)}" height="${r1(lr * 2)}" clip-path="url(#cLogo${filterId})"/>`
    + `<circle cx="${r1(x + pad + lr)}" cy="${cy}" r="${r1(lr)}" fill="none" stroke="${A.cyan}" stroke-opacity=".5"/>`
    + doc.text(word, { font: 'bodyb', size, x: x + pad + lr * 2 + gap, y: cy + size * 0.36, fill: A.white, tracking: -0.01 });
}

// ======================= HERO =======================
export function pulseHero({ fonts, banner, logo, x, live, roles }) {
  const W = 1200, H = 700;
  const doc = new Doc({ width: W, height: H, fonts, title: 'aipulsedaily: signal over noise', desc: x.bio });
  const R = rng('pulse-hero');
  const css = [];
  const P = [];
  doc.def('frame', `<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>`);
  doc.def('gSky', `<radialGradient id="gSky" cx="600" cy="420" r="820" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0E1A3A"/><stop offset=".45" stop-color="${A.navy}"/><stop offset="1" stop-color="${A.void}"/></radialGradient>`);
  P.push(`<rect width="${W}" height="${H}" fill="url(#gSky)"/>`);
  // drifting starfield (two layers)
  const layer = (n, cls, dur) => { const t = starfield(R, W, H, n); css.push(`.${cls}{animation:drift ${dur}s linear infinite}`); return `<g class="${cls}"><g>${t}</g><g transform="translate(${W} 0)">${t}</g></g>`; };
  css.push(keyframes('drift', [[0, 'transform:translateX(0)'], [100, `transform:translateX(-${W}px)`]]));
  P.push(layer(150, 'sf1', 520), layer(50, 'sf2', 260));
  twCss(css);
  // the brand banner (brain + light streaks), screen-blended into the sky with soft top/bottom fades
  const by = 236, bh = 396;
  doc.def('gFade', `<linearGradient id="gFade" x1="0" y1="${by}" x2="0" y2="${by + bh}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".16" stop-color="#fff"/><stop offset=".86" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="mFade"><rect y="${by}" width="${W}" height="${bh}" fill="url(#gFade)"/></mask>`);
  P.push(`<g mask="url(#mFade)"><image class="ban" href="data:image/jpeg;base64,${b64(banner)}" x="0" y="${by}" width="${W}" height="${bh}" preserveAspectRatio="none" style="mix-blend-mode:screen"/></g>`);
  css.push(`.ban{animation:ban 5s ease-in-out infinite alternate}`, keyframes('ban', [[0, 'opacity:.82'], [100, 'opacity:1']]));
  // synapses firing over the brain
  const brain = { x0: 392, x1: 808, y0: by + 30, y1: by + 300 };
  for (let i = 0; i < 26; i++) {
    const x0 = R.range(brain.x0, brain.x1), y0 = R.range(brain.y0, brain.y1);
    const inside = (((x0 - 600) / 210) ** 2 + ((y0 - (by + 150)) / 140) ** 2) < 1;
    if (!inside) continue;
    P.push(`<circle cx="${r1(x0)}" cy="${r1(y0)}" r="${r1(R.range(2, 4))}" fill="${R() < 0.75 ? A.hi : A.violet}" class="syn" style="animation-delay:-${r2(R() * 4)}s;animation-duration:${r2(R.range(2.2, 4.4))}s"/>`);
  }
  doc.def('fSyn', `<filter id="fSyn" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.5"/></filter>`);
  css.push(`.syn{animation:syn 3s ease-in-out infinite;opacity:0}`, keyframes('syn', [[0, 'opacity:0'], [8, 'opacity:1'], [26, 'opacity:0'], [100, 'opacity:0']]));
  // glints racing along the light streaks into the brain
  const streak = (side, k) => {
    const yb = by + 186 + k * 9 - 18, amp = 26 + k * 6, ph = k * 0.9;
    const pts = [];
    const xa = side < 0 ? 0 : 1200, xb = side < 0 ? 470 : 730;
    for (let i = 0; i <= 24; i++) { const t = i / 24; const xx = xa + (xb - xa) * t; const yy = yb + Math.sin(t * Math.PI * 2.2 + ph) * amp * (1 - t * 0.7); pts.push(`${r1(xx)} ${r1(yy)}`); }
    return `M${pts.join('L')}`;
  };
  for (let k = 0; k < 5; k++) for (const side of [-1, 1]) {
    P.push(`<path d="${streak(side, k)}" fill="none" stroke="${A.hi}" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 70 1 140" class="gl" style="animation-delay:-${r2(R() * 3)}s;animation-duration:${r2(R.range(2.4, 3.6))}s"/>`);
  }
  css.push(`.gl{animation:gl 3s linear infinite;opacity:.9}`, keyframes('gl', [[0, 'stroke-dashoffset:213'], [100, 'stroke-dashoffset:0']]));

  // ---- headline ----
  P.push(doc.text('AI MODEL TELEMETRY  //  LIVE FROM THE FRONTIER', { font: 'hud', size: 12.5, x: 600, y: 58, anchor: 'middle', fill: A.cyan, tracking: 0.42 }));
  P.push(badge(doc, { cx: 600, cy: 124, logo, size: 58 }));
  // tagline with sweeping light
  const tg = 'SIGNAL OVER NOISE.';
  const tOpts = { font: 'title', size: 25, x: 600, y: 212, anchor: 'middle', tracking: 0.26 };
  const tD = doc.textD(tg, tOpts), tW = doc.measure(tg, tOpts);
  doc.def('pTag', `<path id="pTag" d="${tD}"/>`);
  doc.def('cTag', `<clipPath id="cTag"><use href="#pTag"/></clipPath>`);
  doc.def('fTag', `<filter id="fTag" x="-20%" y="-80%" width="140%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>`);
  doc.def('gSw', `<linearGradient id="gSw" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="${A.hi}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`);
  P.push(`<use href="#pTag" fill="${A.cyan}" opacity=".7" filter="url(#fTag)"/><use href="#pTag" fill="${A.white}"/>`);
  P.push(`<g clip-path="url(#cTag)"><rect class="tsw" x="${r1(600 - tW / 2 - 200)}" y="185" width="120" height="40" fill="url(#gSw)"/></g>`);
  css.push(`.tsw{animation:tsw 6s ease-in-out 1s infinite}`, keyframes('tsw', [[0, 'transform:translateX(0)'], [30, `transform:translateX(${r1(tW + 400)}px)`], [100, `transform:translateX(${r1(tW + 400)}px)`]]));
  P.push(doc.text("tracking every AI model drop, benchmark leak, and lab move so you don't have to", { font: 'body', size: 15, x: 600, y: 240, anchor: 'middle', fill: A.dim }));

  // ---- HUD cards over the banner ----
  const card = (cx0, cy0, w, h) => `<rect x="${cx0}" y="${cy0}" width="${w}" height="${h}" rx="14" fill="${A.navy}" fill-opacity=".72" stroke="${A.cyan}" stroke-opacity=".45"/>`;
  // left: now running (typed)
  P.push(card(40, 430, 318, 120));
  P.push(`<circle cx="62" cy="456" r="4.5" fill="${A.red}" class="live"/>`);
  css.push(`.live{animation:live 1.5s steps(1) infinite}`, keyframes('live', [[0, 'opacity:1'], [50, 'opacity:.15']]));
  P.push(doc.text('SIGNATURE RUNS', { font: 'hud', size: 11, x: 74, y: 460, fill: A.cyan, tracking: 0.28 }));
  P.push(typer(doc, css, { x: 60, y: 500, size: 16.5, roles, align: 'left', colors: { prefix: A.cyan, text: A.ice, last: A.hi, cursor: A.cyan } }));
  P.push(doc.text('full runs, nothing cut. numbers checked.', { font: 'mono', size: 11, x: 60, y: 532, fill: A.faint }));
  // right: account telemetry, live from X
  P.push(card(842, 430, 318, 120));
  P.push(`<circle cx="868" cy="456" r="4.5" fill="${A.green}" class="live"/>`);
  P.push(doc.text('LIVE ON X', { font: 'hud', size: 11, x: 880, y: 460, fill: A.cyan, tracking: 0.28 }));
  const num = (v) => (v == null ? '...' : fmtInt(v));
  const st = [[num(live.followers), 'FOLLOWERS'], [num(live.posts), 'POSTS'], [live.top == null ? '...' : fmtK(live.top), live.topLabel || 'TOP POST VIEWS']];
  st.forEach(([v, l], i) => {
    const sx = 862 + i * 100;
    P.push(doc.text(v, { font: 'heavy', size: 21, x: sx, y: 500, fill: A.white }));
    P.push(doc.text(l, { font: 'mono', size: 9.5, x: sx, y: 516, fill: A.dim, tracking: 0.08 }));
  });
  P.push(doc.text(`checked every 15 min${live.at ? ' · ' + live.at : ''}`, { font: 'mono', size: 11, x: 862, y: 538, fill: A.faint }));

  // ---- EKG monitor along the bottom ----
  const ey = 618, ex0 = 40, ex1 = 1160;
  let ek = `M${ex0} ${ey}`;
  for (let x0 = ex0; x0 < ex1 - 100; x0 += 140) {
    ek += `H${x0 + 70}l8 -6l6 6l7 -46l9 70l7 -30l6 6H${x0 + 140}`;
  }
  ek += `H${ex1}`;
  P.push(`<path d="${ek}" fill="none" stroke="${A.cyan}" stroke-opacity=".18" stroke-width="1.6"/>`);
  P.push(`<path d="${ek}" fill="none" stroke="${A.hi}" stroke-width="2.4" stroke-linejoin="round" class="ekg"/>`);
  css.push(`.ekg{stroke-dasharray:260 2400;animation:ekg 4.2s linear infinite}`, keyframes('ekg', [[0, 'stroke-dashoffset:260'], [100, 'stroke-dashoffset:-1660']]));
  P.push(doc.text('@aipulseda1ly ON X', { font: 'monob', size: 12, x: ex1, y: 664, anchor: 'end', fill: A.hi, tracking: 0.08 }));
  P.push(doc.text('OPERATED BY SUPERCOMBOGAMER', { font: 'mono', size: 11, x: ex0, y: 664, fill: A.faint, tracking: 0.1 }));

  // ---- corners ----
  P.push(`<circle cx="50" cy="50" r="4.5" fill="${A.red}" class="live"/>`);
  P.push(doc.text('LIVE', { font: 'monob', size: 12, x: 62, y: 54.5, fill: '#ff8fa3', tracking: 0.12 }));
  P.push(clock(doc, css, { xRight: W - 48, y: 56, size: 17, accent: A.cyan }));
  P.push(doc.text('SINCE YOU TUNED IN', { font: 'mono', size: 9.5, x: W - 48, y: 72, anchor: 'end', fill: A.faint, tracking: 0.1 }));
  P.push(corner(W, H));
  doc.def('gVig', `<radialGradient id="gVig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>`);
  P.push(`<rect width="${W}" height="${H}" fill="url(#gVig)"/>`);
  P.push(frameRect(W, H));
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}.tyl use{opacity:1!important}.syn{opacity:.6}}`);
  doc.style(css.join('\n'));
  return doc.render(`<g clip-path="url(#frame)">${P.join('')}</g>`);
}

// ======================= FOLLOW BUTTON =======================
export function followButton({ fonts, logo, handle }) {
  const W = 760, H = 132;
  const doc = new Doc({ width: W, height: H, fonts, title: `Follow @${handle} on X` });
  const css = [];
  const P = [];
  doc.def('gB', `<linearGradient id="gB" x1="0" x2="1"><stop offset="0" stop-color="${A.cyan}" stop-opacity=".26"/><stop offset="1" stop-color="${A.violet}" stop-opacity=".2"/></linearGradient>`);
  doc.def('gSw', `<linearGradient id="gSw" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`);
  doc.def('cB', `<clipPath id="cB"><rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="${(H - 16) / 2}"/></clipPath>`);
  doc.def('cL', `<clipPath id="cL"><circle cx="72" cy="${H / 2}" r="38"/></clipPath>`);
  P.push(`<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="${(H - 16) / 2}" fill="${A.navy}"/><rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="${(H - 16) / 2}" fill="url(#gB)"/>`);
  P.push(`<g clip-path="url(#cB)"><rect class="sw" x="-200" y="0" width="160" height="${H}" fill="url(#gSw)" transform="skewX(-20)"/></g>`);
  css.push(`.sw{animation:sw 3.4s ease-in-out infinite}`, keyframes('sw', [[0, 'transform:skewX(-20deg) translateX(0)'], [55, `transform:skewX(-20deg) translateX(${W + 400}px)`], [100, `transform:skewX(-20deg) translateX(${W + 400}px)`]]));
  P.push(`<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="${(H - 16) / 2}" fill="none" stroke="${A.cyan}" stroke-width="2.5"/>`);
  P.push(`<image href="data:image/jpeg;base64,${b64(logo)}" x="34" y="${H / 2 - 38}" width="76" height="76" clip-path="url(#cL)"/><circle cx="72" cy="${H / 2}" r="38" fill="none" stroke="${A.cyan}" stroke-opacity=".6"/>`);
  for (let k = 0; k < 2; k++) P.push(`<circle cx="72" cy="${H / 2}" r="40" fill="none" stroke="${A.cyan}" stroke-width="1.5" class="ring" style="animation-delay:${k * 1.1}s"/>`);
  css.push(`.ring{animation:ring 2.2s ease-out infinite;transform-origin:72px ${H / 2}px;opacity:0}`, keyframes('ring', [[0, 'transform:scale(1);opacity:.8'], [100, 'transform:scale(1.5);opacity:0']]));
  P.push(doc.text('FOLLOW', { font: 'heavy', size: 30, x: 134, y: 66, fill: A.white, tracking: 0.08 }));
  P.push(doc.text(`@${handle}`, { font: 'heavy', size: 30, x: 134 + doc.measure('FOLLOW ', { font: 'heavy', size: 30, tracking: 0.08 }) + 6, y: 66, fill: A.hi, tracking: 0.02 }));
  P.push(doc.text('on X · new model tests, usually the day they drop', { font: 'mono', size: 14, x: 136, y: 94, fill: A.dim }));
  P.push(`<g class="arr">${doc.text('→', { font: 'monob', size: 34, x: W - 56, y: 78, anchor: 'end', fill: A.cyan })}</g>`);
  css.push(`.arr{animation:arr 1.2s ease-in-out infinite}`, keyframes('arr', [[0, 'transform:translateX(0)'], [50, 'transform:translateX(8px)'], [100, 'transform:translateX(0)']]));
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}}`);
  doc.style(css.join('\n'));
  return doc.render(P.join(''));
}

// ======================= THE PULSE (live model drops) =======================
const LAB_COLORS = { Anthropic: '#FF9A6B', OpenAI: '#7DF9C0', Google: '#6FA8FF', Qwen: '#B18CFF', Meta: '#50BEFF', DeepSeek: '#5D8BFF', 'Z.ai': '#FFD36E', SpaceXAI: '#E8EEF8', Mistral: '#FF7A45', Xiaomi: '#FF9AC8', MoonshotAI: '#9BE7FF', Tencent: '#8FD6FF', inclusionAI: '#C7B8FF', Sakana: '#FF6FA8' };
export const labColor = (lab) => LAB_COLORS[lab] || '#7B8FB3';
const BIG = ['Anthropic', 'OpenAI', 'Google', 'SpaceXAI', 'Meta', 'DeepSeek', 'Qwen', 'Mistral', 'Z.ai', 'MoonshotAI'];
const mon = (iso) => MONTHS[+iso.slice(5, 7) - 1];
const money = (v) => v == null ? 'n/a' : v === 0 ? 'free' : v < 0.01 ? '$' + v.toFixed(3) : Number.isInteger(v) ? '$' + v : '$' + v.toFixed(2);
const ctxK = (n) => !n ? '' : n >= 1e6 ? (Math.round(n / 1e5) / 10).toString().replace(/\.0$/, '') + 'M ctx' : Math.round(n / 1024) + 'K ctx';

export function dropsPanel({ fonts, drops, at }) {
  const W = 1200, H = 660;
  const per = drops.perDay, N = per.length;
  const last30 = per.slice(-30).reduce((a, b) => a + b, 0), last90 = per.reduce((a, b) => a + b, 0);
  const doc = new Doc({ width: W, height: H, fonts, title: `The pulse: ${last30} new AI models in the last 30 days`, desc: 'Live model drops from the OpenRouter model list, refreshed every 15 minutes.' });
  const R = rng('drops');
  const css = [], P = [];
  doc.def('frame', `<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>`);
  doc.def('gBg', `<linearGradient id="gBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1430"/><stop offset="1" stop-color="${A.void}"/></linearGradient>`);
  P.push(`<rect width="${W}" height="${H}" fill="url(#gBg)"/>`, `<g>${starfield(R, W, H, 90)}</g>`);
  twCss(css);
  // header
  P.push(doc.text('THE PULSE', { font: 'hud', size: 15, x: 52, y: 66, fill: A.cyan, tracking: 0.34 }));
  P.push(doc.text('every new model on OpenRouter, the moment it lands. this chart redraws itself every 15 minutes.', { font: 'body', size: 14.5, x: 52, y: 92, fill: A.dim }));
  doc.def('gNum', `<linearGradient id="gNum" x1="${W - 300}" x2="${W - 52}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${A.cyan}"/></linearGradient>`);
  P.push(`<path d="${doc.textD(String(last30), { font: 'heavy', size: 44, x: W - 52, y: 84, anchor: 'end' })}" fill="url(#gNum)"/>`);
  P.push(doc.text('NEW MODELS · LAST 30 DAYS', { font: 'mono', size: 11, x: W - 52, y: 104, anchor: 'end', fill: A.dim, tracking: 0.1 }));
  // monitor grid
  const x0 = 70, x1 = 1130, base = 312, top = 140, step = (x1 - x0) / (N - 1), HMAX = 116;
  const grid = [];
  for (let y = top; y <= base + 30; y += 20) grid.push(`M${x0} ${y}H${x1}`);
  for (let i = 0; i < N; i += 7) grid.push(`M${r1(x0 + i * step)} ${top}V${base + 30}`);
  P.push(`<rect x="${x0 - 14}" y="${top - 14}" width="${x1 - x0 + 28}" height="${base - top + 58}" rx="12" fill="#06101F" stroke="${A.cyan}" stroke-opacity=".25"/>`);
  P.push(`<path d="${grid.join('')}" stroke="${A.cyan}" stroke-opacity=".07"/>`);
  // EKG path: one heartbeat per drop-day, height by number of drops
  const maxC = Math.max(1, ...per);
  let d = `M${x0} ${base}`;
  per.forEach((c, i) => {
    const x = x0 + i * step;
    if (c > 0) {
      const h = 22 + HMAX * Math.sqrt(c / maxC);
      d += `L${r1(x - 3.2)} ${base}L${r1(x - 1.6)} ${base + 7}L${r1(x)} ${r1(base - h)}L${r1(x + 1.8)} ${base + 12}L${r1(x + 3.6)} ${base}`;
    } else d += `L${r1(x)} ${base}`;
  });
  doc.def('fEkg', `<filter id="fEkg" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>`);
  P.push(`<path d="${d}" fill="none" stroke="${A.cyan}" stroke-opacity=".28" stroke-width="1.6" stroke-linejoin="round"/>`);
  P.push(`<path d="${d}" fill="none" stroke="${A.hi}" stroke-width="5" stroke-linejoin="round" filter="url(#fEkg)" opacity=".55" class="ekg"/>`);
  P.push(`<path d="${d}" fill="none" stroke="${A.white}" stroke-width="2" stroke-linejoin="round" class="ekg"/>`);
  P.push(`<circle r="5" fill="#fff"><animateMotion dur="6s" repeatCount="indefinite" path="${d}"/></circle>`);
  css.push(`.ekg{stroke-dasharray:420 4000;animation:ekg 6s linear infinite}`, keyframes('ekg', [[0, 'stroke-dashoffset:420'], [100, 'stroke-dashoffset:-3580']]));
  // month ticks + annotations for the three busiest days
  per.forEach((c, i) => {
    const dt = new Date(Date.parse(drops.start + 'T00:00:00Z') + i * 86400000).toISOString().slice(0, 10);
    if (dt.endsWith('-01')) { const x = x0 + i * step; P.push(`<path d="M${r1(x)} ${base + 30}v8" stroke="${A.cyan}" stroke-opacity=".5"/>`, doc.text(mon(dt), { font: 'mono', size: 11, x: x + 4, y: base + 44, fill: A.dim })); }
  });
  const top3 = [];
  for (const [c, i] of per.map((c, i) => [c, i]).sort((a, b) => b[0] - a[0] || b[1] - a[1])) { if (c > 1 && top3.length < 3 && top3.every(([, j]) => Math.abs(j - i) * step > 190)) top3.push([c, i]); }
  top3.forEach(([c, i]) => {
    const x = x0 + i * step, h = 22 + HMAX * Math.sqrt(c / maxC);
    const dt = new Date(Date.parse(drops.start + 'T00:00:00Z') + i * 86400000).toISOString().slice(0, 10);
    const seen = new Map();
    for (const m of (drops.latest || []).map((r) => [r.date, r.lab, r.id]).concat(drops.recent || [])) if (m[0] === dt) seen.set(m[5] || m[2], m[1]);
    const per = {}; for (const lab of seen.values()) per[lab] = (per[lab] || 0) + 1;
    const pri = (l) => { const k = BIG.indexOf(l); return k < 0 ? 99 : k; };
    const labs = Object.keys(per).sort((a, b) => per[b] - per[a] || pri(a) - pri(b)).slice(0, 2).join(' + ');
    const label = `${mon(dt)} ${+dt.slice(8)} · ${c} ${c === 1 ? 'DROP' : 'DROPS'}`;
    const lx = Math.min(x1 - 80, Math.max(x0 + 80, x));
    P.push(`<path d="M${r1(x)} ${r1(base - h - 4)}V${r1(base - h - 16)}" stroke="${A.gold}" stroke-opacity=".7"/>`);
    P.push(doc.text(label, { font: 'monob', size: 10.5, x: lx, y: r1(base - h - 22), anchor: 'middle', fill: A.gold }));
    if (labs) P.push(doc.text(labs, { font: 'mono', size: 10, x: lx, y: r1(base - h - 35), anchor: 'middle', fill: A.dim }));
  });
  // latest drops grid
  const ly = 392;
  P.push(doc.text('LATEST DROPS', { font: 'hud', size: 11, x: 56, y: ly - 14, fill: A.cyan, tracking: 0.28 }));
  P.push(doc.text(`${last90} in 90 days · ${fmtInt(drops.total)} models tracked`, { font: 'mono', size: 11, x: W - 56, y: ly - 14, anchor: 'end', fill: A.faint }));
  const newest = drops.latest[0] ? drops.latest[0].date : '';
  drops.latest.slice(0, 8).forEach((m, k) => {
    const col = k % 2, row = Math.floor(k / 2);
    const cx = 56 + col * 552, cy = ly + row * 58;
    P.push(`<rect x="${cx}" y="${cy}" width="532" height="48" rx="10" fill="#0A1428" fill-opacity=".85" stroke="${labColor(m.lab)}" stroke-opacity=".35"/>`);
    P.push(`<rect x="${cx}" y="${cy + 10}" width="3" height="28" rx="1.5" fill="${labColor(m.lab)}"/>`);
    P.push(doc.text(`${mon(m.date)} ${String(+m.date.slice(8)).padStart(2, '0')}`, { font: 'monob', size: 11.5, x: cx + 16, y: cy + 21, fill: A.dim }));
    P.push(doc.text(m.lab.toUpperCase().slice(0, 14), { font: 'mono', size: 9.5, x: cx + 16, y: cy + 37, fill: labColor(m.lab), tracking: 0.06 }));
    const name = m.model.length > 30 ? m.model.slice(0, 29) + '…' : m.model;
    P.push(doc.text(name, { font: 'bodyb', size: 16, x: cx + 128, y: cy + 22, fill: A.white }));
    const price = m.in === 0 && m.out === 0 ? 'free' : `${money(m.in)} in / ${money(m.out)} out per 1M`;
    P.push(doc.text(`${price}${m.ctx ? '  ·  ' + ctxK(m.ctx) : ''}`, { font: 'mono', size: 11, x: cx + 128, y: cy + 38, fill: A.hi }));
    if (m.date === newest) {
      P.push(`<rect x="${cx + 466}" y="${cy + 14}" width="52" height="20" rx="10" fill="${A.green}" fill-opacity=".16" stroke="${A.green}" stroke-opacity=".7" class="newb"/>`);
      P.push(doc.text('NEW', { font: 'monob', size: 10.5, x: cx + 492, y: cy + 28, anchor: 'middle', fill: A.green, tracking: 0.1 }));
    }
  });
  css.push(`.newb{animation:newb 1.6s ease-in-out infinite}`, keyframes('newb', [[0, 'opacity:.5'], [50, 'opacity:1'], [100, 'opacity:.5']]));
  P.push(doc.text(`SOURCE: OPENROUTER PUBLIC MODEL LIST · REFRESHED EVERY 15 MIN${at ? ' · LAST CHANGE ' + stamp(at) : ''}`, { font: 'mono', size: 10, x: 56, y: H - 30, fill: A.faint, tracking: 0.06 }));
  P.push(corner(W, H), frameRect(W, H));
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}}`);
  doc.style(css.join('\n'));
  return doc.render(`<g clip-path="url(#frame)">${P.join('')}</g>`);
}

// ======================= THE PRICE OF INTELLIGENCE (live) =======================
export function pricePanel({ fonts, drops, at }) {
  const W = 1200, H = 600;
  const rows = (drops.recent || []).map(([date, lab, model, pin, pout, id]) => ({ date, lab, model, pin, pout, id }));
  const doc = new Doc({ width: W, height: H, fonts, title: 'The price of intelligence: output price per 1M tokens of every new model', desc: `${rows.length} models released in the last 90 days, plotted by release date and price. Live from OpenRouter.` });
  const css = [], P = [];
  doc.def('frame', `<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>`);
  doc.def('gBg', `<linearGradient id="gBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B1430"/><stop offset="1" stop-color="${A.void}"/></linearGradient>`);
  P.push(`<rect width="${W}" height="${H}" fill="url(#gBg)"/>`);
  P.push(doc.text('THE PRICE OF INTELLIGENCE', { font: 'hud', size: 15, x: 52, y: 66, fill: A.cyan, tracking: 0.3 }));
  P.push(doc.text('what one million output tokens costs on every model released in the last 90 days.', { font: 'body', size: 14.5, x: 52, y: 92, fill: A.dim }));
  // plot area (log y)
  const px0 = 104, px1 = 760, py0 = 140, py1 = 500;
  const t0 = Date.parse(drops.start + 'T00:00:00Z'), t1 = Date.parse(drops.asOf + 'T00:00:00Z');
  const lo = Math.log10(0.05), hi = Math.log10(100);
  const X = (date) => px0 + (px1 - px0) * ((Date.parse(date + 'T00:00:00Z') - t0) / Math.max(1, t1 - t0));
  const Y = (v) => py1 - (py1 - py0) * ((Math.log10(Math.max(0.05, Math.min(100, v))) - lo) / (hi - lo));
  P.push(`<rect x="${px0 - 10}" y="${py0 - 10}" width="${px1 - px0 + 20}" height="${py1 - py0 + 20}" rx="12" fill="#06101F" stroke="${A.cyan}" stroke-opacity=".22"/>`);
  [0.1, 1, 10, 100].forEach((v) => { const y = r1(Y(v)); P.push(`<path d="M${px0} ${y}H${px1}" stroke="${A.cyan}" stroke-opacity=".12" stroke-dasharray="3 5"/>`, doc.text(v >= 1 ? `$${v}` : `$${v.toFixed(2)}`, { font: 'mono', size: 10.5, x: px0 - 16, y: y + 4, anchor: 'end', fill: A.dim })); });
  for (let i = 0; i <= 90; i++) { const dt = new Date(t0 + i * 86400000).toISOString().slice(0, 10); if (dt.endsWith('-01')) { const x = r1(X(dt)); P.push(`<path d="M${x} ${py1 + 10}v6" stroke="${A.cyan}" stroke-opacity=".5"/>`, doc.text(mon(dt), { font: 'mono', size: 10.5, x: x + 4, y: py1 + 26, fill: A.dim })); } }
  P.push(doc.text('OUTPUT $ / 1M TOKENS (LOG)', { font: 'mono', size: 9.5, x: px0 - 6, y: py0 - 18, fill: A.faint, tracking: 0.08 }));
  // dots (stagger-in animation), label the priciest five
  const sorted = rows.slice().sort((a, b) => b.pout - a.pout);
  const labelIds = new Set(sorted.slice(0, 5).map((r) => r.id));
  rows.forEach((r, i) => {
    const x = r1(X(r.date)), y = r1(Y(r.pout)), col = labColor(r.lab), big = labelIds.has(r.id);
    P.push(`<circle cx="${x}" cy="${y}" r="${big ? 7 : 4.6}" fill="${col}" fill-opacity="${big ? 0.95 : 0.75}" stroke="#06101F" stroke-width="1.2" class="dot" style="animation-delay:${r2(0.02 * i)}s"/>`);
  });
  css.push(`.dot{animation:dot .7s ease-out both;transform-box:fill-box;transform-origin:center}`, keyframes('dot', [[0, 'transform:scale(0);opacity:0'], [60, 'transform:scale(1.35);opacity:1'], [100, 'transform:scale(1);opacity:1']]));
  const placed = [];
  sorted.slice(0, 5).forEach((r) => {
    const x = X(r.date), y = Y(r.pout);
    const label = `${r.model} · ${money(r.pout)}`;
    const lw = doc.measure(label, { font: 'monob', size: 11 });
    const right = x + 12 + lw < px1 - 4;
    let ly = Math.max(py0 + 12, Math.min(py1 - 6, y + 4));
    while (placed.some((p) => Math.abs(p - ly) < 15)) ly += 15;
    placed.push(ly);
    if (Math.abs(ly - (y + 4)) > 2) P.push(`<path d="M${r1(x)} ${r1(y)}L${r1(right ? x + 9 : x - 9)} ${r1(ly - 4)}" stroke="${labColor(r.lab)}" stroke-opacity=".5"/>`);
    P.push(doc.text(label, { font: 'monob', size: 11, x: right ? x + 12 : x - 12, y: r1(ly), anchor: right ? 'start' : 'end', fill: labColor(r.lab), attrs: `stroke="#06101F" stroke-width="${Math.round(3.2 / (11 / doc.font('monob').upm))}" stroke-linejoin="round" paint-order="stroke"` }));
  });
  // right column: who shipped the most + extremes
  const cx = 810;
  P.push(doc.text('WHO SHIPPED THE MOST', { font: 'hud', size: 11, x: cx, y: 150, fill: A.cyan, tracking: 0.24 }));
  P.push(doc.text('models released, last 90 days', { font: 'mono', size: 10.5, x: cx, y: 168, fill: A.faint }));
  const labs = Object.entries(drops.labs90 || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const mx = Math.max(1, ...labs.map((l) => l[1]));
  labs.forEach(([lab, n], i) => {
    const y = 192 + i * 30, w = 200 * (n / mx);
    P.push(doc.text(lab.slice(0, 12), { font: 'mono', size: 12, x: cx, y: y + 13, fill: A.ice }));
    P.push(`<rect x="${cx + 108}" y="${y + 2}" width="${r1(w)}" height="14" rx="4" fill="${labColor(lab)}" fill-opacity=".85" class="bar" style="animation-delay:${r2(0.3 + i * 0.08)}s"/>`);
    P.push(doc.text(String(n), { font: 'monob', size: 12, x: cx + 116 + w, y: y + 13, fill: A.white }));
  });
  css.push(`.bar{animation:bar 1.1s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:left center}`, keyframes('bar', [[0, 'transform:scaleX(0)'], [100, 'transform:scaleX(1)']]));
  const priciest = sorted[0], cheapest = rows.filter((r) => r.pout > 0).sort((a, b) => a.pout - b.pout)[0];
  const med = (() => { const v = rows.map((r) => r.pout).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; })();
  const sy = 450;
  [['PRICIEST', priciest], ['CHEAPEST', cheapest]].forEach(([lab, r], i) => {
    if (!r) return;
    P.push(doc.text(lab, { font: 'hud', size: 10, x: cx, y: sy + i * 42, fill: A.dim, tracking: 0.2 }));
    P.push(doc.text(`${r.model}  ${money(r.pin)} / ${money(r.pout)}`, { font: 'monob', size: 12.5, x: cx, y: sy + 18 + i * 42, fill: labColor(r.lab) }));
  });
  if (med != null) P.push(doc.text(`MEDIAN OUTPUT PRICE  ${money(med)}`, { font: 'monob', size: 12, x: cx, y: sy + 100, fill: A.gold }));
  P.push(doc.text(`LIVE FROM OPENROUTER · ${rows.length} PRICED MODELS IN 90 DAYS${at ? ' · LAST CHANGE ' + stamp(at) : ''}`, { font: 'mono', size: 10, x: 56, y: H - 30, fill: A.faint, tracking: 0.06 }));
  P.push(corner(W, H), frameRect(W, H));
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}}`);
  doc.style(css.join('\n'));
  return doc.render(`<g clip-path="url(#frame)">${P.join('')}</g>`);
}

// ======================= COMMUNITY VOTE =======================
export function pollPanel({ fonts, poll, options, counts }) {
  const W = 1200, H = 120 + options.length * 56 + 70;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const doc = new Doc({ width: W, height: H, fonts, title: poll.question, desc: options.map((o) => `${o.model}: ${counts[o.id]} votes`).join('; ') });
  const css = [], P = [];
  doc.def('frame', `<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>`);
  P.push(`<rect width="${W}" height="${H}" fill="#070C1C"/>`);
  P.push(doc.text('COMMUNITY VOTE', { font: 'hud', size: 13, x: 52, y: 58, fill: A.cyan, tracking: 0.32 }));
  P.push(doc.text(poll.question, { font: 'bodyb', size: 24, x: 52, y: 92, fill: A.white }));
  P.push(doc.text(total ? `${total} ${total === 1 ? 'VOTE' : 'VOTES'}` : 'NO VOTES YET', { font: 'monob', size: 13, x: W - 52, y: 58, anchor: 'end', fill: A.gold, tracking: 0.1 }));
  P.push(doc.text('options are the newest drops, so the ballot changes live', { font: 'mono', size: 11, x: W - 52, y: 92, anchor: 'end', fill: A.faint }));
  const lead = Math.max(...Object.values(counts));
  options.forEach((o, i) => {
    const y = 122 + i * 56, n = counts[o.id] || 0, frac = total ? n / total : 0;
    const bw = 640;
    P.push(`<rect x="52" y="${y}" width="${W - 104}" height="44" rx="12" fill="#0B1530" stroke="${labColor(o.lab)}" stroke-opacity=".3"/>`);
    P.push(`<rect x="300" y="${y + 14}" width="${bw}" height="16" rx="8" fill="#13203F"/>`);
    if (n) P.push(`<rect x="300" y="${y + 14}" width="${r1(Math.max(16, bw * frac))}" height="16" rx="8" fill="${labColor(o.lab)}" class="pb" style="animation-delay:${r2(i * 0.1)}s"/>`);
    P.push(doc.text(String(i + 1), { font: 'heavy', size: 18, x: 74, y: y + 29, anchor: 'middle', fill: A.dim }));
    P.push(doc.text(o.model.length > 22 ? o.model.slice(0, 21) + '…' : o.model, { font: 'bodyb', size: 16.5, x: 96, y: y + 21, fill: A.white }));
    P.push(doc.text(`${o.lab} · ${mon(o.date)} ${+o.date.slice(8)}`, { font: 'mono', size: 10.5, x: 96, y: y + 37, fill: labColor(o.lab) }));
    P.push(doc.text(`${n}${total ? '  ·  ' + Math.round(frac * 100) + '%' : ''}`, { font: 'monob', size: 14, x: W - 76, y: y + 28, anchor: 'end', fill: n && n === lead ? A.gold : A.ice }));
  });
  css.push(`.pb{animation:pb 1.2s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:left center}`, keyframes('pb', [[0, 'transform:scaleX(0)'], [100, 'transform:scaleX(1)']]));
  P.push(doc.text('VOTE WITH THE BUTTONS BELOW · ONE VOTE PER GITHUB ACCOUNT · COUNTED BY A BOT IN ABOUT A MINUTE', { font: 'mono', size: 10.5, x: 52, y: H - 28, fill: A.faint, tracking: 0.05 }));
  P.push(frameRect(W, H));
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}}`);
  doc.style(css.join('\n'));
  return doc.render(`<g clip-path="url(#frame)">${P.join('')}</g>`);
}
export function voteChip({ fonts, option, n, i }) {
  const W = 236, H = 64;
  const doc = new Doc({ width: W, height: H, fonts, title: `Vote for ${option.model}` });
  const col = labColor(option.lab), P = [], css = [];
  P.push(`<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="16" fill="#0B1530" stroke="${col}" stroke-width="2"/>`);
  P.push(`<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="16" fill="${col}" fill-opacity=".08" class="pulse"/>`);
  css.push(`.pulse{animation:pulse 2.4s ease-in-out ${r2(i * 0.3)}s infinite}`, keyframes('pulse', [[0, 'fill-opacity:.04'], [50, 'fill-opacity:.2'], [100, 'fill-opacity:.04']]));
  P.push(doc.text('VOTE', { font: 'hud', size: 10, x: 18, y: 26, fill: col, tracking: 0.28 }));
  let name = option.model; while (doc.measure(name, { font: 'bodyb', size: 15.5 }) > W - 64 && name.length > 4) name = name.slice(0, -2).trimEnd() + '…';
  P.push(doc.text(name, { font: 'bodyb', size: 15.5, x: 18, y: 48, fill: A.white }));
  P.push(doc.text(`${n} ${n === 1 ? 'vote' : 'votes'}`, { font: 'monob', size: 11.5, x: W - 18, y: 26, anchor: 'end', fill: col }));
  P.push(`<g class="varr">${doc.text('→', { font: 'monob', size: 18, x: W - 18, y: 49, anchor: 'end', fill: col })}</g>`);
  css.push(`.varr{animation:varr 1.4s ease-in-out infinite}`, keyframes('varr', [[0, 'transform:translateX(-3px)'], [50, 'transform:translateX(2px)'], [100, 'transform:translateX(-3px)']]));
  doc.style(css.join('\n') + '@media (prefers-reduced-motion: reduce){*{animation:none!important}}');
  return doc.render(P.join(''));
}

// ======================= THE NYC SKYLINE TEST =======================
function skyline(doc, css, R, { x: vx, y: vy, w, h }) {
  const out = [];
  const hy = vy + Math.round(h * 0.74); // waterline
  doc.def('gNycSky', `<linearGradient id="gNycSky" x1="0" y1="${vy}" x2="0" y2="${hy}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#121842"/><stop offset=".34" stop-color="#352d6a"/><stop offset=".6" stop-color="#9c476f"/><stop offset=".8" stop-color="#ff8a3d"/><stop offset=".93" stop-color="#ffc163"/><stop offset="1" stop-color="#ffe2a0"/></linearGradient>`);
  doc.def('gNycSea', `<linearGradient id="gNycSea" x1="0" y1="${hy}" x2="0" y2="${vy + h}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#5b3a5e"/><stop offset=".25" stop-color="#2a2047"/><stop offset="1" stop-color="#0a0c22"/></linearGradient>`);
  doc.def('gNycSun', `<radialGradient id="gNycSun"><stop offset="0" stop-color="#fff6d8"/><stop offset=".18" stop-color="#ffd27a" stop-opacity=".9"/><stop offset=".45" stop-color="#ff9a3d" stop-opacity=".35"/><stop offset="1" stop-color="#ff7a3d" stop-opacity="0"/></radialGradient>`);
  out.push(`<rect x="${vx}" y="${vy}" width="${w}" height="${hy - vy}" fill="url(#gNycSky)"/>`);
  for (let i = 0; i < 40; i++) out.push(`<circle cx="${r1(vx + R() * w)}" cy="${r1(vy + R() * (h * 0.3))}" r="${r2(R.range(0.4, 1))}" fill="#fff" opacity="${r2(R.range(0.2, 0.7))}"${R() < 0.3 ? ` class="tw" style="animation-delay:-${r1(R() * 4)}s"` : ''}/>`);
  const sx = vx + w * 0.6, sy = hy - 132;
  const capH = (x, hgt) => (Math.abs(x - sx) < 74 ? Math.min(hgt, 96) : hgt);
  // thin clouds lit from below
  for (let i = 0; i < 5; i++) { const cy = vy + h * R.range(0.32, 0.55), cx = vx + R() * w, cw = R.range(90, 220); out.push(`<rect x="${r1(cx)}" y="${r1(cy)}" width="${r1(cw)}" height="${r2(R.range(2, 4.5))}" rx="2" fill="#ffb27a" opacity="${r2(R.range(0.18, 0.4))}" class="cloud" style="animation-delay:-${r1(R() * 40)}s"/>`); }
  css.push(`.cloud{animation:cloud 40s linear infinite}`, keyframes('cloud', [[0, 'transform:translateX(-60px)'], [100, `transform:translateX(${w * 0.4}px)`]]));
  out.push(`<circle cx="${r1(sx)}" cy="${r1(sy)}" r="210" fill="url(#gNycSun)" class="sunp"/><circle cx="${r1(sx)}" cy="${r1(sy)}" r="27" fill="#fff1c9"/>`);
  css.push(`.sunp{animation:sunp 4s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}`, keyframes('sunp', [[0, 'transform:scale(.94);opacity:.85'], [100, 'transform:scale(1.04);opacity:1']]));
  // three depth layers of towers
  const layer = (n, hmin, hmax, wmin, wmax, fill, op) => { let s = ''; let x = vx - 10; while (x < vx + w + 10) { const bw = R.range(wmin, wmax), bh = capH(x + bw / 2, R.range(hmin, hmax)); s += `<rect x="${r1(x)}" y="${r1(hy - bh)}" width="${r1(bw)}" height="${r1(bh + 2)}" fill="${fill}"/>`; x += bw + R.range(-2, 4); } return `<g opacity="${op}">${s}</g>`; };
  out.push(layer(0, 26, 92, 14, 34, '#8a5a86', 0.5));
  out.push(layer(0, 40, 130, 16, 30, '#3c2d5e', 0.85));
  // front layer with landmark towers and lit windows
  const front = [], wins = [], lights = [];
  const tower = (x, bw, bh) => { front.push(`<rect x="${r1(x)}" y="${r1(hy - bh)}" width="${r1(bw)}" height="${r1(bh + 2)}"/>`); for (let yy = hy - bh + 8; yy < hy - 6; yy += 7) for (let xx = x + 4; xx < x + bw - 4; xx += 6) if (R() < 0.34) wins.push(`<rect x="${r1(xx)}" y="${r1(yy)}" width="2.4" height="3.2"${R() < 0.12 ? ` class="wtw" style="animation-delay:-${r1(R() * 6)}s"` : ''} opacity="${r2(R.range(0.45, 1))}"/>`); };
  let x = vx - 6;
  const marks = { deco: vx + w * 0.34, crown: vx + w * 0.17, taper: vx + w * 0.82 };
  while (x < vx + w + 6) {
    const bw = R.range(18, 38);
    const near = Object.values(marks).some((m) => Math.abs(x + bw / 2 - m) < 40);
    tower(x, bw, capH(x + bw / 2, near ? R.range(40, 70) : R.range(50, 120)));
    x += bw + R.range(1, 5);
  }
  // art deco spire: setbacks + mast
  { const cx = marks.deco; const steps = [[52, 210], [40, 236], [28, 256], [16, 270]];
    steps.forEach(([bw, top]) => tower(cx - bw / 2, bw, top));
    front.push(`<rect x="${r1(cx - 2)}" y="${r1(hy - 318)}" width="4" height="50"/>`); lights.push([cx, hy - 320]); }
  // stepped crown with needle
  { const cx = marks.crown; tower(cx - 20, 40, 178);
    for (let k = 0; k < 4; k++) { const rw = 20 - k * 4.5, top = hy - 178 - k * 9; front.push(`<path d="M${r1(cx - rw)} ${r1(top + 2)}V${r1(top - 4)}A${r1(rw)} ${r1(rw * 0.9)} 0 0 1 ${r1(cx + rw)} ${r1(top - 4)}V${r1(top + 2)}Z"/>`); }
    front.push(`<path d="M${r1(cx - 2)} ${r1(hy - 218)}L${r1(cx)} ${r1(hy - 262)}L${r1(cx + 2)} ${r1(hy - 218)}Z"/>`);
    for (let k = 0; k < 3; k++) wins.push(`<path d="M${r1(cx - 12 + k * 3)} ${r1(hy - 188 - k * 9)}l2 -4" stroke="#ffd27a" stroke-width="1.4" opacity=".9"/>`); }
  // tapered glass tower with antenna
  { const cx = marks.taper, b = 27, t = 13, top = hy - 268;
    front.push(`<path d="M${r1(cx - b)} ${hy + 2}V${r1(hy - 40)}L${r1(cx - t)} ${r1(top)}H${r1(cx + t)}L${r1(cx + b)} ${r1(hy - 40)}V${hy + 2}Z"/>`);
    front.push(`<rect x="${r1(cx - 1.5)}" y="${r1(top - 58)}" width="3" height="60"/>`); lights.push([cx, top - 60]);
    for (let yy = top + 14; yy < hy - 8; yy += 9) wins.push(`<rect x="${r1(cx + 3)}" y="${r1(yy)}" width="${r1(t + (b - t) * ((yy - top) / (hy - top)) - 6)}" height="1.3" opacity=".55"/>`); }
  const frontSvg = `<g fill="#0e1130">${front.join('')}</g><g fill="#ffd27a">${wins.join('')}</g>`;
  out.push(frontSvg);
  css.push(`.wtw{animation:wtw 6s steps(1) infinite}`, keyframes('wtw', [[0, 'opacity:1'], [40, 'opacity:.15'], [55, 'opacity:1']]));
  lights.forEach(([lx, ly]) => out.push(`<circle cx="${r1(lx)}" cy="${r1(ly)}" r="2.6" fill="${A.red}" class="beacon"/>`));
  css.push(`.beacon{animation:beacon 1.8s steps(1) infinite}`, keyframes('beacon', [[0, 'opacity:1'], [50, 'opacity:.15']]));
  // birds
  for (let i = 0; i < 3; i++) out.push(`<path d="M0 0q4 -4 8 0q4 -4 8 0" fill="none" stroke="#1a1430" stroke-width="1.6" transform="translate(${r1(vx + 60 + i * 26)} ${r1(vy + h * 0.38 + i * 9)})" class="bird" style="animation-delay:-${i * 3}s"/>`);
  css.push(`.bird{animation:bird 26s linear infinite}`, keyframes('bird', [[0, 'transform:translate(-80px,0)'], [100, `transform:translate(${w + 80}px,-30px)`]]));
  // water: reflection, sun glitter, ripples
  out.push(`<rect x="${vx}" y="${hy}" width="${w}" height="${vy + h - hy}" fill="url(#gNycSea)"/>`);
  out.push(`<g transform="translate(0 ${2 * hy}) scale(1 -1)" opacity=".22">${frontSvg}</g>`);
  for (let k = 0; k < 14; k++) { const yy = hy + 4 + k * 7.5, ww = 70 - k * 3.6 + R.range(-6, 6); out.push(`<rect x="${r1(sx - ww / 2 + R.range(-6, 6))}" y="${r1(yy)}" width="${r1(Math.max(8, ww))}" height="2" rx="1" fill="#ffd27a" opacity="${r2(0.85 - k * 0.05)}" class="glit" style="animation-delay:-${r2(R() * 2)}s"/>`); }
  css.push(`.glit{animation:glit 2s ease-in-out infinite}`, keyframes('glit', [[0, 'opacity:.25'], [50, 'opacity:.95'], [100, 'opacity:.25']]));
  const rip = [];
  for (let k = 0; k < 9; k++) rip.push(`<path d="M${vx} ${r1(hy + 12 + k * 11)}H${vx + w}" stroke="#ffd9a8" stroke-opacity="${r2(0.16 - k * 0.012)}" stroke-dasharray="${r1(R.range(10, 30))} ${r1(R.range(20, 60))}" class="rip" style="animation-delay:-${r1(R() * 8)}s"/>`);
  out.push(rip.join(''));
  css.push(`.rip{animation:rip 8s linear infinite}`, keyframes('rip', [[0, 'stroke-dashoffset:0'], [100, 'stroke-dashoffset:-200']]));
  return out.join('');
}

export function nycPanel({ fonts, nyc, posts, at }) {
  const W = 1200, H = 664;
  const best = nyc.best.map((b) => ({ ...b, ...(posts?.[b.id] || {}) }));
  const doc = new Doc({ width: W, height: H, fonts, title: 'The NYC skyline test: one brief, every model', desc: `Best runs: ${best.map((b) => `${b.title} (${b.views ? fmtK(b.views) + ' views' : 'views loading'})`).join('; ')}` });
  const R = rng('nyc');
  const css = [], P = [];
  doc.def('frame', `<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>`);
  doc.def('gBg', `<linearGradient id="gBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B1430"/><stop offset="1" stop-color="${A.void}"/></linearGradient>`);
  P.push(`<rect width="${W}" height="${H}" fill="url(#gBg)"/>`, `<g>${starfield(R, W, H, 60)}</g>`);
  twCss(css);
  P.push(doc.text('THE NYC SKYLINE TEST', { font: 'hud', size: 15, x: 52, y: 66, fill: A.cyan, tracking: 0.3 }));
  P.push(doc.text(`one brief since ${nyc.since}. every model gets the exact same words. full runs, nothing cut.`, { font: 'body', size: 14.5, x: 52, y: 92, fill: A.dim }));
  // render window
  const wx = 52, wy = 122, ww = 660, wh = 470, bar = 34;
  doc.def('cView', `<clipPath id="cView"><rect x="${wx}" y="${wy + bar}" width="${ww}" height="${wh - bar}"/></clipPath>`);
  doc.def('fWin', `<filter id="fWin" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="10"/></filter>`);
  P.push(`<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="14" fill="${A.cyan}" opacity=".18" filter="url(#fWin)"/>`);
  P.push(`<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="14" fill="#070b1a"/>`);
  P.push(`<g clip-path="url(#cView)">${skyline(doc, css, R, { x: wx, y: wy + bar, w: ww, h: wh - bar })}`);
  // re-render scan on every model switch
  const N = nyc.chips.length, per = 2.6, T = N * per;
  doc.def('gScan', `<linearGradient id="gScan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="${A.hi}" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity=".7"/></linearGradient>`);
  P.push(`<rect x="${wx}" y="${wy + bar - 60}" width="${ww}" height="60" fill="url(#gScan)" class="rscan"/>`);
  css.push(`.rscan{animation:rscan ${per}s cubic-bezier(.5,0,.5,1) infinite}`, keyframes('rscan', [[0, 'transform:translateY(0);opacity:1'], [34, `transform:translateY(${wh - bar + 60}px);opacity:1`], [35, `transform:translateY(${wh - bar + 60}px);opacity:0`], [100, `transform:translateY(${wh - bar + 60}px);opacity:0`]]));
  // HUD inside the viewport
  nyc.chips.forEach((name, i) => {
    const tw = doc.measure(name, { font: 'bodyb', size: 17 });
    const bw = Math.max(tw, doc.measure('FACED THE TEST', { font: 'mono', size: 10, tracking: 0.14 })) + 56;
    P.push(`<g class="ch${i}"><rect x="${wx + 16}" y="${wy + bar + 16}" width="${r1(bw)}" height="50" rx="12" fill="#070b1a" fill-opacity=".72" stroke="${A.cyan}" stroke-opacity=".6"/>`
      + `<circle cx="${wx + 36}" cy="${wy + bar + 41}" r="9" fill="${A.green}" fill-opacity=".18" stroke="${A.green}"/><path d="M${wx + 31.5} ${wy + bar + 41}l3 3.2l5.5 -6.4" fill="none" stroke="${A.green}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
      + doc.text('FACED THE TEST', { font: 'mono', size: 10, x: wx + 54, y: wy + bar + 35, fill: A.hi, tracking: 0.14 })
      + doc.text(name, { font: 'bodyb', size: 17, x: wx + 54, y: wy + bar + 56, fill: A.white }) + `</g>`);
    const p0 = (i / N) * 100, p1 = ((i + 1) / N) * 100;
    const st = i === 0 ? [[0, 'opacity:1'], [p1, 'opacity:0'], [100, 'opacity:0']] : [[0, 'opacity:0'], [p0, 'opacity:1'], [p1, 'opacity:0'], [100, 'opacity:0']];
    css.push(`.ch${i}{animation:ch${i} ${r2(T)}s steps(1) infinite}`, keyframes(`ch${i}`, st));
  });
  P.push(doc.text('illustration · the real runs are on X', { font: 'mono', size: 10.5, x: wx + ww - 16, y: wy + bar + 24, anchor: 'end', fill: '#e8e2ff', attrs: 'opacity=".7"' }));
  P.push(`</g>`);
  // window chrome
  P.push(`<path d="M${wx} ${wy + bar}H${wx + ww}" stroke="${A.cyan}" stroke-opacity=".35"/>`);
  ['#ff5f7e', '#ffd36e', '#5dffb0'].forEach((c, i) => P.push(`<circle cx="${wx + 20 + i * 18}" cy="${wy + bar / 2}" r="5" fill="${c}" opacity=".85"/>`));
  P.push(doc.text('nyc-skyline.html', { font: 'monob', size: 12.5, x: wx + 84, y: wy + 21.5, fill: A.ice }));
  P.push(doc.text('three.js · one file · no assets', { font: 'mono', size: 11, x: wx + ww - 16, y: wy + 21.5, anchor: 'end', fill: A.dim }));
  P.push(`<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="14" fill="none" stroke="${A.cyan}" stroke-opacity=".55" stroke-width="1.5"/>`);
  // right column
  const cx = 748, cw = W - 52 - cx;
  P.push(doc.text('THE BRIEF', { font: 'hud', size: 11, x: cx, y: 140, fill: A.cyan, tracking: 0.28 }));
  const brief = wrap(doc, nyc.brief, { font: 'mono', size: 14, width: cw - 34 });
  const bh = brief.length * 22 + 24;
  P.push(`<rect x="${cx}" y="152" width="${cw}" height="${bh}" rx="10" fill="#0A1428" stroke="${A.cyan}" stroke-opacity=".3"/><rect x="${cx}" y="152" width="3" height="${bh}" rx="1.5" fill="${A.cyan}"/>`);
  brief.forEach((l, i) => P.push(doc.text(l, { font: 'mono', size: 14, x: cx + 18, y: 178 + i * 22, fill: A.ice })));
  let y = 152 + bh + 26;
  P.push(doc.text(`SAME BRIEF FOR EVERY MODEL SINCE ${nyc.since.toUpperCase()}`, { font: 'mono', size: 10.5, x: cx, y, fill: A.faint, tracking: 0.06 }));
  y += 40;
  P.push(doc.text('LABS ON THE BENCH', { font: 'hud', size: 11, x: cx, y, fill: A.cyan, tracking: 0.28 }));
  y += 14;
  let px = cx;
  nyc.labs.forEach((lab) => {
    const pw = doc.measure(lab, { font: 'monob', size: 12 }) + 22;
    if (px + pw > cx + cw) { px = cx; y += 32; }
    P.push(`<rect x="${r1(px)}" y="${y}" width="${r1(pw)}" height="24" rx="12" fill="${A.cyan}" fill-opacity=".08" stroke="${A.cyan}" stroke-opacity=".4"/>`);
    P.push(doc.text(lab, { font: 'monob', size: 12, x: px + pw / 2, y: y + 16.5, anchor: 'middle', fill: A.ice }));
    px += pw + 8;
  });
  y += 66;
  P.push(doc.text('BEST RUNS', { font: 'hud', size: 11, x: cx, y, fill: A.cyan, tracking: 0.28 }));
  P.push(`<circle cx="${r1(cx + cw - doc.measure('LIVE VIEWS ON X', { font: 'mono', size: 10, tracking: 0.08 }) - 10)}" cy="${y - 4}" r="3.5" fill="${A.green}" class="live"/>`);
  P.push(doc.text('LIVE VIEWS ON X', { font: 'mono', size: 10, x: cx + cw, y, anchor: 'end', fill: A.green, tracking: 0.08 }));
  css.push(`.live{animation:live 1.6s ease-in-out infinite}`, keyframes('live', [[0, 'opacity:1'], [50, 'opacity:.25'], [100, 'opacity:1']]));
  y += 14;
  best.forEach((b, i) => {
    const ry = y + i * 56;
    P.push(`<rect x="${cx}" y="${ry}" width="${cw}" height="48" rx="10" fill="#0A1428" stroke="${i === 0 ? A.gold : A.cyan}" stroke-opacity="${i === 0 ? 0.5 : 0.25}"/>`);
    P.push(doc.text(String(i + 1).padStart(2, '0'), { font: 'heavy', size: 16, x: cx + 14, y: ry + 30, fill: i === 0 ? A.gold : A.dim }));
    let t = b.title; while (doc.measure(t, { font: 'bodyb', size: 14.5 }) > cw - 150 && t.length > 4) t = t.slice(0, -2).trimEnd() + '…';
    if (t !== b.title && t.endsWith('……')) t = t.slice(0, -1);
    P.push(doc.text(t, { font: 'bodyb', size: 14.5, x: cx + 48, y: ry + 22, fill: A.white }));
    P.push(doc.text(b.likes != null ? `${fmtK(b.likes)} likes · ${fmtK(b.bookmarks)} bookmarks` : 'live stats loading', { font: 'mono', size: 10.5, x: cx + 48, y: ry + 38, fill: A.dim }));
    P.push(doc.text(b.views != null ? fmtK(b.views) : '...', { font: 'monob', size: 19, x: cx + cw - 14, y: ry + 25, anchor: 'end', fill: i === 0 ? A.gold : A.hi }));
    P.push(doc.text('VIEWS', { font: 'mono', size: 9.5, x: cx + cw - 14, y: ry + 39, anchor: 'end', fill: A.faint, tracking: 0.12 }));
  });
  P.push(doc.text(`VIEWS LIVE FROM X · REFRESHED EVERY 15 MIN${at ? ' · LAST CHANGE ' + stamp(at) : ''}`, { font: 'mono', size: 10, x: 52, y: H - 30, fill: A.faint, tracking: 0.06 }));
  P.push(corner(W, H), frameRect(W, H));
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}.ch0{opacity:1}}`);
  doc.style(css.join('\n'));
  return doc.render(`<g clip-path="url(#frame)">${P.join('')}</g>`);
}
