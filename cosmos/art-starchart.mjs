// art-starchart.mjs — the classic contribution calendar, reimagined as a star chart:
// 53 weeks × 7 days of stars, streaks linked like constellations, a scanner sweeping the year.
import { Doc, rng, keyframes, r1, r2, fmtInt } from './kit.mjs';
import { MONTHS, short } from './derive.mjs';

const C = { ink: '#eaf6ff', dim: '#8fa3c7', faint: '#5d6b8f', cyan: '#7df9ff', cyan2: '#29e7ff', magenta: '#ff3dbb', violet: '#9b7bff', gold: '#ffd36e' };

export function starchart({ fonts, d }) {
  const W = 1200, H = 360;
  const doc = new Doc({ width: W, height: H, fonts, title: `Star chart: ${fmtInt(d.rolling)} contributions in the last year`, desc: 'The contribution calendar drawn as stars; consecutive active days are linked like constellations.' });
  const R = rng('starchart');
  const css = [];
  const P = [];
  doc.def('frame', `<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>`);
  doc.def('gBg', `<radialGradient id="gBg" cx="600" cy="190" r="760" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#140a33"/><stop offset=".6" stop-color="#080620"/><stop offset="1" stop-color="#04030d"/></radialGradient>`);
  P.push(`<rect width="${W}" height="${H}" fill="url(#gBg)"/>`);
  for (let i = 0; i < 160; i++) P.push(`<circle cx="${r1(R() * W)}" cy="${r1(R() * H)}" r="${r2(R.range(0.3, 0.9))}" fill="#dfe9ff" opacity="${r2(R.range(0.1, 0.45))}"/>`);

  // grid geometry
  const first = new Date(d.cal[0].date + 'T00:00:00Z');
  const pad = first.getUTCDay();
  const cells = d.cal.map((day, i) => { const k = i + pad; return { ...day, col: Math.floor(k / 7), row: k % 7 }; });
  const cols = cells[cells.length - 1].col + 1;
  const x0 = 96, y0 = 118, p = Math.min(19.6, (W - x0 - 64) / cols);
  const cx = (c) => x0 + c.col * p + p / 2, cy = (c) => y0 + c.row * p + p / 2;
  const gx1 = x0 + cols * p, gy1 = y0 + 7 * p;

  // header
  P.push(doc.text('STAR CHART', { font: 'hud', size: 15, x: 52, y: 60, fill: C.cyan, tracking: 0.32 }));
  P.push(doc.text('my contribution calendar, mapped as a sky. streaks link up like constellations.', { font: 'body', size: 14.5, x: 52, y: 84, fill: C.dim }));
  doc.def('gNum', `<linearGradient id="gNum" x1="${W - 330}" x2="${W - 52}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="${C.cyan}"/><stop offset="1" stop-color="${C.magenta}"/></linearGradient>`);
  P.push(`<path d="${doc.textD(fmtInt(d.rolling), { font: 'heavy', size: 34, x: W - 52, y: 66, anchor: 'end' })}" fill="url(#gNum)"/>`);
  P.push(doc.text('CONTRIBUTIONS IN THE LAST YEAR', { font: 'mono', size: 10.5, x: W - 52, y: 86, anchor: 'end', fill: C.dim, tracking: 0.1 }));

  // month + weekday labels
  let lastLabelX = -99, lastMonth = -1;
  cells.forEach((c) => {
    const m = +c.date.slice(5, 7) - 1;
    if (m !== lastMonth && c.row <= 6) {
      const x = x0 + c.col * p;
      if (x - lastLabelX > 34 && c.date.slice(8) <= '07') { P.push(doc.text(MONTHS[m], { font: 'mono', size: 11, x, y: y0 - 10, fill: C.dim })); lastLabelX = x; }
      lastMonth = m;
    }
  });
  [['Mon', 1], ['Wed', 3], ['Fri', 5]].forEach(([l, r]) => P.push(doc.text(l, { font: 'mono', size: 10.5, x: x0 - 10, y: y0 + r * p + p / 2 + 3.5, anchor: 'end', fill: C.faint })));

  // constellation links between consecutive active days
  const inRange = (date, s) => s && s.from && date >= s.from && date <= s.to;
  const links = [];
  for (let i = 0; i < cells.length - 1; i++) {
    const a = cells[i], b = cells[i + 1];
    if (a.count > 0 && b.count > 0) {
      const gold = inRange(a.date, d.streak) && inRange(b.date, d.streak);
      const hot = inRange(a.date, d.longest) && inRange(b.date, d.longest);
      links.push(`<path d="M${r1(cx(a))} ${r1(cy(a))}L${r1(cx(b))} ${r1(cy(b))}" stroke="${gold ? C.gold : hot ? C.magenta : C.cyan}" stroke-opacity="${gold || hot ? 0.75 : 0.28}" stroke-width="${gold || hot ? 1.6 : 1}"/>`);
    }
  }
  P.push(`<g>${links.join('')}</g>`);

  // stars, grouped per column so a sweep can light them up
  doc.def('gGlowC', `<radialGradient id="gGlowC"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".3" stop-color="${C.cyan}" stop-opacity=".45"/><stop offset="1" stop-color="${C.cyan2}" stop-opacity="0"/></radialGradient>`);
  doc.def('gGlowM', `<radialGradient id="gGlowM"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset=".35" stop-color="${C.magenta}" stop-opacity=".35"/><stop offset="1" stop-color="${C.magenta}" stop-opacity="0"/></radialGradient>`);
  const sweepDur = 5.5, cycle = 9;
  const byCol = Array.from({ length: cols }, () => []);
  cells.forEach((c) => {
    const x = r1(cx(c)), y = r1(cy(c)), n = c.count;
    let s;
    if (n <= 0) s = `<circle cx="${x}" cy="${y}" r="1.3" fill="#6f63a8" opacity=".45"/>`;
    else if (n < 4) s = `<circle cx="${x}" cy="${y}" r="2.3" fill="#a39bff"/>`;
    else if (n < 11) s = `<circle cx="${x}" cy="${y}" r="3" fill="#c58bff"/>`;
    else if (n < 30) s = `<circle cx="${x}" cy="${y}" r="9" fill="url(#gGlowM)" opacity=".7"/><circle cx="${x}" cy="${y}" r="3.6" fill="#ff6fd8"/>`;
    else if (n < 80) s = `<circle cx="${x}" cy="${y}" r="12" fill="url(#gGlowC)" opacity=".75"/><circle cx="${x}" cy="${y}" r="4.3" fill="${C.cyan}"/>`;
    else s = `<circle cx="${x}" cy="${y}" r="16" fill="url(#gGlowC)"/><path transform="translate(${x} ${y})" d="M-13 0L0-1L13 0L0 1ZM0-13L1 0L0 13L-1 0Z" fill="#fff" opacity=".85"/><circle cx="${x}" cy="${y}" r="4.8" fill="#fff"/>`;
    byCol[c.col].push(s);
  });
  byCol.forEach((stars, col) => {
    const delay = r2((col / cols) * sweepDur);
    P.push(`<g class="col" style="animation-delay:${delay}s">${stars.join('')}</g>`);
  });
  css.push(`.col{animation:col ${cycle}s ease-out infinite}`, keyframes('col', [[0, 'opacity:1'], [10, 'opacity:.62'], [100, 'opacity:.62']]));
  // scanner beam
  doc.def('gBeam', `<linearGradient id="gBeam" x1="0" x2="1"><stop offset="0" stop-color="${C.cyan}" stop-opacity="0"/><stop offset=".85" stop-color="${C.cyan}" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient>`);
  P.push(`<rect class="beam" x="${x0 - 60}" y="${y0 - 6}" width="60" height="${r1(7 * p + 12)}" fill="url(#gBeam)"/>`);
  const travel = r1(gx1 - x0 + 4);
  css.push(`.beam{animation:beam ${cycle}s linear infinite;opacity:0}`, keyframes('beam', [[0, 'transform:translateX(0);opacity:0'], [3, 'opacity:1'], [(sweepDur / cycle) * 100, `transform:translateX(${travel}px);opacity:1`], [(sweepDur / cycle) * 100 + 4, `transform:translateX(${travel}px);opacity:0`], [100, `transform:translateX(${travel}px);opacity:0`]]));
  // today
  const today = cells[cells.length - 1];
  P.push(`<circle cx="${r1(cx(today))}" cy="${r1(cy(today))}" r="7" fill="none" stroke="${C.gold}" stroke-width="1.6" class="tod"/>`);
  css.push(`.tod{animation:tod 2s ease-out infinite;transform-box:fill-box;transform-origin:center}`, keyframes('tod', [[0, 'transform:scale(.7);opacity:1'], [100, 'transform:scale(2.2);opacity:0']]));

  // footer: legend + streak key
  const ly = gy1 + 46;
  P.push(doc.text('LESS', { font: 'mono', size: 10.5, x: x0, y: ly + 4, fill: C.faint, tracking: 0.08 }));
  const lx0 = x0 + 40;
  [['#6f63a8', 1.3], ['#a39bff', 2.3], ['#c58bff', 3], ['#ff6fd8', 3.6], [C.cyan, 4.3], ['#fff', 4.8]].forEach(([col, r], i) => P.push(`<circle cx="${lx0 + i * 18}" cy="${ly}" r="${r}" fill="${col}"/>`));
  P.push(doc.text('MORE', { font: 'mono', size: 10.5, x: lx0 + 6 * 18 - 4, y: ly + 4, fill: C.faint, tracking: 0.08 }));
  const keyX = 420;
  P.push(`<path d="M${keyX} ${ly}h26" stroke="${C.gold}" stroke-width="1.8"/>`);
  P.push(doc.text(`current streak · ${d.streak.len} ${d.streak.len === 1 ? 'day' : 'days'}`, { font: 'mono', size: 11, x: keyX + 34, y: ly + 4, fill: C.gold }));
  const k2 = keyX + 250;
  P.push(`<path d="M${k2} ${ly}h26" stroke="${C.magenta}" stroke-width="1.8"/>`);
  P.push(doc.text(`longest · ${d.longest.len} days (${short(d.longest.from)} → ${short(d.longest.to)})`, { font: 'mono', size: 11, x: k2 + 34, y: ly + 4, fill: '#ff8fe0' }));
  const tw = doc.measure(`TODAY · ${short(today.date)}`, { font: 'mono', size: 11, tracking: 0.06 });
  P.push(`<circle cx="${r1(W - 52 - tw - 12)}" cy="${ly}" r="4.5" fill="none" stroke="${C.gold}" stroke-width="1.6"/>`);
  P.push(doc.text(`TODAY · ${short(today.date)}`, { font: 'mono', size: 11, x: W - 52, y: ly + 4, anchor: 'end', fill: C.gold, tracking: 0.06 }));

  const br = (x, y, sx, sy) => `<path d="M${x} ${y + sy * 24}V${y}H${x + sx * 24}" fill="none" stroke="${C.cyan}" stroke-opacity=".6" stroke-width="1.5"/>`;
  P.push(br(24, 24, 1, 1), br(W - 24, 24, -1, 1), br(24, H - 24, 1, -1), br(W - 24, H - 24, -1, -1));
  P.push(`<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="21.5" fill="none" stroke="${C.cyan}" stroke-opacity=".2" stroke-width="1.5"/>`);
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}.beam{display:none}}`);
  doc.style(css.join('\n'));
  return doc.render(`<g clip-path="url(#frame)">${P.join('')}</g>`);
}
