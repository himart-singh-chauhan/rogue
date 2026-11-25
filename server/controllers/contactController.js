// Contact Us form (Curtis, Nov 26: "I send messages through the Contact page and never receive them").
// Each message is kept for Admin → Inquiries AND emailed to the right AMPEX address (Admin → System → Company &
// social links), with Reply-To set to the sender so answering the email goes straight back to them. Pictures and
// PDFs they attach go with the email. The sender gets a short "we received your message" confirmation.
const multer = require('multer');
const supabase = require('../config/supabase');
const email = require('../utils/email');
const { captchaProblem } = require('../utils/captcha');
const { notifyAdmins, siteUrl } = require('../utils/notify');
const { readCompany } = require('./companyController');

const MAX_FILES = 3;
const MAX_TOTAL = 4 * 1024 * 1024; // the whole request must stay under the server's 4.5 MB limit
const OK_TYPES = /^(image\/(jpeg|png|webp)|application\/pdf)$/;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: MAX_FILES, fileSize: MAX_TOTAL },
  fileFilter: (req, file, cb) => (OK_TYPES.test(file.mimetype) ? cb(null, true) : cb(Object.assign(new Error('Attach JPG, PNG or PDF files only. For videos, paste a YouTube or Google Drive link in your message.'), { status: 400 }))),
}).array('files', MAX_FILES);

// Which AMPEX address gets which kind of message
const MAILBOX_FOR = {
  'record submission': 'submissions',
  'media inquiry': 'partners',
  'partnership opportunity': 'partners',
  'advertising': 'partners',
};
const EMAIL_RE = /^[^\s@,;<>()"]+@[^\s@,;<>()"]+\.[a-z]{2,}$/i;
const text = (v, max) => String(v ?? '').replace(/\r\n/g, '\n').trim().slice(0, max);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const submitContact = (req, res) => upload(req, res, async (uploadError) => {
  if (uploadError) {
    const tooBig = uploadError.code === 'LIMIT_FILE_SIZE' || uploadError.code === 'LIMIT_FILE_COUNT';
    return res.status(400).json({ message: tooBig ? `Attach up to ${MAX_FILES} files, 4 MB in total. For videos, paste a link in your message.` : uploadError.message });
  }
  const b = req.body || {};
  const name = text(b.name, 120);
  const from = text(b.email, 200).toLowerCase();
  const subject = text(b.subject, 80) || 'General Question';
  const message = text(b.message, 5000);
  if (!name) return res.status(400).json({ message: 'Please enter your name.' });
  if (!EMAIL_RE.test(from)) return res.status(400).json({ message: 'Please enter a valid email address so we can reply.' });
  if (message.length < 2) return res.status(400).json({ message: 'Please write your message.' });
  const files = req.files || [];
  if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL) return res.status(400).json({ message: 'Attach up to 4 MB in total. For videos, paste a link in your message.' });
  const captcha = await captchaProblem(req);
  if (captcha) return res.status(400).json({ message: captcha, code: 'captcha_failed' });

  try {
    const fileNote = files.length ? `\n\nAttached: ${files.map((f) => f.originalname).join(', ')}` : '';
    const { data: saved, error } = await supabase.from('contact_messages').insert([{ name, email: from, subject, message: message + fileNote }]).select('id').single();
    if (error) throw error;

    const company = await readCompany().catch(() => null);
    const box = MAILBOX_FOR[subject.toLowerCase()] || 'support';
    const to = company?.emails?.[box] || company?.emails?.support || 'support@ampexworldrecords.com';
    let emailed = false;
    if (email.emailEnabled()) {
      const attachments = files.map((f) => ({ filename: f.originalname.replace(/[^\w.\- ]+/g, '_').slice(0, 100) || 'file', content: f.buffer, contentType: f.mimetype }));
      const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#111;max-width:640px">
<p style="margin:0 0 12px;color:#666;font-size:13px">New message from the Contact Us page on ${esc(siteUrl().replace(/^https?:\/\//, ''))}. Press Reply to answer ${esc(name)} directly.</p>
<table cellpadding="6" style="border-collapse:collapse;margin:0 0 14px">
<tr><td style="color:#666">Name</td><td><strong>${esc(name)}</strong></td></tr>
<tr><td style="color:#666">Email</td><td><a href="mailto:${esc(from)}">${esc(from)}</a></td></tr>
<tr><td style="color:#666">Subject</td><td>${esc(subject)}</td></tr>
${files.length ? `<tr><td style="color:#666">Files</td><td>${files.map((f) => esc(f.originalname)).join(', ')} (attached)</td></tr>` : ''}
</table>
<div style="white-space:pre-wrap;border-left:4px solid #FF6A00;padding:10px 14px;background:#fafafa">${esc(message)}</div>
</div>`;
      try {
        await email.send({ to, replyTo: `"${name.replace(/"/g, '')}" <${from}>`, subject: `[Contact] ${subject}: ${name}`, html, text: `From: ${name} <${from}>\nSubject: ${subject}\n\n${message}${fileNote}`, attachments });
        emailed = true;
      } catch (e) { console.error('[Contact] could not email', to, e.message); }
      // the sender's copy
      try {
        const confirm = email.buildEmail({
          subject: 'We received your message',
          body: `Thank you for contacting Ampex World Records. We received your message about "${subject}" and will reply to ${from} as soon as possible, usually within 1–2 business days.\n\nYour message:\n${message.slice(0, 1500)}`,
          member: { name }, kind: 'account',
        });
        await email.send({ to: from, replyTo: to, subject: confirm.subject, html: confirm.html, text: confirm.text });
      } catch (e) { console.warn('[Contact] confirmation not sent:', e.message); }
    }
    // also in the admins' inbox on the site (and Admin → Inquiries)
    await notifyAdmins({ subject: `Contact form: ${subject}`, body: `${name} (${from}) wrote:\n\n${message.slice(0, 2000)}${fileNote}${emailed ? `\n\nAlso emailed to ${to}.` : ''}`, link: `${siteUrl()}/admin`, linkText: 'Open Inquiries' });
    res.status(201).json({ id: saved.id, emailed, message: 'Thank you! Your message was sent. We emailed you a copy and will reply soon.' });
  } catch (e) {
    console.error('[Contact] error:', e.message);
    res.status(500).json({ message: 'Your message could not be sent. Please email support@ampexworldrecords.com.' });
  }
});

module.exports = { submitContact };
