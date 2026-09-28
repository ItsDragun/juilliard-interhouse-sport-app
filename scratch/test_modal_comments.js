const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\afb6558f-7764-4b08-be96-9a9f1ffc0e76';

async function testModalComments() {
  const port = 9345;
  const tmpDir = path.join(os.tmpdir(), 'chrome_modal_test_' + Date.now());
  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--disable-extensions',
    `--user-data-dir=${tmpDir}`
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?http://127.0.0.1:5055/#/news`, { method: 'PUT' })).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const send = (m, p={}) => new Promise(r => {
      const cur = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === cur) { ws.removeEventListener('message', handler); r(d); }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1200,
      height: 960,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/onboarding' });
    await new Promise(r => setTimeout(r, 1500));

    // Setup supporter preferences and render news page directly
    const evalRes = await send('Runtime.evaluate', {
      expression: `(async () => {
        // Wait for modules to initialize
        await new Promise(resolve => {
          const check = () => {
            if (window.pages && typeof window.pages.renderNewsPage === 'function') resolve();
            else setTimeout(check, 100);
          };
          check();
        });

        localStorage.setItem("juilliard_active_competition", "interhouse");
        localStorage.setItem("juilliard_supported_house", "phoenix");
        localStorage.setItem("jais_user_name", "Chinedu M.");

        // Render the news page
        window.pages.renderNewsPage();

        let items = window.pages.getNewsItems();
        if (!items || items.length === 0) {
          await window.pages.saveNewsItem({
            id: "news-relay-final-demo",
            title: "Boys 4x100m Relay Finals Bring Down the House",
            subtitle: "Sensational anchor leg sprint by Phoenix sets new academy record",
            type: "photo",
            category: "Track",
            mediaUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
            content: "An electrifying start to the sprint finals as competitors burst from the blocks with phenomenal acceleration down the main track. The crowd erupted as baton exchanges were completed flawlessly.",
            likes: 5,
            comments: [
              {
                id: "cmt-1",
                author: "Sarah O.",
                houseId: "phoenix",
                text: "Unbelievable finish! Phoenix never gives up! 🔥",
                formattedDate: "Today, 10:15 AM"
              }
            ],
            author: "Sports Secretariat",
            formattedDate: "Today"
          });
          items = window.pages.getNewsItems();
        }
        const item = items[0];

        // Open modal
        window.pages.openArticleModal(item);

        // Add a comment to it
        const input = document.getElementById("comment-input-" + item.id);
        if (input) {
          input.value = "Incredible race by Phoenix! We are proud of lane 4! 🔥🦅";
          await window.pages.handlePostComment(item.id);
        }

        return {
          opened: !!document.getElementById("jais-article-modal-popup"),
          title: item.title,
          commentCount: item.comments ? item.comments.length : 0
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('Modal & Comment Eval FULL:', JSON.stringify(evalRes, null, 2));

    await new Promise(r => setTimeout(r, 1200));

    // Scroll modal body down to show input and reaction chips
    await send('Runtime.evaluate', {
      expression: `(() => {
        const body = document.querySelector(".jais-media-modal-body");
        if (body) body.scrollTop = body.scrollHeight;
      })()`
    });

    await new Promise(r => setTimeout(r, 600));

    // Capture screenshot of story modal with comments and input form
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(artifactDir, 'verified_news_comments_modal_input.png');
    const base64Data = shot.result && shot.result.data ? shot.result.data : shot.data;
    fs.writeFileSync(shotPath, Buffer.from(base64Data, 'base64'));
    console.log('Saved screenshot of modal input form to:', shotPath);

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    proc.kill();
  }
}

testModalComments();
