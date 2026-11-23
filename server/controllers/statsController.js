// GET /api/stats/public: the site's public numbers, always from real data.
//  recordsSet = verified records · countries = countries those records were set in (or their athlete's country)
//  categories = active categories, subcategories included (what a member can submit in)
//  members = active member accounts · verifiedAthletes = members with at least one verified record
const supabase = require('../config/supabase');

let cache = { at: 0, value: null };
const TTL_MS = 5 * 60 * 1000;

const publicStats = async (req, res) => {
  try {
    if (cache.value && Date.now() - cache.at < TTL_MS) return res.json(cache.value);
    const [{ data: records, error: e1 }, { count: categories, error: e2 }, { count: members, error: e3 }] = await Promise.all([
      supabase.from('records').select('user_id, country, user:user_id(country)').eq('status', 'verified').limit(100000),
      supabase.from('categories').select('id', { count: 'exact', head: true }).neq('active', false),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_admin', false).not('account_status', 'in', '(banned,suspended)'),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    if (e3) throw e3;
    const countries = new Set((records || [])
      .map((r) => String(r.country || r.user?.country || '').trim().toLowerCase())
      .filter((c) => c && c !== 'other'));
    const value = {
      recordsSet: (records || []).length,
      countries: countries.size,
      categories: categories || 0,
      members: members || 0,
      verifiedAthletes: new Set((records || []).map((r) => r.user_id).filter(Boolean)).size,
    };
    cache = { at: Date.now(), value };
    res.json(value);
  } catch (e) {
    res.status(500).json({ message: 'Could not load the numbers', error: e.message });
  }
};

module.exports = { publicStats };
