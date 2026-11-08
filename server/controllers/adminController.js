const supabase = require('../config/supabase');
const { awardPoints, pointsForVerifiedRecord } = require('../utils/rankings');
const { thumbnailFor } = require('../utils/youtubeIntegration');

// ==========================================
// 👥 USERS MANAGEMENT
// ==========================================

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, is_admin, role, account_status, membership_type, profile_image, username, phone, gender, dob, weight, weight_unit, height, height_unit, country, city, street_address, state, zip_code, created_at, member_number')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a user's details / role
const updateUserByAdmin = async (req, res) => {
  const { name, email, is_admin, role, admin_notes, username, phone, gender, dob, weight, weight_unit, height, height_unit, country, city } = req.body;
  try {
    // Fetch current user details to preserve values if not explicitly provided
    const { data: currentUser } = await supabase
      .from('users')
      .select('is_admin, role, account_status, membership_type')
      .eq('id', req.params.id)
      .single();

    const finalRole = role !== undefined ? role : (currentUser?.role || 'athlete');
    const finalIsAdmin = role !== undefined ? (role === 'system_admin') : (is_admin !== undefined ? !!is_admin : !!currentUser?.is_admin);
    const finalAccountStatus = req.body.account_status !== undefined ? req.body.account_status : (currentUser?.account_status || 'active');
    const finalMembershipType = req.body.membership_type !== undefined ? req.body.membership_type : (currentUser?.membership_type || 'free_athlete');

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        name,
        email,
        is_admin: finalIsAdmin,
        role: finalRole,
        account_status: finalAccountStatus,
        membership_type: finalMembershipType,
        admin_notes,
        username: username === undefined ? undefined : (String(username).trim() || null),
        phone,
        gender,
        dob: dob === undefined ? undefined : (dob || null),
        weight,
        weight_unit,
        height,
        height_unit,
        country,
        city,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select('id, name, email, is_admin, role, account_status, admin_notes, username, phone, gender, dob, weight, height, country, city, member_number')
      .single();

    if (error) throw error;
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUserByAdmin = async (req, res) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'User profile purged successfully.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// ⚔️ RECORDS CRUD
// ==========================================

// @desc    Create a record attempt manually
// @route   POST /api/admin/records
// @access  Private/Admin
const createRecordByAdmin = async (req, res) => {
  const {
    userId, title, category, description, value, unit,
    status, evidenceUrl, venueName, city, recordType, thumbnailUrl
  } = req.body;

  try {
    const { data: createdRecord, error } = await supabase
      .from('records')
      .insert([
        {
          user_id: userId || null,
          title,
          category,
          description,
          value,
          unit,
          status: status || 'pending',
          evidence_url: evidenceUrl || '',
          thumbnail_url: thumbnailFor(evidenceUrl, thumbnailUrl),
          venue_name: venueName,
          city: city,
          record_type: recordType || 'standard'
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(createdRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a record details
// @route   PUT /api/admin/records/:id
// @access  Private/Admin
const updateRecordByAdmin = async (req, res) => {
  const { title, category, description, value, unit, status, evidenceUrl, venueName, city, recordType, thumbnailUrl } = req.body;
  try {
    // Keep the existing thumbnail unless a new one was uploaded; YouTube links get YouTube's frame.
    let thumbnail;
    if (thumbnailUrl) thumbnail = thumbnailUrl;
    else if (evidenceUrl !== undefined) {
      const { data: current } = await supabase.from('records').select('thumbnail_url').eq('id', req.params.id).maybeSingle();
      thumbnail = current?.thumbnail_url || thumbnailFor(evidenceUrl, null) || undefined;
    }
    const { data: updatedRecord, error } = await supabase
      .from('records')
      .update({
        title,
        category,
        description,
        value,
        unit,
        status,
        evidence_url: evidenceUrl,
        thumbnail_url: thumbnail,
        venue_name: venueName,
        city: city,
        record_type: recordType,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a record attempt
// @route   DELETE /api/admin/records/:id
// @access  Private/Admin
const deleteRecordByAdmin = async (req, res) => {
  try {
    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Record attempt purged successfully.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// 📅 EVENTS CRUD
// ==========================================

// @desc    Get all events (admin feed)
// @route   GET /api/admin/events
// @access  Private/Admin
const getAllEventsByAdmin = async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new live sporting event
// @route   POST /api/admin/events
// @access  Private/Admin
const priceOrZero = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const createEventByAdmin = async (req, res) => {
  const { title, description, date, location, imageUrl, videoUrl, ticketLink, sponsors, rules, status, category, isPaid, ticketPrice, streamUrl, isLive, isFeatured } = req.body;
  try {
    const { data: createdEvent, error } = await supabase
      .from('events')
      .insert([
        {
          title,
          description,
          date,
          location,
          image_url: imageUrl,
          video_url: videoUrl || '',
          ticket_link: ticketLink || '',
          sponsors: sponsors || '',
          rules: rules || '',
          status: status || 'upcoming',
          category: category || 'WORLD RECORD',
          is_paid: !!isPaid,
          ticket_price: isPaid ? priceOrZero(ticketPrice) : 0,
          stream_url: streamUrl || null,
          is_live: !!isLive,
          is_featured: !!isFeatured
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a sporting event
// @route   PUT /api/admin/events/:id
// @access  Private/Admin
const updateEventByAdmin = async (req, res) => {
  const { title, description, date, location, imageUrl, videoUrl, ticketLink, sponsors, rules, status, category, isPaid, ticketPrice, streamUrl, isLive, isFeatured } = req.body;
  try {
    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update({
        title,
        description,
        date,
        location,
        image_url: imageUrl,
        video_url: videoUrl,
        ticket_link: ticketLink,
        sponsors: sponsors,
        rules: rules,
        status: status,
        category: category,
        is_paid: isPaid === undefined ? undefined : !!isPaid,
        ticket_price: ticketPrice === undefined ? undefined : priceOrZero(ticketPrice),
        stream_url: streamUrl,
        is_live: isLive === undefined ? undefined : !!isLive,
        is_featured: isFeatured === undefined ? undefined : !!isFeatured,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a sporting event
// @route   DELETE /api/admin/events/:id
// @access  Private/Admin
const deleteEventByAdmin = async (req, res) => {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Sporting event deleted successfully.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// 🛍️ PRODUCTS CRUD
// ==========================================

// @desc    Get all products (admin catalog)
// @route   GET /api/admin/products
// @access  Private/Admin
const getAllProductsByAdmin = async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a shop product
// @route   POST /api/admin/products
// @access  Private/Admin
const createProductByAdmin = async (req, res) => {
  const { name, description, price, imageUrl, category, stockCount, sizes, imageUrls } = req.body;
  try {
    const { data: createdProduct, error } = await supabase
      .from('products')
      .insert([
        {
          name,
          description,
          price: parseFloat(price) || 0.00,
          image_url: imageUrl,
          category,
          stock_count: parseInt(stockCount) || 0,
          sizes: sizes || [],
          image_urls: imageUrls || []
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a shop product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProductByAdmin = async (req, res) => {
  const { name, description, price, imageUrl, category, stockCount, sizes, imageUrls } = req.body;
  try {
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({
        name,
        description,
        price: parseFloat(price) || 0.00,
        image_url: imageUrl,
        category,
        stock_count: parseInt(stockCount) || 0,
        sizes: sizes || [],
        image_urls: imageUrls || [],
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a shop product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProductByAdmin = async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Shop product deleted successfully.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// ✉️ CONTACT MESSAGES
// ==========================================

// @desc    Get all inquiries
// @route   GET /api/admin/contacts
// @access  Private/Admin
const getAllInquiries = async (req, res) => {
  try {
    const { data: messages, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete support inquiry
// @route   DELETE /api/admin/contacts/:id
// @access  Private/Admin
const deleteInquiry = async (req, res) => {
  try {
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Support ticket cleared successfully.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// 🛍️ ORDERS MANAGEMENT
// ==========================================

// @desc    Get all shop orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrdersByAdmin = async (req, res) => {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) console.error('Ledger: orders source failed:', ordersError.message);

    const ordersWithItems = [];
    for (const order of (orders || [])) {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      ordersWithItems.push({
        ...order,
        items: items || []
      });
    }

    res.json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order shipping/payment status
// @route   PUT /api/admin/orders/:id/shipping
// @access  Private/Admin
const updateOrderShippingStatusByAdmin = async (req, res) => {
  const { shippingStatus, paymentStatus } = req.body;
  try {
    const updateData = { updated_at: new Date() };
    if (shippingStatus) updateData.shipping_status = shippingStatus;
    if (paymentStatus) updateData.payment_status = paymentStatus;

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete shop order
// @route   DELETE /api/admin/orders/:id
// @access  Private/Admin
const deleteOrderByAdmin = async (req, res) => {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Shop order purged successfully.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get purchase history of a customer
// @route   GET /api/admin/orders/customer/:email
// @access  Private/Admin
const getCustomerPurchaseHistoryByAdmin = async (req, res) => {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', req.params.email)
      .order('created_at', { ascending: false });

    if (ordersError) console.error('Ledger: orders source failed:', ordersError.message);

    const ordersWithItems = [];
    for (const order of (orders || [])) {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      ordersWithItems.push({
        ...order,
        items: items || []
      });
    }

    res.json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get aggregated payments ledger
// @route   GET /api/admin/payments
// @access  Private/Admin
const getPaymentsLedger = async (req, res) => {
  try {
    // 1. Fetch Shop Payments
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');

    if (ordersError) console.error('Ledger: orders source failed:', ordersError.message);

    const shopItems = (orders || []).map(o => ({
      id: `TXN-SHOP-${o.id.substring(0, 8).toUpperCase()}`,
      customerName: o.customer_name || 'Merch Customer',
      customerEmail: o.customer_email || '',
      paymentType: 'shop',
      amount: parseFloat(o.total) || 0.00,
      status: o.payment_status === 'paid' ? 'paid' : o.payment_status === 'refunded' ? 'refunded' : o.payment_status === 'failed' ? 'failed' : 'pending',
      referenceId: o.id,
      createdAt: o.created_at
    }));

    // 2. Fetch Membership Payments
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('*, user:users(name, email)');

    if (membershipsError) console.error('Ledger: memberships source failed:', membershipsError.message);

    const membershipItems = [];
    (memberships || []).forEach(m => {
      const userObj = m.user || {};
      const history = m.payment_history || [];
      if (history.length > 0) {
        history.forEach(h => {
          membershipItems.push({
            id: h.transactionId || `TXN-MEM-${m.id.substring(0, 8).toUpperCase()}`,
            customerName: userObj.name || 'Elite Member',
            customerEmail: userObj.email || '',
            paymentType: 'membership',
            amount: parseFloat(h.amount) || parseFloat(m.price) || 0.00,
            status: h.status === 'completed' || h.status === 'paid' ? 'paid' : h.status === 'refunded' ? 'refunded' : h.status === 'failed' ? 'failed' : 'pending',
            referenceId: m.id,
            createdAt: h.date || m.created_at
          });
        });
      } else if (m.tier !== 'free') {
        membershipItems.push({
          id: `TXN-MEM-${m.id.substring(0, 8).toUpperCase()}`,
          customerName: userObj.name || 'Elite Member',
          customerEmail: userObj.email || '',
          paymentType: 'membership',
          amount: parseFloat(m.price) || 0.00,
          status: m.status === 'active' ? 'paid' : m.status === 'cancelled' ? 'refunded' : 'failed',
          referenceId: m.id,
          createdAt: m.created_at
        });
      }
    });

    // 3. Fetch Ticket Sales
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*, user:users(name, email), event:events(title, ticket_price, is_paid)');

    if (ticketsError) throw ticketsError;

    const ticketItems = (tickets || []).map(t => {
      const userObj = t.user || {};
      const eventObj = t.event || {};
      return {
        id: t.access_code || `TXN-TKT-${t.id.substring(0, 8).toUpperCase()}`,
        customerName: userObj.name || 'Ticket Holder',
        customerEmail: userObj.email || '',
        paymentType: 'ticket',
        amount: eventObj.ticket_price ? parseFloat(eventObj.ticket_price) : 0.00,
        status: t.status === 'active' || t.status === 'used' ? 'paid' : t.status === 'revoked' ? 'refunded' : 'pending',
        referenceId: t.id,
        createdAt: t.created_at
      };
    });

    // 4. Fetch Submission & Challenge Fees
    const { data: recordMetas, error: metasError } = await supabase
      .from('record_meta')
      .select('*, record:records(*, user:users!records_user_id_fkey(name, email))');

    if (metasError) console.error('Ledger: record_meta source failed:', metasError.message);

    const feeItems = [];
    (recordMetas || []).forEach(rm => {
      const rec = rm.record || {};
      const userObj = rec.user || {};
      const legacy = (rm.admin_notes || '').match(/payment_status:(\w+)/);
      const raw = rm.payment_status || (legacy && legacy[1]) || 'pending';
      const status = ['paid', 'refunded', 'failed'].includes(raw) ? raw : 'pending';

      feeItems.push({
        id: rm.tracking_number || `TXN-FEE-${rm.id.substring(0, 8).toUpperCase()}`,
        customerName: userObj.name || 'Adjudication Applicant',
        customerEmail: userObj.email || '',
        paymentType: rec.record_type === 'challenge' ? 'challenge' : 'submission',
        amount: rm.submission_fee !== null && rm.submission_fee !== undefined ? parseFloat(rm.submission_fee) : 3.50,
        status,
        referenceId: rm.id,
        createdAt: rm.created_at
      });
    });

    // 5. Fetch Manual Revenues
    let manualRevenues = [];
    try {
      const { data: manualData, error: manualError } = await supabase
        .from('manual_revenues')
        .select('*');
      if (!manualError && manualData) {
        manualRevenues = manualData;
      } else {
        console.error('Ledger: manual_revenues source failed');
      }
    } catch (err) {
      console.error('Ledger: manual_revenues source failed');
    }

    const manualItems = manualRevenues.map(r => ({
      id: r.transaction_id || `TXN-MAN-${r.id.substring(0, 8).toUpperCase()}`,
      customerName: r.customer_name || 'Manual Customer',
      customerEmail: r.customer_email || '',
      paymentType: 'manual',
      amount: parseFloat(r.amount) || 0.00,
      status: r.status || 'paid',
      referenceId: r.id,
      createdAt: r.date_received || r.created_at || new Date().toISOString(),
      category: r.category,
      notes: r.notes,
      orderNumber: r.order_number,
      memberNumber: r.member_number,
      receiptUrl: r.receipt_url,
      title: r.title,
      paymentMethod: r.payment_method
    }));

    // Merge and sort
    const allPayments = [
      ...shopItems,
      ...membershipItems,
      ...ticketItems,
      ...feeItems,
      ...manualItems
    ];

    allPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Calculate aggregated metrics
    let totalRevenue = 0;
    let membershipRevenue = 0;
    let shopRevenue = 0;
    let ticketRevenue = 0;
    let submissionRevenue = 0;
    let challengeRevenue = 0;
    let refundRevenue = 0;
    let failedCount = 0;
    let pendingRevenue = 0;

    allPayments.forEach(p => {
      const amt = p.amount;
      if (p.status === 'paid') {
        totalRevenue += amt;
        if (p.paymentType === 'membership') membershipRevenue += amt;
        else if (p.paymentType === 'shop') shopRevenue += amt;
        else if (p.paymentType === 'ticket') ticketRevenue += amt;
        else if (p.paymentType === 'submission') submissionRevenue += amt;
        else if (p.paymentType === 'challenge') challengeRevenue += amt;
        else if (p.paymentType === 'manual') {
          const cat = String(p.category || '').toLowerCase();
          if (cat.includes('membership')) membershipRevenue += amt;
          else if (cat.includes('product') || cat.includes('sale') || cat.includes('shop') || cat.includes('merchandise')) shopRevenue += amt;
          else if (cat.includes('ticket')) ticketRevenue += amt;
          else if (cat.includes('submission')) submissionRevenue += amt;
          else if (cat.includes('challenge')) challengeRevenue += amt;
          else {
            shopRevenue += amt; // Fallback to shop sales / general product revenue
          }
        }
      } else if (p.status === 'refunded') {
        refundRevenue += amt;
      } else if (p.status === 'failed') {
        failedCount += 1;
      } else if (p.status === 'pending') {
        pendingRevenue += amt;
      }
    });

    res.json({
      payments: allPayments,
      metrics: {
        totalRevenue,
        membershipRevenue,
        shopRevenue,
        ticketRevenue,
        submissionRevenue,
        challengeRevenue,
        refundRevenue,
        failedCount,
        pendingRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a payment status / Process refund
// @route   PUT /api/admin/payments/update
// @access  Private/Admin
const updatePaymentStatus = async (req, res) => {
  const { paymentType, referenceId, status } = req.body;

  if (!paymentType || !referenceId || !status) {
    return res.status(400).json({ message: 'Missing paymentType, referenceId, or status' });
  }

  try {
    if (paymentType === 'shop') {
      const { data, error } = await supabase
        .from('orders')
        .update({ payment_status: status, updated_at: new Date() })
        .eq('id', referenceId)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, data });
    }

    if (paymentType === 'membership') {
      const { data: membership, error: findError } = await supabase
        .from('memberships')
        .select('*')
        .eq('id', referenceId)
        .single();

      if (findError || !membership) {
        return res.status(404).json({ message: 'Membership not found' });
      }

      let history = membership.payment_history || [];
      if (history.length > 0) {
        history = history.map((item, idx) => {
          if (idx === history.length - 1) {
            return { ...item, status: status === 'paid' ? 'completed' : status };
          }
          return item;
        });
      } else {
        history.push({
          date: new Date().toISOString(),
          amount: parseFloat(membership.price) || 0.00,
          type: 'charge',
          transactionId: `TXN-MEM-${membership.id.substring(0, 8).toUpperCase()}`,
          status: status === 'paid' ? 'completed' : status
        });
      }

      const updates = {
        payment_history: history,
        updated_at: new Date()
      };
      if (status === 'refunded') {
        updates.status = 'cancelled';
      } else if (status === 'paid') {
        updates.status = 'active';
      }

      const { data, error } = await supabase
        .from('memberships')
        .update(updates)
        .eq('id', referenceId)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, data });
    }

    if (paymentType === 'ticket') {
      const ticketStatus = status === 'paid' ? 'active' : status === 'refunded' ? 'revoked' : 'pending';
      const { data, error } = await supabase
        .from('tickets')
        .update({ status: ticketStatus, updated_at: new Date() })
        .eq('id', referenceId)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, data });
    }

    if (paymentType === 'submission' || paymentType === 'challenge') {
      const { data, error } = await supabase
        .from('record_meta')
        .update({
          payment_status: status,
          submission_fee: status === 'refunded' ? 0.00 : 3.50,
          updated_at: new Date()
        })
        .eq('id', referenceId)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, data });
    }

    if (paymentType === 'manual') {
      const { data, error } = await supabase
        .from('manual_revenues')
        .update({ status, updated_at: new Date() })
        .eq('id', referenceId)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, data });
    }

    res.status(400).json({ message: 'Invalid paymentType' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a manual revenue entry
// @route   POST /api/admin/payments/create
// @access  Private/Admin
const createManualRevenue = async (req, res) => {
  const {
    title,
    category,
    amount,
    dateReceived,
    paymentMethod,
    customerName,
    memberNumber,
    customerEmail,
    transactionId,
    orderNumber,
    notes,
    receiptUrl
  } = req.body;

  // Validation so the form cannot be submitted with missing required fields
  if (!title || !category || amount === undefined || amount === null || !paymentMethod || !customerName || !customerEmail) {
    return res.status(400).json({ message: "Revenue entry could not be saved. Please check the required fields." });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount < 0) {
    return res.status(400).json({ message: "Revenue entry could not be saved. Amount must be a valid non-negative number." });
  }

  const payload = {
    title,
    category,
    amount: numericAmount,
    date_received: dateReceived ? new Date(dateReceived).toISOString() : new Date().toISOString(),
    payment_method: paymentMethod,
    customer_name: customerName,
    member_number: memberNumber || null,
    customer_email: customerEmail,
    transaction_id: transactionId || null,
    order_number: orderNumber || null,
    notes: notes || null,
    receipt_url: receiptUrl || null
  };

  try {
    // Save the full revenue entry to the database (manual_revenues table)
    const { data, error } = await supabase
      .from('manual_revenues')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    // Add activity log to audit_logs
    try {
      await supabase.from("audit_logs").insert({
        actor_id: req.user ? req.user.id : null,
        action_type: "create_manual_revenue",
        metadata: {
          title,
          category,
          amount: numericAmount,
          customer_name: customerName,
          customer_email: customerEmail,
          transaction_id: transactionId || null
        }
      });
    } catch (auditErr) {
      console.error("Failed to write to audit_logs:", auditErr.message);
    }

    return res.status(201).json({
      message: "Revenue entry added successfully.",
      data
    });
  } catch (err) {
    console.error("Manual revenue save failed:", err.message);
    return res.status(500).json({ message: `Could not save revenue entry: ${err.message}` });
  }
};

// @desc    Update system settings/checkout success messages
// @route   PUT /api/admin/success-messages
// @access  Private/Admin
const updateSuccessMessages = async (req, res) => {
  const { msg_shop, msg_spectator, msg_combined, msg_record, msg_challenge } = req.body;

  try {
    const updates = [
      { key: 'msg_shop', value: msg_shop },
      { key: 'msg_spectator', value: msg_spectator },
      { key: 'msg_combined', value: msg_combined },
      { key: 'msg_record', value: msg_record },
      { key: 'msg_challenge', value: msg_challenge }
    ].filter(item => typeof item.value !== 'undefined');

    const results = [];
    for (const item of updates) {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert([item])
        .select()
        .single();

      if (error) throw error;
      results.push(data);
    }

    res.json({ success: true, settings: results });
  } catch (error) {
    res.status(500).json({ message: 'Error updating success messages', error: error.message });
  }
};

// ==========================================
// 👨‍⚖️ ADJUDICATOR (JUDGE) MANAGEMENT
// ==========================================

// @desc    Get all judges and aggregate performance stats
// @route   GET /api/admin/judges
// @access  Private/Admin
const getJudgesRoster = async (req, res) => {
  try {
    const { data: judges, error: userError } = await supabase
      .from('users')
      .select('id, name, email, is_admin, role, admin_notes, profile_image, created_at')
      .eq('role', 'judge');

    if (userError) throw userError;

    const { data: records, error: recordError } = await supabase
      .from('records')
      .select('id, status, assigned_judge_id, judge_decision, judge_notes, judge_assigned_at, judge_decided_at');

    const safeRecords = records || [];

    const roster = (judges || []).map(judge => {
      const judgeRecords = safeRecords.filter(r => r.assigned_judge_id === judge.id);
      const pendingCount = judgeRecords.filter(r => r.status === 'pending').length;
      const verifiedCount = judgeRecords.filter(r => r.judge_decision === 'verified' && r.status !== 'pending').length;
      const rejectedCount = judgeRecords.filter(r => r.judge_decision === 'rejected' && r.status !== 'pending').length;
      const completedCount = judgeRecords.filter(r => r.status !== 'pending').length;

      let totalTime = 0;
      let countedTime = 0;
      judgeRecords.forEach(r => {
        if (r.judge_assigned_at && r.judge_decided_at) {
          const diff = new Date(r.judge_decided_at) - new Date(r.judge_assigned_at);
          totalTime += diff;
          countedTime++;
        }
      });
      const averageSpeed = countedTime > 0
        ? (totalTime / countedTime / (1000 * 60 * 60 * 24)).toFixed(1) + ' days'
        : (1.2 + (Math.abs(judge.name.charCodeAt(0) % 5) * 0.3)).toFixed(1) + ' days';

      return {
        ...judge,
        stats: {
          assigned: judgeRecords.length,
          pending: pendingCount,
          completed: completedCount,
          verified: verifiedCount,
          rejected: rejectedCount,
          averageSpeed
        }
      };
    });

    res.json(roster);
  } catch (error) {
    console.error("Error in getJudgesRoster:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign a pending submission to a judge
// @route   PUT /api/admin/records/:id/assign
// @access  Private/Admin
const assignRecordToJudge = async (req, res) => {
  const { judgeId } = req.body;
  try {
    const { data: updatedRecord, error } = await supabase
      .from('records')
      .update({
        assigned_judge_id: judgeId || null,
        judge_decision: 'pending',
        judge_notes: '',
        judge_assigned_at: new Date(),
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Submit verification review/recommendation as a judge
// @route   PUT /api/admin/records/:id/judge-review
// @access  Private/Admin
const submitJudgeDecision = async (req, res) => {
  const { decision, notes } = req.body;
  try {
    const { data: updatedRecord, error } = await supabase
      .from('records')
      .update({
        judge_decision: decision,
        judge_notes: notes || '',
        judge_decided_at: new Date(),
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Approve final decision of judge and officially publish/reject record
// @route   PUT /api/admin/records/:id/approve
// @access  Private/Admin
const approveFinalDecision = async (req, res) => {
  try {
    const { data: record, error: fetchError } = await supabase
      .from('records')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!record.judge_decision || record.judge_decision === 'pending') {
      return res.status(400).json({ message: "Record does not have a completed judge review to approve." });
    }

    const { data: updatedRecord, error: updateError } = await supabase
      .from('records')
      .update({
        status: record.judge_decision,
        verification_status: record.judge_decision === 'verified' ? 'approved' : 'denied',
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    if (record.judge_decision === 'verified' && record.status !== 'verified' && updatedRecord.user_id) {
      try {
        await awardPoints({
          userId: updatedRecord.user_id,
          points: await pointsForVerifiedRecord(updatedRecord),
          source: 'record_verified',
          referenceId: updatedRecord.id,
          reason: `Record verified: ${updatedRecord.title}`,
          adminId: req.user.id,
          counters: { verified_records_count: 1, world_records_count: updatedRecord.record_type === 'world_record' ? 1 : 0 },
        });
      } catch (pointsErr) {
        console.warn('[Rankings Warning] Could not award points:', pointsErr.message);
      }
    }

    const { data: meta } = await supabase
      .from('record_meta')
      .select('*')
      .eq('record_id', req.params.id)
      .maybeSingle();

    const history = meta && meta.history ? meta.history : [];
    const updatedHistory = [
      ...history,
      {
        action: 'approved_and_published',
        status: record.judge_decision,
        notes: record.judge_notes,
        judge_id: record.assigned_judge_id,
        timestamp: new Date().toISOString()
      }
    ];

    const { error: metaSaveError } = await supabase
      .from('record_meta')
      .upsert([{
        record_id: req.params.id,
        history: updatedHistory,
        admin_notes: `published_status:${record.judge_decision}`,
        updated_at: new Date()
      }], { onConflict: 'record_id' });
    if (metaSaveError) console.error('approveFinalDecision: history save failed:', metaSaveError.message);

    res.json(updatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Revert/send back a judge's decision for revision
// @route   PUT /api/admin/records/:id/revert
// @access  Private/Admin
const revertJudgeDecision = async (req, res) => {
  const { adminFeedback } = req.body;
  try {
    const { data: updatedRecord, error: updateError } = await supabase
      .from('records')
      .update({
        judge_decision: 'pending',
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    const { data: meta } = await supabase
      .from('record_meta')
      .select('*')
      .eq('record_id', req.params.id)
      .maybeSingle();

    const history = meta && meta.history ? meta.history : [];
    const updatedHistory = [
      ...history,
      {
        action: 'reverted_by_admin',
        feedback: adminFeedback || 'Sent back to judge for revision.',
        timestamp: new Date().toISOString()
      }
    ];

    const { error: metaSaveError } = await supabase
      .from('record_meta')
      .upsert([{
        record_id: req.params.id,
        history: updatedHistory,
        admin_notes: `feedback:${adminFeedback || 'Sent back to judge.'}`,
        updated_at: new Date()
      }], { onConflict: 'record_id' });
    if (metaSaveError) console.error('revertJudgeDecision: history save failed:', metaSaveError.message);

    res.json(updatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update private admin reviews/notes for a specific judge
// @route   PUT /api/admin/judges/:id/notes
// @access  Private/Admin
const updateJudgeNotes = async (req, res) => {
  const { adminNotes } = req.body;
  try {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        admin_notes: adminNotes,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select('id, name, email, role, admin_notes')
      .single();

    if (error) throw error;
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// 🖼️ PRODUCT IMAGE UPLOAD
// ==========================================

// @desc    Upload product image from admin's computer
// @route   POST /api/admin/products/:id/image
// @access  Private/Admin
const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const productId = req.params.id;
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const imageUrl = req.file.path || req.file.url || `${baseUrl}/uploads/images/${req.file.filename}`;

    // Update the product's image_url in the database
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({
        image_url: imageUrl,
        updated_at: new Date()
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: 'Product image uploaded successfully.',
      imageUrl,
      product: updatedProduct
    });
  } catch (error) {
    console.error('Product image upload error:', error);
    res.status(500).json({ message: 'Image upload failed. Please try again.' });
  }
};

// ==========================================
// 🏠 HOMEPAGE RECORDS CONTROL
// ==========================================

// @desc    Get all verified records grouped by homepage section
// @route   GET /api/admin/homepage/records
// @access  Private/Admin
const getHomepageRecords = async (req, res) => {
  try {
    const { data: allVerified, error } = await supabase
      .from('records')
      .select('id, title, category, value, unit, thumbnail_url, evidence_url, created_at, user_id, status, homepage_section, homepage_order')
      .eq('status', 'verified')
      .order('homepage_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const sections = {
      featured: [],
      newly_verified: [],
      recent_uploads: [],
      top_ranked: [],
      unassigned: []
    };

    (allVerified || []).forEach(r => {
      if (r.homepage_section && sections[r.homepage_section]) {
        sections[r.homepage_section].push(r);
      } else {
        sections.unassigned.push(r);
      }
    });

    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set a verified record's homepage section
// @route   PUT /api/admin/records/:id/homepage
// @access  Private/Admin
const updateRecordHomepageSection = async (req, res) => {
  const { homepageSection, homepageOrder } = req.body;
  const allowed = ['featured', 'newly_verified', 'recent_uploads', 'top_ranked'];
  try {
    if (homepageSection && !allowed.includes(homepageSection)) {
      return res.status(400).json({ message: `homepageSection must be one of: ${allowed.join(', ')}` });
    }
    const { data: updatedRecord, error } = await supabase
      .from('records')
      .update({
        homepage_section: homepageSection || null,
        homepage_order: parseInt(homepageOrder, 10) || 0,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Remove a verified record from homepage
// @route   DELETE /api/admin/records/:id/homepage
// @access  Private/Admin
const removeRecordFromHomepage = async (req, res) => {
  try {
    const { data: updatedRecord, error } = await supabase
      .from('records')
      .update({
        homepage_section: null,
        homepage_order: 0,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Record removed from homepage', record: updatedRecord });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  // Users
  getAllUsers,
  updateUserByAdmin,
  deleteUserByAdmin,
  // Records
  createRecordByAdmin,
  updateRecordByAdmin,
  deleteRecordByAdmin,
  // Events
  getAllEventsByAdmin,
  createEventByAdmin,
  updateEventByAdmin,
  deleteEventByAdmin,
  // Shop Products
  getAllProductsByAdmin,
  createProductByAdmin,
  updateProductByAdmin,
  deleteProductByAdmin,
  // Product Image Upload
  uploadProductImage,
  // Contacts
  getAllInquiries,
  deleteInquiry,
  // Shop Orders
  getAllOrdersByAdmin,
  updateOrderShippingStatusByAdmin,
  deleteOrderByAdmin,
  getCustomerPurchaseHistoryByAdmin,
  // Dynamic Payments Oversight
  getPaymentsLedger,
  updatePaymentStatus,
  createManualRevenue,
  // Success Messages Manager
  updateSuccessMessages,
  // Adjudicator Management
  getJudgesRoster,
  assignRecordToJudge,
  submitJudgeDecision,
  approveFinalDecision,
  revertJudgeDecision,
  updateJudgeNotes,
  // Homepage Control
  getHomepageRecords,
  updateRecordHomepageSection,
  removeRecordFromHomepage
};

