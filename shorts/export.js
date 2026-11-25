// 株ノートNOBIRU ショート動画 書き出しスクリプト
//   node export.js                  -> frames/ に600枚PNG → nobiru_short_20s.mp4
//   node export.js --stills 1,4,8   -> 指定秒のPNGだけ stills/ に出力 (確認用)
//   node export.js --guides ...     -> セーフエリアのガイドを重ねる (確認用)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');           // リポジトリルート (素材参照用)
const FPS = 30, DUR = 20, N = FPS * DUR;
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const flag = k => args.includes('--' + k);
const WORKERS = +opt('workers', 3);
const guides = flag('guides');
const stills = opt('stills', null);

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/shorts/nobiru_short.html${guides ? '?guides=1' : ''}`;
  const browser = await chromium.launch();
  const mkPage = async () => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => { console.error('PAGEERROR', e); process.exit(1); });
    page.on('requestfailed', r => console.error('REQFAIL', r.url()));
    await page.goto(url);
    await page.evaluate(() => window.ready);
    return page;
  };

  if (stills) {
    const out = path.join(__dirname, 'stills'); fs.mkdirSync(out, { recursive: true });
    const page = await mkPage();
    for (const t of stills.split(',').map(Number)) {
      await page.evaluate(t => window.setTime(t), t);
      await page.screenshot({ path: path.join(out, `t${String(t).replace('.', '_')}${guides ? '_guides' : ''}.png`) });
    }
    await browser.close(); server.close(); return;
  }

  const frames = path.join(__dirname, 'frames'); fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames);
  let done = 0;
  await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
    const page = await mkPage();
    for (let i = w; i < N; i += WORKERS) {
      await page.evaluate(t => window.setTime(t), i / FPS);
      await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`) });
      if (++done % 60 === 0) console.log(`${done}/${N}`);
    }
  }));
  await browser.close(); server.close();

  const mp4 = path.join(__dirname, 'nobiru_short_20s.mp4');
  const r = spawnSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(frames, 'f%04d.png'),
    '-vf', 'scale=1080:1920:out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '14', '-r', String(FPS),
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart', '-an', mp4], { stdio: 'inherit' });
  process.exit(r.status);
})();
