// signal.mjs — a visitor opened a "📡 signal" issue: plant them as a star (+ cache their avatar).
// Inputs come from the issue event via env vars (never interpolated into shell).
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const KEEP_AVATARS = 28;

export async function plant({ login, id, title, now = new Date(), fetchImpl = fetch, sigPath = join(DIR, 'signals.json'), avPath = join(DIR, 'avatars.json') }) {
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(login || '') || !/^\d+$/.test(String(id || ''))) return { result: 'skip', message: 'invalid sender' };
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = await plant({ login: process.env.SIGNAL_LOGIN, id: process.env.SIGNAL_ID, title: process.env.SIGNAL_TITLE });
  console.log(out);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `result=${out.result}\nmessage=${out.message.replace(/\n/g, ' ')}\n`);
}
