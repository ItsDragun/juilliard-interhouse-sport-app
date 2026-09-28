const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const port = 9231;
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

    await send("Page.navigate", { url: "http://127.0.0.1:8080/index.html" });

    // Wait 3 seconds
    await new Promise(r => setTimeout(r, 3000));

    // Test onSnapshot specifically
    const evalRes = await send("Runtime.evaluate", {
      expression: `new Promise((resolve) => {
        const db = window.firebase.firestore();
        console.log("Setting up test onSnapshot for events...");
        const unsub = db.collection("events").onSnapshot(
          (snap) => {
            console.log("TEST onSnapshot FIRED with docs:", snap.size, "fromCache:", snap.metadata.fromCache);
            resolve({ fired: true, size: snap.size, fromCache: snap.metadata.fromCache });
            unsub();
          },
          (err) => {
            console.error("TEST onSnapshot ERROR:", err.message);
            resolve({ fired: false, error: err.message });
          }
        );
        setTimeout(() => {
          resolve({ fired: false, timeout: true });
        }, 6000);
      })`,
      awaitPromise: true,
      returnByValue: true
    });

    console.log("onSnapshot Test Result:", evalRes.result?.value);
    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    proc.kill();
  }
}

main();
