const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('public', 'assets', 'stitch');

async function main() {
  const port = 9235;
  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', `chrome-desktop-full-${Date.now()}`);

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

    // Set desktop screen resolution matching user's monitor
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log("Navigating to http://127.0.0.1:8080/index.html?pin=ihechukwu#/events ...");
    await send("Page.navigate", { url: "http://127.0.0.1:8080/index.html?pin=ihechukwu#/events" });

    // Wait 3.5 seconds
    await new Promise(r => setTimeout(r, 3500));

    // Capture 1: Events page on Desktop
    const shot1 = await send("Page.captureScreenshot", { format: "png" });
    const dest1 = path.join(outDir, 'desktop_verified_01_events.png');
    fs.writeFileSync(dest1, Buffer.from(shot1.data, 'base64'));
    console.log("Saved desktop_verified_01_events.png:", fs.statSync(dest1).size, "bytes");

    // Navigate to Standings Table on Desktop
    console.log("Navigating to http://127.0.0.1:8080/index.html?pin=ihechukwu#/table ...");
    await send("Page.navigate", { url: "http://127.0.0.1:8080/index.html?pin=ihechukwu#/table" });
    await new Promise(r => setTimeout(r, 3000));

    const shot2 = await send("Page.captureScreenshot", { format: "png" });
    const dest2 = path.join(outDir, 'desktop_verified_02_table.png');
    fs.writeFileSync(dest2, Buffer.from(shot2.data, 'base64'));
    console.log("Saved desktop_verified_02_table.png:", fs.statSync(dest2).size, "bytes");

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    proc.kill();
    try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch (_) {}
  }
}

main();
