// fetch.mjs — pulls fresh telemetry from the GitHub API into stats.json. Runs inside GitHub Actions.
// Needs GITHUB_TOKEN (the default Actions token is enough: everything read here is public).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.GITHUB_TOKEN;
const LOGIN = process.env.SCG_LOGIN || 'SuperComboGamer';
const MISSIONS = ['aipulsedaily/f1-round2', 'aipulsedaily/pulse', 'webdevcody/survive-the-night-fps', 'AgentSystemLabs/mission-control'];
const H = { Authorization: `bearer ${TOKEN}`, 'User-Agent': 'scg-cosmos', Accept: 'application/vnd.github+json' };

export async function gql(query, variables, fetchImpl = fetch) {
  const r = await fetchImpl('https://api.github.com/graphql', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) });
  const j = await r.json();
  if (j.errors) throw new Error('GraphQL: ' + JSON.stringify(j.errors).slice(0, 400));
  return j.data;
}

const Q_MAIN = `query($login:String!){ user(login:$login){
  createdAt avatarUrl(size:96) followers{ totalCount }
  repositoriesContributedTo(first:1, contributionTypes:[COMMIT,PULL_REQUEST,ISSUE,REPOSITORY]){ totalCount }
  contributionsCollection{
    totalCommitContributions totalPullRequestContributions totalIssueContributions
    totalPullRequestReviewContributions totalRepositoryContributions restrictedContributionsCount
    contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } }
  } } }`;
const Q_YEAR = `query($login:String!,$from:DateTime!,$to:DateTime!){ user(login:$login){
  contributionsCollection(from:$from,to:$to){ contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } } } } }`;

export async function collect(fetchImpl = fetch, now = new Date()) {
  const main = (await gql(Q_MAIN, { login: LOGIN }, fetchImpl)).user;
  const cc = main.contributionsCollection;
  const calendar = cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays).map((d) => [d.date, d.contributionCount]);
  const years = {}; const daily = {};
  const y0 = +main.createdAt.slice(0, 4), y1 = now.getUTCFullYear();
  for (let y = y0; y <= y1; y++) {
    const from = `${y}-01-01T00:00:00Z`;
    const to = y === y1 ? now.toISOString() : `${y}-12-31T23:59:59Z`;
    const yc = (await gql(Q_YEAR, { login: LOGIN, from, to }, fetchImpl)).user.contributionsCollection.contributionCalendar;
    years[y] = yc.totalContributions;
    for (const w of yc.weeks) for (const d of w.contributionDays) if (d.contributionCount > 0) daily[d.date] = d.contributionCount;
  }
  const missions = {};
  for (const repo of MISSIONS) {
    try {
      const info = await (await fetchImpl(`https://api.github.com/repos/${repo}`, { headers: H })).json();
      const res = await fetchImpl(`https://api.github.com/repos/${repo}/contributors?per_page=100`, { headers: H });
      const list = res.status === 200 ? await res.json() : [];
      const idx = Array.isArray(list) ? list.findIndex((c) => c.login?.toLowerCase() === LOGIN.toLowerCase()) : -1;
      missions[repo] = { stars: info.stargazers_count ?? 0, commits: idx >= 0 ? list[idx].contributions : null, rank: idx >= 0 ? idx + 1 : null };
    } catch (e) { console.warn('mission', repo, e.message); }
  }
  let ownerAvatar = null;
  try {
    const r = await fetchImpl(main.avatarUrl);
    if (r.ok) ownerAvatar = `data:${r.headers.get('content-type') || 'image/png'};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`;
  } catch (e) { console.warn('avatar', e.message); }
  return {
    stats: {
      login: LOGIN, createdAt: main.createdAt.slice(0, 10), followers: main.followers.totalCount,
      generatedAt: now.toISOString(), calendar, rollingTotal: cc.contributionCalendar.totalContributions,
      totals: { commits: cc.totalCommitContributions, prs: cc.totalPullRequestContributions, issues: cc.totalIssueContributions, reviews: cc.totalPullRequestReviewContributions, repos: cc.totalRepositoryContributions, private: cc.restrictedContributionsCount },
      years, daily, repoCount: main.repositoriesContributedTo.totalCount, missions,
    },
    ownerAvatar,
  };
}

// keep last-known values for anything the API could not provide this run
export function merge(prev, next) {
  const missions = { ...(prev.missions || {}) };
  for (const [k, v] of Object.entries(next.missions || {})) {
    const p = missions[k] || {};
    missions[k] = { stars: v.stars ?? p.stars, commits: v.commits ?? p.commits, rank: v.rank ?? p.rank };
  }
  return { ...prev, ...next, missions };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!TOKEN) { console.error('GITHUB_TOKEN missing'); process.exit(1); }
  const statsPath = join(DIR, 'stats.json'), avPath = join(DIR, 'avatars.json');
  const prev = JSON.parse(readFileSync(statsPath, 'utf8'));
  const { stats, ownerAvatar } = await collect();
  writeFileSync(statsPath, JSON.stringify(merge(prev, stats)));
  if (ownerAvatar) {
    const av = JSON.parse(readFileSync(avPath, 'utf8'));
    av.owner = ownerAvatar;
    writeFileSync(avPath, JSON.stringify(av));
  }
  console.log(`telemetry: ${stats.rollingTotal} contributions in the last year, ${Object.keys(stats.daily).length} active days all-time`);
}
