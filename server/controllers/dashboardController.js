const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

// Admin views never receive password hashes.
const ADMIN_USER_COLUMNS =
  'id, name, email, is_admin, role, membership_type, account_status, suspended_until, suspension_reason, ban_reason, last_login_at, profile_image, username, phone, gender, dob, weight, weight_unit, height, height_unit, country, city, street_address, state, zip_code, member_number, ethnicity, created_at, updated_at';

// Strip characters that would break out of a PostgREST .or() filter string.
const cleanSearch = (s) => String(s || '').replace(/[,()*%\\]/g, ' ').trim();
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const tables = [
      'users', 'records', 'events', 'products', 'videos',
      'evidence', 'categories', 'age_groups', 'memberships',
      'tickets', 'contact_messages', 'record_meta'
    ];

    // Fetch counts for all tables in parallel
    const countPromises = tables.map(table =>
      supabase.from(table).select('*', { count: 'exact', head: true })
    );

    const countResults = await Promise.all(countPromises);

    // Map results to a key-value object
    const counts = {};
    tables.forEach((table, index) => {
      counts[table] = countResults[index].count || 0;
    });

    // Also get recent records & users for the UI
    const [
      { data: recentSubmissions },
      { data: recentUsers }
    ] = await Promise.all([
      supabase.from('records').select('id, title, status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('users').select('id, name, email, created_at').order('created_at', { ascending: false }).limit(5)
    ]);

    res.json({
      counts,
      recentSubmissions: recentSubmissions || [],
      recentUsers: recentUsers || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

// @desc    Suspend a user
// @route   PUT /api/admin/users/:id/suspend
// @access  Private/Admin
const suspendUser = async (req, res) => {
  const { reason, durationDays, suspendedUntil: untilFromClient } = req.body;

  try {
    let suspendedUntil = null;
    if (untilFromClient && !isNaN(new Date(untilFromClient))) {
      suspendedUntil = new Date(untilFromClient).toISOString();
    } else if (durationDays) {
      suspendedUntil = new Date(Date.now() + Number(durationDays) * 24 * 60 * 60 * 1000).toISOString();
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        account_status: 'suspended',
        suspended_until: suspendedUntil,
        suspension_reason: reason || null,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select(ADMIN_USER_COLUMNS);

    if (error) throw error;
    if (!user || !user.length) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User suspended successfully', user: user[0] });
  } catch (error) {
    res.status(400).json({ message: 'Error suspending user', error: error.message });
  }
};

// @desc    Ban a user
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
const banUser = async (req, res) => {
  const { reason } = req.body;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .update({
        account_status: 'banned',
        ban_reason: reason || null,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select(ADMIN_USER_COLUMNS);

    if (error) throw error;
    if (!user || !user.length) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User banned successfully', user: user[0] });
  } catch (error) {
    res.status(400).json({ message: 'Error banning user', error: error.message });
  }
};

// @desc    Unsuspend/Unban a user
// @route   PUT /api/admin/users/:id/unsuspend
// @access  Private/Admin
const unsuspendUser = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update({
        account_status: 'active',
        suspended_until: null,
        suspension_reason: null,
        ban_reason: null,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select(ADMIN_USER_COLUMNS);

    if (error) throw error;
    if (!user || !user.length) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User unsuspended successfully', user: user[0] });
  } catch (error) {
    res.status(400).json({ message: 'Error unsuspending user', error: error.message });
  }
};

// @desc    Reset user password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private/Admin
const resetUserPassword = async (req, res) => {
  // Admin panel sends { password }; older callers sent { newPassword }.
  const newPassword = req.body.newPassword || req.body.password;

  try {
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword), 10);

    const { data: user, error } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select(ADMIN_USER_COLUMNS);

    if (error) throw error;
    if (!user || !user.length) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User password reset successfully', user: user[0] });
  } catch (error) {
    res.status(400).json({ message: 'Error resetting password', error: error.message });
  }
};

// @desc    Get user activity
// @route   GET /api/admin/users/:id/activity
// @access  Private/Admin
const getUserActivity = async (req, res) => {
  try {
    const [{ data: userRecords, error }, { data: profile }] = await Promise.all([
      supabase
        .from('records')
        .select('id, title, category, status, value, unit, created_at')
        .eq('user_id', req.params.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('users')
        .select('id, name, email, account_status, created_at, last_login_at')
        .eq('id', req.params.id)
        .maybeSingle()
    ]);

    if (error) throw error;

    const submissionStats = {
      total: userRecords?.length || 0,
      verified: userRecords?.filter(r => r.status === 'verified')?.length || 0,
      pending: userRecords?.filter(r => r.status === 'pending')?.length || 0,
      rejected: userRecords?.filter(r => r.status === 'rejected')?.length || 0
    };

    res.json({
      userId: req.params.id,
      user: profile ? {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        accountStatus: profile.account_status,
        createdAt: profile.created_at
      } : null,
      lastLogin: profile?.last_login_at || null,
      totalSubmissions: submissionStats.total,
      submissions: userRecords || [],
      recentSubmissions: (userRecords || []).slice(0, 5),
      submissionStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user activity', error: error.message });
  }
};

// Helper to generate a unique Member Number in the format AWR-XXXXXX
const generateUniqueMemberNumber = async () => {
  let isUnique = false;
  let memberNumber = '';
  let attempts = 0;
  while (!isUnique && attempts < 15) {
    attempts++;
    const num = Math.floor(100000 + Math.random() * 900000);
    memberNumber = `AWR-${num}`;
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('member_number', memberNumber)
      .maybeSingle();
    if (!data && !error) {
      isUnique = true;
    }
  }
  if (!isUnique) {
    memberNumber = `AWR-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  return memberNumber;
};

// @desc    Get all users with filters
// @route   GET /api/admin/users/list/all
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    // The admin panel loads the list once and filters client-side, so the default page is large.
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 1000, 1), 1000);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const offset = (page - 1) * limit;
    const search = cleanSearch(req.query.search);

    let query = supabase
      .from('users')
      .select(ADMIN_USER_COLUMNS, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%,member_number.ilike.%${search}%`);
    }

    const { data: users, count, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error && error.code !== 'PGRST103') throw error;

    res.json({
      users: users || [],
      total: count || 0,
      page,
      pages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
  const { name, email, password, username, country, gender, dob, phone, city, role, membershipType, accountStatus } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const hashedPassword = await bcrypt.hash(String(password), 10);
    const assignedRole = role || 'athlete';
    const computedIsAdmin = assignedRole === 'system_admin';
    const memberNumber = await generateUniqueMemberNumber();

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email: String(email).trim().toLowerCase(),
        password: hashedPassword,
        username: username && String(username).trim() ? String(username).trim() : null,
        country,
        gender: gender || '',
        dob: dob ? dob : null,
        phone,
        city,
        role: assignedRole,
        membership_type: membershipType || 'free_athlete',
        account_status: accountStatus || 'active',
        is_admin: computedIsAdmin,
        member_number: memberNumber
      })
      .select(ADMIN_USER_COLUMNS);

    if (error) throw error;
    res.status(201).json({ message: 'User created successfully', user: user[0] });
  } catch (error) {
    if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
      res.status(400).json({ message: 'Email or username already exists' });
    } else {
      res.status(500).json({ message: 'Error creating user', error: error.message });
    }
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  const { name, email, username, country, gender, dob, phone, city, role, membershipType, accountStatus } = req.body;
  const updateData = {};

  try {
    if (name) updateData.name = name;
    if (email) updateData.email = String(email).trim().toLowerCase();
    if (username) updateData.username = username;
    if (country) updateData.country = country;
    if (gender) updateData.gender = gender;
    if (dob) updateData.dob = dob;
    if (phone) updateData.phone = phone;
    if (city) updateData.city = city;
    if (role) {
      updateData.role = role;
      updateData.is_admin = role === 'system_admin';
    }
    if (membershipType) updateData.membership_type = membershipType;
    if (accountStatus) updateData.account_status = accountStatus;
    updateData.updated_at = new Date();

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.params.id)
      .select(ADMIN_USER_COLUMNS);

    if (error) throw error;
    if (!user || !user.length) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated successfully', user: user[0] });
  } catch (error) {
    console.error("updateUser failed:", updateData, "id:", req.params.id, "error:", error.message);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Email or username already in use' });
    }
    res.status(500).json({ message: `Error updating user: ${error.message}` });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  suspendUser,
  banUser,
  unsuspendUser,
  resetUserPassword,
  getUserActivity,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};
