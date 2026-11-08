
const Database = require('better-sqlite3');
const path = require('path');


const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'portfolio.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// ---------- Tables ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS bio (
    id           INTEGER PRIMARY KEY CHECK (id = 1),   -- only one row ever
    name         TEXT NOT NULL DEFAULT '',
    headline     TEXT NOT NULL DEFAULT '',
    about        TEXT NOT NULL DEFAULT '',
    email        TEXT NOT NULL DEFAULT '',
    location     TEXT NOT NULL DEFAULT '',
    github_url   TEXT,
    linkedin_url TEXT
  );

  CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    tech_stack  TEXT NOT NULL DEFAULT '',
    live_url    TEXT,
    repo_url    TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS skills (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    level    INTEGER NOT NULL DEFAULT 50                -- 0 to 100
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT NOT NULL,
    issuer        TEXT NOT NULL DEFAULT '',
    issue_date    TEXT NOT NULL DEFAULT '',
    credential_url TEXT
  );

  CREATE TABLE IF NOT EXISTS experience (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    company     TEXT NOT NULL,
    role        TEXT NOT NULL,
    start_date  TEXT NOT NULL DEFAULT '',
    end_date    TEXT NOT NULL DEFAULT '',               -- empty = still working here
    description TEXT NOT NULL DEFAULT ''
  );
`);

// ---------- Starter data (only on the very first run) ----------
db.prepare(
  `INSERT OR IGNORE INTO bio (id, name, headline, about, email, location, github_url, linkedin_url)
   VALUES (1, ?, ?, ?, ?, ?, NULL, NULL)`
).run(
  'Your Name',
  'Junior Web Developer',
  'Write a few lines about yourself here. Turn on Edit mode and click Edit on this section.',
  'you@example.com',
  'Dhaka, Bangladesh'
);

function count(table) {
  return db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
}

if (count('projects') === 0) {
  db.prepare(
    'INSERT INTO projects (title, description, tech_stack) VALUES (?, ?, ?)'
  ).run('Sample Project', 'Replace me with a real project.', 'Node.js, Express, SQLite');
}

if (count('skills') === 0) {
  const add = db.prepare('INSERT INTO skills (name, category, level) VALUES (?, ?, ?)');
  add.run('JavaScript', 'Frontend', 80);
  add.run('Node.js', 'Backend', 70);
  add.run('SQL', 'Database', 65);
}

if (count('experience') === 0) {
  db.prepare(
    'INSERT INTO experience (company, role, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)'
  ).run('Sample Company', 'Intern', '2025-06', '2025-09', 'Describe what you worked on.');
}

if (count('certificates') === 0) {
  const add = db.prepare(
    'INSERT INTO certificates (title, issuer, issue_date, credential_url) VALUES (?, ?, ?, ?)'
  );
  add.run('Sample Certificate', 'Coursera', '2025-08', null);
  add.run('Another Certificate', 'freeCodeCamp', '2025-03', null);
}

module.exports = db;
