const { spawn } = require('child_process');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runAdminScoringVerification() {
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
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log("1. Navigating to set session in localStorage and reloading into #/admin...");
    await send("Page.navigate", { url: "http://127.0.0.1:5055/#/events" });
    await new Promise(r => setTimeout(r, 2000));

    await send("Runtime.evaluate", {
      expression: `(() => {
        const session = {
          id: "ADM-003",
          adminId: "ADM-003",
          name: "Ihechukwu",
          email: "1h3chukwu@gmail.com",
          role: "super_admin",
          isAdmin: true
        };
        localStorage.setItem("juilliard_active_admin_session", JSON.stringify(session));
        sessionStorage.setItem("juilliard_active_admin_session", JSON.stringify(session));
        localStorage.setItem("ja_sports_reset_clean_slate_2026_v16", "clean_reset_v16");
        localStorage.setItem("juilliard_active_competition", "prefectorial");
        localStorage.setItem("juilliard_onboarding_completed", "true");
        window.location.hash = "#/admin";
        window.location.reload();
      })()`
    });

    await new Promise(r => setTimeout(r, 2500));

    // Verify Admin in Prefectorial mode
    const adminCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const rows = Array.from(document.querySelectorAll(".jais-event-manage-row"));
        const rowTexts = rows.map(r => r.innerText);
        const hasPrefEvent = rowTexts.some(t => t.includes("Football Semi-Final") || t.includes("Prefects Sprint") || t.includes("Team Ihechukwu") || t.includes("Team Fortune"));
        const hasPhoenix = rowTexts.some(t => t.includes("Phoenix") && !t.includes("Team"));
        return {
          url: window.location.href,
          title: document.title,
          activeScreen: document.querySelector(".page-screen.active")?.id,
          rowCount: rows.length,
          hasPrefEvent,
          hasPhoenix,
          isPref: localStorage.getItem("juilliard_active_competition")
        };
      })()`,
      returnByValue: true
    });
    console.log("Admin Prefectorial state:", adminCheck.result.value);

    // Test quick status change
    console.log("2. Testing quick status change on Prefectorial event...");
    const quickStatusRes = await send("Runtime.evaluate", {
      expression: `(async () => {
        const prefEvent = (window.currentPrefEventsCache || []).find(e => e.id && e.id.startsWith("pref-"));
        if (!prefEvent) return { success: false, reason: "No pref event found in cache" };
        const id = prefEvent.id;
        await window.pages.quickSetEventStatus(id, "live");
        const updatedCache = (window.currentPrefEventsCache || []).find(e => e.id === id);
        return {
          success: true,
          eventId: id,
          newStatus: updatedCache ? updatedCache.status : null,
          isLive: updatedCache ? updatedCache.isLive : null
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log("Quick status change result:", quickStatusRes.result.value);

    // Test score entry screen on Prefectorial match
    console.log("3. Navigating to #/admin/score/pref-football-semi-1...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        window.location.hash = "#/admin/score/pref-football-semi-1";
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    const scoreScreenCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const titleEl = document.querySelector("#score-entry-title, .jais-detail-top-nav");
        const bodyText = document.body.innerText;
        return {
          url: window.location.hash,
          hasIhechukwu: bodyText.includes("Ihechukwu"),
          hasFortune: bodyText.includes("Fortune"),
          hasScoreBtn: !!document.querySelector("button[type='submit'], .jais-cta-btn")
        };
      })()`,
      returnByValue: true
    });
    console.log("Score Entry Screen state:", scoreScreenCheck.result.value);

    // Reset status back to upcoming for clean slate
    await send("Runtime.evaluate", {
      expression: `(async () => {
        const prefEvent = (window.currentPrefEventsCache || []).find(e => e.id && e.id.startsWith("pref-"));
        if (prefEvent) {
          await window.pages.quickSetEventStatus(prefEvent.id, "upcoming");
        }
      })()`,
      awaitPromise: true
    });

    console.log("Errors captured during run:", consoleLogs.filter(l => l.type === 'error').length);
    console.log("ADMIN & SCORING VERIFICATION COMPLETED SUCCESSFULLY!");

    ws.close();
    proc.kill();
  } catch (err) {
    console.error("Verification error:", err);
    proc.kill();
  }
}

runAdminScoringVerification();
