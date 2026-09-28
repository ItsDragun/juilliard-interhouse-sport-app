const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const port = 9238;
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run'
  ]);

  await new Promise(r => setTimeout(r, 1500));

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

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise(r => ws.onopen = r);
    await send("Runtime.enable");
    await send("Page.enable");

    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log("Navigating to http://127.0.0.1:8080/index.html?pin=ihechukwu#/table ...");
    await send("Page.navigate", { url: "http://127.0.0.1:8080/index.html?pin=ihechukwu#/table" });
    await new Promise(r => setTimeout(r, 4000));

    const check = await send("Runtime.evaluate", {
      expression: `({
        url: window.location.href,
        hash: window.location.hash,
        activeScreen: document.querySelector('.page-screen.active')?.id,
        screenLen: document.getElementById('screen-table')?.innerHTML?.length,
        leftSidebarLen: document.getElementById('desktop-sidebar-left')?.innerHTML?.length
      })`,
      returnByValue: true
    });

    console.log("Inspection:\n", JSON.stringify(check.result?.value, null, 2));

    const shot = await send("Page.captureScreenshot", { format: "png" });
    const dest = path.resolve('public', 'assets', 'stitch', 'verified_desktop_table.png');
    fs.writeFileSync(dest, Buffer.from(shot.data, 'base64'));
    console.log("Saved verified_desktop_table.png:", fs.statSync(dest).size, "bytes");

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    proc.kill();
  }
}

main();
