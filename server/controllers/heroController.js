// Homepage big featured video (beside Explore Categories), set in Admin → Homepage Control.
// mode 'video': an uploaded video or a YouTube/Vimeo link, labelled advertisement / commercial / advertiser video
// mode 'event': an event's live stream (or its picture and "Watch" button when the event is paid)
// mode 'auto' : the featured event, as before
const supabase = require('../config/supabase');

const KINDS = ['advertisement', 'commercial', 'advertiser', 'live'];
const clean = (v, max) => String(v ?? '').trim().slice(0, max);
const url = (v) => { const s = clean(v, 1000); return /^https?:\/\//i.test(s) || s.startsWith('/') ? s : ''; };
const DEFAULT = { mode: 'auto', kind: 'live', title: '', subtitle: '', videoUrl: '', posterUrl: '', linkUrl: '', linkText: '', eventId: '', side: { mode: 'auto', items: [] } };
const isId = (v) => /^[0-9a-f-]{36}$/i.test(String(v || ''));
// The three small videos beside the big one: 'auto' = live and upcoming streams; 'custom' = the admin's picks
// (an uploaded video / YouTube link, or an event), up to three
const cleanSide = (b = {}) => {
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 3).map((it) => (
    it?.type === 'event'
      ? (isId(it.eventId) ? { type: 'event', eventId: it.eventId } : null)
      : (url(it?.videoUrl) ? { type: 'video', videoUrl: url(it.videoUrl), posterUrl: url(it.posterUrl), title: clean(it.title, 120) } : null)
  )).filter(Boolean);
  return { mode: b.mode === 'custom' && items.length ? 'custom' : 'auto', items };
};

const read = async () => {
  const { data } = await supabase.from('system_settings').select('value').eq('key', 'homepage_hero').maybeSingle();
  try { const v = { ...DEFAULT, ...(JSON.parse(data?.value || '{}') || {}) }; return { ...v, side: cleanSide(v.side) }; } catch { return DEFAULT; }
};

// GET /api/settings/homepage-hero  (public)
const getHero = async (req, res) => res.json(await read());

// PUT /api/admin/homepage-hero  (admin)
const saveHero = async (req, res) => {
  const b = req.body || {};
  const hero = {
    mode: ['video', 'event', 'auto'].includes(b.mode) ? b.mode : 'auto',
    kind: KINDS.includes(b.kind) ? b.kind : 'advertisement',
    title: clean(b.title, 120),
    subtitle: clean(b.subtitle, 200),
    videoUrl: url(b.videoUrl),
    posterUrl: url(b.posterUrl),
    linkUrl: url(b.linkUrl),
    linkText: clean(b.linkText, 40),
    eventId: isId(b.eventId) ? b.eventId : '',
    side: cleanSide(b.side),
  };
  if (b.side?.mode === 'custom' && !hero.side.items.length) return res.status(400).json({ message: 'Add at least one small video, or choose "Live and upcoming streams".' });
  if (hero.mode === 'video' && !hero.videoUrl) return res.status(400).json({ message: 'Upload the video or paste its link.' });
  if (hero.mode === 'event' && !hero.eventId) return res.status(400).json({ message: 'Choose the event to show.' });
  const { error } = await supabase.from('system_settings').upsert({ key: 'homepage_hero', value: JSON.stringify(hero) }, { onConflict: 'key' });
  if (error) return res.status(500).json({ message: 'Could not save', error: error.message });
  res.json({ ...hero, message: 'Homepage video saved.' });
};

module.exports = { getHero, saveHero };
