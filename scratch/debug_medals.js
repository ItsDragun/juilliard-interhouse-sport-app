const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const port = 9228;
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
      if (msg.method === "Runtime.consoleAPICalled") {
        console.log(`[Browser Console]:`, ...msg.params.args.map(a => a.value || a.description));
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

    await send("Page.navigate", { url: "http://127.0.0.1:8080/index.html?pin=ihechukwu#/table" });

    // Wait 5 seconds
    await new Promise(r => setTimeout(r, 5000));

    const evalRes = await send("Runtime.evaluate", {
      expression: `({
        eventsCount: window.currentEventsCache?.length,
        completedEventsCount: window.currentEventsCache?.filter(e => e.status === 'completed' || e.status === 'done')?.length,
        firstEventStatus: window.currentEventsCache?.[0]?.status,
        firstEventResults: window.currentEventsCache?.[0]?.results,
        houses: window.currentHousesCache?.map(h => ({ id: h.id, gold: h.goldCount, silver: h.silverCount, bronze: h.bronzeCount, total: (h.goldCount||0)+(h.silverCount||0)+(h.bronzeCount||0) }))
      })`,
      returnByValue: true
    });

    console.log("Evaluation Result:\n", JSON.stringify(evalRes.result?.value, null, 2));
    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    proc.kill();
  }
}

main();
