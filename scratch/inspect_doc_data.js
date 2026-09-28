const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const port = 9232;
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

    await send("Page.navigate", { url: "http://127.0.0.1:8080/index.html" });
    await new Promise(r => setTimeout(r, 3000));

    const evalRes = await send("Runtime.evaluate", {
      expression: `new Promise((resolve) => {
        const db = window.firebase.firestore();
        db.collection("events").doc("track-100m-boys").get()
          .then(doc => {
            resolve({ exists: doc.exists, data: doc.data() });
          })
          .catch(err => resolve({ error: err.message }));
      })`,
      awaitPromise: true,
      returnByValue: true
    });

    console.log("Firestore doc data for track-100m-boys:\n", JSON.stringify(evalRes.result?.value, null, 2));
    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    proc.kill();
  }
}

main();
