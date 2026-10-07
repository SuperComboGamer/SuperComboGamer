// art-missions.mjs: each big run as an embroidered mission patch with a living scene inside.
import { Doc, rng, keyframes, r1, r2, fmtInt, wrap, arcText } from './kit.mjs';

const C = { ink: '#eaf6ff', dim: '#8fa8c9', faint: '#5a6f91', cyan: '#50BEFF', hi: '#8FE3FF', gold: '#FFC163' };

export function missionPatch({ fonts, m, index }) {
  const W = 560, H = 740, cx = 280, cy = 262, RO = 196;
  const doc = new Doc({ width: W, height: H, fonts, title: `Mission ${index}: ${m.title}`, desc: m.desc });
  const R = rng('mission-' + m.key);
  const css = [];
  const P = [];
  const A = m.accent, B = m.accent2;
  doc.def('frame', `<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>`);
  doc.def('gCard', `<radialGradient id="gCard" cx="${cx}" cy="${cy}" r="540" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${m.glow}" stop-opacity=".6"/><stop offset=".5" stop-color="#0A0E1C"/><stop offset="1" stop-color="#04060E"/></radialGradient>`);
  P.push(`<rect width="${W}" height="${H}" fill="#04060E"/><rect width="${W}" height="${H}" fill="url(#gCard)"/>`);
  for (let i = 0; i < 70; i++) P.push(`<circle cx="${r1(R() * W)}" cy="${r1(R() * H)}" r="${r2(R.range(0.3, 1))}" fill="#dff4ff" opacity="${r2(R.range(0.15, 0.6))}"/>`);

  // ---- patch: cyan rim (the aipulsedaily badge colour), mission colour inside ----
  doc.def('cDisc', `<clipPath id="cDisc"><circle cx="${cx}" cy="${cy}" r="${RO - 52}"/></clipPath>`);
  doc.def('gRing', `<linearGradient id="gRing" x1="0" y1="${cy - RO}" x2="0" y2="${cy + RO}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#101a3a"/><stop offset="1" stop-color="#0A0E1C"/></linearGradient>`);
  doc.def('fSoft', `<filter id="fSoft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>`);
  P.push(`<circle cx="${cx}" cy="${cy}" r="${RO + 8}" fill="${C.cyan}" opacity=".35" filter="url(#fSoft)" class="halo"/>`);
  css.push(`.halo{animation:halo 4s ease-in-out infinite alternate}`, keyframes('halo', [[0, 'opacity:.18'], [100, 'opacity:.45']]));
  P.push(`<circle cx="${cx}" cy="${cy}" r="${RO}" fill="${C.cyan}"/>`);
  P.push(`<circle cx="${cx}" cy="${cy}" r="${RO - 7}" fill="url(#gRing)"/>`);
  P.push(`<circle cx="${cx}" cy="${cy}" r="${RO - 3.5}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-dasharray="4 4" class="stitch"/>`);
  css.push(`.stitch{animation:stitch 6s linear infinite}`, keyframes('stitch', [[0, 'stroke-dashoffset:0'], [100, 'stroke-dashoffset:-48']]));
  P.push(`<g clip-path="url(#cDisc)"><g transform="translate(${cx} ${cy})">${m.scene(doc, css, R)}</g></g>`);
  P.push(`<circle cx="${cx}" cy="${cy}" r="${RO - 52}" fill="none" stroke="${A}" stroke-width="5"/>`);
  P.push(`<circle cx="${cx}" cy="${cy}" r="${RO - 46}" fill="none" stroke="${B}" stroke-opacity=".5" stroke-width="1"/>`);
  P.push(arcText(doc, m.ringTop, { font: 'heavy', size: 25, r: RO - 40, tracking: 0.16, side: 'top', fill: C.ink, cx, cy }));
  P.push(arcText(doc, m.ringBottom, { font: 'hud', size: 14.5, r: RO - 40, tracking: 0.2, side: 'bottom', fill: B, cx, cy }));
  const star = (x, y, s) => `<path transform="translate(${r1(x)} ${r1(y)}) scale(${s})" d="M0 -9L2.2 -2.2L9 0L2.2 2.2L0 9L-2.2 2.2L-9 0L-2.2 -2.2Z" fill="${C.hi}"/>`;
  P.push(star(cx - RO + 28, cy, 1), star(cx + RO - 28, cy, 1));
  doc.def('gShine', `<linearGradient id="gShine" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`);
  doc.def('cPatch', `<clipPath id="cPatch"><circle cx="${cx}" cy="${cy}" r="${RO}"/></clipPath>`);
  P.push(`<g clip-path="url(#cPatch)"><rect class="shine" x="${cx - RO - 160}" y="${cy - RO}" width="110" height="${RO * 2}" fill="url(#gShine)" transform="skewX(-18)"/></g>`);
  css.push(`.shine{animation:shine 9s ease-in-out ${r1(index * 1.7)}s infinite}`, keyframes('shine', [[0, 'transform:skewX(-18deg) translateX(0)'], [22, `transform:skewX(-18deg) translateX(${RO * 2 + 380}px)`], [100, `transform:skewX(-18deg) translateX(${RO * 2 + 380}px)`]]));

  // ---- caption ----
  const ty = 512;
  P.push(doc.text(`MISSION 0${index}`, { font: 'mono', size: 13, x: 36, y: 46, fill: C.cyan, tracking: 0.2 }));
  if (m.badge) {
    const bw = doc.measure(m.badge, { font: 'monob', size: 12, tracking: 0.12 }) + 22;
    P.push(`<rect x="${W - 36 - bw}" y="28" width="${r1(bw)}" height="26" rx="13" fill="${C.gold}" fill-opacity=".14" stroke="${C.gold}" stroke-opacity=".6" class="bdg"/>`);
    P.push(doc.text(m.badge, { font: 'monob', size: 12, x: W - 36 - bw / 2, y: 45.5, anchor: 'middle', fill: C.gold, tracking: 0.12 }));
    css.push(`.bdg{animation:bdg 2s ease-in-out infinite}`, keyframes('bdg', [[0, 'fill-opacity:.08'], [50, 'fill-opacity:.3'], [100, 'fill-opacity:.08']]));
  }
  P.push(doc.text(m.title, { font: 'bodyb', size: 23, x: cx, y: ty, anchor: 'middle', fill: C.ink }));
  const lines = wrap(doc, m.desc, { font: 'body', size: 16.5, width: W - 84 });
  lines.slice(0, 3).forEach((l, i) => P.push(doc.text(l, { font: 'body', size: 16.5, x: cx, y: ty + 33 + i * 23, anchor: 'middle', fill: C.dim })));
  // live stat chips
  const chips = m.chips;
  const cs = 13, pad = 14, gap = 10;
  const widths = chips.map(([t, , live]) => doc.measure(t, { font: 'monob', size: cs, tracking: 0.06 }) + pad * 2 + (live ? 14 : 0));
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * (chips.length - 1);
  let x = cx - totalW / 2; const chipY = ty + 33 + Math.min(3, lines.length) * 23 + 10;
  chips.forEach(([t, col, live], i) => {
    P.push(`<rect x="${r1(x)}" y="${chipY}" width="${r1(widths[i])}" height="30" rx="15" fill="${col}" fill-opacity=".12" stroke="${col}" stroke-opacity=".55"/>`);
    if (live) { P.push(`<circle cx="${r1(x + pad + 3)}" cy="${chipY + 15}" r="3.5" fill="#5DFFB0" class="lv"/>`); css.push(`.lv{animation:lv 1.6s ease-in-out infinite}`, keyframes('lv', [[0, 'opacity:1'], [50, 'opacity:.25'], [100, 'opacity:1']])); }
    P.push(doc.text(t, { font: 'monob', size: cs, x: x + (live ? 14 : 0) + (widths[i] - (live ? 14 : 0)) / 2, y: chipY + 20, anchor: 'middle', fill: col, tracking: 0.06 }));
    x += widths[i] + gap;
  });
  if (m.cta) P.push(`<g class="cta">${doc.text(m.cta, { font: 'monob', size: 12.5, x: cx, y: chipY + 62, anchor: 'middle', fill: C.cyan, tracking: 0.14 })}</g>`);
  css.push(`.cta{animation:cta 2.4s ease-in-out infinite}`, keyframes('cta', [[0, 'opacity:.55'], [50, 'opacity:1'], [100, 'opacity:.55']]));
  P.push(`<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="21.5" fill="none" stroke="${C.cyan}" stroke-opacity=".35" stroke-width="1.5"/>`);
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}}`);
  doc.style(css.join('\n'));
  return doc.render(`<g clip-path="url(#frame)">${P.join('')}</g>`);
}

// ================= scenes (drawn in a disc of radius ~144 centred on 0,0) =================

export function sceneF1(doc, css, R) {
  const out = [];
  doc.def('gF1Sky', `<linearGradient id="gF1Sky" x1="0" y1="-150" x2="0" y2="150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1b0a2e"/><stop offset=".55" stop-color="#5a1430"/><stop offset=".7" stop-color="#ff7a3d"/><stop offset=".72" stop-color="#2a0f1e"/><stop offset="1" stop-color="#120814"/></linearGradient>`);
  out.push(`<rect x="-150" y="-150" width="300" height="300" fill="url(#gF1Sky)"/>`);
  // sun disc on horizon
  out.push(`<circle cx="40" cy="58" r="44" fill="#ffb84d" opacity=".9"/><g fill="#2a0f1e">${[0, 1, 2, 3].map((i) => `<rect x="-10" y="${44 + i * 7}" width="110" height="${1.5 + i * 0.8}"/>`).join('')}</g>`);
  // grandstand silhouettes
  out.push(`<path d="M-150 66L-150 40L-120 40L-120 30L-80 30L-80 46L-40 46L-40 58L150 58L150 66Z" fill="#2a0f1e" opacity=".9"/>`);
  // track + kerbs
  out.push(`<rect x="-150" y="66" width="300" height="90" fill="#141018"/>`);
  out.push(`<path d="M-160 74H160" stroke="#ff4d5e" stroke-width="5" stroke-dasharray="14 14" class="kerb"/><path d="M-160 74H160" stroke="#fff" stroke-width="5" stroke-dasharray="14 14" stroke-dashoffset="14" class="kerb"/>`);
  out.push(`<path d="M-160 118H160" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-dasharray="24 20" class="lane"/>`);
  css.push(`.kerb{animation:kerb .35s linear infinite}`, keyframes('kerb', [[0, 'stroke-dashoffset:0'], [100, 'stroke-dashoffset:28']]),
    `.lane{animation:lane .3s linear infinite}`, keyframes('lane', [[0, 'stroke-dashoffset:0'], [100, 'stroke-dashoffset:44']]));
  // speed streaks
  const streaks = [];
  for (let i = 0; i < 9; i++) { const y = R.range(-30, 60), l = R.range(40, 120); streaks.push(`<rect x="${r1(R.range(-140, 80))}" y="${r1(y)}" width="${r1(l)}" height="1.6" rx=".8" fill="#fff" opacity="${r2(R.range(0.15, 0.5))}" class="stk" style="animation-delay:-${r2(R() * 0.6)}s"/>`); }
  out.push(`<g>${streaks.join('')}</g>`);
  css.push(`.stk{animation:stk .6s linear infinite}`, keyframes('stk', [[0, 'transform:translateX(120px)'], [100, 'transform:translateX(-220px)']]));
  // the car (side view, facing right): an original stylised open-wheeler
  const body = '#f2f4fa', livery = '#ff4d5e', dark = '#16121c', carbon = '#2a2432';
  const wheel = (x, r) => `<g transform="translate(${x} ${52 - r + 19})"><circle r="${r}" fill="${dark}"/><circle r="${r * 0.58}" fill="#3a3346"/><g class="spinw"><path d="M${-r * 0.5} 0H${r * 0.5}M0 ${-r * 0.5}V${r * 0.5}" stroke="#8b829c" stroke-width="2.4"/></g><circle r="${r * 0.16}" fill="#ffb84d"/><path d="M${-r * 0.92} ${-r * 0.4}A${r} ${r} 0 0 1 ${r * 0.4} ${-r * 0.92}" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="2"/></g>`;
  out.push(`<g class="car" transform="translate(-4 0)">`
    + `<ellipse cx="0" cy="73" rx="124" ry="5" fill="#000" opacity=".5"/>`
    // rear wing + endplate + DRS flap
    + `<path d="M-120 2H-92V8H-120Z" fill="${livery}"/><path d="M-118 10H-94V14H-118Z" fill="${carbon}"/><path d="M-121 0V38H-116V0Z" fill="${dark}"/><path d="M-104 14L-98 40H-106Z" fill="${dark}"/>`
    // floor / plank
    + `<path d="M-108 48H112L118 52H-106Z" fill="${carbon}"/>`
    // engine cover + sidepod (between the wheels)
    + `<path d="M-96 46V36Q-92 28 -70 26L-34 22Q-28 6 -16 6Q-6 6 -2 20L44 30L112 40Q118 42 118 46Z" fill="${body}"/>`
    + `<path d="M-90 44L-60 32L40 36L112 44Z" fill="${livery}"/>`
    + `<path d="M-34 22L-26 14H-18L-12 22Z" fill="${dark}" opacity=".8"/>`
    // halo + helmet
    + `<path d="M-6 22Q4 8 22 18" fill="none" stroke="${dark}" stroke-width="3.6" stroke-linecap="round"/>`
    + `<circle cx="6" cy="21" r="6" fill="#ffd36e"/><path d="M2 20H11" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>`
    // front wing (low, at the very front) + endplate
    + `<path d="M98 52H140V56H96Z" fill="${dark}"/><path d="M104 46H138V50H104Z" fill="${livery}"/><path d="M136 40V56H141V40Z" fill="${dark}"/>`
    + wheel(-80, 21) + wheel(80, 18)
    + `<circle cx="-52" cy="37" r="7" fill="#fff"/><g fill="${dark}">${doc.text('5', { font: 'heavy', size: 10, x: -52, y: 40.6, anchor: 'middle' })}</g>`
    + `</g>`);
  css.push(`.spinw{animation:spinw .18s linear infinite;transform-origin:0px 0px}`, keyframes('spinw', [[0, 'transform:rotate(0deg)'], [100, 'transform:rotate(90deg)']]),
    `.car{animation:car 2.4s ease-in-out infinite}`, keyframes('car', [[0, 'transform:translate(-4px,0)'], [50, 'transform:translate(0px,-1px)'], [100, 'transform:translate(-4px,0)']]));
  // camera overlay: REC, 4K, timecode
  out.push(`<g opacity=".95"><circle cx="-92" cy="-78" r="5" fill="#ff3b3b" class="recd"/>`
    + doc.text('REC', { font: 'monob', size: 12, x: -82, y: -73.5, fill: '#fff', tracking: 0.1 })
    + doc.text('4K', { font: 'monob', size: 12, x: 92, y: -73.5, anchor: 'end', fill: '#fff' })
    + doc.text('ONE TAKE · 00:02:04', { font: 'mono', size: 10.5, x: 0, y: -96, anchor: 'middle', fill: '#ffd9b0' })
    + `<path d="M-104 -60V-90H-74M104 -60V-90H74" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/></g>`);
  css.push(`.recd{animation:recd 1.2s steps(1) infinite}`, keyframes('recd', [[0, 'opacity:1'], [50, 'opacity:.1']]));
  return out.join('');
}

export function sceneNight(doc, css, R) {
  const out = [];
  doc.def('gNightSky', `<linearGradient id="gNightSky" x1="0" y1="-150" x2="0" y2="150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#090418"/><stop offset=".6" stop-color="#2b0d2b"/><stop offset="1" stop-color="#3a0b14"/></linearGradient>`);
  doc.def('gMoon', `<radialGradient id="gMoon" cx=".4" cy=".35"><stop offset="0" stop-color="#fff8e8"/><stop offset=".7" stop-color="#ffe2b0"/><stop offset="1" stop-color="#e8b27a"/></radialGradient>`);
  doc.def('gMoonGlow', `<radialGradient id="gMoonGlow"><stop offset=".3" stop-color="#ffcc66" stop-opacity=".35"/><stop offset="1" stop-color="#ff3b3b" stop-opacity="0"/></radialGradient>`);
  out.push(`<rect x="-150" y="-150" width="300" height="300" fill="url(#gNightSky)"/>`);
  for (let i = 0; i < 26; i++) out.push(`<circle cx="${r1(R.range(-140, 140))}" cy="${r1(R.range(-140, 20))}" r="${r2(R.range(0.4, 1.2))}" fill="#fff" opacity="${r2(R.range(0.3, 0.9))}"/>`);
  out.push(`<circle cx="38" cy="-46" r="90" fill="url(#gMoonGlow)" class="mglow"/><circle cx="38" cy="-46" r="42" fill="url(#gMoon)"/>`);
  out.push(`<g fill="#e3a868" opacity=".45"><circle cx="24" cy="-58" r="7"/><circle cx="50" cy="-34" r="5"/><circle cx="54" cy="-62" r="3.5"/><circle cx="30" cy="-28" r="3"/></g>`);
  css.push(`.mglow{animation:mglow 5s ease-in-out infinite alternate}`, keyframes('mglow', [[0, 'opacity:.7'], [100, 'opacity:1']]));
  // dead trees
  out.push(`<g stroke="#0b0510" stroke-width="5" stroke-linecap="round" fill="none"><path d="M-112 80V-10M-112 20L-132 -6M-112 4L-94 -20M-94 -20L-88 -36M-112 -10L-120 -30"/><path d="M118 80V0M118 30L100 10M118 14L136 -6M100 10L96 -4" stroke-width="4"/></g>`);
  // cabin with boarded window
  out.push(`<g transform="translate(-44 6)"><path d="M0 74V24L44 -6L88 24V74Z" fill="#100714"/><path d="M-6 26L44 -10L94 26" fill="none" stroke="#1c0c22" stroke-width="6" stroke-linejoin="round"/>`
    + `<rect x="24" y="30" width="40" height="30" fill="#ff9a3d" class="win"/>`
    + `<g class="eyes"><ellipse cx="38" cy="44" rx="3.6" ry="2" fill="#ff2a2a"/><ellipse cx="50" cy="44" rx="3.6" ry="2" fill="#ff2a2a"/></g>`
    + `<g fill="#6b3a24" stroke="#2a130b" stroke-width="1"><rect x="18" y="33" width="52" height="7" rx="1" transform="rotate(-12 44 36)"/><rect x="18" y="47" width="52" height="7" rx="1" transform="rotate(9 44 50)"/></g>`
    + `<rect x="8" y="46" width="12" height="28" fill="#1c0c22"/></g>`);
  css.push(`.win{animation:win 3.3s steps(1) infinite}`, keyframes('win', [[0, 'opacity:.85'], [8, 'opacity:.35'], [10, 'opacity:.9'], [55, 'opacity:.7'], [57, 'opacity:.3'], [60, 'opacity:.85']]),
    `.eyes{animation:eyes 4.6s steps(1) infinite}`, keyframes('eyes', [[0, 'opacity:0'], [40, 'opacity:1'], [44, 'opacity:0'], [46, 'opacity:1'], [70, 'opacity:0']]));
  // eyes in the dark (ground)
  [[-122, 104, 0], [96, 112, 1.7], [-70, 124, 3.1]].forEach(([x, y, dl], i) => {
    out.push(`<g class="eye2" style="animation-delay:${dl}s"><ellipse cx="${x}" cy="${y}" rx="3.4" ry="1.8" fill="#ff2a2a"/><ellipse cx="${x + 10}" cy="${y}" rx="3.4" ry="1.8" fill="#ff2a2a"/></g>`);
  });
  css.push(`.eye2{animation:eye2 5.2s steps(1) infinite;opacity:0}`, keyframes('eye2', [[0, 'opacity:0'], [30, 'opacity:1'], [33, 'opacity:0'], [35, 'opacity:1'], [62, 'opacity:0']]));
  // ground + fog
  out.push(`<path d="M-150 80Q-60 70 0 80T150 78V150H-150Z" fill="#07030a"/>`);
  doc.def('gFog', `<linearGradient id="gFog" x1="0" x2="1"><stop offset="0" stop-color="#c9a3ff" stop-opacity="0"/><stop offset=".5" stop-color="#c9a3ff" stop-opacity=".22"/><stop offset="1" stop-color="#c9a3ff" stop-opacity="0"/></linearGradient>`);
  out.push(`<g class="fog"><rect x="-300" y="70" width="300" height="26" rx="13" fill="url(#gFog)"/><rect x="0" y="70" width="300" height="26" rx="13" fill="url(#gFog)"/><rect x="-200" y="96" width="260" height="20" rx="10" fill="url(#gFog)"/><rect x="60" y="96" width="260" height="20" rx="10" fill="url(#gFog)"/></g>`);
  css.push(`.fog{animation:fog 14s linear infinite}`, keyframes('fog', [[0, 'transform:translateX(0)'], [100, 'transform:translateX(300px)']]));
  return out.join('');
}

// DEADFALL: an eroded island under a sun and moon that trade places, dense conifer forest, drifting mist
export function sceneDeadfall(doc, css, R) {
  const out = [];
  const T = 18; // one full day
  doc.def('gDfSky', `<linearGradient id="gDfSky" x1="0" y1="-150" x2="0" y2="40" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2b5b7a"/><stop offset=".6" stop-color="#7fb2b8"/><stop offset="1" stop-color="#ffd9a0"/></linearGradient>`);
  doc.def('gDfSea', `<linearGradient id="gDfSea" x1="0" y1="40" x2="0" y2="150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2a5d6e"/><stop offset="1" stop-color="#071a24"/></linearGradient>`);
  doc.def('gDfSun', `<radialGradient id="gDfSun"><stop offset="0" stop-color="#fff6d8"/><stop offset=".35" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ff9a3d" stop-opacity="0"/></radialGradient>`);
  out.push(`<rect x="-150" y="-150" width="300" height="300" fill="url(#gDfSky)"/>`);
  // night veil + stars that fade in when the sun sets
  const stars = [];
  for (let i = 0; i < 34; i++) stars.push(`<circle cx="${r1(R.range(-140, 140))}" cy="${r1(R.range(-140, 20))}" r="${r2(R.range(0.4, 1.2))}" fill="#fff"/>`);
  out.push(`<g class="night"><rect x="-150" y="-150" width="300" height="200" fill="#081226"/>${stars.join('')}</g>`);
  css.push(`.night{animation:night ${T}s ease-in-out infinite}`, keyframes('night', [[0, 'opacity:0'], [38, 'opacity:0'], [50, 'opacity:.92'], [88, 'opacity:.92'], [100, 'opacity:0']]));
  // sun and moon ride the same wheel, half a turn apart (sun up while the moon is down)
  out.push(`<g transform="translate(0 46)"><g class="wheel">`
    + `<g transform="translate(0 -112)"><circle r="44" fill="url(#gDfSun)"/><circle r="14" fill="#fff1c9"/></g>`
    + `<g transform="translate(0 112)"><circle r="11" fill="#eef4ff"/><circle cx="4" cy="-3" r="9.5" fill="#081226" opacity=".55"/></g>`
    + `</g></g>`);
  css.push(`.wheel{animation:wheel ${T}s linear infinite;transform-origin:0px 0px}`, keyframes('wheel', [[0, 'transform:rotate(-80deg)'], [100, 'transform:rotate(280deg)']]));
  // island ridgeline carved by erosion
  const ridge = 'M-150 46L-126 40L-112 22L-96 16L-84 -2L-70 -8L-58 -26L-44 -30L-34 -46L-22 -50L-12 -62L-2 -58L8 -66L18 -54L30 -48L42 -30L56 -24L70 -8L86 -2L100 14L116 22L132 36L150 44V60H-150Z';
  out.push(`<path d="${ridge}" fill="#1f3f3a"/>`);
  out.push(`<path d="M-12 -62L-20 -20L-34 24M8 -66L14 -24L6 30M42 -30L36 4L46 40M-58 -26L-60 8L-72 40" fill="none" stroke="#0f2622" stroke-width="3" stroke-linecap="round" opacity=".7"/>`);
  // forest: sample points under the ridgeline, darker toward the front
  const ridgeY = (x) => { const pts = ridge.match(/-?\d+ -?\d+/g).slice(0, 23).map((p) => p.split(' ').map(Number)); for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * ((x - x0) / (x1 - x0)); } return 44; };
  const trees = [];
  for (let i = 0; i < 230; i++) {
    const x = R.range(-146, 146), top = ridgeY(x) + 4, y = R.range(top, 50);
    const h = R.range(7, 13) * (0.75 + 0.5 * ((y - top) / Math.max(1, 50 - top)));
    const shade = ['#0c2a22', '#123528', '#18402f', '#0f2f26'][i % 4];
    trees.push([y, `<path d="M${r1(x)} ${r1(y - h)}L${r1(x + h * 0.32)} ${r1(y)}H${r1(x - h * 0.32)}Z" fill="${shade}"/>`]);
  }
  trees.sort((a, b) => a[0] - b[0]);
  out.push(`<g class="sway">${trees.map((t) => t[1]).join('')}</g>`);
  css.push(`.sway{animation:sway 5s ease-in-out infinite alternate;transform-origin:0px 50px}`, keyframes('sway', [[0, 'transform:skewX(-0.8deg)'], [100, 'transform:skewX(0.8deg)']]));
  // shoreline + sea
  out.push(`<path d="M-150 48Q-60 40 0 50T150 46V150H-150Z" fill="url(#gDfSea)"/>`);
  for (let k = 0; k < 6; k++) out.push(`<path d="M-150 ${58 + k * 13}H150" stroke="#bfe9ff" stroke-opacity="${r2(0.22 - k * 0.03)}" stroke-dasharray="${8 + k * 3} ${18 + k * 6}" class="swell" style="animation-delay:-${k}s"/>`);
  css.push(`.swell{animation:swell 7s linear infinite}`, keyframes('swell', [[0, 'stroke-dashoffset:0'], [100, 'stroke-dashoffset:-120']]));
  // mist
  doc.def('gMist', `<linearGradient id="gMist" x1="0" x2="1"><stop offset="0" stop-color="#e8fbff" stop-opacity="0"/><stop offset=".5" stop-color="#e8fbff" stop-opacity=".28"/><stop offset="1" stop-color="#e8fbff" stop-opacity="0"/></linearGradient>`);
  out.push(`<g class="mist"><rect x="-300" y="18" width="260" height="16" rx="8" fill="url(#gMist)"/><rect x="-20" y="30" width="240" height="14" rx="7" fill="url(#gMist)"/><rect x="0" y="4" width="200" height="12" rx="6" fill="url(#gMist)"/></g>`);
  css.push(`.mist{animation:mist 16s linear infinite}`, keyframes('mist', [[0, 'transform:translateX(-40px)'], [100, 'transform:translateX(220px)']]));
  // HUD
  out.push(doc.text('49°N · REAL SUN + MOON', { font: 'mono', size: 10, x: 0, y: 112, anchor: 'middle', fill: '#e8fbff', attrs: 'opacity=".8"' }));
  return out.join('');
}

// THE SUPERCAR TEST: a blueprint where a wedge-shaped car is drawn stroke by stroke, effort meter climbing
export function sceneSupercar(doc, css, R) {
  const out = [];
  const T = 10;
  doc.def('gBp', `<radialGradient id="gBp" cx="0" cy="0" r="170" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0f2a4f"/><stop offset="1" stop-color="#06142a"/></radialGradient>`);
  out.push(`<rect x="-150" y="-150" width="300" height="300" fill="url(#gBp)"/>`);
  const g1 = [], g2 = [];
  for (let i = -150; i <= 150; i += 10) (i % 50 === 0 ? g2 : g1).push(`M${i} -150V150M-150 ${i}H150`);
  out.push(`<path d="${g1.join('')}" stroke="#50BEFF" stroke-opacity=".07"/><path d="${g2.join('')}" stroke="#50BEFF" stroke-opacity=".16"/>`);
  out.push(doc.text('<svg viewBox="0 0 1600 600">', { font: 'mono', size: 10, x: 0, y: -88, anchor: 'middle', fill: '#8FE3FF', attrs: 'opacity=".55"' }));
  out.push(doc.text('<path d="M0 410 L120 ..."/>', { font: 'mono', size: 10, x: 0, y: -74, anchor: 'middle', fill: '#8FE3FF', attrs: 'opacity=".4"' }));
  // generic low wedge supercar, side view (original drawing, no real model or logo)
  const body = 'M-124 22L-126 6L-110 -4L-62 -14L-30 -30L10 -32L34 -24L76 -10L118 0L128 10L126 22Z';
  const lines = [
    'M-24 -27L8 -29L30 -21L-6 -18Z', // side glass
    'M-58 -10L-30 -26', // a-pillar to rear deck line
    'M-4 -6L46 -4L36 12L4 10Z', // side intake
    'M-118 4L-92 0', // tail light
    'M112 2L124 6', // head light
    'M-112 22H-100M-46 22H52M98 22H112', // sill
  ];
  const wheel = (x) => `<circle cx="${x}" cy="22" r="20" pathLength="1"/><circle cx="${x}" cy="22" r="12" pathLength="1"/><path d="M${x - 12} 22H${x + 12}M${x} 10V34M${x - 8.5} 13.5L${x + 8.5} 30.5M${x - 8.5} 30.5L${x + 8.5} 13.5" pathLength="1"/>`;
  out.push(`<g fill="none" stroke="#e8fbff" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" class="draw">`
    + `<path d="${body}" pathLength="1"/>${lines.map((d) => `<path d="${d}" pathLength="1"/>`).join('')}`
    + `${wheel(-74)}${wheel(76)}</g>`);
  out.push(`<g fill="none" stroke="#50BEFF" stroke-width="7" stroke-opacity=".25" class="draw"><path d="${body}" pathLength="1"/></g>`);
  css.push(`.draw path,.draw circle{stroke-dasharray:1 1;animation:draw ${T}s ease-in-out infinite}`, keyframes('draw', [[0, 'stroke-dashoffset:1;opacity:1'], [32, 'stroke-dashoffset:0;opacity:1'], [93, 'stroke-dashoffset:0;opacity:1'], [98, 'stroke-dashoffset:0;opacity:0'], [100, 'stroke-dashoffset:1;opacity:0']]));
  // dimension line
  out.push(`<path d="M-126 52H128M-126 46V58M128 46V58" stroke="#8FE3FF" stroke-opacity=".5"/>`);
  // effort meter: five levels light up in turn
  out.push(doc.text('EFFORT', { font: 'mono', size: 10, x: -62, y: 86, anchor: 'end', fill: '#8FE3FF' }));
  for (let k = 0; k < 5; k++) {
    out.push(`<rect x="${-54 + k * 24}" y="77" width="18" height="11" rx="2.5" fill="#50BEFF" class="eff${k}"/>`);
    css.push(`.eff${k}{animation:eff${k} ${T}s steps(1) infinite}`, keyframes(`eff${k}`, [[0, 'opacity:.15'], [5 + k * 6, 'opacity:1'], [97, 'opacity:.15']]));
  }
  return out.join('');
}
