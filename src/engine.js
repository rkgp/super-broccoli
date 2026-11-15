/* Map engine. Draws the whole site from window.SITE (content/site.json).
   Nothing here names a project: adding a station is one entry in the content file. */
(function () {
  'use strict';
  const SITE = window.SITE, OPTS = window.SITE_OPTS || {};
  const RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), cv = $('cv'), ctx = cv.getContext('2d');
  const hubwrap = $('hubwrap'), mappills = $('mappills'), mapbtn = $('mapbtn');
  const stationEl = $('station'), stInner = $('st-inner'), sheet = $('sheet');
  const TAU = Math.PI * 2;

  // ---------- branches (variants): same content and structure, different look and motion ----------
  const VARIANTS = {
    line:    { label: 'Line',       stars: 240, twinkle: false, nebula: false, grid: false, glow: 0,  lw: 8, node: 'ring',   wipe: 'circle', text: 'rise', hud: false, warp: 0, dip: 0.26, hub: 'disc' },
    deep:    { label: 'Deep space', stars: 420, twinkle: true,  nebula: true,  grid: false, glow: 16, lw: 5, node: 'planet', wipe: 'planet', text: 'rise', hud: false, warp: 1, dip: 0.44, hub: 'sun' },
    console: { label: 'Console',    stars: 110, twinkle: false, nebula: false, grid: true,  glow: 0,  lw: 3, node: 'square', wipe: 'frame',  text: 'type', hud: true,  warp: 0, dip: 0.16, hub: 'scope' }
  };
  let V = VARIANTS.line;

  // ---------- helpers ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mod = (a, n) => ((a % n) + n) % n;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function rgb(hex) { return [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16)); }
  function mix(a, b, t) { const pa = rgb(a), pb = rgb(b); return 'rgb(' + pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(',') + ')'; }
  function rgba(hex, a) { const p = rgb(hex); return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + a + ')'; }

  // ---------- geometry: the map is laid out from the content, no coordinates in the content file ----------
  const LINES = SITE.lines, BYID = {};
  const SPACING = 450, FIRST = 700;
  // Routes: the shape of the lines. Stations keep the same spacing along every route.
  const ROUTES = [
    { key: 'metro', label: 'Metro' }, { key: 'serpentine', label: 'Serpentine' }, { key: 'galaxy', label: 'Galaxy' },
    { key: 'river', label: 'River' }, { key: 'loops', label: 'Loops' }, { key: 'cascade', label: 'Cascade' }
  ];
  let BOUNDS = { cx: 0, cy: 0, w: 1, h: 1 };
  function pathLen(pts) { let len = 0; for (let i = 0; i < pts.length - 1; i++) len += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); return len; }
  function cut(pts, total) {
    const out = [pts[0]]; let len = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const seg = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      if (len + seg >= total) { const u = seg ? (total - len) / seg : 0; out.push([lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)]); return out; }
      out.push(pts[i + 1]); len += seg;
    }
    return out;
  }
  function makePath(route, li, need) {
    const s = li % 2 === 0 ? -1 : 1, pts = [[0, 0]];
    if (route === 'serpentine') {
      // out and back in rows, with 45 degree corners
      pts.push([s * 1900, 0]);
      let y = 0, out = true;
      while (pathLen(pts) < need) {
        if (out) pts.push([s * 2100, y + 200], [s * 2100, y + 300], [s * 1900, y + 500], [s * 700, y + 500]);
        else pts.push([s * 500, y + 200], [s * 500, y + 300], [s * 700, y + 500], [s * 1900, y + 500]);
        y += 500; out = !out;
      }
      return cut(pts, need);
    }
    if (route === 'galaxy') {
      // two spiral arms around the hub
      const a = 165, base = (s < 0 ? Math.PI : 0) - 1.4; let th = 0, len = 0, px = 0, py = 0;   // turned so the arm passes the hub's side where its button sits
      while (len < need) {
        th += 22 / (a * Math.sqrt(1 + th * th));
        const x = a * th * Math.cos(base + th), y = a * th * Math.sin(base + th);
        len += Math.hypot(x - px, y - py); px = x; py = y; pts.push([x, y]);
      }
      return cut(pts, need);
    }
    if (route === 'river') {
      // a meandering curve that drifts outward and down
      const al = Math.PI / 6, A = 230, lam = 1400; let u = 0, len = 0, px = 0, py = 0;
      while (len < need) {
        u += 20; const o = A * Math.sin(TAU * u / lam);
        const x = s * (u * Math.cos(al) + o * Math.sin(al)), y = u * Math.sin(al) - o * Math.cos(al);
        len += Math.hypot(x - px, y - py); px = x; py = y; pts.push([x, y]);
      }
      return cut(pts, need);
    }
    if (route === 'cascade') {
      // the river's drift in straight lines: level runs joined by 45 degree drops
      const runs = [520, 380, 460, 340], drops = [250, 330, 210, 290]; let x = 0, y = 0, i = 0;
      while (pathLen(pts) < need) {
        x += runs[i % 4]; pts.push([s * x, y]);
        x += drops[i % 4]; y += drops[i % 4]; pts.push([s * x, y]);
        i++;
      }
      return cut(pts, need);
    }
    if (route === 'loops') {
      // each line is a loop that leaves the hub and comes back to it
      const R = (need + 500) / TAU, n = Math.ceil(TAU * R / 22);
      for (let i = 1; i <= n; i++) { const ph = TAU * i / n; pts.push([s * R * Math.sin(ph), -s * (R - R * Math.cos(ph))]); }
      pts[pts.length - 1] = [0, 0];
      return pts;
    }
    // metro: long straights with 45 degree bends
    if (li < 2) {
      const t = s, straightEnd = 250 + Math.hypot(250, 250) + 1900;
      pts.push([s * 250, 0], [s * 500, t * 250]);
      if (need <= straightEnd) pts.push([s * (500 + need - 250 - Math.hypot(250, 250)), t * 250]);
      else pts.push([s * 2400, t * 250], [s * 2700, t * 250 + 300], [s * 2700, t * 250 + 300 + Math.max(220, need - straightEnd - Math.hypot(300, 300))]);
      return pts;
    }
    const t = li === 2 ? 1 : -1;
    pts.push([0, t * 300], [s * 250, t * 550], [s * 250, t * (550 + Math.max(220, need - 300 - Math.hypot(250, 250)))]);
    return pts;
  }
  function layout(route) {
    let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    LINES.forEach(function (L, li) {
      const n = L.stations.length, need = FIRST + (n - 1) * SPACING + 220;
      L.pts = makePath(route, li, need); L.li = li; L.len = pathLen(L.pts); L.loop = route === 'loops';
      L.stations.forEach(function (st, i) { st.d = FIRST + i * SPACING; BYID[st.id] = { l: li, i: i }; });
      L.pts.forEach((p) => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    });
    BOUNDS = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
  }
  const routeOk = (r) => ROUTES.some((x) => x.key === r);
  layout(routeOk(OPTS.route) ? OPTS.route : 'metro');
  const TOTAL = LINES.reduce((a, L) => a + L.stations.length, 0);

  function along(pts, d) {
    let rem = Math.max(0, d);
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], len = Math.hypot(dx, dy);
      if (rem <= len || i === pts.length - 2) {
        const t = len ? Math.min(1, rem / len) : 0;
        return { x: pts[i][0] + dx * t, y: pts[i][1] + dy * t, ux: len ? dx / len : 0, uy: len ? dy / len : 0 };
      }
      rem -= len;
    }
    return { x: pts[0][0], y: pts[0][1], ux: 1, uy: 0 };
  }
  function trace(pts, d, map) {
    let rem = Math.max(0, d), p = map(pts[0][0], pts[0][1]);
    ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], len = Math.hypot(dx, dy);
      if (rem >= len) { p = map(pts[i + 1][0], pts[i + 1][1]); ctx.lineTo(p[0], p[1]); rem -= len; }
      else { const t = len ? rem / len : 0; p = map(pts[i][0] + dx * t, pts[i][1] + dy * t); ctx.lineTo(p[0], p[1]); break; }
    }
    ctx.stroke();
  }

  // ---------- state ----------
  let W = 0, H = 0, DPR = 1;
  const S = { at: null, travel: null, overview: false, service: 'express', view: null, busy: false, variant: 'line', route: routeOk(OPTS.route) ? OPTS.route : 'metro', code: null };
  const rev = [], revT = [];
  LINES.forEach((L, li) => { rev[li] = 0; revT[li] = 170; });
  let enter = 0, wipe = null, showTimer = 0, vizStop = null, lastHash = '', born = 0;
  const cam = { x: 0, y: 0, z: 1, fx: 0, fy: 0 }, prevCam = { x: 0, y: 0 };
  const C = {};
  let stars = [];
  const NEB = [
    { x: -1100, y: -500, r: 900, c: LINES[0].color, a: 0.13 },
    { x: 1300, y: 500, r: 1000, c: (LINES[1] || LINES[0]).color, a: 0.12 },
    { x: -200, y: 1500, r: 1100, c: '#7B6CF6', a: 0.10 },
    { x: 2300, y: -900, r: 800, c: '#7B6CF6', a: 0.08 },
    { x: -2600, y: 1400, r: 1000, c: LINES[0].color, a: 0.08 }
  ];
  const SPEED = []; for (let i = 0; i < 54; i++) SPEED.push({ a: Math.random() * TAU, o: Math.random(), l: 40 + Math.random() * 120 });

  function readColors() {
    const css = getComputedStyle(document.documentElement);
    ['space', 'ink', 'dim', 'rule'].forEach((k) => { C[k] = css.getPropertyValue('--' + k).trim(); });
    LINES.forEach((L) => { L.tint = mix(L.color, C.space, 0.86); L.core = mix(L.color, C.space, 0.5); });
    C.neutral = mix(C.ink, C.space, 0.9);
  }
  function seedStars() {
    stars = [];
    for (let i = 0; i < V.stars; i++) stars.push({ x: Math.random() * 4000, y: Math.random() * 4000, p: 0.08 + Math.random() * 0.5, a: 0.25 + Math.random() * 0.7, r: 0.5 + Math.random() * 1.1, tw: 0.6 + Math.random() * 1.8, ph: Math.random() * TAU });
  }
  function setVariant(v) {
    if (!VARIANTS[v]) v = 'line';
    S.variant = v; V = VARIANTS[v];
    document.documentElement.setAttribute('data-variant', v);
    readColors(); seedStars();
    if (S.view === 'station' && vizStop && window.Diagrams) { startViz(); }
  }
  function setRoute(r, show) {
    if (!routeOk(r)) r = 'metro';
    S.route = r; S.travel = null; S.busy = false; hideViewNow(); S.at = null;
    layout(r);
    LINES.forEach(function (L, li) { rev[li] = 0; revT[li] = 0; });
    cam.x = 0; cam.y = 0; prevCam.x = 0; prevCam.y = 0;
    resize(); setHash('');
    setOverview(!!show, true); syncHub();
  }
  function resize() {
    const r = stage.getBoundingClientRect();
    W = Math.max(280, r.width); H = Math.max(300, r.height);
    DPR = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    if (!cam.fx) { cam.fx = W / 2; cam.fy = H * 0.3; }
    const stub = Math.max(170, 128 / clamp(Math.min(W, H) / 620, 0.55, 1.25) + 40);
    LINES.forEach(function (L, li) { revT[li] = Math.max(revT[li], stub); });
  }

  const served = (l, i) => S.service === 'all' || LINES[l].stations[i].express;
  function nextServed(at) { const st = LINES[at.l].stations; for (let j = at.i + 1; j < st.length; j++) if (served(at.l, j)) return j; return -1; }
  function prevServed(at) { for (let j = at.i - 1; j >= 0; j--) if (served(at.l, j)) return j; return -1; }
  const posOf = (at) => (at ? along(LINES[at.l].pts, LINES[at.l].stations[at.i].d) : { x: 0, y: 0 });
  function revealTo(at) { if (at) { const L = LINES[at.l]; revT[at.l] = Math.max(revT[at.l], Math.min(L.len, L.stations[at.i].d + 130)); } }

  // ---------- anonymous statistics hook (does nothing unless a cookieless analytics script is present) ----------
  function track(name, props) {
    try {
      const p = Object.assign({}, props || {}); if (S.code) p.code = S.code;
      if (typeof window.plausible === 'function') window.plausible(name, { props: p });
    } catch (e) { /* statistics must never break the site */ }
  }
  function setHash(id) {
    lastHash = id || '';
    try {
      if ((location.hash || '').slice(1) === lastHash) return;
      if (lastHash) location.hash = lastHash;
      else history.replaceState(null, '', location.pathname + location.search);
    } catch (e) { /* some viewers lock the address */ }
  }

  // ---------- station and about views ----------
  function mediaHtml(st, L) {
    let h = '';
    if (st.viz && window.Diagrams) h += '<canvas class="viz" data-viz="' + esc(st.viz) + '" role="img" aria-label="' + esc(window.Diagrams.describe(st.viz)) + '"></canvas>';
    const media = st.media || [];
    const fig = (m) => '<figure class="shot' + (m.src ? '' : ' ph') + '">' + (m.src ? '<img src="' + esc(m.src) + '" alt="' + esc(m.alt || '') + '" loading="lazy">' : '<figcaption>' + esc(m.caption || 'Photo follows') + '</figcaption>') + '</figure>';
    if (media.length) h += fig(media[0]);
    if (media.length > 1) h += '<div class="thumbs">' + media.slice(1).map(fig).join('') + '</div>';
    return h;
  }
  function renderStation() {
    const at = S.at, L = LINES[at.l], st = L.stations[at.i]; let n = 0;
    const nx = nextServed(at), pv = prevServed(at), more = at.i + 1 < L.stations.length;
    const rel = (st.related || []).filter((r) => BYID[r.id]);
    const media = mediaHtml(st, L);
    stationEl.className = 'station'; stationEl.style.setProperty('--line', L.color);
    stInner.className = 'st-inner' + (media ? ' has-media' : '');
    let h = '<div class="st-head">';
    h += '<div class="tag rise" style="--i:' + (n++) + '"><i></i><span>' + esc(L.title) + ' · stop ' + (at.i + 1) + ' of ' + L.stations.length + (st.org ? ' · ' + esc(st.org) : '') + '</span></div>';
    h += '<h2 class="st-name rise" data-type style="--i:' + (n++) + '" aria-label="' + esc(st.name) + '">' + esc(st.name) + '</h2>';
    h += '<p class="st-kicker rise" data-type style="--i:' + (n++) + '" aria-label="' + esc(st.kicker) + '">' + esc(st.kicker) + '</p></div>';
    if (media) h += '<div class="st-media rise" style="--i:' + (n++) + '">' + media + '</div>';
    h += '<div class="st-body">';
    if (st.stats && st.stats.length) {
      h += '<div class="stats rise" style="--i:' + (n++) + '">' + st.stats.map(function (s) {
        const word = !/\d/.test(s.n);
        return '<div class="stat"><b' + (word ? ' class="word"' : ' data-n="' + esc(s.n) + '"') + '>' + esc(s.n) + '</b><span>' + esc(s.l) + '</span></div>';
      }).join('') + '</div>';
    }
    if (st.did && st.did.length) h += '<ul class="did rise" style="--i:' + (n++) + '">' + st.did.map((d) => '<li>' + esc(d) + '</li>').join('') + '</ul>';
    if (st.tools && st.tools.length) h += '<div class="tools rise" style="--i:' + (n++) + '">' + st.tools.map((t) => '<span>' + esc(t) + '</span>').join('') + '</div>';
    h += '<div class="acts rise" style="--i:' + (n++) + '">';
    if (nx >= 0) h += '<button class="btn primary" type="button" data-go="' + at.l + ':' + nx + '">Next stop: ' + esc(L.stations[nx].name) + '</button>';
    else if (more) h += '<button class="btn primary" type="button" data-keep="' + at.l + ':' + (at.i + 1) + '">Keep going: all stops</button>';
    if (pv >= 0) h += '<button class="btn" type="button" data-go="' + at.l + ':' + pv + '">Previous</button>';
    h += '<button class="btn' + (nx < 0 && !more ? ' primary' : '') + '" type="button" data-go="hub">Back to the start</button>';
    rel.forEach(function (r) {
      const x = BYID[r.id];
      h += '<button class="btn" type="button" data-go="' + x.l + ':' + x.i + '" data-transfer="1"><i style="background:' + LINES[x.l].color + '"></i>Change to ' + esc(LINES[x.l].stations[x.i].name) + '</button>';
    });
    h += '</div>';
    if (rel.length) h += '<div class="why rise" style="--i:' + (n++) + '">Transfer: ' + esc(rel.map((r) => r.why).filter(Boolean).join('; ')) + '</div>';
    h += '</div>';
    stInner.innerHTML = h;
  }
  function renderAbout() {
    const A = SITE.about, M = SITE.meta; let n = 0;
    stationEl.className = 'station about'; stationEl.style.setProperty('--line', C.ink);
    stInner.className = 'st-inner';
    let h = '<div class="st-head"><div class="tag rise" style="--i:' + (n++) + '"><i></i><span>' + esc(M.role) + '</span></div>';
    h += '<h2 class="st-name rise" data-type style="--i:' + (n++) + '" aria-label="' + esc(M.name) + '">' + esc(M.name) + '</h2></div><div class="st-body">';
    A.paragraphs.forEach((p) => { h += '<p class="rise" style="--i:' + (n++) + '">' + esc(p) + '</p>'; });
    h += '<div class="rise" style="--i:' + (n++) + '"><h3>' + esc(A.howTitle) + '</h3><p>' + esc(A.how) + '</p></div>';
    h += '<div class="cols rise" style="--i:' + (n++) + '"><div><h3>Experience</h3><ul class="tl">' + A.experience.map((x) => '<li><b>' + esc(x.role) + '</b><span>' + esc(x.org) + ' · ' + esc(x.period) + '</span></li>').join('') + '</ul></div>';
    h += '<div><h3>Education</h3><ul class="tl">' + A.education.map((x) => '<li><b>' + esc(x.what) + '</b><span>' + esc(x.period) + '</span></li>').join('') + '</ul>';
    h += '<h3 style="margin-top:18px">Works with</h3><div class="tools">' + A.skills.map((t) => '<span>' + esc(t) + '</span>').join('') + '</div>';
    h += '<h3 style="margin-top:18px">Languages</h3><div class="tools">' + A.languages.map((t) => '<span>' + esc(t) + '</span>').join('') + '</div></div></div>';
    h += '<div class="acts rise" style="--i:' + (n++) + '"><a class="btn primary" href="' + esc(M.linkedin) + '" target="_blank" rel="noopener">Contact me on LinkedIn</a><button class="btn" type="button" data-go="hub">Back to the map</button></div></div>';
    stInner.innerHTML = h;
  }
  function countUp() {
    stInner.querySelectorAll('b[data-n]').forEach(function (el) {
      const raw = el.getAttribute('data-n'), m = raw.match(/^(\D*)([\d,]+)(.*)$/);
      if (!m || RM) return;
      const target = parseInt(m[2].replace(/,/g, ''), 10), t0 = performance.now();
      (function tick(now) {
        const t = clamp((now - t0) / 1000, 0, 1), v = Math.round(target * (1 - Math.pow(1 - t, 3)));
        el.textContent = m[1] + v.toLocaleString('en-US') + m[3];
        if (t < 1 && el.isConnected) requestAnimationFrame(tick);
      })(t0);
    });
  }
  function typeIn() {
    if (V.text !== 'type' || RM) return;
    let delay = 0;
    stInner.querySelectorAll('[data-type]').forEach(function (el) {
      const full = el.textContent, per = Math.min(30, 800 / Math.max(1, full.length)), start = performance.now() + delay;
      delay += full.length * per + 140; el.textContent = ''; el.classList.add('typing');
      (function tick(now) {
        if (!el.isConnected) return;
        const k = clamp(Math.floor((now - start) / per), 0, full.length);
        el.textContent = full.slice(0, k);
        if (k < full.length) requestAnimationFrame(tick); else el.classList.remove('typing');
      })(performance.now());
    });
  }
  function startViz() {
    if (vizStop) { vizStop(); vizStop = null; }
    const c = stInner.querySelector('canvas.viz');
    if (c && window.Diagrams && S.at) vizStop = window.Diagrams.start(c, c.getAttribute('data-viz'), LINES[S.at.l].color, C, RM);
  }
  function showView(kind) {
    S.view = kind; wipe = { kind: kind, at: S.at };
    stationEl.hidden = false; stationEl.scrollTop = 0;
    clearTimeout(showTimer);
    showTimer = setTimeout(function () {
      stationEl.classList.add('show'); countUp(); typeIn(); startViz();
      const first = stInner.querySelector('.btn.primary'); if (first) { try { first.focus({ preventScroll: true }); } catch (e) { /* older browsers */ } }
    }, RM ? 0 : 460);
    syncHub();
  }
  function openStation() {
    renderStation(); showView('station'); setHash(LINES[S.at.l].stations[S.at.i].id);
    track('Station', { station: LINES[S.at.l].stations[S.at.i].id, line: LINES[S.at.l].key, service: S.service });
  }
  function openAbout() { renderAbout(); showView('about'); setHash('about'); track('About'); }
  function hideViewNow() {
    clearTimeout(showTimer); if (vizStop) { vizStop(); vizStop = null; }
    stationEl.classList.remove('show'); stationEl.hidden = true; S.view = null;
  }
  function closeView(cb) {
    clearTimeout(showTimer); if (vizStop) { vizStop(); vizStop = null; }
    stationEl.classList.remove('show'); S.view = null;
    if (RM) { stationEl.hidden = true; cb(); return; }
    S.busy = true;
    setTimeout(function () { stationEl.hidden = true; S.busy = false; cb(); }, 380);
  }
  function syncHub() { hubwrap.classList.toggle('out', !!(S.at || S.travel || S.overview || S.view)); }

  // ---------- travel ----------
  function go(target) {
    if (S.travel || S.busy) return;
    const from = S.at;
    if (!from && !target) { if (S.view) closeView(function () { setHash(''); syncHub(); }); return; }
    if (from && target && from.l === target.l && from.i === target.i) return;
    if (S.overview) setOverview(false, true);
    const start = function () { startTravel(from, target); };
    if (S.view) closeView(start); else start();
  }
  function startTravel(from, target) {
    let kind = 'direct', line = null, d0 = 0, d1 = 0;
    if (target && (!from || from.l === target.l)) { kind = 'path'; line = LINES[target.l]; d0 = from ? line.stations[from.i].d : 0; d1 = line.stations[target.i].d; }
    else if (!target && from) { kind = 'path'; line = LINES[from.l]; d0 = line.stations[from.i].d; d1 = line.loop && d0 > line.len / 2 ? line.len : 0; }
    const p0 = posOf(from), p1 = posOf(target);
    const dist = kind === 'path' ? Math.abs(d1 - d0) : Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const L = target ? LINES[target.l] : LINES[from.l];
    S.travel = { t0: performance.now(), dur: RM ? 0 : clamp(650 + dist, 1000, 2300), kind: kind, line: line, d0: d0, d1: d1, p0: p0, p1: p1, from: from, target: target, color: L.color, l: L.li };
    syncHub();
    if (RM) finish();
  }
  function finish() {
    const tr = S.travel; if (!tr) return;
    S.travel = null; S.at = tr.target; revealTo(S.at);
    if (S.at) openStation(); else setHash('');
    syncHub();
  }
  function jump(target) {
    if (S.busy) return;
    S.travel = null; hideViewNow(); S.at = target; revealTo(target);
    setOverview(false, true);
    if (target) openStation(); else setHash('');
    syncHub();
  }
  function setOverview(on, quiet) {
    S.overview = on;
    mapbtn.textContent = on ? 'Back to the ride' : 'See everything';
    sheet.hidden = !on;
    if (on) { if (S.view) closeView(function () {}); sheet.scrollTop = 0; track('See everything'); }
    else if (!quiet && S.at) openStation();
    syncHub();
  }
  function setService(v) {
    S.service = v;
    $('svc-express').setAttribute('aria-pressed', v === 'express' ? 'true' : 'false');
    $('svc-all').setAttribute('aria-pressed', v === 'all' ? 'true' : 'false');
    if (S.view === 'station' && S.at) { const shown = stationEl.classList.contains('show'); renderStation(); if (shown) startViz(); }
    track('Service', { service: v });
  }
  function renderSheet() {
    const M = SITE.meta;
    let h = '<h2>Everything, by line</h2><div class="tt"><button type="button" data-about="1"><b>' + esc(SITE.about.title) + '</b><span>Background, experience and how I work</span></button></div>';
    LINES.forEach(function (L) {
      h += '<div><h3><i style="background:' + L.color + '"></i>' + esc(L.title) + '</h3><p class="blurb">' + esc(L.blurb || '') + '</p><div class="tt">';
      L.stations.forEach(function (st, i) {
        h += '<button type="button" data-jump="' + L.li + ':' + i + '"><b>' + esc(st.name) + (st.express ? '<em>express</em>' : '') + '</b><span>' + esc(st.kicker) + '</span></button>';
      });
      h += '</div></div>';
    });
    h += '<a class="link" href="' + esc(M.linkedin) + '" target="_blank" rel="noopener">Contact me on LinkedIn</a><div class="fine">' + esc(M.privacy || '') + '</div>';
    sheet.innerHTML = h;
  }
  function renderPills() {
    const arrow = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 3.5 11 8l-4.5 4.5"></path></svg>';
    mappills.innerHTML = LINES.map((L) => '<button class="pill" type="button" data-board="' + L.li + '" id="mp-' + L.li + '" aria-label="Board the ' + esc(L.title) + '"><i style="background:' + L.color + '"></i>' + esc(L.short) + arrow + '</button>').join('');
  }

  // ---------- drawing ----------
  function label(text, x, y, align, size, color) {
    if (V.node === 'square') text = text.toUpperCase();
    ctx.font = '500 ' + size + 'px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = C.space;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color || C.ink; ctx.fillText(text, x, y);
  }
  function hub(x, y, r, now) {
    const mono = SITE.meta.monogram || '';
    if (V.hub === 'scope') {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.fillStyle = C.space;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 0.35; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, r * 1.5, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, r * 2.1, 0, TAU); ctx.stroke();
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2); ctx.lineTo(x + Math.cos(a) * r * 2.3, y + Math.sin(a) * r * 2.3); ctx.stroke(); }
      if (!RM) {
        const a = now * 0.0011; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.lineTo(x + Math.cos(a) * r * 2.1, y + Math.sin(a) * r * 2.1); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.fillStyle = C.ink;
      ctx.font = '500 ' + Math.round(r * 0.72) + 'px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(mono, x, y + r * 0.03);
      return;
    }
    const halo = V.hub === 'sun' ? 5.2 + (RM ? 0 : Math.sin(now * 0.0016) * 0.5) : 3.4;
    const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * halo);
    g.addColorStop(0, V.hub === 'sun' ? 'rgba(237,234,224,0.30)' : 'rgba(237,234,224,0.16)'); g.addColorStop(1, 'rgba(237,234,224,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * halo, 0, TAU); ctx.fill();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = C.space; ctx.font = '500 ' + Math.round(r * 0.9) + 'px "Bodoni Moda", Didot, Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(mono, x, y + r * 0.04);
  }
  function node(x, y, r, L, on) {
    if (V.node === 'square') {
      const s = on ? r * 1.05 : r * 0.6;
      ctx.fillStyle = C.space; ctx.strokeStyle = on ? C.ink : C.dim; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(x - s, y - s, s * 2, s * 2); ctx.fill(); ctx.stroke();
      if (on) { ctx.fillStyle = L.color; ctx.fillRect(x - s * 0.35, y - s * 0.35, s * 0.7, s * 0.7); }
    } else if (V.node === 'planet') {
      const pr = on ? r * 1.35 : r * 0.7;
      const g = ctx.createRadialGradient(x - pr * 0.35, y - pr * 0.4, pr * 0.1, x, y, pr);
      g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.35, L.color); g.addColorStop(1, L.core);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, pr, 0, TAU); ctx.fill();
      if (on) { ctx.strokeStyle = rgba(L.color, 0.55); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, y, pr * 2, pr * 0.62, -0.42, 0, TAU); ctx.stroke(); }
    } else {
      ctx.fillStyle = C.space; ctx.strokeStyle = C.ink; ctx.lineWidth = clamp(3 * cam.z, 1.2, 3);
      ctx.beginPath(); ctx.arc(x, y, on ? r : r * 0.6, 0, TAU); ctx.fill(); ctx.stroke();
    }
  }
  function brackets(x0, y0, x1, y1, len, color, lw) {
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'butt'; ctx.beginPath();
    ctx.moveTo(x0, y0 + len); ctx.lineTo(x0, y0); ctx.lineTo(x0 + len, y0);
    ctx.moveTo(x1 - len, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + len);
    ctx.moveTo(x1, y1 - len); ctx.lineTo(x1, y1); ctx.lineTo(x1 - len, y1);
    ctx.moveTo(x0 + len, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - len);
    ctx.stroke();
  }

  function draw(now, tRaw, e) {
    const wide = W >= 760, zb = clamp(Math.min(W, H) / 620, 0.55, 1.25);
    const k = RM ? 1 : 0.14, tr = S.travel;
    if (tr) {
      const p = tr.kind === 'path' ? along(tr.line.pts, lerp(tr.d0, tr.d1, e)) : { x: lerp(tr.p0.x, tr.p1.x, e), y: lerp(tr.p0.y, tr.p1.y, e) };
      const z0 = tr.from ? zb * 1.15 : zb, z1 = tr.target ? zb * 1.15 : zb;
      cam.x = p.x; cam.y = p.y;
      cam.z = lerp(z0, z1, e) * (1 - (tr.kind === 'path' ? V.dip : Math.max(0.5, V.dip)) * Math.sin(Math.PI * tRaw));
      cam.fx = W / 2; cam.fy = H * 0.3;
      if (tr.kind === 'path') revT[tr.line.li] = Math.max(revT[tr.line.li], Math.min(tr.line.len, lerp(tr.d0, tr.d1, e) + 70));
    } else {
      const sheetW = wide ? 430 : 0;
      const want = S.overview
        ? { x: BOUNDS.cx, y: BOUNDS.cy, z: Math.min((W - sheetW) / (BOUNDS.w + 700), (wide ? H - (OPTS.review ? 190 : 110) : H * (OPTS.review ? 0.22 : 0.34)) / (BOUNDS.h + 500)), fx: wide ? (W - sheetW + 20) / 2 : W / 2, fy: wide ? H / 2 + (OPTS.review ? 60 : 24) : H * (OPTS.review ? 0.3 : 0.24) }
        : { x: posOf(S.at).x, y: posOf(S.at).y, z: S.at ? zb * 1.15 : zb, fx: W / 2, fy: H * 0.3 };
      cam.x += (want.x - cam.x) * k; cam.y += (want.y - cam.y) * k; cam.z += (want.z - cam.z) * k;
      cam.fx += (want.fx - cam.fx) * k; cam.fy += (want.fy - cam.fy) * k;
    }
    const vx = cam.x - prevCam.x, vy = cam.y - prevCam.y; prevCam.x = cam.x; prevCam.y = cam.y;
    const map = (x, y) => [(x - cam.x) * cam.z + cam.fx, (y - cam.y) * cam.z + cam.fy];
    const speed = tr ? Math.sin(Math.PI * tRaw) : 0;

    // background layers
    if (V.nebula) {
      const u = Math.min(W, H) / 700;
      NEB.forEach(function (b) {
        const x = W / 2 + (b.x - cam.x * 0.3) * 0.5 * u, y = H / 2 + (b.y - cam.y * 0.3) * 0.5 * u, r = b.r * 0.55 * u;
        if (x + r < 0 || x - r > W || y + r < 0 || y - r > H) return;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(b.c, b.a)); g.addColorStop(1, rgba(b.c, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      });
    }
    if (V.grid) {
      let step = 225; while (step * cam.z < 26) step *= 2;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
      const gx0 = Math.floor((cam.x - cam.fx / cam.z) / step) * step, gy0 = Math.floor((cam.y - cam.fy / cam.z) / step) * step;
      for (let gx = gx0; (gx - cam.x) * cam.z + cam.fx < W; gx += step) {
        const sx = Math.round((gx - cam.x) * cam.z + cam.fx) + 0.5;
        ctx.globalAlpha = mod(Math.round(gx / step), 4) === 0 ? 0.10 : 0.045;
        ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
      }
      for (let gy = gy0; (gy - cam.y) * cam.z + cam.fy < H; gy += step) {
        const sy = Math.round((gy - cam.y) * cam.z + cam.fy) + 0.5;
        ctx.globalAlpha = mod(Math.round(gy / step), 4) === 0 ? 0.10 : 0.045;
        ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    const TW = Math.max(W + 240, 1400), TH = Math.max(H + 240, 1000), streak = 4 + V.warp * 6;
    ctx.lineCap = 'round';
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const sx = mod(s.x - cam.x * s.p, TW) - (TW - W) / 2, sy = mod(s.y - cam.y * s.p, TH) - (TH - H) / 2;
      const tx = vx * s.p * streak, ty = vy * s.p * streak;
      ctx.globalAlpha = V.twinkle && !RM ? s.a * (0.55 + 0.45 * Math.sin(now * 0.001 * s.tw + s.ph)) : s.a;
      if (Math.abs(tx) + Math.abs(ty) > 1.2) {
        ctx.strokeStyle = (tr && i % 5 === 0) ? tr.color : C.ink; ctx.lineWidth = s.r * 1.3;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + tx, sy + ty); ctx.stroke();
      } else { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(sx, sy, s.r, 0, TAU); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    if (V.warp && tr && speed > 0.05) {
      const R = Math.hypot(W, H) * 0.6;
      ctx.lineWidth = 1.2;
      SPEED.forEach(function (sp, i) {
        const rr = mod(now * 0.9 + sp.o * R, R), a = sp.a;
        ctx.globalAlpha = speed * 0.5 * (rr / R);
        ctx.strokeStyle = i % 4 === 0 ? tr.color : C.ink;
        ctx.beginPath(); ctx.moveTo(cam.fx + Math.cos(a) * rr, cam.fy + Math.sin(a) * rr);
        ctx.lineTo(cam.fx + Math.cos(a) * (rr + sp.l * speed), cam.fy + Math.sin(a) * (rr + sp.l * speed)); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    // lines, stations, labels
    const active = tr ? tr.l : (S.at ? S.at.l : -1);
    const lw = clamp(V.lw * cam.z, V.lw * 0.35, V.lw + 1), nr = clamp(8 * cam.z, 3, 9);
    const showLabels = cam.z * SPACING > 115;
    LINES.forEach(function (L, li) {
      const dimmed = active >= 0 && active !== li && !S.overview;
      rev[li] += (revT[li] - rev[li]) * (RM ? 1 : 0.1);
      const dr = S.overview ? L.len : rev[li];
      ctx.globalAlpha = dimmed ? 0.3 : 1;
      ctx.strokeStyle = L.color; ctx.lineWidth = lw; ctx.lineJoin = V.node === 'square' ? 'miter' : 'round'; ctx.lineCap = V.node === 'square' ? 'butt' : 'round';
      if (V.glow && !dimmed) { ctx.shadowColor = L.color; ctx.shadowBlur = V.glow; }
      trace(L.pts, dr, map);
      ctx.shadowBlur = 0;
      if (!S.overview && dr < L.len - 1) {
        const a0 = along(L.pts, dr), a1 = along(L.pts, Math.min(L.len, dr + 420)), g0 = map(a0.x, a0.y), g1 = map(a1.x, a1.y);
        const gg = ctx.createLinearGradient(g0[0], g0[1], g1[0], g1[1]);
        gg.addColorStop(0, rgba(L.color, 0.5)); gg.addColorStop(1, rgba(L.color, 0));
        ctx.save(); ctx.strokeStyle = gg; ctx.lineWidth = Math.max(1.5, lw * 0.35); ctx.setLineDash([2, 9]); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(g0[0], g0[1]);
        for (let q = dr + 30; q <= Math.min(L.len, dr + 420); q += 30) { const gp = along(L.pts, q), gs = map(gp.x, gp.y); ctx.lineTo(gs[0], gs[1]); }
        ctx.stroke(); ctx.restore();
      }
      if (!RM && dr > 200) {
        ctx.fillStyle = C.ink; ctx.globalAlpha = dimmed ? 0.25 : 0.85;
        const fr = clamp(2.2 * cam.z, 1, 2.6);
        for (let q = mod(now * 0.12, 110); q < dr; q += 110) {
          const f = along(L.pts, q), fp = map(f.x, f.y);
          if (fp[0] < -20 || fp[0] > W + 20 || fp[1] < -20 || fp[1] > H + 20) continue;
          if (V.node === 'square') ctx.fillRect(fp[0] - fr, fp[1] - fr, fr * 2, fr * 2);
          else { ctx.beginPath(); ctx.arc(fp[0], fp[1], fr, 0, TAU); ctx.fill(); }
        }
      }
      ctx.globalAlpha = dimmed ? 0.3 : 1;
      L.stations.forEach(function (st, i) {
        if (st.d > dr - 1) return;
        const a = along(L.pts, st.d), sp = map(a.x, a.y), on = served(li, i);
        if (sp[0] < -80 || sp[0] > W + 80 || sp[1] < -40 || sp[1] > H + 40) return;
        node(sp[0], sp[1], nr, L, on);
        if (showLabels && on) {
          const size = V.node === 'square' ? 11.5 : 13;
          if (Math.abs(a.uy) > 0.7) label(st.name, sp[0] + nr * 1.5 + 10, sp[1], 'left', size);
          else label(st.name, sp[0], sp[1] + nr * 1.5 + 14, 'center', size);
        }
      });
      if (S.overview) {
        const end = along(L.pts, L.loop ? L.len / 2 : L.len), ep = map(end.x, end.y);
        label(L.title, clamp(ep[0], 56, W - 56), ep[1] + 18, 'center', 12, L.color);
      }
    });
    ctx.globalAlpha = 1;
    const hp = map(0, 0);
    if (!born) born = now;
    const intro = RM ? 1 : clamp((now - born) / 800, 0, 1), pop = 1 + 2.7 * Math.pow(intro - 1, 3) + 1.7 * Math.pow(intro - 1, 2);
    hub(hp[0], hp[1], (S.overview ? clamp(34 * cam.z, 8, 44) : clamp(34 * cam.z, 26, 44)) * Math.max(0.01, pop), now);

    // the traveller
    if (tr) {
      if (V.node === 'square') { brackets(cam.fx - 11, cam.fy - 11, cam.fx + 11, cam.fy + 11, 6, C.ink, 1.5); ctx.fillStyle = tr.color; ctx.fillRect(cam.fx - 3, cam.fy - 3, 6, 6); }
      else {
        if (V.glow) { ctx.shadowColor = C.ink; ctx.shadowBlur = 18; }
        ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.globalAlpha = 0.7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cam.fx, cam.fy); ctx.lineTo(cam.fx - vx * cam.z * 5, cam.fy - vy * cam.z * 5); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = C.ink;
        ctx.beginPath(); ctx.arc(cam.fx, cam.fy, 5.5, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // arrival: the station opens up and fills the view
    enter += ((S.view ? 1 : 0) - enter) * (RM ? 1 : 0.13);
    if (enter > 0.004 && wipe) {
      const isAbout = wipe.kind === 'about', L2 = isAbout ? null : LINES[wipe.at.l];
      const color = isAbout ? C.ink : L2.color, tint = isAbout ? C.neutral : L2.tint;
      const cp = isAbout ? { x: 0, y: 0 } : posOf(wipe.at), c = map(cp.x, cp.y), ee = ease(clamp(enter, 0, 1));
      const da = clamp((enter - 0.5) * 2, 0, 1);
      if (V.wipe === 'frame') {
        const hw = lerp(nr, Math.max(c[0], W - c[0]) + 6, ee), hh = lerp(nr, Math.max(c[1], H - c[1]) + 6, ee);
        ctx.fillStyle = tint; ctx.fillRect(c[0] - hw, c[1] - hh, hw * 2, hh * 2);
        ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.strokeRect(c[0] - hw, c[1] - hh, hw * 2, hh * 2);
        if (da > 0) { ctx.globalAlpha = da; brackets(12, 12, W - 12, H - 12, 22, color, 2); ctx.globalAlpha = 1; }
      } else {
        const R = nr + (Math.hypot(W, H) - nr) * ee;
        if (V.wipe === 'planet') {
          const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], Math.max(R, 1));
          g.addColorStop(0, isAbout ? mix(C.ink, C.space, 0.72) : mix(color, C.space, 0.5)); g.addColorStop(0.45, tint); g.addColorStop(1, tint);
          ctx.fillStyle = g;
        } else ctx.fillStyle = tint;
        ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, TAU); ctx.fill();
        if (V.wipe === 'planet') { ctx.shadowColor = color; ctx.shadowBlur = 40; }
        ctx.strokeStyle = color; ctx.lineWidth = lerp(3, 12, ee); ctx.stroke(); ctx.shadowBlur = 0;
        if (da > 0) {
          const unit = Math.min(W, H) * 0.24;
          ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.fillStyle = color;
          if (V.wipe === 'planet') {
            for (let oi = 0; oi < 3; oi++) {
              const rx = unit * (1.5 + oi * 0.9), ry = rx * 0.34, rot = -0.35 + oi * 0.12;
              ctx.globalAlpha = 0.16 * da; ctx.beginPath(); ctx.ellipse(c[0], c[1], rx, ry, rot, 0, TAU); ctx.stroke();
              const ang = (RM ? 0 : now * 0.00016 * (3 - oi)) + oi * 2.1;
              const ox = Math.cos(ang) * rx, oy = Math.sin(ang) * ry;
              ctx.globalAlpha = 0.85 * da; ctx.beginPath();
              ctx.arc(c[0] + ox * Math.cos(rot) - oy * Math.sin(rot), c[1] + ox * Math.sin(rot) + oy * Math.cos(rot), 3.4, 0, TAU); ctx.fill();
            }
          } else {
            for (let ri = 1; ri <= 5; ri++) { ctx.globalAlpha = 0.13 * da; ctx.beginPath(); ctx.arc(c[0], c[1], unit * ri, 0, TAU); ctx.stroke(); }
            for (let oi = 0; oi < 3; oi++) {
              const ang = (RM ? 0 : now * 0.00011 * (oi + 1)) + oi * 2.1, rr = unit * (oi + 2);
              ctx.globalAlpha = 0.75 * da; ctx.beginPath(); ctx.arc(c[0] + Math.cos(ang) * rr, c[1] + Math.sin(ang) * rr, 3.2, 0, TAU); ctx.fill();
            }
          }
          ctx.globalAlpha = 1;
        }
      }
    }

    // console readouts
    if (V.hud) {
      brackets(8, 8, W - 8, H - 8, 16, C.dim, 1);
      if (enter < 0.5 && (wide || !OPTS.review)) {
        let left;
        if (S.overview) left = 'MAP · ALL ' + TOTAL + ' STATIONS';
        else if (tr) left = 'EN ROUTE > ' + (tr.target ? LINES[tr.target.l].stations[tr.target.i].name : 'HUB').toUpperCase();
        else if (S.at) left = LINES[S.at.l].title.toUpperCase() + ' · STOP ' + (S.at.i + 1) + '/' + LINES[S.at.l].stations.length;
        else left = 'HUB · ' + LINES.length + ' LINES · ' + TOTAL + ' STATIONS';
        const y = wide ? H - 24 : 76, right = 'X ' + Math.round(cam.x) + '  Y ' + Math.round(cam.y) + '  Z ' + cam.z.toFixed(2);
        ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.dim;
        ctx.textAlign = 'left'; ctx.fillText(left, 24, y);
        if (wide) { ctx.textAlign = 'right'; ctx.fillText(right, W - 24, y); }
        if (tr) { ctx.strokeStyle = C.rule; ctx.lineWidth = 1; ctx.strokeRect(24.5, y + 10.5, 140, 5); ctx.fillStyle = tr.color; ctx.fillRect(25, y + 11, 139 * tRaw, 4); }
      }
    }

    const atHub = !S.at && !tr && !S.overview && !S.view && intro >= 1;
    mappills.classList.toggle('gone', !atHub);
    if (atHub) LINES.forEach(function (L, li) {
      const a = along(L.pts, Math.max(150, 118 / cam.z)), sp = map(a.x, a.y), el = $('mp-' + li);
      if (el) { const half = (el.offsetWidth || 90) / 2 + 8; sp[0] = clamp(sp[0], half, W - half); }
      if (el) el.style.transform = 'translate(-50%,-50%) translate(' + sp[0].toFixed(1) + 'px,' + sp[1].toFixed(1) + 'px)';
    });
  }

  function frame(now) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.fillStyle = C.space; ctx.fillRect(0, 0, W, H);
    let tRaw = 0, e = 0;
    if (S.travel) { tRaw = clamp((now - S.travel.t0) / Math.max(1, S.travel.dur), 0, 1); e = ease(tRaw); }
    draw(now, tRaw, e);
    if (S.travel && tRaw >= 1) finish();
    requestAnimationFrame(frame);
  }

  // ---------- events ----------
  function parse(v) { if (v === 'hub') return null; const p = v.split(':'); return { l: +p[0], i: +p[1] }; }
  function route(h) {
    if (h === lastHash) return;
    if (h === 'about') { jump(null); openAbout(); }
    else if (BYID[h]) jump(BYID[h]);
    else if (!h) jump(null);
  }
  stage.addEventListener('click', function (ev) {
    const b = ev.target.closest('button');
    if (b && stage.contains(b)) {
      if (b.dataset.board) { track('Board', { line: LINES[+b.dataset.board].key }); go({ l: +b.dataset.board, i: 0 }); }
      else if (b.dataset.go) { if (b.dataset.transfer) track('Transfer'); go(parse(b.dataset.go)); }
      else if (b.dataset.keep) { setService('all'); go(parse(b.dataset.keep)); }
      else if (b.dataset.jump) jump(parse(b.dataset.jump));
      else if (b.dataset.about) { if (S.busy || S.travel) return; if (S.at || S.overview) jump(null); openAbout(); }
      else if (b.dataset.svc) setService(b.dataset.svc);
      else if (b === mapbtn) { if (!S.travel && !S.busy) setOverview(!S.overview); }
      return;
    }
    if (S.travel || S.busy || S.view || ev.target !== cv) return;
    const r = cv.getBoundingClientRect(), mx = ev.clientX - r.left, my = ev.clientY - r.top;
    const wx = (mx - cam.fx) / cam.z + cam.x, wy = (my - cam.fy) / cam.z + cam.y, reach = 30 / cam.z;
    if (Math.hypot(wx, wy) < Math.max(reach, 40)) { if (S.overview) jump(null); else if (S.at) go(null); else openAbout(); return; }
    let hit = null, hd = reach;
    LINES.forEach(function (L, li) {
      L.stations.forEach(function (st, i) {
        if (!S.overview && st.d > rev[li]) return;
        const a = along(L.pts, st.d), d = Math.hypot(a.x - wx, a.y - wy);
        if (d < hd) { hd = d; hit = { l: li, i: i }; }
      });
    });
    if (hit) { if (S.overview) jump(hit); else go(hit); }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.defaultPrevented || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    const t = ev.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (ev.key === 'Escape') { if (S.overview) setOverview(false); else if (S.view === 'about') go(null); return; }
    if (S.view !== 'station' || !S.at) return;
    if (ev.key === 'ArrowRight') { const nx = nextServed(S.at); if (nx >= 0) go({ l: S.at.l, i: nx }); }
    else if (ev.key === 'ArrowLeft') { const pv = prevServed(S.at); go(pv >= 0 ? { l: S.at.l, i: pv } : null); }
  });
  window.addEventListener('hashchange', function () { route((location.hash || '').slice(1)); });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);

  // ---------- start ----------
  try { const v = new URLSearchParams(location.search).get('v'); if (v && /^[A-Za-z0-9_-]{1,16}$/.test(v)) S.code = v; } catch (e) { /* no code */ }
  setVariant(OPTS.variant || 'line');
  resize(); renderPills(); renderSheet(); syncHub();
  requestAnimationFrame(frame);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { /* canvas text picks up the fonts on the next frame */ });
  const h0 = (location.hash || '').slice(1);
  if (h0 && (h0 === 'about' || BYID[h0])) route(h0);
  track('Visit');

  window.SiteMap = {
    setVariant: setVariant,
    variant: function () { return S.variant; },
    variants: Object.keys(VARIANTS).map(function (k) { return { key: k, label: VARIANTS[k].label }; }),
    setRoute: setRoute,
    route: function () { return S.route; },
    routes: ROUTES
  };
})();
