const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const os = require('os');
const path = require('path');
const fs = require('fs');

async function test() {
  const port = 9345;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-test-'));
  const proc = spawn(chrome, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + tempDir, '--disable-gpu', '--no-first-run']);
  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://127.0.0.1:' + port + '/json/list');
  const pages = await res.json();
  const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise(res => {
    const cur = id++;
    const handler = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === cur) { ws.removeEventListener('message', handler); res(m.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
  await new Promise(r => ws.onopen = r);
  await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/events' });
  await new Promise(r => setTimeout(r, 2000));
  
  const evalRes = await send('Runtime.evaluate', {
    expression: `(function() {
      try {
        window.pages.selectTournament('prefectorial');
        return 'success';
      } catch(e) {
        return e.stack;
      }
    })()`,
    returnByValue: true
  });
  console.log('selectTournament result:', evalRes.result?.value);
  await new Promise(r => setTimeout(r, 1500));

  const isPref = await send('Runtime.evaluate', {
    expression: `({
      isPref: isPrefectorialCup(),
      headerBtn: document.querySelector('.jais-comp-switcher-btn')?.innerText,
      sidebarTitle: document.querySelector('#desktop-sidebar-left .jais-sidebar-card-title')?.innerText,
      pill: document.querySelector('.jais-fourhouse-pill')?.innerText,
      strip: document.querySelector('.jais-all-houses-strip')?.innerText
    })`,
    returnByValue: true
  });
  console.log('State after switch:', JSON.stringify(isPref.result?.value, null, 2));

  let shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(__dirname, 'verified_prefectship_clean_sidebar.png'), Buffer.from(shot.data, 'base64'));
  console.log("Saved verified_prefectship_clean_sidebar.png");

  ws.close();
  proc.kill();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
}

test();
