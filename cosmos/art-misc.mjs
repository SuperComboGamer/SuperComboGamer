// art-misc.mjs — section headers (dark/light), the secret ULTRA COMBO reveal, and the footer (dark/light).
import { Doc, rng, keyframes, r1, r2, b64 } from './kit.mjs';

const THEMES = {
  dark: { ink: '#eaf6ff', dim: '#8fa3c7', a: '#7df9ff', b: '#ff3dbb', c: '#9b7bff', line: '#7df9ff' },
  light: { ink: '#140f2e', dim: '#56607a', a: '#0e7490', b: '#c0267f', c: '#6d28d9', line: '#6d28d9' },
};

export function header({ fonts, num, title, sub, theme = 'dark', total = 7 }) {
  const T = THEMES[theme];
  const W = 1200, H = 116;
  const doc = new Doc({ width: W, height: H, fonts, title: `${num} — ${title}` });
  const css = [];
  const P = [];
  doc.def('gNumS', `<linearGradient id="gNumS" x1="0" x2="1"><stop offset="0" stop-color="${T.a}"/><stop offset="1" stop-color="${T.b}"/></linearGradient>`);
  const nd = doc.textD(num, { font: 'title', size: 60, x: 8, y: 84, tracking: 0.02 });
  P.push(`<path d="${nd}" fill="none" stroke="url(#gNumS)" stroke-width="1.8"/>`);
  P.push(`<path d="${nd}" fill="url(#gNumS)" opacity=".12"/>`);
  const tx = 8 + doc.measure(num, { font: 'title', size: 60, tracking: 0.02 }) + 26;
  P.push(doc.text(title, { font: 'hud', size: 29, x: tx, y: 62, fill: T.ink, tracking: 0.24 }));
  P.push(doc.text(sub, { font: 'mono', size: 14.5, x: tx + 2, y: 90, fill: T.dim }));
  const tw = doc.measure(title, { font: 'hud', size: 29, tracking: 0.24 });
  const lx0 = Math.max(tx + tw + 30, tx + doc.measure(sub, { font: 'mono', size: 14.5 }) + 30), lx1 = W - 110;
  if (lx1 - lx0 > 60) {
    const ticks = [];
    for (let x = lx0; x <= lx1; x += 24) ticks.push(`M${r1(x)} 51V${(Math.round((x - lx0) / 24) % 4 === 0) ? 61 : 56}`);
    P.push(`<path d="M${r1(lx0)} 51H${lx1}" stroke="${T.line}" stroke-opacity=".45" stroke-width="1.2"/><path d="${ticks.join('')}" stroke="${T.line}" stroke-opacity=".35"/>`);
    P.push(`<g class="scan"><circle cx="${r1(lx0)}" cy="51" r="3.6" fill="${T.b}"/><rect x="${r1(lx0 - 40)}" y="50" width="40" height="2" fill="${T.b}" opacity=".5"/></g>`);
    css.push(`.scan{animation:scan 5s cubic-bezier(.6,0,.4,1) infinite}`, keyframes('scan', [[0, 'transform:translateX(0);opacity:0'], [10, 'opacity:1'], [80, `transform:translateX(${r1(lx1 - lx0)}px);opacity:1`], [100, `transform:translateX(${r1(lx1 - lx0)}px);opacity:0`]]));
  }
  P.push(doc.text(`SEC ${num}/${String(total).padStart(2, '0')}`, { font: 'mono', size: 12, x: W - 8, y: 56, anchor: 'end', fill: T.dim, tracking: 0.1 }));
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}}`);
  doc.style(css.join('\n'));
  return doc.render(P.join(''));
}

export function combo({ fonts }) {
  const W = 1200, H = 460, cx = 600, cy = 205;
  const doc = new Doc({ width: W, height: H, fonts, title: 'ULTRA COMBO — secret unlocked' });
  const R = rng('combo');
  const css = [];
  const P = [];
  doc.def('frame', `<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>`);
  doc.def('gBoom', `<radialGradient id="gBoom" cx="${cx}" cy="${cy}" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#5a1a00"/><stop offset=".35" stop-color="#2a0624"/><stop offset="1" stop-color="#07030f"/></radialGradient>`);
  P.push(`<rect width="${W}" height="${H}" fill="url(#gBoom)"/>`);
  // rotating burst rays
  const rays = [];
  for (let i = 0; i < 24; i++) { const a0 = (i / 24) * 360, w = 360 / 24 / 2; rays.push(`<path d="M0 0L${r1(900 * Math.cos((a0 - w / 2) * Math.PI / 180))} ${r1(900 * Math.sin((a0 - w / 2) * Math.PI / 180))}L${r1(900 * Math.cos((a0 + w / 2) * Math.PI / 180))} ${r1(900 * Math.sin((a0 + w / 2) * Math.PI / 180))}Z" fill="${i % 2 ? '#ff3dbb' : '#ffd36e'}" opacity=".09"/>`); }
  P.push(`<g transform="translate(${cx} ${cy})"><g class="rays">${rays.join('')}</g></g>`);
  css.push(`.rays{animation:rays 24s linear infinite;transform-origin:0px 0px}`, keyframes('rays', [[0, 'transform:rotate(0deg)'], [100, 'transform:rotate(360deg)']]));
  // shockwaves
  for (let k = 0; k < 3; k++) P.push(`<circle cx="${cx}" cy="${cy}" r="60" fill="none" stroke="#ffd36e" stroke-width="3" class="shock" style="animation-delay:${k * 0.7}s"/>`);
  css.push(`.shock{animation:shock 2.1s ease-out infinite;transform-origin:${cx}px ${cy}px;opacity:0}`, keyframes('shock', [[0, 'transform:scale(.4);opacity:.9'], [100, 'transform:scale(7);opacity:0']]));
  // sparks
  for (let i = 0; i < 40; i++) {
    const a = R() * Math.PI * 2, d = R.range(160, 520);
    P.push(`<circle cx="${cx}" cy="${cy}" r="${r2(R.range(1.2, 3.2))}" fill="${R.pick(['#ffd36e', '#fff', '#ff9a3d', '#ff3dbb'])}" class="spk" style="--dx:${r1(Math.cos(a) * d)}px;--dy:${r1(Math.sin(a) * d * 0.6)}px;animation-delay:-${r2(R() * 2.4)}s"/>`);
  }
  css.push(`.spk{animation:spk 2.4s cubic-bezier(.1,.6,.3,1) infinite}`, keyframes('spk', [[0, 'transform:translate(0,0);opacity:1'], [100, 'transform:translate(var(--dx),var(--dy));opacity:0']]));
  // title
  const t = 'ULTRA COMBO!';
  const td = doc.textD(t, { font: 'heavy', size: 96, x: cx, y: cy + 34, anchor: 'middle', tracking: 0.03 });
  doc.def('gCombo', `<linearGradient id="gCombo" x1="0" y1="${cy - 50}" x2="0" y2="${cy + 40}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff6c2"/><stop offset=".45" stop-color="#ffd36e"/><stop offset=".75" stop-color="#ff7a2f"/><stop offset="1" stop-color="#ff3dbb"/></linearGradient>`);
  doc.def('fComboGlow', `<filter id="fComboGlow" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="12"/></filter>`);
  P.push(`<g class="shake"><path d="${td}" fill="#ff7a2f" opacity=".6" filter="url(#fComboGlow)"/><path d="${td}" fill="none" stroke="#2a0624" stroke-width="14" stroke-linejoin="round"/><path d="${td}" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="${td}" fill="url(#gCombo)"/></g>`);
  css.push(`.shake{animation:shake 2.6s steps(1) infinite}`, keyframes('shake', [[0, 'transform:translate(0,0)'], [2, 'transform:translate(-5px,3px)'], [4, 'transform:translate(4px,-3px)'], [6, 'transform:translate(-3px,-2px)'], [8, 'transform:translate(2px,2px)'], [10, 'transform:translate(0,0)'], [100, 'transform:translate(0,0)']]));
  // hit counter
  P.push(doc.text('10', { font: 'heavy', size: 54, x: cx - 8, y: cy - 82, anchor: 'end', fill: '#fff' }));
  P.push(doc.text('HITS', { font: 'heavy', size: 24, x: cx + 4, y: cy - 84, fill: '#ffd36e', tracking: 0.1 }));
  // key caps
  const keys = ['↑', '↑', '↓', '↓', '←', '→', '←', '→', 'B', 'A'];
  const kw = 44, kg = 10, kx0 = cx - (keys.length * kw + (keys.length - 1) * kg) / 2, ky = cy + 78;
  keys.forEach((k, i) => {
    const x = kx0 + i * (kw + kg);
    P.push(`<g class="kc" style="animation-delay:${r2(i * 0.12)}s"><rect x="${r1(x)}" y="${ky}" width="${kw}" height="${kw}" rx="9" fill="#170a26" stroke="${/[AB]/.test(k) ? '#ff3dbb' : '#ffd36e'}" stroke-width="2"/>`
      + doc.text(k, { font: 'monob', size: 22, x: x + kw / 2, y: ky + 30, anchor: 'middle', fill: '#fff' }) + `</g>`);
  });
  css.push(`.kc{animation:kc 2.6s ease-out infinite}`, keyframes('kc', [[0, 'opacity:.35'], [8, 'opacity:1'], [60, 'opacity:1'], [100, 'opacity:.35']]));
  P.push(doc.text('SECRET UNLOCKED  //  YOU ARE ONE OF THE FEW', { font: 'hud', size: 15, x: cx, y: H - 52, anchor: 'middle', fill: '#ffd36e', tracking: 0.3 }));
  P.push(`<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="21.5" fill="none" stroke="#ffd36e" stroke-opacity=".35" stroke-width="1.5"/>`);
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}}`);
  doc.style(css.join('\n'));
  return doc.render(`<g clip-path="url(#frame)">${P.join('')}</g>`);
}

export function footer({ fonts, bg, theme = 'dark', d }) {
  const W = 1200, H = 420, cx = 600, cy = 196;
  const dark = theme === 'dark';
  const doc = new Doc({ width: W, height: H, fonts, title: dark ? 'End of transmission' : 'Light mode detected' });
  const R = rng('footer-' + theme);
  const css = [];
  const P = [];
  doc.def('frame', `<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>`);
  if (dark) {
    P.push(`<rect width="${W}" height="${H}" fill="#03020a"/><image href="data:image/jpeg;base64,${b64(bg)}" width="${W}" height="${H}" preserveAspectRatio="none"/>`);
    // black hole: back disk, lensed ring, horizon, front disk
    doc.def('gDisk', `<linearGradient id="gDisk" x1="${cx - 260}" x2="${cx + 260}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff3dbb" stop-opacity="0"/><stop offset=".25" stop-color="#ffb066"/><stop offset=".45" stop-color="#fff3d6"/><stop offset=".6" stop-color="#ffcf8a"/><stop offset=".85" stop-color="#ff3dbb" stop-opacity=".6"/><stop offset="1" stop-color="#7b2cff" stop-opacity="0"/></linearGradient>`);
    doc.def('gLens', `<linearGradient id="gLens" x1="0" y1="${cy - 95}" x2="0" y2="${cy + 95}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff3d6"/><stop offset=".45" stop-color="#ffb066" stop-opacity=".7"/><stop offset=".55" stop-color="#ffb066" stop-opacity=".5"/><stop offset="1" stop-color="#ff7a2f" stop-opacity=".85"/></linearGradient>`);
    doc.def('fBH', `<filter id="fBH" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>`);
    doc.def('fBH2', `<filter id="fBH2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>`);
    doc.def('gHaloBH', `<radialGradient id="gHaloBH"><stop offset=".25" stop-color="#ffb066" stop-opacity=".35"/><stop offset=".6" stop-color="#ff3dbb" stop-opacity=".12"/><stop offset="1" stop-color="#7b2cff" stop-opacity="0"/></radialGradient>`);
    P.push(`<circle cx="${cx}" cy="${cy}" r="250" fill="url(#gHaloBH)"/>`);
    // back half of disk (upper arc of ellipse)
    P.push(`<path d="M${cx - 250} ${cy}A250 40 0 0 1 ${cx + 250} ${cy}" fill="none" stroke="url(#gDisk)" stroke-width="22" filter="url(#fBH)" opacity=".75"/>`);
    // lensed ring of the far side, arching over and under the hole
    P.push(`<ellipse cx="${cx}" cy="${cy}" rx="86" ry="82" fill="none" stroke="url(#gLens)" stroke-width="14" filter="url(#fBH2)" class="lens"/>`);
    P.push(`<ellipse cx="${cx}" cy="${cy}" rx="86" ry="82" fill="none" stroke="#fff6e6" stroke-width="2.4" opacity=".9"/>`);
    css.push(`.lens{animation:lens 3s ease-in-out infinite alternate}`, keyframes('lens', [[0, 'opacity:.8'], [100, 'opacity:1']]));
    // event horizon
    P.push(`<circle cx="${cx}" cy="${cy}" r="66" fill="#000"/><circle cx="${cx}" cy="${cy}" r="68" fill="none" stroke="#ffe7c2" stroke-width="1.6" opacity=".9"/>`);
    // front half of disk with swirling dashes
    P.push(`<path d="M${cx + 250} ${cy}A250 40 0 0 1 ${cx - 250} ${cy}" fill="none" stroke="url(#gDisk)" stroke-width="26" filter="url(#fBH)"/>`);
    P.push(`<path d="M${cx + 250} ${cy}A250 40 0 0 1 ${cx - 250} ${cy}" fill="none" stroke="url(#gDisk)" stroke-width="3.2"/>`);
    P.push(`<path d="M${cx + 235} ${cy + 3}A235 36 0 0 1 ${cx - 235} ${cy + 3}" fill="none" stroke="#fff6e6" stroke-width="2" stroke-dasharray="18 26" opacity=".55" class="swirl"/>`);
    P.push(`<path d="M${cx + 205} ${cy + 6}A205 31 0 0 1 ${cx - 205} ${cy + 6}" fill="none" stroke="#ffd36e" stroke-width="1.6" stroke-dasharray="10 30" opacity=".5" class="swirl2"/>`);
    css.push(`.swirl{animation:swirl 2.2s linear infinite}`, keyframes('swirl', [[0, 'stroke-dashoffset:0'], [100, 'stroke-dashoffset:-88']]),
      `.swirl2{animation:swirl2 1.6s linear infinite}`, keyframes('swirl2', [[0, 'stroke-dashoffset:0'], [100, 'stroke-dashoffset:-80']]));
    // infalling stars
    for (let i = 0; i < 5; i++) {
      const a = R() * Math.PI * 2, rr = R.range(280, 420);
      P.push(`<circle cx="${r1(cx + Math.cos(a) * rr)}" cy="${r1(cy + Math.sin(a) * rr * 0.5)}" r="1.8" fill="#fff" class="fall" style="--fx:${r1(-Math.cos(a) * rr)}px;--fy:${r1(-Math.sin(a) * rr * 0.5)}px;animation-delay:-${r2(R() * 6)}s"/>`);
    }
    css.push(`.fall{animation:fall 6s cubic-bezier(.5,0,.9,.4) infinite}`, keyframes('fall', [[0, 'transform:translate(0,0);opacity:0'], [10, 'opacity:1'], [95, 'transform:translate(var(--fx),var(--fy));opacity:.6'], [100, 'transform:translate(var(--fx),var(--fy));opacity:0']]));
    P.push(doc.text('END OF TRANSMISSION', { font: 'hud', size: 22, x: cx, y: 340, anchor: 'middle', fill: '#eaf6ff', tracking: 0.42 }));
    P.push(doc.text(`thanks for drifting by, traveler  ·  telemetry refreshes daily  ·  last sync ${d.today}`, { font: 'mono', size: 13, x: cx, y: 370, anchor: 'middle', fill: '#8fa3c7' }));
    P.push(`<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="21.5" fill="none" stroke="#7df9ff" stroke-opacity=".2" stroke-width="1.5"/>`);
  } else {
    doc.def('gDay', `<linearGradient id="gDay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#ffe9f6"/></linearGradient>`);
    doc.def('gSunL', `<radialGradient id="gSunL"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#fff3c4"/><stop offset=".55" stop-color="#ffcf5a" stop-opacity=".55"/><stop offset="1" stop-color="#ff9a3d" stop-opacity="0"/></radialGradient>`);
    P.push(`<rect width="${W}" height="${H}" fill="url(#gDay)"/>`);
    const rays = [];
    for (let i = 0; i < 16; i++) rays.push(`<path d="M0 -5L520 0L0 5Z" fill="#ffb84d" opacity=".16" transform="rotate(${i * 22.5})"/>`);
    P.push(`<g transform="translate(${cx} ${cy - 10})"><g class="rays">${rays.join('')}</g><circle r="190" fill="url(#gSunL)" class="sun"/><circle r="52" fill="#fff8dc"/></g>`);
    css.push(`.rays{animation:rays 40s linear infinite;transform-origin:0px 0px}`, keyframes('rays', [[0, 'transform:rotate(0deg)'], [100, 'transform:rotate(360deg)']]),
      `.sun{animation:sunp 2.5s ease-in-out infinite alternate;transform-origin:0px 0px}`, keyframes('sunp', [[0, 'transform:scale(.95)'], [100, 'transform:scale(1.06)']]));
    // sunglasses-wearing star? no: a tiny squinting astronaut visor glint
    P.push(doc.text('LIGHT MODE DETECTED', { font: 'hud', size: 22, x: cx, y: 330, anchor: 'middle', fill: '#140f2e', tracking: 0.42 }));
    P.push(doc.text("the void can't reach you out here. flip GitHub to dark mode for the full transmission.", { font: 'mono', size: 13, x: cx, y: 362, anchor: 'middle', fill: '#56607a' }));
    P.push(`<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="21.5" fill="none" stroke="#ffb84d" stroke-opacity=".5" stroke-width="1.5"/>`);
  }
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}}`);
  doc.style(css.join('\n'));
  return doc.render(`<g clip-path="url(#frame)">${P.join('')}</g>`);
}
