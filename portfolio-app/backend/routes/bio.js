
const express = require('express');
const db = require('../db');

const router = express.Router();
const FIELDS = ['name', 'headline', 'about', 'email', 'location', 'github_url', 'linkedin_url'];
const URL_FIELDS = ['github_url', 'linkedin_url'];


router.get('/', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM bio WHERE id = 1').get());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not read bio' });
  }
});


router.put('/', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM bio WHERE id = 1').get();
    const data = { ...existing, ...(req.body || {}) };

    const values = {};
    for (const field of FIELDS) {
      let value = String(data[field] ?? '').trim();
      if (value.length > 3000) {
        return res.status(400).json({ error: `${field} is too long` });
      }
      if (URL_FIELDS.includes(field)) {
        if (value && !(value.startsWith('http://') || value.startsWith('https://'))) {
          return res.status(400).json({ error: `${field} must start with http:// or https://` });
        }
        if (value === '') value = null;
      }
      values[field] = value;
    }
    if (!values.name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const setPart = FIELDS.map((f) => `${f} = ?`).join(', ');
    db.prepare(`UPDATE bio SET ${setPart} WHERE id = 1`).run(...FIELDS.map((f) => values[f]));

    res.json(db.prepare('SELECT * FROM bio WHERE id = 1').get());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update bio' });
  }
});

module.exports = router;
