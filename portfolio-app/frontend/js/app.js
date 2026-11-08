

const $ = (selector) => document.querySelector(selector);


const API = '';

// ---------- API helper ----------
async function api(path, method = 'GET', body) {
  const res = await fetch(API + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null; // DELETE success, no body
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}


const SECTIONS = {
  bio: {
    title: 'bio',
    url: '/api/bio',
    fields: [
      { name: 'name', label: 'Name *', required: true },
      { name: 'headline', label: 'Headline' },
      { name: 'about', label: 'About', type: 'textarea' },
      { name: 'email', label: 'Email' },
      { name: 'location', label: 'Location' },
      { name: 'github_url', label: 'GitHub URL', type: 'url' },
      { name: 'linkedin_url', label: 'LinkedIn URL', type: 'url' },
    ],
  },
  projects: {
    title: 'project',
    url: '/api/projects',
    fields: [
      { name: 'title', label: 'Title *', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'tech_stack', label: 'Tech stack (comma separated)' },
      { name: 'live_url', label: 'Live URL', type: 'url' },
      { name: 'repo_url', label: 'Repo URL', type: 'url' },
    ],
  },
  skills: {
    title: 'skill',
    url: '/api/skills',
    fields: [
      { name: 'name', label: 'Skill name *', required: true },
      { name: 'category', label: 'Category (Frontend, Backend...)' },
      { name: 'level', label: 'Level (0-100)', type: 'number' },
    ],
  },
  experience: {
    title: 'experience',
    url: '/api/experience',
    fields: [
      { name: 'company', label: 'Company *', required: true },
      { name: 'role', label: 'Role *', required: true },
      { name: 'start_date', label: 'Start (e.g. 2025-06)' },
      { name: 'end_date', label: 'End (empty = present)' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
};

SECTIONS.certificates = {
  title: 'certificate',
  url: '/api/certificates',
  fields: [
    { name: 'title', label: 'Title *', required: true },
    { name: 'issuer', label: 'Issuer (Coursera, Google...)' },
    { name: 'issue_date', label: 'Date (e.g. 2025-08)' },
    { name: 'credential_url', label: 'Credential URL', type: 'url' },
  ],
};

let data = { bio: null, projects: [], skills: [], experience: [], certificates: [] };

// ---------- Small helpers to build HTML safely ----------
// We use textContent (not innerHTML), so text from the database can never run as code.
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const child of children.flat()) {
    if (child) node.append(child);
  }
  return node;
}

function link(url, label) {
  if (!url) return null;
  return el('a', { href: url, target: '_blank', rel: 'noopener noreferrer', textContent: label });
}

function actionButtons(section, item) {
  const edit = el('button', { type: 'button', textContent: 'Edit' });
  edit.onclick = () => openForm(section, item);
  const del = el('button', { type: 'button', className: 'danger', textContent: 'Delete' });
  del.onclick = () => deleteItem(section, item);
  return el('div', { className: 'actions' }, edit, del);
}

function emptyMessage(text) {
  return el('p', { className: 'empty', textContent: text });
}

// ---------- Rendering ----------
function renderBio() {
  const b = data.bio;
  $('#bioName').textContent = b.name;
  $('#brand').textContent = b.name;
  document.title = b.name + ' - Portfolio';
  $('#bioHeadline').textContent = b.headline;
  $('#bioAbout').textContent = b.about;
  $('#bioLocation').textContent = b.location;

  const links = $('#bioLinks');
  // filter(Boolean) removes empty links (replaceChildren would print "null")
  links.replaceChildren(
    ...[
      b.email ? link('mailto:' + b.email, b.email) : null,
      link(b.github_url, 'GitHub'),
      link(b.linkedin_url, 'LinkedIn'),
    ].filter(Boolean)
  );
}

function renderProjects() {
  const box = $('#projectsList');
  box.replaceChildren();
  if (!data.projects.length) return box.append(emptyMessage('No projects yet.'));

  for (const p of data.projects) {
    const tags = p.tech_stack
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => el('span', { className: 'tag', textContent: t }));
    const links = [link(p.live_url, 'Live ↗'), link(p.repo_url, 'Code ↗')].filter(Boolean);

    box.append(
      el('article', { className: 'card' },
        el('h3', { textContent: p.title }),
        p.description ? el('p', { textContent: p.description }) : null,
        tags.length ? el('div', { className: 'tags' }, tags) : null,
        links.length ? el('div', { className: 'links' }, links) : null,
        actionButtons('projects', p)
      )
    );
  }
}

function renderSkills() {
  const box = $('#skillsList');
  box.replaceChildren();
  if (!data.skills.length) return box.append(emptyMessage('No skills yet.'));

  for (const s of data.skills) {
    const fill = el('span');
    fill.style.width = s.level + '%';
    box.append(
      el('div', { className: 'skill' },
        el('div', { className: 'skill-top' },
          el('strong', { textContent: s.name }),
          el('span', { className: 'skill-cat', textContent: s.category ? `${s.category} · ${s.level}%` : `${s.level}%` })
        ),
        el('div', { className: 'bar' }, fill),
        actionButtons('skills', s)
      )
    );
  }
}

function renderExperience() {
  const box = $('#experienceList');
  box.replaceChildren();
  if (!data.experience.length) return box.append(emptyMessage('No experience yet.'));

  for (const j of data.experience) {
    const when = `${j.start_date || '?'} → ${j.end_date || 'Present'}`;
    box.append(
      el('article', { className: 'job' },
        el('h3', { textContent: `${j.role} @ ${j.company}` }),
        el('div', { className: 'when', textContent: when }),
        j.description ? el('p', { textContent: j.description }) : null,
        actionButtons('experience', j)
      )
    );
  }
}

function renderCertificates() {
  const box = $('#certificatesList');
  box.replaceChildren();
  if (!data.certificates.length) return box.append(emptyMessage('No certificates yet.'));

  for (const c of data.certificates) {
    const meta = [c.issuer, c.issue_date].filter(Boolean).join(' · ');
    box.append(
      el('article', { className: 'card' },
        el('h3', { textContent: c.title }),
        meta ? el('p', { textContent: meta }) : null,
        c.credential_url ? el('div', { className: 'links' }, link(c.credential_url, 'View credential ↗')) : null,
        actionButtons('certificates', c)
      )
    );
  }
}

function renderAll() {
  renderBio();
  renderProjects();
  renderSkills();
  renderExperience();
  renderCertificates();
}

// ---------- READ: load everything from the API ----------
async function loadAll() {
  try {
    const [bio, projects, skills, experience, certificates] = await Promise.all([
      api('/api/bio'),
      api('/api/projects'),
      api('/api/skills'),
      api('/api/experience'),
      api('/api/certificates'),
    ]);
    data = { bio, projects, skills, experience, certificates };
    $('#banner').hidden = true;
    renderAll();
  } catch (err) {
    $('#banner').hidden = false;
    $('#banner').textContent = 'Could not load data from the server: ' + err.message;
  }
}

// ---------- CREATE / UPDATE: the form ----------
const dlg = $('#dlg');
const form = $('#form');
let current = null; // { section, id }  (id is null when adding)

function openForm(section, item = null) {
  const cfg = SECTIONS[section];
  current = { section, id: item ? item.id : null };
  $('#formTitle').textContent = (item ? 'Edit ' : 'Add ') + cfg.title;
  $('#formError').textContent = '';

  const fields = $('#fields');
  fields.replaceChildren();
  for (const f of cfg.fields) {
    const input =
      f.type === 'textarea'
        ? el('textarea', { name: f.name, maxLength: 2000 })
        : el('input', { name: f.name, type: f.type || 'text', required: !!f.required });
    if (f.type === 'number') { input.min = 0; input.max = 100; }
    input.value = item && item[f.name] != null ? item[f.name] : f.type === 'number' ? 50 : '';
    fields.append(el('label', {}, f.label, input));
  }
  dlg.showModal();
}

$('#cancelBtn').onclick = () => dlg.close();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cfg = SECTIONS[current.section];

  // collect the form values into an object
  const body = {};
  for (const f of cfg.fields) {
    body[f.name] = form.elements[f.name].value;
  }

  const saveBtn = $('#saveBtn');
  saveBtn.disabled = true;
  try {
    if (current.section === 'bio') {
      await api(cfg.url, 'PUT', body);
    } else if (current.id) {
      await api(`${cfg.url}/${current.id}`, 'PUT', body);
    } else {
      await api(cfg.url, 'POST', body);
    }
    dlg.close();
    await loadAll();
  } catch (err) {
    $('#formError').textContent = err.message;
  } finally {
    saveBtn.disabled = false;
  }
});

// ---------- DELETE ----------
async function deleteItem(section, item) {
  const label = item.title || item.name || item.role;
  if (!confirm(`Delete "${label}"?`)) return;
  try {
    await api(`${SECTIONS[section].url}/${item.id}`, 'DELETE');
    await loadAll();
  } catch (err) {
    alert(err.message);
  }
}

// ---------- Buttons ----------
document.querySelectorAll('[data-add]').forEach((btn) => {
  btn.onclick = () => openForm(btn.dataset.add);
});
$('#editBio').onclick = () => openForm('bio', data.bio);

$('#editToggle').onclick = () => {
  const on = document.body.classList.toggle('edit');
  $('#editToggle').textContent = 'Edit mode: ' + (on ? 'ON' : 'OFF');
};

loadAll();
