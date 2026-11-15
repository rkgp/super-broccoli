/* Small animated diagrams for work stations. Drawn from scratch: no real screens, no real data.
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
    flows: 'Animated diagram: automations run in the background and completed runs add up.'
  };
  const STILL = { check: 7.2, search: 2.6, tiles: 5, flows: 8 };

  function txt(ctx, s, x, y, align, color, size) {
    ctx.font = '500 ' + (size || 10.5) + 'px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
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
