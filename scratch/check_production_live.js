const { spawn } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkProd() {
  const port = 9362;
  const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, '--disable-gpu', '--no-first-run']);
  await new Promise(r => setTimeout(r, 2000));
  try {
    const t = await (await fetch(`http://127.0.0.1:${port}/json/new?https://ja-mega-26.web.app/?admin=osaruyi%23/table`, { method: 'PUT' })).json();
    const ws = new WebSocket(t.webSocketDebuggerUrl);

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
    await send('Page.enable');
    await send('Runtime.enable');

    await new Promise(r => setTimeout(r, 3500));

    await send('Runtime.evaluate', {
      expression: `window.pages.setActiveCompetition('interhouse')`
    });
    await new Promise(r => setTimeout(r, 1000));

    await send('Runtime.evaluate', {
      expression: `window.pages.setTableCategoryFilter('football')`
    });
    await new Promise(r => setTimeout(r, 1000));

    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const rows = Array.from(document.querySelectorAll('.jais-table-data-row.football-mode')).map(row => {
          return Array.from(row.querySelectorAll('.jais-col-medal, .jais-team-name-text')).map(c => c.innerText.trim());
        });
        const matchCards = document.querySelectorAll('.jais-bracket-match-card').length;
        const matchdays = document.querySelectorAll('.jais-matchday-group').length;
        return {
          rows,
          matchCards,
          matchdays
        };
      })()`,
      returnByValue: true
    });

    console.log('Production Football verification result:', JSON.stringify(res.result.value, null, 2));
    proc.kill();
  } catch (e) {
    console.error(e);
    proc.kill();
  }
}
checkProd();
