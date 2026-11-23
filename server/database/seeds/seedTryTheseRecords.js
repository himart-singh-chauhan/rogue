// Loads Curtis's 40 Try These Records challenges (all "Open to Set") and the general rules.
// Safe to run again: challenge numbers that already exist are left as they are.
// Usage (from server/): node database/seeds/seedTryTheseRecords.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const supabase = require('../../config/supabase');
const { build } = require('./buildTryTheseRecords');
const { RULES_KEY } = require('../../controllers/openRecordController');

(async () => {
  const { general, challenges } = build();
  const { data: existing, error: e1 } = await supabase.from('open_records').select('number').not('number', 'is', null);
  if (e1) throw e1;
  const have = new Set((existing || []).map((r) => r.number));
  const rows = challenges.filter((c) => !have.has(c.number)).map((c) => ({ ...c, status: 'open', eligibility: 'Worldwide', divisions: [] }));
  if (rows.length) {
    const { error } = await supabase.from('open_records').insert(rows);
    if (error) throw error;
  }
  const { data: rules } = await supabase.from('system_settings').select('key').eq('key', RULES_KEY).maybeSingle();
  if (!rules) {
    const { error } = await supabase.from('system_settings').upsert({ key: RULES_KEY, value: JSON.stringify(general), updated_at: new Date() }, { onConflict: 'key' });
    if (error) throw error;
  }
  console.log(`Added ${rows.length} challenges (${challenges.length - rows.length} already there). General rules: ${rules ? 'already set' : 'added'}.`);
})().catch((e) => { console.error(e.message); process.exit(1); });
