const supabase = require('../config/supabase');
const { awardPoints, toInt } = require('../utils/rankings');

const SORTABLE = new Set(['total_points', 'global_rank', 'verified_records_count', 'world_records_count', 'updated_at', 'created_at']);
const RANKING_SELECT = '*, users!inner(id, name, display_name:name, username, profile_image, country, state, city)';

const pageParams = (q) => {
  const limit = Math.min(Math.max(toInt(q.limit, 50), 1), 200);
  const offset = Math.max(toInt(q.offset, 0), 0);
  return { limit, offset };
};

// Build a user_rankings query with location filters (location lives on users).
const rankingsQuery = (q) => {
  const sortBy = SORTABLE.has(q.sortBy) ? q.sortBy : 'total_points';
  const ascending = q.order === 'asc';
  let query = supabase.from('user_rankings').select(RANKING_SELECT, { count: 'exact' });
  if (q.country) query = query.eq('users.country', q.country);
  if (q.state) query = query.eq('users.state', q.state);
  if (q.city) query = query.eq('users.city', q.city);
  if (q.search) query = query.ilike('users.name', `%${String(q.search).replace(/[%,()]/g, '')}%`);
  return query.order(sortBy, { ascending });
};

// Get global rankings with filters
exports.getGlobalRankings = async (req, res) => {
  try {
    const { limit, offset } = pageParams(req.query);
    const { data, count, error } = await rankingsQuery(req.query).range(offset, offset + limit - 1);
    if (error && error.code !== 'PGRST103') throw error;

    let rankings = data || [];

    // Fallback for a fresh database where user_rankings hasn't been populated yet:
    // rank athletes by verified record count. Only used when the table is completely empty.
    if (!count && !req.query.search && !req.query.country && !req.query.state && !req.query.city) {
      const { count: anyRows } = await supabase.from('user_rankings').select('id', { count: 'exact', head: true });
      if (!anyRows) {
        const { data: recordsData } = await supabase
          .from('records')
          .select('user_id, users!records_user_id_fkey(id, name, username, profile_image, country, state, city)')
          .eq('status', 'verified');
        const usersMap = {};
        (recordsData || []).forEach((r) => {
          if (!r.user_id || !r.users) return;
          usersMap[r.user_id] = usersMap[r.user_id] || {
            user_id: r.user_id,
            total_points: 0,
            verified_records_count: 0,
            world_records_count: 0,
            users: { ...r.users, display_name: r.users.name },
            global_rank: 0,
            tier_badge: 'Challenger',
          };
          usersMap[r.user_id].verified_records_count += 1;
          usersMap[r.user_id].total_points += 5000;
        });
        const dynamic = Object.values(usersMap).sort((a, b) => b.total_points - a.total_points);
        dynamic.forEach((r, idx) => { r.global_rank = idx + 1; });
        return res.json({ rankings: dynamic.slice(offset, offset + limit), total: dynamic.length, limit, offset, warning: 'Using dynamic fallback data.' });
      }
    }

    res.json({ rankings, total: count || 0, limit, offset });
  } catch (error) {
    console.error('Get rankings error:', error);
    res.status(500).json({ message: 'Could not load rankings', error: error.message });
  }
};

// Get local rankings
exports.getLocalRankings = async (req, res) => {
  try {
    const { limit, offset } = pageParams(req.query);
    const { data, count, error } = await rankingsQuery(req.query).range(offset, offset + limit - 1);
    if (error && error.code !== 'PGRST103') throw error;
    res.json({ rankings: data || [], total: count || 0, limit, offset });
  } catch (error) {
    console.error('Get local rankings error:', error);
    res.status(500).json({ message: 'Could not load local rankings', error: error.message });
  }
};

// Get category rankings (category_id may be a uuid, slug or name)
exports.getCategoryRankings = async (req, res) => {
  try {
    const { category_id } = req.params;
    const { limit, offset } = pageParams(req.query);

    const isUUID = /^[0-9a-f-]{36}$/i.test(category_id);
    let recordsQuery = supabase.from('records').select('user_id').eq('status', 'verified');
    if (isUUID) {
      recordsQuery = recordsQuery.eq('category_id', category_id);
    } else {
      recordsQuery = recordsQuery.ilike('category', String(category_id).replace(/-/g, ' '));
    }
    const { data: records, error: recordsError } = await recordsQuery;
    if (recordsError) throw recordsError;

    const userIds = [...new Set((records || []).map((r) => r.user_id).filter(Boolean))].slice(0, 500);
    if (userIds.length === 0) return res.json({ rankings: [], total: 0, category_id, limit });

    const { data, count, error } = await supabase
      .from('user_rankings')
      .select('*, users(id, name, display_name:name, username, profile_image, country)', { count: 'exact' })
      .in('user_id', userIds)
      .order('total_points', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({ rankings: data || [], total: count || 0, category_id, limit });
  } catch (error) {
    console.error('Get category rankings error:', error);
    res.status(500).json({ message: 'Could not load category rankings', error: error.message });
  }
};

// Get user ranking details
exports.getUserRankingDetails = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(user_id)) return res.status(404).json({ message: 'User not found' });

    const [{ data: ranking, error: rankingError }, { data: pointsHistory, error: historyError }, { data: records }] = await Promise.all([
      supabase.from('user_rankings').select('*, users(name, username, profile_image, country)').eq('user_id', user_id).maybeSingle(),
      supabase.from('user_points_history').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(20),
      supabase.from('records').select('id, title, category, category_id, value, unit, status').eq('user_id', user_id).eq('status', 'verified').limit(10),
    ]);

    if (rankingError) throw rankingError;
    if (historyError) throw historyError;

    res.json({ ranking: ranking || null, recentPoints: pointsHistory || [], verifiedRecords: records || [] });
  } catch (error) {
    console.error('Get user ranking details error:', error);
    res.status(500).json({ message: 'Could not load ranking details', error: error.message });
  }
};

// Add points (admin only, enforced by route)
exports.addUserPoints = async (req, res) => {
  try {
    const { user_id, points, source, reference_id, reason } = req.body;
    if (!user_id || points === undefined || points === null || !source) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const ranking = await awardPoints({
      userId: user_id, points, source, referenceId: reference_id, reason, adminId: req.user.id, isManual: false,
    });
    res.json({ success: true, ranking });
  } catch (error) {
    console.error('Add points error:', error);
    res.status(500).json({ message: 'Could not add points', error: error.message });
  }
};

// Admin adjust points
exports.adjustUserPoints = async (req, res) => {
  try {
    const { user_id, points, reason, notes } = req.body;
    if (!user_id || points === undefined || !reason) return res.status(400).json({ message: 'Missing required fields' });

    const ranking = await awardPoints({
      userId: user_id, points, source: 'admin_adjustment', reason, adminNotes: notes, adminId: req.user.id, isManual: true,
    });
    res.json({ success: true, ranking });
  } catch (error) {
    console.error('Adjust points error:', error);
    res.status(500).json({ message: 'Could not adjust points', error: error.message });
  }
};

// Recalculate global rank positions (single SQL statement via RPC)
exports.recalculateAllRankings = async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('recalculate_global_ranks');
    if (error) throw error;
    res.json({ success: true, recalculatedCount: data ?? 0 });
  } catch (error) {
    console.error('Recalculate rankings error:', error);
    res.status(500).json({ message: 'Could not recalculate rankings', error: error.message });
  }
};

// Get points rules
exports.getPointsRules = async (req, res) => {
  try {
    const { data, error } = await supabase.from('points_rules').select('*').order('points_value', { ascending: false });
    if (error) throw error;
    res.json({ rules: data || [] });
  } catch (error) {
    console.error('Get points rules error:', error);
    res.status(500).json({ message: 'Could not load points rules', error: error.message });
  }
};

// Update points rule (admin only, enforced by route)
exports.updatePointsRule = async (req, res) => {
  try {
    const { rule_name } = req.params;
    const { points_value, description, active } = req.body;

    const updates = { updated_at: new Date() };
    if (points_value !== undefined && points_value !== '') updates.points_value = toInt(points_value);
    if (description !== undefined) updates.description = description;
    if (active !== undefined) updates.active = !!active;

    const { data, error } = await supabase.from('points_rules').update(updates).eq('rule_name', rule_name).select();
    if (error) throw error;
    if (!data || !data.length) return res.status(404).json({ message: 'Rule not found' });

    res.json({ success: true, rule: data[0] });
  } catch (error) {
    console.error('Update points rule error:', error);
    res.status(500).json({ message: 'Could not update rule', error: error.message });
  }
};
