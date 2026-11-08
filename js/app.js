// Workbench front-end: prompt gallery, repo directory and guides. No build step, no framework.

const $ = sel => document.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => n >= 10000 ? Math.round(n / 1000) + 'k' : n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
const ago = iso => {
  const d = (Date.now() - Date.parse(iso)) / 864e5;
  if (d < 1) return 'today';
  if (d < 2) return 'yesterday';
  if (d < 30) return `${Math.floor(d)} days ago`;
  if (d < 365) return `${Math.floor(d / 30)} mo ago`;
  return `${Math.floor(d / 365)} yr ago`;
};
const icon = (name, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const loadJSON = url => fetch(url, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

const ROLES = [
  ['subject', 'Subject'], ['style', 'Style & medium'], ['light', 'Light'], ['camera', 'Camera'],
  ['mood', 'Colour & mood'], ['format', 'Format & detail'], ['params', 'Parameters'], ['negative', 'Negative']
];
const SOURCES = { workbench: 'Workbench picks', civitai: 'Civitai', x: 'X' };

/* ───────── shared data ───────── */
const data = { prompts: [], models: {}, repos: [], repoMeta: null, descs: {}, history: {}, guides: [] };
const saved = new Set(store.get('saved', []));

/* ───────── routing ───────── */
function route() {
  const [, view = 'prompts', id] = location.hash.split('/');
  const v = ['prompts', 'repos', 'guides'].includes(view) ? view : 'prompts';
  const sheetEl = document.getElementById('sheet');
  if (sheetEl.open) sheetEl.close(); // a section change shouldn't leave a prompt open on top
  document.querySelectorAll('.view').forEach(el => (el.hidden = el.id !== `view-${v}`));
  document.querySelectorAll('.nav a').forEach(a => (a.dataset.view === v ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  if (v === 'guides') showGuide(id);
}
addEventListener('hashchange', () => { route(); scrollTo(0, 0); });

/* ───────── helpers ───────── */
function chips(el, options, current, onPick) {
  el.innerHTML = options.map(o =>
    `<button type="button" class="chip" data-v="${esc(o.v)}" aria-pressed="${current === o.v}">${o.icon ? icon(o.icon) : ''}${esc(o.label)}${o.n != null ? `<span class="n">${o.n}</span>` : ''}</button>`
  ).join('');
  el.onclick = e => { const b = e.target.closest('.chip'); if (b) onPick(b.dataset.v); };
}
const countBy = (arr, f) => arr.reduce((m, x) => { for (const k of [].concat(f(x))) m[k] = (m[k] || 0) + 1; return m; }, {});
const segHTML = segs => (segs || []).map(([t, r]) => `<span class="seg" data-role="${esc(r)}">${esc(t)}</span>`).join(' ');
const legendHTML = roles => `<div class="legend">${ROLES.filter(([r]) => roles.has(r)).map(([r, l]) => `<span data-role="${r}"><i></i>${l}</span>`).join('')}</div>`;

// Community prompts have no title: use the opening subject phrase, trimmed at a word boundary.
function titleFrom(p) {
  // Skip labels like "FOREGROUND:" or one-word tags; prefer a real descriptive phrase.
  const descriptive = s => s[0].split(/\s+/).length >= 4 && s[0] !== s[0].toUpperCase();
  const first = (p.segments.find(s => s[1] === 'subject' && descriptive(s)) || p.segments.find(descriptive) || p.segments[0] || [p.text])[0]
    .replace(/^[A-Z][A-Z\s]+:\s*/, '')
    .replace(/^(a|an|the)\s+/i, '').replace(/[,.;:]+$/, '').replace(/\s+/g, ' ');
  if (first.length <= 52) return first.charAt(0).toUpperCase() + first.slice(1);
  const cut = first.slice(0, 52).replace(/\s+\S*$/, '');
  return cut.charAt(0).toUpperCase() + cut.slice(1) + '…';
}

/* ═════════════ PROMPTS ═════════════ */
const P = { source: 'all', model: 'all', subject: 'all', q: '', limit: 40 };

async function initPrompts() {
  const [curated, community] = await Promise.all([loadJSON('data/prompts.json'), loadJSON('data/community-prompts.json')]);
  for (const m of curated?.models || []) data.models[m.id] = m;
  const picks = (curated?.prompts || []).map(p => ({
    ...p, source: 'workbench', text: p.segments.map(s => s[0]).join(' '), modelLabel: data.models[p.model]?.name || p.model
  }));
  const comm = (community?.prompts || []).map(p => ({ ...p, text: p.prompt }));
  for (const p of comm) {
    p.title = titleFrom(p);
    if (!data.models[p.model]) data.models[p.model] = { id: p.model, name: p.model === 'other' ? 'Unknown model' : p.modelName || p.model };
  }
  // Picks with images first, then community, then text-only templates.
  data.prompts = [...picks.filter(p => p.image), ...comm, ...picks.filter(p => !p.image)];

  $('#modelGuide').innerHTML = (curated?.models || []).map(m => `
    <article class="tip">
      <h3>${esc(m.name)}</h3><div class="maker">${esc(m.maker)}</div>
      <ul>${m.tips.map(t => `<li>${t}</li>`).join('')}</ul>
    </article>`).join(''); // tips are our own copy and contain <code>

  const onSearch = () => { P.q = $('#promptSearch').value.trim().toLowerCase(); P.limit = 40; renderPrompts(); };
  $('#promptSearch').addEventListener('input', onSearch);
  $('#promptSearchForm').addEventListener('submit', e => { e.preventDefault(); onSearch(); });
  $('#promptMore').addEventListener('click', () => { P.limit += 40; renderPrompts(); });
  $('#promptGrid').addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (card) openPrompt(data.prompts.find(p => p.id === card.dataset.id));
  });
  renderPrompts();
}

function promptMatches(p, skip) {
  if (skip !== 'source' && P.source !== 'all' && (P.source === 'saved' ? !saved.has(p.id) : p.source !== P.source)) return false;
  if (skip !== 'model' && P.model !== 'all' && p.model !== P.model) return false;
  if (skip !== 'subject' && P.subject !== 'all' && p.subject !== P.subject) return false;
  if (P.q && !`${p.text} ${p.title || ''} ${p.modelLabel} ${p.author || ''}`.toLowerCase().includes(P.q)) return false;
  return true;
}

function renderPrompts() {
  const all = data.prompts;
  const pick = key => v => { P[key] = v; P.limit = 40; renderPrompts(); };

  // Each chip row counts what the other filters leave, so the numbers stay honest.
  const src = countBy(all.filter(p => promptMatches(p, 'source')), p => p.source);
  const savedN = all.filter(p => saved.has(p.id) && promptMatches(p, 'source')).length;
  chips($('#sourceChips'), [
    { v: 'all', label: 'All prompts' },
    ...Object.keys(SOURCES).filter(s => src[s]).map(s => ({ v: s, label: SOURCES[s] })),
    ...(saved.size ? [{ v: 'saved', label: 'Saved', icon: 'heart', n: savedN }] : [])
  ], P.source, pick('source'));

  const mc = countBy(all.filter(p => promptMatches(p, 'model')), p => p.model);
  chips($('#modelChips'), [{ v: 'all', label: 'All models' },
    ...Object.entries(mc).sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ v: id, label: data.models[id]?.name || id, n }))
  ], P.model, pick('model'));

  const sc = countBy(all.filter(p => promptMatches(p, 'subject')), p => p.subject);
  chips($('#subjectChips'), [{ v: 'all', label: 'All subjects' },
    ...Object.entries(sc).sort((a, b) => b[1] - a[1]).map(([s, n]) => ({ v: s, label: s, n }))
  ], P.subject, pick('subject'));

  const list = all.filter(p => promptMatches(p));
  const shown = list.slice(0, P.limit);
  $('#promptCount').innerHTML = `<b>${list.length}</b> prompt${list.length === 1 ? '' : 's'}`;
  $('#promptGrid').innerHTML = shown.map(cardHTML).join('');
  $('#promptEmpty').hidden = list.length > 0;
  $('#promptMore').hidden = list.length <= shown.length;
}

const modelName = p => (p.model === 'other' ? p.modelLabel.split(' · ')[0] : data.models[p.model]?.name || p.modelLabel);

function cardHTML(p) {
  const model = modelName(p);
  const by = p.source === 'workbench' ? 'Workbench pick' : p.author || SOURCES[p.source];
  if (!p.image) {
    return `<button class="card text" data-id="${esc(p.id)}">
      <div class="card-body">
        <span class="pill-model">${esc(model)}</span>
        <p class="card-title" style="margin-top:10px">${esc(p.title)}</p>
        <p class="card-snippet">${esc(p.text)}</p>
        <div class="card-meta"><span>Prompt template</span></div>
      </div></button>`;
  }
  const size = p.width && p.height ? `width="${p.width}" height="${p.height}"` : '';
  return `<button class="card" data-id="${esc(p.id)}">
    <div class="card-img">
      <img src="${esc(p.image)}" ${size} alt="${esc(p.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
      <span class="tag">${esc(model)}</span>
    </div>
    <div class="card-body">
      <p class="card-title">${esc(p.title)}</p>
      <div class="card-meta"><span>${esc(by)}</span>${p.likes ? `<span class="likes">${icon('heart')}${fmt(p.likes)}</span>` : ''}</div>
    </div></button>`;
}

/* detail sheet */
const sheet = $('#sheet');
sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });

function openPrompt(p) {
  if (!p) return;
  const highlight = store.get('highlight', true);
  const big = p.source === 'civitai' && p.imageFull ? p.imageFull.replace('/original=true/', '/width=1200/') : p.imageFull || p.image;
  const neg = Array.isArray(p.negative) ? p.negative : p.negative ? [[p.negative, 'negative']] : null;
  const negText = neg ? neg.map(s => s[0]).join(' ') : '';
  const roles = new Set([...p.segments.map(s => s[1]), ...(neg ? ['negative'] : [])]);
  const author = p.source === 'workbench'
    ? 'Workbench pick'
    : p.authorUrl ? `<a href="${esc(p.authorUrl)}" target="_blank" rel="noopener">${esc(p.author)}</a>` : esc(p.author || 'unknown');

  $('#sheetBody').innerHTML = `
    <button class="sheet-close" data-close aria-label="Close">${icon('close')}</button>
    <div class="sheet-grid${p.image ? '' : ' solo'}">
      ${p.image ? `<div class="sheet-media"><img src="${esc(big)}" alt="${esc(p.title)}" referrerpolicy="no-referrer"></div>` : ''}
      <div class="sheet-text">
        <div class="sheet-head">
          <h2 id="sheetTitle">${esc(p.title)}</h2>
          <div class="sheet-meta">
            <span>Source: ${author}${p.source !== 'workbench' ? ` on ${SOURCES[p.source]}` : ''}</span>
            <span>Model: ${esc(p.modelLabel)}</span>
            <button class="btn-save" data-save aria-pressed="${saved.has(p.id)}">${icon('heart')}<span>${saved.has(p.id) ? 'Saved' : 'Save'}</span></button>
          </div>
        </div>
        <div class="sheet-section">
          <h3 class="block-title">Prompt</h3>
          <div class="prompt-box">
            <div class="prompt-bar">
              <label class="switch"><input type="checkbox" data-hl ${highlight ? 'checked' : ''}> Highlight anatomy</label>
              <span class="spacer"></span>
              <button class="link-btn" data-copy="prompt">${icon('copy')}<span>Copy</span></button>
            </div>
            <div class="${highlight ? 'hl' : ''}" data-hl-target>
              <p class="prompt-text">${segHTML(p.segments)}</p>
              <div class="prompt-legend"${highlight ? '' : ' hidden'}>${legendHTML(roles)}</div>
            </div>
          </div>
          ${neg ? `
          <div class="prompt-box">
            <div class="prompt-bar"><span>Negative prompt</span><span class="spacer"></span>
              <button class="link-btn" data-copy="neg">${icon('copy')}<span>Copy</span></button></div>
            <p class="prompt-text">${esc(negText)}</p>
          </div>` : ''}
          ${p.why ? `<p class="why"><b>Why it works</b>${esc(p.why)}</p>` : ''}
          <dl class="kv">
            ${p.subject ? `<dt>Subject</dt><dd>${esc(p.subject)}</dd>` : ''}
            ${p.settings ? `<dt>Settings</dt><dd>${esc(p.settings)}</dd>` : ''}
            ${p.sourceUrl ? `<dt>Original</dt><dd><a class="link-btn" style="padding:0" href="${esc(p.sourceUrl)}" target="_blank" rel="noopener">View on ${SOURCES[p.source]} ${icon('out')}</a></dd>` : ''}
          </dl>
        </div>
      </div>
    </div>`;

  $('#sheetBody').onclick = async e => {
    if (e.target.closest('[data-close]')) return sheet.close();
    const save = e.target.closest('[data-save]');
    if (save) {
      saved.has(p.id) ? saved.delete(p.id) : saved.add(p.id);
      store.set('saved', [...saved]);
      save.setAttribute('aria-pressed', saved.has(p.id));
      save.querySelector('span').textContent = saved.has(p.id) ? 'Saved' : 'Save';
      renderPrompts();
      return;
    }
    const c = e.target.closest('[data-copy]');
    if (!c) return;
    const label = c.querySelector('span');
    try {
      await navigator.clipboard.writeText(c.dataset.copy === 'neg' ? negText : p.text);
      label.textContent = 'Copied';
    } catch { label.textContent = 'Copy failed'; }
    setTimeout(() => (label.textContent = 'Copy'), 1500);
  };
  $('#sheetBody').onchange = e => {
    if (!e.target.matches('[data-hl]')) return;
    const on = e.target.checked;
    store.set('highlight', on);
    const t = $('#sheetBody [data-hl-target]');
    t.classList.toggle('hl', on);
    t.querySelector('.prompt-legend').hidden = !on;
  };
  if (!sheet.open) sheet.showModal();
  $('#sheetBody .sheet-text').scrollTop = 0;
}

/* ═════════════ REPOS ═════════════ */
const R = { cat: 'All', kind: 'all', sort: 'stars', q: '', limit: 40 };
const CAT_ORDER = ['Design', 'Web dev', 'Game dev', 'Data & ML', 'Coding & review', 'DevOps & cloud', 'Writing & docs', 'Automation', 'Media', 'Mobile', 'Security', 'General'];
const SORTS = {
  rising: (a, b) => b.rate - a.rate,
  stars: (a, b) => b.stars - a.stars,
  new: (a, b) => b.created_at.localeCompare(a.created_at),
  updated: (a, b) => b.pushed_at.localeCompare(a.pushed_at)
};
// Stars per day: measured from daily snapshots when we have them, otherwise the lifetime average.
const perDay = r => (r.rate >= 100 ? fmt(Math.round(r.rate)) : r.rate >= 10 ? Math.round(r.rate) : r.rate.toFixed(1));
const perDayNote = r => (r.rateMeasured ? `last ${r.gainedDays} day${r.gainedDays === 1 ? '' : 's'}` : 'average so far');

async function initRepos() {
  const [meta, descs, history] = await Promise.all([
    loadJSON('data/repos.json'), loadJSON('data/repo-descriptions.json'), loadJSON('data/repo-history.json')
  ]);
  data.repoMeta = meta;
  data.repos = meta?.repos || [];
  data.descs = descs || {};
  data.history = history || {};
  if (!data.repos.length) {
    $('#repoList').innerHTML = '<li class="empty">No repo data yet. Run <code>node scripts/update-repos.mjs</code> to fetch it.</li>';
    return;
  }
  const onSearch = () => { R.q = $('#repoSearch').value.trim().toLowerCase(); R.limit = 40; renderRepos(); };
  $('#repoSearch').addEventListener('input', onSearch);
  $('#repoSearchForm').addEventListener('submit', e => { e.preventDefault(); onSearch(); });
  $('#sortSelect').addEventListener('change', e => { R.sort = e.target.value; renderRepos(); });
  $('#repoMore').addEventListener('click', () => { R.limit += 40; renderRepos(); });
  initChartTip();
  renderRepos();
}

function repoMatches(r, skip) {
  if (skip !== 'cat' && R.cat !== 'All' && !r.categories.includes(R.cat)) return false;
  if (skip !== 'kind' && R.kind !== 'all' && r.kind !== R.kind) return false;
  const d = data.descs[r.full_name];
  if (R.q && !`${r.full_name} ${r.description} ${d?.what || ''} ${d?.good || ''} ${r.topics.join(' ')}`.toLowerCase().includes(R.q)) return false;
  return true;
}

// Daily star snapshots → a small trend line. Needs 3+ days of history to say anything.
function sparkline(name) {
  const pts = Object.entries(data.history[name] || {}).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  if (pts.length < 3) return '';
  const w = 120, h = 28, min = Math.min(...pts), max = Math.max(...pts), span = max - min || 1;
  const xy = pts.map((v, i) => [(i / (pts.length - 1)) * (w - 4) + 2, h - 3 - ((v - min) / span) * (h - 6)]);
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const [lx, ly] = xy[xy.length - 1];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="Stars over the last ${pts.length} days, from ${fmt(pts[0])} to ${fmt(pts[pts.length - 1])}"><path d="${d}"/><circle cx="${lx}" cy="${ly}" r="4"/></svg>`;
}

function renderChart(list) {
  const top = [...list].sort(SORTS.rising).slice(0, 10);
  const max = Math.max(...top.map(r => r.rate), 1);
  const measured = top.some(r => r.rateMeasured);
  $('#chartTitle').textContent = `Stars gained per day${R.cat === 'All' ? '' : ` · ${R.cat}`}`;
  $('#risingNote').textContent = measured
    ? 'Top 10 risers, from daily star counts'
    : 'Top 10 risers · average stars per day so far; switches to measured daily gains once the job has a few days of history';
  $('#riseChart').innerHTML = top.map(r => `
    <a class="bar-row" role="listitem" href="${esc(r.url)}" target="_blank" rel="noopener" data-name="${esc(r.full_name)}"
       aria-label="${esc(r.full_name)}: ${perDay(r)} stars per day, ${fmt(r.stars)} total">
      <span class="bar-label"><span class="owner">${esc(r.owner)}/</span><b>${esc(r.name)}</b></span>
      <span class="bar-track"><span class="bar" style="width:${Math.max(0.5, (r.rate / max) * 82).toFixed(2)}%"></span>
        <span class="bar-value">+${perDay(r)} <small>/day</small></span></span>
    </a>`).join('');
  $('#riseChart').closest('.chart-card').hidden = !top.length;
}

function initChartTip() {
  const card = $('.chart-card'), tip = $('#chartTip');
  const show = row => {
    const r = data.repos.find(x => x.full_name === row.dataset.name);
    if (!r) return;
    tip.innerHTML = `<b>${esc(r.full_name)}</b>+${perDay(r)} stars/day (${perDayNote(r)})<br>${fmt(r.stars)} stars total · ${esc(r.kind)}`;
    tip.hidden = false;
    const c = card.getBoundingClientRect(), b = row.querySelector('.bar').getBoundingClientRect();
    tip.style.left = `${Math.max(8, Math.min(b.right - c.left + 12, c.width - tip.offsetWidth - 8))}px`;
    tip.style.top = `${b.top - c.top - tip.offsetHeight - 6}px`;
  };
  card.addEventListener('pointerover', e => { const row = e.target.closest('.bar-row'); if (row) show(row); });
  card.addEventListener('focusin', e => { const row = e.target.closest('.bar-row'); if (row) show(row); });
  card.addEventListener('pointerleave', () => (tip.hidden = true));
  card.addEventListener('focusout', () => (tip.hidden = true));
}

function renderRepos() {
  const all = data.repos;
  const cc = countBy(all.filter(r => repoMatches(r, 'cat')), r => r.categories);
  chips($('#catChips'), [{ v: 'All', label: 'All work', n: all.filter(r => repoMatches(r, 'cat')).length },
    ...CAT_ORDER.filter(c => cc[c]).map(c => ({ v: c, label: c, n: cc[c] }))
  ], R.cat, v => { R.cat = v; R.limit = 40; renderRepos(); });

  const kc = countBy(all.filter(r => repoMatches(r, 'kind')), r => r.kind);
  chips($('#kindChips'), [{ v: 'all', label: 'All kinds' },
    ...Object.entries(kc).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ v: k, label: k, n }))
  ], R.kind, v => { R.kind = v; R.limit = 40; renderRepos(); });

  const list = all.filter(r => repoMatches(r));
  $('#repoCount').innerHTML = `<b>${list.length}</b> repos · updated ${ago(data.repoMeta.generatedAt)}`;
  renderChart(list);

  const sorted = list.sort(SORTS[R.sort]);
  const shown = sorted.slice(0, R.limit);
  $('#repoListHead').textContent = R.cat === 'All' ? 'All repos' : `${R.cat} repos`;
  $('#repoList').innerHTML = shown.map(r => {
    const d = data.descs[r.full_name];
    return `<li class="repo-row">
      <div class="repo-main">
        <div class="repo-title">
          <a class="repo-name" href="${esc(r.url)}" target="_blank" rel="noopener"><span class="owner">${esc(r.owner)}/</span>${esc(r.name)}</a>
          <span class="tag-s kind">${esc(r.kind)}</span>
          ${r.curated ? `<span class="tag-s pick">${icon('star')}Pick</span>` : ''}
          ${r.isNew ? '<span class="tag-s new">New this month</span>' : ''}
        </div>
        <p class="repo-what">${esc(d?.what || r.note || r.description)}</p>
        ${d?.good ? `<p class="repo-good">${icon('check')}<span>${esc(d.good)}</span></p>` : ''}
        <div class="repo-meta">
          <span>${r.categories.map(esc).join(' · ')}</span>
          ${r.language ? `<span>${esc(r.language)}</span>` : ''}
          <span>updated ${ago(r.pushed_at)}</span>
        </div>
      </div>
      <div class="repo-stars"><b>${fmt(r.stars)}</b><small>stars</small></div>
      <div class="repo-daily"><b>+${perDay(r)}</b><small>per day · ${perDayNote(r)}</small>${sparkline(r.full_name)}</div>
    </li>`;
  }).join('');
  $('#repoEmpty').hidden = list.length > 0;
  $('#repoMore').hidden = sorted.length <= shown.length;
}

/* ═════════════ GUIDES ═════════════ */
const promptById = id => data.prompts.find(p => p.id === id);

async function initGuides() {
  const g = await loadJSON('data/guides.json');
  data.guides = g?.guides || [];
  $('#guideGrid').innerHTML = data.guides.map(gd => `
    <a class="guide-card" href="#/guides/${esc(gd.id)}">
      <img src="images/gallery/${esc(gd.cover)}.webp" alt="" loading="lazy">
      <div class="body">
        <h3>${esc(gd.title)}</h3>
        <p>${esc(gd.summary)}</p>
        <div class="guide-meta"><span>${esc(gd.level)}</span><span>${icon('clock')}${gd.minutes} min</span><span>${gd.steps.length} steps</span></div>
      </div>
    </a>`).join('');
  $('#guideDetail').addEventListener('click', e => {
    const b = e.target.closest('[data-prompt]');
    if (b) openPrompt(promptById(b.dataset.prompt));
  });
  route();
}

function showGuide(id) {
  const gd = data.guides.find(g => g.id === id);
  $('#guideIndex').hidden = !!gd;
  $('#guideDetail').hidden = !gd;
  if (!gd) return;
  const repoFor = name => data.repos.find(r => r.full_name === name);
  $('#guideDetail').innerHTML = `
    <a class="back" href="#/guides">${icon('back')}All guides</a>
    <div class="guide-hero"><img src="images/gallery/${esc(gd.cover)}.webp" alt=""></div>
    <h1 class="page-title">${esc(gd.title)}</h1>
    <p class="page-sub">${esc(gd.summary)}</p>
    <div class="tool-row">
      <span class="tag-s kind">${esc(gd.level)}</span>
      <span class="tag-s">${gd.minutes} min</span>
      ${gd.tools.map(t => `<span class="tag-s">${esc(t)}</span>`).join('')}
    </div>
    <ol class="steps">
      ${gd.steps.map(s => {
        const p = s.prompt && promptById(s.prompt);
        const r = s.repo && repoFor(s.repo);
        return `<li class="step"><div><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></div>
          ${p ? `<div class="ref"><button class="ref-prompt" data-prompt="${esc(p.id)}">
              ${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : `<span class="noimg">${esc(data.models[p.model]?.name || '')}</span>`}
              <span><span class="t">Example: ${esc(p.title)}</span><span class="p">${esc(p.text)}</span></span>
            </button></div>` : ''}
          ${s.repo ? `<div class="ref"><a class="ref-repo" href="https://github.com/${esc(s.repo)}" target="_blank" rel="noopener">
              <span><span class="repo-name"><span class="owner">${esc(s.repo.split('/')[0])}/</span>${esc(s.repo.split('/')[1])}</span>
              ${r ? `<span class="repo-foot" style="padding:0"><span class="stars">${icon('star')}${fmt(r.stars)}</span></span>` : ''}</span>
              ${icon('out')}</a></div>` : ''}
        </li>`;
      }).join('')}
    </ol>`;
}

route();
await Promise.all([initPrompts(), initRepos()]);
await initGuides();
