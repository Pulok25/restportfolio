
const express = require('express');
const path = require('path');
const makeCrudRouter = require('./routes/crud');
const bioRouter = require('./routes/bio');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------


app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode}`);
  });
  next();
});

// Read JSON from request bodies
app.use(express.json());

// ---------- API routes ----------
app.use('/api/bio', bioRouter);

app.use(
  '/api/projects',
  makeCrudRouter({
    table: 'projects',
    fields: ['title', 'description', 'tech_stack', 'live_url', 'repo_url'],
    required: ['title'],
    urlFields: ['live_url', 'repo_url'],
  })
);

app.use(
  '/api/skills',
  makeCrudRouter({
    table: 'skills',
    fields: ['name', 'category', 'level'],
    required: ['name'],
    percentFields: ['level'],
    orderBy: 'level DESC, name ASC',
  })
);

app.use(
  '/api/experience',
  makeCrudRouter({
    table: 'experience',
    fields: ['company', 'role', 'start_date', 'end_date', 'description'],
    required: ['company', 'role'],
    orderBy: 'start_date DESC, id DESC',
  })
);

app.use(
  '/api/certificates',
  makeCrudRouter({
    table: 'certificates',
    fields: ['title', 'issuer', 'issue_date', 'credential_url'],
    required: ['title'],
    urlFields: ['credential_url'],
    orderBy: 'issue_date DESC, id DESC',
  })
);


app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// ---------- Frontend ----------
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---------- Error handler (e.g. broken JSON) ----------
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ error: 'Bad request: ' + err.message });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
