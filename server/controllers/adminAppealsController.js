const supabase = require('../config/supabase');

// @desc    Get all appeals with search, filter, and pagination
// @route   GET /admin/appeals
// @access  Private/Admin
const getAppeals = async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    let query = supabase
      .from('appeals')
      .select(`
        *,
        user:users!user_id(name, email, member_number),
        record:records!record_id(title, status)
      `, { count: 'exact' });

    if (status && status !== 'all') {
      if (status === 'Recent') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = query.gte('created_at', sevenDaysAgo.toISOString());
      } else if (status === 'High-Priority') {
        query = query.eq('priority', 'high');
      } else {
        query = query.eq('status', status);
      }
    }

    // Search is complex in Supabase via JS, so we'll fetch and filter in memory if there's a search term
    // Alternatively, we could use an RPC, but we'll stick to a simple approach for now.

    // Pagination
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: appeals, count, error } = await query;

    if (error) {
      console.error('Error fetching appeals:', error);
      // Fallback: If table doesn't exist, return empty array rather than breaking the UI
      if (error.code === 'PGRST103') {
        return res.json({ appeals: [], count: count || 0, totalPages: Math.ceil((count || 0) / limitNum), currentPage: pageNum });
      }
      if (error.code === '42P01') {
         return res.json({ appeals: [], count: 0, totalPages: 0, currentPage: 1, _fallback: true });
      }
      return res.status(400).json({ message: error.message });
    }

    let filteredAppeals = appeals;

    // Basic in-memory search if needed
    if (search) {
      const s = search.toLowerCase();
      filteredAppeals = appeals.filter(a =>
        (a.id && a.id.toLowerCase().includes(s)) ||
        (a.user?.name && a.user.name.toLowerCase().includes(s)) ||
        (a.user?.email && a.user.email.toLowerCase().includes(s)) ||
        (a.user?.member_number && a.user.member_number.toLowerCase().includes(s)) ||
        (a.record?.title && a.record.title.toLowerCase().includes(s))
      );
    }

    res.json({
      appeals: filteredAppeals,
      count: search ? filteredAppeals.length : count,
      totalPages: Math.ceil((search ? filteredAppeals.length : count) / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    console.warn('getAppeals caught error (table may not exist):', error.message);
    res.status(200).json({ appeals: [], count: 0, totalPages: 0, currentPage: 1, _fallback: true });
  }
};

// @desc    Get single appeal details
// @route   GET /admin/appeals/:id
// @access  Private/Admin
const getAppealById = async (req, res) => {
  try {
    const { data: appeal, error } = await supabase
      .from('appeals')
      .select(`
        *,
        user:users!user_id(name, email, member_number, profile_image),
        record:records!record_id(*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ message: 'Appeal not found' });
    res.json(appeal);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching appeal details' });
  }
};

// @desc    Update appeal status (Approve, Deny, Escalate, etc)
// @route   PUT /admin/appeals/:id/status
// @access  Private/Admin
const updateAppealStatus = async (req, res) => {
  try {
    const { status, resolution_note } = req.body;

    // Fetch current appeal to get resolution history
    const { data: appeal } = await supabase.from('appeals').select('resolution_history').eq('id', req.params.id).single();

    const history = appeal?.resolution_history || [];
    history.push({
      status,
      note: resolution_note || `Status changed to ${status}`,
      date: new Date().toISOString(),
      admin_id: req.user.id
    });

    const updates = {
      status,
      resolution_history: history,
      updated_at: new Date().toISOString()
    };

    if (status === 'Approved' || status === 'Denied' || status === 'Closed') {
      updates.resolved_at = new Date().toISOString();
    } else if (status === 'Under Review') {
      updates.reviewed_at = new Date().toISOString();
    }

    const { data: updatedAppeal, error } = await supabase
      .from('appeals')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });

    // Also log this action
    await supabase.from('audit_logs').insert([{
      actor_id: req.user.id,
      action_type: 'UPDATE_APPEAL_STATUS',
      entity_id: req.params.id,
      metadata: { new_status: status, note: resolution_note }
    }]);

    res.json(updatedAppeal);
  } catch (error) {
    res.status(500).json({ message: 'Server Error updating appeal status' });
  }
};

// @desc    Update appeal admin notes
// @route   PUT /admin/appeals/:id/notes
// @access  Private/Admin
const updateAppealNotes = async (req, res) => {
  try {
    const { admin_notes } = req.body;

    const { data: updatedAppeal, error } = await supabase
      .from('appeals')
      .update({ admin_notes, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });

    res.json(updatedAppeal);
  } catch (error) {
    res.status(500).json({ message: 'Server Error updating appeal notes' });
  }
};

module.exports = {
  getAppeals,
  getAppealById,
  updateAppealStatus,
  updateAppealNotes
};
