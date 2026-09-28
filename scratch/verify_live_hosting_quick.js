const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testLive() {
  const port = 9345;
  const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, '--disable-gpu', '--no-first-run']);
  await new Promise(r => setTimeout(r, 2000));
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    let target = list.find(p => p.type === 'page') || (await (await fetch(`http://127.0.0.1:${port}/json/new`, { method: 'PUT' })).json());
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let id = 1;
    function send(m, p = {}) {
      return new Promise(res => {
        const myId = id++;
        const fn = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === myId) { ws.removeEventListener('message', fn); res(d.result); }
        };
        ws.addEventListener('message', fn);
        ws.send(JSON.stringify({ id: myId, method: m, params: p }));
      });
    }
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'https://ja-mega-26.web.app/#/events' });
    await new Promise(r => setTimeout(r, 4500));
    const res = await send('Runtime.evaluate', {
      expression: `({
        url: window.location.href,
        title: document.title,
        onboarding: document.body.innerText.includes('Welcome') || document.body.innerText.includes('Tournament') || document.body.innerText.includes('Prefectorial'),
        headerBtn: document.querySelector('.jais-comp-switcher-btn')?.textContent?.trim()
      })`,
      returnByValue: true
    });
    console.log('LIVE HOSTING CHECK:', JSON.stringify(res.result?.value, null, 2));
    ws.close();
  } finally {
    proc.kill();
  }
}
testLive();
