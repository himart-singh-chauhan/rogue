const supabase = require('../config/supabase');

// Membership tier configurations
const TIER_CONFIG = {
  free: {
    name: 'Free',
    price: 0,
    renewalPrice: 0,
    submissionLimit: 3,
    features: ['3 submissions/month', 'Basic profile', 'Community access']
  },
  bronze: {
    name: 'Bronze',
    price: 9.99,
    renewalPrice: 9.99,
    submissionLimit: 10,
    features: ['10 submissions/month', 'Priority review', 'Profile badge', 'Analytics']
  },
  silver: {
    name: 'Silver',
    price: 19.99,
    renewalPrice: 19.99,
    submissionLimit: 30,
    features: ['30 submissions/month', 'Premium support', 'Advanced analytics', 'Custom badge']
  },
  gold: {
    name: 'Gold',
    price: 49.99,
    renewalPrice: 49.99,
    submissionLimit: 100,
    features: ['Unlimited submissions', '24/7 support', 'Full analytics', 'Featured profile', 'API access']
  }
};

const getFormattedMembership = (m) => {
  if (!m) return null;
  return {
    _id: m.id,
    id: m.id,
    user: m.user ? {
      _id: m.user.id,
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      username: m.user.username || '',
      profileImage: m.user.profile_image || ''
    } : m.user_id,
    userId: m.user_id,
    tier: m.tier,
    startDate: m.start_date,
    endDate: m.end_date,
    status: m.status,
    autoRenew: m.auto_renew,
    submissionLimit: m.submission_limit,
    submissionCount: m.submission_count,
    features: m.features || [],
    price: m.price ? parseFloat(m.price) : 0.00,
    renewalPrice: m.renewal_price ? parseFloat(m.renewal_price) : 0.00,
    paymentHistory: m.payment_history || [],
    cancellationDate: m.cancellation_date,
    cancellationReason: m.cancellation_reason,
    notes: m.notes || '',
    createdAt: m.created_at,
    updatedAt: m.updated_at
  };
};

const getTierConfigs = async (req, res) => {
  try {
    res.json(TIER_CONFIG);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tier configs', error: error.message });
  }
};

const getAllMemberships = async (req, res) => {
  try {
    const { tier, status } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 500);
    const offset = (page - 1) * limit;
    const search = String(req.query.search || '').replace(/[,()*%\\]/g, ' ').trim();

    let query = supabase
      .from('memberships')
      .select('*, user:users(id, name, email, username, profile_image)', { count: 'exact' });

    if (tier) query = query.eq('tier', tier);
    if (status) query = query.eq('status', status);

    // If search is provided, we must filter by matching user names or emails
    if (search) {
      const { data: matchedUsers } = await supabase
        .from('users')
        .select('id')
        .or(`name.ilike.%${search}%,email.ilike.%${search}%`);

      if (matchedUsers && matchedUsers.length > 0) {
        const userIds = matchedUsers.map(u => u.id);
        query = query.in('user_id', userIds);
      } else {
        // No matching users, return empty list
        return res.json({
          memberships: [],
          total: 0,
          page,
          pages: 0
        });
      }
    }

    const { data: memberships, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error && error.code !== 'PGRST103') throw error;

    res.json({
      memberships: (memberships || []).map(getFormattedMembership),
      total: count || 0,
      page,
      pages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching memberships', error: error.message });
  }
};

const getUserMembership = async (req, res) => {
  try {
    // Users may only read their own membership; admins may read anyone's.
    if (!req.user.is_admin && String(req.user.id) !== String(req.params.userId)) {
      return res.status(403).json({ message: 'Not authorized to view this membership' });
    }
    const { data: membership, error } = await supabase
      .from('memberships')
      .select('*, user:users(id, name, email)')
      .eq('user_id', req.params.userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;

    if (!membership) {
      const { data: user } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', req.params.userId)
        .maybeSingle();

      return res.json({
        tier: 'free',
        ...TIER_CONFIG.free,
        user: user ? {
          _id: user.id,
          id: user.id,
          name: user.name,
          email: user.email
        } : null,
        status: 'active',
        submissionCount: 0
      });
    }

    res.json(getFormattedMembership(membership));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching membership', error: error.message });
  }
};

const createMembership = async (req, res) => {
  const { userId, tier, autoRenew = false, paymentAmount = 0, applicationData = null } = req.body;

  try {
    if (!['free', 'bronze', 'silver', 'gold'].includes(tier)) {
      return res.status(400).json({ message: 'Invalid membership tier' });
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cancel any existing active memberships
    await supabase
      .from('memberships')
      .update({
        status: 'cancelled',
        cancellation_date: new Date(),
        updated_at: new Date()
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    const tierConfig = TIER_CONFIG[tier];
    const endDate = tier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const newPaymentHistory = paymentAmount > 0 ? [{
      date: new Date().toISOString(),
      amount: parseFloat(paymentAmount),
      type: 'purchase',
      transactionId: `TXN-${Date.now()}`,
      status: 'completed',
      applicationData: applicationData
    }] : [];

    const { data: membership, error } = await supabase
      .from('memberships')
      .insert([{
        user_id: userId,
        tier,
        start_date: new Date().toISOString(),
        end_date: endDate,
        status: 'active',
        auto_renew: tier !== 'free' ? autoRenew : false,
        submission_limit: tierConfig.submissionLimit,
        features: tierConfig.features,
        price: tierConfig.price,
        renewal_price: tierConfig.renewalPrice,
        payment_history: newPaymentHistory,
        notes: applicationData ? JSON.stringify(applicationData) : null
      }])
      .select('*, user:users(id, name, email)')
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Membership created successfully',
      membership: getFormattedMembership(membership)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating membership', error: error.message });
  }
};

const updateMembership = async (req, res) => {
  const { tier, autoRenew, submissionCount, notes, status, endDate } = req.body;

  try {
    const { data: existingMembership, error: findError } = await supabase
      .from('memberships')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !existingMembership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    const updates = {
      updated_at: new Date()
    };

    if (tier && tier !== existingMembership.tier) {
      if (!['free', 'bronze', 'silver', 'gold'].includes(tier)) {
        return res.status(400).json({ message: 'Invalid membership tier' });
      }
      const tierConfig = TIER_CONFIG[tier];
      updates.tier = tier;
      updates.submission_limit = tierConfig.submissionLimit;
      updates.features = tierConfig.features;
      updates.renewal_price = tierConfig.renewalPrice;
      updates.price = tierConfig.price;
    }

    if (typeof autoRenew !== 'undefined') updates.auto_renew = autoRenew;
    if (submissionCount !== undefined) updates.submission_count = parseInt(submissionCount);
    if (notes) updates.notes = notes;
    if (status) updates.status = status;
    if (endDate) updates.end_date = new Date(endDate).toISOString();

    const { data: membership, error } = await supabase
      .from('memberships')
      .update(updates)
      .eq('id', req.params.id)
      .select('*, user:users(id, name, email)')
      .single();

    if (error) throw error;

    res.json({
      message: 'Membership updated successfully',
      membership: getFormattedMembership(membership)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating membership', error: error.message });
  }
};

const changeMembershipTier = async (req, res) => {
  const { newTier, refundAmount = 0 } = req.body;

  try {
    const { data: existingMembership, error: findError } = await supabase
      .from('memberships')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !existingMembership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    if (!['free', 'bronze', 'silver', 'gold'].includes(newTier)) {
      return res.status(400).json({ message: 'Invalid membership tier' });
    }

    const oldTier = existingMembership.tier;
    const tierConfig = TIER_CONFIG[newTier];

    const currentHistory = existingMembership.payment_history || [];
    currentHistory.push({
      date: new Date().toISOString(),
      amount: refundAmount > 0 ? -parseFloat(refundAmount) : parseFloat(tierConfig.price),
      type: 'upgrade_downgrade',
      transactionId: `TXN-${Date.now()}`,
      status: 'completed'
    });

    const { data: membership, error } = await supabase
      .from('memberships')
      .update({
        tier: newTier,
        submission_limit: tierConfig.submissionLimit,
        features: tierConfig.features,
        renewal_price: tierConfig.renewalPrice,
        payment_history: currentHistory,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select('*, user:users(id, name, email)')
      .single();

    if (error) throw error;

    res.json({
      message: `Membership upgraded from ${oldTier} to ${newTier}`,
      membership: getFormattedMembership(membership)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error changing tier', error: error.message });
  }
};

const renewMembership = async (req, res) => {
  const { paymentAmount } = req.body;

  try {
    const { data: existingMembership, error: findError } = await supabase
      .from('memberships')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !existingMembership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    const currentHistory = existingMembership.payment_history || [];
    currentHistory.push({
      date: new Date().toISOString(),
      amount: paymentAmount ? parseFloat(paymentAmount) : parseFloat(existingMembership.renewal_price),
      type: 'renewal',
      transactionId: `TXN-${Date.now()}`,
      status: 'completed'
    });

    const { data: membership, error } = await supabase
      .from('memberships')
      .update({
        status: 'active',
        submission_count: 0,
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_history: currentHistory,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select('*, user:users(id, name, email)')
      .single();

    if (error) throw error;

    res.json({
      message: 'Membership renewed successfully',
      membership: getFormattedMembership(membership)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error renewing membership', error: error.message });
  }
};

const cancelMembership = async (req, res) => {
  const { reason = '' } = req.body;

  try {
    const { data: existingMembership, error: findError } = await supabase
      .from('memberships')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !existingMembership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    const { data: membership, error } = await supabase
      .from('memberships')
      .update({
        status: 'cancelled',
        cancellation_date: new Date(),
        cancellation_reason: reason,
        auto_renew: false,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select('*, user:users(id, name, email)')
      .single();

    if (error) throw error;

    res.json({
      message: 'Membership cancelled successfully',
      membership: getFormattedMembership(membership)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling membership', error: error.message });
  }
};

const getMembershipStats = async (req, res) => {
  try {
    // Implement statistical aggregation locally since it uses simple query results
    const { data: memberships, error } = await supabase
      .from('memberships')
      .select('*');

    if (error) throw error;

    const byTier = {};
    const byStatus = {};
    let totalRevenue = 0;

    memberships.forEach(m => {
      // stats by status
      byStatus[m.status] = (byStatus[m.status] || 0) + 1;

      // stats by tier (only active)
      if (m.status === 'active') {
        if (!byTier[m.tier]) {
          byTier[m.tier] = { count: 0, revenue: 0 };
        }
        byTier[m.tier].count++;
        byTier[m.tier].revenue += m.price ? parseFloat(m.price) : 0;
      }

      // revenue sum
      const history = m.payment_history || [];
      history.forEach(txn => {
        if (txn.status === 'completed') {
          totalRevenue += txn.amount ? parseFloat(txn.amount) : 0;
        }
      });
    });

    const byTierArray = Object.keys(byTier).map(tier => ({
      _id: tier,
      count: byTier[tier].count,
      revenue: byTier[tier].revenue
    }));

    const byStatusArray = Object.keys(byStatus).map(status => ({
      _id: status,
      count: byStatus[status]
    }));

    res.json({
      byTier: byTierArray,
      byStatus: byStatusArray,
      totalRevenue: Math.round(totalRevenue * 100) / 100
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const { data: membership, error } = await supabase
      .from('memberships')
      .select('id, user_id, tier, payment_history, user:users(id, name, email)')
      .eq('id', req.params.id)
      .single();

    if (error || !membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    res.json({
      user: membership.user ? {
        _id: membership.user.id,
        id: membership.user.id,
        name: membership.user.name,
        email: membership.user.email
      } : null,
      tier: membership.tier,
      paymentHistory: membership.payment_history || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment history', error: error.message });
  }
};

module.exports = {
  getTierConfigs,
  getAllMemberships,
  getUserMembership,
  createMembership,
  updateMembership,
  changeMembershipTier,
  renewMembership,
  cancelMembership,
  getMembershipStats,
  getPaymentHistory
};
