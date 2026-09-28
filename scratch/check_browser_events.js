const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function check() {
  const port = 9342;
  const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, '--disable-gpu', '--no-first-run']);
  await new Promise(r => setTimeout(r, 2000));
  try {
    const t = await (await fetch(`http://127.0.0.1:${port}/json/new?http://127.0.0.1:5055/%23/table`, { method: 'PUT' })).json();
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const evs = window.pages ? window.pages.getEvents() : [];
            return evs.filter(e => (e.name||'').toLowerCase().includes('football') || (e.id||'').includes('fb-')).map(e => ({
              id: e.id,
              name: e.name,
              stage: e.stage,
              matchday: e.matchday,
              contenders: e.contenders,
              results: e.results
            }));
          })()`,
          returnByValue: true
        }
      }));
    };
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id === 1) {
        console.log('Total football events found:', d.result.result.value.length);
        console.log(JSON.stringify(d.result.result.value, null, 2));
        proc.kill();
        process.exit(0);
      }
    };
  } catch (e) {
    console.error(e);
    proc.kill();
  }
}
check();
