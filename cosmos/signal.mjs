// signal.mjs: a visitor opened an issue on the profile repo.
//   "📡 signal"     plant them as a star in the guestbook sky (+ cache their avatar)
//   "vote: <model>" count their vote for the next NYC skyline test (one current vote per account)
// Inputs come from the issue event via env vars (never interpolated into shell).
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pollOptions, tally } from './poll.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const KEEP_AVATARS = 28;

export async function plant({ login, id, title, now = new Date(), fetchImpl = fetch, sigPath = join(DIR, 'signals.json'), avPath = join(DIR, 'avatars.json') }) {
  if (!LOGIN_RE.test(login || '') || !/^\d+$/.test(String(id || ''))) return { result: 'skip', message: 'invalid sender' };
  if (!/signal/i.test(title || '')) return { result: 'skip', message: 'not a signal' };
  const combo = /supernova/i.test(title);
  const list = JSON.parse(readFileSync(sigPath, 'utf8'));
  let entry = list.find((s) => String(s.id) === String(id));
  let result = 'new';
  if (entry) { result = 'again'; entry.login = login; if (combo && !entry.combo) { entry.combo = true; result = 'upgrade'; } }
  else { entry = { login, id: Number(id), at: now.toISOString(), combo }; list.push(entry); }
  const number = list.indexOf(entry) + 1;
  // avatar cache (only the most recent visitors are drawn with faces)
  const av = JSON.parse(readFileSync(avPath, 'utf8'));
  try {
    const r = await fetchImpl(`https://avatars.githubusercontent.com/u/${id}?s=52&v=4`);
    if (r.ok) av[String(id)] = `data:${r.headers.get('content-type') || 'image/png'};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`;
  } catch (e) { console.warn('avatar fetch failed', e.message); }
  const keep = new Set(list.slice(-KEEP_AVATARS).map((s) => String(s.id)));
  for (const k of Object.keys(av)) if (k !== 'owner' && !keep.has(k)) delete av[k];
  writeFileSync(sigPath, JSON.stringify(list, null, 1));
  writeFileSync(avPath, JSON.stringify(av));
  const gold = entry.combo ? ' as a ✨ golden star ✨' : '';
  const message = result === 'again'
    ? `📡 Signal received again, @${login}! You're already star #${number} in my sky. Thanks for coming back, traveler.`
    : result === 'upgrade'
      ? `✨ COMBO CONFIRMED, @${login}! Your star (#${number}) just turned gold. It'll shine on the profile within a minute.`
      : `📡 Signal received, @${login}! You're now star #${number} in my sky${gold}. Look for yourself on the profile in about a minute. 🌌`;
  return { result, number, message };
}

const LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
export function castVote({ login, id, title, now = new Date(), votesPath = join(DIR, 'votes.json'), statsPath = join(DIR, 'stats.json'), apPath = join(DIR, 'aipulse.json') }) {
  if (!LOGIN_RE.test(login || '') || !/^\d+$/.test(String(id || ''))) return { result: 'skip', message: 'invalid sender' };
  const m = /^\s*vote:\s*([A-Za-z0-9._~\/-]{1,120})\s*$/i.exec(title || '');
  if (!m) return { result: 'skip', message: 'not a vote' };
  const model = m[1];
  const stats = JSON.parse(readFileSync(statsPath, 'utf8'));
  const AP = JSON.parse(readFileSync(apPath, 'utf8'));
  const options = stats.drops ? pollOptions({ drops: stats.drops, poll: AP.poll, tested: AP.nyc.chips }) : [];
  const opt = options.find((o) => o.id === model);
  if (!opt) return { result: 'stale', message: `🗳️ Thanks @${login}! \`${model}\` is not on the ballot right now. The ballot always follows the newest models, so it may have just rotated out. Pick one from the live ballot on the profile and vote again.` };
  const votes = existsSync(votesPath) ? JSON.parse(readFileSync(votesPath, 'utf8')) : {};
  const prev = votes[String(id)];
  votes[String(id)] = { login, model, at: now.toISOString() };
  writeFileSync(votesPath, JSON.stringify(votes, null, 1));
  const n = tally(votes, options)[model];
  const was = prev && prev.model !== model ? (options.find((o) => o.id === prev.model)?.model || prev.model) : null;
  const result = !prev ? 'vote' : prev.model === model ? 'again' : 'switch';
  const tail = `It has ${n} ${n === 1 ? 'vote' : 'votes'} now, and the live tally on the profile updates in about a minute.`;
  const message = result === 'again'
    ? `🗳️ Already counted, @${login}: your vote is on **${opt.model}**. ${tail}`
    : result === 'switch'
      ? `🗳️ Vote moved, @${login}: from ${was} to **${opt.model}** for the next NYC skyline test. ${tail}`
      : `🗳️ Vote counted, @${login}! You picked **${opt.model}** for the next NYC skyline test. ${tail} Changed your mind later? Vote again and your vote moves.`;
  return { result, model, count: n, message };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = { login: process.env.SIGNAL_LOGIN, id: process.env.SIGNAL_ID, title: process.env.SIGNAL_TITLE };
  const out = /^\s*vote:/i.test(input.title || '') ? castVote(input) : await plant(input);
  console.log(out);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `result=${out.result}\nmessage=${out.message.replace(/\n/g, ' ')}\n`);
}
