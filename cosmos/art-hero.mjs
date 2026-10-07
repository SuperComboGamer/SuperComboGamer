// art-hero.mjs — the launch banner: deep-space scene, title, "I'M EVERYTHING", typed roles, live mission clock.
import { Doc, rng, keyframes, pct, r1, r2, fmtInt, b64 } from './kit.mjs';

const C = {
  void: '#04020c', ink: '#eaf6ff', dim: '#8fa3c7', cyan: '#7df9ff', cyan2: '#29e7ff',
  magenta: '#ff3dbb', violet: '#7b2cff', gold: '#ffd36e', planet: '#06031a',
};

export function hero({ fonts, nebula, data }) {
  const W = 1200, H = 600;
  const doc = new Doc({ width: W, height: H, fonts, title: "SuperComboGamer — I'm everything.", desc: 'Animated deep-space transmission banner' });
  const R = rng('scg-hero-v1');
  const parts = [];
  const css = [];

  // ---------- defs: gradients / clips ----------
  doc.def('frame', `<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>`);
  doc.def('gStar', `<radialGradient id="gStar"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".25" stop-color="#e8f4ff" stop-opacity=".55"/><stop offset="1" stop-color="#bfe8ff" stop-opacity="0"/></radialGradient>`);
  doc.def('gVig', `<radialGradient id="gVig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>`);

  // ---------- background nebula (raster, drifts very slowly) ----------
  parts.push(`<rect width="${W}" height="${H}" fill="${C.void}"/>`);
  parts.push(`<g class="neb"><image href="data:image/jpeg;base64,${b64(nebula)}" x="-20" y="-10" width="${W + 40}" height="${H + 20}" preserveAspectRatio="none"/></g>`);
  css.push(`.neb{animation:neb 90s ease-in-out infinite alternate}`, keyframes('neb', [[0, 'transform:translate(0,0) scale(1)'], [100, 'transform:translate(-14px,4px) scale(1.012)']]));

  // ---------- vector starfield, 3 parallax layers ----------
  const starLayer = (n, rmin, rmax, omin, omax, cls, dur, tints) => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const x = R() * W, y = R() * 470, r = R.range(rmin, rmax), o = R.range(omin, omax);
      const fill = R.pick(tints);
      const tw = R() < 0.35 ? ` class="tw${R.int(1, 4)}" style="animation-delay:-${r1(R() * 6)}s"` : '';
      pts.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r2(r)}" fill="${fill}" opacity="${r2(o)}"${tw}/>`);
    }
    const tile = pts.join('');
    css.push(`.${cls}{animation:drift ${dur}s linear infinite}`);
    return `<g class="${cls}"><g>${tile}</g><g transform="translate(${W} 0)">${tile}</g></g>`;
  };
  css.push(keyframes('drift', [[0, 'transform:translateX(0)'], [100, `transform:translateX(-${W}px)`]]));
  for (let k = 1; k <= 4; k++) {
    const d = [3.1, 4.3, 5.7, 7.9][k - 1];
    css.push(`.tw${k}{animation:tw ${d}s ease-in-out infinite}`);
  }
  css.push(keyframes('tw', [[0, 'opacity:.25'], [50, 'opacity:1'], [100, 'opacity:.25']]));
  parts.push(starLayer(150, 0.4, 0.85, 0.3, 0.8, 'sfar', 640, ['#dfe9ff', '#cfdcff', '#ffe6f6']));
  parts.push(starLayer(55, 0.85, 1.45, 0.55, 1, 'smid', 330, ['#ffffff', '#cfe3ff', '#ffd9f2', '#c9fbff']));

  // bright stars with diffraction spikes (slow drift)
  {
    const pts = [];
    const spots = [[88, 70], [262, 132], [405, 52], [520, 380], [668, 96], [835, 160], [990, 64], [1105, 228], [1150, 395], [330, 300], [930, 330], [60, 330]];
    spots.forEach(([x, y], i) => {
      const L = R.range(10, 26), s = R.range(0.8, 1.25);
      const tint = R.pick(['#ffffff', '#c9fbff', '#ffd9f2', '#e9dcff']);
      const dl = r1(R() * 5);
      pts.push(`<g transform="translate(${x} ${y}) scale(${r2(s)})"><g class="bs" style="animation-delay:-${dl}s;animation-duration:${r1(R.range(3.5, 6.5))}s">`
        + `<circle r="9" fill="url(#gStar)" opacity=".7"/>`
        + `<path d="M-${r1(L)} 0L0-.55L${r1(L)} 0L0 .55ZM0-${r1(L * 0.8)}L.55 0L0 ${r1(L * 0.8)}L-.55 0Z" fill="${tint}" opacity=".75"/>`
        + `<circle r="1.5" fill="#fff"/></g></g>`);
    });
    const tile = pts.join('');
    css.push(`.sbright{animation:drift 220s linear infinite}`, `.bs{animation:bs 5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}`,
      keyframes('bs', [[0, 'opacity:.75;transform:scale(.9) rotate(0deg)'], [50, 'opacity:1;transform:scale(1.15) rotate(8deg)'], [100, 'opacity:.75;transform:scale(.9) rotate(0deg)']]));
    parts.push(`<g class="sbright"><g>${tile}</g><g transform="translate(${W} 0)">${tile}</g></g>`);
  }

  // ---------- shooting stars ----------
  doc.def('gMet', `<linearGradient id="gMet" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#c9fbff" stop-opacity=".7"/><stop offset="1" stop-color="#fff"/></linearGradient>`);
  [[980, 40, 152, 11, 1.2], [620, 20, 160, 17, 7.6], [1190, 170, 148, 23, 14.1]].forEach(([x, y, ang, period, delay], i) => {
    css.push(`.met${i}{animation:met${i} ${period}s linear ${delay}s infinite;opacity:0}`);
    const on = 1.1 / period * 100;
    css.push(keyframes(`met${i}`, [[0, 'opacity:0;transform:translateX(0)'], [on * 0.15, 'opacity:1'], [on, 'opacity:0;transform:translateX(520px)'], [100, 'opacity:0;transform:translateX(520px)']]));
    parts.push(`<g transform="translate(${x} ${y}) rotate(${ang})"><g class="met${i}"><rect x="-150" y="-0.8" width="150" height="1.6" rx=".8" fill="url(#gMet)"/><circle r="1.8" fill="#fff"/></g></g>`);
  });

  // ---------- planet + atmosphere + sunrise ----------
  const PR = 1767, PCX = 600, PCY = 2222; // horizon top at y=455
  const sunX = 760, sunY = PCY - Math.sqrt(PR * PR - (sunX - PCX) ** 2); // ~462
  const a = PR + 80;
  doc.def('gAtm', `<radialGradient id="gAtm" cx="${PCX}" cy="${PCY}" r="${a}" gradientUnits="userSpaceOnUse">`
    + `<stop offset="${(PR - 2) / a}" stop-color="#bff" stop-opacity="0"/>`
    + `<stop offset="${PR / a}" stop-color="#d8fdff" stop-opacity="1"/>`
    + `<stop offset="${(PR + 5) / a}" stop-color="${C.cyan2}" stop-opacity=".6"/>`
    + `<stop offset="${(PR + 20) / a}" stop-color="${C.violet}" stop-opacity=".28"/>`
    + `<stop offset="${(PR + 48) / a}" stop-color="${C.magenta}" stop-opacity=".08"/>`
    + `<stop offset="1" stop-color="${C.magenta}" stop-opacity="0"/></radialGradient>`);
  doc.def('gAtmMask', `<linearGradient id="gAtmMaskG" x1="0" x2="${W}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="${sunX / W}" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient>`
    + `<mask id="mAtm"><rect width="${W}" height="${H}" fill="url(#gAtmMaskG)"/></mask>`);
  doc.def('gPlanet', `<radialGradient id="gPlanet" cx="${sunX}" cy="${sunY - 40}" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1d1147"/><stop offset=".18" stop-color="#0d0727"/><stop offset=".6" stop-color="${C.planet}"/><stop offset="1" stop-color="#030110"/></radialGradient>`);
  doc.def('cPlanet', `<clipPath id="cPlanet"><circle cx="${PCX}" cy="${PCY}" r="${PR}"/></clipPath>`);
  doc.def('mAbove', `<mask id="mAbove"><rect width="${W}" height="${H}" fill="#fff"/><circle cx="${PCX}" cy="${PCY}" r="${PR}" fill="#000"/></mask>`);

  // atmosphere glow band (behind planet body)
  parts.push(`<g mask="url(#mAtm)"><circle cx="${PCX}" cy="${PCY}" r="${a}" fill="url(#gAtm)" class="atm"/></g>`);
  css.push(`.atm{animation:atm 7s ease-in-out infinite alternate}`, keyframes('atm', [[0, 'opacity:.82'], [100, 'opacity:1']]));
  // planet body
  parts.push(`<circle cx="${PCX}" cy="${PCY}" r="${PR}" fill="url(#gPlanet)"/>`);
  // cloud bands lit by sunrise (clipped to planet)
  {
    const bands = [];
    const rs = [[7, 1.4, '#7df9ff', .35, '30 14 80 22'], [15, 2.4, '#9b7bff', .22, '120 30 60 40'], [27, 3, '#ff7ad8', .14, '200 60 90 30'], [44, 4, '#7df9ff', .09, '160 90 120 50'], [66, 6, '#9b7bff', .07, '260 80 140 60']];
    rs.forEach(([d, sw, col, op, dash], i) => bands.push(`<circle cx="${PCX}" cy="${PCY}" r="${PR - d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-dasharray="${dash}" opacity="${op}" class="cb${i % 2}"/>`));
    parts.push(`<g clip-path="url(#cPlanet)" mask="url(#mAtm)">${bands.join('')}</g>`);
    css.push(`.cb0{animation:cb 160s linear infinite}`, `.cb1{animation:cb 240s linear infinite reverse}`,
      keyframes('cb', [[0, 'stroke-dashoffset:0'], [100, 'stroke-dashoffset:-1200']]));
  }
  // crisp limb line
  doc.def('gRim', `<linearGradient id="gRim" x1="0" x2="${W}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.violet}" stop-opacity=".2"/><stop offset="${(sunX - 260) / W}" stop-color="${C.cyan}" stop-opacity=".8"/><stop offset="${sunX / W}" stop-color="#fff"/><stop offset="${(sunX + 240) / W}" stop-color="${C.cyan}" stop-opacity=".8"/><stop offset="1" stop-color="${C.magenta}" stop-opacity=".25"/></linearGradient>`);
  parts.push(`<circle cx="${PCX}" cy="${PCY}" r="${PR}" fill="none" stroke="url(#gRim)" stroke-width="1.6"/>`);

  // sunrise flare
  doc.def('gSun', `<radialGradient id="gSun"><stop offset="0" stop-color="#fff"/><stop offset=".08" stop-color="#fff" stop-opacity=".95"/><stop offset=".22" stop-color="#ffe3f6" stop-opacity=".55"/><stop offset=".5" stop-color="${C.magenta}" stop-opacity=".16"/><stop offset="1" stop-color="${C.violet}" stop-opacity="0"/></radialGradient>`);
  doc.def('gStreak', `<radialGradient id="gStreak"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#d8fdff" stop-opacity=".8"/><stop offset="1" stop-color="${C.cyan2}" stop-opacity="0"/></radialGradient>`);
  doc.def('gHaze', `<radialGradient id="gHaze"><stop offset="0" stop-color="#ffd6f3" stop-opacity=".55"/><stop offset=".4" stop-color="${C.magenta}" stop-opacity=".18"/><stop offset="1" stop-color="${C.violet}" stop-opacity="0"/></radialGradient>`);
  parts.push(`<g class="sun">`
    + `<ellipse cx="${sunX}" cy="${r1(sunY)}" rx="520" ry="70" fill="url(#gHaze)"/>`
    + `<g mask="url(#mAbove)"><circle cx="${sunX}" cy="${r1(sunY + 4)}" r="150" fill="url(#gSun)"/></g>`
    + `<ellipse cx="${sunX}" cy="${r1(sunY - 1)}" rx="430" ry="9" fill="url(#gStreak)" opacity=".35"/>`
    + `<ellipse cx="${sunX}" cy="${r1(sunY - 1)}" rx="620" ry="1.6" fill="url(#gStreak)" class="streak"/>`
    + `</g>`);
  css.push(`.sun{animation:sun 6s ease-in-out infinite alternate}`, keyframes('sun', [[0, 'opacity:.88'], [100, 'opacity:1']]),
    `.streak{animation:streak 3.2s ease-in-out infinite alternate}`, keyframes('streak', [[0, 'opacity:.65'], [100, 'opacity:1']]));
  // rays
  {
    const rays = [];
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * 180 + R.range(-5, 5) + 180; // upper half
      const len = R.range(120, 260);
      rays.push(`<path d="M0 -0.6L${r1(len)} 0L0 0.6Z" fill="#fff" opacity="${r2(R.range(0.05, 0.14))}" transform="rotate(${r1(ang)})"/>`);
    }
    parts.push(`<g transform="translate(${sunX} ${r1(sunY)})" mask="url(#mAboveLocal)"><g class="rays">${rays.join('')}</g></g>`);
    doc.def('mAboveLocal', `<mask id="mAboveLocal" maskUnits="userSpaceOnUse" x="-400" y="-400" width="800" height="800"><rect x="-400" y="-400" width="800" height="800" fill="#fff"/><circle cx="${PCX - sunX}" cy="${r1(PCY - sunY)}" r="${PR}" fill="#000"/></mask>`);
    css.push(`.rays{animation:rays 80s linear infinite}`, keyframes('rays', [[0, 'transform:rotate(0deg)'], [100, 'transform:rotate(360deg)']]));
  }
  // lens ghosts along flare→centre axis
  {
    const vx = 600 - sunX, vy = 300 - sunY; const g = [];
    doc.def('gGhostC', `<radialGradient id="gGhostC"><stop offset=".55" stop-color="${C.cyan}" stop-opacity="0"/><stop offset=".92" stop-color="${C.cyan}" stop-opacity=".22"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></radialGradient>`);
    doc.def('gGhostM', `<radialGradient id="gGhostM"><stop offset="0" stop-color="${C.magenta}" stop-opacity=".10"/><stop offset=".8" stop-color="${C.magenta}" stop-opacity=".06"/><stop offset="1" stop-color="${C.magenta}" stop-opacity="0"/></radialGradient>`);
    [[0.75, 9, 'gGhostM'], [1.25, 5, 'gGhostM']].forEach(([t, r, gr]) => {
      g.push(`<circle cx="${r1(sunX + vx * t)}" cy="${r1(sunY + vy * t)}" r="${r}" fill="url(#${gr})"/>`);
    });
    parts.push(`<g class="ghosts">${g.join('')}</g>`);
    css.push(`.ghosts{animation:sun 6s ease-in-out infinite alternate}`);
  }

  // ---------- astronaut (original, floats over the horizon) ----------
  parts.push(`<g transform="translate(150 392) scale(1.12)"><g class="astro-drift"><g class="astro-spin">${astronaut()}</g></g></g>`);
  css.push(`.astro-drift{animation:adrift 38s ease-in-out infinite}`, keyframes('adrift', [[0, 'transform:translate(0,0)'], [33, 'transform:translate(26px,-16px)'], [66, 'transform:translate(-10px,-30px)'], [100, 'transform:translate(0,0)']]),
    `.astro-spin{animation:aspin 27s ease-in-out infinite;transform-box:fill-box;transform-origin:center}`, keyframes('aspin', [[0, 'transform:rotate(-14deg)'], [50, 'transform:rotate(16deg)'], [100, 'transform:rotate(-14deg)']]));

  // ---------- typography ----------
  // overline
  parts.push(`<g opacity=".9">${doc.text('INCOMING TRANSMISSION  //  SCG-01', { font: 'hud', size: 13, x: 600, y: 118, anchor: 'middle', tracking: 0.42, fill: C.cyan })}</g>`);
  // flanking rules
  parts.push(`<path d="M360 113.5H420M780 113.5H840" stroke="${C.cyan}" stroke-opacity=".45" stroke-width="1"/>`);

  // title — Michroma, combined path for gradient + sweep
  const tOpts = { font: 'title', size: 47, x: 600, y: 196, anchor: 'middle', tracking: 0.11 };
  const tD = doc.textD('SUPERCOMBOGAMER', tOpts);
  const tW = doc.measure('SUPERCOMBOGAMER', tOpts);
  doc.def('pTitle', `<path id="pTitle" d="${tD}"/>`);
  doc.def('cTitle', `<clipPath id="cTitle"><use href="#pTitle"/></clipPath>`);
  doc.def('gTitle', `<linearGradient id="gTitle" x1="0" y1="150" x2="0" y2="200" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e3f3ff"/><stop offset="1" stop-color="#9fdcff"/></linearGradient>`);
  doc.def('fGlow', `<filter id="fGlow" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>`);
  doc.def('fGlowS', `<filter id="fGlowS" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>`);
  doc.def('gSweep', `<linearGradient id="gSweep" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`);
  parts.push(`<use href="#pTitle" fill="${C.cyan2}" opacity=".55" filter="url(#fGlow)"/>`);
  parts.push(`<use href="#pTitle" fill="${C.magenta}" opacity=".55" transform="translate(-1.6 0)"/>`);
  parts.push(`<use href="#pTitle" fill="${C.cyan2}" opacity=".55" transform="translate(1.6 0)"/>`);
  parts.push(`<use href="#pTitle" fill="url(#gTitle)"/>`);
  parts.push(`<g clip-path="url(#cTitle)"><rect class="sweep" x="${600 - tW / 2 - 220}" y="140" width="140" height="70" fill="url(#gSweep)" transform="skewX(-20)"/></g>`);
  css.push(`.sweep{animation:sweep 7s cubic-bezier(.5,0,.3,1) 1.2s infinite}`, keyframes('sweep', [[0, 'transform:skewX(-20deg) translateX(0)'], [28, `transform:skewX(-20deg) translateX(${Math.round(tW + 560)}px)`], [100, `transform:skewX(-20deg) translateX(${Math.round(tW + 560)}px)`]]));
  // glitch slices
  doc.def('cSlice1', `<clipPath id="cSlice1"><rect x="0" y="166" width="${W}" height="9"/></clipPath>`);
  doc.def('cSlice2', `<clipPath id="cSlice2"><rect x="0" y="182" width="${W}" height="6"/></clipPath>`);
  parts.push(`<g clip-path="url(#cSlice1)"><use href="#pTitle" fill="${C.magenta}" class="gl1"/></g><g clip-path="url(#cSlice2)"><use href="#pTitle" fill="${C.cyan}" class="gl2"/></g>`);
  css.push(`.gl1{animation:gl1 6.3s steps(1) infinite;opacity:0}`, keyframes('gl1', [[0, 'opacity:0;transform:translateX(0)'], [61, 'opacity:1;transform:translateX(14px)'], [62, 'opacity:1;transform:translateX(-9px)'], [63.2, 'opacity:0;transform:translateX(0)'], [100, 'opacity:0']]),
    `.gl2{animation:gl2 6.3s steps(1) infinite;opacity:0}`, keyframes('gl2', [[0, 'opacity:0;transform:translateX(0)'], [61.6, 'opacity:1;transform:translateX(-16px)'], [62.6, 'opacity:1;transform:translateX(6px)'], [63.6, 'opacity:0;transform:translateX(0)'], [100, 'opacity:0']]));

  // statement — I'M EVERYTHING. with flowing spectrum
  const sOpts = { font: 'heavy', size: 40, x: 600, y: 262, anchor: 'middle', tracking: 0.07 };
  const sD = doc.textD("I'M EVERYTHING.", sOpts);
  const sW = doc.measure("I'M EVERYTHING.", sOpts);
  doc.def('pState', `<path id="pState" d="${sD}"/>`);
  doc.def('cState', `<clipPath id="cState"><use href="#pState"/></clipPath>`);
  const spec = [C.cyan, '#9b7bff', C.magenta, C.gold, C.cyan];
  doc.def('gSpec', `<linearGradient id="gSpec" x1="0" x2="${r1(sW)}" gradientUnits="userSpaceOnUse" spreadMethod="repeat">${spec.map((c, i) => `<stop offset="${i / (spec.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`);
  parts.push(`<use href="#pState" fill="${C.magenta}" opacity=".5" filter="url(#fGlow)"/>`);
  parts.push(`<g clip-path="url(#cState)"><rect class="spec" x="${r1(600 - sW / 2 - sW)}" y="215" width="${r1(sW * 3)}" height="60" fill="url(#gSpec)"/></g>`);
  css.push(`.spec{animation:spec 8s linear infinite}`, keyframes('spec', [[0, 'transform:translateX(0)'], [100, `transform:translateX(${r1(sW)}px)`]]));

  // typed roles
  parts.push(typer(doc, css, {
    x: 600, y: 320, size: 19,
    roles: data.roles,
  }));

  // ---------- HUD ----------
  const hud = [];
  const br = (x, y, sx, sy) => `<path d="M${x} ${y + sy * 26}V${y}H${x + sx * 26}" fill="none" stroke="${C.cyan}" stroke-opacity=".7" stroke-width="1.5"/>`;
  hud.push(br(26, 26, 1, 1), br(W - 26, 26, -1, 1), br(26, H - 26, 1, -1), br(W - 26, H - 26, -1, -1));
  // live tag
  hud.push(`<circle cx="52" cy="50" r="4.5" fill="#ff3b5c" class="live"/>`);
  hud.push(doc.text('LIVE', { font: 'monob', size: 13, x: 64, y: 55, fill: '#ff6b84', tracking: 0.12 }));
  hud.push(doc.text('DEEP-SPACE FEED · CAM 01', { font: 'mono', size: 11, x: 114, y: 54.5, fill: C.dim, tracking: 0.06 }));
  css.push(`.live{animation:live 1.6s steps(1) infinite}`, keyframes('live', [[0, 'opacity:1'], [50, 'opacity:.15'], [100, 'opacity:1']]));
  // mission clock (top-right)
  hud.push(clock(doc, css, { xRight: W - 50, y: 57, size: 18 }));
  hud.push(doc.text('MISSION ELAPSED SINCE YOU ARRIVED', { font: 'mono', size: 9.5, x: W - 50, y: 74, anchor: 'end', fill: C.dim, tracking: 0.08 }));
  // bottom-left telemetry
  hud.push(doc.text(`LOG ${fmtInt(data.lifetime)} CONTRIBUTIONS · ORBITING SINCE ${data.since}`, { font: 'mono', size: 11, x: 52, y: H - 46, fill: C.dim, tracking: 0.06 }));
  // bottom-right signal meter
  {
    const by = H - 46;
    const lockW = doc.measure('LOCKED', { font: 'monob', size: 11, tracking: 0.1 });
    const barsR = W - 52 - lockW - 12, barsL = barsR - 41;
    hud.push(doc.text('SIGNAL', { font: 'mono', size: 11, x: barsL - 10, y: by, anchor: 'end', fill: C.dim, tracking: 0.1 }));
    for (let i = 0; i < 5; i++) hud.push(`<rect x="${r1(barsL + i * 9)}" y="${r1(by - 4 - i * 2.5)}" width="5" height="${4 + i * 2.5}" fill="${C.cyan}" class="sig${i}"/>`);
    hud.push(doc.text('LOCKED', { font: 'monob', size: 11, x: W - 52, y: by, anchor: 'end', fill: C.cyan, tracking: 0.1 }));
    css.push(`.sig4{animation:sig 2.4s steps(1) infinite}`, `.sig3{animation:sig 3.1s steps(1) .7s infinite}`, keyframes('sig', [[0, 'opacity:1'], [40, 'opacity:.2'], [70, 'opacity:1'], [100, 'opacity:1']]));
  }
  parts.push(`<g>${hud.join('')}</g>`);

  // scan line + scanlines + vignette
  doc.def('pScan', `<pattern id="pScan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".22"/></pattern>`);
  doc.def('gScanBar', `<linearGradient id="gScanBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.cyan}" stop-opacity="0"/><stop offset=".8" stop-color="${C.cyan}" stop-opacity=".045"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></linearGradient>`);
  parts.push(`<rect width="${W}" height="${H}" fill="url(#gVig)"/>`);
  parts.push(`<rect width="${W}" height="${H}" fill="url(#pScan)" opacity=".5"/>`);
  parts.push(`<rect class="scanbar" x="0" y="-90" width="${W}" height="90" fill="url(#gScanBar)"/>`);
  css.push(`.scanbar{animation:scanbar 9s linear infinite}`, keyframes('scanbar', [[0, 'transform:translateY(0)'], [100, `transform:translateY(${H + 90}px)`]]));
  // frame border
  parts.push(`<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="21.5" fill="none" stroke="${C.cyan}" stroke-opacity=".22" stroke-width="1.5"/>`);

  css.push(`@media (prefers-reduced-motion: reduce){*{animation:none!important}.tyl use{opacity:1!important}}`);
  doc.style(css.join('\n'));
  return doc.render(`<g clip-path="url(#frame)">${parts.join('')}</g>`);
}

// ---- astronaut: original flat illustration, ~70px tall, centred on (0,0) ----
function astronaut() {
  const suit = '#eef2fa', shade = '#c5cde2', dark = '#8e98b6';
  return `<g>`
    // backpack
    + `<rect x="-19" y="-8" width="38" height="38" rx="7" fill="${dark}"/>`
    // legs
    + `<path d="M-7 26L-11 42L-7 52" fill="none" stroke="${suit}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M7 26L13 40L19 48" fill="none" stroke="${shade}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<rect x="-14" y="49" width="13" height="8" rx="3" fill="${dark}"/><rect x="13" y="45" width="13" height="8" rx="3" fill="${dark}" transform="rotate(38 19 49)"/>`
    // torso
    + `<rect x="-15" y="-2" width="30" height="33" rx="10" fill="${suit}"/>`
    + `<path d="M6 -1Q15 0 15 9V21Q15 30 6 31Z" fill="${shade}" opacity=".7"/>`
    + `<rect x="-8" y="8" width="16" height="10" rx="2.5" fill="#241a4d"/>`
    + `<circle cx="-4" cy="13" r="1.8" fill="#ff3dbb"/><circle cx="1" cy="13" r="1.8" fill="#29e7ff"/><rect x="4" y="11.5" width="2.6" height="3" rx=".6" fill="#ffd36e"/>`
    // arms
    + `<path d="M-13 3L-25 -4L-31 -15" fill="none" stroke="${suit}" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M13 4L24 13L27 25" fill="none" stroke="${shade}" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<circle cx="-31" cy="-16" r="5" fill="${dark}"/><circle cx="27" cy="26" r="5" fill="${dark}"/>`
    // helmet
    + `<circle cx="0" cy="-13" r="16.5" fill="${suit}"/>`
    + `<path d="M8 -26Q17 -19 16 -8Q14 1 5 3Q13 -6 8 -26Z" fill="${shade}" opacity=".8"/>`
    + `<rect x="-11.5" y="-22" width="23" height="17" rx="8.5" fill="#1a1036"/>`
    + `<rect x="-11.5" y="-22" width="23" height="17" rx="8.5" fill="url(#gVisor)"/>`
    + `<path d="M-7 -18.5Q-3 -21 3 -20" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".85"/>`
    + `<circle cx="6" cy="-10" r="1.2" fill="#fff" opacity=".7"/>`
    + `<defs><linearGradient id="gVisor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7b2cff" stop-opacity=".9"/><stop offset=".5" stop-color="#ff3dbb" stop-opacity=".55"/><stop offset="1" stop-color="#29e7ff" stop-opacity=".7"/></linearGradient></defs>`
    + `</g>`;
}

// ---- typed role cycler: per-glyph visibility keyframes + stepping cursor ----
function typer(doc, css, { x, y, size, roles }) {
  const font = 'mono';
  const cw = doc.measure('M', { font, size }); // monospace advance
  const prefix = '> ';
  const maxLen = Math.max(...roles.map((r) => r.length));
  const totalW = (prefix.length + maxLen) * cw;
  const x0 = x - totalW / 2; // left-align the block, centred on longest role
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
  out.push(doc.text(prefix, { font: 'monob', size, x: x0, y, fill: '#ff3dbb' }));
  const rx = x0 + prefix.length * cw;
  // per-glyph visibility
  let gid = 0;
  const kf = [];
  slots.forEach((s, k) => {
    const n = s.r.length;
    const g = doc.text(s.r, {
      font, size, x: rx, y, fill: k === slots.length - 1 ? '#7df9ff' : '#dfe8ff', cls: k === slots.length - 1 ? 'tyl' : undefined,
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
  out.push(`<g class="tblink"><rect class="tcur" x="${r1(rx + 1)}" y="${r1(y - size * 0.78)}" width="${r1(cw * 0.62)}" height="${r1(size * 0.98)}" fill="#7df9ff"/></g>`);
  return `<g>${out.join('')}</g>`;
}

// ---- odometer mission clock: T+ HH:MM:SS that starts when the image loads ----
function clock(doc, css, { xRight, y, size }) {
  const font = 'monob';
  const cw = doc.measure('0', { font, size });
  const lh = size * 1.35;
  const label = 'T+ 00:00:00';
  const w = cw * label.length;
  const x0 = xRight - w;
  const out = [];
  out.push(doc.text('T+', { font, size, x: x0, y, fill: '#7df9ff' }));
  // digit positions in "T+ HH:MM:SS"
  const digits = [
    { i: 3, n: 10, period: 360000 }, { i: 4, n: 10, period: 36000 },
    { i: 6, n: 6, period: 3600 }, { i: 7, n: 10, period: 600 },
    { i: 9, n: 6, period: 60 }, { i: 10, n: 10, period: 10 },
  ];
  out.push(doc.text(':', { font, size, x: x0 + 5 * cw, y, fill: '#7df9ff' }));
  out.push(doc.text(':', { font, size, x: x0 + 8 * cw, y, fill: '#7df9ff' }));
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
