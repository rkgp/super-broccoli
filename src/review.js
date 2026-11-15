/* Review-only: switches to compare the branches (looks) and the routes (line shapes).
   Left out of the real site build. */
(function () {
  'use strict';
  var M = window.SiteMap, stage = document.getElementById('stage');
  if (!M || !stage) return;
  stage.classList.add('has-review');
  var bar = document.createElement('div');
  bar.className = 'review';
  bar.innerHTML =
    '<div class="row"><span>Look</span><div class="seg" role="group" aria-label="Look">' +
    M.variants.map(function (v, i) { return '<button type="button" data-variant="' + v.key + '">' + (i + 1) + ' · ' + v.label + '</button>'; }).join('') + '</div></div>' +
    '<div class="row"><span>Route</span><div class="seg" role="group" aria-label="Route">' +
    M.routes.map(function (r, i) { return '<button type="button" data-route="' + r.key + '" aria-label="Route ' + r.label + '">' + String.fromCharCode(65 + i) + '<i> · ' + r.label + '</i></button>'; }).join('') + '</div></div>';
  stage.appendChild(bar);
  function mark() {
    bar.querySelectorAll('[data-variant]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.variant === M.variant() ? 'true' : 'false'); });
    bar.querySelectorAll('[data-route]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.route === M.route() ? 'true' : 'false'); });
  }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private window */ } }
  bar.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    ev.stopPropagation();
    if (b.dataset.variant) { M.setVariant(b.dataset.variant); save('jv-branch', b.dataset.variant); }
    if (b.dataset.route) { M.setRoute(b.dataset.route, true); save('jv-route', b.dataset.route); }
    mark();
  });
  try {
    var v = localStorage.getItem('jv-branch'); if (v) M.setVariant(v);
    var r = localStorage.getItem('jv-route'); if (r && r !== M.route() && !location.hash) M.setRoute(r, false);
  } catch (e) { /* private window */ }
  mark();
})();
