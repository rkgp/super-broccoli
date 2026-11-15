/* Review-only: two dropdowns to compare the looks and the routes (line shapes).
   Left out of the real site build. */
(function () {
  'use strict';
  var M = window.SiteMap, stage = document.getElementById('stage');
  if (!M || !stage) return;
  stage.classList.add('has-review');
  var bar = document.createElement('div');
  bar.className = 'review';
  bar.innerHTML =
    '<select id="rv-look" aria-label="Look">' +
    M.variants.map(function (v, i) { return '<option value="' + v.key + '">Look ' + (i + 1) + ' · ' + v.label + '</option>'; }).join('') + '</select>' +
    '<select id="rv-route" aria-label="Route">' +
    M.routes.map(function (r, i) { return '<option value="' + r.key + '">Route ' + String.fromCharCode(65 + i) + ' · ' + r.label + '</option>'; }).join('') + '</select>';
  stage.appendChild(bar);
  var look = bar.querySelector('#rv-look'), route = bar.querySelector('#rv-route');
  function mark() { look.value = M.variant(); route.value = M.route(); }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private window */ } }
  look.addEventListener('change', function () { M.setVariant(look.value); save('jv-branch', look.value); mark(); });
  route.addEventListener('change', function () { M.setRoute(route.value, true); save('jv-route', route.value); mark(); });
  try {
    var v = localStorage.getItem('jv-branch'); if (v) M.setVariant(v);
    var r = localStorage.getItem('jv-route');
    if (r && r !== M.route()) {
      // switch to the saved route, then reopen the station the link points to
      var h = (location.hash || '').slice(1);
      M.setRoute(r, false);
      if (h) location.hash = h;
    }
  } catch (e) { /* private window */ }
  mark();
})();
