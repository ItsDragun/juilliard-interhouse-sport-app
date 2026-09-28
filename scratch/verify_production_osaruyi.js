const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function verifyProduction() {
  const port = 9345;
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

    console.log('Navigating to production: https://ja-mega-26.web.app/?pin=osaruyi#/admin');
    await send('Page.navigate', { url: 'https://ja-mega-26.web.app/?pin=osaruyi#/admin' });
    await new Promise(r => setTimeout(r, 3500));

    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        const raw = localStorage.getItem("juilliard_active_admin_session");
        const session = raw ? JSON.parse(raw) : null;
        const pageText = document.querySelector("#app-viewport")?.innerText?.substring(0, 300);
        return JSON.stringify({ session, pageText });
      })()`,
      returnByValue: true
    });

    const res = JSON.parse(check?.result?.value || '{}');
    console.log('Production Result:', JSON.stringify(res, null, 2));

    if (res.session?.email !== 'osaruyiaideyan@gmail.com') {
      throw new Error('Production verification failed: session email is ' + res.session?.email);
    }
    console.log('🎉 Production verified successfully!');
    ws.close();
  } finally {
    proc.kill();
  }
}

verifyProduction().catch(console.error);
