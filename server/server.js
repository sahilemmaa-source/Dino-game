'use strict';
/* Dino Run - server v2.  One dependency-free Node (18+) process that serves the game AND the hidden API under /api,
   so every player on every phone lands in the same leaderboard. The page only draws; every score, name, photo and
   congratulation goes through here and is checked here.

     node server/server.js        env: PORT (8787) HOST SITE DATA_DIR ORIGINS TRUST_PROXY MAX_ACCOUNTS
*/
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = +process.env.PORT || 8787, HOST = process.env.HOST || '0.0.0.0';
const ROOT = path.resolve(process.env.SITE || path.join(__dirname, '..'));
const DATA = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const ORIGINS = (process.env.ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const TRUST = process.env.TRUST_PROXY === '1', TEST = process.env.DINO_TEST === '1';
const MAXACC = +process.env.MAX_ACCOUNTS || 5e6;
const H24 = 864e5, H5 = 18e6;
const log = (...a) => { try { console.log(new Date().toISOString(), ...a) } catch (e) { } };
const sha = (s, n) => crypto.createHash('sha256').update(s).digest('hex').slice(0, n);

/* ---------- the store: a Map in memory, written to disk atomically. (Swap this block for Redis/Postgres at crore scale;
   nothing else in the file touches the disk except the picture files.) ---------- */
const A = new Map(), PR = new Map();               // accounts by hashed id, picture reference counts
const DBF = path.join(DATA, 'db.json'), PICS = path.join(DATA, 'pics');
let dirty = 0, writing = 0;
function dbLoad() {
  for (const f of [DBF, DBF + '.bak']) {
    try { const j = JSON.parse(fs.readFileSync(f, 'utf8')); for (const [k, v] of Object.entries(j.a || {})) { if (v && typeof v.t === 'number') { A.set(k, v); if (v.p) PR.set(v.p, (PR.get(v.p) || 0) + 1) } } log('loaded', A.size, 'accounts from', path.basename(f)); return }
    catch (e) { }
  }
}
function dbFlush(sync) {
  if (!dirty || (writing && !sync)) return; dirty = 0;
  let s; try { s = JSON.stringify({ v: 1, a: Object.fromEntries(A) }) } catch (e) { dirty = 1; return }
  const tmp = DBF + '.tmp';
  try {
    fs.mkdirSync(DATA, { recursive: true });
    if (sync) { fs.writeFileSync(tmp, s); try { fs.copyFileSync(DBF, DBF + '.bak') } catch (e) { } fs.renameSync(tmp, DBF); return }
    writing = 1;
    fs.writeFile(tmp, s, e => { if (e) { writing = 0; dirty = 1; return } fs.copyFile(DBF, DBF + '.bak', () => fs.rename(tmp, DBF, e2 => { writing = 0; if (e2) dirty = 1 })) });
  } catch (e) { writing = 0; dirty = 1; log('flush failed', e.message) }
}
const touch = () => { dirty = 1 };
setInterval(() => dbFlush(false), 2000).unref();

/* ---------- small helpers ---------- */
const NAME = /^@[a-z0-9_.]{1,13}$/, ID = /^[A-Za-z0-9_-]{8,40}$/, PICH = /^[a-f0-9]{24}$/;
const guest = () => '@guest' + (1000 + crypto.randomInt(9000));
function acct(id, t, create) {
  const k = sha('dino|' + id, 32); let a = A.get(k);
  if (!a && create) { if (A.size >= MAXACC) return null; a = { n: guest(), p: '', t: 0, ca: t, ls: t, lp: 0, ce: [], s: 0 }; A.set(k, a); inval(); touch() }
  return a ? [k, a] : null;
}
const picUrl = a => a.p ? '/api/pic/' + a.p + '.jpg' : '';
function picRef(h, d) { if (!h) return; const n = (PR.get(h) || 0) + d; if (n > 0) PR.set(h, n); else { PR.delete(h); try { fs.unlinkSync(path.join(PICS, h + '.jpg')) } catch (e) { } } }

/* ---------- top list: computed lazily, cached for a second, so a million accounts never mean a million-row scan per request ---------- */
let topAt = 0, topRows = [], topLim = 0;
const inval = () => { if (TEST) topAt = 0 };
function top(lim, t) {
  if (t - topAt < 1000 && topLim >= lim && topAt) return topRows.slice(0, lim);
  const cmp = (x, y) => y[1].t - x[1].t || x[1].ca - y[1].ca, L = [];
  for (const e of A) {
    if (e[1].t <= 0) continue;
    if (L.length >= lim && cmp(e, L[L.length - 1]) >= 0) continue;
    let lo = 0, hi = L.length; while (lo < hi) { const m = (lo + hi) >> 1; if (cmp(L[m], e) <= 0) lo = m + 1; else hi = m } L.splice(lo, 0, e); if (L.length > lim) L.pop();
  }
  topRows = L; topLim = lim; topAt = t; return L.slice();
}
const row = (k, a, me) => ({ k: k.slice(0, 12), name: a.n, pic: picUrl(a), total: a.t, me: me ? 1 : 0 });

/* ---------- limits ---------- */
const buckets = new Map();
function allow(key, cap, per, t) {
  let b = buckets.get(key);
  if (!b) { if (buckets.size > 2e5) buckets.delete(buckets.keys().next().value); b = { n: cap, s: t }; buckets.set(key, b) }
  else { b.n = Math.min(cap, b.n + (t - b.s) / per * cap); b.s = t }
  if (b.n < 1) return false; b.n -= 1; return true;
}
setInterval(() => { const t = Date.now(); for (const [k, b] of buckets) if (t - b.s > 120000) buckets.delete(k) }, 60000).unref();

/* ---------- http plumbing ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
let CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
try { const m = /^\s*Content-Security-Policy:\s*(.+)$/im.exec(fs.readFileSync(path.join(ROOT, '_headers'), 'utf8')); if (m) CSP = m[1].trim() } catch (e) { }
const SEC = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()', 'cross-origin-opener-policy': 'same-origin', 'cross-origin-resource-policy': 'same-origin', 'x-frame-options': 'DENY' };
function hdr(req, extra) {
  const h = Object.assign({ 'content-security-policy': CSP }, SEC, extra);
  if (TRUST && req.headers['x-forwarded-proto'] === 'https') h['strict-transport-security'] = 'max-age=63072000; includeSubDomains';
  return h;
}
function send(req, res, code, obj, extra) {
  const b = Buffer.from(JSON.stringify(obj));
  res.writeHead(code, hdr(req, Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': b.length }, extra)));
  res.end(req.method === 'HEAD' ? undefined : b);
}
function body(req, limit) {
  return new Promise((ok, no) => {
    let n = 0; const a = []; let done = 0;
    req.on('data', c => { if (done) return; n += c.length; if (n > limit) { done = 1; no({ code: 413 }); req.resume(); return } a.push(c) });
    req.on('end', () => { if (!done) { done = 1; ok(Buffer.concat(a).toString('utf8')) } });
    req.on('error', () => { if (!done) { done = 1; no({ code: 400 }) } });
  });
}
const clientIp = req => { if (TRUST) { const f = req.headers['cf-connecting-ip'] || String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(); if (f) return f } return req.socket.remoteAddress || '?' };

/* ---------- the API ---------- */
async function api(req, res, u, t, cors) {
  const ip = clientIp(req), p = u.pathname, ex = cors ? { 'access-control-allow-origin': cors, vary: 'Origin' } : {};
  const S = (c, o) => send(req, res, c, o, ex);
  if (req.method === 'OPTIONS') { res.writeHead(204, hdr(req, cors ? { 'access-control-allow-origin': cors, 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '600', vary: 'Origin' } : {})); return res.end() }
  if (!allow('g' + ip, 80, 10000, Date.now())) return send(req, res, 429, { error: 'slow down' }, Object.assign({ 'retry-after': '5' }, ex));
  if (p === '/api/ping' && (req.method === 'GET' || req.method === 'HEAD')) return S(200, { ok: 1, t });
  if (p === '/api/lb' && req.method === 'GET') {
    const lim = Math.max(1, Math.min(100, +u.searchParams.get('limit') || 100)), id = u.searchParams.get('id') || '';
    const mk = ID.test(id) ? sha('dino|' + id, 32) : '', L = top(lim, t), rows = L.map(([k, a]) => row(k, a, k === mk));
    if (mk && !rows.some(r => r.me)) { const a = A.get(mk); if (a && a.t > 0) rows.push(row(mk, a, 1)) }
    return S(200, { rows });
  }
  if (p.startsWith('/api/pic/') && (req.method === 'GET' || req.method === 'HEAD')) {
    const h = p.slice(9).replace(/\.jpg$/, ''); if (!PICH.test(h)) return S(404, { error: 'not found' });
    let b; try { b = fs.readFileSync(path.join(PICS, h + '.jpg')) } catch (e) { return S(404, { error: 'not found' }) }
    res.writeHead(200, hdr(req, Object.assign({ 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable', 'content-length': b.length }, ex, { 'cross-origin-resource-policy': 'cross-origin' })));
    return res.end(req.method === 'HEAD' ? undefined : b);
  }
  if (req.method !== 'POST') return S(404, { error: 'not found' });
  if (!/^application\/json/i.test(req.headers['content-type'] || '')) return S(415, { error: 'json only' });
  let j; try { j = JSON.parse(await body(req, p === '/api/profile' ? 65536 : 2048)) } catch (e) { return S(e && e.code === 413 ? 413 : 400, { error: e && e.code === 413 ? 'too large' : 'bad json' }) }
  if (!j || typeof j !== 'object' || typeof j.id !== 'string' || !ID.test(j.id)) return S(400, { error: 'bad id' });
  if (p === '/api/lb') {
    const r = acct(j.id, t, 1); if (!r) return S(503, { error: 'full' }); const [, a] = r;
    if (typeof j.name === 'string' && NAME.test(j.name)) a.n = j.name;
    const want = Math.max(0, Math.min(2e9, Math.floor(+j.total || 0)));
    if (t - a.lp >= 1000) {                                             // at most one score update a second per account
      const dt = Math.min(Math.max(0, t - a.ls), 30 * H24) / 1000, room = a.lp ? 59 * dt + 120 : 5000 + 59 * dt;   // nobody scores faster than ~59 a second
      if (want > a.t) { const g = Math.min(want - a.t, Math.floor(room)); if (g < want - a.t) a.s++; a.t += g; inval() }
      a.lp = t; a.ls = t; touch();
    }
    return S(200, { ok: 1, total: a.t, name: a.n });
  }
  if (p === '/api/profile') {
    if (!allow('p' + ip, 6, 60000, Date.now())) return S(429, { error: 'slow down' });
    if (typeof j.name === 'string' && j.name !== '' && !NAME.test(j.name)) return S(400, { error: 'bad name' });
    let hash = null, buf = null;
    if (typeof j.pic === 'string' && j.pic !== '') {
      const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(j.pic); if (!m || m[1].length > 56000) return S(400, { error: 'bad photo' });
      buf = Buffer.from(m[1], 'base64'); if (buf.length < 100 || buf.length > 40960 || buf[0] !== 0xFF || buf[1] !== 0xD8 || buf[2] !== 0xFF || buf[buf.length - 2] !== 0xFF || buf[buf.length - 1] !== 0xD9) return S(400, { error: 'bad photo' });
      hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 24);
    }
    const r = acct(j.id, t, 1); if (!r) return S(503, { error: 'full' }); const [, a] = r;
    if (typeof j.name === 'string' && j.name !== '') a.n = j.name;
    if (hash !== null || j.pic === '') {
      const nh = hash || '';
      if (nh !== a.p) { if (nh) { try { fs.mkdirSync(PICS, { recursive: true }); const f = path.join(PICS, nh + '.jpg'); if (!fs.existsSync(f)) fs.writeFileSync(f, buf) } catch (e) { return S(500, { error: 'could not save' }) } picRef(nh, 1) } const old = a.p; a.p = nh; picRef(old, -1) }
    }
    inval(); touch(); return S(200, { ok: 1, name: a.n, pic: picUrl(a) });
  }
  if (p === '/api/celebrate') {
    if (!allow('c' + ip, 10, 60000, Date.now())) return S(429, { error: 'slow down' });
    const r = acct(j.id, t, 1); if (!r) return S(503, { error: 'full' }); const [, a] = r;
    a.ce = (a.ce || []).filter(x => x > t - H24 && x <= t + 6e4);
    const last = a.ce.length ? a.ce[a.ce.length - 1] : 0;
    if (a.ce.length >= 2 || (last && t - last < H5)) return S(200, { ok: false, wait: Math.max(a.ce.length >= 2 ? a.ce[0] + H24 - t : 0, last ? last + H5 - t : 0) });
    a.ce.push(t); touch(); return S(200, { ok: true });
  }
  return S(404, { error: 'not found' });
}

/* ---------- the game files (and nothing else: no /server, no data, no dotfiles, no json, no notes) ---------- */
function stat(req, res, u) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, hdr(req, { allow: 'GET, HEAD' })); return res.end() }
  let p; try { p = decodeURIComponent(u.pathname) } catch (e) { res.writeHead(400, hdr(req)); return res.end() }
  if (p.includes('\0') || p.includes('\\')) { res.writeHead(400, hdr(req)); return res.end() }
  if (p.endsWith('/')) p += 'index.html';
  const parts = p.split('/').filter(Boolean);
  if (parts.some(s => s === '..' || s.startsWith('.') || s.startsWith('_') || /^(server|functions|data|node_modules)$/i.test(s) || /^(readme|changelog|package)/i.test(s)) || /\.(json|map|log|bak|tmp)$/i.test(p)) { res.writeHead(404, hdr(req)); return res.end() }
  const f = path.join(ROOT, ...parts); if (!f.startsWith(ROOT + path.sep) && f !== ROOT) { res.writeHead(403, hdr(req)); return res.end() }
  fs.stat(f, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404, hdr(req, { 'content-type': 'text/plain; charset=utf-8' })); return res.end('Not found') }
    const ext = path.extname(f).toLowerCase(), cache = /\.(png|jpg|ico|woff2)$/.test(ext) ? 'public, max-age=86400' : 'no-cache';
    res.writeHead(200, hdr(req, { 'content-type': MIME[ext] || 'application/octet-stream', 'content-length': st.size, 'cache-control': cache, 'last-modified': st.mtime.toUTCString() }));
    if (req.method === 'HEAD') return res.end();
    const s = fs.createReadStream(f); s.on('error', () => res.destroy()); s.pipe(res);
  });
}

async function handle(req, res) {
  let t = Date.now(); if (TEST && req.headers['x-test-now']) t = +req.headers['x-test-now'] || t;
  let u; try { u = new URL(req.url, 'http://x') } catch (e) { res.writeHead(400, hdr(req)); return res.end() }
  if (u.pathname === '/api' || u.pathname.startsWith('/api/')) {
    const o = req.headers.origin; let cors = '', same = !o;
    if (o) { const hh = (TRUST && req.headers['x-forwarded-host']) || req.headers.host; try { same = new URL(o).host === hh } catch (e) { } if (ORIGINS.includes('*') || ORIGINS.includes(o)) cors = o }
    if (!same && !cors && req.method !== 'GET' && req.method !== 'HEAD') return send(req, res, 403, { error: 'origin' });
    return api(req, res, u, t, cors);
  }
  if (!allow('s' + clientIp(req), 300, 10000, Date.now())) { res.writeHead(429, hdr(req, { 'retry-after': '5' })); return res.end() }
  return stat(req, res, u);
}

dbLoad();
const srv = http.createServer((req, res) => {
  handle(req, res).catch(e => { log('error', e && e.stack || e); try { if (!res.headersSent) send(req, res, 500, { error: 'server error' }); else res.destroy() } catch (_) { } });
});
srv.requestTimeout = 15000; srv.headersTimeout = 10000; srv.keepAliveTimeout = 5000; srv.maxHeadersCount = 50;
srv.on('clientError', (e, s) => { try { s.destroy() } catch (_) { } });
process.on('uncaughtException', e => log('uncaught', e && e.stack || e));
process.on('unhandledRejection', e => log('unhandled', e && e.stack || e));
let closing = 0;
function bye() { if (closing) return; closing = 1; log('shutting down'); try { srv.close() } catch (e) { } dbFlush(true); setTimeout(() => process.exit(0), 300).unref(); process.exit(0) }
process.on('SIGTERM', bye); process.on('SIGINT', bye);
srv.listen(PORT, HOST, () => log('Dino Run on http://' + (HOST === '0.0.0.0' ? 'localhost' : HOST) + ':' + PORT + '  (site: ' + ROOT + ', data: ' + DATA + ')'));
