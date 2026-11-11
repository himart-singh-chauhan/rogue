const supabase = require('../config/supabase');
const { evaluateCoupon } = require('./couponController');
const rewards = require('../utils/rewards');

// @desc    Get all products
// @route   GET /api/shop
// @access  Public
const getProducts = async (req, res) => {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }
  res.json(products);
};

// @desc    Get single product
// @route   GET /api/shop/:id
// @access  Public
const getProductById = async (req, res) => {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (product) {
    res.json(product);
  } else {
    return res.status(404).json({ message: 'Product not found' });
  }
};

// @desc    Checkout cart and create order
// @route   POST /api/shop/checkout
// @access  Public (guest checkout allowed; a logged-in user is linked via optionalAuth)
// NOTE: no payment gateway is connected yet. Prices are now taken from the database and
// totals recomputed server-side, but "paid" must come from a Razorpay/Stripe webhook before launch.
const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
const money = (n) => Math.round((Number(n) || 0) * 100) / 100;

const checkout = async (req, res) => {
  // Any "discount" sent by the browser is ignored: the discount is worked out here from the coupon.
  const { customerName, customerEmail, shippingAddress, items, couponCode } = req.body;

  if (!customerName || !customerEmail || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Customer details and cart items are required' });
  }

  try {
    // 1. Validate items and price them from the database
    const productIds = [...new Set(items.map((i) => i.id).filter(isUUID))];
    let productsById = {};
    if (productIds.length) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, category, stock_count, sizes, requires_authorization')
        .in('id', productIds);
      if (productsError) throw productsError;
      productsById = Object.fromEntries((products || []).map((p) => [p.id, p]));
    }

    // Products that need an admin's approval per competitor (e.g. championship belts)
    const restricted = Object.values(productsById).filter((p) => p.requires_authorization);
    const approvals = {};
    if (restricted.length) {
      if (!req.user) {
        return res.status(401).json({ message: `Please log in to purchase ${restricted[0].name}. It requires approval for your account.` });
      }
      const { data: auths } = await supabase
        .from('product_authorizations')
        .select('id, product_id, status')
        .eq('user_id', req.user.id)
        .in('product_id', restricted.map((p) => p.id));
      (auths || []).forEach((a) => { approvals[a.product_id] = a; });
      const notApproved = restricted.find((p) => !approvals[p.id] || approvals[p.id].status !== 'approved');
      if (notApproved) {
        return res.status(403).json({ message: `${notApproved.name} can only be purchased after an administrator approves it for your account.` });
      }
      // One approval = one item, bought once.
      const tooMany = restricted.find((p) => items.filter((i) => i.id === p.id).reduce((n, i) => n + (parseInt(i.qty ?? i.quantity, 10) || 0), 0) > 1);
      if (tooMany) return res.status(400).json({ message: `Your approval covers one ${tooMany.name}. Please set the quantity to 1.` });
    }

    // Event tickets: priced from the event itself, issued to the logged-in buyer
    const eventIds = [...new Set(items.filter((i) => i.type === 'ticket' && isUUID(i.eventId)).map((i) => i.eventId))];
    let eventsById = {};
    if (eventIds.length) {
      if (!req.user) return res.status(401).json({ message: 'Please log in to buy event tickets. Tickets are linked to your account.' });
      const { data: evs, error: evError } = await supabase.from('events').select('id, title, ticket_price, is_paid, date, status').in('id', eventIds);
      if (evError) throw evError;
      eventsById = Object.fromEntries((evs || []).map((e) => [e.id, e]));
    }

    const lines = [];
    for (const item of items) {
      const qty = parseInt(item.qty ?? item.quantity, 10);
      if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
        return res.status(400).json({ message: 'Each item quantity must be between 1 and 100' });
      }
      if (item.type === 'ticket') {
        const ev = eventsById[item.eventId];
        if (!ev) return res.status(400).json({ message: 'This event is no longer available.' });
        if (['completed', 'cancelled', 'past'].includes(String(ev.status || '').toLowerCase())) {
          return res.status(400).json({ message: `Tickets for ${ev.title} are no longer on sale.` });
        }
        lines.push({ item, product: null, event: ev, qty, unitPrice: money(ev.ticket_price) });
        continue;
      }
      const product = isUUID(item.id) ? productsById[item.id] : null;
      if (isUUID(item.id) && !product) {
        return res.status(400).json({ message: `Product no longer available: ${item.title || item.name || item.id}` });
      }
      // Catalogue price, or the price set for the chosen size. Non-catalogue lines keep their client price (legacy passes only).
      const sizeRow = product && item.size && Array.isArray(product.sizes)
        ? product.sizes.find((sz) => String(sz.size || '').toLowerCase() === String(item.size).toLowerCase())
        : null;
      const sizePrice = sizeRow && Number(sizeRow.price) > 0 ? Number(sizeRow.price) : null;
      const unitPrice = product ? money(sizePrice ?? product.price) : money(Math.max(0, parseFloat(item.price) || 0));
      lines.push({ item, product, qty, unitPrice });
    }

    const subtotal = money(lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0));
    const buyerEmail = String(customerEmail).trim().toLowerCase();
    const code = couponCode ? String(couponCode).trim().toUpperCase() : null;

    // Coupon: run the same checks as /coupons/validate (expiry, minimum, tier, country, what it applies to)
    // on the server-side prices, and use the discount it calculates.
    let discountAmount = 0;
    if (code) {
      const productLines = lines.filter((l) => l.product);
      const ticketLines = lines.filter((l) => l.event);
      const onlyTickets = ticketLines.length > 0 && productLines.length === 0;
      const verdict = await evaluateCoupon({
        code,
        subtotal,
        items: lines.map((l) => ({ id: l.product ? l.product.id : l.event?.id, price: l.unitPrice, qty: l.qty, category: l.product?.category })),
        checkoutType: onlyTickets ? 'ticket' : 'shop',
        targetId: onlyTickets && ticketLines.length === 1 ? ticketLines[0].event.id : undefined,
        customerEmail: buyerEmail,
      }, req.user);
      if (!verdict.data?.valid) {
        return res.status(verdict.status >= 400 ? verdict.status : 400).json({ message: verdict.data?.message || 'Coupon could not be applied.' });
      }
      discountAmount = money(Math.min(Math.max(verdict.data.discountAmount || 0, 0), subtotal));
    }

    // Rewards level discount (Bronze 5% … Ambassador 40%) for logged-in members, on eligible items.
    // Without coupon stacking (the default) the member gets whichever discount is bigger.
    let rewardDiscount = 0;
    let rewardLevel = null;
    let rewardNote = null;
    if (req.user) {
      const quoteLines = lines.map((l) => ({ productId: l.product?.id || null, category: l.product?.category || (l.event ? 'Tickets' : ''), isTicket: !!l.event, unitPrice: l.unitPrice, qty: l.qty }));
      const rq = await rewards.quoteDiscount(req.user.id, quoteLines);
      if (rq.amount > 0) {
        if (rq.settings.allowCouponStacking || discountAmount === 0) {
          rewardDiscount = money(Math.min(rq.amount, subtotal - discountAmount));
        } else if (rq.amount > discountAmount) {
          rewardDiscount = rq.amount;
          rewardNote = `Your ${rq.level} discount is bigger than the coupon, so it was used instead.`;
          discountAmount = 0; // coupon not used (and not counted)
        } else {
          rewardNote = `The coupon is bigger than your ${rq.level} discount, so the coupon was used.`;
        }
        if (rewardDiscount > 0) rewardLevel = rq.level;
      }
    }
    const total = money(subtotal - discountAmount - rewardDiscount);

    // Claim belt approvals first, so two checkouts at the same moment can't both use one approval.
    const pendingAuths = Object.values(approvals).filter((a) => a.status === 'approved');
    const claimed = [];
    const releaseClaims = async () => {
      if (claimed.length) await supabase.from('product_authorizations').update({ status: 'approved', order_id: null }).in('id', claimed);
    };
    for (const a of pendingAuths) {
      const { data: got } = await supabase
        .from('product_authorizations')
        .update({ status: 'fulfilled', updated_at: new Date() })
        .eq('id', a.id)
        .eq('status', 'approved')
        .select('id');
      if (!got || !got.length) {
        await releaseClaims();
        return res.status(409).json({ message: 'This approval has already been used for another order.' });
      }
      claimed.push(a.id);
    }

    // 2. Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: req.user?.id || null,
        customer_name: customerName,
        customer_email: buyerEmail,
        shipping_address: shippingAddress || 'Digital Delivery',
        subtotal,
        discount: discountAmount,
        discount_amount: discountAmount,
        coupon_code: discountAmount > 0 ? code : null,
        reward_discount: rewardDiscount,
        reward_level: rewardLevel,
        total,
        shipping_status: 'pending',
        payment_status: 'paid',
      }])
      .select()
      .single();

    if (orderError) { await releaseClaims(); throw orderError; }

    // 3. Order items (inserted before stock changes so a failure can't leave stock deducted)
    const { error: itemsError } = await supabase.from('order_items').insert(
      lines.map(({ item, product, event, qty, unitPrice }) => ({
        order_id: order.id,
        product_id: product ? product.id : null,
        product_name: product ? product.name : event ? `Ticket: ${event.title}` : (item.title || item.name || 'Item'),
        price: unitPrice,
        quantity: qty,
        size: item.size || null,
        color: item.color || null,
        // what the buyer typed in the product's comment box (e.g. the details for their certificate)
        notes: item.notes ? String(item.notes).trim().slice(0, 2000) || null : null,
      }))
    );
    const undoOrder = async () => {
      await supabase.from('order_items').delete().eq('order_id', order.id);
      await supabase.from('orders').delete().eq('id', order.id);
      await releaseClaims();
    };
    if (itemsError) { await undoOrder(); throw itemsError; }

    // Use up the coupon only now that the order exists. The database function enforces the total
    // and per-account limits atomically, so a race between two buyers can't exceed them.
    if (code && discountAmount > 0) {
      const { data: result, error: redeemError } = await supabase.rpc('redeem_coupon_v2', {
        p_code: code,
        p_user: req.user?.id || null,
        p_email: buyerEmail,
        p_context: 'shop',
        p_reference: String(order.id),
        p_discount: discountAmount,
      });
      if (redeemError || result !== 'ok') {
        await undoOrder();
        if (redeemError) throw redeemError;
        const reasons = {
          not_found: 'That coupon code is not valid.',
          inactive: 'That coupon is no longer active.',
          limit_total: 'That coupon has reached its maximum number of uses.',
          limit_user: 'You have already used this coupon the maximum number of times.',
        };
        return res.status(400).json({ message: reasons[result] || 'Coupon could not be applied.' });
      }
    }

    // 4. Issue event tickets to the buyer
    const crypto = require('crypto');
    const ticketRows = [];
    for (const l of lines) {
      if (!l.event) continue;
      for (let i = 0; i < l.qty; i++) {
        ticketRows.push({
          user_id: req.user.id,
          event_id: l.event.id,
          access_code: `TKT-${crypto.randomBytes(12).toString('hex').toUpperCase()}`,
          status: 'active',
          ticket_type: 'spectator',
          expires_at: l.event.date ? new Date(new Date(l.event.date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        });
      }
    }
    if (ticketRows.length) {
      const { error: ticketError } = await supabase.from('tickets').insert(ticketRows);
      if (ticketError) console.error('Ticket issue failed for order', order.id, ticketError.message);
    }

    // Approvals claimed above are now linked to this order
    if (claimed.length) {
      await supabase.from('product_authorizations').update({ order_id: order.id, updated_at: new Date() }).in('id', claimed);
    }

    // 5. Stock levels
    for (const { item, product, qty } of lines) {
      if (!product) continue;
      const sizes = Array.isArray(product.sizes)
        ? product.sizes.map((sz) =>
            item.size && String(sz.size).toLowerCase() === String(item.size).toLowerCase()
              ? { ...sz, stock: Math.max(0, (sz.stock ?? sz.stockCount ?? 0) - qty) }
              : sz
          )
        : product.sizes;
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock_count: Math.max(0, (product.stock_count || 0) - qty), sizes, updated_at: new Date() })
        .eq('id', product.id);
      if (stockError) console.error(`Stock update failed for ${product.id}:`, stockError.message);
    }

    // Purchase reward points (the order is marked paid above; with Stripe this moves to the payment webhook)
    await rewards.syncOrderRewards(order.id);

    res.status(201).json({
      message: 'Order placed successfully!',
      orderId: order.id,
      order,
      breakdown: { subtotal, couponDiscount: discountAmount, rewardDiscount, rewardLevel, total, note: rewardNote },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Checkout failed. Please try again.' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  checkout,
};

