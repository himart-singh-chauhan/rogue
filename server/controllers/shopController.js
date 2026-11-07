const supabase = require('../config/supabase');

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
  const { customerName, customerEmail, shippingAddress, items, discount, couponCode } = req.body;

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
        .select('id, name, price, stock_count, sizes')
        .in('id', productIds);
      if (productsError) throw productsError;
      productsById = Object.fromEntries((products || []).map((p) => [p.id, p]));
    }

    const lines = [];
    for (const item of items) {
      const qty = parseInt(item.qty ?? item.quantity, 10);
      if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
        return res.status(400).json({ message: 'Each item quantity must be between 1 and 100' });
      }
      const product = isUUID(item.id) ? productsById[item.id] : null;
      if (isUUID(item.id) && !product) {
        return res.status(400).json({ message: `Product no longer available: ${item.title || item.name || item.id}` });
      }
      // Non-catalogue lines (e.g. spectator passes) keep their client price for now.
      const unitPrice = product ? money(product.price) : money(Math.max(0, parseFloat(item.price) || 0));
      lines.push({ item, product, qty, unitPrice });
    }

    const subtotal = money(lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0));
    const discountAmount = money(Math.min(Math.max(parseFloat(discount) || 0, 0), subtotal));
    const total = money(subtotal - discountAmount);

    // 2. Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: req.user?.id || null,
        customer_name: customerName,
        customer_email: String(customerEmail).trim().toLowerCase(),
        shipping_address: shippingAddress || 'Digital Delivery',
        subtotal,
        discount: discountAmount,
        discount_amount: discountAmount,
        coupon_code: couponCode ? String(couponCode).trim().toUpperCase() : null,
        total,
        shipping_status: 'pending',
        payment_status: 'paid',
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 3. Order items (inserted before stock changes so a failure can't leave stock deducted)
    const { error: itemsError } = await supabase.from('order_items').insert(
      lines.map(({ item, product, qty, unitPrice }) => ({
        order_id: order.id,
        product_id: product ? product.id : null,
        product_name: product ? product.name : (item.title || item.name || 'Item'),
        price: unitPrice,
        quantity: qty,
        size: item.size || null,
        color: item.color || null,
      }))
    );
    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    // 4. Coupon redemption (atomic SQL function; respects max_redemptions)
    if (couponCode) {
      const { error: redeemError } = await supabase.rpc('redeem_coupon', { p_code: String(couponCode).trim().toUpperCase() });
      if (redeemError) console.error('Coupon redemption increment failed:', redeemError.message);
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

    res.status(201).json({
      message: 'Order placed successfully!',
      orderId: order.id,
      order,
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

