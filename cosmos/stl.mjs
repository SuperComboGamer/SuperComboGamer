// stl.mjs — the commit galaxy as a 3D object (ASCII STL). GitHub renders it as an interactive viewer.
// One tower per active day, placed on the same log-spiral arms as galaxy.svg; height = contributions.
export function galaxySTL(cal, { name = 'scg-commit-galaxy' } = {}) {
  const N = cal.length;
  const max = Math.max(1, ...cal.map((d) => d.count));
  const out = [`solid ${name}`];
  const f = (v) => String(Math.round(v));
  const nrm = (a, b, c) => {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(...n) || 1;
    return n.map((x) => (Math.round((x / l) * 100) / 100).toString()).join(' ');
  };
  const tri = (a, b, c) => out.push(`facet normal ${nrm(a, b, c)}\nouter loop\nvertex ${a.map(f).join(' ')}\nvertex ${b.map(f).join(' ')}\nvertex ${c.map(f).join(' ')}\nendloop\nendfacet`);
  const quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
  // prism with a regular polygon footprint (counter-clockwise), optional bottom
  const prism = (cx, cy, r, z0, z1, sides, rot = 0, bottom = false) => {
    const p = [];
    for (let i = 0; i < sides; i++) { const a = rot + (i / sides) * Math.PI * 2; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    for (let i = 1; i < sides - 1; i++) tri([p[0][0], p[0][1], z1], [p[i][0], p[i][1], z1], [p[i + 1][0], p[i + 1][1], z1]);
    if (bottom) for (let i = 1; i < sides - 1; i++) tri([p[0][0], p[0][1], z0], [p[i + 1][0], p[i + 1][1], z0], [p[i][0], p[i][1], z0]);
    for (let i = 0; i < sides; i++) { const a = p[i], b = p[(i + 1) % sides]; quad([a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]); }
  };
  // log spiral identical to the SVG
  const GR = 520, rn0 = 0.09, turns = 0.9, tStart = 0.18;
  const b = Math.log(1 / rn0) / (2 * Math.PI * turns);
  const thetaAt = (t) => (tStart + (1 - tStart) * t) * turns * 2 * Math.PI;
  // base disc + rim
  prism(0, 0, GR * 1.08, -14, 0, 36, 0, true);
  // galactic core: stepped spire
  prism(0, 0, 46, 0, 26, 12, 0); prism(0, 0, 30, 26, 64, 12, Math.PI / 12); prism(0, 0, 15, 64, 130, 8);
  // towers
  cal.forEach((d, i) => {
    if (d.count <= 0) return;
    const t = i / (N - 1), th = (i % 2) * Math.PI + thetaAt(t);
    const r = GR * rn0 * Math.exp(b * thetaAt(t));
    const x = r * Math.cos(th), y = -r * Math.sin(th); // y flipped: SVG y-down → STL y-up keeps the same handedness on screen
    const h = 10 + 250 * Math.sqrt(d.count / max);
    const w = 8 + 7 * Math.sqrt(d.count / max);
    prism(x, y, w, 0, h, 4, th + Math.PI / 4);
  });
  out.push(`endsolid ${name}`);
  return out.join('\n');
}
