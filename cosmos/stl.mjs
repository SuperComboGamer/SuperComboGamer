// stl.mjs — the last 53 weeks as a 3D skyline (ASCII STL). Rendered interactively by GitHub.
export function skylineSTL(cal, { name = 'scg-skyline' } = {}) {
  // grid: columns = weeks (Sunday-start), rows = weekday
  const first = new Date(cal[0].date + 'T00:00:00Z');
  const pad = first.getUTCDay();
  const cells = [];
  cal.forEach((d, i) => { const k = i + pad; cells.push({ w: Math.floor(k / 7), dow: k % 7, c: d.count }); });
  const weeks = Math.max(...cells.map((c) => c.w)) + 1;
  const max = Math.max(1, ...cells.map((c) => c.c));
  const S = 20, G = 4, BASE = 16, M = 12; // cell pitch, gap, plate thickness, margin (integer units = compact file)
  const out = [`solid ${name}`];
  const f = (v) => Math.round(v).toString();
  const tri = (n, a, b, c) => out.push(`facet normal ${n}\nouter loop\nvertex ${a.map(f).join(' ')}\nvertex ${b.map(f).join(' ')}\nvertex ${c.map(f).join(' ')}\nendloop\nendfacet`);
  const quad = (n, a, b, c, d) => { tri(n, a, b, c); tri(n, a, c, d); };
  const box = (x0, y0, z0, x1, y1, z1, bottom = true) => {
    quad('0 0 1', [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
    if (bottom) quad('0 0 -1', [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]);
    quad('0 -1 0', [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    quad('0 1 0', [x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]);
    quad('-1 0 0', [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    quad('1 0 0', [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]);
  };
  const W = weeks * S + 2 * M, D = 7 * S + 2 * M;
  // base plate with a chamfer-ish step
  box(0, 0, -BASE, W, D, 0);
  for (const c of cells) {
    if (c.c <= 0) continue;
    const h = Math.round(6 + 140 * Math.sqrt(c.c / max));
    const x0 = M + c.w * S + G / 2, y0 = M + (6 - c.dow) * S + G / 2;
    box(x0, y0, 0, x0 + S - G, y0 + S - G, h, false);
  }
  out.push(`endsolid ${name}`);
  return out.join('\n');
}
