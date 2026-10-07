// fetch.mjs: pulls live telemetry into stats.json. Runs inside GitHub Actions every 15 minutes.
//   GitHub  (GraphQL, default Actions token): contribution calendar, yearly totals, owner avatar, featured repo stats
//   X       (public FxTwitter API): @aipulseda1ly followers/posts and live stats for featured posts
//   Models  (public OpenRouter model list): every new model drop, prices, context windows
// Numbers are stored rounded the way they are displayed, so a commit only happens when something visibly changes.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.GITHUB_TOKEN;
const LOGIN = process.env.SCG_LOGIN || 'SuperComboGamer';
const AP = JSON.parse(readFileSync(join(DIR, 'aipulse.json'), 'utf8'));
const H = { Authorization: `bearer ${TOKEN}`, 'User-Agent': 'scg-cosmos', Accept: 'application/vnd.github+json' };
const UA = { 'User-Agent': 'scg-cosmos (github profile readme)' };

// live names are drawn with a fixed glyph set: fold accents, turn dashes into hyphens, drop anything exotic
export const clean = (v) => String(v ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2010-\u2015\u2212]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[^\x20-\x7e]/g, '').replace(/\s+/g, ' ').trim();

// 3 significant digits: 389,475 -> 389000, 2,738 -> 2740, 86 -> 86
export const sig3 = (n) => { if (n == null || !isFinite(n)) return null; if (n < 1000) return Math.round(n); const p = Math.pow(10, Math.floor(Math.log10(n)) - 2); return Math.round(n / p) * p; };

export async function gql(query, variables, fetchImpl = fetch) {
  const r = await fetchImpl('https://api.github.com/graphql', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) });
  const j = await r.json();
  if (j.errors) throw new Error('GraphQL: ' + JSON.stringify(j.errors).slice(0, 400));
  return j.data;
}

const Q_MAIN = `query($login:String!){ user(login:$login){
  id createdAt avatarUrl(size:64) followers{ totalCount }
  contributionsCollection{
    totalCommitContributions totalPullRequestContributions totalIssueContributions totalPullRequestReviewContributions
    contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } }
  } } }`;
const Q_REPO = `query($owner:String!,$name:String!,$uid:ID!){ repository(owner:$owner,name:$name){
  stargazerCount defaultBranchRef{ target{ ... on Commit{ history(author:{id:$uid}){ totalCount } } } } } }`;
const Q_YEAR = `query($login:String!,$from:DateTime!,$to:DateTime!){ user(login:$login){
  contributionsCollection(from:$from,to:$to){ contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } } } } }`;

export async function collectGitHub(fetchImpl = fetch, now = new Date()) {
  const main = (await gql(Q_MAIN, { login: LOGIN }, fetchImpl)).user;
  const cc = main.contributionsCollection;
  const calendar = cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays).map((d) => [d.date, d.contributionCount]);
  const years = {}; const daily = {};
  const y0 = +main.createdAt.slice(0, 4), y1 = now.getUTCFullYear();
  for (let y = y0; y <= y1; y++) {
    const from = `${y}-01-01T00:00:00Z`, to = y === y1 ? now.toISOString() : `${y}-12-31T23:59:59Z`;
    const yc = (await gql(Q_YEAR, { login: LOGIN, from, to }, fetchImpl)).user.contributionsCollection.contributionCalendar;
    years[y] = yc.totalContributions;
    for (const w of yc.weeks) for (const d of w.contributionDays) if (d.contributionCount > 0) daily[d.date] = d.contributionCount;
  }
  const repos = {};
  for (const full of AP.repos || []) {
    try {
      const [owner, name] = full.split('/');
      const r = (await gql(Q_REPO, { owner, name, uid: main.id }, fetchImpl)).repository;
      repos[full] = { stars: r.stargazerCount, commits: r.defaultBranchRef?.target?.history?.totalCount ?? null };
    } catch (e) { console.warn('repo', full, e.message); }
  }
  let ownerAvatar = null;
  try { const r = await fetchImpl(main.avatarUrl); if (r.ok) ownerAvatar = `data:${r.headers.get('content-type') || 'image/png'};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`; } catch {}
  return {
    stats: {
      login: LOGIN, createdAt: main.createdAt.slice(0, 10), followers: main.followers.totalCount,
      calendar, rollingTotal: cc.contributionCalendar.totalContributions,
      totals: { commits: cc.totalCommitContributions, prs: cc.totalPullRequestContributions, issues: cc.totalIssueContributions, reviews: cc.totalPullRequestReviewContributions },
      years, daily, repos,
    },
    ownerAvatar,
  };
}

const allPostIds = () => [...Object.values(AP.posts), ...AP.nyc.best.map((b) => b.id)];
async function fx(path, fetchImpl) {
  const r = await fetchImpl(`https://api.fxtwitter.com/${path}`, { headers: UA });
  if (!r.ok) throw new Error(`fxtwitter ${r.status} for ${path}`);
  return r.json();
}
export async function collectX(fetchImpl = fetch) {
  const u = (await fx(AP.x.handle, fetchImpl)).user;
  // only what the profile shows, so a change in anything else never forces a commit
  const x = { followers: u.followers, posts: u.tweets };
  const posts = {};
  for (const id of allPostIds()) {
    try {
      const t = (await fx(`${AP.x.handle}/status/${id}`, fetchImpl)).tweet;
      posts[id] = { views: sig3(t.views), likes: sig3(t.likes), bookmarks: sig3(t.bookmarks) };
    } catch (e) { console.warn('post', id, e.message); }
  }
  return { x, posts };
}

export async function collectDrops(fetchImpl = fetch, now = new Date()) {
  const r = await fetchImpl('https://openrouter.ai/api/v1/models', { headers: UA });
  if (!r.ok) throw new Error('openrouter ' + r.status);
  const all = (await r.json()).data;
  const keep = (m) => !m.id.includes(':') && !m.id.startsWith('~') && !(parseFloat(m.pricing?.prompt) < 0);
  const d = all.filter(keep).sort((a, b) => (b.created || 0) - (a.created || 0));
  const day = (t) => new Date(t * 1000).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  const end = Date.parse(today + 'T00:00:00Z');
  const counts = {};
  for (const m of d) { const k = day(m.created); counts[k] = (counts[k] || 0) + 1; }
  const perDay = [];
  for (let i = 89; i >= 0; i--) perDay.push(counts[new Date(end - i * 86400000).toISOString().slice(0, 10)] || 0);
  const per1M = (s) => { const v = parseFloat(s); return isFinite(v) ? Math.round(v * 1e6 * 100) / 100 : null; };
  const split = (m) => { const [lab, ...rest] = clean(m.name || m.id).split(': '); return rest.length ? { lab, model: rest.join(': ') } : { lab: m.id.split('/')[0], model: clean(m.name || m.id) }; };
  const row = (m) => ({ date: day(m.created), id: m.id, ...split(m), in: per1M(m.pricing?.prompt), out: per1M(m.pricing?.completion), ctx: m.context_length || null });
  const since90 = end - 89 * 86400000;
  const recent = d.filter((m) => m.created * 1000 >= since90);
  const labs90 = {};
  for (const m of recent) { const { lab } = split(m); labs90[lab] = (labs90[lab] || 0) + 1; }
  return {
    source: 'OpenRouter', asOf: today, start: new Date(since90).toISOString().slice(0, 10), total: d.length,
    perDay, latest: d.slice(0, 40).map(row), labs90,
    recent: recent.filter((m) => per1M(m.pricing?.completion) > 0).map((m) => { const r = row(m); return [r.date, r.lab, r.model, r.in, r.out, r.id]; }),
  };
}

// keep last-known values for anything a source could not provide this run
export function merge(prev, next) {
  const out = { ...prev, ...next };
  out.posts = { ...(prev.posts || {}), ...(next.posts || {}) };
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const statsPath = join(DIR, 'stats.json'), avPath = join(DIR, 'avatars.json');
  const prev = JSON.parse(readFileSync(statsPath, 'utf8'));
  let next = {};
  const now = new Date();
  const ok = [];
  if (TOKEN) {
    try { const { stats, ownerAvatar } = await collectGitHub(fetch, now); next = { ...next, ...stats }; ok.push('github');
      if (ownerAvatar) { const av = JSON.parse(readFileSync(avPath, 'utf8')); if (av.owner !== ownerAvatar) { av.owner = ownerAvatar; writeFileSync(avPath, JSON.stringify(av)); } }
    } catch (e) { console.warn('github', e.message); }
  }
  try { const { x, posts } = await collectX(fetch); next.x = x; next.posts = posts; ok.push('x'); } catch (e) { console.warn('x', e.message); }
  try { next.drops = await collectDrops(fetch, now); ok.push('openrouter'); } catch (e) { console.warn('openrouter', e.message); }
  const merged = merge(prev, next);
  delete merged.generatedAt;
  merged.sources = { ...(prev.sources || {}), ...Object.fromEntries(ok.map((k) => [k, (prev.sources || {})[k]])) };
  // record when each source last produced different data (so the timestamp itself never forces a commit)
  for (const k of ok) {
    const keys = { github: ['calendar', 'repos', 'followers'], x: ['x', 'posts'], openrouter: ['drops'] }[k];
    const pick = (o) => JSON.stringify(keys.map((key) => o[key]));
    if (pick(prev) !== pick(merged) || !merged.sources[k]) merged.sources[k] = now.toISOString().slice(0, 16) + 'Z';
  }
  writeFileSync(statsPath, JSON.stringify(merged));
  console.log('sources ok:', ok.join(', ') || 'none');
}
