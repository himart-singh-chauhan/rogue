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
      hasMuxStream: !!e.mux_playback_id,
      muxStatus: e.mux_status || null,
      hasRecording: !!e.mux_recording_playback_id,
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
      hasMuxStream: !!event.mux_playback_id,
      muxStatus: event.mux_status || null,
      hasRecording: !!event.mux_recording_playback_id,
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
      hasMuxStream: !!event.mux_playback_id,
      muxStatus: event.mux_status || null,
      hasRecording: !!event.mux_recording_playback_id,
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
      hasMuxStream: !!event.mux_playback_id,
      muxStatus: event.mux_status || null,
      hasRecording: !!event.mux_recording_playback_id,
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

// ---------------------------------------------------------------------------
// Mux live streams (Admin) and playback (viewers with access)
// ---------------------------------------------------------------------------
const mux = require('../utils/mux');

const adminStreamView = (e) => ({
  enabled: mux.muxEnabled(),
  signedPlayback: mux.signingEnabled(),
  liveStreamId: e.mux_live_stream_id || null,
  playbackId: e.mux_playback_id || null,
  recordingPlaybackId: e.mux_recording_playback_id || null,
  status: e.mux_status || null,
  isLive: !!e.is_live,
  rtmpUrl: mux.RTMP_URL,
  streamKey: e.mux_stream_key || null,
});

const loadEvent = async (id) => {
  if (!/^[0-9a-f-]{36}$/i.test(String(id || ''))) return null;
  const { data } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
  return data || null;
};

// @route GET /api/events/:id/mux   (admin) — stream key and current status
const getMuxStream = async (req, res) => {
  try {
    const event = await loadEvent(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.mux_live_stream_id && mux.muxEnabled()) {
      try {
        const ls = await mux.getLiveStream(event.mux_live_stream_id);
        if (ls && ls.status !== event.mux_status) {
          await supabase.from('events').update({ mux_status: ls.status, is_live: ls.status === 'active', updated_at: new Date() }).eq('id', event.id);
          Object.assign(event, { mux_status: ls.status, is_live: ls.status === 'active' });
        }
      } catch (e) {
        if (e.status === 404) {
          await supabase.from('events').update({ mux_live_stream_id: null, mux_playback_id: null, mux_stream_key: null, mux_status: null, updated_at: new Date() }).eq('id', event.id);
          Object.assign(event, { mux_live_stream_id: null, mux_playback_id: null, mux_stream_key: null, mux_status: null });
        }
      }
    }
    res.json(adminStreamView(event));
  } catch (error) {
    res.status(500).json({ message: 'Could not load the live stream', error: error.message });
  }
};

// @route POST /api/events/:id/mux   (admin) — create the event's live stream
const createMuxStream = async (req, res) => {
  try {
    const event = await loadEvent(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.mux_live_stream_id) return res.json(adminStreamView(event));
    const ls = await mux.createLiveStream(event.id);
    const playbackId = (ls.playback_ids || [])[0]?.id || null;
    const { data: updated, error } = await supabase
      .from('events')
      .update({ mux_live_stream_id: ls.id, mux_playback_id: playbackId, mux_stream_key: ls.stream_key, mux_status: ls.status || 'idle', updated_at: new Date() })
      .eq('id', event.id)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(adminStreamView(updated));
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Could not create the live stream' });
  }
};

// @route POST /api/events/:id/mux/reset-key   (admin) — new stream key (the old one stops working)
const resetMuxKey = async (req, res) => {
  try {
    const event = await loadEvent(req.params.id);
    if (!event?.mux_live_stream_id) return res.status(404).json({ message: 'This event has no live stream yet' });
    const ls = await mux.resetStreamKey(event.mux_live_stream_id);
    const { data: updated } = await supabase.from('events').update({ mux_stream_key: ls.stream_key, updated_at: new Date() }).eq('id', event.id).select().single();
    res.json(adminStreamView(updated));
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Could not reset the stream key' });
  }
};

// @route DELETE /api/events/:id/mux   (admin) — remove the live stream (its recording stays in Mux)
const deleteMuxStream = async (req, res) => {
  try {
    const event = await loadEvent(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.mux_live_stream_id) {
      try {
        await mux.deleteLiveStream(event.mux_live_stream_id);
      } catch (e) {
        if (e.status !== 404) throw e;
      }
    }
    const { data: updated } = await supabase
      .from('events')
      .update({ mux_live_stream_id: null, mux_playback_id: null, mux_stream_key: null, mux_status: null, is_live: false, updated_at: new Date() })
      .eq('id', event.id)
      .select()
      .single();
    res.json(adminStreamView(updated));
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Could not delete the live stream' });
  }
};

// @route GET /api/events/:id/playback   (optionalAuth) — what the player needs, only for viewers with access
const getPlayback = async (req, res) => {
  try {
    const event = await loadEvent(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const tickets = await ticketedEventIds(req.user);
    const allowed = !event.is_paid || (req.user && req.user.is_admin) || tickets.has(event.id);
    if (!allowed) return res.status(403).json({ message: 'A spectator pass is needed to watch this event.', locked: true });

    // Live while the stream is on; afterwards the recording (if Mux has finished it), else the live id.
    const live = !!event.mux_playback_id && (event.mux_status === 'active' || (event.is_live && !event.mux_status));
    const playbackId = live ? event.mux_playback_id : event.mux_recording_playback_id;
    if (!playbackId && event.mux_playback_id) {
      // A Mux stream is set up but not broadcasting yet (and there is no replay): the player waits.
      return res.json({ source: 'mux', waiting: true, isLive: false, status: event.mux_status || 'idle' });
    }
    if (!playbackId) {
      return res.json({ source: 'external', streamUrl: event.stream_url || '', videoUrl: event.video_url || '', isLive: !!event.is_live });
    }
    const tokens = mux.playbackTokens(playbackId);
    res.json({ source: 'mux', playbackId, tokens, isLive: live, status: event.mux_status || null, title: event.title });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Could not load the stream' });
  }
};

// @route POST /api/streams/mux/webhook   (Mux only: checked with the webhook signing secret)
const muxWebhook = async (req, res) => {
  if (!String(process.env.MUX_WEBHOOK_SECRET || '').trim()) return res.status(503).json({ message: 'Mux webhook is not configured' });
  if (!mux.verifyWebhook(req.rawBody, req.get('mux-signature'))) return res.status(400).json({ message: 'Webhook signature check failed' });
  try {
    const { type, data = {} } = req.body || {};
    const now = new Date();
    if (type && type.startsWith('video.live_stream.')) {
      const status = type.split('.').pop(); // active | idle | connected | disconnected | recording | deleted …
      const updates = { updated_at: now };
      if (status === 'deleted') Object.assign(updates, { mux_live_stream_id: null, mux_playback_id: null, mux_stream_key: null, mux_status: null, is_live: false });
      else if (['active', 'idle', 'disconnected', 'connected', 'recording'].includes(status)) {
        updates.mux_status = status;
        if (status === 'active') updates.is_live = true;
        if (status === 'idle') updates.is_live = false;
      }
      if (Object.keys(updates).length > 1) await supabase.from('events').update(updates).eq('mux_live_stream_id', data.id);
    } else if ((type === 'video.asset.ready' || type === 'video.asset.live_stream_completed') && data.live_stream_id) {
      const playbackId = (data.playback_ids || [])[0]?.id;
      if (playbackId) {
        await supabase.from('events').update({ mux_recording_playback_id: playbackId, updated_at: now }).eq('mux_live_stream_id', data.live_stream_id);
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error('[Mux] webhook failed:', error.message);
    res.status(500).json({ message: 'Webhook handling failed' });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventPaid,
  getMuxStream,
  createMuxStream,
  resetMuxKey,
  deleteMuxStream,
  getPlayback,
  muxWebhook
};
