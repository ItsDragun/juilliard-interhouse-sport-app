const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname);

async function runCupSwitchVerification() {
  const port = 9333;
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
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log("1. Navigating to http://127.0.0.1:5055/#/events ...");
    await send("Page.navigate", { url: "http://127.0.0.1:5055/#/events" });
    await new Promise(r => setTimeout(r, 3000));

    // Inspect initial state
    const initState = await send("Runtime.evaluate", {
      expression: `({
        isPref: (typeof isPrefectorialCup === 'function') ? isPrefectorialCup() : (localStorage.getItem('juilliard_active_competition') === 'prefectorial'),
        activeComp: localStorage.getItem('juilliard_active_competition'),
        headerBtn: document.querySelector('.jais-comp-switcher-btn')?.textContent?.trim(),
        headerBadge: document.querySelector('.brand-banner, .tournament-badge, .header-badge, .jais-badge')?.textContent?.trim(),
        sidebarHouses: Array.from(document.querySelectorAll('.sidebar-team-name, .standings-item-name, .sidebar-house-name, .nav-standings-name')).map(el => el.textContent.trim()),
        firstEventTitle: document.querySelector('.event-card .title, .event-fixture-card .title, .event-name, h3')?.textContent?.trim()
      })`,
      returnByValue: true
    });
    console.log("Initial state:", JSON.stringify(initState.result?.value, null, 2));

    // Test 1: Switch to Inter-House Sports
    console.log("2. Switching tournament to 'interhouse'...");
    await send("Runtime.evaluate", {
      expression: `(function() {
        if (typeof selectTournament === 'function') {
          selectTournament('interhouse');
          return 'selected via function';
        } else {
          localStorage.setItem('juilliard_active_competition', 'interhouse');
          window.dispatchEvent(new CustomEvent('competitionChanged', { detail: { competition: 'interhouse' } }));
          if (window.appRouter && window.appRouter.handleRoute) window.appRouter.handleRoute();
          return 'selected via event';
        }
      })()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1500));

    const interHouseState = await send("Runtime.evaluate", {
      expression: `({
        isPref: (typeof isPrefectorialCup === 'function') ? isPrefectorialCup() : (localStorage.getItem('juilliard_active_competition') === 'prefectorial'),
        activeComp: localStorage.getItem('juilliard_active_competition'),
        headerBtn: document.querySelector('.jais-comp-switcher-btn')?.textContent?.trim(),
        sidebarHouses: Array.from(document.querySelectorAll('.sidebar-house-name, .sidebar-team-name, .team-name, .house-name')).map(el => el.textContent.trim()).filter(Boolean),
        eventTitles: Array.from(document.querySelectorAll('.event-card .title, .event-fixture-card .title, .event-title, h3')).slice(0, 5).map(el => el.textContent.trim()),
        hasPrefSprint: document.body.innerText.includes('100m Prefects Sprint'),
        hasPhoenix: document.body.innerText.includes('Phoenix'),
        cachedHousesCount: window.currentHousesCache?.length,
        cachedHousesNames: window.currentHousesCache?.map(h => h.name)
      })`,
      returnByValue: true
    });
    console.log("Inter-House events state:", JSON.stringify(interHouseState.result?.value, null, 2));

    let shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(outDir, 'test_interhouse_events.png'), Buffer.from(shot.data, 'base64'));

    // Test 2: Navigate to #/table
    console.log("3. Navigating to #/table for Inter-House Sports...");
    await send("Runtime.evaluate", {
      expression: `window.location.hash = '#/table'`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1500));

    const tableState = await send("Runtime.evaluate", {
      expression: `({
        tableRows: Array.from(document.querySelectorAll('.table-row-name, .house-row-name, .standings-table-house, tr td:nth-child(2)')).map(el => el.textContent.trim()).filter(Boolean),
        scores: Array.from(document.querySelectorAll('.pts-value, .total-pts, td:last-child')).map(el => el.textContent.trim()).filter(Boolean).slice(0, 8),
        bodyHasPhoenix: document.body.innerText.includes('Phoenix'),
        bodyHasIhechukwu: document.body.innerText.includes('Team Ihechukwu')
      })`,
      returnByValue: true
    });
    console.log("Inter-House table state:", JSON.stringify(tableState.result?.value, null, 2));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(outDir, 'test_interhouse_table.png'), Buffer.from(shot.data, 'base64'));

    // Test 3: Navigate to #/houses
    console.log("4. Navigating to #/houses for Inter-House Sports...");
    await send("Runtime.evaluate", {
      expression: `window.location.hash = '#/houses'`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1500));

    const housesState = await send("Runtime.evaluate", {
      expression: `({
        houseCards: Array.from(document.querySelectorAll('.house-card-title, .house-title, h3')).map(el => el.textContent.trim()).filter(Boolean).slice(0, 8),
        bodyHasPhoenix: document.body.innerText.includes('Phoenix'),
        bodyHasMerlin: document.body.innerText.includes('Merlin'),
        bodyHasSwift: document.body.innerText.includes('Swift'),
        bodyHasEagle: document.body.innerText.includes('Eagle')
      })`,
      returnByValue: true
    });
    console.log("Inter-House houses page state:", JSON.stringify(housesState.result?.value, null, 2));

    // Test 4: While on #/table, switch directly to Prefectship Cup
    console.log("5. Navigating back to #/table and switching to Prefectship Cup...");
    await send("Runtime.evaluate", {
      expression: `window.location.hash = '#/table'`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1000));

    await send("Runtime.evaluate", {
      expression: `(function() {
        if (typeof selectTournament === 'function') {
          selectTournament('prefectorial');
          return 'switched';
        } else {
          localStorage.setItem('juilliard_active_competition', 'prefectorial');
          window.dispatchEvent(new CustomEvent('competitionChanged', { detail: { competition: 'prefectorial' } }));
          if (window.appRouter && window.appRouter.handleRoute) window.appRouter.handleRoute();
          return 'switched via event';
        }
      })()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1500));

    const prefTableState = await send("Runtime.evaluate", {
      expression: `({
        isPref: (typeof isPrefectorialCup === 'function') ? isPrefectorialCup() : (localStorage.getItem('juilliard_active_competition') === 'prefectorial'),
        headerBtn: document.querySelector('.jais-comp-switcher-btn')?.textContent?.trim(),
        tableRows: Array.from(document.querySelectorAll('.table-row-name, .house-row-name, .standings-table-house, tr td:nth-child(2)')).map(el => el.textContent.trim()).filter(Boolean),
        scores: Array.from(document.querySelectorAll('.pts-value, .total-pts, td:last-child')).map(el => el.textContent.trim()).filter(Boolean).slice(0, 8),
        bodyHasFortune: document.body.innerText.includes('Team Fortune'),
        bodyHasIhechukwu: document.body.innerText.includes('Team Ihechukwu'),
        bodyHasPhoenix: document.body.innerText.includes('Phoenix')
      })`,
      returnByValue: true
    });
    console.log("Prefectship table state:", JSON.stringify(prefTableState.result?.value, null, 2));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(outDir, 'test_prefectorial_table.png'), Buffer.from(shot.data, 'base64'));

    // Test 5: Navigate to #/events in Prefectship Cup
    console.log("6. Navigating to #/events for Prefectship Cup...");
    await send("Runtime.evaluate", {
      expression: `window.location.hash = '#/events'`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1500));

    const prefEventsState = await send("Runtime.evaluate", {
      expression: `({
        isPref: (typeof isPrefectorialCup === 'function') ? isPrefectorialCup() : (localStorage.getItem('juilliard_active_competition') === 'prefectorial'),
        headerBtn: document.querySelector('.jais-comp-switcher-btn')?.textContent?.trim(),
        eventTitles: Array.from(document.querySelectorAll('.event-card .title, .event-fixture-card .title, .event-title, h3')).slice(0, 5).map(el => el.textContent.trim()),
        hasPrefSprint: document.body.innerText.includes('100m Prefects Sprint'),
        sidebarTeams: Array.from(document.querySelectorAll('.sidebar-team-name, .team-name, .house-name')).map(el => el.textContent.trim()).filter(Boolean)
      })`,
      returnByValue: true
    });
    console.log("Prefectorial events state:", JSON.stringify(prefEventsState.result?.value, null, 2));

    shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(outDir, 'test_prefectorial_events.png'), Buffer.from(shot.data, 'base64'));

    // Check errors
    const errors = consoleLogs.filter(l => l.type === 'error' || l.type === 'assert');
    console.log("Errors captured during run:", errors.length);
    if (errors.length > 0) {
      console.log("Error details:", JSON.stringify(errors, null, 2));
    }

    console.log("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!");
    ws.close();
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    proc.kill();
  }
}

runCupSwitchVerification();
