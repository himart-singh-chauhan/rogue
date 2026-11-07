const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect, admin } = require('../middleware/authMiddleware');

// Countries live in the database (they used to be in data/countries.json, which Render's
// ephemeral disk reset on every deploy). The JSON file is kept as the fallback/seed list.
const fallbackCountries = require('../data/countries.json');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('countries').select('name, code, flag, competitors').order('name');
    if (error) throw error;
    res.json(data && data.length ? data : fallbackCountries);
  } catch (err) {
    console.error('Countries lookup failed, serving fallback list:', err.message);
    res.json(fallbackCountries);
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, code, flag } = req.body;
    if (!name || !code || !flag) {
      return res.status(400).json({ message: 'Name, code, and flag are required' });
    }
    const { data, error } = await supabase
      .from('countries')
      .insert([{ name: String(name).trim(), code: String(code).trim().toUpperCase(), flag, competitors: 0 }])
      .select('name, code, flag, competitors')
      .single();
    if (error) {
      if (error.code === '23505') return res.status(400).json({ message: 'That country code already exists' });
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error adding country', error: err.message });
  }
});

module.exports = router;
