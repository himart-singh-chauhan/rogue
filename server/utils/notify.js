const supabase = require('../config/supabase');

// The public website address, for links inside inbox messages (first entry of CLIENT_URLS).
const siteUrl = () => {
  const first = String(process.env.CLIENT_URLS || '').split(',')[0].trim().replace(/\/+$/, '');
  if (!first) return 'https://rogue-client.vercel.app';
  return /^https?:\/\//.test(first) ? first : `https://${first}`;
};

/**
 * Put a message in a member's inbox (Profile → Messages). Never throws: a failed
 * notification must not undo the action that triggered it.
 */
const notifyMember = async ({ userId, senderId = null, subject, body }) => {
  if (!userId || !subject || !body) return;
  const { error } = await supabase.from('messages').insert([{ sender_id: senderId, receiver_id: userId, subject, body }]);
  if (error) console.warn('[Inbox] could not notify member:', error.message);
};

module.exports = { notifyMember, siteUrl };
