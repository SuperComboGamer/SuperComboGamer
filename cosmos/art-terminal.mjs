// art-terminal.mjs — "incoming transmission": a terminal that types out who SCG is (data-driven numbers).
import { Doc, keyframes, r1, r2, fmtInt } from './kit.mjs';

const C = { bg: '#0a0920', ink: '#eaf6ff', out: '#b7c3e6', dim: '#6f7ca3', cyan: '#7df9ff', magenta: '#ff3dbb', gold: '#ffd36e', green: '#5dffb0', violet: '#b18cff' };

// lines: { prompt?: bool, cmd?: string, out?: [[text,color,bold]] }
export function terminal({ fonts, d, missions }) {
  const W = 1200;
  const size = 18.5, lh = 30, x0 = 58, top = 112;
  const f1 = missions['aipulsedaily/f1-round2']?.commits;
  const g = d.growth ? (d.growth >= 10 ? Math.round(d.growth) : d.growth.toFixed(1)) : null;
  const script = [
    { cmd: 'whoami' },
    { out: [['SuperComboGamer', C.ink, 1], [` — SCG for short. orbiting GitHub since ${d.since}.`, C.out]] },
    { cmd: 'cat role.txt' },
    { out: [['everything.', C.magenta, 1], ['  game dev · rust · python · typescript · 3D · AI agents', C.out]] },
    { cmd: 'ls ~/missions' },
    { out: [['f1-round2/', C.cyan, 1], ['   ', C.out], ['pulse/', C.green, 1], ['   ', C.out], ['survive-the-night-fps/', '#ff6b6b', 1], ['   ', C.out], ['mission-control/', C.violet, 1]] },
    { cmd: 'scg --telemetry' },
    { out: [['▸ ', C.gold], [fmtInt(d.rolling), C.gold, 1], [' contributions in the last 365 days', C.out], g ? [` (${g}× last year)`, C.dim] : ['', C.dim]] },
    f1 ? { out: [['▸ ', C.gold], [fmtInt(f1), C.gold, 1], [' commits into a 4K film rendered from pure code', C.out]] } : null,
    { out: [['▸ ', C.gold], [fmtInt(d.week), C.gold, 1], [' contributions in the last 7 days. ', C.out], ['still accelerating.', C.ink, 1]] },
    { cmd: 'echo $NEXT_MISSION' },
    { out: [['whatever you think is impossible.', C.cyan, 1]], last: true },
  ].filter(Boolean);
  const H = top + script.length * lh + 58;
  const doc = new Doc({ width: W, height: H, fonts, title: 'Incoming transmission from SCG', desc: script.map((l) => l.cmd ? '$ ' + l.cmd : l.out.map((s) => s[0]).join('')).join('\n') });
  const cw = doc.measure('M', { font: 'mono', size });
  const css = [];
  const P = [];
  doc.def('frame', `<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>`);
  doc.def('gTermBg', `<linearGradient id="gTermBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0b27"/><stop offset="1" stop-color="#07061a"/></linearGradient>`);
  P.push(`<rect width="${W}" height="${H}" fill="${C.bg}"/>`);
  // header bar
  P.push(`<rect width="${W}" height="62" fill="#120f33"/><path d="M0 62H${W}" stroke="${C.cyan}" stroke-opacity=".25"/>`);
  ['#ff5f7e', '#ffd36e', '#5dffb0'].forEach((c, i) => P.push(`<circle cx="${34 + i * 22}" cy="31" r="6.5" fill="${c}" opacity=".9"/>`));
  P.push(doc.text('INCOMING TRANSMISSION', { font: 'hud', size: 13, x: W / 2, y: 36, anchor: 'middle', fill: C.cyan, tracking: 0.38 }));
  P.push(doc.text('ENCRYPTION: NONE · CH 01', { font: 'mono', size: 11.5, x: W - 34, y: 35.5, anchor: 'end', fill: C.dim, tracking: 0.06 }));
  P.push(`<circle cx="${W / 2 - 150}" cy="31" r="4" fill="#ff3b5c" class="rec"/>`);
  css.push(`.rec{animation:rec 1.4s steps(1) infinite}`, keyframes('rec', [[0, 'opacity:1'], [50, 'opacity:.15']]));

  // timeline
  const typeDt = 0.05, cmdPause = 0.4, outPause = 0.24, hold = 16, lead = 0.5;
  let t = lead; const ev = []; // per line: {kind, t0, t1, n, y, x}
  const prompt = 'scg@deep-space:~$ ';
  script.forEach((l, i) => {
    const y = top + i * lh;
    if (l.cmd) {
      const t0 = t + cmdPause, n = l.cmd.length;
      ev.push({ kind: 'cmd', t0, t1: t0 + n * typeDt, n, y, x: x0 + prompt.length * cw, prompt: t });
      t = t0 + n * typeDt + 0.25;
    } else {
      ev.push({ kind: 'out', t0: t + outPause, y });
      t = t + outPause;
    }
  });
  const T = t + hold;
  const pc = (v) => (v / T) * 100;

  // render text lines + covers
  script.forEach((l, i) => {
    const e = ev[i]; const y = e.y;
    const id = `ln${i}`;
    if (l.cmd) {
      // prompt appears when previous line done
      P.push(`<g class="${id}p">` + doc.text('scg@deep-space', { font: 'monob', size, x: x0, y, fill: C.cyan })
        + doc.text(':~$', { font: 'monob', size, x: x0 + 14 * cw, y, fill: C.magenta }) + `</g>`);
      css.push(`.${id}p{animation:${id}p ${r2(T)}s steps(1) infinite;opacity:0}` + keyframes(`${id}p`, [[0, 'opacity:0'], [pc(e.prompt), 'opacity:1'], [99.6, 'opacity:0']]));
      P.push(doc.text(l.cmd, { font: 'mono', size, x: e.x, y, fill: C.ink }));
      // cover slides right in steps
      const wLine = l.cmd.length * cw;
      P.push(`<rect class="${id}c" x="${r1(e.x - 1)}" y="${r1(y - size)}" width="${r1(wLine + 30)}" height="${r1(lh)}" fill="${C.bg}"/>`);
      css.push(`.${id}c{animation:${id}c ${r2(T)}s linear infinite}` + keyframes(`${id}c`, [
        [0, 'transform:translateX(0)'],
        [pc(e.t0), `transform:translateX(0);animation-timing-function:steps(${e.n},end)`],
        [pc(e.t1), `transform:translateX(${r1(wLine + 2)}px)`],
        [99.6, `transform:translateX(${r1(wLine + 2)}px)`],
        [99.61, 'transform:translateX(0)'],
      ]));
    } else {
      let x = x0;
      const segs = [];
      for (const [txt, col, bold] of l.out) {
        if (!txt) continue;
        segs.push(doc.text(txt, { font: bold ? 'monob' : 'mono', size, x, y, fill: col }));
        x += [...txt].length * cw;
      }
      P.push(`<g class="${id}">${segs.join('')}</g>`);
      css.push(`.${id}{animation:${id} ${r2(T)}s steps(1) infinite;opacity:0}` + keyframes(id, [[0, 'opacity:0'], [pc(e.t0), 'opacity:1'], [99.6, 'opacity:0']]));
    }
  });

  // cursor path
  {
    const stops = [];
    const at = (time, x, y, tf) => stops.push([pc(time), `transform:translate(${r1(x)}px,${r1(y)}px)${tf ? `;animation-timing-function:${tf}` : ''}`]);
    const first = ev[0];
    at(0, x0, first.y, 'steps(1)');
    ev.forEach((e, i) => {
      if (e.kind === 'cmd') {
        at(e.prompt + 0.001, e.x, e.y, 'steps(1)');
        at(e.t0, e.x, e.y, `steps(${e.n},end)`);
        at(e.t1, e.x + e.n * cw, e.y, 'steps(1)');
      } else {
        const l = script[i];
        const len = l.out.reduce((a, s) => a + [...s[0]].length, 0);
        at(e.t0, x0 + len * cw + (l.last ? 0 : 0), e.y, 'steps(1)');
      }
    });
    at(99.6 / 100 * T, x0 + 0, first.y, 'steps(1)');
    stops.sort((a, b) => a[0] - b[0]);
    // dedupe equal percentages (keep last)
    const dd = []; for (const s of stops) { if (dd.length && Math.abs(dd[dd.length - 1][0] - s[0]) < 0.0005) dd[dd.length - 1] = s; else dd.push(s); }
    css.push(`.tcur{animation:tcur ${r2(T)}s linear infinite}` + keyframes('tcur', dd));
    css.push(`.tblink{animation:tblink 1.05s steps(1) infinite}` + keyframes('tblink', [[0, 'opacity:1'], [50, 'opacity:0']]));
    P.push(`<g class="tblink"><rect class="tcur" x="1" y="${r1(-size * 0.8)}" width="${r1(cw * 0.6)}" height="${r1(size * 1.02)}" fill="${C.cyan}"/></g>`);
  }

  // scanlines + glow edge + border
  doc.def('pScan', `<pattern id="pScan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".28"/></pattern>`);
  doc.def('gEdge', `<radialGradient id="gEdge" cx=".5" cy=".5" r=".7"><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>`);
  P.push(`<rect y="62" width="${W}" height="${H - 62}" fill="url(#pScan)" opacity=".55"/>`);
  P.push(`<rect width="${W}" height="${H}" fill="url(#gEdge)"/>`);
  P.push(doc.text(`CH-01 · SIGNAL CLEAN · ${d.today}`, { font: 'mono', size: 11, x: W - 34, y: H - 24, anchor: 'end', fill: C.dim, tracking: 0.08 }));
  P.push(`<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="21.5" fill="none" stroke="${C.cyan}" stroke-opacity=".25" stroke-width="1.5"/>`);
  // reduced motion: everything visible, covers gone
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}[class^="ln"]{opacity:1!important}rect[class$="c"]{display:none}}`);
  doc.style(css.join('\n'));
  return doc.render(`<g clip-path="url(#frame)">${P.join('')}</g>`);
}
