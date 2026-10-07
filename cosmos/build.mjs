// build.mjs: renders every SVG in /cosmos from stats.json (live data), signals.json and votes.json,
// then refreshes the live parts of the README. Zero dependencies. Run: node cosmos/build.mjs
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepFonts, fmtInt } from './kit.mjs';
import { derive } from './derive.mjs';
import { galaxy } from './art-galaxy.mjs';
import { starchart } from './art-starchart.mjs';
import { terminal, CYAN } from './art-terminal.mjs';
import { missionPatch, sceneF1, sceneDeadfall, sceneSupercar, sceneNight } from './art-missions.mjs';
import { signals, signalButton } from './art-signals.mjs';
import { header, combo, footer } from './art-misc.mjs';
import { pulseHero, followButton, dropsPanel, pricePanel, nycPanel, pollPanel, voteChip, fmtK, stamp } from './art-pulse.mjs';
import { pollOptions, tally } from './poll.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(DIR, f));
const json = (f, fallback) => (existsSync(join(DIR, f)) ? JSON.parse(read(f)) : fallback);
const fonts = prepFonts(JSON.parse(read('glyphs.json')));
const stats = JSON.parse(read('stats.json'));
const AP = JSON.parse(read('aipulse.json'));
const only = process.argv[2];
// SIGNALS_FILE / AVATARS_FILE / VOTES_FILE let local tests render fixtures without touching the real data
const sigList = JSON.parse(process.env.SIGNALS_FILE ? readFileSync(process.env.SIGNALS_FILE) : read('signals.json'));
const avatars = JSON.parse(process.env.AVATARS_FILE ? readFileSync(process.env.AVATARS_FILE) : read('avatars.json'));
const votes = process.env.VOTES_FILE ? JSON.parse(readFileSync(process.env.VOTES_FILE)) : json('votes.json', {});
const d = derive(stats);
const logo = read('brand-logo.jpg');
const REPO = `https://github.com/${stats.login || 'SuperComboGamer'}/${stats.login || 'SuperComboGamer'}`;

// ---------- live data, with safe fallbacks when a source has not answered yet ----------
const X = stats.x || {};
const posts = stats.posts || {};
const drops = stats.drops && stats.drops.perDay ? stats.drops : null;
const src = stats.sources || {};
const lastChange = Object.values(src).filter(Boolean).sort().pop();
const postUrl = (id) => `${AP.x.url}/status/${id}`;
const P = (id) => posts[id] || {};
const featured = [
  [AP.posts.f1, 'the Claude Opus 5 F1 film'], [AP.posts.showroom, 'the F1 showroom in Blender'], [AP.posts.deadfall, 'DEADFALL'],
  [AP.posts.lambo, 'the supercar SVG test'], [AP.posts.night, 'Survive the Night'], ...AP.nyc.best.map((b) => [b.id, b.title]),
].map(([id, label]) => ({ id, label, views: P(id).views }));
const biggest = featured.filter((f) => f.views != null).sort((a, b) => b.views - a.views)[0] || null;
const options = drops ? pollOptions({ drops, poll: AP.poll, tested: AP.nyc.chips }) : [];
const counts = tally(votes, options);
const ballotSize = Object.values(counts).reduce((a, b) => a + b, 0);

// ---------- THE SIGNAL: terminal manifesto with live numbers ----------
const C = CYAN;
const week = drops ? drops.perDay.slice(-7).reduce((a, b) => a + b, 0) : null;
const newest = drops?.latest?.[0];
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const script = [
  { cmd: 'whoami' },
  { out: [['aipulsedaily', C.ink, 1], [' (@aipulseda1ly on X). ', C.cyan], ['tracking every AI model drop, benchmark leak and lab move.', C.out]] },
  { cmd: 'cat method.txt' },
  { out: [['I test new models myself, usually the day they drop. ', C.out], ['full runs, nothing cut.', C.ink, 1]] },
  { out: [['every number gets checked against the source.', C.out]] },
  { cmd: 'cat rules.txt' },
  { out: [['no partnerships. no sponsored reviews. ', C.out], ['a lab gets featured fairly or not at all.', C.ink, 1]] },
  { cmd: 'aipulse --live' },
  X.followers != null ? { out: [['▸ ', C.gold], [fmtInt(X.followers), C.gold, 1], [' followers  ·  ', C.out], [fmtInt(X.posts), C.gold, 1], [` posts on X since ${AP.x.since}`, C.out]] } : null,
  biggest ? { out: [['▸ ', C.gold], [fmtK(biggest.views), C.gold, 1], [' views and counting on ', C.out], [biggest.label, C.ink, 1]] } : null,
  week != null && newest ? { out: [['▸ ', C.gold], [String(week), C.gold, 1], [` new ${week === 1 ? 'model' : 'models'} on OpenRouter in the last 7 days. newest: `, C.out], [cut(newest.model, 24), C.ink, 1]] } : null,
  { cmd: 'echo $MOTTO' },
  { out: [['signal over noise.', C.cyan, 1]], last: true },
];

// ---------- MISSIONS: the biggest runs, with live stats ----------
const night = (stats.repos || {})['webdevcody/survive-the-night-fps'] || {};
const views = (id, col) => (P(id).views != null ? [`${fmtK(P(id).views)} VIEWS`, col, true] : null);
const likes = (id, col) => (P(id).likes != null ? [`${fmtK(P(id).likes)} LIKES`, col, true] : null);
const missions = [
  { key: 'f1', id: AP.posts.f1, file: 'mission-f1', title: 'The Claude Opus 5 F1 film', accent: '#ff4d5e', accent2: '#ffb84d', glow: '#5a1430', ringTop: 'THE F1 FILM', ringBottom: '4K • ONE TAKE • ZERO TEXTURES', scene: sceneF1,
    desc: 'A 124-second 4K film of an F1 car in one unbroken take, built entirely from code. 2,978 frames and zero texture files.',
    chips: (id) => [views(id, '#ffb84d'), likes(id, '#ff8a9a'), ['CLAUDE OPUS 5', '#8FE3FF']], cta: 'WATCH IT ON X  →' },
  { key: 'deadfall', id: AP.posts.deadfall, file: 'mission-deadfall', title: 'DEADFALL', accent: '#5DFFB0', accent2: '#8FE3FF', glow: '#0c3b33', ringTop: 'DEADFALL', ringBottom: '2 KM ISLAND • 44,000 TREES', scene: sceneDeadfall,
    desc: 'A three.js survival game Claude Opus 5.5 built in one day: a 2 km island shaped by simulated erosion, six tree species, real sun and moon.',
    chips: (id) => [views(id, '#5DFFB0'), likes(id, '#8FE3FF'), ['CLAUDE OPUS 5.5', '#8FE3FF']], cta: 'WATCH IT ON X  →' },
  { key: 'supercar', id: AP.posts.lambo, file: 'mission-supercar', title: 'The supercar SVG test', accent: '#FFC163', accent2: '#ffd9a0', glow: '#3b2a0c', ringTop: 'THE SUPERCAR TEST', ringBottom: 'EVERY EFFORT LEVEL • COST TRACKED', scene: sceneSupercar,
    desc: 'Each round, one model draws the same supercar as an SVG at every effort level, with cost and time tracked, so you can see what extra thinking actually buys.',
    chips: (id) => [views(id, '#FFC163'), likes(id, '#ffd9a0'), ['GPT-6.1 SOL ROUND', '#8FE3FF']], cta: 'WATCH THE GPT-6.1 SOL ROUND  →' },
  { key: 'night', id: AP.posts.night, file: 'mission-night', title: 'Survive the Night', accent: '#ff3b3b', accent2: '#ffcc66', glow: '#3a0b14', ringTop: 'SURVIVE THE NIGHT', ringBottom: '1-8 PLAYER CO-OP • BROWSER FPS', scene: sceneNight,
    desc: 'A 1-8 player co-op zombie FPS that runs in the browser. Built with @webdevcody, about 95% of the code written by Claude Opus 5.5.',
    chips: (id) => [views(id, '#ffcc66'), night.commits != null ? [`${fmtInt(night.commits)} COMMITS BY SCG`, '#ff8a8a', true] : null, night.stars != null ? [`${fmtInt(night.stars)} STARS`, '#FFC163', true] : null], cta: 'PLAY FREE AT SURVIVETHENIGHTGAME.COM  →' },
];
const topMission = missions.map((m) => [m.key, P(m.id).views ?? -1]).sort((a, b) => b[1] - a[1])[0];

export const SECTIONS = [
  ['01', 'THE SIGNAL', '// what aipulsedaily is'],
  ['02', 'THE PULSE', '// every new AI model, live'],
  ['03', 'THE NYC TEST', '// one brief, every model'],
  ['04', 'MISSIONS', '// the biggest runs, live stats'],
  ['05', 'THE DATA', '// the price of intelligence, live'],
  ['06', 'SEND A SIGNAL', '// become a star in this sky'],
  ['07', 'THE BUILDER', '// SuperComboGamer, the human behind it'],
  ['08', '? ? ?', '// only the worthy know the combo'],
];

const pulseRoles = ['NYC skyline test', 'F1 film, 4K one take', 'DEADFALL, 44,000 trees', 'supercar SVG test', 'Survive the Night', 'the next model drop'];

const jobs = {
  'hero-pulse': () => pulseHero({ fonts, banner: read('brand-banner.jpg'), logo, x: AP.x, roles: pulseRoles,
    live: { followers: X.followers, posts: X.posts, top: P(AP.posts.f1).views ?? null, topLabel: 'F1 FILM VIEWS', at: stamp(src.x) } }),
  'btn-follow': () => followButton({ fonts, logo, handle: AP.x.handle }),
  transmission: () => terminal({ fonts, script, prompt: { user: 'aipulse@signal', path: ':~$' }, header: 'INCOMING TRANSMISSION', channel: 'CH 01 · LIVE',
    title: 'Incoming transmission from aipulsedaily', footer: `SIGNAL CLEAN${src.x ? ' · X SYNCED ' + stamp(src.x) : ''}` }),
  ...(drops ? {
    drops: () => dropsPanel({ fonts, drops, at: src.openrouter }),
    price: () => pricePanel({ fonts, drops, at: src.openrouter }),
    poll: () => pollPanel({ fonts, poll: AP.poll, options, counts }),
    ...Object.fromEntries(options.map((o, i) => [`vote-${i + 1}`, () => voteChip({ fonts, option: o, n: counts[o.id], i })])),
  } : {}),
  nyc: () => nycPanel({ fonts, nyc: AP.nyc, posts, at: src.x }),
  ...Object.fromEntries(missions.map((m, i) => [m.file, () => missionPatch({ fonts, index: i + 1, m: { ...m, chips: m.chips(m.id).filter(Boolean), badge: topMission && topMission[0] === m.key && topMission[1] > 0 ? 'MOST VIEWED' : null } })])),
  signals: () => signals({ fonts, bg: read('nebula-signals.jpg'), list: sigList, avatars, logo }),
  'btn-signal': () => signalButton({ fonts, variant: 'signal' }),
  'btn-combo': () => signalButton({ fonts, variant: 'combo' }),
  ...Object.fromEntries(SECTIONS.flatMap(([num, title, sub]) => ['dark', 'light'].map((theme) => [`h-${num}-${theme}`, () => header({ fonts, num, title, sub, theme, total: SECTIONS.length })]))),
  combo: () => combo({ fonts }),
  'footer-dark': () => footer({ fonts, bg: read('nebula-footer.jpg'), theme: 'dark', synced: stamp(lastChange) }),
  'footer-light': () => footer({ fonts, bg: null, theme: 'light' }),
  starchart: () => starchart({ fonts, d }),
  galaxy: () => galaxy({ fonts, bg: read('nebula-galaxy.jpg'), spiral: read('spiral.jpg'), d }),
};

for (const [name, fn] of Object.entries(jobs)) {
  if (only && only !== name) continue;
  const svg = fn();
  writeFileSync(join(DIR, `${name}.svg`), svg);
  console.log(`${name}.svg`, (Buffer.byteLength(svg) / 1024).toFixed(1) + ' KB');
}

// retired outputs from earlier versions of the engine (the bot commits these deletions)
const retired = ['skyline.stl', 'galaxy.stl', 'stl.mjs', 'hero.svg', 'system.svg', 'art-system.mjs', 'mission-pulse.svg', 'mission-control.svg', 'nebula-hero.jpg'];
for (let i = options.length + 1; i <= 8; i++) retired.push(`vote-${i}.svg`);
if (!only) for (const old of retired) if (existsSync(join(DIR, old))) rmSync(join(DIR, old));

// ---------- README live sections ----------
if (!only || only === 'readme') {
  const readmePath = join(DIR, '..', 'README.md');
  let md = readFileSync(readmePath, 'utf8');
  const put = (key, content) => {
    const re = new RegExp(`(<!-- ${key}:START -->)[\\s\\S]*?(<!-- ${key}:END -->)`);
    md = md.replace(re, (_, a, b) => `${a}\n${content}\n${b}`);
  };
  const enc = encodeURIComponent;
  const voteBody = (o) => `**Just hit \`Submit new issue\`.** 🗳️\n\nA bot counts your vote for **${o.model}** (usually within a minute), updates the live tally on the profile and closes this issue for you.\n\n<sub>One vote per account. Voting again moves your vote.</sub>`;
  put('VOTE', options.length
    ? options.map((o, i) => `<a href="${REPO}/issues/new?title=${enc('vote: ' + o.id)}&body=${enc(voteBody(o))}"><img src="cosmos/vote-${i + 1}.svg" width="236" alt="Vote for ${o.model} (${counts[o.id]} so far)"></a>`).join('\n')
    : '<sub>the ballot is loading. it fills itself with the newest models on the next sync.</sub>');
  const latest = sigList.slice(-12).reverse();
  put('SIGNALS', latest.length
    ? `<sub>📡 latest signals: ${latest.map((x) => `<a href="https://github.com/${x.login}">@${x.login}</a>${x.combo ? ' ✨' : ''}`).join(' · ')}</sub>`
    : '<sub>📡 no signals yet. the first star in this sky could be yours.</sub>');
  put('SYNC', `<sub>🛰️ live data last changed <b>${lastChange ? stamp(lastChange) : 'n/a'}</b> · checked every 15 minutes by <a href="cosmos">/cosmos</a> · ${ballotSize} ${ballotSize === 1 ? 'vote' : 'votes'} on the ballot · <a href="#top">back to top ↑</a></sub>`);
  writeFileSync(readmePath, md);
  console.log('README.md', (Buffer.byteLength(md) / 1024).toFixed(1) + ' KB');
}
