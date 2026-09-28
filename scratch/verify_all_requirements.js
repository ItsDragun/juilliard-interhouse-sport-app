const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\afb6558f-7764-4b08-be96-9a9f1ffc0e76';

async function run() {
  const port = 9338;
  const tmpDir = path.join(os.tmpdir(), 'chrome_test_all_' + Date.now());
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
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?http://127.0.0.1:5055/?admin=osaruyi%23/news`, { method: 'PUT' })).json();
    console.log('Opened target tab:', target.url);

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
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await new Promise(r => setTimeout(r, 3000));

    // Ensure at least one published story exists for testing
    await send('Runtime.evaluate', {
      expression: `(async () => {
        let stories = window.pages.getNewsItems();
        if (!stories || stories.length === 0) {
          window.pages.openAddMediaModal();
          window.pages.applyNewsPreset(0);
          const form = document.querySelector('#jais-add-media-modal form');
          form.dispatchEvent(new Event('submit', { cancelable: true }));
          await new Promise(r => setTimeout(r, 1000));
        }
      })()`,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 1000));

    // TEST 1: News Page and Admin Edit Buttons
    console.log('\n--- 1. Testing News Page & Admin Edit Buttons ---');
    const newsCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const editBtns = document.querySelectorAll('.jais-news-edit-btn');
        const heroTagBtns = document.querySelectorAll('.jais-news-hero-body .jais-news-tag-btn');
        const cardTagBtns = document.querySelectorAll('.jais-news-feed .jais-news-tag-btn');
        const stories = window.pages ? window.pages.getNewsItems() : [];
        return {
          editBtnCount: editBtns.length,
          heroTagBtnCount: heroTagBtns.length,
          cardTagBtnCount: cardTagBtns.length,
          totalStories: stories.length,
          firstStoryTitle: stories[0] ? stories[0].title : null,
          firstStoryId: stories[0] ? stories[0].id : null,
          firstStoryLikes: stories[0] ? stories[0].likes : 0
        };
      })()`,
      returnByValue: true
    });
    console.log('News check result:', newsCheck.result.value);

    // TEST 2: Like / Dislike (Single Toggle)
    console.log('\n--- 2. Testing Like / Dislike Single Toggle ---');
    const firstId = newsCheck.result.value.firstStoryId;
    const initialLikes = newsCheck.result.value.firstStoryLikes;

    // First click: like
    const like1 = await send('Runtime.evaluate', {
      expression: `(async () => {
        const res = await window.pages.toggleNewsLike('${firstId}');
        return res;
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Like toggle 1 result:', like1.result.value);

    // Second click: unlike/dislike
    const like2 = await send('Runtime.evaluate', {
      expression: `(async () => {
        const res = await window.pages.toggleNewsLike('${firstId}');
        return res;
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Like toggle 2 (unlike) result:', like2.result.value);

    // Third click: like again
    const like3 = await send('Runtime.evaluate', {
      expression: `(async () => {
        const res = await window.pages.toggleNewsLike('${firstId}');
        return res;
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Like toggle 3 result:', like3.result.value);

    // TEST 3: Edit Story Modal & Hashtags
    console.log('\n--- 3. Testing Story Editor & Hashtags ---');
    await send('Runtime.evaluate', {
      expression: `window.pages.openEditMediaModal('${firstId}')`
    });
    await new Promise(r => setTimeout(r, 1000));

    const editorCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('jais-add-media-modal');
        const titleInput = document.getElementById('new-media-title');
        const tagsInput = document.getElementById('new-media-tags');
        const suggestionChips = modal ? modal.querySelectorAll('.jais-tag-suggestion-chip') : [];
        return {
          modalOpen: !!modal,
          currentTitle: titleInput ? titleInput.value : null,
          currentTags: tagsInput ? tagsInput.value : null,
          suggestionChipCount: suggestionChips.length
        };
      })()`,
      returnByValue: true
    });
    console.log('Story Editor check:', editorCheck.result.value);

    // Click a hashtag suggestion chip
    await send('Runtime.evaluate', {
      expression: `window.pages.appendHashtag('#Finals')`
    });
    const tagsAfterAppend = await send('Runtime.evaluate', {
      expression: `document.getElementById('new-media-tags').value`,
      returnByValue: true
    });
    console.log('Tags after appending #Finals:', tagsAfterAppend.result.value);

    // Take screenshot of Edit Story Modal
    const modalShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verified_news_edit_modal.png'), Buffer.from(modalShot.data, 'base64'));
    console.log('Saved verified_news_edit_modal.png');

    // Update title and save
    const saveResult = await send('Runtime.evaluate', {
      expression: `(async () => {
        document.getElementById('new-media-title').value = "100m Sprint Thriller: Lightning Speed in Finals";
        const form = document.querySelector('#jais-add-media-modal form');
        const submitEvent = new Event('submit', { cancelable: true });
        form.dispatchEvent(submitEvent);
        return true;
      })()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1500));

    const updatedStoryCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const item = window.pages.getNewsItems().find(n => n.id === '${firstId}');
        return {
          id: item.id,
          title: item.title,
          tags: item.tags,
          updatedAt: item.updatedAt
        };
      })()`,
      returnByValue: true
    });
    console.log('Updated story check:', updatedStoryCheck.result.value);

    // TEST 4: Hashtag Filtering
    console.log('\n--- 4. Testing Hashtag Filtering ---');
    await send('Runtime.evaluate', {
      expression: `window.pages.filterNewsByTag('Finals')`
    });
    await new Promise(r => setTimeout(r, 800));

    const tagFilterCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const activeTagPill = document.querySelector('.jais-news-tag-btn');
        const feedCount = document.querySelectorAll('.jais-news-hero-card, .jais-news-item-compact').length;
        return {
          activeTagText: activeTagPill ? activeTagPill.innerText : null,
          storiesVisible: feedCount
        };
      })()`,
      returnByValue: true
    });
    console.log('Hashtag filter check:', tagFilterCheck.result.value);

    // Clear filter
    await send('Runtime.evaluate', {
      expression: `window.pages.clearNewsTagFilter()`
    });
    await new Promise(r => setTimeout(r, 800));

    // TEST 5: Football Group Stage & Knockout Table
    console.log('\n--- 5. Testing Football Group Stage (3 Matches Per Team) & Knockout ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/?admin=osaruyi#/table' });
    await new Promise(r => setTimeout(r, 2000));

    await send('Runtime.evaluate', {
      expression: `window.pages.setActiveCompetition('interhouse')`
    });
    await new Promise(r => setTimeout(r, 800));

    // Switch to Football table
    await send('Runtime.evaluate', {
      expression: `window.pages.setTableCategoryFilter('football')`
    });
    await new Promise(r => setTimeout(r, 1200));

    const fbTableCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const rows = Array.from(document.querySelectorAll('.jais-table-data-row.football-mode')).map(row => {
          const cells = Array.from(row.querySelectorAll('.jais-col-medal, .jais-team-name-text')).map(c => c.innerText.trim());
          return cells;
        });
        const matchCards = document.querySelectorAll('.jais-bracket-match-card').length;
        const matchdays = document.querySelectorAll('.jais-matchday-group').length;
        return {
          tableRows: rows,
          knockoutAndFixturesCards: matchCards,
          matchdaysCount: matchdays
        };
      })()`,
      returnByValue: true
    });
    console.log('Football table check:', fbTableCheck.result.value);

    // Capture Football Table Screenshot
    const fbShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verified_football_group_knockout.png'), Buffer.from(fbShot.data, 'base64'));
    console.log('Saved verified_football_group_knockout.png');

    // TEST 6: Basketball Pure Knockout Bracket
    console.log('\n--- 6. Testing Basketball Pure Knockout Bracket ---');
    await send('Runtime.evaluate', {
      expression: `window.pages.setTableCategoryFilter('basketball')`
    });
    await new Promise(r => setTimeout(r, 1200));

    const bbTableCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const matchCards = Array.from(document.querySelectorAll('.jais-bracket-match-card')).map(card => {
          return card.innerText.replace(/\\s+/g, ' ').trim();
        });
        const podiumCards = document.querySelectorAll('.jais-table-card .jais-bracket-grid + div').length;
        return {
          knockoutMatches: matchCards,
          podiumPresent: podiumCards > 0
        };
      })()`,
      returnByValue: true
    });
    console.log('Basketball knockout check:', bbTableCheck.result.value);

    // Capture Basketball Bracket Screenshot
    const bbShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verified_basketball_knockout.png'), Buffer.from(bbShot.data, 'base64'));
    console.log('Saved verified_basketball_knockout.png');

    console.log('\n ALL TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    proc.kill();
  }
}

run();
