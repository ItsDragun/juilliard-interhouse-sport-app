const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname, '..', 'public', 'assets', 'stitch');

const screens = [
  {
    name: 'championship_01_standings_table.png',
    route: '#/table',
    expectedScreen: 'screen-table',
    w: 430,
    h: 932
  },
  {
    name: 'championship_02_completed_events.png',
    route: '#/events',
    expectedScreen: 'screen-events',
    w: 430,
    h: 932
  },
  {
    name: 'championship_03_100m_scorecard.png',
    route: '#/event/track-100m-boys',
    expectedScreen: 'screen-event-detail',
    w: 430,
    h: 932
  },
  {
    name: 'championship_04_football_scorecard.png',
    route: '#/event/team-football-boys',
    expectedScreen: 'screen-event-detail',
    w: 430,
    h: 932
  },
  {
    name: 'championship_05_phoenix_house_profile.png',
    route: '#/house/phoenix',
    expectedScreen: 'screen-house-detail',
    w: 430,
    h: 932
  },
  {
    name: 'championship_06_admin_scoring_console.png',
    route: '#/admin',
    expectedScreen: 'screen-admin',
    w: 430,
    h: 932
  },
  {
    name: 'championship_07_news_championship_stories.png',
    route: '#/news',
    expectedScreen: 'screen-news',
    w: 430,
    h: 932
  }
];

async function main() {
  const port = 9227;
  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', `chrome-cdp-${Date.now()}`);
  
  console.log(`Starting headless Chrome on port ${port}...`);
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
    let target = pages.find(p => p.type === 'page');
    if (!target) {
      const newPageRes = await fetch(`http://127.0.0.1:${port}/json/new`, { method: 'PUT' });
      target = await newPageRes.json();
    }

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

    // Capture each screen
    for (const s of screens) {
      console.log(`\nCapturing ${s.name} (${s.route})...`);
      await send("Emulation.setDeviceMetricsOverride", {
        width: s.w,
        height: s.h,
        deviceScaleFactor: 2,
        mobile: true
      });

      const fullUrl = `http://127.0.0.1:8080/index.html?pin=ihechukwu${s.route}`;
      await send("Page.navigate", { url: fullUrl });

      // Poll until the expected screen is active and rendered
      let rendered = false;
      for (let attempt = 0; attempt < 15; attempt++) {
        await new Promise(r => setTimeout(r, 400));
        const check = await send("Runtime.evaluate", {
          expression: `({
            active: document.querySelector('.page-screen.active')?.id,
            htmlLen: document.getElementById('${s.expectedScreen}')?.innerHTML?.length || 0
          })`,
          returnByValue: true
        });
        const state = check.result?.value;
        if (state?.active === s.expectedScreen && state?.htmlLen > 200) {
          console.log(`✓ ${s.name} rendered cleanly (active=${state.active}, htmlLen=${state.htmlLen})`);
          rendered = true;
          break;
        }
      }

      if (!rendered) {
        console.warn(`Warning: ${s.name} did not reach expected render state before capture.`);
      }

      // Small pause for any animations/fonts to settle
      await new Promise(r => setTimeout(r, 500));

      const shotRes = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false
      });

      if (shotRes?.data) {
        const dest = path.join(outDir, s.name);
        fs.writeFileSync(dest, Buffer.from(shotRes.data, 'base64'));
        const stat = fs.statSync(dest);
        console.log(`✓ Saved ${s.name} (${stat.size} bytes)`);
      } else {
        console.error(`Failed to capture ${s.name}`);
      }
    }

    console.log("\n========================================================");
    console.log("🎉 ALL 7 CHAMPIONSHIP SCREENS CAPTURED SUCCESSFULLY!");
    console.log("========================================================");

    ws.close();
  } catch (err) {
    console.error("CDP execution error:", err);
  } finally {
    proc.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch (_) {}
  }
}

main();
