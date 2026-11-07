const supabase = require('../config/supabase');

// Helper to generate a random coupon code
const generateRandomCouponCode = (prefix = 'ROGUE', length = 5) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < length; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${randomPart}`;
};

// @desc    Validate coupon code against constraints
// @route   POST /api/coupons/validate
// @access  Public
const validateCoupon = async (req, res) => {
  const { code, subtotal, items = [], checkoutType, targetId, userId, country } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, message: 'Coupon code is required' });
  }

  try {
    // Fetch coupon from DB
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single();

    if (error || !coupon) {
      return res.status(404).json({ valid: false, message: 'Invalid coupon code' });
    }

    // 1. Check if active
    if (!coupon.active) {
      return res.status(400).json({ valid: false, message: 'This coupon has been deactivated' });
    }

    // 2. Check expiration date
    if (coupon.expiration_date) {
      // A coupon stays valid through the END of its expiration day (date-only values mean midnight UTC).
      const expirationDate = new Date(coupon.expiration_date);
      expirationDate.setUTCHours(23, 59, 59, 999);
      const now = new Date();
      if (expirationDate < now) {
        return res.status(400).json({ valid: false, message: 'This coupon has expired' });
      }
    }

    // 3. Check redemptions count
    if (coupon.max_redemptions !== null && coupon.max_redemptions !== undefined) {
      if ((coupon.redemptions_count || 0) >= coupon.max_redemptions) {
        return res.status(400).json({ valid: false, message: 'This coupon has reached its maximum redemption limit' });
      }
    }

    // 4. Check minimum purchase amount
    const parsedSubtotal = parseFloat(subtotal) || 0;
    if (coupon.min_purchase && parsedSubtotal < parseFloat(coupon.min_purchase)) {
      return res.status(400).json({
        valid: false,
        message: `Minimum purchase of $${parseFloat(coupon.min_purchase).toFixed(2)} required for this coupon`
      });
    }

    // 5. Check restricted country
    if (coupon.restricted_country && country) {
      if (coupon.restricted_country.trim().toLowerCase() !== country.trim().toLowerCase()) {
        return res.status(400).json({
          valid: false,
          message: `This coupon is not valid in your country`
        });
      }
    }

    // 6. Check restricted membership tier
    if (coupon.restricted_membership_tier) {
      let userTier = 'free';
      if (userId) {
        // Fetch user's membership tier from DB
        const { data: membership } = await supabase
          .from('memberships')
          .select('tier')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        if (membership) {
          userTier = membership.tier;
        } else {
          // Check user role/type if memberships table doesn't have it
          const { data: user } = await supabase
            .from('users')
            .select('membership_type')
            .eq('id', userId)
            .single();
          if (user && user.membership_type) {
            userTier = user.membership_type.replace('_athlete', '');
          }
        }
      }

      const tiersOrder = ['free', 'bronze', 'silver', 'gold'];
      const requiredIndex = tiersOrder.indexOf(coupon.restricted_membership_tier.toLowerCase());
      const userIndex = tiersOrder.indexOf(userTier.toLowerCase());

      if (userIndex < requiredIndex) {
        return res.status(400).json({
          valid: false,
          message: `This coupon is restricted to users with ${coupon.restricted_membership_tier.toUpperCase()} tier or higher`
        });
      }
    }

    // 7. Check specific item constraints (applies_to & target_id)
    // Applies to types: all, product, category, membership, ticket
    let finalDiscount = 0;

    if (coupon.applies_to === 'all') {
      // Applies to total subtotal
      if (coupon.discount_type === 'percentage') {
        finalDiscount = parsedSubtotal * (parseFloat(coupon.discount_value) / 100);
      } else {
        finalDiscount = parseFloat(coupon.discount_value);
      }
    } else if (coupon.applies_to === 'product') {
      // CheckoutType is 'shop' and must find the product in items
      if (checkoutType !== 'shop') {
        return res.status(400).json({ valid: false, message: 'This coupon is only valid for shop items' });
      }

      // Check if target_id matches one of the items product IDs
      const matchingItem = items.find(item => String(item.id) === String(coupon.target_id));
      if (!matchingItem) {
        return res.status(400).json({
          valid: false,
          message: 'This coupon is only valid for a specific product not currently in your cart'
        });
      }

      const itemTotal = parseFloat(matchingItem.price) * (parseInt(matchingItem.qty) || 1);
      if (coupon.discount_type === 'percentage') {
        finalDiscount = itemTotal * (parseFloat(coupon.discount_value) / 100);
      } else {
        // For fixed discount on product, apply it up to the total of the matching product
        finalDiscount = Math.min(parseFloat(coupon.discount_value), itemTotal);
      }
    } else if (coupon.applies_to === 'category') {
      // CheckoutType is 'shop' and must find an item matching the category
      if (checkoutType !== 'shop') {
        return res.status(400).json({ valid: false, message: 'This coupon is only valid for shop items' });
      }

      // To check categories, we might need category information.
      // If we don't have it on items directly, let's look up matching items' categories in products table
      let hasMatchingCategory = false;
      let categoryItemsTotal = 0;

      for (const item of items) {
        if (item.category && item.category.toLowerCase() === String(coupon.target_id || '').toLowerCase()) {
          hasMatchingCategory = true;
          categoryItemsTotal += parseFloat(item.price) * (parseInt(item.qty) || 1);
        } else if (item.id) {
          // Look up product to check category
          const { data: prod } = await supabase
            .from('products')
            .select('category')
            .eq('id', item.id)
            .single();

          if (prod && prod.category && prod.category.toLowerCase() === String(coupon.target_id || '').toLowerCase()) {
            hasMatchingCategory = true;
            categoryItemsTotal += parseFloat(item.price) * (parseInt(item.qty) || 1);
          }
        }
      }

      if (!hasMatchingCategory) {
        return res.status(400).json({
          valid: false,
          message: `This coupon is only valid for items in the category: ${coupon.target_id}`
        });
      }

      if (coupon.discount_type === 'percentage') {
        finalDiscount = categoryItemsTotal * (parseFloat(coupon.discount_value) / 100);
      } else {
        finalDiscount = Math.min(parseFloat(coupon.discount_value), categoryItemsTotal);
      }
    } else if (coupon.applies_to === 'membership') {
      if (checkoutType !== 'membership') {
        return res.status(400).json({ valid: false, message: 'This coupon is only valid for elite membership purchases' });
      }

      if (coupon.target_id && targetId && coupon.target_id.toLowerCase() !== targetId.toLowerCase()) {
        return res.status(400).json({
          valid: false,
          message: `This coupon is only valid for the ${coupon.target_id.toUpperCase()} membership tier`
        });
      }

      if (coupon.discount_type === 'percentage') {
        finalDiscount = parsedSubtotal * (parseFloat(coupon.discount_value) / 100);
      } else {
        finalDiscount = parseFloat(coupon.discount_value);
      }
    } else if (coupon.applies_to === 'ticket') {
      if (checkoutType !== 'ticket') {
        return res.status(400).json({ valid: false, message: 'This coupon is only valid for event ticket purchases' });
      }

      if (coupon.target_id && targetId && coupon.target_id !== targetId) {
        return res.status(400).json({
          valid: false,
          message: 'This coupon is only valid for a specific event ticket'
        });
      }

      if (coupon.discount_type === 'percentage') {
        finalDiscount = parsedSubtotal * (parseFloat(coupon.discount_value) / 100);
      } else {
        finalDiscount = parseFloat(coupon.discount_value);
      }
    }

    // Limit discount to not exceed subtotal
    finalDiscount = Math.min(finalDiscount, parsedSubtotal);
    finalDiscount = parseFloat(finalDiscount.toFixed(2));

    return res.json({
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: parseFloat(coupon.discount_value),
      discountAmount: finalDiscount,
      appliesTo: coupon.applies_to,
      targetId: coupon.target_id
    });

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ valid: false, message: 'Server error during coupon validation' });
  }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private (Admin)
const getAllCouponsByAdmin = async (req, res) => {
  try {
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(coupons || []);
  } catch (error) {
    console.error('Fetch coupons error:', error);
    res.status(500).json({ message: error.message || 'Server error fetching coupons' });
  }
};

// @desc    Create new coupon (Admin)
// @route   POST /api/coupons
// @access  Private (Admin)
const createCouponByAdmin = async (req, res) => {
  const {
    code,
    discountType,
    discountValue,
    active,
    expirationDate,
    appliesTo,
    targetId,
    minPurchase,
    maxRedemptions,
    restrictedMembershipTier,
    restrictedCountry,
    autoGenerate
  } = req.body;

  if (!discountType || !discountValue) {
    return res.status(400).json({ message: 'Discount type and value are required' });
  }

  let finalCode = code;
  if (autoGenerate) {
    finalCode = generateRandomCouponCode();
  } else if (!finalCode) {
    return res.status(400).json({ message: 'Coupon code is required if not auto-generating' });
  }

  finalCode = finalCode.trim().toUpperCase();

  try {
    // Check if code already exists
    const { data: existing } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', finalCode)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ message: `Coupon with code ${finalCode} already exists` });
    }

    const { data: newCoupon, error } = await supabase
      .from('coupons')
      .insert([
        {
          code: finalCode,
          discount_type: discountType,
          discount_value: parseFloat(discountValue),
          active: active !== undefined ? active : true,
          expiration_date: expirationDate || null,
          applies_to: appliesTo || 'all',
          target_id: targetId || null,
          min_purchase: parseFloat(minPurchase) || 0.00,
          max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
          redemptions_count: 0,
          restricted_membership_tier: restrictedMembershipTier || null,
          restricted_country: restrictedCountry || null
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Coupon created successfully', coupon: newCoupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ message: error.message || 'Server error creating coupon' });
  }
};

// @desc    Update coupon (Admin)
// @route   PUT /api/coupons/:id
// @access  Private (Admin)
const updateCouponByAdmin = async (req, res) => {
  const { id } = req.params;
  const {
    code,
    discountType,
    discountValue,
    active,
    expirationDate,
    appliesTo,
    targetId,
    minPurchase,
    maxRedemptions,
    restrictedMembershipTier,
    restrictedCountry
  } = req.body;

  try {
    const updateData = {};
    if (code) updateData.code = code.trim().toUpperCase();
    if (discountType) updateData.discount_type = discountType;
    if (discountValue !== undefined) updateData.discount_value = parseFloat(discountValue);
    if (active !== undefined) updateData.active = active;
    if (expirationDate !== undefined) updateData.expiration_date = expirationDate || null;
    if (appliesTo) updateData.applies_to = appliesTo;
    if (targetId !== undefined) updateData.target_id = targetId || null;
    if (minPurchase !== undefined) updateData.min_purchase = parseFloat(minPurchase) || 0.00;
    if (maxRedemptions !== undefined) updateData.max_redemptions = maxRedemptions ? parseInt(maxRedemptions) : null;
    if (restrictedMembershipTier !== undefined) updateData.restricted_membership_tier = restrictedMembershipTier || null;
    if (restrictedCountry !== undefined) updateData.restricted_country = restrictedCountry || null;
    updateData.updated_at = new Date();

    const { data: updatedCoupon, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Coupon updated successfully', coupon: updatedCoupon });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ message: error.message || 'Server error updating coupon' });
  }
};

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
// @access  Private (Admin)
const deleteCouponByAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: error.message || 'Server error deleting coupon' });
  }
};

// @desc    Get Coupon usage statistics (Admin)
// @route   GET /api/coupons/stats
// @access  Private (Admin)
const getCouponStatsByAdmin = async (req, res) => {
  try {
    // 1. Fetch all coupons
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('*');

    if (couponsError) throw couponsError;

    // 2. Count Active & Expired
    let activeCount = 0;
    let expiredCount = 0;
    const now = new Date();

    coupons.forEach(coupon => {
      if (!coupon.active) {
        expiredCount++; // count deactivated as expired/inactive
      } else if (coupon.expiration_date && new Date(new Date(coupon.expiration_date).setUTCHours(23, 59, 59, 999)) < now) {
        expiredCount++;
      } else {
        activeCount++;
      }
    });

    // 3. Most used coupons
    const mostUsed = [...coupons]
      .filter(c => c.redemptions_count > 0)
      .sort((a, b) => b.redemptions_count - a.redemptions_count)
      .slice(0, 5);

    // 4. Total discount amount (Revenue Impact) from Orders Table
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('discount_amount')
      .not('coupon_code', 'is', null);

    if (ordersError) throw ordersError;

    const totalDiscountImpact = orders.reduce((sum, order) => sum + (parseFloat(order.discount_amount) || 0), 0);

    res.json({
      totalCoupons: coupons.length,
      activeCoupons: activeCount,
      expiredCoupons: expiredCount,
      totalDiscountImpact: parseFloat(totalDiscountImpact.toFixed(2)),
      mostUsed
    });
  } catch (error) {
    console.error('Fetch coupon stats error:', error);
    res.status(500).json({ message: error.message || 'Server error fetching coupon stats' });
  }
};

module.exports = {
  validateCoupon,
  getAllCouponsByAdmin,
  createCouponByAdmin,
  updateCouponByAdmin,
  deleteCouponByAdmin,
  getCouponStatsByAdmin
};
