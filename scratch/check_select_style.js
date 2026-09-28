const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkSelect() {
  const port = 9350;
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

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result);
        pending.delete(msg.id);
      }
    };

    await new Promise(r => ws.onopen = r);

    const send = (method, params = {}) => new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');

    await send('Page.navigate', { url: 'https://ja-mega-26.web.app/#/table' });
    await new Promise(r => setTimeout(r, 4000));

    const styles = await send('Runtime.evaluate', {
      expression: `(() => {
        const sel = document.querySelector('.jais-category-filter-select');
        const opts = Array.from(document.querySelectorAll('.jais-category-filter-select option'));
        const root = document.documentElement;
        return {
          selColorScheme: sel ? window.getComputedStyle(sel).colorScheme : null,
          rootColorScheme: window.getComputedStyle(root).colorScheme,
          options: opts.map(o => ({
            text: o.innerText,
            selected: o.selected,
            color: window.getComputedStyle(o).color,
            bg: window.getComputedStyle(o).backgroundColor
          }))
        };
      })()`,
      returnByValue: true
    });

    console.log("Computed styles on #/table select:", JSON.stringify(styles?.result?.value, null, 2));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const imgPath = require('path').resolve(__dirname, 'verified_dropdown_table.png');
    require('fs').writeFileSync(imgPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot to', imgPath);

    console.log("Computed styles on #/table select:", styles?.result?.value);
    ws.close();
  } finally {
    proc.kill();
  }
}

checkSelect().catch(console.error);
