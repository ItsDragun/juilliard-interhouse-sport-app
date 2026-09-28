const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const os = require('os');
const path = require('path');

(async () => {
  const tmpDir = path.join(os.tmpdir(), 'chrome_debug_err_' + Date.now());
  const proc = spawn(chrome, ['--headless=new', '--remote-debugging-port=9339', '--disable-gpu', `--user-data-dir=${tmpDir}`]);
  await new Promise(r => setTimeout(r, 1500));
  const pages = await (await fetch('http://127.0.0.1:9339/json/list')).json();
  const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  const errors = [];
  ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.method === 'Runtime.exceptionThrown') {
      errors.push(d.params.exceptionDetails);
    }
    if (d.method === 'Runtime.consoleAPICalled') {
      errors.push({ console: d.params.type, args: d.params.args });
    }
  };

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
  await new Promise(r => setTimeout(r, 4000));

  const pageState = await send('Runtime.evaluate', {
    expression: '({ readyState: document.readyState, hasPages: !!window.pages, title: document.title })',
    returnByValue: true
  });
  console.log('PAGE STATE:', JSON.stringify(pageState.result.result.value));

  console.log('ERRORS DETECTED:', JSON.stringify(errors, null, 2));

  ws.close();
  proc.kill();
})();
