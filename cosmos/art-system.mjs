// art-system.mjs — "I'm everything", as a star system: each planet is a discipline, orbiting SCG.
import { Doc, rng, keyframes, r1, r2 } from './kit.mjs';

const C = { ink: '#eaf6ff', dim: '#8fa3c7', faint: '#5d6b8f', cyan: '#7df9ff', magenta: '#ff3dbb', gold: '#ffd36e' };

export function system({ fonts, planets }) {
  const W = 1200, H = 580, cx = 600, cy = 318, tilt = 0.33;
  const doc = new Doc({ width: W, height: H, fonts, title: 'The SCG system: every discipline I build in', desc: planets.map((p) => `${p.name}: ${p.sub}`).join('; ') });
  const R = rng('scg-system-v1');
  const css = [];
  const P = [];
  doc.def('frame', `<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>`);
  doc.def('gBg', `<radialGradient id="gBg" cx="${cx}" cy="${cy}" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1a0d3d"/><stop offset=".45" stop-color="#0a0722"/><stop offset="1" stop-color="#04030d"/></radialGradient>`);
  P.push(`<rect width="${W}" height="${H}" fill="url(#gBg)"/>`);
  // stars
  const st = [];
  for (let i = 0; i < 220; i++) st.push(`<circle cx="${r1(R() * W)}" cy="${r1(R() * H)}" r="${r2(R.range(0.35, 1.2))}" fill="#dfe9ff" opacity="${r2(R.range(0.2, 0.8))}"${R() < 0.25 ? ` class="tw" style="animation-delay:-${r1(R() * 4)}s"` : ''}/>`);
  P.push(`<g>${st.join('')}</g>`);
  css.push(`.tw{animation:tw 3.6s ease-in-out infinite}`, keyframes('tw', [[0, 'opacity:.2'], [50, 'opacity:1'], [100, 'opacity:.2']]));
  // ecliptic glow
  doc.def('gEcl', `<radialGradient id="gEcl"><stop offset="0" stop-color="#7b2cff" stop-opacity=".28"/><stop offset="1" stop-color="#7b2cff" stop-opacity="0"/></radialGradient>`);
  P.push(`<ellipse cx="${cx}" cy="${cy}" rx="560" ry="${560 * tilt}" fill="url(#gEcl)"/>`);

  const orbitPath = (a) => { const b = a * tilt; return `M${cx + a} ${cy}A${a} ${r1(b)} 0 1 1 ${cx - a} ${cy}A${a} ${r1(b)} 0 1 1 ${cx + a} ${cy}Z`; };
  const back = [], front = [], labels = [];
  planets.forEach((p, i) => {
    const a = p.orbit, b = a * tilt;
    // orbit: back half (upper arc) dim, front half brighter
    back.push(`<path d="M${cx - a} ${cy}A${a} ${r1(b)} 0 0 1 ${cx + a} ${cy}" fill="none" stroke="${p.color}" stroke-opacity=".16" stroke-width="1.2" stroke-dasharray="2 6"/>`);
    front.push(`<path d="M${cx + a} ${cy}A${a} ${r1(b)} 0 0 1 ${cx - a} ${cy}" fill="none" stroke="${p.color}" stroke-opacity=".32" stroke-width="1.2"/>`);
    const dur = p.period, begin = `-${r1(p.phase * p.period)}s`;
    const motion = `<animateMotion dur="${dur}s" begin="${begin}" repeatCount="indefinite" path="${orbitPath(a)}"/>`;
    const grad = `gp${i}`;
    doc.def(grad, `<radialGradient id="${grad}" cx=".35" cy=".32" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".18" stop-color="${p.light}"/><stop offset=".65" stop-color="${p.color}"/><stop offset="1" stop-color="${p.dark}"/></radialGradient>`);
    const body = planetBody(p, grad);
    const scale = `<animateTransform attributeName="transform" type="scale" values="1;1.16;1;.86;1" keyTimes="0;.25;.5;.75;1" dur="${dur}s" begin="${begin}" repeatCount="indefinite" calcMode="spline" keySplines=".4 0 .6 1;.4 0 .6 1;.4 0 .6 1;.4 0 .6 1"/>`;
    // front copy visible during first half (lower arc), back copy during second half
    front.push(`<g>${motion}<g opacity="1"><animate attributeName="opacity" values="1;0" keyTimes="0;.5" calcMode="discrete" dur="${dur}s" begin="${begin}" repeatCount="indefinite"/><g>${scale}${body}</g></g></g>`);
    back.push(`<g>${motion}<g opacity="0"><animate attributeName="opacity" values="0;1" keyTimes="0;.5" calcMode="discrete" dur="${dur}s" begin="${begin}" repeatCount="indefinite"/><g>${scale}${body}</g></g></g>`);
    // label rides along, always on top; flips to the left side while the planet is on the right of the orbit
    const lx = p.size + 9;
    const f1 = arcFraction(a, b, Math.acos(0.18));
    const below = i % 2 === 1;
    const lab = (side) => {
      const sx = side === 'r' ? 1 : -1, sy = below ? -1 : 1;
      const tx = sx * (lx + 8), anchor = side === 'r' ? 'start' : 'end';
      const y1 = below ? p.size + 22 : -p.size - 4, y2 = y1 + 15;
      const wName = doc.measure(p.name, { font: 'hud', size: 13, tracking: 0.14 }), wSub = doc.measure(p.sub, { font: 'mono', size: 10.5 });
      const bw = Math.max(wName, wSub) + 14, bx = side === 'r' ? tx - 7 : tx - bw + 7;
      return `<rect x="${r1(bx)}" y="${r1(y1 - 15)}" width="${r1(bw)}" height="36" rx="6" fill="#070518" fill-opacity=".55"/>`
        + `<path d="M${sx * p.size * 0.75} ${-sy * p.size * 0.75}L${sx * (lx - 2)} ${y1 - 4}H${sx * (lx + 4)}" fill="none" stroke="${p.color}" stroke-opacity=".7"/>`
        + doc.text(p.name, { font: 'hud', size: 13, x: tx, y: y1, anchor, fill: C.ink, tracking: 0.14 })
        + doc.text(p.sub, { font: 'mono', size: 10.5, x: tx, y: y2, anchor, fill: p.light });
    };
    const kt = `0;${r2(f1 * 1000) / 1000};${r2((1 - f1) * 1000) / 1000}`;
    labels.push(`<g>${motion}`
      + `<g opacity="0"><animate attributeName="opacity" values="1;0;1" keyTimes="${kt}" calcMode="discrete" dur="${dur}s" begin="${begin}" repeatCount="indefinite"/>${lab('l')}</g>`
      + `<g opacity="1"><animate attributeName="opacity" values="0;1;0" keyTimes="${kt}" calcMode="discrete" dur="${dur}s" begin="${begin}" repeatCount="indefinite"/>${lab('r')}</g>`
      + `</g>`);
  });
  P.push(back.join(''));
  // the star: SCG
  doc.def('gSun', `<radialGradient id="gSun"><stop offset="0" stop-color="#fff"/><stop offset=".2" stop-color="#fff6e8"/><stop offset=".42" stop-color="${C.gold}" stop-opacity=".85"/><stop offset=".62" stop-color="${C.magenta}" stop-opacity=".35"/><stop offset="1" stop-color="#7b2cff" stop-opacity="0"/></radialGradient>`);
  doc.def('gCorona', `<radialGradient id="gCorona"><stop offset=".3" stop-color="${C.gold}" stop-opacity=".25"/><stop offset="1" stop-color="${C.magenta}" stop-opacity="0"/></radialGradient>`);
  const rays = [];
  for (let i = 0; i < 18; i++) { const ang = i * 20 + R.range(-4, 4), len = R.range(60, 110); rays.push(`<path d="M0 -1.4L${r1(len)} 0L0 1.4Z" fill="${C.gold}" opacity="${r2(R.range(0.18, 0.35))}" transform="rotate(${r1(ang)})"/>`); }
  P.push(`<g transform="translate(${cx} ${cy})"><circle r="150" fill="url(#gCorona)" class="cor"/><g class="rays">${rays.join('')}</g><circle r="62" fill="url(#gSun)"/><circle r="15" fill="#fff"/></g>`);
  css.push(`.rays{animation:spin 50s linear infinite;transform-origin:0px 0px}`, keyframes('spin', [[0, 'transform:rotate(0deg)'], [100, 'transform:rotate(360deg)']]),
    `.cor{animation:cor 4s ease-in-out infinite alternate;transform-origin:0px 0px}`, keyframes('cor', [[0, 'transform:scale(.94);opacity:.8'], [100, 'transform:scale(1.06);opacity:1']]));
  P.push(front.join(''));
  P.push(labels.join(''));

  // HUD
  P.push(doc.text('THE SCG SYSTEM', { font: 'hud', size: 15, x: 52, y: 64, fill: C.cyan, tracking: 0.32 }));
  P.push(doc.text('One star. Every discipline in orbit.', { font: 'body', size: 15, x: 52, y: 90, fill: C.dim }));
  P.push(doc.text('CLASS: EVERYTHING', { font: 'mono', size: 11, x: W - 52, y: 60, anchor: 'end', fill: C.gold, tracking: 0.12 }));
  P.push(doc.text(`${planets.length} WORLDS · 1 STAR · 0 LIMITS`, { font: 'mono', size: 11, x: W - 52, y: 80, anchor: 'end', fill: C.dim, tracking: 0.08 }));
  const br = (x, y, sx, sy) => `<path d="M${x} ${y + sy * 24}V${y}H${x + sx * 24}" fill="none" stroke="${C.cyan}" stroke-opacity=".6" stroke-width="1.5"/>`;
  P.push(br(24, 24, 1, 1), br(W - 24, 24, -1, 1), br(24, H - 24, 1, -1), br(W - 24, H - 24, -1, -1));
  P.push(`<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="21.5" fill="none" stroke="${C.cyan}" stroke-opacity=".2" stroke-width="1.5"/>`);
  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}}`);
  doc.style(css.join('\n'));
  return doc.render(`<g clip-path="url(#frame)">${P.join('')}</g>`);
}

// fraction of an ellipse's perimeter from angle 0 to theta (paced animateMotion ⇒ fraction of time)
function arcFraction(a, b, theta) {
  const n = 2000; let total = 0, upTo = 0, px = a, py = 0;
  for (let i = 1; i <= n; i++) {
    const t = (i / n) * 2 * Math.PI, x = a * Math.cos(t), y = b * Math.sin(t);
    const dl = Math.hypot(x - px, y - py); total += dl; if (t <= theta) upTo += dl; px = x; py = y;
  }
  return upTo / total;
}

function planetBody(p, grad) {
  const s = p.size;
  let out = `<circle r="${s * 2.2}" fill="${p.color}" opacity=".12"/>`;
  if (p.ring) out += `<ellipse rx="${s * 1.9}" ry="${s * 0.55}" fill="none" stroke="${p.light}" stroke-opacity=".55" stroke-width="${r1(s * 0.22)}" transform="rotate(-14)"/>`;
  out += `<circle r="${s}" fill="url(#${grad})"/>`;
  if (p.bands) out += `<g opacity=".25"><ellipse cy="${-s * 0.3}" rx="${s * 0.95}" ry="${s * 0.12}" fill="${p.dark}"/><ellipse cy="${s * 0.25}" rx="${s * 0.9}" ry="${s * 0.1}" fill="${p.dark}"/></g>`;
  if (p.ring) out += `<path d="M${r1(-s * 1.9)} 0A${s * 1.9} ${s * 0.55} 0 0 0 ${r1(s * 1.9)} 0" fill="none" stroke="${p.light}" stroke-opacity=".75" stroke-width="${r1(s * 0.22)}" transform="rotate(-14)"/>`;
  if (p.moon) out += `<g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="${p.moon}s" repeatCount="indefinite"/><circle cx="${s * 1.9}" cy="0" r="${r1(s * 0.24)}" fill="#dfe9ff"/></g>`;
  return out;
}
