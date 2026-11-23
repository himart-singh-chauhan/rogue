// Turns Curtis's "Record Challenge Rules" (record_challenge_rules.txt) into the 40 Try These Records challenges
// and the general rules. Used by seedTryTheseRecords.js; run `node buildTryTheseRecords.js` to print the result.
const fs = require('fs');
const path = require('path');

const SECTION = { 'Fitness Challenges': 'Record Challenges', 'Running Challenges': 'Record Challenges', 'Funny Talent Challenges': 'Funny Talent Challenges' };
// the site category each challenge is filed under (so rankings and Explore Records work)
const CATEGORY = { 'Fitness Challenges': 'Fitness', 'Running Challenges': 'Speed', 'Funny Talent Challenges': 'Funny Talent' };

const timeLimitOf = (title, summary) => {
  const m = /\bin (\d+) (minute|minutes|second|seconds)\b/i.exec(title) || /\bin (\d+) (seconds)\b/i.exec(summary);
  return m ? `${m[1]} ${m[2].toLowerCase().replace(/^minute$/, 'minute').replace(/^second$/, 'second')}` : null;
};
const scoringOf = (title, summary) => {
  if (/^fastest/i.test(title) || /lowest valid elapsed|shortest time|fastest time|lowest elapsed/i.test(summary)) return 'fastest';
  if (/^longest/i.test(title) || /score the duration/i.test(summary)) return 'longest';
  return 'most';
};
const measurementOf = (scoring) => (scoring === 'most' ? 'repetitions' : 'time');
const unitOf = (scoring, title) => {
  if (scoring !== 'most') return 'seconds';
  if (/skips/i.test(title)) return 'skips';
  if (/free throws|throws|tossed|thrown/i.test(title)) return 'successful throws';
  if (/juggles/i.test(title)) return 'touches';
  if (/stacked|tower/i.test(title)) return /coins/i.test(title) ? 'coins' : 'rolls';
  if (/socks put on/i.test(title)) return 'socks';
  if (/clothespins/i.test(title)) return 'clothespins';
  if (/gift bows/i.test(title)) return 'bows';
  if (/bounced/i.test(title)) return 'balls';
  if (/cotton balls/i.test(title)) return 'cotton balls';
  if (/bottle flips/i.test(title)) return 'landings';
  if (/airplanes/i.test(title)) return 'airplanes';
  if (/cushions/i.test(title)) return 'cushions';
  return 'reps';
};
const isFilming = (s) => /\b(film|camera|in frame|visible|footage|show the|show all|show its|show the attached|shown before)\b/i.test(s);
const sentences = (p) => p.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);

const build = () => {
  const lines = fs.readFileSync(path.join(__dirname, 'record_challenge_rules.txt'), 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // general rules: heading + paragraph pairs until the first SECTION
  const general = [];
  let i = lines.indexOf('GENERAL') + 1;
  while (i < lines.length && !lines[i].startsWith('SECTION ')) { general.push({ heading: lines[i], text: lines[i + 1] }); i += 2; }

  const out = [];
  let section = null;
  let cur = null;
  const flush = () => { if (cur) out.push(cur); cur = null; };
  for (; i < lines.length; i += 1) {
    const l = lines[i];
    if (l.startsWith('SECTION ')) { flush(); section = l.slice(8); continue; }
    const m = /^(\d{2})\s+(.+)$/.exec(l);
    if (m) { flush(); cur = { number: Number(m[1]), title: m[2], group: section, paragraphs: [] }; continue; }
    if (cur) cur.paragraphs.push(l);
  }
  flush();

  return {
    general,
    challenges: out.map((c) => {
      const summary = c.paragraphs[0];
      const rest = c.paragraphs.slice(1);
      const scoring = scoringOf(c.title, summary);
      const film = rest.flatMap(sentences).filter(isFilming);
      return {
        number: c.number,
        title: c.title,
        section: SECTION[c.group],
        category: CATEGORY[c.group],
        subcategory: c.group.replace(/ Challenges$/, ''),
        description: summary,
        rules: rest.join('\n\n'),
        scoring,
        time_limit: timeLimitOf(c.title, summary),
        measurement: measurementOf(scoring),
        measurement_unit: unitOf(scoring, c.title),
        evidence: [
          'One continuous, unedited video from setup through the final count or finish, with a visible timer or a clear, audible start signal.',
          ...film,
        ].join('\n'),
        difficulty: scoring === 'fastest' && /dash|run/i.test(c.title) ? 'hard' : c.group === 'Funny Talent Challenges' ? 'easy' : 'medium',
        sort_order: c.number * 10,
      };
    }),
  };
};

module.exports = { build };
if (require.main === module) console.log(JSON.stringify(build(), null, 2));
