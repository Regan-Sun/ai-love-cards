const { chromium, devices } = require('playwright');
const fs = require('fs'); const path = require('path');
const ROOT = '/Users/sunxuming/WorkBuddy/2026-10-06-16-44-27/ai-love-cards';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png' };

// 模拟老浏览器：把 webp 请求全部打成 404，验证是否自动回退到 PNG
(async () => {
  const b = await chromium.launch();
  for (const mode of ['支持 WebP', '不支持 WebP（回退验证）']) {
    const ctx = await b.newContext(devices['iPhone 12']);
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.route('**/*', route => {
      const rel = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//, '') || 'index.html';
      const f = path.join(ROOT, rel);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: '' });
      if (mode.startsWith('不支持') && f.endsWith('.webp')) return route.fulfill({ status: 404, body: '' });
      const buf = fs.readFileSync(f);
      return route.fulfill({ status: 200, headers: { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }, body: buf });
    });
    await page.goto('http://t.test/index.html');
    await page.waitForTimeout(2500);
    const r = await page.evaluate(() => {
      const f = document.getElementById('front');
      const vis = getComputedStyle(f).opacity;
      return {
        src: (f.currentSrc || f.src).split('/').pop().slice(-20),
        loaded: f.complete && f.naturalWidth > 0,
        w: f.naturalWidth,
        opacity: vis,
        errShown: document.getElementById('imageError').classList.contains('visible'),
      };
    });
    // 点下一页看是否还能正常取图
    await page.click('#deckNext'); await page.waitForTimeout(1200);
    const r2 = await page.evaluate(() => {
      const f = document.getElementById('front');
      return { src: (f.currentSrc || f.src).split('/').pop().slice(-20), loaded: f.complete && f.naturalWidth > 0 };
    });
    console.log(`\n${mode}`);
    console.log(`  首屏图: ${r.loaded ? '✅ 已显示' : '❌ 空白'} ${r.src} ${r.w}px  opacity=${r.opacity}`);
    console.log(`  错误提示条: ${r.errShown ? '⚠️ 显示了（说明回退失败）' : '未显示 ✅'}`);
    console.log(`  翻页后: ${r2.loaded ? '✅' : '❌'} ${r2.src}`);
    if (errs.length) console.log('  JS错误:', errs[0]);
    await ctx.close();
  }
  await b.close();
})();