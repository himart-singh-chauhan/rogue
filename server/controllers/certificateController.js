const crypto = require('crypto');
const supabase = require('../config/supabase');
const { notifyMember, siteUrl } = require('../utils/notify');

// Certificates are never issued automatically: an administrator approves each one.
// The PDF is drawn in the browser from the template image + these stored details.

const formatTemplate = (t) => t && ({
  id: t.id,
  name: t.name,
  kind: t.kind,
  imageUrl: t.image_url,
  orientation: t.orientation,
  layout: t.layout || {},
  achievement: t.achievement,
  isDefault: !!t.is_default,
  active: t.active !== false,
  createdAt: t.created_at,
});

const formatIssuance = (c) => ({
  id: c.id,
  certificateNumber: c.certificate_number,
  status: c.status,
  recipientName: c.recipient_name,
  recordTitle: c.record_title,
  recordValue: c.record_value,
  dateAchieved: c.date_achieved,
  dateVerified: c.date_verified,
  issuedAt: c.issued_at,
  revokedAt: c.revoked_at,
  revokeReason: c.revoke_reason,
  downloadCount: c.download_count || 0,
  recordId: c.record_id,
  userId: c.user_id,
  template: formatTemplate(c.template),
});

const newCertificateNumber = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = Array.from(crypto.randomBytes(6), (b) => alphabet[b % alphabet.length]).join('');
  return `AMPEX-${new Date().getUTCFullYear()}-${part}`;
};

const ISSUANCE_SELECT = '*, template:certificate_templates(*)';

// ---------------- Templates (admin) ----------------
const listTemplates = async (req, res) => {
  const { data, error } = await supabase.from('certificate_templates').select('*').order('is_default', { ascending: false }).order('created_at');
  if (error) return res.status(500).json({ message: 'Could not load templates', error: error.message });
  res.json((data || []).map(formatTemplate));
};

const LAYOUT_PRESETS = ['ampex-landscape', 'ampex-portrait', 'generic-landscape', 'generic-portrait'];

const createTemplate = async (req, res) => {
  const { name, kind, imageUrl, orientation, layoutPreset, achievement, isDefault } = req.body;
  if (!name || !imageUrl) return res.status(400).json({ message: 'Template name and image are required' });
  const orient = orientation === 'portrait' ? 'portrait' : 'landscape';
  const row = {
    name: String(name).slice(0, 150),
    kind: kind === 'award' ? 'award' : 'certificate',
    image_url: imageUrl,
    orientation: orient,
    layout: { preset: LAYOUT_PRESETS.includes(layoutPreset) ? layoutPreset : `generic-${orient}` },
    achievement: String(achievement || 'any').slice(0, 60),
    is_default: !!isDefault,
    created_by: req.user.id,
  };
  if (row.is_default) await supabase.from('certificate_templates').update({ is_default: false }).eq('kind', row.kind);
  const { data, error } = await supabase.from('certificate_templates').insert([row]).select().single();
  if (error) return res.status(500).json({ message: 'Could not save template', error: error.message });
  res.status(201).json(formatTemplate(data));
};

const updateTemplate = async (req, res) => {
  const { name, achievement, isDefault, active, layoutPreset, orientation, imageUrl, kind } = req.body;
  const updates = { updated_at: new Date() };
  if (name !== undefined) updates.name = String(name).slice(0, 150);
  if (imageUrl) updates.image_url = String(imageUrl).slice(0, 1000);
  if (kind !== undefined) updates.kind = kind === 'award' ? 'award' : 'certificate';
  if (achievement !== undefined) updates.achievement = String(achievement).slice(0, 60);
  if (active !== undefined) updates.active = !!active;
  if (orientation !== undefined) updates.orientation = orientation === 'portrait' ? 'portrait' : 'landscape';
  if (layoutPreset !== undefined && LAYOUT_PRESETS.includes(layoutPreset)) updates.layout = { preset: layoutPreset };
  if (isDefault) {
    const { data: cur } = await supabase.from('certificate_templates').select('kind').eq('id', req.params.id).maybeSingle();
    await supabase.from('certificate_templates').update({ is_default: false }).eq('kind', updates.kind || cur?.kind || 'certificate');
    updates.is_default = true;
  } else if (isDefault === false) {
    updates.is_default = false;
  }
  if (updates.active === false) updates.is_default = false; // an archived template cannot stay the default
  const { data, error } = await supabase.from('certificate_templates').update(updates).eq('id', req.params.id).select().maybeSingle();
  if (error) return res.status(500).json({ message: 'Could not update template', error: error.message });
  if (!data) return res.status(404).json({ message: 'Template not found' });
  res.json(formatTemplate(data));
};

const deleteTemplate = async (req, res) => {
  const { count } = await supabase.from('certificate_issuances').select('id', { count: 'exact', head: true }).eq('template_id', req.params.id);
  if (count > 0) {
    await supabase.from('certificate_templates').update({ active: false, is_default: false }).eq('id', req.params.id);
    return res.json({ message: 'Template is used by issued certificates, so it was archived instead of deleted', archived: true });
  }
  const { error } = await supabase.from('certificate_templates').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: 'Could not delete template', error: error.message });
  res.json({ message: 'Template deleted' });
};

// ---------------- Issuance (admin) ----------------

// Verified records that do not have an issued certificate yet
const getApprovalQueue = async (req, res) => {
  const [{ data: recs, error }, { data: issued }] = await Promise.all([
    supabase
      .from('records')
      .select('id, title, category, value, unit, date_set, created_at, verified_at, record_type, user_id, athlete_id, thumbnail_url, user:users!records_user_id_fkey(id, name, username)')
      .eq('status', 'verified')
      .order('verified_at', { ascending: false, nullsFirst: false }),
    supabase.from('certificate_issuances').select('record_id').eq('status', 'issued'),
  ]);
  if (error) return res.status(500).json({ message: 'Could not load the approval queue', error: error.message });
  const done = new Set((issued || []).map((i) => i.record_id));
  res.json((recs || []).filter((r) => !done.has(r.id)).map((r) => ({
    recordId: r.id,
    recipientName: r.user?.name || r.athlete_id || 'Athlete',
    recordTitle: r.title,
    recordValue: [r.value, r.unit].filter(Boolean).join(' '),
    category: r.category,
    recordType: r.record_type,
    dateAchieved: (r.date_set || r.created_at || '').slice(0, 10),
    dateVerified: (r.verified_at || '').slice(0, 10) || null,
    thumbnailUrl: r.thumbnail_url,
    userId: r.user_id,
  })));
};

const listIssued = async (req, res) => {
  const { data, error } = await supabase.from('certificate_issuances').select(ISSUANCE_SELECT).order('issued_at', { ascending: false }).limit(500);
  if (error) return res.status(500).json({ message: 'Could not load certificates', error: error.message });
  res.json((data || []).map(formatIssuance));
};

// POST /api/certificates/admin/issue  — the administrator's personal approval
const issueCertificate = async (req, res) => {
  const { recordId, templateId, recipientName, recordTitle, recordValue, dateAchieved, dateVerified } = req.body;
  const { data: rec, error: recError } = await supabase
    .from('records')
    .select('id, title, value, unit, status, user_id, athlete_id, date_set, created_at, verified_at, user:users!records_user_id_fkey(name)')
    .eq('id', recordId)
    .maybeSingle();
  if (recError || !rec) return res.status(404).json({ message: 'Record not found' });
  if (rec.status !== 'verified') return res.status(400).json({ message: 'Only verified records can receive a certificate' });

  let template = null;
  if (templateId) {
    ({ data: template } = await supabase.from('certificate_templates').select('*').eq('id', templateId).maybeSingle());
  } else {
    ({ data: template } = await supabase.from('certificate_templates').select('*').eq('kind', 'certificate').eq('is_default', true).maybeSingle());
  }
  if (!template) return res.status(400).json({ message: 'Choose a certificate template' });

  const row = {
    certificate_number: newCertificateNumber(),
    record_id: rec.id,
    user_id: rec.user_id,
    template_id: template.id,
    status: 'issued',
    recipient_name: String(recipientName || rec.user?.name || rec.athlete_id || 'Athlete').slice(0, 120),
    record_title: String(recordTitle || rec.title).slice(0, 200),
    record_value: String(recordValue || [rec.value, rec.unit].filter(Boolean).join(' ')).slice(0, 120),
    date_achieved: dateAchieved || (rec.date_set || rec.created_at || '').slice(0, 10) || null,
    date_verified: dateVerified || (rec.verified_at || new Date().toISOString()).slice(0, 10),
    issued_by: req.user.id,
  };
  const { data, error } = await supabase.from('certificate_issuances').insert([row]).select(ISSUANCE_SELECT).single();
  if (error) {
    if (error.code === '23505') return res.status(400).json({ message: 'This record already has an issued certificate' });
    return res.status(500).json({ message: 'Could not issue the certificate', error: error.message });
  }
  await supabase.from('audit_logs').insert({ actor_id: req.user.id, action_type: 'issue_certificate', metadata: { certificate: row.certificate_number, record: rec.id } });
  // The award also lands in the member's inbox (Profile → Messages)
  await notifyMember({
    userId: rec.user_id,
    senderId: req.user.id,
    subject: `Your AMPEX certificate is ready: ${row.record_title || 'World Record'}`,
    body: `Congratulations! Your official AMPEX World Records certificate has been issued.\n\n` +
      `Record: ${row.record_title || ''}${row.record_value ? ` (${row.record_value})` : ''}\n` +
      `Certificate number: ${row.certificate_number}\n\n` +
      `Download it as a PDF from your profile under Certificates. Anyone can check it is genuine at ${siteUrl()}/certificate/${row.certificate_number}`,
  });
  res.status(201).json(formatIssuance(data));
};

const revokeCertificate = async (req, res) => {
  const { data, error } = await supabase
    .from('certificate_issuances')
    .update({ status: 'revoked', revoked_at: new Date(), revoke_reason: String(req.body.reason || '').slice(0, 500) || null })
    .eq('id', req.params.id)
    .select(ISSUANCE_SELECT)
    .maybeSingle();
  if (error) return res.status(500).json({ message: 'Could not revoke', error: error.message });
  if (!data) return res.status(404).json({ message: 'Certificate not found' });
  res.json(formatIssuance(data));
};

// ---------------- Public / athlete ----------------

// GET /api/certificates/verify/:number  — anyone can check a certificate
const verifyCertificate = async (req, res) => {
  const number = String(req.params.number || '').trim().toUpperCase();
  const { data } = await supabase
    .from('certificate_issuances')
    .select('certificate_number, status, recipient_name, record_title, record_value, date_achieved, date_verified, issued_at, revoked_at')
    .eq('certificate_number', number)
    .maybeSingle();
  if (!data) return res.status(404).json({ valid: false, message: 'No certificate with that number exists' });
  res.json({
    valid: data.status === 'issued',
    status: data.status,
    certificateNumber: data.certificate_number,
    recipientName: data.recipient_name,
    recordTitle: data.record_title,
    recordValue: data.record_value,
    dateAchieved: data.date_achieved,
    dateVerified: data.date_verified,
    issuedAt: data.issued_at,
    revokedAt: data.revoked_at,
  });
};

// GET /api/certificates/mine
const getMyCertificates = async (req, res) => {
  const { data, error } = await supabase
    .from('certificate_issuances')
    .select(ISSUANCE_SELECT)
    .eq('user_id', req.user.id)
    .eq('status', 'issued')
    .order('issued_at', { ascending: false });
  if (error) return res.status(500).json({ message: 'Could not load certificates', error: error.message });
  res.json((data || []).map(formatIssuance));
};

// GET /api/certificates/:number/download  — owner or admin; counts downloads
const getCertificateForDownload = async (req, res) => {
  const number = String(req.params.number || '').trim().toUpperCase();
  const { data } = await supabase.from('certificate_issuances').select(ISSUANCE_SELECT).eq('certificate_number', number).maybeSingle();
  if (!data) return res.status(404).json({ message: 'Certificate not found' });
  if (!req.user.is_admin && String(data.user_id) !== String(req.user.id)) return res.status(403).json({ message: 'Not your certificate' });
  if (data.status !== 'issued' && !req.user.is_admin) return res.status(410).json({ message: 'This certificate has been revoked' });
  await supabase.from('certificate_issuances').update({ download_count: (data.download_count || 0) + 1 }).eq('id', data.id);
  res.json(formatIssuance(data));
};

module.exports = {
  listTemplates, createTemplate, updateTemplate, deleteTemplate,
  getApprovalQueue, listIssued, issueCertificate, revokeCertificate,
  verifyCertificate, getMyCertificates, getCertificateForDownload,
};
