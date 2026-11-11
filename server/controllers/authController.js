const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const { accountBlockReason } = require('../middleware/authMiddleware');
const { tierFor } = require('../utils/rankings');
const rewards = require('../utils/rewards');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Every column of users EXCEPT the password hash.
const SAFE_USER_COLUMNS =
  'id, name, email, is_admin, role, membership_type, account_status, suspended_until, profile_image, username, phone, gender, dob, weight, weight_unit, height, height_unit, country, city, street_address, state, zip_code, member_number, ethnicity, created_at, updated_at';

// Columns shown on public athlete profiles (MemberProfilePage).
const PUBLIC_USER_COLUMNS =
  'id, name, username, profile_image, role, membership_type, gender, dob, weight, weight_unit, height, height_unit, country, city, state, street_address, zip_code, email, phone, member_number, created_at';

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

// One shape for login / register / profile responses so the frontend session object is always complete.
const serializeUser = (u, withToken = false) => {
  const out = {
    _id: u.id,
    id: u.id,
    name: u.name,
    email: u.email,
    isAdmin: !!u.is_admin,
    profileImage: u.profile_image || '',
    username: u.username || '',
    phone: u.phone || '',
    gender: u.gender || '',
    dob: u.dob || '',
    weight: u.weight || '',
    weightUnit: u.weight_unit || 'kg',
    height: u.height || '',
    heightUnit: u.height_unit || 'cm',
    country: u.country || '',
    city: u.city || '',
    streetAddress: u.street_address || '',
    state: u.state || '',
    zipCode: u.zip_code || '',
    ethnicity: u.ethnicity || '',
    role: u.role || 'athlete',
    membershipType: u.membership_type || 'free_athlete',
    accountStatus: u.account_status || 'active',
    memberNumber: u.member_number || '',
  };
  if (withToken) out.token = generateToken(u.id);
  return out;
};

// Helper to generate a unique Member Number in the format AWR-XXXXXX
const generateUniqueMemberNumber = async () => {
  for (let attempts = 0; attempts < 15; attempts++) {
    const memberNumber = `AWR-${Math.floor(100000 + Math.random() * 900000)}`;
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('member_number', memberNumber)
      .maybeSingle();
    if (!data && !error) return memberNumber;
  }
  return `AWR-${Math.floor(100000 + Math.random() * 900000)}`;
};

// Legacy users may not have a member number yet.
const ensureMemberNumber = async (user) => {
  if (user.member_number) return user;
  const memberNumber = await generateUniqueMemberNumber();
  const { data: updated } = await supabase
    .from('users')
    .update({ member_number: memberNumber })
    .eq('id', user.id)
    .select(SAFE_USER_COLUMNS)
    .maybeSingle();
  return updated || { ...user, member_number: memberNumber };
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select(`${SAFE_USER_COLUMNS}, password`)
      .ilike('email', email)
      .maybeSingle();

    if (error) {
      console.error('Login lookup failed:', error.message);
      return res.status(503).json({ message: 'Login is temporarily unavailable. Please try again.' });
    }

    if (!user || !user.password || !(await bcrypt.compare(String(password), user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const blocked = accountBlockReason(user);
    if (blocked) {
      return res.status(403).json({ message: blocked });
    }

    delete user.password;
    // Best effort: powers "Last Login" in the admin activity view.
    await supabase.from('users').update({ last_login_at: new Date() }).eq('id', user.id);
    const finalUser = await ensureMemberNumber(user);
    return res.json(serializeUser(finalUser, true));
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const {
      name, password,
      username, phone, gender, dob,
      weight, weightUnit, height, heightUnit,
      country, city, streetAddress, state, zipCode, ethnicity,
    } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const { data: userExists, error: existsError } = await supabase
      .from('users')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existsError) {
      console.error('Register lookup failed:', existsError.message);
      return res.status(503).json({ message: 'Registration is temporarily unavailable. Please try again.' });
    }
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const cleanUsername = typeof username === 'string' && username.trim() ? username.trim() : null;
    if (cleanUsername) {
      const { data: nameTaken } = await supabase
        .from('users')
        .select('id')
        .ilike('username', cleanUsername)
        .maybeSingle();
      if (nameTaken) {
        return res.status(400).json({ message: 'That username is already taken' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);
    const memberNumber = await generateUniqueMemberNumber();

    const newUser = {
      name,
      email,
      password: hashedPassword,
      is_admin: false,
      profile_image: '',
      username: cleanUsername,
      phone: phone || '',
      gender: gender || '',
      dob: dob || null,
      weight: weight ? String(weight) : null,
      weight_unit: weightUnit || 'kg',
      height: height ? String(height) : null,
      height_unit: heightUnit || 'cm',
      country: country || '',
      city: city || '',
      street_address: streetAddress || '',
      state: state || '',
      zip_code: zipCode || '',
      ethnicity: ethnicity || '',
      role: 'athlete',
      membership_type: 'free_athlete',
      account_status: 'active',
      member_number: memberNumber,
    };

    const { data: user, error } = await supabase
      .from('users')
      .insert([newUser])
      .select(SAFE_USER_COLUMNS)
      .single();

    if (error || !user) {
      console.error('Supabase signup error:', error);
      return res.status(400).json({ message: 'Could not create the account. Please check your details.' });
    }

    // Rewards program: every member gets a referral code; a ?ref=CODE sign-up is credited to the referrer
    await rewards.ensureReferralCode(user.id).catch(() => null);
    if (req.body.referralCode) {
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;
      await rewards.recordReferralAtSignup({ newUserId: user.id, newUserEmail: email, code: req.body.referralCode, ip });
    }

    return res.status(201).json(serializeUser(user, true));
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(SAFE_USER_COLUMNS)
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) {
      console.error('Supabase fetch profile error:', error.message);
      return res.status(500).json({ message: 'Could not load profile' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const finalUser = await ensureMemberNumber(user);
    return res.json(serializeUser(finalUser));
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ message: 'Could not load profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const { data: user, error: getError } = await supabase
      .from('users')
      .select(`${SAFE_USER_COLUMNS}, password`)
      .eq('id', req.user.id)
      .maybeSingle();

    if (getError) {
      return res.status(500).json({ message: 'Could not load profile' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      name, password, currentPassword, profileImage,
      username, phone, gender, dob,
      weight, weightUnit, height, heightUnit,
      country, city, streetAddress, state, zipCode, ethnicity,
    } = req.body;
    const email = req.body.email !== undefined ? normalizeEmail(req.body.email) : undefined;

    const pick = (incoming, current) => (incoming !== undefined ? incoming : current);

    const updates = {
      name: name || user.name,
      email: email || user.email,
      profile_image: pick(profileImage, user.profile_image),
      phone: pick(phone, user.phone),
      gender: pick(gender, user.gender),
      dob: dob === '' ? null : pick(dob, user.dob),
      weight: weight === '' ? null : pick(weight, user.weight),
      weight_unit: pick(weightUnit, user.weight_unit),
      height: height === '' ? null : pick(height, user.height),
      height_unit: pick(heightUnit, user.height_unit),
      country: pick(country, user.country),
      city: pick(city, user.city),
      street_address: pick(streetAddress, user.street_address),
      state: pick(state, user.state),
      zip_code: pick(zipCode, user.zip_code),
      ethnicity: pick(ethnicity, user.ethnicity),
      updated_at: new Date(),
    };

    if (username !== undefined) {
      const cleanUsername = typeof username === 'string' && username.trim() ? username.trim() : null;
      if (cleanUsername && cleanUsername.toLowerCase() !== (user.username || '').toLowerCase()) {
        const { data: nameTaken } = await supabase
          .from('users')
          .select('id')
          .ilike('username', cleanUsername)
          .neq('id', user.id)
          .maybeSingle();
        if (nameTaken) {
          return res.status(400).json({ message: 'That username is already taken' });
        }
      }
      updates.username = cleanUsername;
    }

    if (email && email !== (user.email || '').toLowerCase()) {
      const { data: emailTaken } = await supabase
        .from('users')
        .select('id')
        .ilike('email', email)
        .neq('id', user.id)
        .maybeSingle();
      if (emailTaken) {
        return res.status(400).json({ message: 'That email is already in use' });
      }
    }

    if (password) {
      // Changing the password requires the current one, so a stolen session can't take over the account.
      if (!currentPassword || !(await bcrypt.compare(String(currentPassword), user.password || ''))) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      if (String(password).length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(String(password), salt);
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select(SAFE_USER_COLUMNS)
      .single();

    if (updateError || !updatedUser) {
      console.error('Profile update error:', updateError);
      return res.status(400).json({ message: 'Could not update profile' });
    }

    return res.json(serializeUser(updatedUser, true));
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ message: 'Could not update profile' });
  }
};

// @desc    Get public user profile
// @route   GET /api/auth/profile/:username
// @access  Public
const getPublicUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username);
    const query = supabase.from('users').select(PUBLIC_USER_COLUMNS);
    const { data: user, error } = await (isUUID ? query.eq('id', username) : query.ilike('username', username)).maybeSingle();

    if (error) {
      console.error('Public profile lookup failed:', error.message);
      return res.status(500).json({ message: 'Could not load profile' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Private details are shown only to the member themselves and to admins
    const canSeePrivate = !!req.user && (String(req.user.id) === String(user.id) || !!req.user.is_admin);
    if (!canSeePrivate) {
      ['email', 'phone', 'street_address', 'zip_code', 'dob'].forEach((k) => { delete user[k]; });
    }
    user.private_visible = canSeePrivate;

    // Fetch user's records (internal review fields and witness contacts stay private)
    const { data: userRecords } = await supabase
      .from('records')
      .select('id, title, category, description, value, unit, status, record_type, evidence_url, thumbnail_url, video_url, venue_name, city, country, state, is_featured, views, date_set, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const verifiedRecords = userRecords ? userRecords.filter((r) => r.status === 'verified') : [];
    const verifiedCount = verifiedRecords.length;

    // Ranking stats, computed from live data so a new athlete's profile is never blank.
    const [{ data: rankingRow }, { data: allVerified }, { count: issuedCerts }] = await Promise.all([
      supabase.from('user_rankings').select('total_points, tier_badge').eq('user_id', user.id).maybeSingle(),
      supabase.from('records').select('user_id, category').eq('status', 'verified'),
      supabase.from('certificate_issuances').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'issued'),
    ]);

    const totalPoints = rankingRow?.total_points ?? 0;

    // Global rank: 1 + athletes with more points (falls back to verified-record count when nobody has points yet)
    let globalRank = 0;
    if (rankingRow) {
      const { count: ahead } = await supabase
        .from('user_rankings')
        .select('id', { count: 'exact', head: true })
        .gt('total_points', totalPoints);
      globalRank = (ahead || 0) + 1;
    } else if (verifiedCount > 0) {
      const perUser = {};
      (allVerified || []).forEach((r) => { perUser[r.user_id] = (perUser[r.user_id] || 0) + 1; });
      globalRank = Object.values(perUser).filter((c) => c > verifiedCount).length + 1;
    }

    // Category placements: rank athletes inside each category by verified records
    const byCategory = {};
    (allVerified || []).forEach((r) => {
      const cat = (r.category || 'Uncategorized').trim();
      byCategory[cat] = byCategory[cat] || {};
      byCategory[cat][r.user_id] = (byCategory[cat][r.user_id] || 0) + 1;
    });
    let firstPlace = 0;
    let top10 = 0;
    const categoryRanks = [];
    for (const [cat, counts] of Object.entries(byCategory)) {
      const mine = counts[user.id];
      if (!mine) continue;
      const rank = Object.values(counts).filter((c) => c > mine).length + 1; // ties share the place
      categoryRanks.push({ category: cat, rank, records: mine });
      if (rank === 1) firstPlace++;
      if (rank <= 10) top10++;
    }

    const ranking = {
      global_rank: globalRank,
      total_points: totalPoints,
      verified_records_count: verifiedCount,
      world_records_count: verifiedCount, // every verified record is an official world record
      tier_badge: rankingRow?.tier_badge || tierFor(totalPoints),
      first_place_categories: firstPlace,
      top_10_placements: top10,
      category_ranks: categoryRanks.sort((a, b) => a.rank - b.rank),
      medals_earned: firstPlace,
      certificates_earned: issuedCerts || 0,
    };

    // VIP badge: granted by an admin (VIP Competitors tab) or included in the member's plan (VIP profile)
    const [{ data: vipRow }, { data: activeMem }] = await Promise.all([
      supabase.from('vip_competitors').select('vip_status, is_verified').eq('user_id', user.id).maybeSingle(),
      supabase.from('memberships').select('tier').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
    ]);
    let planVip = false;
    if (activeMem?.tier) {
      const { data: plan } = await supabase.from('membership_plans').select('vip_profile').eq('slug', activeMem.tier).maybeSingle();
      planVip = !!plan?.vip_profile;
    }
    const granted = vipRow?.vip_status && vipRow.vip_status !== 'none' ? vipRow.vip_status : null;
    ranking.vip = { status: granted || (planVip ? 'member' : null), verified: !!vipRow?.is_verified };
    // Rewards level (AMPEX Ambassador badge at the top level)
    try {
      const r = await rewards.summaryFor(user.id);
      ranking.rewards = r.enabled ? { level: r.level, isAmbassador: r.isAmbassador, points: r.points } : null;
    } catch { ranking.rewards = null; }

    return res.json({ profile: user, ranking, records: userRecords || [] });
  } catch (err) {
    console.error('Public profile error:', err);
    return res.status(500).json({ message: 'Could not load profile' });
  }
};

module.exports = {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getPublicUserProfile,
  serializeUser,
  SAFE_USER_COLUMNS,
};
