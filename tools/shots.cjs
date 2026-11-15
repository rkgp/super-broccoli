/* Development check: clicks through a built page and saves screenshots.
   Usage: node tools/shots.cjs <path-to-html> <output-folder> <prefix> */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const [html, outDir, prefix] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  const errs = [];
  for (const [vn, vp] of [['D', { width: 1280, height: 820 }], ['M', { width: 400, height: 800 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', (e) => errs.push(vn + ': ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errs.push(vn + ' console: ' + m.text()); });
    const shot = (n) => p.screenshot({ path: path.join(outDir, `${prefix}-${vn}${n}.png`) });
    await p.goto('file://' + path.resolve(html));
    await p.waitForTimeout(1200);
    await shot('1-hub');
    await p.click('#mp-0'); await p.waitForTimeout(700);
    await shot('2-hop');
    await p.waitForTimeout(3400);
    await shot('3-station');
    await p.click('#st-inner .btn.primary'); await p.waitForTimeout(3600);
    await shot('4-next');
    await p.click('#mapbtn'); await p.waitForTimeout(1600);
    await shot('5-everything');
    await p.click('#sheet [data-jump="1:0"]'); await p.waitForTimeout(2400);
    await shot('6-build');
    await p.click('#st-inner [data-go="hub"]'); await p.waitForTimeout(3200);
    await p.click('#hubwrap [data-about]'); await p.waitForTimeout(1800);
    await shot('7-about');
    const info = await p.evaluate(() => ({ overflowX: document.documentElement.scrollWidth - innerWidth, hash: location.hash, name: (document.querySelector('.st-name') || {}).textContent }));
    console.log(prefix, vn, JSON.stringify(info));
    await p.close();
  }
  console.log(prefix, 'errors:', JSON.stringify(errs));
  await b.close();
})();
