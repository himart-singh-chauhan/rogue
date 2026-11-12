const supabase = require('../config/supabase');

// Membership plans come from the membership_plans table (editable in Admin → Memberships → Plans).
const { getPlanBySlug, formatPlan } = require('./planController');
const { evaluateCoupon } = require('./couponController');
const stripe = require('../utils/stripe');
const { notifyMember } = require('../utils/notify');

// Adapter: plan row -> the shape the membership code expects
const tierConfigFor = async (slug) => {
  const plan = await getPlanBySlug(slug);
  if (!plan) return null;
  return {
    name: plan.name,
    price: plan.price,
    renewalPrice: plan.billingInterval === 'one_time' ? 0 : plan.price,
    submissionLimit: plan.submissionLimit, // null = unlimited
    features: plan.features,
    billingInterval: plan.billingInterval,
  };
};

// When a membership period ends: free and one-time (lifetime) plans never expire.
const endDateFor = (slug, cfg) => {
  if (!cfg || slug === 'free' || cfg.billingInterval === 'one_time' || cfg.price === 0) return null;
  const days = cfg.billingInterval === 'year' ? 365 : 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
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
    paidByCard: !!(m.stripe_subscription_id || m.stripe_customer_id), // Stripe: "Manage billing" is available
    createdAt: m.created_at,
    updatedAt: m.updated_at
  };
};

const getTierConfigs = async (req, res) => {
  try {
    const supabase2 = supabase;
    const { data } = await supabase2.from('membership_plans').select('*').eq('active', true).order('sort_order');
    // keyed by slug, like the old TIER_CONFIG response
    const out = {};
    (data || []).forEach((p) => {
      const f = formatPlan(p);
      out[f.slug] = { name: f.name, price: f.price, renewalPrice: f.price, submissionLimit: f.submissionLimit, features: f.features, billingInterval: f.billingInterval };
    });
    res.json(out);
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
        ...((await tierConfigFor('free')) || {}),
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
    const tierConfig = await tierConfigFor(tier);
    if (!tierConfig) {
      return res.status(400).json({ message: 'Invalid membership plan' });
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

    const endDate = endDateFor(tier, tierConfig);

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
      const tierConfig = await tierConfigFor(tier);
      if (!tierConfig) {
        return res.status(400).json({ message: 'Invalid membership plan' });
      }
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

    if (status === 'active' && existingMembership.status !== 'active') {
      await supabase
        .from('memberships')
        .update({ status: 'cancelled', cancellation_date: new Date(), cancellation_reason: 'Replaced by a new plan', updated_at: new Date() })
        .eq('user_id', existingMembership.user_id)
        .eq('status', 'active')
        .neq('id', existingMembership.id);
    }

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

    const tierConfig = await tierConfigFor(newTier);
    if (!tierConfig) {
      return res.status(400).json({ message: 'Invalid membership plan' });
    }

    const oldTier = existingMembership.tier;
    if (oldTier === newTier) {
      return res.status(400).json({ message: 'The member is already on this plan.' });
    }

    // An admin plan change is a record of the change, not money received: it is logged with
    // amount 0 (or the refund given) so revenue reports only count real payments.
    const currentHistory = existingMembership.payment_history || [];
    currentHistory.push({
      date: new Date().toISOString(),
      amount: refundAmount > 0 ? -parseFloat(refundAmount) : 0,
      type: 'upgrade_downgrade',
      note: `Plan changed by admin from ${oldTier} to ${newTier}`,
      transactionId: `TXN-${Date.now()}`,
      status: refundAmount > 0 ? 'refunded' : 'adjustment'
    });

    const { data: membership, error } = await supabase
      .from('memberships')
      .update({
        tier: newTier,
        submission_limit: tierConfig.submissionLimit,
        features: tierConfig.features,
        price: tierConfig.price,
        renewal_price: tierConfig.renewalPrice,
        end_date: endDateFor(newTier, tierConfig),
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

    if (!['active', 'expired'].includes(existingMembership.status)) {
      return res.status(400).json({ message: 'Only an active or expired membership can be renewed. Activate a pending request instead.' });
    }
    const cfg = await tierConfigFor(existingMembership.tier);
    if (!cfg || cfg.billingInterval === 'one_time' || !cfg.price) {
      return res.status(400).json({ message: 'This plan does not renew (it is free or a one-time / lifetime plan).' });
    }

    // only one active membership per user
    await supabase
      .from('memberships')
      .update({ status: 'cancelled', cancellation_date: new Date(), cancellation_reason: 'Replaced by a renewed plan', updated_at: new Date() })
      .eq('user_id', existingMembership.user_id)
      .eq('status', 'active')
      .neq('id', existingMembership.id);

    const currentHistory = existingMembership.payment_history || [];
    currentHistory.push({
      date: new Date().toISOString(),
      amount: paymentAmount ? parseFloat(paymentAmount) : parseFloat(existingMembership.renewal_price),
      type: 'renewal',
      transactionId: `TXN-${Date.now()}`,
      status: 'completed'
    });

    // extend from the current end date if it hasn't passed yet
    const base = existingMembership.end_date && new Date(existingMembership.end_date) > new Date() ? new Date(existingMembership.end_date).getTime() : Date.now();
    const days = cfg.billingInterval === 'year' ? 365 : 30;

    const { data: membership, error } = await supabase
      .from('memberships')
      .update({
        status: 'active',
        submission_count: 0,
        end_date: new Date(base + days * 24 * 60 * 60 * 1000).toISOString(),
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

    // A plan paid by subscription stops billing in Stripe straight away.
    if (existingMembership.stripe_subscription_id && stripe.stripeEnabled()) {
      try {
        await stripe.getStripe().subscriptions.cancel(existingMembership.stripe_subscription_id);
      } catch (e) {
        if (e.code !== 'resource_missing') {
          return res.status(502).json({ message: `Stripe could not cancel the subscription: ${e.message}` });
        }
      }
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

// ---------------------------------------------------------------------------
// Upgrade requests from the Membership page.
// Until Stripe Checkout is connected no card is charged, so a paid plan is saved as a
// PENDING request; an administrator activates it once payment is confirmed.
// (When Stripe is live, the Stripe webhook activates it instead.)
// ---------------------------------------------------------------------------
const cleanText = (v, max = 200) => String(v || '').trim().slice(0, max);

const requestMembership = async (req, res) => {
  const userId = req.user.id;
  const slug = cleanText(req.body.tier, 50).toLowerCase();
  const app = req.body.applicationData || {};
  try {
    const plan = await getPlanBySlug(slug);
    if (!plan || !plan.active) return res.status(400).json({ message: 'This membership plan is not available.' });

    if (!plan.price) {
      return res.json({ status: 'free', message: 'You are on the Free plan. No payment is needed.' });
    }

    const { data: current } = await supabase
      .from('memberships')
      .select('id, tier, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    if (current && current.tier === slug) {
      return res.status(400).json({ message: `You already have an active ${plan.name} membership.` });
    }

    // One open request at a time: a new request replaces the previous one
    await supabase
      .from('memberships')
      .update({ status: 'cancelled', cancellation_date: new Date(), cancellation_reason: 'Replaced by a newer upgrade request', updated_at: new Date() })
      .eq('user_id', userId)
      .eq('status', 'pending');

    // The amount owed is the plan price minus a coupon checked here (never an amount from the browser).
    // The coupon itself is used up when an admin activates the request.
    const couponCode = cleanText(req.body.couponCode, 40).toUpperCase() || null;
    let couponDiscount = 0;
    if (couponCode) {
      const verdict = await evaluateCoupon({ code: couponCode, subtotal: plan.price, items: [], checkoutType: 'membership', targetId: slug, customerEmail: req.user.email }, req.user);
      if (!verdict.data?.valid) return res.status(400).json({ message: verdict.data?.message || 'That coupon could not be applied.' });
      couponDiscount = Math.min(plan.price, Math.max(0, Number(verdict.data.discountAmount) || 0));
    }
    const applicationData = {
      fullName: cleanText(app.fullName),
      email: cleanText(app.email || req.user.email),
      phone: cleanText(app.phone, 40),
      address: cleanText(app.address, 300),
      couponCode: couponDiscount > 0 ? couponCode : null,
      couponDiscount,
    };
    const quoted = Math.round((plan.price - couponDiscount) * 100) / 100;

    const { data: membership, error } = await supabase
      .from('memberships')
      .insert([{
        user_id: userId,
        tier: slug,
        start_date: new Date().toISOString(),
        end_date: null,
        status: 'pending',
        auto_renew: plan.billingInterval !== 'one_time',
        submission_limit: plan.submissionLimit,
        features: plan.features,
        price: plan.price,
        renewal_price: plan.billingInterval === 'one_time' ? 0 : plan.price,
        payment_history: [{
          date: new Date().toISOString(),
          amount: quoted,
          type: 'purchase',
          transactionId: `REQ-${Date.now()}`,
          status: 'pending',
        }],
        notes: JSON.stringify(applicationData),
      }])
      .select('*, user:users(id, name, email)')
      .single();
    if (error) throw error;

    // Pay on Stripe's page; the plan switches on when Stripe confirms the payment.
    if (stripe.stripeEnabled()) {
      const recurring = ['month', 'year'].includes(plan.billingInterval) ? plan.billingInterval : null;
      try {
        const customerId = await stripe.ensureCustomer(userId);
        const checkout = await stripe.createCheckout({
          req,
          kind: 'membership',
          referenceId: membership.id,
          userId,
          customerId,
          mode: recurring ? 'subscription' : 'payment',
          description: `AMPEX ${plan.name} membership`,
          lines: [{
            name: `AMPEX ${plan.name} membership`,
            description: recurring ? `Renews every ${recurring}. Cancel any time.` : 'One-time payment',
            amount: plan.price,
            qty: 1,
            recurring,
          }],
          discountAmount: couponDiscount,
          discountName: couponDiscount > 0 ? couponCode : null,
          successPath: '/elite',
          cancelPath: '/elite',
          metadata: { membership_id: membership.id, plan: slug },
        });
        return res.status(201).json({ status: 'checkout', checkoutUrl: checkout.url, paymentId: checkout.paymentId });
      } catch (e) {
        await supabase.from('memberships').update({ status: 'cancelled', cancellation_reason: 'Payment page could not open', updated_at: new Date() }).eq('id', membership.id);
        console.error('Stripe membership checkout could not start:', e.message);
        return res.status(e.status && e.status < 500 ? e.status : 502).json({ message: e.status && e.status < 500 ? e.message : 'Could not open the secure payment page. Please try again.' });
      }
    }

    res.status(202).json({
      status: 'pending',
      message: `Your ${plan.name} upgrade request has been received. Your card has not been charged. Our team will confirm your upgrade and payment by email.`,
      membership: getFormattedMembership(membership),
    });
  } catch (error) {
    console.error('requestMembership:', error.message);
    res.status(500).json({ message: 'Could not save your upgrade request. Please try again.' });
  }
};

// Admin: turn a pending request (or any membership) into the user's active plan
const activateMembership = async (req, res) => {
  const { paymentReceived = true } = req.body || {};
  try {
    const { data: m, error: findError } = await supabase.from('memberships').select('*').eq('id', req.params.id).single();
    if (findError || !m) return res.status(404).json({ message: 'Membership not found' });
    const cfg = await tierConfigFor(m.tier);
    if (!cfg) return res.status(400).json({ message: 'This plan no longer exists. Change the plan first.' });

    // only one active membership per user (a replaced Stripe subscription is stopped too)
    await cancelOtherActive(m.user_id, m.id, 'Replaced by a new plan');

    const history = (m.payment_history || []).map((p) =>
      p.status === 'pending' ? { ...p, status: paymentReceived ? 'completed' : 'waived', confirmedAt: new Date().toISOString(), confirmedBy: req.user.id } : p);

    const { data: membership, error } = await supabase
      .from('memberships')
      .update({
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: endDateFor(m.tier, cfg),
        submission_limit: cfg.submissionLimit,
        features: cfg.features,
        payment_history: history,
        updated_at: new Date(),
      })
      .eq('id', m.id)
      .select('*, user:users(id, name, email)')
      .single();
    if (error) throw error;

    // Use up the coupon the member applied to this request (limits are enforced by the database).
    let warning = null;
    let app = {};
    try { app = JSON.parse(m.notes || '{}') || {}; } catch { app = {}; }
    if (m.status === 'pending' && app.couponCode && Number(app.couponDiscount) > 0) {
      const { data: result, error: redeemError } = await supabase.rpc('redeem_coupon_v2', {
        p_code: app.couponCode, p_user: m.user_id, p_email: app.email || null,
        p_context: 'membership', p_reference: String(m.id), p_discount: Number(app.couponDiscount),
      });
      if (redeemError || result !== 'ok') {
        warning = `Coupon ${app.couponCode} could not be counted (${redeemError ? 'error' : result}). The member was quoted the discounted price.`;
      }
    }
    res.json({ message: 'Membership activated', warning, membership: getFormattedMembership(membership) });
  } catch (error) {
    res.status(500).json({ message: 'Error activating membership', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// Stripe: monthly / yearly plans are Stripe subscriptions; one-time plans a single payment.
// ---------------------------------------------------------------------------
const planNameFor = async (slug) => {
  const { data } = await supabase.from('membership_plans').select('name').eq('slug', slug).maybeSingle();
  return data?.name || slug;
};
const unix = (s) => (s ? new Date(s * 1000).toISOString() : null);

// Only one active plan per member. Replaced plans that bill through Stripe are stopped there too,
// so a member who upgrades is not charged for both plans.
const cancelOtherActive = async (userId, exceptId, reason) => {
  const { data: others } = await supabase
    .from('memberships')
    .select('id, stripe_subscription_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .neq('id', exceptId);
  for (const o of others || []) {
    if (o.stripe_subscription_id && stripe.stripeEnabled()) {
      try {
        await stripe.getStripe().subscriptions.cancel(o.stripe_subscription_id);
      } catch (e) {
        if (e.code !== 'resource_missing') console.warn('[Membership] could not stop old subscription:', e.message);
      }
    }
  }
  if ((others || []).length) {
    await supabase
      .from('memberships')
      .update({ status: 'cancelled', cancellation_date: new Date(), cancellation_reason: reason, auto_renew: false, updated_at: new Date() })
      .in('id', others.map((o) => o.id));
  }
};

const membershipForSubscription = async (subscriptionId) => {
  const { data } = await supabase
    .from('memberships')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
};

const paymentHooks = {
  // Checkout paid: the pending request becomes the member's active plan.
  onPaid: async (payment, session) => {
    const { data: m } = await supabase.from('memberships').select('*').eq('id', payment.reference_id).maybeSingle();
    if (!m || m.status === 'active') return;
    const cfg = await tierConfigFor(m.tier);
    const subscriptionId = payment.stripe_subscription_id || null;
    let endDate = endDateFor(m.tier, cfg || {});
    if (subscriptionId) {
      const sub = await stripe.getStripe().subscriptions.retrieve(subscriptionId);
      endDate = unix(sub.current_period_end) || endDate;
    }
    await cancelOtherActive(m.user_id, m.id, 'Replaced by a new plan');
    const transactionId = payment.stripe_payment_intent_id || subscriptionId || session?.id || payment.id;
    const history = (m.payment_history || []).map((p) => (p.status === 'pending'
      ? { ...p, amount: Number(payment.amount), status: 'completed', transactionId, paidVia: 'stripe', confirmedAt: new Date().toISOString() }
      : p));
    const { error } = await supabase
      .from('memberships')
      .update({
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: endDate,
        auto_renew: !!subscriptionId,
        submission_limit: cfg ? cfg.submissionLimit : m.submission_limit,
        features: cfg ? cfg.features : m.features,
        payment_history: history,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: payment.stripe_customer_id || null,
        updated_at: new Date(),
      })
      .eq('id', m.id);
    if (error) throw error;

    let app = {};
    try { app = JSON.parse(m.notes || '{}') || {}; } catch { app = {}; }
    if (app.couponCode && Number(app.couponDiscount) > 0) {
      const { data: result } = await supabase.rpc('redeem_coupon_v2', {
        p_code: app.couponCode, p_user: m.user_id, p_email: app.email || null,
        p_context: 'membership', p_reference: String(m.id), p_discount: Number(app.couponDiscount),
      });
      if (result !== 'ok') console.warn(`[Membership] paid but coupon ${app.couponCode} could not be counted (${result}).`);
    }
    const name = await planNameFor(m.tier);
    await notifyMember({
      userId: m.user_id,
      subject: `Your ${name} membership is active`,
      body: `Welcome to ${name}! We received $${Number(payment.amount).toFixed(2)}.${subscriptionId ? `\n\nYour plan renews automatically${endDate ? ` on ${new Date(endDate).toLocaleDateString('en-US')}` : ''}. You can update your card or cancel any time on the Membership page → Manage billing.` : ''}`,
    });
  },
  onFailed: async (payment) => {
    await supabase
      .from('memberships')
      .update({ status: 'cancelled', cancellation_date: new Date(), cancellation_reason: 'Payment was not completed', updated_at: new Date() })
      .eq('id', payment.reference_id)
      .eq('status', 'pending');
  },
  onRefund: async (payment, { full, refunded }) => {
    const { data: m } = await supabase.from('memberships').select('*').eq('id', payment.reference_id).maybeSingle();
    if (!m) return;
    const history = [...(m.payment_history || []), {
      date: new Date().toISOString(), amount: -Number(refunded), type: 'refund', status: 'refunded',
      transactionId: payment.stripe_payment_intent_id || payment.id, paidVia: 'stripe',
    }];
    const updates = { payment_history: history, updated_at: new Date() };
    // A refunded one-time plan ends. A refunded subscription keeps running until it is cancelled in Stripe.
    if (full && !m.stripe_subscription_id && m.status === 'active') {
      Object.assign(updates, { status: 'cancelled', cancellation_date: new Date(), cancellation_reason: 'Payment refunded', auto_renew: false });
    }
    await supabase.from('memberships').update(updates).eq('id', m.id);
    await notifyMember({
      userId: m.user_id,
      subject: 'Membership payment refunded',
      body: `We refunded $${Number(refunded).toFixed(2)} to your card. It usually shows within 5–10 business days.`,
    });
  },
};

// invoice.paid: a monthly / yearly renewal went through (the first payment is handled by the checkout).
const onInvoicePaid = async (invoiceId) => {
  const s = stripe.getStripe();
  const invoice = await s.invoices.retrieve(invoiceId);
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId || invoice.billing_reason === 'subscription_create') return;
  const m = await membershipForSubscription(subscriptionId);
  if (!m) return;
  const amount = stripe.dollars(invoice.amount_paid);
  // One row per invoice (unique), so a repeated webhook does nothing the second time.
  const { error: payError } = await supabase.from('payments').insert([{
    user_id: m.user_id, kind: 'membership', reference_id: m.id, status: 'paid', amount, paid_at: new Date().toISOString(),
    stripe_invoice_id: invoice.id, stripe_subscription_id: subscriptionId,
    stripe_payment_intent_id: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id || null,
    stripe_customer_id: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || null,
    description: 'Membership renewal',
  }]);
  if (payError) {
    if (payError.code === '23505') return;
    throw payError;
  }
  const periodEnd = invoice.lines?.data?.[0]?.period?.end;
  const history = [...(m.payment_history || []), {
    date: new Date().toISOString(), amount, type: 'renewal', status: 'completed', transactionId: invoice.id, paidVia: 'stripe',
  }];
  await supabase
    .from('memberships')
    .update({ status: 'active', submission_count: 0, end_date: unix(periodEnd) || m.end_date, payment_history: history, updated_at: new Date() })
    .eq('id', m.id);
};

// invoice.payment_failed: tell the member; Stripe retries the card automatically.
const onInvoiceFailed = async (invoiceId) => {
  const invoice = await stripe.getStripe().invoices.retrieve(invoiceId);
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) return;
  const m = await membershipForSubscription(subscriptionId);
  if (!m || (m.payment_history || []).some((p) => p.transactionId === invoice.id && p.status === 'failed')) return;
  const history = [...(m.payment_history || []), {
    date: new Date().toISOString(), amount: stripe.dollars(invoice.amount_due), type: 'renewal', status: 'failed', transactionId: invoice.id, paidVia: 'stripe',
  }];
  await supabase.from('memberships').update({ payment_history: history, updated_at: new Date() }).eq('id', m.id);
  const name = await planNameFor(m.tier);
  await notifyMember({
    userId: m.user_id,
    subject: `Payment for your ${name} membership failed`,
    body: `We couldn't charge your card for your ${name} membership. Please update your card on the Membership page → Manage billing. We'll try the card again over the next few days.`,
  });
};

// customer.subscription.updated / deleted: renew on/off, new period end, or the plan ended.
const onSubscriptionChange = async (subscriptionId, deleted = false) => {
  const m = await membershipForSubscription(subscriptionId);
  if (!m) return;
  let sub = null;
  try {
    sub = await stripe.getStripe().subscriptions.retrieve(subscriptionId);
  } catch (e) {
    if (e.code !== 'resource_missing') throw e;
  }
  const ended = deleted || !sub || ['canceled', 'incomplete_expired'].includes(sub.status);
  if (ended) {
    if (m.status !== 'active') return;
    const over = m.end_date && new Date(m.end_date) <= new Date();
    await supabase
      .from('memberships')
      .update({ status: over ? 'expired' : 'cancelled', auto_renew: false, cancellation_date: new Date(), cancellation_reason: 'Subscription ended in Stripe', updated_at: new Date() })
      .eq('id', m.id);
    return;
  }
  await supabase
    .from('memberships')
    .update({ auto_renew: !sub.cancel_at_period_end, end_date: unix(sub.current_period_end) || m.end_date, updated_at: new Date() })
    .eq('id', m.id);
};

module.exports = {
  paymentHooks,
  onInvoicePaid,
  onInvoiceFailed,
  onSubscriptionChange,
  tierConfigFor,
  endDateFor,
  requestMembership,
  activateMembership,
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
