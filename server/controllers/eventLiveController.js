// Live events: admin start / stop, live chat, replay rules.
// Who can watch:
//   free event  → everyone, live and replay
//   paid event  → admins and members with a spectator pass; after the event ends, pass holders can watch the
//                 replay for 24 hours, then the replay closes for them
const supabase = require('../config/supabase');

const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
const REPLAY_HOURS = 24;

const isEnded = (e) => !!e.ended_at || ['completed', 'past'].includes(String(e.status || '').toLowerCase());
const endedAt = (e) => (e.ended_at ? new Date(e.ended_at) : isEnded(e) ? new Date(e.updated_at || e.date) : null);

/** { allowed, reason, replayUntil } for this viewer */
const accessFor = (event, user, hasTicket) => {
  if (user?.is_admin) return { allowed: true };
  if (isEnded(event) && event.replay_enabled === false) return { allowed: false, reason: 'no_replay', message: 'This event has ended and has no replay.' };
  if (!event.is_paid) return { allowed: true };
  if (!hasTicket) return { allowed: false, reason: 'locked', message: 'A spectator pass is needed to watch this event.' };
  if (isEnded(event)) {
    const until = new Date(endedAt(event).getTime() + REPLAY_HOURS * 3600e3);
    if (Date.now() > until.getTime()) return { allowed: false, reason: 'replay_expired', message: `The replay of this paid event was available for ${REPLAY_HOURS} hours after it ended and has now closed.`, replayUntil: until.toISOString() };
    return { allowed: true, replayUntil: until.toISOString() };
  }
  return { allowed: true };
};

const hasTicketFor = async (user, eventId) => {
  if (!user) return false;
  const { data } = await supabase.from('tickets').select('id, status, expires_at').eq('user_id', user.id).eq('event_id', eventId).in('status', ['active', 'used']);
  return (data || []).some((t) => !t.expires_at || new Date(t.expires_at) > new Date());
};

const loadEvent = async (id) => {
  if (!isUUID(id)) return null;
  const { data } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
  return data || null;
};

// POST /api/events/:id/live { action: 'start' | 'end' }  (admin)
const setLive = async (req, res) => {
  const event = await loadEvent(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const action = req.body?.action;
  const now = new Date().toISOString();
  let updates;
  if (action === 'start') updates = { status: 'live', is_live: true, started_at: event.started_at || now, ended_at: null, updated_at: now };
  else if (action === 'end') {
    updates = { status: 'completed', is_live: false, ended_at: now, updated_at: now };
    if (event.mux_live_stream_id) {
      // tells Mux the broadcast is over, so the recording is finished and ready for replay
      try { await require('../utils/mux').completeLiveStream(event.mux_live_stream_id); } catch (e) { console.warn('[live] Mux complete:', e.message); }
    }
  } else return res.status(400).json({ message: 'Choose start or end.' });
  const { data, error } = await supabase.from('events').update(updates).eq('id', event.id).select('id, status, is_live, started_at, ended_at').single();
  if (error) return res.status(500).json({ message: 'Could not update the event', error: error.message });
  await supabase.from('audit_logs').insert({ actor_id: req.user.id, action_type: `event_${action}`, metadata: { event: event.id } }).then(() => {}, () => {});
  res.json({ ...data, message: action === 'start' ? 'The event is live. Viewers see LIVE now.' : 'The event has ended. The replay stays on the page.' });
};

// PUT /api/events/:id/stream-settings { chatEnabled?, replayEnabled? }  (admin)
const updateStreamSettings = async (req, res) => {
  const event = await loadEvent(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const patch = {};
  if (typeof req.body?.chatEnabled === 'boolean') patch.chat_enabled = req.body.chatEnabled;
  if (typeof req.body?.replayEnabled === 'boolean') patch.replay_enabled = req.body.replayEnabled;
  // a finished event is listed in the public Past events only after an admin approves it
  if (typeof req.body?.replayApproved === 'boolean') patch.replay_approved = req.body.replayApproved;
  if (!Object.keys(patch).length) return res.status(400).json({ message: 'Nothing to change' });
  const { data, error } = await supabase.from('events').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', event.id).select('id, chat_enabled, replay_enabled, replay_approved').single();
  if (error) return res.status(500).json({ message: 'Could not save', error: error.message });
  res.json({ chatEnabled: data.chat_enabled, replayEnabled: data.replay_enabled, replayApproved: data.replay_approved === true });
};

// ---------------- live chat ----------------
const canChat = async (event, user) => {
  if (!event.chat_enabled) return { ok: false, message: 'Live chat is turned off for this event.' };
  if (!user) return { ok: false, message: 'Log in to chat.' };
  if (event.is_paid && !user.is_admin && !(await hasTicketFor(user, event.id))) return { ok: false, message: 'Chat is for spectator pass holders.' };
  return { ok: true };
};

// GET /api/events/:id/chat?after=<iso>
const listChat = async (req, res) => {
  const event = await loadEvent(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (!event.chat_enabled) return res.json({ enabled: false, messages: [] });
  if (event.is_paid && !(req.user?.is_admin) && !(await hasTicketFor(req.user, event.id))) return res.json({ enabled: true, locked: true, messages: [] });
  let q = supabase.from('event_chat_messages').select('id, name, body, is_admin, created_at, user_id').eq('event_id', event.id).order('created_at', { ascending: false }).limit(100);
  if (req.query.after && !Number.isNaN(Date.parse(req.query.after))) q = q.gt('created_at', new Date(req.query.after).toISOString());
  const { data, error } = await q;
  if (error) return res.status(500).json({ message: 'Could not load the chat', error: error.message });
  res.json({ enabled: true, messages: (data || []).reverse() });
};

// POST /api/events/:id/chat { body }
const lastPost = new Map(); // user id → time (one message every 3 seconds)
const postChat = async (req, res) => {
  const event = await loadEvent(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const gate = await canChat(event, req.user);
  if (!gate.ok) return res.status(403).json({ message: gate.message });
  const body = String(req.body?.body || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (!body) return res.status(400).json({ message: 'Write a message.' });
  const last = lastPost.get(req.user.id) || 0;
  if (Date.now() - last < 3000) return res.status(429).json({ message: 'Slow down a little.' });
  lastPost.set(req.user.id, Date.now());
  const { data, error } = await supabase.from('event_chat_messages')
    .insert({ event_id: event.id, user_id: req.user.id, name: req.user.username || req.user.name || 'Member', body, is_admin: !!req.user.is_admin })
    .select('id, name, body, is_admin, created_at, user_id').single();
  if (error) return res.status(500).json({ message: 'Message not sent', error: error.message });
  res.status(201).json(data);
};

// DELETE /api/events/:id/chat/:messageId  (admin)
const deleteChat = async (req, res) => {
  if (!isUUID(req.params.messageId)) return res.status(404).json({ message: 'Not found' });
  await supabase.from('event_chat_messages').delete().eq('id', req.params.messageId).eq('event_id', req.params.id);
  res.json({ ok: true });
};

module.exports = { accessFor, hasTicketFor, isEnded, setLive, updateStreamSettings, listChat, postChat, deleteChat, REPLAY_HOURS };
