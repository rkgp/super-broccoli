/* Small animated diagrams for every station. Drawn from scratch: no real screens, no real data.
   A station asks for one with "viz": "<name>" in the content file. */
window.Diagrams = (function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (u) => 1 - Math.pow(1 - u, 3);
  const hash = (n) => { let x = Math.imul(n ^ 0x9E3779B9, 0x85EBCA6B); x ^= x >>> 13; x = Math.imul(x, 0xC2B2AE35); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };

  const DESC = {
    check: 'Animated diagram: contract pages flow through a check against the ERP payment terms. Pages that do not match drop out and collect below.',
    search: 'Animated diagram: a search phrase is typed and matching contracts light up across the archive.',
    tiles: 'Animated diagram: twenty-five dashboard tiles assemble into one hub.',
    flows: 'Animated diagram: automations run in the background and completed runs add up.',
    kpi: 'Animated diagram: KPI bars fill from the BI model and an AI-written analysis appears beside them.',
    actions: 'Animated diagram: a list of contracts where open actions are ticked off one by one.',
    prices: 'Animated diagram: every week prices are collected from several shops and the market price line grows.',
    tracker: 'Animated diagram: procurement projects move from new to running to done, savings add up and a one-click survey smiley appears.',
    agents: 'Animated diagram: a question goes to an orchestrator, which routes it to one specialist agent and returns the answer.',
    deck: 'Animated diagram: an idea becomes an outline, the outline is signed off, and slides assemble into a deck.',
    radar: 'Animated diagram: a radar sweep moves across its field of view while people show up as moving blips.',
    voice: 'Animated diagram: a voice recording is transcribed on a Raspberry Pi and appears as a note in Obsidian.',
    orbit: 'Animated diagram: the International Space Station moves along its ground track across a map grid.',
    chess: 'Animated diagram: a piece moves on a chessboard, the evaluation bar swings and a spoken commentary bubble appears.',
    buddy: 'Animated diagram: a small desk screen shows the current task and flips to the next one when a message arrives.',
    site: 'Animated diagram: two lines draw out from the JV hub in spirals, with a station appearing for each project in the content file.'
  };
  const STILL = { check: 7.2, search: 2.6, tiles: 5, flows: 8, kpi: 6.5, actions: 5.2, prices: 9, tracker: 9, agents: 2.2, deck: 7.5, radar: 3, voice: 7.6, orbit: 7, chess: 4.5, buddy: 2.5, site: 7 };

  function txt(ctx, s, x, y, align, color, size) {
    ctx.font = '500 ' + (size || 10.5) + 'px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  const loopFade = (tt, T) => (tt > T - 0.8 ? (T - tt) / 0.8 : tt < 0.4 ? tt / 0.4 : 1);
  function sq(ctx, x, y, s, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - s / 2, y - s / 2, s, s, r); else ctx.rect(x - s / 2, y - s / 2, s, s); }

  const SCENES = {
    check: function (ctx, w, h, t, color, P) {
      const T = 13, tt = t % T, fade = tt > T - 0.8 ? (T - tt) / 0.8 : 1;
      const y = h * 0.4, x0 = w * 0.06, x1 = w * 0.94, gx = w * 0.5, v = (x1 - x0) / 5.2, n = 62;
      ctx.globalAlpha = fade;
      ctx.strokeStyle = P.dim; ctx.lineWidth = 1; ctx.globalAlpha = 0.35 * fade;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.globalAlpha = fade; ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx, y - h * 0.15); ctx.lineTo(gx, y + h * 0.15); ctx.stroke();
      ctx.fillStyle = P.space; ctx.save(); ctx.translate(gx, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-5, -5, 10, 10); ctx.strokeRect(-5, -5, 10, 10); ctx.restore();
      const narrow = w < 440;
      txt(ctx, narrow ? 'PAGES' : 'CONTRACT PAGES', x0, y - h * 0.2, 'left', P.dim);
      txt(ctx, narrow ? 'ERP CHECK' : 'CHECK AGAINST ERP TERMS', gx, y - h * 0.25, 'center', P.ink);
      txt(ctx, narrow ? 'MATCH' : 'TERMS MATCH', x1, y - h * 0.2, 'right', P.dim);
      txt(ctx, narrow ? 'PAID EARLY' : 'PAID EARLIER THAN AGREED', gx + 14, h * 0.7, 'left', color);
      for (let i = 0; i < n; i++) {
        const s = 0.2 + i * 0.11; if (tt < s) continue;
        const flagged = i % 7 === 3, yo = (hash(i) * 2 - 1) * h * 0.07;
        let x = x0 + v * (tt - s), yy = y + yo, a = 0.85, col = P.ink, size = 5;
        if (x >= gx) {
          if (flagged) {
            const fi = Math.floor(i / 7), u = easeOut(clamp((tt - (s + (gx - x0) / v)) / 0.7, 0, 1));
            x = lerp(gx, gx + 20 + (fi % 7) * 13, u); yy = lerp(y + yo, h * 0.8 + Math.floor(fi / 7) * 13, u); col = color; size = 7; a = 1;
          } else { a = 0.6 * clamp((x1 - x) / (x1 - gx), 0, 1); col = P.dim; if (x > x1) continue; }
        } else a = 0.85 * clamp((x - x0) / 24, 0, 1);
        ctx.globalAlpha = a * fade; ctx.fillStyle = col; sq(ctx, x, yy, size, 1.5); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    search: function (ctx, w, h, t, color, P) {
      const Q = ['payment term', 'code of conduct', 'AI annex', 'merger clause'], cyc = 4.2, q = Math.floor(t / cyc) % Q.length, u = t % cyc;
      const x0 = w * 0.06, fw = Math.min(w * 0.6, 300), fy = h * 0.08, fh = 30;
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x0, fy, fw, fh, 4); else ctx.rect(x0, fy, fw, fh); ctx.stroke();
      const typed = Q[q].slice(0, Math.floor(clamp(u / 0.9, 0, 1) * Q[q].length));
      txt(ctx, typed + (u < 1 && Math.floor(u * 6) % 2 === 0 ? '_' : ''), x0 + 12, fy + fh / 2 + 0.5, 'left', P.ink, 12.5);
      if (w > 440) txt(ctx, 'BY KEYWORD OR BY MEANING', w * 0.94, fy + fh / 2, 'right', P.dim);
      const cols = w > 440 ? 16 : 11, rows = 6, gx0 = x0, gx1 = w * 0.94, gy0 = h * 0.3, gy1 = h * 0.93, gap = 5;
      const tw = (gx1 - gx0 - gap * (cols - 1)) / cols, th = (gy1 - gy0 - gap * (rows - 1)) / rows;
      const sweep = clamp((u - 1.0) / 1.2, 0, 1), sx = lerp(gx0, gx1, sweep), out = clamp((cyc - u) / 0.5, 0, 1);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = gx0 + c * (tw + gap), yy = gy0 + r * (th + gap), i = r * cols + c;
        const hit = hash(i * 31 + q * 977) < 0.17, lit = hit && u > 1.0 && x + tw / 2 < sx + 1;
        ctx.globalAlpha = 1; ctx.lineWidth = 1; ctx.strokeStyle = lit ? color : P.rule;
        if (lit) { ctx.globalAlpha = out; ctx.fillStyle = color; ctx.fillRect(x, yy, tw, th); ctx.globalAlpha = 1; }
        ctx.strokeRect(x + 0.5, yy + 0.5, tw - 1, th - 1);
        ctx.strokeStyle = lit && out > 0.5 ? P.space : P.dim; ctx.globalAlpha = lit ? 0.9 : 0.45;
        ctx.beginPath(); ctx.moveTo(x + 5, yy + th * 0.36); ctx.lineTo(x + tw - 5, yy + th * 0.36); ctx.moveTo(x + 5, yy + th * 0.62); ctx.lineTo(x + tw * 0.62, yy + th * 0.62); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (u > 1.0 && u < 2.2) { ctx.strokeStyle = P.ink; ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx, gy0 - 6); ctx.lineTo(sx, gy1 + 6); ctx.stroke(); ctx.globalAlpha = 1; }
    },

    tiles: function (ctx, w, h, t, color, P) {
      const T = 12, tt = t % T, fade = tt > T - 0.8 ? (T - tt) / 0.8 : 1;
      const cols = 5, rows = 5, x0 = w * 0.06, x1 = w * 0.94, y0 = h * 0.2, y1 = h * 0.93, gap = 7;
      const tw = (x1 - x0 - gap * (cols - 1)) / cols, th = (y1 - y0 - gap * (rows - 1)) / rows;
      const focus = tt > 3.4 ? Math.floor(hash(Math.floor((tt - 3.4) / 0.85) + 5) * 25) : -1;
      txt(ctx, '25 DASHBOARDS · ONE HUB', x0, h * 0.1, 'left', P.dim);
      for (let i = 0; i < 25; i++) {
        const u = easeOut(clamp((tt - 0.2 - i * 0.12) / 0.45, 0, 1)); if (u <= 0) continue;
        const cx = x0 + (i % cols) * (tw + gap) + tw / 2, cy = y0 + Math.floor(i / cols) * (th + gap) + th / 2;
        const ww = tw * u, hh = th * u, on = i === focus, col = on ? color : P.dim;
        ctx.globalAlpha = fade * u; ctx.lineWidth = on ? 1.5 : 1; ctx.strokeStyle = on ? color : P.rule;
        ctx.strokeRect(cx - ww / 2 + 0.5, cy - hh / 2 + 0.5, ww - 1, hh - 1);
        if (u < 0.95) continue;
        const ix = cx - tw / 2 + 7, iw = tw - 14, iy = cy + th / 2 - 6, ih = th - 14, kind = i % 3;
        const grow = on ? easeOut(clamp(((tt - 3.4) % 0.85) / 0.5, 0, 1)) : 1;
        ctx.globalAlpha = fade * (on ? 1 : 0.7);
        if (kind === 0) { ctx.fillStyle = col; for (let b = 0; b < 5; b++) { const bh = ih * (0.25 + hash(i * 7 + b) * 0.75) * grow; ctx.fillRect(ix + b * (iw / 5), iy - bh, iw / 5 - 2, bh); } }
        else if (kind === 1) { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); for (let b = 0; b < 6; b++) { const px = ix + b * (iw / 5), py = iy - ih * (0.15 + hash(i * 11 + b) * 0.8) * grow; if (b) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.stroke(); }
        else { ctx.fillStyle = col; ctx.fillRect(ix, iy - ih * 0.85, iw * 0.45, 3); ctx.fillRect(ix, iy - ih * 0.5, iw * (0.3 + hash(i) * 0.6) * grow, 5); ctx.fillRect(ix, iy - ih * 0.18, iw * (0.3 + hash(i + 3) * 0.6) * grow, 5); }
      }
      ctx.globalAlpha = 1;
    },

    flows: function (ctx, w, h, t, color, P) {
      const T = 14, tt = t % T, fade = tt > T - 0.8 ? (T - tt) / 0.8 : 1, lanes = 6;
      const x0 = w * 0.07, x1 = w * 0.66, tx = w * 0.78;
      txt(ctx, w < 440 ? 'FLOWS' : 'FLOWS RUNNING IN THE BACKGROUND', x0, h * 0.1, 'left', P.dim);
      txt(ctx, 'RUNS', tx, h * 0.1, 'left', color);
      let total = 0;
      for (let j = 0; j < lanes; j++) {
        const y = h * 0.25 + j * (h * 0.62 / (lanes - 1)), spd = 0.22 + hash(j + 1) * 0.3, ph = hash(j + 9);
        const raw = tt * spd + ph, p = raw % 1.25; total += Math.floor(raw / 1.25);
        ctx.globalAlpha = 0.4 * fade; ctx.strokeStyle = P.dim; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
        for (let k = 0; k < 4; k++) {
          const nx = lerp(x0, x1, k / 3), passed = p >= k / 3;
          ctx.globalAlpha = fade; ctx.fillStyle = passed ? P.ink : P.space; ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(nx, y, 4.5, 0, TAU); ctx.fill(); ctx.stroke();
        }
        if (p <= 1) { ctx.globalAlpha = fade; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(lerp(x0, x1, p), y, 5, 0, TAU); ctx.fill(); }
        else {
          ctx.globalAlpha = fade * clamp((1.25 - p) / 0.12, 0, 1); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x1 + 12, y); ctx.lineTo(x1 + 16, y + 4); ctx.lineTo(x1 + 23, y - 5); ctx.stroke();
        }
      }
      const per = w > 440 ? 6 : 4, cell = 11;
      for (let i = 0; i < Math.min(total, per * 9); i++) {
        ctx.globalAlpha = fade; ctx.fillStyle = color; sq(ctx, tx + 4 + (i % per) * cell, h * 0.25 + Math.floor(i / per) * cell, 7, 1.5); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    /* ---------- work ---------- */

    kpi: function (ctx, w, h, t, color, P) {
      const T = 12, tt = t % T, fade = loopFade(tt, T), narrow = w < 440;
      const x0 = w * 0.06, split = w * 0.46, x1 = w * 0.94;
      ctx.globalAlpha = fade;
      txt(ctx, narrow ? 'BI MODEL' : 'NUMBERS FROM THE BI MODEL', x0, h * 0.1, 'left', P.dim);
      txt(ctx, narrow ? 'AI' : 'AI WRITES THE ANALYSIS', split + 34, h * 0.1, 'left', color);
      const rows = 4, ry0 = h * 0.24, rg = (h * 0.68) / rows;
      for (let i = 0; i < rows; i++) {
        const y = ry0 + i * rg, u = easeOut(clamp((tt - 0.2 - i * 0.25) / 0.7, 0, 1)), bw = (split - x0 - 18);
        const val = 0.35 + hash(i * 13 + 2) * 0.55, tgt = 0.7;
        ctx.globalAlpha = fade * 0.5; ctx.fillStyle = P.dim; ctx.fillRect(x0, y, bw * 0.35, 3);
        ctx.globalAlpha = fade * 0.3; ctx.fillRect(x0, y + 12, bw, 9);
        ctx.globalAlpha = fade; ctx.fillStyle = val >= tgt ? P.ink : color; ctx.fillRect(x0, y + 12, bw * val * u, 9);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0 + bw * tgt, y + 8); ctx.lineTo(x0 + bw * tgt, y + 25); ctx.stroke();
      }
      // arrow: numbers go in one direction only
      const ay = h * 0.55, a = clamp((tt - 1.6) / 0.5, 0, 1);
      ctx.globalAlpha = fade * a; ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(split - 4, ay); ctx.lineTo(split + 22, ay); ctx.lineTo(split + 16, ay - 5); ctx.moveTo(split + 22, ay); ctx.lineTo(split + 16, ay + 5); ctx.stroke();
      // analysis card
      const cx = split + 34, cy = h * 0.2, cw = x1 - cx, ch = h * 0.72;
      ctx.globalAlpha = fade; ctx.strokeStyle = P.rule; ctx.lineWidth = 1; rr(ctx, cx, cy, cw, ch, 6); ctx.stroke();
      const lines = [0.8, 0.95, 0.9, 0.6, 0.85, 0.7], ty = cy + 22;
      for (let i = 0; i < lines.length; i++) {
        const u = clamp((tt - 2.2 - i * 0.55) / 0.5, 0, 1); if (u <= 0) continue;
        const head = i === 0;
        ctx.globalAlpha = fade * (head ? 1 : 0.65); ctx.fillStyle = head ? color : P.ink;
        ctx.fillRect(cx + 14, ty + i * (ch - 40) / lines.length + (head ? 0 : 6), (cw - 28) * lines[i] * u, head ? 7 : 4);
      }
      ctx.globalAlpha = 1;
    },

    actions: function (ctx, w, h, t, color, P) {
      const T = 12, tt = t % T, fade = loopFade(tt, T), narrow = w < 440;
      const x0 = w * 0.06, x1 = w * 0.94, rows = 6, y0 = h * 0.22, rg = h * 0.7 / rows;
      ctx.globalAlpha = fade;
      txt(ctx, 'CONTRACT', x0 + 26, h * 0.1, 'left', P.dim);
      if (!narrow) txt(ctx, 'OWNER', w * 0.58, h * 0.1, 'left', P.dim);
      txt(ctx, 'ACTION', x1, h * 0.1, 'right', color);
      for (let i = 0; i < rows; i++) {
        const y = y0 + i * rg + rg / 2, done = tt > 1.2 + i * 1.3, u = easeOut(clamp((tt - 1.2 - i * 1.3) / 0.35, 0, 1));
        ctx.globalAlpha = fade * (done ? 0.45 : 1);
        ctx.fillStyle = P.ink; ctx.fillRect(x0 + 26, y - 2, (w * 0.42) * (0.45 + hash(i * 5) * 0.5) * (narrow ? 0.9 : 0.8), 4);
        ctx.strokeStyle = P.dim; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x0 + 8, y, 5, 0, TAU); ctx.stroke();
        if (!narrow) { ctx.fillStyle = P.dim; ctx.beginPath(); ctx.arc(w * 0.59, y, 4, 0, TAU); ctx.fill(); ctx.fillRect(w * 0.59 + 9, y - 1.5, 40, 3); }
        const bx = x1 - 16;
        ctx.globalAlpha = fade; ctx.strokeStyle = done ? color : P.ink; ctx.lineWidth = 1.5; rr(ctx, bx, y - 8, 16, 16, 3); ctx.stroke();
        if (u > 0) { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx + 4, y); ctx.lineTo(bx + 4 + 3 * u, y + 3 * u); if (u > 0.5) ctx.lineTo(bx + 7 + 5 * (u - 0.5) * 2, y + 3 - 7 * (u - 0.5) * 2); ctx.stroke(); }
        if (i < rows - 1) { ctx.globalAlpha = fade * 0.3; ctx.strokeStyle = P.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y + rg / 2); ctx.lineTo(x1, y + rg / 2); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
    },

    prices: function (ctx, w, h, t, color, P) {
      const T = 14, tt = t % T, fade = loopFade(tt, T), narrow = w < 440;
      const shops = 4, sx = w * 0.06, sw = narrow ? 34 : 54, gx0 = w * 0.32, gx1 = w * 0.94, gy0 = h * 0.2, gy1 = h * 0.86, weeks = 10;
      const wk = Math.min(weeks, Math.floor(tt / 1.1) + 1), sub = (tt % 1.1) / 1.1;
      ctx.globalAlpha = fade;
      txt(ctx, 'SHOPS', sx, h * 0.1, 'left', P.dim);
      txt(ctx, 'WEEK ' + wk, gx1, h * 0.1, 'right', color);
      if (!narrow) txt(ctx, 'MARKET PRICE', gx0, h * 0.1, 'left', P.dim);
      const sy = (i) => gy0 + i * ((gy1 - gy0) / (shops - 1));
      for (let i = 0; i < shops; i++) { ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5; rr(ctx, sx, sy(i) - 11, sw, 22, 4); ctx.stroke(); ctx.fillStyle = P.dim; ctx.fillRect(sx + 7, sy(i) - 1.5, sw - 14, 3); }
      ctx.strokeStyle = P.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx0, gy0 - 6); ctx.lineTo(gx0, gy1 + 6); ctx.lineTo(gx1, gy1 + 6); ctx.stroke();
      const px = (k) => lerp(gx0 + 12, gx1 - 6, k / (weeks - 1));
      const price = (k, i) => lerp(gy0 + 10, gy1 - 6, 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(k * 0.7 + i * 1.7)) * 0.6 + hash(k * 7 + i) * 0.25 + k * 0.012);
      const avg = (k) => { let s = 0; for (let i = 0; i < shops; i++) s += price(k, i); return s / shops; };
      for (let k = 0; k < wk; k++) {
        const cur = k === wk - 1 && tt < weeks * 1.1;
        for (let i = 0; i < shops; i++) {
          const u = cur ? easeOut(clamp(sub / 0.7, 0, 1)) : 1;
          const x = lerp(sx + sw, px(k), u), y = lerp(sy(i), price(k, i), u);
          ctx.globalAlpha = fade * (cur ? 1 : 0.35); ctx.fillStyle = P.dim; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, TAU); ctx.fill();
        }
      }
      const done = tt < weeks * 1.1 ? wk - 1 : wk;
      if (done > 0) {
        ctx.globalAlpha = fade; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath();
        for (let k = 0; k < done; k++) { if (k) ctx.lineTo(px(k), avg(k)); else ctx.moveTo(px(k), avg(k)); }
        ctx.stroke(); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px(done - 1), avg(done - 1), 4, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    tracker: function (ctx, w, h, t, color, P) {
      const T = 13, tt = t % T, fade = loopFade(tt, T), narrow = w < 440;
      const cols = ['NEW', 'RUNNING', 'DONE'], x0 = w * 0.06, bw = narrow ? w * 0.6 : w * 0.56, cw = bw / 3, y0 = h * 0.2, y1 = h * 0.9;
      ctx.globalAlpha = fade;
      cols.forEach((c, i) => { txt(ctx, c, x0 + i * cw + 6, h * 0.1, 'left', i === 2 ? color : P.dim); if (i) { ctx.strokeStyle = P.rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + i * cw, y0 - 4); ctx.lineTo(x0 + i * cw, y1); ctx.stroke(); } });
      const n = 14, cardH = 13, gap = 5, count = [0, 0, 0]; let doneCount = 0;
      for (let i = 0; i < n; i++) {
        const s = 0.3 + i * 0.75, p = tt - s; if (p < 0) continue;
        const stage = p < 1.4 ? 0 : p < 3.2 ? 1 : 2; if (stage === 2) doneCount++;
        const slot = stage === 2 ? doneCount - 1 : count[stage]++;
        if (slot > 8) continue;
        const tx = x0 + stage * cw + 6, ty = y0 + slot * (cardH + gap);
        const mv = stage === 0 ? 0 : clamp((p - (stage === 1 ? 1.4 : 3.2)) / 0.4, 0, 1), fx = x0 + (stage - 1) * cw + 6;
        const x = stage === 0 ? tx : lerp(fx, tx, easeOut(mv));
        ctx.globalAlpha = fade * (stage === 2 ? 0.9 : 0.75) * clamp(p / 0.3, 0, 1);
        ctx.strokeStyle = stage === 2 ? color : P.ink; ctx.lineWidth = 1; rr(ctx, x, ty, cw - 12, cardH, 3); ctx.stroke();
        ctx.fillStyle = stage === 2 ? color : P.dim; ctx.fillRect(x + 5, ty + cardH / 2 - 1.5, (cw - 22) * (0.4 + hash(i + 4) * 0.5), 3);
      }
      // savings bar + survey smiley
      const bx = x0 + bw + 26, bx1 = w * 0.94, gw = bx1 - bx;
      ctx.globalAlpha = fade; txt(ctx, 'SAVINGS', bx, h * 0.1, 'left', color);
      const fill = clamp(doneCount / 9, 0, 1), bh = (y1 - y0) * 0.62;
      ctx.globalAlpha = fade; ctx.strokeStyle = P.rule; ctx.lineWidth = 1; rr(ctx, bx, y0, Math.min(gw, 44), bh, 4); ctx.stroke();
      ctx.fillStyle = color; ctx.fillRect(bx + 4, y0 + bh - 4 - (bh - 8) * fill, Math.min(gw, 44) - 8, (bh - 8) * fill);
      const pop = doneCount > 0 ? easeOut(clamp(((tt - 0.3) % 0.75) / 0.4, 0, 1)) : 0, fy = y1 - 16, fx2 = bx + Math.min(gw, 44) / 2;
      ctx.globalAlpha = fade * (doneCount > 0 ? 1 : 0.3); ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(fx2, fy, 11 + pop, 0, TAU); ctx.stroke();
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(fx2 - 4, fy - 3, 1.5, 0, TAU); ctx.arc(fx2 + 4, fy - 3, 1.5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(fx2, fy + 1, 5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      if (!narrow) txt(ctx, '1 CLICK', fx2 + 18, fy, 'left', P.dim);
      ctx.globalAlpha = 1;
    },

    agents: function (ctx, w, h, t, color, P) {
      const T = 6, k = Math.floor(t / T), tt = t % T, narrow = w < 440;
      const qx = w * 0.1, ox = w * 0.45, ax = w * 0.82, my = h * 0.55, n = 3, ay = (i) => h * 0.25 + i * h * 0.3;
      const pick = Math.floor(hash(k * 3 + 1) * n);
      txt(ctx, 'QUESTION', qx, h * 0.12, 'center', P.dim);
      txt(ctx, narrow ? 'ROUTER' : 'ORCHESTRATOR', ox, h * 0.12, 'center', color);
      txt(ctx, narrow ? 'AGENTS' : 'SPECIALIST AGENTS', ax, h * 0.12, 'center', P.dim);
      ctx.lineWidth = 1;
      for (let i = 0; i < n; i++) { ctx.globalAlpha = i === pick && tt > 1.3 && tt < 4.4 ? 0.9 : 0.3; ctx.strokeStyle = i === pick && tt > 1.3 && tt < 4.4 ? color : P.dim; ctx.beginPath(); ctx.moveTo(ox, my); ctx.lineTo(ax, ay(i)); ctx.stroke(); }
      ctx.globalAlpha = 0.4; ctx.strokeStyle = P.dim; ctx.beginPath(); ctx.moveTo(qx, my); ctx.lineTo(ox, my); ctx.stroke();
      // question bubble
      ctx.globalAlpha = 1; ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5; rr(ctx, qx - 22, my - 14, 44, 28, 8); ctx.stroke();
      ctx.fillStyle = P.ink; ctx.fillRect(qx - 12, my - 4, 24, 3); ctx.fillRect(qx - 12, my + 3, 15, 3);
      // orchestrator
      ctx.fillStyle = P.space; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox, my, 17, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(ox, my); ctx.rotate(t * 0.8); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 1.3); ctx.stroke(); ctx.restore();
      // agents
      for (let i = 0; i < n; i++) {
        const on = i === pick && tt > 1.5 && tt < 4.2;
        ctx.globalAlpha = 1; ctx.fillStyle = on ? color : P.space; ctx.strokeStyle = on ? color : P.ink; ctx.lineWidth = 1.5;
        sq(ctx, ax, ay(i), 24, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = on ? P.space : P.dim; ctx.fillRect(ax - 6, ay(i) - 1.5, 12, 3);
      }
      // pulse: question → orchestrator → agent → orchestrator → answer
      let px, py, pc = P.ink;
      if (tt < 0.9) { const u = easeOut(tt / 0.9); px = lerp(qx + 22, ox - 17, u); py = my; }
      else if (tt < 1.5) { const u = easeOut((tt - 0.9) / 0.6); px = lerp(ox, ax, u); py = lerp(my, ay(pick), u); }
      else if (tt < 2.9) { px = null; }
      else if (tt < 3.6) { const u = easeOut((tt - 2.9) / 0.7); px = lerp(ax, ox, u); py = lerp(ay(pick), my, u); pc = color; }
      else if (tt < 4.5) { const u = easeOut((tt - 3.6) / 0.9); px = lerp(ox - 17, qx + 22, u); py = my + 22 * Math.sin(u * Math.PI); pc = color; }
      if (px != null) { ctx.globalAlpha = 1; ctx.fillStyle = pc; ctx.beginPath(); ctx.arc(px, py, 5, 0, TAU); ctx.fill(); }
      if (tt > 4.5) { const u = clamp((tt - 4.5) / 0.4, 0, 1) * clamp((T - tt) / 0.4, 0, 1); ctx.globalAlpha = u; txt(ctx, 'ANSWER', qx, my + 30, 'center', color); }
      ctx.globalAlpha = 1;
    },

    deck: function (ctx, w, h, t, color, P) {
      const T = 12, tt = t % T, fade = loopFade(tt, T), narrow = w < 440;
      const x0 = w * 0.06, ix = w * 0.1, ox = w * 0.3, oy = h * 0.22, sx0 = w * 0.5, x1 = w * 0.94;
      ctx.globalAlpha = fade;
      txt(ctx, 'IDEA', ix, h * 0.1, 'center', P.dim);
      txt(ctx, 'OUTLINE', ox + 30, h * 0.1, 'center', P.dim);
      txt(ctx, narrow ? 'DECK' : 'ON-BRAND DECK', (sx0 + x1) / 2, h * 0.1, 'center', color);
      // idea spark
      const pulse = 1 + 0.15 * Math.sin(tt * 4);
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(ix, h * 0.5, 7 * pulse, 0, TAU); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5; for (let r = 0; r < 6; r++) { const a = r * TAU / 6; ctx.globalAlpha = fade * 0.6; ctx.beginPath(); ctx.moveTo(ix + Math.cos(a) * 12, h * 0.5 + Math.sin(a) * 12); ctx.lineTo(ix + Math.cos(a) * 17, h * 0.5 + Math.sin(a) * 17); ctx.stroke(); }
      // outline
      ctx.globalAlpha = fade; ctx.strokeStyle = P.rule; ctx.lineWidth = 1; const ow = Math.min(w * 0.15, 90); rr(ctx, ox, oy, ow, h * 0.62, 5); ctx.stroke();
      for (let i = 0; i < 6; i++) { const u = clamp((tt - 0.6 - i * 0.25) / 0.3, 0, 1); ctx.globalAlpha = fade * u; ctx.fillStyle = i % 3 === 0 ? P.ink : P.dim; ctx.fillRect(ox + (i % 3 === 0 ? 8 : 16), oy + 14 + i * 13, (ow - 26) * (i % 3 === 0 ? 0.8 : 0.6), 3); }
      // sign-off
      const so = easeOut(clamp((tt - 2.6) / 0.4, 0, 1));
      if (so > 0) { ctx.globalAlpha = fade * so; ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; const cx = ox + ow / 2, cy = oy + h * 0.62 - 20; ctx.beginPath(); ctx.moveTo(cx - 9, cy); ctx.lineTo(cx - 3, cy + 6); ctx.lineTo(cx + 10, cy - 8); ctx.stroke(); if (!narrow) txt(ctx, 'SIGNED OFF', cx, cy + 22, 'center', color); }
      // slides assemble
      const cols = 3, rows = 2, g = 8, swid = (x1 - sx0 - g * (cols - 1)) / cols, sh = swid * 0.6;
      const gy = h * 0.5 - (rows * sh + g) / 2;
      for (let i = 0; i < cols * rows; i++) {
        const u = easeOut(clamp((tt - 3.3 - i * 0.45) / 0.6, 0, 1)); if (u <= 0) continue;
        const tx = sx0 + (i % cols) * (swid + g), ty = gy + Math.floor(i / cols) * (sh + g);
        const fx = ox + ow, fy = oy + 30;
        const x = lerp(fx, tx, u), y = lerp(fy, ty, u), s = lerp(0.3, 1, u);
        ctx.globalAlpha = fade; ctx.strokeStyle = P.ink; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, swid * s - 1, sh * s - 1);
        if (u > 0.9) {
          ctx.fillStyle = color; ctx.fillRect(x + 6, y + 6, swid * 0.45, 4);
          ctx.fillStyle = P.dim; const kind = i % 3;
          if (kind === 0) for (let b = 0; b < 3; b++) ctx.fillRect(x + 6, y + 16 + b * 6, swid * (0.5 + hash(i + b) * 0.3), 2);
          else if (kind === 1) for (let b = 0; b < 4; b++) { const bh = (sh - 24) * (0.3 + hash(i * 3 + b) * 0.7); ctx.fillRect(x + 8 + b * (swid - 16) / 4, y + sh - 6 - bh, (swid - 16) / 4 - 3, bh); }
          else { ctx.beginPath(); ctx.arc(x + swid / 2, y + sh * 0.6, sh * 0.22, 0, TAU); ctx.strokeStyle = P.dim; ctx.stroke(); }
        }
      }
      ctx.globalAlpha = 1;
    },

    /* ---------- personal ---------- */

    radar: function (ctx, w, h, t, color, P) {
      const cx = w * 0.5, cy = h * 0.9, R = Math.min(h * 0.78, w * 0.46), fov = Math.PI * 2 / 3, a0 = -Math.PI / 2 - fov / 2, a1 = a0 + fov;
      ctx.lineWidth = 1; ctx.strokeStyle = P.dim;
      for (let i = 1; i <= 4; i++) { ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(cx, cy, R * i / 4, a0, a1); ctx.stroke(); }
      for (let i = 0; i <= 4; i++) { const a = a0 + fov * i / 4; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke(); }
      // sweep, back and forth across the field of view
      const s = (Math.sin(t * 1.1) + 1) / 2, sa = a0 + fov * s;
      const grd = 0.22;
      for (let k = 0; k < 14; k++) { const aa = sa - (Math.cos(t * 1.1) >= 0 ? 1 : -1) * grd * k / 14; if (aa < a0 || aa > a1) continue; ctx.globalAlpha = 0.18 * (1 - k / 14); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(aa) * R, cy + Math.sin(aa) * R); ctx.stroke(); }
      ctx.globalAlpha = 0.9; ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sa) * R, cy + Math.sin(sa) * R); ctx.stroke();
      // people moving around: smooth wandering targets with short trails
      for (let j = 0; j < 3; j++) {
        for (let k = 6; k >= 0; k--) {
          const tk = t - k * 0.25, ang = a0 + fov * (0.5 + 0.38 * Math.sin(tk * (0.23 + j * 0.07) + j * 2.1)), dist = R * (0.3 + 0.55 * (0.5 + 0.5 * Math.sin(tk * (0.17 + j * 0.05) + j * 4)));
          const x = cx + Math.cos(ang) * dist, y = cy + Math.sin(ang) * dist;
          ctx.globalAlpha = k ? 0.12 * (1 - k / 7) : 1; ctx.fillStyle = k ? P.ink : color; ctx.beginPath(); ctx.arc(x, y, k ? 3 : 5, 0, TAU); ctx.fill();
          if (!k) { ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 3 + j); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.stroke(); }
        }
      }
      ctx.globalAlpha = 1; ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, TAU); ctx.fill();
      txt(ctx, 'mmWAVE RADAR', w * 0.06, h * 0.1, 'left', P.dim);
      txt(ctx, 'LIVE', w * 0.94, h * 0.1, 'right', color);
    },

    voice: function (ctx, w, h, t, color, P) {
      const T = 10, tt = t % T, fade = loopFade(tt, T), narrow = w < 440;
      const x0 = w * 0.06, wx1 = w * 0.38, px = w * 0.5, nx = w * 0.62, x1 = w * 0.94, my = h * 0.55;
      ctx.globalAlpha = fade;
      txt(ctx, narrow ? 'VOICE' : 'VOICE NOTE', x0, h * 0.1, 'left', P.dim);
      txt(ctx, 'PI', px, h * 0.1, 'center', P.dim);
      txt(ctx, 'OBSIDIAN', x1, h * 0.1, 'right', color);
      // waveform while recording
      const rec = tt < 4.2, bars = narrow ? 14 : 22, bw = (wx1 - x0) / bars;
      for (let i = 0; i < bars; i++) {
        const amp = rec ? (0.25 + 0.75 * Math.abs(Math.sin(tt * 6 + i * 0.9) * Math.sin(tt * 2.3 + i * 0.37))) : 0.08;
        const bh = h * 0.42 * amp;
        ctx.globalAlpha = fade * (rec ? 0.95 : 0.4); ctx.fillStyle = i / bars < tt / 4.2 || !rec ? P.ink : P.dim;
        rr(ctx, x0 + i * bw + 1, my - bh / 2, Math.max(2, bw - 3), bh, 1.5); ctx.fill();
      }
      if (rec) { ctx.globalAlpha = fade * (0.5 + 0.5 * Math.sin(tt * 6)); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x0 + 5, h * 0.2, 4, 0, TAU); ctx.fill(); ctx.globalAlpha = fade; txt(ctx, 'REC', x0 + 14, h * 0.2, 'left', color); }
      // transcription node
      ctx.globalAlpha = fade; ctx.strokeStyle = P.ink; ctx.lineWidth = 1.5; sq(ctx, px, my, 30, 5); ctx.stroke();
      const proc = tt > 4.2 && tt < 5.6;
      ctx.save(); ctx.translate(px, my); if (proc) ctx.rotate(tt * 4); ctx.strokeStyle = proc ? color : P.dim; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 1.4); ctx.stroke(); ctx.restore();
      if (tt > 4.2) { const u = easeOut(clamp((tt - 4.2) / 0.6, 0, 1)); ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(lerp(wx1, px - 15, u), my, 4, 0, TAU); ctx.globalAlpha = fade * (1 - clamp((tt - 4.8) / 0.3, 0, 1)); ctx.fill(); }
      // note card
      ctx.globalAlpha = fade; ctx.strokeStyle = P.rule; ctx.lineWidth = 1; const ny = h * 0.2, nh = h * 0.7; rr(ctx, nx, ny, x1 - nx, nh, 6); ctx.stroke();
      const L = [0.55, 0.9, 0.85, 0.95, 0.7, 0.8, 0.5];
      for (let i = 0; i < L.length; i++) {
        const u = clamp((tt - 5.6 - i * 0.35) / 0.35, 0, 1); if (u <= 0) continue;
        ctx.globalAlpha = fade * (i ? 0.7 : 1); ctx.fillStyle = i ? P.ink : color;
        ctx.fillRect(nx + 12, ny + 18 + i * ((nh - 30) / L.length), (x1 - nx - 24) * L[i] * u, i ? 3 : 6);
      }
      ctx.globalAlpha = 1;
    },

    orbit: function (ctx, w, h, t, color, P) {
      const x0 = w * 0.04, x1 = w * 0.96, y0 = h * 0.18, y1 = h * 0.92, mw = x1 - x0, mh = y1 - y0;
      ctx.lineWidth = 1; ctx.strokeStyle = P.dim;
      for (let i = 0; i <= 12; i++) { ctx.globalAlpha = i % 6 === 0 ? 0.35 : 0.15; ctx.beginPath(); ctx.moveTo(x0 + mw * i / 12, y0); ctx.lineTo(x0 + mw * i / 12, y1); ctx.stroke(); }
      for (let i = 0; i <= 6; i++) { ctx.globalAlpha = i === 3 ? 0.35 : 0.15; ctx.beginPath(); ctx.moveTo(x0, y0 + mh * i / 6); ctx.lineTo(x1, y0 + mh * i / 6); ctx.stroke(); }
      // ground track: 51.6° inclination, the track shifts west every orbit
      const inc = 51.6 / 90, period = 18, lonOf = (s, k) => ((s + k * 0.0625) % 1 + 1) % 1, latOf = (s) => Math.sin(s * TAU) * inc;
      const P2 = (s, k) => [x0 + mw * lonOf(s, k), y0 + mh * (0.5 - latOf(s) * 0.5)];
      const now = (t / period), orbitK = -Math.floor(now), s0 = now % 1;
      for (let k = 0; k < 2; k++) {
        ctx.globalAlpha = k ? 0.18 : 0.4; ctx.strokeStyle = k ? P.dim : P.ink; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]); ctx.beginPath();
        let prev = null;
        for (let i = 0; i <= 120; i++) { const s = i / 120, p = P2(s, orbitK - k); if (prev && Math.abs(p[0] - prev[0]) > mw / 2) ctx.moveTo(p[0], p[1]); else if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); prev = p; }
        ctx.stroke(); ctx.setLineDash([]);
      }
      // trail and station
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (let i = 0; i < 30; i++) { const s1 = s0 - i * 0.006, s2 = s0 - (i + 1) * 0.006; const a = P2(s1, orbitK), b = P2(s2, orbitK); if (Math.abs(a[0] - b[0]) > mw / 2) continue; ctx.globalAlpha = 1 - i / 30; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      const p = P2(s0, orbitK);
      ctx.globalAlpha = 0.3 + 0.2 * Math.sin(t * 3); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p[0], p[1], 14, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = color; ctx.fillRect(p[0] - 9, p[1] - 1.5, 18, 3); ctx.fillRect(p[0] - 3, p[1] - 4, 6, 8);
      txt(ctx, 'ISS · LIVE POSITION', x0, h * 0.08, 'left', P.dim);
      txt(ctx, 'SGP4', x1, h * 0.08, 'right', color);
    },

    chess: function (ctx, w, h, t, color, P) {
      const T = 7, k = Math.floor(t / T), tt = t % T, narrow = w < 440;
      const bs = Math.min(h * 0.74, w * 0.42), bx = w * 0.06, by = h * 0.18, c = bs / 8;
      txt(ctx, narrow ? 'CAMERA' : 'CAMERA ON A REAL BOARD', bx, h * 0.08, 'left', P.dim);
      for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) { ctx.globalAlpha = (r + f) % 2 ? 0.16 : 0.05; ctx.fillStyle = P.ink; ctx.fillRect(bx + f * c, by + r * c, c, c); }
      ctx.globalAlpha = 0.5; ctx.strokeStyle = P.dim; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bs - 1, bs - 1);
      // a handful of pieces; one moves per cycle
      const seed = k % 5, pcs = [];
      for (let i = 0; i < 9; i++) pcs.push({ f: Math.floor(hash(i * 17 + 3) * 8), r: Math.floor(hash(i * 29 + 7) * 8), wht: i % 2 === 0 });
      const mover = seed % pcs.length, from = pcs[mover], to = { f: (from.f + 1 + seed) % 8, r: (from.r + 2) % 8 };
      const mu = easeOut(clamp((tt - 0.6) / 0.6, 0, 1));
      pcs.forEach((p, i) => {
        let f = p.f, r = p.r; if (i === mover) { f = lerp(p.f, to.f, mu); r = lerp(p.r, to.r, mu); }
        const x = bx + f * c + c / 2, y = by + r * c + c / 2;
        ctx.globalAlpha = 1; ctx.fillStyle = p.wht ? P.ink : P.space; ctx.strokeStyle = i === mover ? color : P.ink; ctx.lineWidth = i === mover ? 2 : 1.2;
        ctx.beginPath(); ctx.arc(x, y, c * 0.3, 0, TAU); ctx.fill(); ctx.stroke();
      });
      if (tt > 0.6 && tt < 1.6) { ctx.globalAlpha = 0.6 * (1 - clamp((tt - 1.2) / 0.4, 0, 1)); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(bx + to.f * c + 1, by + to.r * c + 1, c - 2, c - 2); }
      // eval bar swings
      const ex = bx + bs + 12, ew = 10, prevE = 0.5 + 0.3 * Math.sin(k * 1.9), nextE = 0.5 + 0.3 * Math.sin((k + 1) * 1.9);
      const ev = lerp(prevE, nextE, easeOut(clamp((tt - 1.3) / 0.7, 0, 1)));
      ctx.globalAlpha = 1; ctx.fillStyle = P.space; ctx.fillRect(ex, by, ew, bs); ctx.fillStyle = P.ink; ctx.fillRect(ex, by + bs * (1 - ev), ew, bs * ev);
      ctx.strokeStyle = P.dim; ctx.lineWidth = 1; ctx.strokeRect(ex + 0.5, by + 0.5, ew - 1, bs - 1);
      if (!narrow) txt(ctx, 'STOCKFISH', ex + ew / 2, by + bs + 12, 'center', P.dim, 9.5);
      // commentary bubble with a little sound wave
      const qx = ex + ew + 22, qx1 = w * 0.94, qy = by + bs * 0.18, qh = bs * 0.5, su = clamp((tt - 2.1) / 0.3, 0, 1);
      if (qx1 - qx > 60 && su > 0) {
        ctx.globalAlpha = su; ctx.strokeStyle = color; ctx.lineWidth = 1.5; rr(ctx, qx, qy, qx1 - qx, qh, 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(qx + 14, qy + qh); ctx.lineTo(qx + 8, qy + qh + 10); ctx.lineTo(qx + 26, qy + qh); ctx.stroke();
        const L = [0.9, 0.75, 0.55];
        for (let i = 0; i < L.length; i++) { const u = clamp((tt - 2.4 - i * 0.5) / 0.5, 0, 1); ctx.globalAlpha = su * 0.8; ctx.fillStyle = P.ink; ctx.fillRect(qx + 12, qy + 16 + i * 12, (qx1 - qx - 24) * L[i] * u, 3); }
        txt(ctx, narrow ? 'LLM + VOICE' : 'LLM EXPLAINS · VOICE SPEAKS', qx, h * 0.08, 'left', color);
        for (let i = 0; i < 5; i++) { const a = 0.3 + 0.7 * Math.abs(Math.sin(tt * 7 + i)); ctx.globalAlpha = su * (tt > 2.4 && tt < 5.6 ? 0.9 : 0.3); ctx.fillStyle = color; ctx.fillRect(qx + 12 + i * 7, qy + qh + 22 - 8 * a, 4, 16 * a); }
      }
      ctx.globalAlpha = 1;
    },

    buddy: function (ctx, w, h, t, color, P) {
      const TASKS = ['Write intro', 'Fix dashboard', 'Review deck', 'Plan sprint'], T = 4, k = Math.floor(t / T), tt = t % T;
      const dw = Math.min(w * 0.5, 260), dh = dw * 0.62, dx = w * 0.5 - dw / 2 + (w > 440 ? w * 0.08 : 0), dy = h * 0.14;
      // device and stand
      ctx.globalAlpha = 1; ctx.strokeStyle = P.ink; ctx.lineWidth = 2; rr(ctx, dx, dy, dw, dh, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(dx + dw / 2, dy + dh); ctx.lineTo(dx + dw / 2 - 16, h * 0.9); ctx.moveTo(dx + dw / 2, dy + dh); ctx.lineTo(dx + dw / 2 + 16, h * 0.9); ctx.moveTo(dx + dw / 2 - 30, h * 0.9); ctx.lineTo(dx + dw / 2 + 30, h * 0.9); ctx.stroke();
      // incoming message
      if (w > 440) {
        const mu = easeOut(clamp((tt - 0.1) / 0.5, 0, 1)) * (1 - clamp((tt - 0.9) / 0.3, 0, 1));
        const mx = lerp(w * 0.04, dx - 10, easeOut(clamp(tt / 0.9, 0, 1))), my = dy + dh * 0.4;
        ctx.globalAlpha = 1; txt(ctx, 'TELEGRAM', w * 0.06, h * 0.1, 'left', P.dim);
        ctx.globalAlpha = mu; ctx.strokeStyle = color; ctx.lineWidth = 1.5; rr(ctx, mx - 60, my - 10, 60, 20, 8); ctx.stroke(); ctx.fillStyle = color; ctx.fillRect(mx - 50, my - 1.5, 38, 3);
      }
      // screen: current task, flips to the next
      const flip = clamp((tt - 0.9) / 0.5, 0, 1), sy = Math.abs(Math.cos(flip * Math.PI)), task = flip < 0.5 ? TASKS[(k + TASKS.length - 1) % TASKS.length] : TASKS[k % TASKS.length];
      ctx.save(); ctx.translate(dx + dw / 2, dy + dh / 2); ctx.scale(1, Math.max(0.02, sy));
      ctx.globalAlpha = 1; txt(ctx, 'NOW', 0, -dh * 0.22, 'center', color, 10);
      ctx.font = '500 ' + Math.round(dw * 0.085) + 'px "IBM Plex Mono", ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = P.ink; ctx.fillText(task, 0, 4);
      ctx.restore();
      ctx.globalAlpha = 1; txt(ctx, 'ONE TASK AT A TIME', w * 0.94, h * 0.1, 'right', P.dim);
      ctx.globalAlpha = 1;
    },

    site: function (ctx, w, h, t, color, P) {
      const T = 12, tt = t % T, fade = loopFade(tt, T);
      const fx = w * 0.06, fy = h * 0.22, fw = Math.min(w * 0.18, 92), fh = h * 0.58;
      const cx = (fx + fw + w * 0.96) / 2, cy = h * 0.56, S = Math.max(30, Math.min(h * 0.38 / 0.62 - 18, (w * 0.96 - fx - fw - 16) / 2 - 18));
      // content file feeding the map
      ctx.globalAlpha = fade; txt(ctx, 'site.json', fx, h * 0.1, 'left', P.dim);
      ctx.strokeStyle = P.rule; ctx.lineWidth = 1; rr(ctx, fx, fy, fw, fh, 5); ctx.stroke();
      for (let i = 0; i < 9; i++) { ctx.globalAlpha = fade * 0.6; ctx.fillStyle = i % 3 === 0 ? color : P.dim; ctx.fillRect(fx + 8 + (i % 3 ? 8 : 0), fy + 12 + i * (fh - 20) / 9, (fw - 24) * (i % 3 === 0 ? 0.6 : 0.5 + hash(i) * 0.3), 3); }
      // two spiral lines draw out from the hub, stations pop as the line passes
      const arms = [{ col: P.ink, dir: 1, ph: 0 }, { col: color, dir: 1, ph: Math.PI }];
      const grow = easeOut(clamp((tt - 0.4) / 5, 0, 1));
      arms.forEach((A) => {
        ctx.globalAlpha = fade; ctx.strokeStyle = A.col; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
        const N = 80;
        for (let i = 0; i <= N * grow; i++) { const u = i / N, a = A.ph + A.dir * u * Math.PI * 1.25, r = 18 + u * S; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.62; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke();
        for (let sI = 1; sI <= 5; sI++) {
          const u = sI / 5.4; if (u > grow) continue;
          const a = A.ph + A.dir * u * Math.PI * 1.25, r = 18 + u * S, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.62, pop = easeOut(clamp((grow - u) * 8, 0, 1));
          ctx.fillStyle = P.space; ctx.strokeStyle = A.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 5 * pop, 0, TAU); ctx.fill(); ctx.stroke();
        }
      });
      ctx.globalAlpha = fade; ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(cx, cy, 15, 0, TAU); ctx.fill();
      ctx.fillStyle = P.space; ctx.font = '500 12px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('JV', cx, cy + 1);
      txt(ctx, 'MAP LAYS ITSELF OUT', w * 0.94, h * 0.1, 'right', color);
      ctx.globalAlpha = 1;
    }

  };

  function start(canvas, kind, color, P, still) {
    const fn = SCENES[kind]; if (!fn) return function () {};
    const ctx = canvas.getContext('2d'); let raf = 0, alive = true, ro = null; const t0 = performance.now();
    function paint(now) {
      if (!alive) return;
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(10, r.width), h = Math.max(10, r.height);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      fn(ctx, w, h, still ? STILL[kind] : Math.max(0, (now - t0) / 1000), color, P);
      if (!still) raf = requestAnimationFrame(paint);
    }
    raf = requestAnimationFrame(paint);
    if (still && 'ResizeObserver' in window) { ro = new ResizeObserver(function () { requestAnimationFrame(paint); }); ro.observe(canvas); }
    return function () { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); };
  }
  return { start: start, describe: function (k) { return DESC[k] || 'Animated diagram'; } };
})();
