const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('public', 'assets', 'stitch');

async function testLive() {
  const port = 9260;
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
      if (msg.method === "Runtime.consoleAPICalled") {
        console.log(`[Browser Console]:`, ...msg.params.args.map(a => a.value !== undefined ? a.value : (a.description || '')));
      }
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

    console.log("Navigating to https://ja-mega-26.web.app/#/table ...");
    await send("Page.navigate", { url: "https://ja-mega-26.web.app/#/table" });

    for (let sec = 1; sec <= 8; sec++) {
      await new Promise(r => setTimeout(r, 1000));
      const res = await send("Runtime.evaluate", {
        expression: `({
          t: ${sec},
          phoenixGold: window.currentHousesCache?.find(h => h.id === 'phoenix')?.goldCount,
          phoenixMedals: window.currentHousesCache?.find(h => h.id === 'phoenix')?.totalMedals,
          eventsTotal: window.currentEventsCache?.length,
          completedEvents: window.currentEventsCache?.filter(e => e.status === 'completed' || e.results)?.length
        })`,
        returnByValue: true
      });
      console.log(`[Live Load ${sec}s]`, JSON.stringify(res.result?.value));
    }

    console.log("\nReloading https://ja-mega-26.web.app/#/table ...");
    await send("Page.reload");

    for (let sec = 1; sec <= 10; sec++) {
      await new Promise(r => setTimeout(r, 1000));
      const res = await send("Runtime.evaluate", {
        expression: `({
          t: ${sec},
          phoenixGold: window.currentHousesCache?.find(h => h.id === 'phoenix')?.goldCount,
          phoenixMedals: window.currentHousesCache?.find(h => h.id === 'phoenix')?.totalMedals,
          eventsTotal: window.currentEventsCache?.length,
          completedEvents: window.currentEventsCache?.filter(e => e.status === 'completed' || e.results)?.length
        })`,
        returnByValue: true
      });
      console.log(`[Live Reload ${sec}s]`, JSON.stringify(res.result?.value));
    }

    // Capture screenshot to prove permanence
    const shot = await send("Page.captureScreenshot", { format: "png" });
    const dest = path.join(outDir, 'live_championship_reloaded_permanent.png');
    fs.writeFileSync(dest, Buffer.from(shot.data, 'base64'));
    console.log("Saved screenshot:", dest, fs.statSync(dest).size, "bytes");

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    proc.kill();
  }
}

testLive();
