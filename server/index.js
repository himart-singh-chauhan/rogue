const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set. Logins will fail until it is configured.');
}

const supabase = require('./config/supabase');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS: restrict to the site's own domains when CLIENT_URLS is set (comma separated),
// otherwise allow all origins (local development).
// Entries may be written with or without "https://" and a trailing slash; compare by host.
const allowedHosts = (process.env.CLIENT_URLS || '')
  .split(',')
  .map((o) => o.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
  .filter(Boolean);
const hostOf = (origin) => {
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    return '';
  }
};
app.use(
  cors(
    allowedHosts.length
      ? {
          origin: (origin, cb) => {
            if (!origin || allowedHosts.includes(hostOf(origin)) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
              return cb(null, true);
            }
            return cb(new Error('Not allowed by CORS'));
          },
        }
      : undefined
  )
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static folder for legacy local uploads (new uploads go to Supabase Storage)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check: confirms the API is up AND the database is reachable.
// Point an uptime monitor at /api/health so the free Supabase project never pauses for inactivity.
app.get('/api/health', async (req, res) => {
  try {
    const { error } = await supabase.from('system_settings').select('key', { head: true, count: 'exact' }).limit(1);
    if (error) throw error;
    res.json({ status: 'ok', database: 'ok', time: new Date().toISOString() });
  } catch (err) {
    console.error('Health check failed:', err.message);
    res.status(503).json({ status: 'degraded', database: 'unreachable' });
  }
});

// Routes
// Order matters: more specific prefixes are mounted before the routers they would otherwise
// fall into (/api/records/:id would swallow /api/records/explore; the admin router's
// protect+admin gate would block the PUBLIC /api/admin/videos/featured|newest lists).
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/records/explore', require('./routes/recordExploreRoutes'));
app.use('/api/records/meta', require('./routes/recordMetaRoutes'));
app.use('/api/records', require('./routes/recordRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/shop', require('./routes/shopRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/admin/videos', require('./routes/videoRoutes'));
app.use('/api/videos', require('./routes/videoRoutes')); // public alias: /api/videos/featured, /api/videos/newest
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/memberships', require('./routes/membershipRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/age-groups', require('./routes/ageGroupRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/rankings', require('./routes/rankingRoutes'));
app.use('/api/countries', require('./routes/countryRoutes'));
app.use('/api/sponsors', require('./routes/sponsorRoutes'));
app.use('/api/membership-plans', require('./routes/planRoutes'));
app.use('/api/weight-classes', require('./routes/weightClassRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.get('/api/settings/public', require('./controllers/adminExtrasController').getPublicSettings);
app.use('/api/social', require('./routes/socialRoutes'));

app.get('/', (req, res) => {
  res.send('AMPEX World Records API is running...');
});

// Unknown API routes -> JSON 404 instead of Express's HTML page
app.use('/api', (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error handling middleware (multer, CORS and thrown errors end up here)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  if (err.code === 'LIMIT_FILE_SIZE') statusCode = 413;
  else if (err.name === 'MulterError' || /Invalid .*format/i.test(err.message)) statusCode = 400;
  else if (err.message === 'Not allowed by CORS') statusCode = 403;
  if (statusCode >= 500) console.error(err);
  res.status(statusCode).json({
    message: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large.' : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

// On Vercel the platform invokes the exported app per request, so we must not listen.
// Locally (and on any traditional host) start a normal HTTP server.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 AMPEX World Records API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

module.exports = app;
