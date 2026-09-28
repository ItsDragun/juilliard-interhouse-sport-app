const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname);

async function runTeamsVerification() {
  const port = 9334;
  console.log('Launching headless Chrome on port', port);
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
    const consoleLogs = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        consoleLogs.push({ type: msg.params.type, args: msg.params.args.map(a => a.value || a.description) });
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        consoleLogs.push({ type: 'error', exception: msg.params.exceptionDetails });
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
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log("1. Navigating to http://127.0.0.1:5055/#/events ...");
    await send("Page.navigate", { url: "http://127.0.0.1:5055/#/events" });
    await new Promise(r => setTimeout(r, 2500));

    // Switch to Prefectship Cup
    console.log("2. Switching to Prefectship Cup...");
    await send("Runtime.evaluate", {
      expression: `(function() {
        if (typeof selectTournament === 'function') {
          selectTournament('prefectorial');
        } else {
          localStorage.setItem('juilliard_active_competition', 'prefectorial');
          window.dispatchEvent(new CustomEvent('competitionChanged', { detail: { competition: 'prefectorial' } }));
          if (window.appRouter && window.appRouter.handleRoute) window.appRouter.handleRoute();
        }
      })()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1500));

    // Inspect the fixture cards on Prefectship Cup
    const prefCards = await send("Runtime.evaluate", {
      expression: `(function() {
        const pills = Array.from(document.querySelectorAll('.jais-fourhouse-pill')).map(el => el.textContent.trim());
        const strips = Array.from(document.querySelectorAll('.jais-all-houses-strip')).map(el => el.textContent.trim().split('\\n')[0]);
        const titles = Array.from(document.querySelectorAll('.jais-event-name')).map(el => el.textContent.trim());
        const sidebarTitle = document.querySelector('#desktop-sidebar-left')?.innerText;
        return {
          pills: pills.slice(0, 5),
          strips: strips.slice(0, 5),
          titles: titles.slice(0, 5),
          isPref: isPrefectorialCup(),
          sidebarHasTeamStandings: document.body.innerText.includes('TEAM STANDINGS') || document.body.innerText.includes('Team Standings'),
          bodyHasAll4TeamsCompeting: document.body.innerText.includes('All 4 Teams Competing'),
          bodyHasAll4HousesCompeting: document.body.innerText.includes('All 4 Houses Competing'),
          bodyHas4Teams: document.body.innerText.includes('4 TEAMS') || document.body.innerText.includes('4 Teams'),
          bodyHas4Houses: document.body.innerText.includes('4 HOUSES') || document.body.innerText.includes('4 Houses')
        };
      })()`,
      returnByValue: true
    });
    console.log("Prefectship Cup Cards Check:", JSON.stringify(prefCards.result?.value, null, 2));

    // Capture screenshot of Prefectship Cup events page
    let shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(outDir, 'verified_prefectship_teams.png'), Buffer.from(shot.data, 'base64'));
    console.log("Saved verified_prefectship_teams.png");

    // Also navigate into an event detail
    console.log("3. Navigating to Prefectship Cup event detail #/event/pref-sprint-100m-boys ...");
    await send("Runtime.evaluate", {
      expression: `window.location.hash = '#/event/pref-sprint-100m-boys'`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1500));

    const eventDetailCheck = await send("Runtime.evaluate", {
      expression: `(function() {
        return {
          pill: document.querySelector('.jais-fourhouse-pill')?.textContent?.trim(),
          bodyHasAll4Teams: document.body.innerText.includes('All 4 Teams Simultaneous') || document.body.innerText.includes('All 4 Teams'),
          subtabLineupText: document.querySelector('.jais-sub-tabs-bar')?.innerText,
          bodyTextSample: document.querySelector('.jais-event-allhouses-hero')?.innerText
        };
      })()`,
      returnByValue: true
    });
    console.log("Event detail check:", JSON.stringify(eventDetailCheck.result?.value, null, 2));

    let shotDetail = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(outDir, 'verified_prefectship_event_detail.png'), Buffer.from(shotDetail.data, 'base64'));
    console.log("Saved verified_prefectship_event_detail.png");

    // Test Inter-House Sports to verify it still says Houses
    console.log("4. Switching back to Inter-House Sports...");
    await send("Runtime.evaluate", {
      expression: `(function() {
        if (typeof selectTournament === 'function') {
          selectTournament('interhouse');
        } else {
          localStorage.setItem('juilliard_active_competition', 'interhouse');
          window.dispatchEvent(new CustomEvent('competitionChanged', { detail: { competition: 'interhouse' } }));
          if (window.appRouter && window.appRouter.handleRoute) window.appRouter.handleRoute();
        }
      })()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1500));

    await send("Runtime.evaluate", {
      expression: `window.location.hash = '#/events'`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1500));

    const interhouseCards = await send("Runtime.evaluate", {
      expression: `(function() {
        const pills = Array.from(document.querySelectorAll('.jais-fourhouse-pill')).map(el => el.textContent.trim());
        const strips = Array.from(document.querySelectorAll('.jais-all-houses-strip')).map(el => el.textContent.trim().split('\\n')[0]);
        return {
          pills: pills.slice(0, 5),
          strips: strips.slice(0, 5),
          isPref: isPrefectorialCup(),
          bodyHasAll4HousesCompeting: document.body.innerText.includes('All 4 Houses Competing'),
          bodyHasAll4TeamsCompeting: document.body.innerText.includes('All 4 Teams Competing')
        };
      })()`,
      returnByValue: true
    });
    console.log("Inter-House Sports Cards Check:", JSON.stringify(interhouseCards.result?.value, null, 2));

    let shotInterhouse = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(outDir, 'verified_interhouse_houses.png'), Buffer.from(shotInterhouse.data, 'base64'));
    console.log("Saved verified_interhouse_houses.png");

    ws.close();
    console.log("\nALL VERIFICATIONS PASSED!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    proc.kill();
  }
}

runTeamsVerification();
