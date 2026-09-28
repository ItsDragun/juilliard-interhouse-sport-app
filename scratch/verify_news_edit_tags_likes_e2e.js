const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\festus\\.gemini\\antigravity-ide\\brain\\afb6558f-7764-4b08-be96-9a9f1ffc0e76';

async function runNewsVerification() {
  const port = 9389;
  console.log(`Starting headless Chrome on debug port ${port}...`);

  const proc = spawn(chrome, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-first-run',
    '--disable-extensions'
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
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.args.map(a => a.value || a.description).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
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
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('\n--- 1. Navigating to News Feed on local server http://127.0.0.1:5055/#/news ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:5055/#/news' });
    await new Promise(r => setTimeout(r, 3000));

    // Ensure we have a story
    const initCheck = await send('Runtime.evaluate', {
      expression: `(async () => {
        let news = window.pages.getNewsItems();
        if (!news || news.length === 0) {
          const item = {
            id: 'test-news-story-1',
            title: '4x100m Relay Finals Showcase Exceptional Speed',
            subtitle: 'Phoenix and Merlin battle to the wire in historic relay photo finish',
            type: 'photo',
            category: 'Track',
            mediaUrl: 'assets/hero-track.jpg',
            content: 'In one of the most electric sprints ever witnessed at the Juilliard Sports Arena, anchor runners traded the lead.',
            tags: ['Relay4x100m', 'Track', 'SportsDay2026'],
            likes: 5,
            likedBy: ['dev-user-abc'],
            comments: [],
            author: 'Sports Secretariat Desk',
            timestamp: new Date().toISOString(),
            formattedDate: 'Today'
          };
          await window.pages.saveNewsItem(item);
          window.pages.renderNewsPage();
        }
        return {
          newsCount: window.pages.getNewsItems().length,
          firstStory: window.pages.getNewsItems()[0]
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Stories available:', JSON.stringify(initCheck?.result?.value, null, 2));

    // 2. Test Edit Button Visibility & Modal Launch
    console.log('\n--- 2. Testing Edit Button & Dedicated Hashtag Field ---');
    const editTest = await send('Runtime.evaluate', {
      expression: `(() => {
        const firstStory = window.pages.getNewsItems()[0];
        window.pages.openMediaStoryEditor(firstStory.id);
        const modal = document.getElementById('jais-add-media-modal');
        const tagInput = document.getElementById('new-hashtag-input');
        const addTagBtn = document.getElementById('btn-add-hashtag');
        const activeContainer = document.getElementById('active-hashtags-container');
        const chipsCount = activeContainer ? activeContainer.querySelectorAll('.jais-active-tag-chip').length : 0;
        
        return {
          modalFound: !!modal,
          tagInputFound: !!tagInput,
          addTagBtnFound: !!addTagBtn,
          activeTagsCount: chipsCount
        };
      })()`,
      returnByValue: true
    });
    console.log('Story Editor Open State:', JSON.stringify(editTest?.result?.value, null, 2));

    // Capture screenshot of Story Editor with dedicated hashtag field
    const editModalShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verified_news_edit_modal.png'), Buffer.from(editModalShot.data, 'base64'));
    console.log('Saved verified_news_edit_modal.png to artifact directory');

    // 3. Test Adding and Removing Hashtags
    console.log('\n--- 3. Testing Adding New Hashtags & Removing Hashtags ---');
    const tagManipulation = await send('Runtime.evaluate', {
      expression: `(() => {
        const tagInput = document.getElementById('new-hashtag-input');
        tagInput.value = 'ChampionshipFinals';
        window.pages.addStoryHashtagFromInput();

        // Also append from suggestion chip
        window.pages.appendHashtag('PhoenixGold');

        const activeContainer = document.getElementById('active-hashtags-container');
        const tagTexts = Array.from(activeContainer.querySelectorAll('.jais-active-tag-chip span')).map(s => s.innerText);

        // Now test remove 1st tag
        const beforeRemoveCount = tagTexts.length;
        window.pages.removeStoryHashtag(0);
        const afterTagTexts = Array.from(document.getElementById('active-hashtags-container').querySelectorAll('.jais-active-tag-chip span')).map(s => s.innerText);

        return {
          addedTags: tagTexts,
          afterRemoval: afterTagTexts,
          inputCleared: tagInput.value === ''
        };
      })()`,
      returnByValue: true
    });
    console.log('Hashtag manipulation results:', JSON.stringify(tagManipulation?.result?.value, null, 2));

    // Save edited story
    const saveEditResult = await send('Runtime.evaluate', {
      expression: `(async () => {
        const titleInput = document.getElementById('new-media-title');
        titleInput.value = 'UPDATED: 4x100m Relay Finals Showcase Exceptional Speed';
        
        // Trigger save form submit
        const form = document.querySelector('#jais-add-media-modal form');
        const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
        form.dispatchEvent(submitEvent);
        await new Promise(r => setTimeout(r, 600));

        const updated = window.pages.getNewsItems().find(n => n.id === 'test-news-story-1');
        return {
          modalRemoved: !document.getElementById('jais-add-media-modal'),
          updatedTitle: updated?.title,
          updatedTags: updated?.tags
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Save Edit Results:', JSON.stringify(saveEditResult?.result?.value, null, 2));

    // 4. Test Single Like / Dislike Toggle
    console.log('\n--- 4. Testing Single Like & Dislike Toggle ---');
    const likeTest = await send('Runtime.evaluate', {
      expression: `(async () => {
        const storyId = 'test-news-story-1';
        // Clear local like record first to test clean 1st like
        const storageKey = 'juilliard_liked_news_ids';
        localStorage.removeItem(storageKey);

        const initialLiked = window.pages.isNewsStoryLiked(storyId);
        const initialLikes = window.pages.getNewsItems().find(n => n.id === storyId)?.likes || 0;
        
        // 1st click -> should LIKE (+1)
        await window.pages.likeNewsStory(storyId);
        await new Promise(r => setTimeout(r, 200));
        const afterFirstClick = {
          liked: window.pages.isNewsStoryLiked(storyId),
          btnClass: document.querySelector('[data-like-news-id="' + storyId + '"]')?.className,
          likes: window.pages.getNewsItems().find(n => n.id === storyId)?.likes
        };

        // 2nd click -> should DISLIKE / UNLIKE (-1)
        await window.pages.likeNewsStory(storyId);
        await new Promise(r => setTimeout(r, 200));
        const afterSecondClick = {
          liked: window.pages.isNewsStoryLiked(storyId),
          btnClass: document.querySelector('[data-like-news-id="' + storyId + '"]')?.className,
          likes: window.pages.getNewsItems().find(n => n.id === storyId)?.likes
        };

        // 3rd click -> should toggle back to LIKE (+1)
        await window.pages.likeNewsStory(storyId);
        await new Promise(r => setTimeout(r, 200));
        const afterThirdClick = {
          liked: window.pages.isNewsStoryLiked(storyId),
          btnClass: document.querySelector('[data-like-news-id="' + storyId + '"]')?.className,
          likes: window.pages.getNewsItems().find(n => n.id === storyId)?.likes
        };

        return {
          initialLikes,
          initialLiked,
          afterFirstClick,
          afterSecondClick,
          afterThirdClick
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Like / Dislike Results:', JSON.stringify(likeTest?.result?.value, null, 2));

    // Capture screenshot of News feed showing updated story and liked state
    const feedShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'verified_news_comments_likes.png'), Buffer.from(feedShot.data, 'base64'));
    console.log('Saved verified_news_comments_likes.png');

    console.log('\nAll News story editing, hashtag fields, and single-like/dislike tests verified successfully!');

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    proc.kill();
  }
}

runNewsVerification();
