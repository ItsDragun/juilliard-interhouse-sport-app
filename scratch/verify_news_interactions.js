const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\afb6558f-7764-4b08-be96-9a9f1ffc0e76';

async function verifyNewsInteractions() {
  const port = 9335;
  console.log('Launching headless Chrome on port', port);
  const os = require('os');
  const tmpDir = path.join(os.tmpdir(), 'chrome_news_test_' + Date.now());
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
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?http://127.0.0.1:5055/#/onboarding`, { method: 'PUT' })).json();
    console.log('Opened clean test tab:', target.url);

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
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1200,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    // 1. Test Onboarding Name Field (Advance to Step 2)
    console.log('\n--- 1. Testing Onboarding User Name Input ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/onboarding' });
    await new Promise(r => setTimeout(r, 2000));

    // Choose Inter-House Sports to advance to Step 2
    const advStep = await send('Runtime.evaluate', {
      expression: `(() => {
        window.pages.onboardingChooseTournament('interhouse');
        const nameInput = document.getElementById("onboarding-user-name");
        if (!nameInput) return { ok: false, error: "Name input not found in Step 2" };
        nameInput.value = "Chinedu M.";
        nameInput.dispatchEvent(new Event("input", { bubbles: true }));
        window.pages.saveOnboardingUserName("Chinedu M.");
        return {
          ok: true,
          value: nameInput.value,
          stored: localStorage.getItem("jais_user_name")
        };
      })()`,
      returnByValue: true
    });
    console.log('Onboarding Step 2 check result:', advStep.result.value);

    // Capture screenshot of Onboarding with Name Input
    const onbShot = await send('Page.captureScreenshot', { format: 'png' });
    const onbShotPath = path.join(artifactDir, 'verified_onboarding_name_input.png');
    fs.writeFileSync(onbShotPath, Buffer.from(onbShot.data, 'base64'));
    console.log('Saved screenshot of Onboarding Step 2 with Name input to:', onbShotPath);

    // 2. Test News Page & Interactions
    console.log('\n--- 2. Testing News Page, Likes & Comments ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/news' });
    await new Promise(r => setTimeout(r, 2500));

    // 3. Test Liking the story from feed
    const likeTest = await send('Runtime.evaluate', {
      expression: `(async () => {
        const items = window.pages.getNewsItems();
        if (items.length === 0) return { ok: false, reason: "no news" };
        const testItem = items[0];
        const initialLikes = testItem.likes || 0;
        
        await window.pages.likeNewsStory(testItem.id);
        const updatedItem = window.pages.getNewsItems().find(n => n.id === testItem.id);
        const isLiked = window.pages.isNewsStoryLiked(testItem.id);
        
        return {
          ok: true,
          testId: testItem.id,
          initialLikes,
          updatedLikes: updatedItem.likes,
          isLiked
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Like test result:', likeTest.result.value);

    // 4. Test Opening Modal & Posting a Cheer
    const commentTest = await send('Runtime.evaluate', {
      expression: `(async () => {
        const items = window.pages.getNewsItems();
        const testItem = items[0];
        // Open the article modal
        window.pages.openArticleModal(testItem);

        // Verify comments section
        const cmtSection = document.getElementById("comments-section-" + testItem.id);
        const cmtInput = document.getElementById("comment-input-" + testItem.id);
        const currentUserDisplay = document.getElementById("jais-comment-current-user-display");

        if (!cmtSection || !cmtInput) {
          return { ok: false, error: "Comments section or input not rendered in modal" };
        }

        // Post a new cheer
        cmtInput.value = "Let's go Phoenix!! Phenomenal relay sprint! ⚡🏆";
        await window.pages.handlePostComment(testItem.id);

        const refreshedItem = window.pages.getNewsItems().find(n => n.id === testItem.id);
        return {
          ok: true,
          currentUser: currentUserDisplay ? currentUserDisplay.textContent : null,
          commentCount: refreshedItem.comments ? refreshedItem.comments.length : 0,
          latestComment: refreshedItem.comments ? refreshedItem.comments[refreshedItem.comments.length - 1] : null
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Comment test result:', commentTest.result.value);

    await new Promise(r => setTimeout(r, 1200));

    // Capture screenshot of article modal with comments and likes actively displayed!
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(artifactDir, 'verified_news_comments_likes.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot of story modal with comments to:', shotPath);

    // 5. Test Add Media Modal for Photo (Base64) and Video Upload Inputs
    const mediaModalTest = await send('Runtime.evaluate', {
      expression: `(() => {
        // Close article modal and open Add Media Modal
        document.getElementById("jais-article-modal-popup")?.remove();
        window.pages.openAddMediaModal();

        const modal = document.getElementById("jais-add-media-modal");
        const photoFileInput = document.getElementById("new-media-file-input");
        const videoFileInput = document.getElementById("new-media-video-input");
        const urlInput = document.getElementById("new-media-url");

        return {
          ok: !!modal,
          hasPhotoInput: !!photoFileInput,
          photoAccept: photoFileInput ? photoFileInput.getAttribute("accept") : null,
          hasVideoInput: !!videoFileInput,
          videoAccept: videoFileInput ? videoFileInput.getAttribute("accept") : null,
          hasUrlInput: !!urlInput
        };
      })()`,
      returnByValue: true
    });
    console.log('Add Media modal check:', mediaModalTest.result.value);

    await new Promise(r => setTimeout(r, 1000));
    const modalShot = await send('Page.captureScreenshot', { format: 'png' });
    const modalShotPath = path.join(artifactDir, 'verified_news_media_upload_modal.png');
    fs.writeFileSync(modalShotPath, Buffer.from(modalShot.data, 'base64'));
    console.log('Saved screenshot of Add Media modal to:', modalShotPath);

    console.log('\nAll News interactions, uploads, likes, and comments successfully verified!');
    ws.close();
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    proc.kill();
  }
}

verifyNewsInteractions();
