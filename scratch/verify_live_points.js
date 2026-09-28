const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const path = require('path');
const outDir = path.resolve(__dirname);
const port = 9338;
const userDataDir = path.join(outDir, '.chrome_test_profile_' + Date.now());
const proc = spawn(chrome, [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--user-data-dir=' + userDataDir,
  '--disable-gpu',
  '--no-first-run'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:' + port + '/json/list');
    const pages = await listRes.json();
    let target = pages.find(p => p.type === 'page') || (await (await fetch('http://127.0.0.1:' + port + '/json/new', { method: 'PUT' })).json());
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let msgId = 1;
    const pending = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result);
        pending.delete(msg.id);
      }
    };
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }
    await new Promise(r => { ws.onopen = r; });
    await send('Page.enable');
    await send('Runtime.enable');
    console.log('Navigating to live production URL...');
    await send('Page.navigate', { url: 'https://ja-mega-26.web.app/#/athlete/stu-038' });
    await new Promise(r => setTimeout(r, 4500));
    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.jais-athlete-history-card'));
        return cards.map(c => {
          const title = c.querySelector('div > div:first-child')?.textContent?.trim() || '';
          const badge = c.querySelector('div:last-child')?.textContent?.trim() || '';
          return { title, badge };
        });
      })()`,
      returnByValue: true
    });
    console.log('Live Athlete History Items:');
    (evalRes.result?.value || []).forEach(item => {
      console.log(' -', item.title, ':', JSON.stringify(item.badge));
    });
    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    proc.kill();
  }
}, 2500);
