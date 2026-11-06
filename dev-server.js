// Demo server: serves ./public plus a small in-memory stand-in for the Airtable API.
// It never talks to Airtable, so you can try the whole app with no account or token.
// Run: node dev-server.js   (default port 5178; MOCK_OFFLINE=1 simulates an outage)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5178;
const rid = (n) => 'rec' + String(n).padStart(14, '0');
const CLIENTS = 'Clients', ENG = 'Engagements', DEL = 'Deliverables', TASK = 'Task Types', TE = 'Time Entries';

const db = {
  [CLIENTS]: [
    { id: rid(1), fields: { Name: 'Acme Coffee Roasters', Status: 'Active' } },
    { id: rid(2), fields: { Name: 'My Company (Internal)', Status: 'Active' } },
  ],
  [ENG]: [
    { id: rid(11), fields: { Name: 'Website Content Retainer', Stage: 'Active', Client: [rid(1)], Type: 'Client', 'Rounding Increment': 15, 'Included Hours': 60, 'Weekly Cap': 5, 'Monthly Cap': 20 } },
    { id: rid(12), fields: { Name: 'Brand Audit', Stage: 'Wrap-up', Client: [rid(1)], Type: 'Client' } },
    { id: rid(13), fields: { Name: 'Internal: Product development', Stage: 'Active', Client: [rid(2)], Type: 'Internal', 'Rounding Increment': 1 } },
  ],
  [DEL]: [
    { id: rid(21), fields: { Name: 'Homepage copy', Engagement: [rid(11)], Status: 'In progress' } },
    { id: rid(22), fields: { Name: 'Product pages', Engagement: [rid(11)], Status: 'Not started' } },
  ],
  [TASK]: [
    { id: rid(31), fields: { Name: 'Writing', 'Applies To': 'Client', Active: true, Sort: 20 } },
    { id: rid(32), fields: { Name: 'Editing', Parent: [rid(31)], 'Applies To': 'Client', Active: true, Sort: 21 } },
    { id: rid(33), fields: { Name: 'Communication', 'Applies To': 'Client', Active: true, Sort: 50 } },
    { id: rid(34), fields: { Name: 'Check-in call', Parent: [rid(33)], 'Applies To': 'Client', Active: true, Sort: 52 } },
    { id: rid(35), fields: { Name: 'Product', 'Applies To': 'Internal', Active: true, Sort: 100 } },
    { id: rid(36), fields: { Name: 'Tool build', Parent: [rid(35)], 'Applies To': 'Internal', Active: true, Sort: 101 } },
  ],
  [TE]: [],
};
let seq = 100;

// Stand-ins for the rollups and formulas the real base computes (see docs/airtable-schema.md).
const inc = (eid) => (db[ENG].find((e) => e.id === eid)?.fields['Rounding Increment']) || 15;
function recompute() {
  for (const eng of db[ENG]) {
    const used = db[TE]
      .filter((e) => (e.fields.Engagement || [])[0] === eng.id && e.fields.End)
      .reduce((a, e) => {
        const m = Math.round((Date.parse(e.fields.End) - Date.parse(e.fields.Start)) / 60000);
        const i = inc(eng.id);
        return a + (Math.ceil(m / i) * i) / 60;
      }, 0);
    const f = eng.fields;
    f['Hours Used'] = used; f['Hours This Week'] = used; f['Hours This Month'] = used;
    const inclH = f['Included Hours'];
    f['Budget Summary'] = inclH ? `${used.toFixed(2)} of ${inclH} h used (${Math.round((used / inclH) * 100)}%)` : (used ? `${used.toFixed(2)} h logged` : '');
    const wk = f['Weekly Cap'];
    f['Cap Flag'] = wk && used >= wk ? 'Weekly cap reached' : wk && used >= wk * 0.8 ? 'Near weekly cap' : '';
  }
}
function matchFormula(rec, formula) {
  if (!formula) return true;
  if (/\{Status\}\s*=\s*'Running'/.test(formula)) return rec.fields.Status === 'Running';
  const d = formula.match(/IS_SAME\(\{Work Date\},\s*'(\d{4}-\d{2}-\d{2})'/);
  if (d) return rec.fields['Work Date'] === d[1];
  const u = formula.match(/\{Entry UUID\}\s*=\s*'([^']+)'/);
  if (u) return rec.fields['Entry UUID'] === u[1];
  return true;
}
const send = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise((r) => { let s = ''; req.on('data', (c) => (s += c)); req.on('end', () => r(s ? JSON.parse(s) : {})); });
const strip = (b) => { const { typecast, ...rest } = b; return rest; };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/')) {
    const [, , rawTable, recId] = url.pathname.split('/');
    const table = decodeURIComponent(rawTable || '');
    if (!db[table]) return send(res, 404, { error: 'Unknown table' });
    if (process.env.MOCK_OFFLINE === '1') return send(res, 503, { error: 'offline' });
    recompute();
    if (req.method === 'GET' && !recId) {
      return send(res, 200, { records: db[table].filter((r) => matchFormula(r, url.searchParams.get('filterByFormula'))) });
    }
    if (req.method === 'GET') { const r = db[table].find((x) => x.id === recId); return r ? send(res, 200, r) : send(res, 404, { error: 'no' }); }
    if (table !== TE) return send(res, 405, { error: 'Not allowed' });
    if (req.method === 'POST') {
      const b = strip(await readBody(req));
      const rec = { id: rid(++seq), fields: b.records[0].fields };
      db[table].push(rec); recompute();
      return send(res, 200, { records: [rec] });
    }
    if (req.method === 'PATCH') {
      const b = strip(await readBody(req)); const r = db[table].find((x) => x.id === recId);
      if (!r) return send(res, 404, { error: 'no' });
      Object.assign(r.fields, b.fields); recompute();
      return send(res, 200, r);
    }
    if (req.method === 'DELETE') { db[table] = db[table].filter((x) => x.id !== recId); recompute(); return send(res, 200, { id: recId, deleted: true }); }
    return send(res, 405, { error: 'Not allowed' });
  }
  const p = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = path.join(__dirname, 'public', path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, () => console.log('Demo server on http://localhost:' + PORT));
