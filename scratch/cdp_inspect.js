const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const port = 9225;
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=C:\\Users\\festus\\AppData\\Local\\Temp\\chrome-debug-profile-3'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const pages = await listRes.json();
    console.log("Pages in Chrome:", pages.map(p => ({ title: p.title, type: p.type, url: p.url })));
    
    let target = pages.find(p => p.type === 'page');
    if (!target) {
      const newPageRes = await fetch(`http://127.0.0.1:${port}/json/new?http://127.0.0.1:8080/index.html?pin=ihechukwu#/table`, { method: 'PUT' });
      target = await newPageRes.json();
    }

    const wsUrl = target.webSocketDebuggerUrl;
    console.log("Connecting to target:", wsUrl);

    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === "Runtime.consoleAPICalled") {
        console.log(`[Browser Console ${msg.params.type}]:`, ...msg.params.args.map(a => a.value !== undefined ? a.value : a.description));
      } else if (msg.method === "Runtime.exceptionThrown") {
        console.error(`[Browser Exception]:`, msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
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
    await send("Console.enable");

    console.log("Navigating to http://127.0.0.1:8080/index.html?pin=ihechukwu#/table ...");
    await send("Page.navigate", { url: "http://127.0.0.1:8080/index.html?pin=ihechukwu#/table" });

    await new Promise(r => setTimeout(r, 4000));

    const evalRes = await send("Runtime.evaluate", {
      expression: `({
        url: window.location.href,
        hash: window.location.hash,
        activeScreen: document.querySelector('.page-screen.active')?.id,
        tableHtmlLength: document.getElementById('screen-table')?.innerHTML?.length,
        supportedHouse: localStorage.getItem('juilliard_supported_house'),
        housesCount: window.currentHousesCache?.length,
        eventsCount: window.currentEventsCache?.length
      })`,
      returnByValue: true
    });

    console.log("Page State:", evalRes.result?.value);
    ws.close();
  } catch (err) {
    console.error("Error:", err);
  } finally {
    proc.kill();
  }
}

main();
