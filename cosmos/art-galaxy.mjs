// art-galaxy.mjs: the last 365 days as a rotating spiral galaxy. One star = one day. + live HUD stats.
import { Doc, rng, keyframes, r1, r2, fmtInt, b64 } from './kit.mjs';
import { WEEKDAYS, short, nice } from './derive.mjs';

const C = { ink: '#eaf6ff', dim: '#8fa3c7', faint: '#5d6b8f', cyan: '#7df9ff', cyan2: '#29e7ff', magenta: '#ff3dbb', violet: '#9b7bff', gold: '#ffd36e' };

export function galaxy({ fonts, bg, spiral, d }) {
  const W = 1200, H = 700;
  const doc = new Doc({ width: W, height: H, fonts, title: `Commit galaxy: ${fmtInt(d.rolling)} contributions in the last year`, desc: 'Each star is one day of the past year; brighter stars are busier days.' });
  const R = rng('scg-galaxy-v1');
  const css = [];
  const P = [];
  doc.def('frame', `<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>`);
  P.push(`<rect width="${W}" height="${H}" fill="#03020b"/>`);
  P.push(`<image href="data:image/jpeg;base64,${b64(bg)}" width="${W}" height="${H}" preserveAspectRatio="none"/>`);

  // ---------- galaxy geometry ----------
  const gx = 375, gy = 380, GR = 300, rn0 = 0.09, turns = 0.9, tiltRot = -17, tiltY = 0.56;
  const bLog = Math.log(1 / rn0) / (2 * Math.PI * turns);
  const N = d.cal.length;
  const maxC = Math.max(1, ...d.cal.map((x) => x.count));
  const r0 = GR * rn0;
  const tStart = 0.18; // keep the oldest days just outside the bulge
  const thetaAt = (t) => (tStart + (1 - tStart) * t) * turns * 2 * Math.PI;
  const radiusAt = (t) => GR * rn0 * Math.exp(bLog * thetaAt(t));
  const pos = (t, arm, jr = 0, ja = 0) => {
    const r = radiusAt(t) * (1 + jr);
    const th = arm * Math.PI + thetaAt(t) + ja;
    return [r * Math.cos(th), r * Math.sin(th)];
  };
  const tilt = `translate(${gx} ${gy}) rotate(${tiltRot}) scale(1 ${tiltY})`;

  // time contour rings (static, tilted) + labels
  const ringDates = [];
  const firstOfMonth = d.cal.map((x, i) => [x.date, i]).filter(([dt]) => dt.endsWith('-01'));
  // pick ~4 evenly spaced month starts (quarters)
  const quarters = firstOfMonth.filter(([dt]) => ['01', '04', '07', '10'].includes(dt.slice(5, 7)));
  quarters.filter(([, i]) => i / (N - 1) > 0.12 && i / (N - 1) < 0.9).forEach(([dt, i]) => ringDates.push({ t: i / (N - 1), label: dt.slice(5, 7) === '01' ? `JAN '${dt.slice(2, 4)}` : ['', '', '', '', 'APR', '', '', 'JUL', '', '', 'OCT'][+dt.slice(5, 7)] || dt.slice(5, 7) }));
  ringDates.push({ t: 1, label: 'TODAY' });
  const rings = ringDates.map(({ t }) => `<circle r="${r1(radiusAt(t))}" fill="none" stroke="${C.cyan}" stroke-opacity="${t === 1 ? .32 : .14}" stroke-width="${r2(1 / tiltY)}" stroke-dasharray="${t === 1 ? '2 6' : '1 7'}" vector-effect="non-scaling-stroke"/>`).join('');
  P.push(`<g transform="${tilt}">${rings}</g>`);

  // ---------- disk (rotating) ----------
  const disk = [];
  // dust lanes / body
  const dustCols = ['#6f5bd8', '#8b6cf0', '#b56cf0', '#5b7cf0', '#ff7ad8', '#9fd8ff'];
  disk.push(`<image href="data:image/jpeg;base64,${b64(spiral)}" x="${-GR * 1.0}" y="${-GR * 1.0}" width="${GR * 2.0}" height="${GR * 2.0}" style="mix-blend-mode:screen"/>`);
  for (let i = 0; i < 240; i++) {
    const t = Math.pow(R(), 0.7);
    const arm = R() < 0.5 ? 0 : 1;
    const [x, y] = pos(t, arm, R.gauss() * 0.07, R.gauss() * 0.12);
    const rr = R.range(0.5, 1.4);
    disk.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r2(rr)}" fill="${R.pick(dustCols)}" opacity="${r2(R.range(0.18, 0.55) * (1 - 0.35 * t))}"/>`);
  }
  // inter-arm haze

  // day stars
  doc.def('gHalo', `<radialGradient id="gHalo"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="${C.cyan}" stop-opacity=".45"/><stop offset="1" stop-color="${C.cyan2}" stop-opacity="0"/></radialGradient>`);
  doc.def('gHaloM', `<radialGradient id="gHaloM"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset=".3" stop-color="${C.magenta}" stop-opacity=".35"/><stop offset="1" stop-color="${C.magenta}" stop-opacity="0"/></radialGradient>`);
  let newest = null;
  d.cal.forEach((day, i) => {
    const t = i / (N - 1);
    const arm = i % 2;
    const [x, y] = pos(t, arm, R.gauss() * 0.035, R.gauss() * 0.035);
    const c = day.count;
    if (c <= 0) {
      disk.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r=".9" fill="#7c6fb8" opacity=".35"/>`);
      return;
    }
    newest = [x, y];
    const k = Math.log(1 + c) / Math.log(1 + maxC); // 0..1
    let col, rr, halo = '';
    if (c >= 80) { col = '#ffffff'; rr = 3.6; halo = `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(14 + 16 * k)}" fill="url(#gHalo)" opacity=".85"/>`; }
    else if (c >= 30) { col = C.cyan; rr = 2.9; halo = `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(9 + 8 * k)}" fill="url(#gHalo)" opacity=".6"/>`; }
    else if (c >= 11) { col = '#ff6fd8'; rr = 2.3; halo = `<circle cx="${r1(x)}" cy="${r1(y)}" r="7" fill="url(#gHaloM)" opacity=".45"/>`; }
    else if (c >= 4) { col = '#c58bff'; rr = 1.8; }
    else { col = '#a39bff'; rr = 1.35; }
    const tw = c >= 11 ? ` class="gt${R.int(1, 3)}" style="animation-delay:-${r1(R() * 5)}s"` : '';
    disk.push(halo + `<circle cx="${r1(x)}" cy="${r1(y)}" r="${rr}" fill="${col}"${tw}/>`);
  });
  for (let k = 1; k <= 3; k++) css.push(`.gt${k}{animation:gtw ${[2.7, 3.9, 5.3][k - 1]}s ease-in-out infinite}`);
  css.push(keyframes('gtw', [[0, 'opacity:1'], [50, 'opacity:.45'], [100, 'opacity:1']]));
  // newest active day: pulsing beacon
  if (newest) {
    disk.push(`<circle cx="${r1(newest[0])}" cy="${r1(newest[1])}" r="5" fill="none" stroke="${C.gold}" stroke-width="1.6" class="beacon"/>`);
    disk.push(`<circle cx="${r1(newest[0])}" cy="${r1(newest[1])}" r="2.6" fill="${C.gold}"/>`);
    css.push(`.beacon{animation:beacon 2.2s ease-out infinite;transform-box:fill-box;transform-origin:center}`, keyframes('beacon', [[0, 'transform:scale(.6);opacity:1'], [100, 'transform:scale(3.4);opacity:0']]));
  }
  // core glow (static, outside spin so it stays round in the tilted frame)
  doc.def('gCore', `<radialGradient id="gCore"><stop offset="0" stop-color="#fff"/><stop offset=".12" stop-color="#ffe9fb" stop-opacity=".9"/><stop offset=".35" stop-color="#d48bff" stop-opacity=".35"/><stop offset=".7" stop-color="#7b2cff" stop-opacity=".12"/><stop offset="1" stop-color="#7b2cff" stop-opacity="0"/></radialGradient>`);
  P.push(`<g transform="${tilt}"><circle r="${GR * 0.42}" fill="url(#gCore)" opacity=".75"/><g class="spin">${disk.join('')}</g><circle r="${r0 * 1.5}" fill="url(#gCore)"/></g>`);
  css.push(`.spin{animation:spin 260s linear infinite;transform-origin:0px 0px}`, keyframes('spin', [[0, 'transform:rotate(0deg)'], [100, 'transform:rotate(360deg)']]));

  // ring labels (static)
  ringDates.forEach(({ t, label }, idx) => {
    const r = radiusAt(t);
    if (r < 95) return;
    // place label at angle ~ -40deg in disk frame, transform through tilt
    const a = (-62 + idx * 4) * Math.PI / 180;
    let lx = r * Math.cos(a), ly = r * Math.sin(a) * tiltY;
    const rot = tiltRot * Math.PI / 180;
    const X = gx + lx * Math.cos(rot) - ly * Math.sin(rot), Y = gy + lx * Math.sin(rot) + ly * Math.cos(rot);
    P.push(`<circle cx="${r1(X)}" cy="${r1(Y)}" r="2" fill="${C.cyan}" opacity=".8"/>`);
    P.push(doc.text(label, { font: 'mono', size: 10.5, x: X + 7, y: Y - 5, fill: t === 1 ? C.gold : C.cyan, attrs: `opacity="${t === 1 ? 1 : .75}"`, tracking: 0.08 }));
  });

  // galaxy caption (bottom-left)
  P.push(doc.text('1 STAR = 1 DAY  ·  CORE = OCT 2025  ·  RIM = TODAY', { font: 'mono', size: 11, x: 52, y: H - 44, fill: C.dim, tracking: 0.06 }));
  {
    const lx = 52, ly = H - 70; const items = [['#a39bff', 1.4, '1-3'], ['#c58bff', 1.9, '4-10'], ['#ff6fd8', 2.4, '11-29'], [C.cyan, 3, '30-79'], ['#fff', 3.6, '80+']];
    let x = lx;
    items.forEach(([col, rr, lab]) => { P.push(`<circle cx="${x + 4}" cy="${ly - 4}" r="${rr}" fill="${col}"/>`); P.push(doc.text(lab, { font: 'mono', size: 10.5, x: x + 12, y: ly, fill: C.faint })); x += 22 + doc.measure(lab, { font: 'mono', size: 10.5 }) + 8; });
    P.push(doc.text('contributions / day', { font: 'mono', size: 10.5, x, y: ly, fill: C.faint }));
  }

  // ---------- HUD column ----------
  const X0 = 780, XR = 1150;
  P.push(doc.text('THE COMMIT GALAXY', { font: 'hud', size: 15, x: X0, y: 82, fill: C.cyan, tracking: 0.32 }));
  P.push(doc.text('Every star is a day of the last year.', { font: 'body', size: 15, x: X0, y: 108, fill: C.dim }));
  P.push(doc.text('The brighter it burns, the more I shipped.', { font: 'body', size: 15, x: X0, y: 128, fill: C.dim }));
  // big number
  const big = fmtInt(d.rolling);
  doc.def('gBig', `<linearGradient id="gBig" x1="${X0}" x2="${X0 + 300}" y1="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="${C.cyan}"/><stop offset="1" stop-color="${C.magenta}"/></linearGradient>`);
  doc.def('fBlur6', `<filter id="fBlur6" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>`);
  const bigD = doc.textD(big, { font: 'heavy', size: 74, x: X0 - 3, y: 222, tracking: 0.02 });
  P.push(`<path d="${bigD}" fill="${C.cyan2}" opacity=".35" filter="url(#fBlur6)"/><path d="${bigD}" fill="url(#gBig)"/>`);
  P.push(doc.text('CONTRIBUTIONS · LAST 365 DAYS', { font: 'mono', size: 12, x: X0, y: 250, fill: C.ink, tracking: 0.12, attrs: 'opacity=".85"' }));

  // tiles
  const tiles = [
    ['CURRENT STREAK', `${d.streak.len} ${d.streak.len === 1 ? 'DAY' : 'DAYS'}`, d.streak.len ? `since ${short(d.streak.from)}` : 'reigniting…', C.gold],
    ['LONGEST STREAK', `${d.longest.len} DAYS`, d.longest.from ? `${short(d.longest.from)} → ${short(d.longest.to)}` : 'n/a', C.cyan],
    ['BEST DAY', fmtInt(d.bestDay.count), nice(d.bestDay.date), '#ff6fd8'],
    ['ACTIVE DAYS', `${d.activeDays}`, `busiest: ${WEEKDAYS[d.busiest].toLowerCase()}s`, C.violet],
  ];
  const tw = 178, th = 88, gapX = 14, gapY = 14;
  tiles.forEach(([lab, val, sub, col], i) => {
    const tx = X0 + (i % 2) * (tw + gapX), ty = 278 + Math.floor(i / 2) * (th + gapY);
    P.push(`<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="10" fill="#0b0a22" fill-opacity=".72" stroke="${col}" stroke-opacity=".35"/>`);
    P.push(`<rect x="${tx}" y="${ty + 14}" width="3" height="22" rx="1.5" fill="${col}"/>`);
    P.push(doc.text(lab, { font: 'hud', size: 10, x: tx + 14, y: ty + 24, fill: C.dim, tracking: 0.18 }));
    P.push(doc.text(val, { font: 'heavy', size: 25, x: tx + 14, y: ty + 56, fill: C.ink, tracking: 0.03 }));
    P.push(doc.text(sub, { font: 'mono', size: 11, x: tx + 14, y: ty + 76, fill: col, attrs: 'opacity=".9"' }));
  });

  // launch trajectory (yearly totals)
  {
    const top = 500, base = 640, left = X0 + 6, right = XR - 6;
    P.push(doc.text('LAUNCH TRAJECTORY', { font: 'hud', size: 10, x: X0, y: top - 2, fill: C.dim, tracking: 0.18 }));
    const g = d.growth ? `${d.growth >= 10 ? Math.round(d.growth) : d.growth.toFixed(1)}× ${d.thisYear.year - 1}` : '';
    if (g) P.push(doc.text(`${d.thisYear.year}: ${g}`, { font: 'monob', size: 11, x: XR, y: top - 2, anchor: 'end', fill: C.gold }));
    const ys = d.years.length > 9 ? d.years.slice(-9) : d.years;
    const vmax = Math.max(1, ...ys.map((y) => y.total));
    const pts = ys.map((y, i) => [left + (right - left) * (i / Math.max(1, ys.length - 1)), base - 18 - (base - top - 40) * Math.sqrt(y.total / vmax)]);
    // grid
    P.push(`<path d="M${left} ${base - 18}H${right}" stroke="${C.cyan}" stroke-opacity=".25"/>`);
    // smooth curve (Catmull-Rom → cubic)
    const curve = catmull(pts);
    doc.def('gTraj', `<linearGradient id="gTraj" x1="${left}" x2="${right}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.violet}"/><stop offset=".7" stop-color="${C.magenta}"/><stop offset="1" stop-color="${C.gold}"/></linearGradient>`);
    doc.def('gTrajA', `<linearGradient id="gTrajA" x1="0" y1="${top}" x2="0" y2="${base}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.magenta}" stop-opacity=".35"/><stop offset="1" stop-color="${C.violet}" stop-opacity="0"/></linearGradient>`);
    P.push(`<path d="${curve}L${r1(pts[pts.length - 1][0])} ${base - 18}L${r1(pts[0][0])} ${base - 18}Z" fill="url(#gTrajA)"/>`);
    P.push(`<path d="${curve}" fill="none" stroke="url(#gTraj)" stroke-width="2.4" class="traj"/>`);
    css.push(`.traj{stroke-dasharray:900;animation:traj 6s ease-out infinite}`, keyframes('traj', [[0, 'stroke-dashoffset:900'], [45, 'stroke-dashoffset:0'], [100, 'stroke-dashoffset:0']]));
    ys.forEach((y, i) => {
      const [px, py] = pts[i];
      P.push(`<circle cx="${r1(px)}" cy="${r1(py)}" r="${y.total ? 2.6 : 1.6}" fill="${y.total ? '#fff' : C.faint}"/>`);
      P.push(doc.text(`'${String(y.year).slice(2)}`, { font: 'mono', size: 10, x: px, y: base, anchor: 'middle', fill: C.faint }));
      if (y.total >= vmax * 0.06) P.push(doc.text(fmtInt(y.total), { font: 'monob', size: 10.5, x: px - (i === ys.length - 1 ? 14 : 0), y: py - 9, anchor: i === ys.length - 1 ? 'end' : 'middle', fill: C.ink }));
    });
    // rocket at the tip
    const [rx, ry] = pts[pts.length - 1];
    P.push(`<g transform="translate(${r1(rx)} ${r1(ry)}) rotate(-58)">${rocket()}</g>`);
    css.push(`.flame{animation:flame .18s steps(2) infinite;transform-box:fill-box;transform-origin:right center}`, keyframes('flame', [[0, 'transform:scaleX(1)'], [100, 'transform:scaleX(1.35)']]));
  }

  // HUD chrome
  const br = (x, y, sx, sy) => `<path d="M${x} ${y + sy * 24}V${y}H${x + sx * 24}" fill="none" stroke="${C.cyan}" stroke-opacity=".6" stroke-width="1.5"/>`;
  P.push(br(24, 24, 1, 1), br(W - 24, 24, -1, 1), br(24, H - 24, 1, -1), br(W - 24, H - 24, -1, -1));
  P.push(`<path d="M${X0 - 30} 60V${H - 60}" stroke="${C.cyan}" stroke-opacity=".12"/>`);
  P.push(doc.text(`SECTOR SCAN · UPDATED ${d.today}`, { font: 'mono', size: 10.5, x: 52, y: 56, fill: C.dim, tracking: 0.08 }));
  P.push(`<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="21.5" fill="none" stroke="${C.cyan}" stroke-opacity=".2" stroke-width="1.5"/>`);
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}}`);
  doc.style(css.join('\n'));
  return doc.render(`<g clip-path="url(#frame)">${P.join('')}</g>`);
}

function catmull(pts) {
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
}

function rocket() {
  // pointing +x; nose at (16,0)
  return `<g><path class="flame" d="M-11 -3.2Q-26 0 -11 3.2Z" fill="#ffd36e"/><path class="flame" d="M-11 -1.8Q-19 0 -11 1.8Z" fill="#fff"/>`
    + `<path d="M-11 -5L6 -5Q16 -3 18 0Q16 3 6 5L-11 5Z" fill="#eef2fa"/>`
    + `<path d="M-11 -5L-15 -10L-6 -5ZM-11 5L-15 10L-6 5Z" fill="#ff3dbb"/>`
    + `<circle cx="5" cy="0" r="2.2" fill="#29e7ff" stroke="#1a1036" stroke-width="1"/></g>`;
}
