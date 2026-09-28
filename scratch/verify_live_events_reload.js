const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('public', 'assets', 'stitch');

async function testEventsLive() {
  const port = 9265;
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

    console.log("Navigating to https://ja-mega-26.web.app/#/events ...");
    await send("Page.navigate", { url: "https://ja-mega-26.web.app/#/events" });
    await new Promise(r => setTimeout(r, 4000));

    console.log("Reloading https://ja-mega-26.web.app/#/events ...");
    await send("Page.reload");
    await new Promise(r => setTimeout(r, 4500));

    const check = await send("Runtime.evaluate", {
      expression: `({
        totalEvents: window.currentEventsCache?.length,
        doneCount: window.currentEventsCache?.filter(e => e.status === 'completed' || e.results)?.length,
        firstCardName: document.querySelector('.event-card .title, .event-fixture-card .title, h3')?.textContent?.trim(),
        firstCardStatus: document.querySelector('.status-badge-done, .event-status, .badge-completed')?.textContent?.trim()
      })`,
      returnByValue: true
    });
    console.log("[Live Events Reloaded State]:", JSON.stringify(check.result?.value));

    const shot = await send("Page.captureScreenshot", { format: "png" });
    const dest = path.join(outDir, 'live_events_reloaded_permanent.png');
    fs.writeFileSync(dest, Buffer.from(shot.data, 'base64'));
    console.log("Saved live events screenshot:", dest, fs.statSync(dest).size, "bytes");

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    proc.kill();
  }
}

testEventsLive();
