const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkNewsAdmin() {
  const port = 9365;
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const pages = await listRes.json();
    let target = pages.find(p => p.type === 'page') || (await (await fetch(`http://127.0.0.1:${port}/json/new`, { method: 'PUT' })).json());
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let msgId = 1;
    const pending = new Map();
    ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
    await new Promise(r => ws.onopen = r);
    const send = (method, params = {}) => new Promise(res => { const id = msgId++; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'https://ja-mega-26.web.app/?pin=osaruyi#/news' });
    await new Promise(r => setTimeout(r, 4000));

    const headerEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('.jais-news-header-banner');
        return el ? el.outerHTML : 'none';
      })()`,
      returnByValue: true
    });
    console.log("Header Banner HTML:", headerEval?.result?.value);

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const imgPath = path.resolve(__dirname, 'current_news_admin_bug.png');
    fs.writeFileSync(imgPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot of desktop news page to:', imgPath);

    // Mobile viewport test
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 1000));
    const mobileShot = await send('Page.captureScreenshot', { format: 'png' });
    const mobileImgPath = path.resolve(__dirname, 'verified_news_admin_mobile.png');
    fs.writeFileSync(mobileImgPath, Buffer.from(mobileShot.data, 'base64'));
    console.log('Saved screenshot of mobile news page to:', mobileImgPath);
    ws.close();
  } finally {
    proc.kill();
  }
}

checkNewsAdmin().catch(console.error);
