const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Returns a reason string if the account must not be used right now, otherwise null.
const accountBlockReason = (user) => {
  if (!user) return 'Not authorized, user not found';
  if (user.account_status === 'banned') return 'This account has been banned.';
  if (user.account_status === 'suspended') {
    // A suspension with an end date in the past has expired.
    if (!user.suspended_until || new Date(user.suspended_until) > new Date()) {
      return 'This account is suspended.';
    }
  }
  return null;
};

const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, username, profile_image, is_admin, role, account_status, suspended_until')
      .eq('id', decoded.id)
      .maybeSingle();

    if (error) {
      console.error('Auth lookup failed:', error.message);
      return res.status(503).json({ message: 'Authentication service unavailable, please try again.' });
    }

    const blocked = accountBlockReason(user);
    if (blocked) {
      return res.status(401).json({ message: blocked });
    }

    req.user = user;
    return next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(503).json({ message: 'Authentication service unavailable, please try again.' });
  }
};

// Like protect, but never rejects: sets req.user when a valid token is present.
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, username, profile_image, is_admin, role, account_status, suspended_until')
      .eq('id', decoded.id)
      .maybeSingle();
    if (user && !accountBlockReason(user)) req.user = user;
  } catch (err) {
    // invalid token: continue as anonymous
  }
  return next();
};

const admin = (req, res, next) => {
  if (req.user && req.user.is_admin) {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized as an admin' });
};

module.exports = { protect, optionalAuth, admin, accountBlockReason };
