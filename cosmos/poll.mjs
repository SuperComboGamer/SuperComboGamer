// poll.mjs: the live community vote. The ballot is always the newest text models from the big labs
// that have not faced the NYC skyline test yet, so it changes by itself as new models drop.
const norm = (s) => s.toLowerCase().replace(/^claude\s+/, '').replace(/\s+(pro|max|prime)$/, '').replace(/\s+/g, ' ').trim();
const SKIP = /image|banana|vision|embed|tts|audio|speech|flash|mini|small|lite|nano|tiny|turbo|omni|\bvl\b|preview/i;

export function pollOptions({ drops, poll, tested = [] }) {
  const labs = new Set(poll.labs);
  const done = new Set(tested.map(norm));
  const out = [];
  for (const m of drops?.latest || []) {
    const org = m.id.split('/')[0].replace(/^~/, '');
    if (!labs.has(org) || SKIP.test(m.id) || SKIP.test(m.model)) continue;
    if (done.has(norm(m.model))) continue;
    if (out.some((o) => norm(o.model) === norm(m.model))) continue;
    out.push({ id: m.id, model: m.model, lab: m.lab, date: m.date });
    if (out.length >= poll.size) break;
  }
  return out;
}

// votes.json: { "<github user id>": { login, model, at } }. One current vote per account.
export function tally(votes, options) {
  const counts = Object.fromEntries(options.map((o) => [o.id, 0]));
  for (const v of Object.values(votes || {})) if (v && counts[v.model] != null) counts[v.model]++;
  return counts;
}
