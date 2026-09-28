const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const port = 9234;
  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', `chrome-test-desktop-${Date.now()}`);
  
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    `--user-data-dir=${tempProfile}`
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

    // Desktop dimensions
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log("Navigating to desktop index.html#/events...");
    await send("Page.navigate", { url: "http://127.0.0.1:8080/index.html#/events" });

    // Wait 4 seconds for full render
    await new Promise(r => setTimeout(r, 4000));

    const debug = await send("Runtime.evaluate", {
      expression: `({
        leftSidebarHtml: document.getElementById('desktop-sidebar-left')?.innerHTML?.slice(0, 300),
        eventsCount: window.currentEventsCache?.length,
        houses: window.currentHousesCache?.map(h => ({ name: h.name, g: h.goldCount, s: h.silverCount, b: h.bronzeCount }))
      })`,
      returnByValue: true
    });
    console.log("Debug State:", JSON.stringify(debug.result?.value, null, 2));

    const shotRes = await send("Page.captureScreenshot", {
      format: "png"
    });

    const dest = path.resolve('public', 'assets', 'stitch', 'test_desktop_view.png');
    fs.writeFileSync(dest, Buffer.from(shotRes.data, 'base64'));
    console.log("Saved test_desktop_view.png:", fs.statSync(dest).size, "bytes");

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    proc.kill();
    try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch (_) {}
  }
}

main();
