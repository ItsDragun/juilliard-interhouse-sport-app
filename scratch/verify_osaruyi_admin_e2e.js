const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname);

async function runOsaruyiVerification() {
  const port = 9338;
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

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result);
        pending.delete(msg.id);
      }
    };

    await new Promise(r => ws.onopen = r);

    const send = (method, params = {}) => new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('1. Navigating to http://127.0.0.1:5055/ ...');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/' });
    await new Promise(r => setTimeout(r, 2500));

    // Evaluate auth checks
    const evalRes = await send('Runtime.evaluate', {
      expression: `(async () => {
        const auth = await import("./js/auth.js?v=20260926_osaruyi_admin_v1");
        const email = "osaruyiaideyan@gmail.com";
        const admin = auth.getVerifiedAdmin(email);
        const whitelisted = auth.isEmailWhitelisted(email);
        const permSuper = auth.isPermanentSuperAdmin(email);
        const all = auth.getRegisteredAdmins();
        return JSON.stringify({
          whitelisted,
          permSuper,
          admin,
          allAdmins: all.map(a => ({ id: a.id, name: a.name, email: a.email, role: a.role }))
        });
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    const authData = JSON.parse(evalRes?.result?.value || '{}');
    console.log('Auth Verification In Browser:', JSON.stringify(authData, null, 2));

    if (!authData.whitelisted) {
      throw new Error('FAILED: osaruyiaideyan@gmail.com is NOT whitelisted');
    }
    if (!authData.permSuper) {
      throw new Error('FAILED: osaruyiaideyan@gmail.com is NOT permanent super admin');
    }
    if (authData.admin?.id !== 'ADM-003') {
      throw new Error('FAILED: Expected ADM-003 but got ' + authData.admin?.id);
    }
    console.log('✅ In-browser Auth checks verified!');

    // Test 2: Navigate with ?pin=osaruyi#/admin
    console.log('2. Navigating to http://127.0.0.1:5055/?pin=osaruyi#/admin ...');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/?pin=osaruyi#/admin' });
    await new Promise(r => setTimeout(r, 2000));

    const sessionEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const raw = localStorage.getItem("juilliard_active_admin_session");
        return raw;
      })()`,
      returnByValue: true
    });
    console.log('Active Session:', sessionEval?.result?.value);
    const session = JSON.parse(sessionEval?.result?.value || '{}');
    if (session.email !== 'osaruyiaideyan@gmail.com' || session.id !== 'ADM-003') {
      throw new Error('FAILED: Session does not match osaruyiaideyan@gmail.com (ADM-003)');
    }
    console.log('✅ Active session correctly set for Osaruyi Aideyan (ADM-003)!');

    // Test 3: Check UI Admin page elements
    const pageTextEval = await send('Runtime.evaluate', {
      expression: `document.querySelector("#app-viewport")?.innerText?.substring(0, 400)`,
      returnByValue: true
    });
    console.log('Admin Page Viewport Snippet:\n', pageTextEval?.result?.value);

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const imgPath = path.join(outDir, 'verified_osaruyi_admin.png');
    fs.writeFileSync(imgPath, Buffer.from(shot.data, 'base64'));
    console.log(`✅ Saved screenshot to ${imgPath}`);

    // Copy to artifact directory for presentation
    const artifactPath = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\afb6558f-7764-4b08-be96-9a9f1ffc0e76\\verified_osaruyi_admin.png';
    fs.copyFileSync(imgPath, artifactPath);
    console.log(`✅ Copied screenshot to artifact directory: ${artifactPath}`);

    console.log('\n🎉 ALL TESTS PASSED! osaruyiaideyan@gmail.com is fully authorized as Super Administrator.');
    ws.close();
  } finally {
    proc.kill();
  }
}

runOsaruyiVerification().catch(e => {
  console.error('ERROR:', e);
  process.exit(1);
});
