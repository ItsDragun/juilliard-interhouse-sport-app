const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const proc = spawn(chrome, ['--headless=new', '--remote-debugging-port=9337', '--disable-gpu']);
  await new Promise(r => setTimeout(r, 2000));
  const pages = await (await fetch('http://127.0.0.1:9337/json/list')).json();
  const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (m, p = {}) => new Promise(res => {
    const cur = id++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === cur) { ws.removeEventListener('message', handler); res(d.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  const loadPromise = new Promise(resolve => {
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Page.loadEventFired') {
        ws.removeEventListener('message', handler);
        resolve();
      }
    };
    ws.addEventListener('message', handler);
  });
  await send('Page.navigate', { url: 'https://ja-mega-26.web.app/#/competitions' });
  await loadPromise;
  await new Promise(r => setTimeout(r, 2000));
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const body = document.body.innerText;
      return {
        title: document.title,
        bodyHasPrefectship: body.includes('Prefectship Cup'),
        bodyHasPrefectorial: body.includes('Prefectorial Cup')
      };
    })()`,
    returnByValue: true
  });
  console.log('LIVE PRODUCTION CHECK:', res.result.value);
  ws.close();
  proc.kill();
})();
