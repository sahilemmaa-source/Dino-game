'use strict';
/* Dino Run - the page's only line to the hidden server. Same address as the game ("/api"), so every phone lands in one leaderboard.
   Nothing here can throw: when there is no server the game simply plays on its own and shows only this player. */
(() => {
  const O = String(window.DINO_LB_URL || '').replace(/\/+$/, ''), B = (/^https?:\/\//i.test(O) ? O : '') + '/api';
  let up = 0, upAt = 0, fails = 0, hold = 0, pend = null, busy = 0, initP = null, loopP = null;
  async function call(path, o, ms) {
    if (Date.now() < hold) return null;
    const c = typeof AbortController === 'function' ? new AbortController() : null, tm = setTimeout(() => { try { c && c.abort() } catch (e) { } }, ms || 4000);
    try {
      const r = await fetch(B + path, Object.assign({ cache: 'no-store', credentials: 'omit', signal: c ? c.signal : undefined }, o));
      clearTimeout(tm); let b = null; try { b = await r.json() } catch (e) { }
      if (r.status >= 500) throw 0; fails = 0; return { s: r.status, b };
    } catch (e) { clearTimeout(tm); if (++fails >= 3) { hold = Date.now() + 30000; fails = 0 } return null }
  }
  const post = (path, obj) => call(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(obj) });
  const N = {
    get on() { return !!up },
    /* is there a server behind /api? (asked at most every 20 s) */
    init() {
      if (initP) return initP;
      if (upAt && Date.now() - upAt < 20000) return Promise.resolve(!!up);
      initP = call('/ping', null, 2500).then(r => { up = r && r.s === 200 && r.b && r.b.ok === 1 ? 1 : 0; upAt = Date.now(); initP = null; return !!up }).catch(() => { initP = null; return false });
      return initP;
    },
    /* the banked total goes up; one request at a time, the newest numbers always go last */
    async push(me) {
      try {
        if (!up) { if (!(await N.init())) return }
        pend = { id: me.id, name: me.name, total: me.total | 0 }; if (busy) return; busy = 1;
        loopP = (async () => { try { while (pend) { const b = pend; pend = null; await post('/lb', b) } } finally { busy = 0; loopP = null } })(); await loopP
      } catch (e) { busy = 0 }
    },
    /* wait until the newest score has reached the server */
    sync() { return loopP || Promise.resolve() },
    async lb(me, limit) {
      try {
        const r = await call('/lb?limit=' + (limit || 100) + '&id=' + encodeURIComponent(me.id));
        if (!r || r.s !== 200 || !r.b || !Array.isArray(r.b.rows)) return null;
        return r.b.rows.slice(0, 100).map(x => ({ k: String(x.k || ''), name: String(x.name || '@guest'), pic: x.pic ? (/^\//.test(x.pic) ? (/^https?:\/\//i.test(O) ? O : '') + x.pic : '') : '', total: x.total | 0, me: x.me ? 1 : 0 }));
      } catch (e) { return null }
    },
    async saveProfile(me, pic) {
      try { const r = await post('/profile', { id: me.id, name: me.name, pic: pic || '' }); return r && r.s === 200 && r.b && r.b.ok ? { name: r.b.name, pic: r.b.pic } : null } catch (e) { return null }
    },
    /* true = the server allows a congratulation now (and has counted it), false = not yet, null = no server */
    async celebrate(me) {
      try { const r = await post('/celebrate', { id: me.id }); if (!r || r.s !== 200 || !r.b) return null; return r.b.ok === true } catch (e) { return null }
    }
  };
  window.DinoNet = N;
})();
