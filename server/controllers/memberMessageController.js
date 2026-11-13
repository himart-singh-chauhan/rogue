// Members message each other (for example to call someone out on a record). Messages land in the
// receiver's Messages tab on their profile, next to the notices from the AMPEX team.
const supabase = require('../config/supabase');

const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
const clean = (v, max) => String(v ?? '').trim().slice(0, max);
const PER_HOUR = 15;
const PER_DAY = 60;

const INBOX_FULL = 'id, subject, body, is_read, created_at, is_member_message, record_id, sender:sender_id(id, name, username, profile_image, is_admin), record:record_id(id, title)';
const INBOX_BASIC = 'id, subject, body, is_read, created_at, sender:sender_id(id, name, username, profile_image, is_admin)';

// GET /api/messages  (my inbox)
const inbox = async (req, res) => {
  let { data, error } = await supabase.from('messages').select(INBOX_FULL).eq('receiver_id', req.user.id).order('created_at', { ascending: false }).limit(200);
  if (error) ({ data, error } = await supabase.from('messages').select(INBOX_BASIC).eq('receiver_id', req.user.id).order('created_at', { ascending: false }).limit(200));
  if (error) return res.status(500).json({ message: 'Could not load messages', error: error.message });
  res.json(data || []);
};

// GET /api/messages/sent
const sent = async (req, res) => {
  const { data, error } = await supabase.from('messages')
    .select('id, subject, body, is_read, created_at, record_id, receiver:receiver_id(id, name, username, profile_image), record:record_id(id, title)')
    .eq('sender_id', req.user.id).eq('is_member_message', true)
    .order('created_at', { ascending: false }).limit(200);
  if (error) {
    if (/is_member_message|record_id/.test(error.message)) return res.json([]); // before the migration
    return res.status(500).json({ message: 'Could not load sent messages', error: error.message });
  }
  res.json(data || []);
};

// GET /api/messages/recipients?q=  (find a member to write to)
const searchRecipients = async (req, res) => {
  const q = clean(req.query.q, 60).replace(/[,()%*]/g, ' ').trim();
  if (q.length < 2) return res.json([]);
  const { data, error } = await supabase.from('users')
    .select('id, name, username, profile_image, account_status')
    .or(`name.ilike.%${q}%,username.ilike.%${q}%`)
    .neq('id', req.user.id)
    .limit(10);
  if (error) return res.status(500).json({ message: 'Could not search members', error: error.message });
  res.json((data || []).filter((u) => !u.account_status || u.account_status === 'active').map(({ account_status, ...u }) => u));
};

// POST /api/messages { toUserId | toUsername, subject, body, recordId? }
const sendToMember = async (req, res) => {
  const b = req.body || {};
  const subject = clean(b.subject, 150);
  const body = clean(b.body, 5000);
  if (!subject) return res.status(400).json({ message: 'Write a subject.' });
  if (!body) return res.status(400).json({ message: 'Write your message.' });

  let receiver = null;
  if (isUUID(b.toUserId)) receiver = (await supabase.from('users').select('id, name, account_status').eq('id', b.toUserId).maybeSingle()).data;
  else if (b.toUsername) receiver = (await supabase.from('users').select('id, name, account_status').ilike('username', clean(b.toUsername, 60)).maybeSingle()).data;
  if (!receiver) return res.status(404).json({ message: 'That member was not found.' });
  if (receiver.id === req.user.id) return res.status(400).json({ message: 'You cannot message yourself.' });
  if (receiver.account_status && receiver.account_status !== 'active') return res.status(400).json({ message: 'This member cannot receive messages right now.' });

  // Limits stop spam: a few messages an hour is plenty for call-outs and replies
  if (!req.user.is_admin) {
    const since = (ms) => new Date(Date.now() - ms).toISOString();
    const count = async (ms) => (await supabase.from('messages').select('id', { count: 'exact', head: true })
      .eq('sender_id', req.user.id).eq('is_member_message', true).gte('created_at', since(ms))).count || 0;
    if (await count(3600e3) >= PER_HOUR) return res.status(429).json({ message: `You can send up to ${PER_HOUR} messages an hour. Please try again a little later.` });
    if (await count(86400e3) >= PER_DAY) return res.status(429).json({ message: `You can send up to ${PER_DAY} messages a day.` });
  }

  const recordId = isUUID(b.recordId) ? b.recordId : null;
  const { data, error } = await supabase.from('messages')
    .insert({ sender_id: req.user.id, receiver_id: receiver.id, subject, body, record_id: recordId, is_member_message: true })
    .select('id, subject, created_at').single();
  if (error) return res.status(500).json({ message: 'Message could not be sent', error: error.message });
  res.status(201).json({ ...data, message: `Message sent to ${receiver.name || 'the member'}.` });
};

module.exports = { inbox, sent, searchRecipients, sendToMember };
