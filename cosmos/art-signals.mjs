// art-signals.mjs: the guestbook. Every visitor who transmits a signal becomes a star around the aipulsedaily brain.
import { Doc, rng, hash, keyframes, r1, r2, fmtInt, b64, esc } from './kit.mjs';
import { short } from './derive.mjs';

const C = { ink: '#eaf6ff', dim: '#8fa8c9', faint: '#5a6f91', cyan: '#50BEFF', magenta: '#8F7BFF', gold: '#FFC163' };

export function signals({ fonts, bg, list, avatars, logo }) {
  const W = 1200, H = 620;
  const n = list.length;
  const doc = new Doc({ width: W, height: H, fonts, title: `${n} signals received`, desc: n ? `Latest: ${list.slice(-8).reverse().map((s) => '@' + s.login).join(', ')}` : 'No signals yet' });
  const css = [];
  const P = [];
  doc.def('frame', `<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>`);
  P.push(`<rect width="${W}" height="${H}" fill="#03040e"/>`);
  P.push(`<image href="data:image/jpeg;base64,${b64(bg)}" width="${W}" height="${H}" preserveAspectRatio="none" opacity=".9"/>`);

  // sky area
  const ox = 400, oy = 330; // origin star
  const AX = 330, AY = 225; // ellipse radii for placement
  const placed = [];
  const pos = [];
  list.forEach((s, i) => {
    let h = hash(s.login.toLowerCase());
    let ang = (h % 3600) / 10 * Math.PI / 180;
    let rad = 0.32 + ((h >>> 12) % 1000) / 1000 * 0.66;
    let x, y, tries = 0;
    do {
      x = ox + Math.cos(ang) * rad * AX; y = oy + Math.sin(ang) * rad * AY;
      ang += 2.39996; rad = Math.min(0.98, rad + 0.013); tries++;
    } while (tries < 40 && placed.some(([px, py]) => Math.hypot(px - x, py - y) < 40));
    placed.push([x, y]); pos.push([x, y]);
  });
  // constellation lines: each star links to its nearest earlier star (or origin)
  const lines = [];
  pos.forEach(([x, y], i) => {
    let best = [ox, oy], bd = Math.hypot(x - ox, y - oy);
    for (let j = 0; j < i; j++) { const d = Math.hypot(x - pos[j][0], y - pos[j][1]); if (d < bd) { bd = d; best = pos[j]; } }
    lines.push(`<path d="M${r1(best[0])} ${r1(best[1])}L${r1(x)} ${r1(y)}" stroke="${C.cyan}" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="3 4" class="cl" style="animation-delay:-${r2((i % 7) * 0.3)}s"/>`);
  });
  css.push(`.cl{animation:cl 3s linear infinite}`, keyframes('cl', [[0, 'stroke-dashoffset:0'], [100, 'stroke-dashoffset:-14']]));
  P.push(`<g>${lines.join('')}</g>`);
  // placement guide ellipse
  P.push(`<ellipse cx="${ox}" cy="${oy}" rx="${AX}" ry="${AY}" fill="none" stroke="${C.cyan}" stroke-opacity=".12" stroke-dasharray="2 8"/>`);
  P.push(`<ellipse cx="${ox}" cy="${oy}" rx="${AX * 0.55}" ry="${AY * 0.55}" fill="none" stroke="${C.cyan}" stroke-opacity=".08" stroke-dasharray="2 8"/>`);

  // origin: the aipulsedaily brain
  doc.def('gOrigin', `<radialGradient id="gOrigin"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="${C.cyan}" stop-opacity=".7"/><stop offset="1" stop-color="${C.magenta}" stop-opacity="0"/></radialGradient>`);
  P.push(`<circle cx="${ox}" cy="${oy}" r="70" fill="url(#gOrigin)" opacity=".55" class="opulse"/>`);
  css.push(`.opulse{animation:opulse 3.2s ease-in-out infinite alternate;transform-origin:${ox}px ${oy}px}`, keyframes('opulse', [[0, 'transform:scale(.9);opacity:.45'], [100, 'transform:scale(1.08);opacity:.7']]));
  // radar waves from origin (waiting for signals)
  for (let k = 0; k < 3; k++) P.push(`<circle cx="${ox}" cy="${oy}" r="30" fill="none" stroke="${C.cyan}" stroke-width="1.4" class="wave" style="animation-delay:${k * 1.2}s"/>`);
  css.push(`.wave{animation:wave 3.6s ease-out infinite;transform-origin:${ox}px ${oy}px;opacity:0}`, keyframes('wave', [[0, 'transform:scale(1);opacity:.7'], [100, 'transform:scale(6);opacity:0']]));
  const avatarCircle = (x, y, r, dataUri, ring, id) => {
    doc.def(`cl${id}`, `<clipPath id="cl${id}"><circle cx="${r1(x)}" cy="${r1(y)}" r="${r}"/></clipPath>`);
    return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r + 5}" fill="${ring}" opacity=".25"/>`
      + `<image href="${dataUri}" x="${r1(x - r)}" y="${r1(y - r)}" width="${r * 2}" height="${r * 2}" clip-path="url(#cl${id})"/>`
      + `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="none" stroke="${ring}" stroke-width="2"/>`;
  };
  if (logo) P.push(avatarCircle(ox, oy, 26, `data:image/jpeg;base64,${b64(logo)}`, C.cyan, 'own'));
  else P.push(`<circle cx="${ox}" cy="${oy}" r="9" fill="#fff"/>`);
  P.push(doc.text('aipulsedaily', { font: 'bodyb', size: 14, x: ox, y: oy + 50, anchor: 'middle', fill: C.ink }));

  // visitor stars
  const showAvatars = 28, showLabels = 12;
  list.forEach((s, i) => {
    const [x, y] = pos[i];
    const recent = n - 1 - i; // 0 = newest
    const col = s.combo ? C.gold : C.cyan;
    const av = avatars[String(s.id)];
    if (recent < showAvatars && av) {
      P.push(avatarCircle(x, y, recent === 0 ? 17 : 13, av, col, i));
    } else {
      P.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="9" fill="${col}" opacity=".18"/><path transform="translate(${r1(x)} ${r1(y)})" d="M0 -7L1.6 -1.6L7 0L1.6 1.6L0 7L-1.6 1.6L-7 0L-1.6 -1.6Z" fill="${s.combo ? C.gold : '#fff'}"/>`);
    }
    if (recent === 0) {
      P.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="22" fill="none" stroke="${col}" stroke-width="2" class="newp"/>`);
      css.push(`.newp{animation:newp 1.8s ease-out infinite;transform-box:fill-box;transform-origin:center}`, keyframes('newp', [[0, 'transform:scale(.8);opacity:1'], [100, 'transform:scale(2);opacity:0']]));
    }
    if (recent < showLabels) {
      const lab = '@' + s.login;
      const lx = x + (recent === 0 ? 24 : 19), ly = y + 4;
      P.push(doc.text(lab, { font: 'monob', size: 11.5, x: lx, y: ly, fill: col, attrs: `opacity="${recent === 0 ? 1 : 0.8}"` }));
    }
  });

  // empty state
  if (!n) {
    P.push(doc.text('AWAITING FIRST SIGNAL', { font: 'hud', size: 15, x: ox, y: oy - 70, anchor: 'middle', fill: C.cyan, tracking: 0.35 }));
    P.push(doc.text('this sky is empty. be its first star.', { font: 'mono', size: 13, x: ox, y: oy + 80, anchor: 'middle', fill: C.dim }));
  }

  // right column HUD
  const X0 = 800;
  P.push(`<path d="M${X0 - 26} 60V${H - 60}" stroke="${C.cyan}" stroke-opacity=".14"/>`);
  P.push(doc.text('SIGNALS RECEIVED', { font: 'hud', size: 14, x: X0, y: 84, fill: C.cyan, tracking: 0.3 }));
  doc.def('gNum', `<linearGradient id="gNum" x1="${X0}" x2="${X0 + 240}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="${C.cyan}"/><stop offset="1" stop-color="#8F7BFF"/></linearGradient>`);
  P.push(`<path d="${doc.textD(n < 10 ? '0' + n : fmtInt(n), { font: 'heavy', size: 76, x: X0 - 3, y: 172 })}" fill="url(#gNum)"/>`);
  P.push(doc.text(n === 1 ? 'TRAVELER HAS PASSED THROUGH' : 'TRAVELERS HAVE PASSED THROUGH', { font: 'mono', size: 11.5, x: X0, y: 198, fill: C.dim, tracking: 0.1 }));
  // latest list
  P.push(doc.text('LATEST TRANSMISSIONS', { font: 'hud', size: 10.5, x: X0, y: 246, fill: C.dim, tracking: 0.2 }));
  const latest = list.slice(-6).reverse();
  if (!latest.length) P.push(doc.text('none yet. the first one could be you.', { font: 'mono', size: 13, x: X0, y: 276, fill: C.faint }));
  latest.forEach((s, i) => {
    const y = 278 + i * 30;
    const col = s.combo ? C.gold : C.ink;
    P.push(`<circle cx="${X0 + 5}" cy="${y - 4}" r="3.5" fill="${s.combo ? C.gold : C.cyan}"/>`);
    P.push(doc.text('@' + s.login, { font: 'monob', size: 13.5, x: X0 + 18, y, fill: col }));
    P.push(doc.text(short(s.at.slice(0, 10)), { font: 'mono', size: 11.5, x: s.combo ? 1132 : 1150, y, anchor: 'end', fill: s.combo ? C.gold : C.faint }));
    if (s.combo) P.push(starIcon(1143, y - 4.5, 0.62, C.gold));
  });
  P.push(starIcon(X0 + 5, H - 78, 0.6, C.gold));
  P.push(doc.text('= found the secret combo', { font: 'mono', size: 11, x: X0 + 16, y: H - 74, fill: C.gold, attrs: 'opacity=".8"' }));
  P.push(doc.text('your avatar lands here ~1 min after you transmit', { font: 'mono', size: 11, x: X0, y: H - 54, fill: C.faint }));

  const br = (x, y, sx, sy) => `<path d="M${x} ${y + sy * 24}V${y}H${x + sx * 24}" fill="none" stroke="${C.cyan}" stroke-opacity=".6" stroke-width="1.5"/>`;
  P.push(br(24, 24, 1, 1), br(W - 24, 24, -1, 1), br(24, H - 24, 1, -1), br(W - 24, H - 24, -1, -1));
  P.push(doc.text('GUESTBOOK // EVERY VISITOR BECOMES A STAR', { font: 'mono', size: 10.5, x: 52, y: 56, fill: C.dim, tracking: 0.08 }));
  P.push(`<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="21.5" fill="none" stroke="${C.cyan}" stroke-opacity=".2" stroke-width="1.5"/>`);
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}}`);
  doc.style(css.join('\n'));
  return doc.render(`<g clip-path="url(#frame)">${P.join('')}</g>`);
}

const starIcon = (x, y, s, fill) => `<path transform="translate(${r1(x)} ${r1(y)}) scale(${s})" d="M0 -10L2.9 -4L9.5 -3.1L4.7 1.5L5.9 8.1L0 5L-5.9 8.1L-4.7 1.5L-9.5 -3.1L-2.9 -4Z" fill="${fill}"/>`;

// the big "TRANSMIT" button (the README wraps it in a link to the pre-filled issue)
export function signalButton({ fonts, variant = 'signal' }) {
  const W = 760, H = 132;
  const doc = new Doc({ width: W, height: H, fonts, title: variant === 'combo' ? 'Claim your golden star' : 'Transmit a signal' });
  const css = [];
  const P = [];
  const col = variant === 'combo' ? C.gold : C.cyan;
  const col2 = variant === 'combo' ? '#ff9a3d' : C.magenta;
  doc.def('gBtn', `<linearGradient id="gBtn" x1="0" x2="1"><stop offset="0" stop-color="${col}" stop-opacity=".22"/><stop offset="1" stop-color="${col2}" stop-opacity=".22"/></linearGradient>`);
  doc.def('gBtnLine', `<linearGradient id="gBtnLine" x1="0" x2="1"><stop offset="0" stop-color="${col}"/><stop offset="1" stop-color="${col2}"/></linearGradient>`);
  doc.def('gBtnSweep', `<linearGradient id="gBtnSweep" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`);
  doc.def('cBtn', `<clipPath id="cBtn"><rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="${(H - 16) / 2}"/></clipPath>`);
  P.push(`<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="${(H - 16) / 2}" fill="#070618"/>`);
  P.push(`<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="${(H - 16) / 2}" fill="url(#gBtn)"/>`);
  P.push(`<g clip-path="url(#cBtn)"><rect class="bsw" x="-200" y="0" width="160" height="${H}" fill="url(#gBtnSweep)" transform="skewX(-20)"/></g>`);
  css.push(`.bsw{animation:bsw 3.6s ease-in-out infinite}`, keyframes('bsw', [[0, 'transform:skewX(-20deg) translateX(0)'], [55, `transform:skewX(-20deg) translateX(${W + 400}px)`], [100, `transform:skewX(-20deg) translateX(${W + 400}px)`]]));
  P.push(`<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="${(H - 16) / 2}" fill="none" stroke="url(#gBtnLine)" stroke-width="2.5"/>`);
  // icon: antenna dish with waves / star
  const ix = 92, iy = H / 2;
  if (variant === 'combo') {
    P.push(`<g transform="translate(${ix} ${iy}) scale(2.3)"><path d="M0 -10L2.9 -4L9.5 -3.1L4.7 1.5L5.9 8.1L0 5L-5.9 8.1L-4.7 1.5L-9.5 -3.1L-2.9 -4Z" fill="${C.gold}" class="spinStar"/></g>`);
    css.push(`.spinStar{animation:spinStar 4s ease-in-out infinite;transform-origin:0px 0px}`, keyframes('spinStar', [[0, 'transform:rotate(0deg) scale(1)'], [50, 'transform:rotate(36deg) scale(1.12)'], [100, 'transform:rotate(72deg) scale(1)']]));
  } else {
    P.push(`<g transform="translate(${ix - 8} ${iy + 12})" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round">`
      + `<path d="M-18 -4A26 26 0 0 0 12 -34Z" fill="${col}" fill-opacity=".2"/><path d="M-3 -19L8 -30"/><path d="M-6 6L-12 22M-6 6L2 22M-14 22H6"/></g>`);
    for (let k = 0; k < 3; k++) P.push(`<path d="M${ix + 6 + k * 9} ${iy - 28 - k * 2}A${16 + k * 10} ${16 + k * 10} 0 0 1 ${ix + 22 + k * 12} ${iy - 8 - k * 4}" fill="none" stroke="${col}" stroke-width="2.6" stroke-linecap="round" class="bw" style="animation-delay:${k * 0.25}s"/>`);
    css.push(`.bw{animation:bw 1.5s ease-in-out infinite}`, keyframes('bw', [[0, 'opacity:.15'], [50, 'opacity:1'], [100, 'opacity:.15']]));
  }
  const label = variant === 'combo' ? 'CLAIM YOUR GOLDEN STAR' : 'TRANSMIT A SIGNAL';
  const sub = variant === 'combo' ? 'transmit with the secret word · become a gold star' : 'click · hit submit · become a star in this sky';
  P.push(doc.text(label, { font: 'heavy', size: 30, x: 150, y: 70, fill: C.ink, tracking: 0.08 }));
  P.push(doc.text(sub, { font: 'mono', size: 14, x: 152, y: 96, fill: col }));
  P.push(`<g class="arr">${doc.text('→', { font: 'monob', size: 34, x: W - 60, y: 78, anchor: 'end', fill: col })}</g>`);
  css.push(`.arr{animation:arr 1.2s ease-in-out infinite}`, keyframes('arr', [[0, 'transform:translateX(0)'], [50, 'transform:translateX(8px)'], [100, 'transform:translateX(0)']]));
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}}`);
  doc.style(css.join('\n'));
  return doc.render(P.join(''));
}
