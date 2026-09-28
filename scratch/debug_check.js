const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const os = require('os');
  const path = require('path');
  const tmpDir = path.join(os.tmpdir(), 'chrome_debug_' + Date.now());
  const proc = spawn(chrome, ['--headless=new', '--remote-debugging-port=9338', '--disable-gpu', `--user-data-dir=${tmpDir}`]);
  await new Promise(r => setTimeout(r, 1500));
  const pages = await (await fetch('http://127.0.0.1:9338/json/list')).json();
  const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (m, p={}) => new Promise(r => {
    const cur = id++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === cur) { ws.removeEventListener('message', handler); r(d); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/onboarding' });
  await new Promise(r => setTimeout(r, 2000));
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      try {
        window.pages.onboardingChooseTournament('interhouse');
        const inp = document.getElementById("onboarding-user-name");
        return {
          hasNameInput: !!inp,
          val: inp ? inp.value : null
        };
      } catch(e) {
        return { error: e.message, stack: e.stack };
      }
    })()`,
    returnByValue: true
  });
  console.log('EVAL RESULT:', JSON.stringify(res, null, 2));
  ws.close();
  proc.kill();
})();
