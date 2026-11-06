'use strict';
// Latticer Time: a thin timer on top of an Airtable base. Configuration is in config.js.

const CFG = window.TIME_CONFIG;
const T = {
  clients: CFG.tables.clients, eng: CFG.tables.engagements, del: CFG.tables.deliverables,
  task: CFG.tables.taskTypes, te: CFG.tables.timeEntries,
};
// Field names. They must match the column names in your Airtable base (docs/airtable-schema.md).
const CL = { name: 'Name', status: 'Status' };
const EN = {
  name: 'Name', stage: 'Stage', client: 'Client', type: 'Type', inc: 'Rounding Increment',
  included: 'Included Hours', used: 'Hours Used', summary: 'Budget Summary', hflag: 'Hours Flag', cflag: 'Cap Flag',
  wkCap: 'Weekly Cap', moCap: 'Monthly Cap', wk: 'Hours This Week', mo: 'Hours This Month',
};
const DL = { name: 'Name', eng: 'Engagement', status: 'Status' };
const TK = { name: 'Name', parent: 'Parent', applies: 'Applies To', active: 'Active', sort: 'Sort' };
const TE = {
  uuid: 'Entry UUID', phase: 'Phase', start: 'Start', end: 'End', date: 'Work Date', status: 'Status',
  source: 'Source', worker: 'Worker', note: 'Note', eng: 'Engagement', del: 'Deliverable', task: 'Task Type',
};
const DEFAULT_INC = CFG.defaultIncrement || 15;
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'u' + Date.now() + Math.random().toString(16).slice(2));
const hm = (min) => `${Math.floor(min / 60)}:${pad(Math.floor(min % 60))}`;
const hms = (sec) => `${Math.floor(sec / 3600)}:${pad(Math.floor((sec % 3600) / 60))}:${pad(Math.floor(sec % 60))}`;
const dec = (h) => (Math.round(h * 100) / 100).toFixed(2);
const clock = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const S = {
  clients: [], eng: [], del: [], tasks: [], today: [], running: null,
  sel: JSON.parse(localStorage.getItem('sel') || '{}'), online: true,
};
let queue = JSON.parse(localStorage.getItem('queue') || '[]');

// ---------- API ----------
async function api(method, path, body, query) {
  // typecast lets Airtable create missing single-select options (Phase, Status, Source) on first use
  const payload = body ? { ...body, typecast: true } : undefined;
  const res = await fetch(`/api/${path.split('/').map(encodeURIComponent).join('/')}${query ? '?' + query : ''}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!res.ok) {
    const e = new Error(`HTTP ${res.status}`);
    e.status = res.status;
    try { e.detail = await res.json(); } catch (_) { /* ignore */ }
    throw e;
  }
  if (!(res.headers.get('content-type') || '').includes('json')) {
    const e = new Error('The data service answered with a web page, not data. The API function is probably not deployed, or the sign-in page is intercepting it.');
    e.status = 0;
    throw e;
  }
  return res.json();
}
async function listAll(table, extra) {
  const out = [];
  let offset = '';
  do {
    const q = new URLSearchParams({ pageSize: '100' });
    if (extra) Object.entries(extra).forEach(([k, v]) => q.set(k, v));
    if (offset) q.set('offset', offset);
    const r = await api('GET', table, null, q.toString());
    out.push(...r.records);
    offset = r.offset || '';
  } while (offset);
  return out;
}
const getEntries = (formula) => listAll(T.te, { filterByFormula: formula });

// ---------- data ----------
const f = (rec, id) => (rec.fields ? rec.fields[id] : undefined);
const engById = (id) => S.eng.find((e) => e.id === id);
const taskById = (id) => S.tasks.find((t) => t.id === id);
const incOf = (engId) => { const e = engById(engId); const v = e && f(e, EN.inc); return v || DEFAULT_INC; };
function minutesOf(entry, nowMs = Date.now()) {
  const s = Date.parse(f(entry, TE.start));
  const e = f(entry, TE.end) ? Date.parse(f(entry, TE.end)) : nowMs;
  return Math.max(0, Math.round((e - s) / 60000));
}
function countedOf(entry, nowMs) {
  const eid = (f(entry, TE.eng) || [])[0];
  const inc = incOf(eid);
  const m = minutesOf(entry, nowMs);
  return (Math.ceil(m / inc) * inc) / 60;
}
const phaseFor = (eng) => {
  if (f(eng, EN.type) === 'Internal') return 'Internal';
  return CFG.phaseByStage[f(eng, EN.stage)] || CFG.defaultPhase;
};

async function loadConfig() {
  const [cl, en, dl, tk] = await Promise.all([
    listAll(T.clients), listAll(T.eng), listAll(T.del), listAll(T.task),
  ]);
  S.clients = cl.filter((c) => CFG.clientStatuses.includes(f(c, CL.status))).sort((a, b) => {
    const ai = /internal/i.test(f(a, CL.name)), bi = /internal/i.test(f(b, CL.name));
    return ai - bi || f(a, CL.name).localeCompare(f(b, CL.name));
  });
  S.eng = en.filter((e) => !CFG.hiddenStages.includes(f(e, EN.stage)));
  S.del = dl;
  S.tasks = tk.filter((t) => f(t, TK.active)).sort((a, b) => (f(a, TK.sort) || 0) - (f(b, TK.sort) || 0));
}
async function loadToday() {
  const today = ymd(new Date());
  const [t, r] = await Promise.all([
    getEntries(`IS_SAME({Work Date}, '${today}', 'day')`),
    getEntries(`{Status} = 'Running'`),
  ]);
  const map = new Map();
  [...t, ...r].forEach((e) => map.set(e.id, e));
  S.today = [...map.values()];
  S.running = S.today.find((e) => f(e, TE.status) === 'Running') || null;
  const local = JSON.parse(localStorage.getItem('localEntries') || '[]');
  local.forEach((e) => { if (!S.today.some((x) => f(x, TE.uuid) === f(e, TE.uuid))) S.today.push(e); });
  if (!S.running) S.running = S.today.find((e) => f(e, TE.status) === 'Running') || null;
}
async function refreshEngagement(id) {
  if (!id || id.startsWith('local')) return;
  const r = await api('GET', `${T.eng}/${id}`);
  const i = S.eng.findIndex((e) => e.id === id);
  if (i >= 0) S.eng[i] = r;
}

// ---------- offline queue ----------
const saveQueue = () => localStorage.setItem('queue', JSON.stringify(queue));
const saveLocal = () => localStorage.setItem('localEntries', JSON.stringify(S.today.filter((e) => e.id.startsWith('local'))));
async function syncQueue() {
  if (!queue.length) return;
  const rest = [];
  for (const op of queue) {
    try {
      const found = await getEntries(`{Entry UUID} = '${op.uuid}'`);
      if (op.op === 'create') {
        if (!found.length) await api('POST', T.te, { records: [{ fields: op.fields }] });
        else await api('PATCH', `${T.te}/${found[0].id}`, { fields: op.fields });
      } else if (found.length) {
        await api('PATCH', `${T.te}/${found[0].id}`, { fields: op.fields });
      }
    } catch (e) { rest.push(op); }
  }
  queue = rest;
  saveQueue();
  if (!rest.length) localStorage.removeItem('localEntries');
}

// ---------- actions ----------
const msg = (t, err) => { const m = $('msg'); m.textContent = t || ''; m.className = 'msg' + (err ? ' err' : ''); };
function setSync(kind, text) { const s = $('sync'); s.className = 'sync ' + kind; s.textContent = text; }

function currentSelection() {
  const eng = engById($('selEng').value);
  return { eng, del: $('selDel').value, task: $('selTask').value };
}
function entryFields({ eng, del, task }, start, end, source, status, id) {
  const fields = {
    [TE.eng]: [eng.id], [TE.task]: [task], [TE.phase]: phaseFor(eng), [TE.start]: start.toISOString(),
    [TE.date]: ymd(start), [TE.status]: status, [TE.source]: source, [TE.uuid]: id,
  };
  if (CFG.workerName) fields[TE.worker] = CFG.workerName;
  if (del) fields[TE.del] = [del];
  if (end) fields[TE.end] = end.toISOString();
  const note = $('note').value.trim();
  if (note) fields[TE.note] = note;
  return fields;
}
async function createEntry(fields) {
  const id = fields[TE.uuid];
  try {
    const r = await api('POST', T.te, { records: [{ fields }] });
    return r.records[0];
  } catch (e) {
    if (e.status && e.status < 500) throw e;
    queue.push({ op: 'create', uuid: id, fields }); saveQueue();
    const local = { id: 'local-' + id, fields: { ...fields } };
    S.online = false;
    return local;
  }
}
async function start() {
  const sel = currentSelection();
  if (!sel.eng || !sel.task) return msg('Pick a project and a type of work first.', true);
  if (S.running) return msg('A timer is already running.', true);
  $('go').disabled = true;
  try {
    const rec = await createEntry(entryFields(sel, new Date(), null, 'Timer', 'Running', uuid()));
    S.today.push(rec); S.running = rec; saveLocal();
    msg('');
  } catch (e) { msg('Could not start: ' + (e.detail?.error?.message || e.message), true); }
  $('go').disabled = false;
  render();
}
async function stop() {
  const run = S.running;
  if (!run) return;
  $('go').disabled = true;
  const end = new Date();
  const fields = { [TE.end]: end.toISOString(), [TE.status]: 'Complete' };
  const note = $('note').value.trim();
  if (note) fields[TE.note] = note;
  try {
    if (run.id.startsWith('local')) throw Object.assign(new Error('offline'), { status: 0 });
    await api('PATCH', `${T.te}/${run.id}`, { fields });
    Object.assign(run.fields, fields);
  } catch (e) {
    if (e.status && e.status < 500) { msg('Could not stop: ' + (e.detail?.error?.message || e.message), true); $('go').disabled = false; return; }
    queue.push({ op: 'patch', uuid: f(run, TE.uuid), fields }); saveQueue();
    Object.assign(run.fields, fields); S.online = false;
  }
  S.running = null; saveLocal();
  $('note').value = '';
  const eid = (f(run, TE.eng) || [])[0];
  refreshEngagement(eid).then(render).catch(() => {});
  $('go').disabled = false;
  render();
}
async function addManual(ev) {
  ev.preventDefault();
  const sel = currentSelection();
  if (!sel.eng || !sel.task) return msg('Pick a project and a type of work first.', true);
  const s = new Date($('mStart').value), e = new Date($('mEnd').value);
  if (!(e > s)) return msg('End must be after start.', true);
  try {
    const rec = await createEntry(entryFields(sel, s, e, 'Manual', 'Complete', uuid()));
    if (ymd(s) === ymd(new Date())) S.today.push(rec);
    saveLocal(); $('manual').hidden = true; $('note').value = ''; msg('Entry added.');
    refreshEngagement(sel.eng.id).then(render).catch(() => {});
  } catch (err) { msg('Could not add: ' + (err.detail?.error?.message || err.message), true); }
  render();
}
async function remove(id) {
  if (!confirm('Delete this entry?')) return;
  const e = S.today.find((x) => x.id === id);
  try {
    if (!id.startsWith('local')) await api('DELETE', `${T.te}/${id}`);
    S.today = S.today.filter((x) => x.id !== id);
    if (S.running && S.running.id === id) S.running = null;
    saveLocal();
    if (e) refreshEngagement((f(e, TE.eng) || [])[0]).then(render).catch(() => {});
  } catch (err) { msg('Could not delete: ' + err.message, true); }
  render();
}

// ---------- render ----------
function fillSelect(el, items, selected, blank) {
  el.innerHTML = (blank ? `<option value="">${esc(blank)}</option>` : '') +
    items.map((o) => `<option value="${esc(o.id)}"${o.id === selected ? ' selected' : ''}>${esc(o.label)}</option>`).join('');
}
function renderSelects() {
  const running = S.running;
  const rEng = running && (f(running, TE.eng) || [])[0];
  if (running && rEng) {
    const eng = engById(rEng);
    S.sel.client = (eng && f(eng, EN.client) || [])[0]; S.sel.eng = rEng;
    S.sel.del = (f(running, TE.del) || [])[0] || ''; S.sel.task = (f(running, TE.task) || [])[0];
  }
  if (!S.clients.some((c) => c.id === S.sel.client)) S.sel.client = S.clients[0]?.id;
  fillSelect($('selClient'), S.clients.map((c) => ({ id: c.id, label: f(c, CL.name) })), S.sel.client);
  const engs = S.eng.filter((e) => (f(e, EN.client) || [])[0] === S.sel.client);
  if (!engs.some((e) => e.id === S.sel.eng)) S.sel.eng = engs[0]?.id;
  fillSelect($('selEng'), engs.map((e) => ({ id: e.id, label: f(e, EN.name) })), S.sel.eng);
  const dels = S.del.filter((d) => (f(d, DL.eng) || []).includes(S.sel.eng));
  if (!dels.some((d) => d.id === S.sel.del)) S.sel.del = '';
  fillSelect($('selDel'), dels.map((d) => ({ id: d.id, label: f(d, DL.name) })), S.sel.del, 'None');
  const eng = engById(S.sel.eng);
  const internal = eng && f(eng, EN.type) === 'Internal';
  const cats = S.tasks.filter((t) => !(f(t, TK.parent) || []).length);
  const ok = (t) => { const a = f(t, TK.applies); return a === 'Both' || (internal ? a === 'Internal' : a === 'Client') || !a; };
  let html = '<option value="">Choose…</option>';
  cats.filter(ok).forEach((c) => {
    const kids = S.tasks.filter((t) => (f(t, TK.parent) || [])[0] === c.id);
    if (!kids.length) return;
    html += `<optgroup label="${esc(f(c, TK.name))}">` +
      kids.map((t) => `<option value="${esc(t.id)}"${t.id === S.sel.task ? ' selected' : ''}>${esc(f(t, TK.name))}</option>`).join('') + '</optgroup>';
  });
  $('selTask').innerHTML = html;
  if (!S.tasks.some((t) => t.id === S.sel.task)) S.sel.task = '';
  ['selClient', 'selEng', 'selDel', 'selTask'].forEach((id) => { $(id).disabled = !!running; });
  localStorage.setItem('sel', JSON.stringify(S.sel));
}
function renderTotals() {
  const now = Date.now();
  const all = S.today;
  const inClient = all.filter((e) => {
    const eng = engById((f(e, TE.eng) || [])[0]);
    return eng && (f(eng, EN.client) || [])[0] === S.sel.client;
  });
  const sum = (list) => ({ m: list.reduce((a, e) => a + minutesOf(e, now), 0), c: list.reduce((a, e) => a + countedOf(e, now), 0) });
  const c = sum(inClient), a = sum(all);
  const cn = S.clients.find((x) => x.id === S.sel.client);
  $('lblClient').textContent = `${cn ? f(cn, CL.name) : 'Client'} today`;
  $('totClient').textContent = hm(c.m); $('subClient').textContent = `${dec(c.c)} h counted`;
  $('totAll').textContent = hm(a.m); $('subAll').textContent = `${dec(a.c)} h counted`;
}
function renderClock() {
  const run = S.running;
  $('clock').textContent = run ? hms((Date.now() - Date.parse(f(run, TE.start))) / 1000) : '0:00:00';
  const go = $('go');
  go.textContent = run ? 'Stop' : 'Start';
  go.className = 'go' + (run ? ' stop' : '');
  if (run && document.activeElement !== $('note')) $('note').value = f(run, TE.note) || $('note').value;
}
function renderBudget() {
  const el = $('budget');
  const eng = engById(S.sel.eng);
  if (!eng) { el.hidden = true; return; }
  const inc = f(eng, EN.included), used = f(eng, EN.used) || 0;
  const wk = f(eng, EN.wk) || 0, mo = f(eng, EN.mo) || 0, wkCap = f(eng, EN.wkCap), moCap = f(eng, EN.moCap);
  if (!inc && !wkCap && !moCap) { el.hidden = true; return; }
  const pct = inc ? Math.min(100, (used / inc) * 100) : 0;
  const cls = pct >= 100 ? 'full' : pct >= 75 ? 'warn' : '';
  const flags = [f(eng, EN.hflag), f(eng, EN.cflag)].filter(Boolean);
  el.hidden = false;
  el.innerHTML = `<div class="label">Hours budget</div>` +
    (inc ? `<div class="bar ${cls}"><i style="width:${pct}%"></i></div><div class="kv"><span>Used</span><b>${esc(f(eng, EN.summary) || dec(used) + ' h')}</b></div>` : '') +
    (wkCap ? `<div class="kv"><span>This week</span><b>${dec(wk)} of ${dec(wkCap)} h</b></div>` : '') +
    (moCap ? `<div class="kv"><span>This month</span><b>${dec(mo)} of ${dec(moCap)} h</b></div>` : '') +
    flags.map((x) => `<div class="flag ${/100%|reached/.test(x) ? 'full' : ''}">${esc(x)}</div>`).join('') +
    `<div class="kv"><span></span><span>Updates when you stop the timer</span></div>`;
}
function renderList() {
  const now = Date.now();
  const rows = [...S.today].sort((a, b) => Date.parse(f(b, TE.start)) - Date.parse(f(a, TE.start)));
  $('list').innerHTML = rows.length ? rows.map((e) => {
    const eng = engById((f(e, TE.eng) || [])[0]);
    const task = taskById((f(e, TE.task) || [])[0]);
    const running = f(e, TE.status) === 'Running';
    const m = minutesOf(e, now);
    const pending = e.id.startsWith('local') ? ' · not synced' : '';
    return `<li><div><div class="t">${esc(task ? f(task, TK.name) : 'Work')}</div>
      <div class="s">${esc(eng ? f(eng, EN.name) : '')}${f(e, TE.note) ? ' · ' + esc(f(e, TE.note)) : ''}</div>
      <div class="s">${clock(f(e, TE.start))} – ${running ? 'now' : clock(f(e, TE.end))}${pending}</div></div>
      <div class="d">${hm(m)}<small>${dec(countedOf(e, now))} h</small></div>
      <button class="x" data-del="${esc(e.id)}" aria-label="Delete entry" ${running ? 'disabled hidden' : ''}>×</button></li>`;
  }).join('') : '<li class="empty">Nothing logged yet today.</li>';
}
function render() { renderSelects(); renderClock(); renderTotals(); renderBudget(); renderList(); renderSyncState(); }
function renderSyncState() {
  if (!navigator.onLine || !S.online) setSync('warn', queue.length ? `Offline · ${queue.length} to sync` : 'Offline');
  else setSync('ok', 'Synced');
}

// ---------- boot ----------
function wire() {
  $('go').addEventListener('click', () => (S.running ? stop() : start()));
  $('selClient').addEventListener('change', (e) => { S.sel.client = e.target.value; S.sel.eng = ''; render(); });
  $('selEng').addEventListener('change', (e) => { S.sel.eng = e.target.value; render(); });
  $('selDel').addEventListener('change', (e) => { S.sel.del = e.target.value; localStorage.setItem('sel', JSON.stringify(S.sel)); });
  $('selTask').addEventListener('change', (e) => { S.sel.task = e.target.value; localStorage.setItem('sel', JSON.stringify(S.sel)); });
  $('toggleManual').addEventListener('click', () => {
    const m = $('manual'); m.hidden = !m.hidden;
    if (!m.hidden) {
      const end = new Date(), start = new Date(end.getTime() - 30 * 60000);
      const v = (d) => `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      $('mStart').value = v(start); $('mEnd').value = v(end);
    }
  });
  $('manual').addEventListener('submit', addManual);
  $('list').addEventListener('click', (e) => { const b = e.target.closest('[data-del]'); if (b) remove(b.dataset.del); });
  window.addEventListener('online', async () => { S.online = true; await syncQueue(); await loadToday().catch(() => {}); render(); });
  window.addEventListener('offline', () => { S.online = false; renderSyncState(); });
  setInterval(() => { renderClock(); renderTotals(); }, 1000);
}
async function boot() {
  wire();
  try {
    await syncQueue();
    await loadConfig();
    await loadToday();
    S.online = true;
    render();
  } catch (e) {
    setSync('err', e.status === 403 ? 'Sign in required' : 'Could not load');
    msg(e.status === 403 ? 'Not signed in through Cloudflare Access.' : 'Could not load data: ' + (e.detail?.error?.message || e.message), true);
  }
  if ('serviceWorker' in navigator && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) navigator.serviceWorker.register('/sw.js').catch(() => {});
}
boot();
