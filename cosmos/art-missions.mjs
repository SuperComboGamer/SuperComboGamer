// art-missions.mjs — each project as an embroidered mission patch with a living scene inside.
import { Doc, rng, keyframes, r1, r2, fmtInt, wrap, arcText } from './kit.mjs';

const C = { ink: '#eaf6ff', dim: '#8fa3c7', faint: '#5d6b8f', cyan: '#7df9ff', magenta: '#ff3dbb', gold: '#ffd36e' };

export function missionPatch({ fonts, m, index }) {
  const W = 560, H = 700, cx = 280, cy = 262, RO = 196;
  const doc = new Doc({ width: W, height: H, fonts, title: `Mission ${index}: ${m.repo}`, desc: m.desc });
  const R = rng('mission-' + m.key);
  const css = [];
  const P = [];
  const A = m.accent, B = m.accent2;
  doc.def('frame', `<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>`);
  doc.def('gCard', `<radialGradient id="gCard" cx="${cx}" cy="${cy}" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${m.glow}" stop-opacity=".55"/><stop offset=".5" stop-color="#0a0820"/><stop offset="1" stop-color="#05040f"/></radialGradient>`);
  P.push(`<rect width="${W}" height="${H}" fill="#05040f"/><rect width="${W}" height="${H}" fill="url(#gCard)"/>`);
  for (let i = 0; i < 70; i++) P.push(`<circle cx="${r1(R() * W)}" cy="${r1(R() * H)}" r="${r2(R.range(0.3, 1))}" fill="#dfe9ff" opacity="${r2(R.range(0.15, 0.6))}"/>`);

  // ---- patch ----
  doc.def('cDisc', `<clipPath id="cDisc"><circle cx="${cx}" cy="${cy}" r="${RO - 52}"/></clipPath>`);
  doc.def('gRing', `<linearGradient id="gRing" x1="0" y1="${cy - RO}" x2="0" y2="${cy + RO}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#15123a"/><stop offset="1" stop-color="#0a0820"/></linearGradient>`);
  doc.def('fSoft', `<filter id="fSoft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>`);
  P.push(`<circle cx="${cx}" cy="${cy}" r="${RO + 8}" fill="${A}" opacity=".35" filter="url(#fSoft)" class="halo"/>`);
  css.push(`.halo{animation:halo 4s ease-in-out infinite alternate}`, keyframes('halo', [[0, 'opacity:.18'], [100, 'opacity:.42']]));
  P.push(`<circle cx="${cx}" cy="${cy}" r="${RO}" fill="${A}"/>`);
  P.push(`<circle cx="${cx}" cy="${cy}" r="${RO - 7}" fill="url(#gRing)"/>`);
  P.push(`<circle cx="${cx}" cy="${cy}" r="${RO - 3.5}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-dasharray="4 4" class="stitch"/>`);
  css.push(`.stitch{animation:stitch 6s linear infinite}`, keyframes('stitch', [[0, 'stroke-dashoffset:0'], [100, 'stroke-dashoffset:-48']]));
  // scene
  P.push(`<g clip-path="url(#cDisc)"><g transform="translate(${cx} ${cy})">${m.scene(doc, css, R)}</g></g>`);
  P.push(`<circle cx="${cx}" cy="${cy}" r="${RO - 52}" fill="none" stroke="${A}" stroke-width="5"/>`);
  P.push(`<circle cx="${cx}" cy="${cy}" r="${RO - 46}" fill="none" stroke="${B}" stroke-opacity=".5" stroke-width="1"/>`);
  // arc texts
  P.push(arcText(doc, m.ringTop, { font: 'heavy', size: 25, r: RO - 40, tracking: 0.16, side: 'top', fill: C.ink, cx, cy }));
  P.push(arcText(doc, m.ringBottom, { font: 'hud', size: 14.5, r: RO - 40, tracking: 0.2, side: 'bottom', fill: B, cx, cy }));
  // side stars
  const star = (x, y, s) => `<path transform="translate(${r1(x)} ${r1(y)}) scale(${s})" d="M0 -9L2.2 -2.2L9 0L2.2 2.2L0 9L-2.2 2.2L-9 0L-2.2 -2.2Z" fill="${C.gold}"/>`;
  P.push(star(cx - RO + 28, cy, 1), star(cx + RO - 28, cy, 1));
  // shine sweep across the patch
  doc.def('gShine', `<linearGradient id="gShine" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`);
  doc.def('cPatch', `<clipPath id="cPatch"><circle cx="${cx}" cy="${cy}" r="${RO}"/></clipPath>`);
  P.push(`<g clip-path="url(#cPatch)"><rect class="shine" x="${cx - RO - 160}" y="${cy - RO}" width="110" height="${RO * 2}" fill="url(#gShine)" transform="skewX(-18)"/></g>`);
  css.push(`.shine{animation:shine 9s ease-in-out ${r1(index * 1.7)}s infinite}`, keyframes('shine', [[0, 'transform:skewX(-18deg) translateX(0)'], [22, `transform:skewX(-18deg) translateX(${RO * 2 + 380}px)`], [100, `transform:skewX(-18deg) translateX(${RO * 2 + 380}px)`]]));

  // ---- caption ----
  const ty = 512;
  P.push(doc.text(`MISSION 0${index}`, { font: 'mono', size: 13, x: 36, y: 46, fill: A, tracking: 0.2 }));
  if (m.badge) {
    const bw = doc.measure(m.badge, { font: 'monob', size: 12, tracking: 0.12 }) + 22;
    P.push(`<rect x="${W - 36 - bw}" y="28" width="${r1(bw)}" height="26" rx="13" fill="${C.gold}" fill-opacity=".14" stroke="${C.gold}" stroke-opacity=".6"/>`);
    P.push(doc.text(m.badge, { font: 'monob', size: 12, x: W - 36 - bw / 2, y: 45.5, anchor: 'middle', fill: C.gold, tracking: 0.12 }));
  }
  P.push(doc.text(m.repo, { font: 'monob', size: 22, x: cx, y: ty, anchor: 'middle', fill: C.ink }));
  const lines = wrap(doc, m.desc, { font: 'body', size: 17, width: W - 90 });
  lines.slice(0, 3).forEach((l, i) => P.push(doc.text(l, { font: 'body', size: 17, x: cx, y: ty + 34 + i * 24, anchor: 'middle', fill: C.dim })));
  // stat chips
  const chips = m.chips;
  const cs = 13, pad = 14, gap = 10;
  const isStar = (t) => t.startsWith('★');
  const label = (t) => (isStar(t) ? t.replace(/^★\s*/, '') : t);
  const widths = chips.map(([t]) => doc.measure(label(t), { font: 'monob', size: cs, tracking: 0.06 }) + pad * 2 + (isStar(t) ? 18 : 0));
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * (chips.length - 1);
  let x = cx - totalW / 2; const chipY = ty + 34 + Math.min(3, lines.length) * 24 + 12;
  chips.forEach(([t, col], i) => {
    P.push(`<rect x="${r1(x)}" y="${chipY}" width="${r1(widths[i])}" height="30" rx="15" fill="${col}" fill-opacity=".12" stroke="${col}" stroke-opacity=".55"/>`);
    if (isStar(t)) {
      P.push(`<path transform="translate(${r1(x + pad + 6)} ${chipY + 15}) scale(.62)" d="M0 -10L2.9 -4L9.5 -3.1L4.7 1.5L5.9 8.1L0 5L-5.9 8.1L-4.7 1.5L-9.5 -3.1L-2.9 -4Z" fill="${col}"/>`);
      P.push(doc.text(label(t), { font: 'monob', size: cs, x: x + pad + 18 + (widths[i] - pad * 2 - 18) / 2, y: chipY + 20, anchor: 'middle', fill: col, tracking: 0.06 }));
    } else P.push(doc.text(t, { font: 'monob', size: cs, x: x + widths[i] / 2, y: chipY + 20, anchor: 'middle', fill: col, tracking: 0.06 }));
    x += widths[i] + gap;
  });
  P.push(`<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="21.5" fill="none" stroke="${A}" stroke-opacity=".35" stroke-width="1.5"/>`);
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
  // the car (side view, facing right) — original stylised open-wheeler
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
    + `<g fill="${dark}">${doc.text('SCG', { font: 'heavy', size: 10, x: -64, y: 41, tracking: 0.1 })}</g>`
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

export function scenePulse(doc, css, R) {
  const out = [];
  doc.def('gPulseBg', `<radialGradient id="gPulseBg" cx="0" cy="0" r="160" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0c3b3a"/><stop offset="1" stop-color="#04110f"/></radialGradient>`);
  out.push(`<rect x="-150" y="-150" width="300" height="300" fill="url(#gPulseBg)"/>`);
  // grid
  const grid = [];
  for (let i = -140; i <= 140; i += 20) grid.push(`M${i} -150V150M-150 ${i}H150`);
  out.push(`<path d="${grid.join('')}" stroke="#2df5c7" stroke-opacity=".08"/>`);
  // terminal windows stacked (sessions)
  const win = (x, y, w, h, op, tag) => `<g transform="translate(${x} ${y})" opacity="${op}"><rect width="${w}" height="${h}" rx="9" fill="#071a19" stroke="#2df5c7" stroke-opacity=".6"/><rect width="${w}" height="20" rx="9" fill="#0d2e2b"/><rect y="10" width="${w}" height="10" fill="#0d2e2b"/><circle cx="12" cy="10" r="3.4" fill="${tag}"/><circle cx="24" cy="10" r="3.4" fill="#2df5c7" opacity=".5"/></g>`;
  out.push(win(-118, -92, 150, 104, 0.45, '#ffd36e'), win(-30, -110, 150, 104, 0.6, '#ff3dbb'));
  out.push(win(-96, -50, 192, 132, 1, '#2df5c7'));
  // prompt
  out.push(doc.text('>', { font: 'monob', size: 16, x: -82, y: -6, fill: '#2df5c7' }));
  const cmdTxt = 'pulse restore --all';
  out.push(doc.text(cmdTxt, { font: 'mono', size: 12, x: -66, y: -6.5, fill: '#cffff0' }));
  const cmdW = doc.measure(cmdTxt, { font: 'mono', size: 12 });
  out.push(`<rect x="${r1(-66 + cmdW + 3)}" y="-16" width="6.5" height="12" fill="#2df5c7" class="pcur"/>`);
  css.push(`.pcur{animation:pcur 1s steps(1) infinite}`, keyframes('pcur', [[0, 'opacity:1'], [50, 'opacity:0']]));
  // EKG line
  const ekg = 'M-90 38H-50L-42 30L-34 46L-24 8L-14 62L-6 38H14L22 32L30 38H90';
  out.push(`<path d="${ekg}" fill="none" stroke="#2df5c7" stroke-opacity=".18" stroke-width="2"/>`);
  out.push(`<path d="${ekg}" fill="none" stroke="#7dffe0" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" class="ekg"/>`);
  css.push(`.ekg{stroke-dasharray:70 400;animation:ekg 2.2s linear infinite}`, keyframes('ekg', [[0, 'stroke-dashoffset:70'], [100, 'stroke-dashoffset:-330']]));
  // reboot ring: arrow that loops, with "UPTIME ∞"
  out.push(`<g transform="translate(0 112)"><g class="reboot"><path d="M-14 0A14 14 0 1 1 0 14" fill="none" stroke="#ffd36e" stroke-width="3" stroke-linecap="round"/><path d="M-4 9L0 14L-6 18" fill="none" stroke="#ffd36e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g></g>`);
  css.push(`.reboot{animation:reboot 3s cubic-bezier(.6,0,.3,1) infinite;transform-origin:0px 0px}`, keyframes('reboot', [[0, 'transform:rotate(0deg)'], [60, 'transform:rotate(360deg)'], [100, 'transform:rotate(360deg)']]));
  out.push(doc.text('UPTIME: ∞', { font: 'monob', size: 11, x: 24, y: 116, fill: '#ffd36e' }));
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

export function sceneControl(doc, css, R) {
  const out = [];
  doc.def('gRadarBg', `<radialGradient id="gRadarBg" cx="0" cy="0" r="150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#25104d"/><stop offset="1" stop-color="#0a0520"/></radialGradient>`);
  out.push(`<rect x="-150" y="-150" width="300" height="300" fill="url(#gRadarBg)"/>`);
  out.push(`<g fill="none" stroke="#b18cff" stroke-opacity=".35">${[30, 60, 90, 120].map((r) => `<circle r="${r}"/>`).join('')}<path d="M-140 0H140M0 -140V140" stroke-opacity=".25"/><path d="M-99 -99L99 99M-99 99L99 -99" stroke-opacity=".12"/></g>`);
  // sweep: wedge with angular fade (approximated by stacked wedges)
  const wedges = [];
  for (let i = 0; i < 12; i++) {
    const a0 = -i * 4 * Math.PI / 180, a1 = -(i + 1) * 4 * Math.PI / 180;
    wedges.push(`<path d="M0 0L${r1(130 * Math.cos(a0))} ${r1(130 * Math.sin(a0))}A130 130 0 0 0 ${r1(130 * Math.cos(a1))} ${r1(130 * Math.sin(a1))}Z" fill="#ff3dbb" opacity="${r2(0.42 * (1 - i / 12))}"/>`);
  }
  out.push(`<g class="sweep">${wedges.join('')}<path d="M0 0L130 0" stroke="#ffc2ef" stroke-width="2"/></g>`);
  const period = 4;
  css.push(`.sweep{animation:rsweep ${period}s linear infinite;transform-origin:0px 0px}`, keyframes('rsweep', [[0, 'transform:rotate(0deg)'], [100, 'transform:rotate(360deg)']]));
  // agent blips: light up as the sweep passes (delay = angle / 360 * period)
  const kinds = [['#5dffb0', 'running'], ['#ffd36e', 'awaiting input'], ['#7df9ff', 'done']];
  const blips = [];
  for (let i = 0; i < 11; i++) {
    const ang = R() * 360, rad = R.range(28, 118);
    const x = rad * Math.cos(ang * Math.PI / 180), y = rad * Math.sin(ang * Math.PI / 180);
    const col = kinds[i % 3][0];
    const delay = (ang / 360) * period;
    blips.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="3.6" fill="${col}" class="blip" style="animation-delay:${r2(delay)}s"/>`);
    blips.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="3.6" fill="none" stroke="${col}" class="ping" style="animation-delay:${r2(delay)}s"/>`);
  }
  out.push(blips.join(''));
  css.push(`.blip{animation:blip ${period}s linear infinite}`, keyframes('blip', [[0, 'opacity:1'], [70, 'opacity:.25'], [100, 'opacity:.25']]),
    `.ping{animation:ping ${period}s ease-out infinite;transform-box:fill-box;transform-origin:center}`, keyframes('ping', [[0, 'transform:scale(1);opacity:.9'], [30, 'transform:scale(3.4);opacity:0'], [100, 'transform:scale(3.4);opacity:0']]));
  out.push(`<circle r="5" fill="#fff"/><circle r="10" fill="none" stroke="#ff3dbb" stroke-width="2"/>`);
  // legend
  const labs = ['running', 'waiting', 'done'];
  const lw = labs.map((l) => doc.measure(l, { font: 'mono', size: 10 }) + 18);
  let lx = -(lw.reduce((a, b) => a + b, 0)) / 2;
  kinds.forEach(([col], i) => {
    out.push(`<rect x="${r1(lx - 4)}" y="98" width="${r1(lw[i] - 4)}" height="16" rx="8" fill="#0a0520" fill-opacity=".8"/>`);
    out.push(`<circle cx="${r1(lx + 5)}" cy="106" r="3.2" fill="${col}"/>`);
    out.push(doc.text(labs[i], { font: 'mono', size: 10, x: lx + 11, y: 109.5, fill: col }));
    lx += lw[i];
  });
  return out.join('');
}
