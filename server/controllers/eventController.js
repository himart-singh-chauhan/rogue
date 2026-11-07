const supabase = require('../config/supabase');

// Paid events only reveal their stream/video URL to admins and active ticket holders.
const ticketedEventIds = async (user) => {
  if (!user) return new Set();
  const { data } = await supabase
    .from('tickets')
    .select('event_id, status, expires_at')
    .eq('user_id', user.id)
    .in('status', ['active', 'used']);
  const now = new Date();
  return new Set((data || []).filter((t) => !t.expires_at || new Date(t.expires_at) > now).map((t) => t.event_id));
};

const gateMedia = (formatted, raw, user, tickets) => {
  if (!raw.is_paid || (user && user.is_admin) || tickets.has(raw.id)) return formatted;
  return { ...formatted, streamUrl: '', videoUrl: '', locked: true };
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    const tickets = await ticketedEventIds(req.user);

    // Map camelCase fields to match previous Mongoose models for frontend compatibility
    const formattedEvents = (events || []).map(e => gateMedia({
      _id: e.id,
      id: e.id,
      title: e.title,
      description: e.description,
      date: e.date,
      location: e.location,
      image: e.image_url,
      imageUrl: e.image_url,
      isLive: e.is_live,
      streamUrl: e.stream_url,
      isPaid: e.is_paid,
      ticketPrice: e.ticket_price,
      competitors: e.competitors,
      judges: e.judges,
      isFeatured: e.is_featured,
      videoUrl: e.video_url || '',
      ticketLink: e.ticket_link || '',
      sponsors: e.sponsors || '',
      rules: e.rules || '',
      status: e.status || 'upcoming',
      category: e.category || 'WORLD RECORD',
      createdAt: e.created_at,
      updatedAt: e.updated_at
    }, e, req.user, tickets));

    res.json(formattedEvents);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const tickets = await ticketedEventIds(req.user);

    const formattedEvent = {
      _id: event.id,
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      image: event.image_url,
      imageUrl: event.image_url,
      isLive: event.is_live,
      streamUrl: event.stream_url,
      isPaid: event.is_paid,
      ticketPrice: event.ticket_price,
      competitors: event.competitors,
      judges: event.judges,
      isFeatured: event.is_featured,
      videoUrl: event.video_url || '',
      ticketLink: event.ticket_link || '',
      sponsors: event.sponsors || '',
      rules: event.rules || '',
      status: event.status || 'upcoming',
      category: event.category || 'WORLD RECORD',
      createdAt: event.created_at,
      updatedAt: event.updated_at
    };

    res.json(gateMedia(formattedEvent, event, req.user, tickets));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
  const { title, description, date, location, image, imageUrl, isLive, streamUrl, isPaid, ticketPrice, competitors, judges, isFeatured, videoUrl, ticketLink, sponsors, rules, status, category } = req.body;

  try {
    if (!title || !description || !date || !location) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (isPaid && !ticketPrice) {
      return res.status(400).json({ message: 'Ticket price is required for paid events' });
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert([{
        title,
        description,
        date,
        location,
        image_url: imageUrl || image || '',
        is_live: isLive || false,
        stream_url: streamUrl || '',
        is_paid: isPaid || false,
        ticket_price: isPaid ? parseFloat(ticketPrice) : 0.00,
        competitors: competitors || '',
        judges: judges || '',
        is_featured: isFeatured || false,
        video_url: videoUrl || '',
        ticket_link: ticketLink || '',
        sponsors: sponsors || '',
        rules: rules || '',
        status: status || 'upcoming',
        category: category || 'WORLD RECORD'
      }])
      .select()
      .single();

    if (error) throw error;

    const formattedEvent = {
      _id: event.id,
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      image: event.image_url,
      imageUrl: event.image_url,
      isLive: event.is_live,
      streamUrl: event.stream_url,
      isPaid: event.is_paid,
      ticketPrice: event.ticket_price,
      competitors: event.competitors,
      judges: event.judges,
      isFeatured: event.is_featured,
      videoUrl: event.video_url || '',
      ticketLink: event.ticket_link || '',
      sponsors: event.sponsors || '',
      rules: event.rules || '',
      status: event.status || 'upcoming',
      category: event.category || 'WORLD RECORD',
      createdAt: event.created_at,
      updatedAt: event.updated_at
    };

    res.status(201).json({ message: 'Event created successfully', event: formattedEvent });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
  const { title, description, date, location, image, imageUrl, isLive, streamUrl, isPaid, ticketPrice, competitors, judges, isFeatured, videoUrl, ticketLink, sponsors, rules, status, category } = req.body;

  try {
    // Check if event exists
    const { data: existingEvent, error: findError } = await supabase
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (isPaid && !ticketPrice) {
      return res.status(400).json({ message: 'Ticket price is required for paid events' });
    }

    const updates = {
      title: title !== undefined ? title : existingEvent.title,
      description: description !== undefined ? description : existingEvent.description,
      date: date !== undefined ? date : existingEvent.date,
      location: location !== undefined ? location : existingEvent.location,
      image_url: imageUrl !== undefined ? imageUrl : (image !== undefined ? image : existingEvent.image_url),
      is_live: isLive !== undefined ? isLive : existingEvent.is_live,
      stream_url: streamUrl !== undefined ? streamUrl : existingEvent.stream_url,
      is_paid: isPaid !== undefined ? isPaid : existingEvent.is_paid,
      ticket_price: isPaid !== undefined ? (isPaid ? parseFloat(ticketPrice) : 0.00) : existingEvent.ticket_price,
      competitors: competitors !== undefined ? competitors : existingEvent.competitors,
      judges: judges !== undefined ? judges : existingEvent.judges,
      is_featured: isFeatured !== undefined ? isFeatured : existingEvent.is_featured,
      video_url: videoUrl !== undefined ? videoUrl : existingEvent.video_url,
      ticket_link: ticketLink !== undefined ? ticketLink : existingEvent.ticket_link,
      sponsors: sponsors !== undefined ? sponsors : existingEvent.sponsors,
      rules: rules !== undefined ? rules : existingEvent.rules,
      status: status !== undefined ? status : existingEvent.status,
      category: category !== undefined ? category : existingEvent.category,
      updated_at: new Date()
    };

    const { data: event, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    const formattedEvent = {
      _id: event.id,
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      image: event.image_url,
      imageUrl: event.image_url,
      isLive: event.is_live,
      streamUrl: event.stream_url,
      isPaid: event.is_paid,
      ticketPrice: event.ticket_price,
      competitors: event.competitors,
      judges: event.judges,
      isFeatured: event.is_featured,
      videoUrl: event.video_url || '',
      ticketLink: event.ticket_link || '',
      sponsors: event.sponsors || '',
      rules: event.rules || '',
      status: event.status || 'upcoming',
      category: event.category || 'WORLD RECORD',
      createdAt: event.created_at,
      updatedAt: event.updated_at
    };

    res.json({ message: 'Event updated successfully', event: formattedEvent });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    const { data: event, error: findError } = await supabase
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    const formattedEvent = {
      _id: event.id,
      id: event.id,
      title: event.title,
      description: event.description
    };

    res.json({ message: 'Event deleted successfully', event: formattedEvent });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Toggle event between paid and free
// @route   PUT /api/events/:id/toggle-paid
// @access  Private/Admin
const toggleEventPaid = async (req, res) => {
  const { ticketPrice } = req.body;

  try {
    const { data: event, error: findError } = await supabase
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const newIsPaid = !event.is_paid;
    let newPrice = 0.00;

    if (newIsPaid && ticketPrice) {
      newPrice = parseFloat(ticketPrice);
    }

    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update({
        is_paid: newIsPaid,
        ticket_price: newPrice,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    const formattedEvent = {
      _id: updatedEvent.id,
      id: updatedEvent.id,
      title: updatedEvent.title,
      isPaid: updatedEvent.is_paid,
      ticketPrice: updatedEvent.ticket_price
    };

    res.json({
      message: `Event is now a ${updatedEvent.is_paid ? 'paid' : 'free'} event`,
      event: formattedEvent
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventPaid
};
