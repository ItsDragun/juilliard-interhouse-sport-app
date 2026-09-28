async function check() {
  try {
    const res = await fetch('https://ja-mega-26.web.app/js/seed-data.js');
    const text = await res.text();
    console.log("Length of seed-data.js on Firebase Hosting:", text.length);
    const m = text.match(/goldCount:\s*(\d+)/);
    console.log("First house goldCount on Firebase Hosting:", m ? m[1] : "not found");
    const ev = text.match(/"status":\s*"([^"]+)"/);
    console.log("First event status on Firebase Hosting:", ev ? ev[1] : "not found");
  } catch (e) {
    console.error(e.message);
  }
}
check();
