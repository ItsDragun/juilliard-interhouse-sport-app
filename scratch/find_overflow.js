const { execSync } = require('child_process');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Use Chrome with remote debugging or headless dump
const script = `
  const all = document.querySelectorAll('*');
  const wide = [];
  all.forEach(el => {
    if (el.scrollWidth > document.documentElement.clientWidth + 5) {
      wide.push({
        tag: el.tagName,
        id: el.id,
        className: el.className,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        offsetWidth: el.offsetWidth
      });
    }
  });
  console.log(JSON.stringify(wide.slice(0, 10), null, 2));
`;

const res = execSync(`"${chrome}" --headless=new --disable-gpu --window-size=430,1000 --dump-dom "http://localhost:5000/?view=full#/table"`);
console.log("DOM size:", res.length);
