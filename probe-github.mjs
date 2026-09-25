const r = await fetch('https://github.com/users/denipurwanto10/contributions', {
  headers: { Accept: 'text/html', 'User-Agent': 'Mozilla/5.0' },
});
const html = await r.text();
console.log('bytes:', html.length);
const tooltips = [...html.matchAll(/<tool-tip[\s\S]*?<\/tool-tip>/gi)];
console.log('tooltips:', tooltips.length);
console.log('sample-tip:', JSON.stringify(tooltips[0]?.[0]?.slice(0, 200)));
const cellRe = /<td\b[^>]*data-date="[^"]+"[^>]*>/gi;
let n2 = 0, first = null, mm;
while ((mm = cellRe.exec(html)) !== null) { n2++; if (!first) first = mm[0]; }
console.log('cells:', n2);
console.log('first-cell:', first && first.slice(0, 240));
const hl = html.match(/[\d,]+\s+contributions?\s+in\s+the\s+last\s+year/i);
console.log('headline:', hl && hl[0]);
const tab = html.match(/(longest|current)\s+streak/i);
console.log('streak-word:', tab && tab[0]);
// Compare with jogruber mirror (the dev fallback source)
const jr = await fetch('https://github-contributions-api.jogruber.de/v4/denipurwanto10?y=last');
const jj = await jr.json();
console.log('jogruber total:', JSON.stringify(jj.total), 'n:', jj.contributions?.length);
{
  const byDate = new Map(jj.contributions.map((i) => [i.date, i.count]));
  const dates = [...byDate.keys()].sort();
  let longest = 0, ls = null, le = null, cur = 0, cs = null, prev = null;
  for (const date of dates) {
    if ((byDate.get(date) ?? 0) <= 0) { cur = 0; cs = null; prev = null; continue; }
    const day = new Date(date + 'T00:00:00Z');
    if (prev && cs && day.getTime() - prev.getTime() === 86400000) cur++;
    else { cur = 1; cs = date; }
    prev = day;
    if (cur > longest) { longest = cur; ls = cs; le = date; }
  }
  console.log('JOGR LONGEST:', longest, ls, '->', le);
}
function parseCalendar(html) {
  const counts = new Map();
  for (const match of html.matchAll(
    /<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>\s*([^<]*?)\s*<\/tool-tip>/gi,
  )) {
    const amount = match[2].match(/^([\d,]+)\s+contributions?\s+on/i);
    counts.set(match[1], amount ? Number(amount[1].replace(/,/g, '')) : 0);
  }
  const contributions = [];
  for (const match of html.matchAll(/<td\b[^>]*\bdata-date="[^"]+"[^>]*>/gi)) {
    const tag = match[0];
    const date = tag.match(/\bdata-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    const level = Number(tag.match(/\bdata-level="(\d)"/)?.[1] ?? 0);
    if (!date) continue;
    contributions.push({
      date,
      count: id ? (counts.get(id) ?? 0) : 0,
      level: level >= 0 && level <= 4 ? level : 0,
    });
  }
  contributions.sort((a, b) => a.date.localeCompare(b.date));
  return contributions;
}
const contributions = parseCalendar(html);
console.log('parsed:', contributions.length);
console.log('nonzero:', contributions.filter((c) => c.count > 0).length);
console.log('last-day:', JSON.stringify(contributions[contributions.length - 1]));
// streak calc
const byDate = new Map(contributions.map((i) => [i.date, i.count]));
const dates = [...byDate.keys()].sort();
let longest = 0, ls = null, le = null, cur = 0, cs = null, prev = null;
for (const date of dates) {
  if ((byDate.get(date) ?? 0) <= 0) { cur = 0; cs = null; prev = null; continue; }
  const day = new Date(date + 'T00:00:00Z');
  if (prev && cs && day.getTime() - prev.getTime() === 86400000) cur++;
  else { cur = 1; cs = date; }
  prev = day;
  if (cur > longest) { longest = cur; ls = cs; le = date; }
}
console.log('LONGEST:', longest, ls, '->', le);
// ALL runs (any length) — look for a 13-run split by single zero days (private contributions)
{
  let c = 0, s = null, p = null;
  const runs = [];
  for (const date of dates) {
    if ((byDate.get(date) ?? 0) <= 0) { if (c > 0) runs.push([c, s, p && p.toISOString().slice(0, 10)]); c = 0; s = null; p = null; continue; }
    const day = new Date(date + 'T00:00:00Z');
    if (p && s && day.getTime() - p.getTime() === 86400000) c++;
    else { c = 1; s = date; }
    p = day;
  }
  if (c > 0) runs.push([c, s, p && p.toISOString().slice(0, 10)]);
  console.log('ALL-runs:', JSON.stringify(runs));
  // gap analysis: runs separated by exactly 1 zero-day
  for (let i = 0; i + 1 < runs.length; i++) {
    const endA = new Date(runs[i][2] + 'T00:00:00Z').getTime();
    const startB = new Date(runs[i + 1][1] + 'T00:00:00Z').getTime();
    const gap = Math.round((startB - endA) / 86400000) - 1;
    if (gap <= 2) console.log('MERGE-CANDIDATE gap=' + gap, runs[i][0] + '+' + runs[i + 1][0] + '=' + (runs[i][0] + runs[i + 1][0] + gap), runs[i][1], '->', runs[i + 1][2]);
  }
}
// active runs: list all runs >= 5 with ranges
{
  let c = 0, s = null, p = null;
  const runs = [];
  for (const date of dates) {
    if ((byDate.get(date) ?? 0) <= 0) { if (c >= 5) runs.push([c, s, p]); c = 0; s = null; p = null; continue; }
    const day = new Date(date + 'T00:00:00Z');
    if (p && s && day.getTime() - p.getTime() === 86400000) c++;
    else { c = 1; s = date; }
    p = day;
  }
  if (c >= 5) runs.push([c, s, p && p.toISOString().slice(0, 10)]);
  console.log('runs>=5:', JSON.stringify(runs));
  // current: run ending at last date?
  const lastD = dates[dates.length - 1];
  console.log('today-count:', byDate.get(lastD));
}
