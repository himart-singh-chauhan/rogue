const crypto = require('crypto');
const supabase = require('../config/supabase');

// Unguessable access code (the old code was userId-eventId-timestamp, all of which are public).
const newAccessCode = () => `TKT-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;

const getFormattedTicket = (t) => {
  if (!t) return null;
  return {
    _id: t.id,
    id: t.id,
    user: t.user ? {
      _id: t.user.id,
      id: t.user.id,
      name: t.user.name,
      email: t.user.email,
      memberNumber: t.user.member_number || null
    } : t.user_id,
    userId: t.user_id,
    event: t.event ? {
      _id: t.event.id,
      id: t.event.id,
      title: t.event.title,
      description: t.event.description,
      date: t.event.date,
      location: t.event.location,
      imageUrl: t.event.image_url,
      isPaid: t.event.is_paid,
      ticketPrice: t.event.ticket_price
    } : t.event_id,
    eventId: t.event_id,
    accessCode: t.access_code,
    status: t.status,
    ticketType: t.ticket_type,
    scanCount: t.scan_count || 0,
    scan_count: t.scan_count || 0,
    lastScannedAt: t.last_scanned_at || null,
    last_scanned_at: t.last_scanned_at || null,
    expiresAt: t.expires_at,
    createdAt: t.created_at,
    updatedAt: t.updated_at
  };
};

// @desc    Purchase a ticket for an event
// @route   POST /api/tickets
// @access  Private
const purchaseTicket = async (req, res) => {
  const { eventId } = req.body;
  const userId = req.user.id;

  try {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is free
    if (!event.is_paid) {
      return res.status(400).json({ message: 'This is a free event, no ticket required' });
    }

    // Check existing valid ticket
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingTicket) {
      return res.status(400).json({ message: 'You already have a valid ticket for this event' });
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert([{
        user_id: userId,
        event_id: eventId,
        access_code: newAccessCode(),
        status: 'active',
        ticket_type: 'spectator',
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Ticket purchased successfully', ticket: getFormattedTicket(ticket) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify if a user has a valid ticket for an event (or if event is free)
// @route   GET /api/tickets/verify/:eventId
// @access  Private
const verifyTicket = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user ? req.user.id : null;

  try {
    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // If event is free, no ticket required
    if (!event.is_paid) {
      return res.json({
        hasTicket: true,
        canWatch: true,
        reason: 'free_event',
        event: { isPaid: false }
      });
    }

    // If event is paid but user is not logged in
    if (!userId) {
      return res.json({
        hasTicket: false,
        canWatch: false,
        reason: 'not_logged_in',
        event: { isPaid: true, ticketPrice: event.ticket_price }
      });
    }

    // Check for valid ticket
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (ticket) {
      return res.json({
        hasTicket: true,
        canWatch: true,
        reason: 'valid_ticket',
        event: { isPaid: true, ticketPrice: event.ticket_price }
      });
    }

    // No valid ticket found
    res.json({
      hasTicket: false,
      canWatch: false,
      reason: 'no_valid_ticket',
      event: { isPaid: true, ticketPrice: event.ticket_price }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get ticket details
// @route   GET /api/tickets/:ticketId
// @access  Private
const getTicketDetails = async (req, res) => {
  const { ticketId } = req.params;

  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*, event:events(*)')
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Only the ticket owner (or an admin) may see a ticket and its access code.
    if (!req.user.is_admin && String(ticket.user_id) !== String(req.user.id)) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(getFormattedTicket(ticket));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Revoke a ticket (admin only)
// @route   PUT /api/tickets/:ticketId/revoke
// @access  Private/Admin
const revokeTicket = async (req, res) => {
  const { ticketId } = req.params;

  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .update({ status: 'revoked' })
      .eq('id', ticketId)
      .select()
      .single();

    if (error || !ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({ message: 'Ticket revoked successfully', ticket: getFormattedTicket(ticket) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Grant free/VIP access to an event
// @route   POST /api/tickets/grant
// @access  Private/Admin
const grantFreeAccess = async (req, res) => {
  const { userId, eventId, ticketType = 'vip' } = req.body;

  try {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingTicket) {
      return res.status(400).json({ message: 'User already has a ticket for this event' });
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert([{
        user_id: userId,
        event_id: eventId,
        access_code: newAccessCode(),
        status: 'active',
        ticket_type: ticketType, // 'vip' or 'free'
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: `${ticketType} access granted successfully`, ticket: getFormattedTicket(ticket) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Scan and verify a ticket
// @route   POST /api/tickets/scan
// @access  Private/Admin
const scanAndVerifyTicket = async (req, res) => {
  const { accessCode } = req.body;

  try {
    if (!accessCode) {
      return res.status(400).json({ message: 'Access code is required' });
    }

    // Lookup ticket joining user and event tables
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*, user:users(id, name, email, username, member_number, profile_image), event:events(*)')
      .eq('access_code', accessCode)
      .maybeSingle();

    if (error || !ticket) {
      return res.status(404).json({ message: 'Invalid ticket access code - Access Denied' });
    }

    // Check duplicate scan
    if (ticket.status === 'used') {
      return res.status(400).json({
        message: 'Duplicate scan attempt - Already Used!',
        duplicate: true,
        ticket: getFormattedTicket(ticket),
        scannedAt: ticket.last_scanned_at,
        scanCount: ticket.scan_count
      });
    }

    // Check revoked ticket
    if (ticket.status === 'revoked') {
      return res.status(400).json({ message: 'This ticket has been revoked by an administrator', revoked: true });
    }

    // Check expiration
    if (ticket.expires_at && new Date(ticket.expires_at) < new Date()) {
      return res.status(400).json({ message: 'This ticket has expired and is no longer valid', expired: true });
    }

    // Mark as used, increment count and update timestamp
    const nextScanCount = (ticket.scan_count || 0) + 1;
    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'used',
        scan_count: nextScanCount,
        last_scanned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', ticket.id)
      .neq('status', 'used') // atomic: a simultaneous second scan updates 0 rows
      .select('*, user:users(id, name, email, username, member_number, profile_image), event:events(*)')
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updatedTicket) {
      return res.status(400).json({ message: 'Duplicate scan attempt - Already Used!', duplicate: true, ticket: getFormattedTicket(ticket) });
    }

    res.json({
      message: 'Ticket scanned & verified successfully!',
      success: true,
      ticket: getFormattedTicket(updatedTicket)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all tickets with user/event joins (admin only)
// @route   GET /api/tickets/admin/list
// @access  Private/Admin
const getAllTicketsAdmin = async (req, res) => {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*, user:users(id, name, email, member_number), event:events(id, title)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = tickets.map(t => getFormattedTicket(t));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset ticket scan state for simulation/testing
// @route   PUT /api/tickets/:ticketId/reset
// @access  Private/Admin
const resetTicketScan = async (req, res) => {
  const { ticketId } = req.params;

  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .update({
        status: 'active',
        scan_count: 0,
        last_scanned_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select('*, user:users(id, name, email, username, member_number, profile_image), event:events(*)')
      .single();

    if (error || !ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({ message: 'Ticket scan state reset successfully!', ticket: getFormattedTicket(ticket) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  purchaseTicket,
  verifyTicket,
  getTicketDetails,
  revokeTicket,
  grantFreeAccess,
  scanAndVerifyTicket,
  getAllTicketsAdmin,
  resetTicketScan
};
