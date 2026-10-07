// derive.mjs: turns raw stats.json into the numbers the art needs.
const DAY = 86400000;
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const parse = (d) => Date.parse(d + 'T00:00:00Z');

export function derive(stats) {
  const cal = stats.calendar.map(([date, count]) => ({ date, count }));
  const last = cal[cal.length - 1];
  const rolling = stats.rollingTotal ?? cal.reduce((a, d) => a + d.count, 0);
  // all-time daily map (nonzero days) merged with calendar
  const daily = { ...(stats.daily || {}) };
  for (const d of cal) if (d.count > 0) daily[d.date] = d.count; else delete daily[d.date];
  const days = Object.keys(daily).sort();

  // longest streak (all time)
  let best = { len: 0, from: null, to: null }, run = 0, runFrom = null, prev = null;
  for (const d of days) {
    const t = parse(d);
    if (prev !== null && t - prev === DAY) run++; else { run = 1; runFrom = d; }
    if (run > best.len) best = { len: run, from: runFrom, to: d };
    prev = t;
  }
  // current streak: ending today, or yesterday if today has nothing yet
  let cur = { len: 0, from: null, to: null };
  {
    let t = parse(last.date);
    if (!daily[iso(t)]) t -= DAY;
    const end = iso(t); let n = 0;
    while (daily[iso(t)]) { n++; t -= DAY; }
    if (n) cur = { len: n, from: iso(t + DAY), to: end };
  }
  // best day (rolling year)
  const bestDay = cal.reduce((a, d) => (d.count > a.count ? d : a), { count: 0, date: null });
  // weekday histogram (rolling year)
  const wd = [0, 0, 0, 0, 0, 0, 0];
  for (const d of cal) wd[new Date(parse(d.date)).getUTCDay()] += d.count;
  const busiest = wd.indexOf(Math.max(...wd));
  const activeDays = cal.filter((d) => d.count > 0).length;
  const years = Object.entries(stats.years || {}).map(([y, v]) => ({ year: +y, total: v })).sort((a, b) => a.year - b.year);
  const lifetime = years.reduce((a, y) => a + y.total, 0);
  const thisYear = years.length ? years[years.length - 1] : { year: new Date().getUTCFullYear(), total: 0 };
  const lastYear = years.find((y) => y.year === thisYear.year - 1) || { total: 0 };
  // last 7 days
  const week = cal.slice(-7).reduce((a, d) => a + d.count, 0);
  const since = stats.createdAt ? +stats.createdAt.slice(0, 4) : years[0]?.year;
  const createdT = stats.createdAt ? parse(stats.createdAt) : null;
  const missionDay = createdT ? Math.floor((parse(last.date) - createdT) / DAY) + 1 : null;
  return {
    login: stats.login, cal, today: last.date, rolling, lifetime, since, missionDay,
    streak: cur, longest: best, bestDay, weekdays: wd, busiest, activeDays, week,
    years, thisYear, growth: lastYear.total ? thisYear.total / lastYear.total : null,
    totals: stats.totals || {}, followers: stats.followers, missions: stats.missions || {},
    repoCount: stats.repoCount, generatedAt: stats.generatedAt,
  };
}

export const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const nice = (d) => { if (!d) return 'n/a'; const [y, m, dd] = d.split('-'); return `${MONTHS[+m - 1]} ${+dd}, ${y}`; };
export const short = (d) => { if (!d) return 'n/a'; const [, m, dd] = d.split('-'); return `${MONTHS[+m - 1]} ${+dd}`; };
