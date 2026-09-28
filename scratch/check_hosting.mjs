async function check() {
  try {
    const res = await fetch('https://ja-mega-26.web.app/');
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Length:", text.length);
    const m = text.match(/<script type="module" src="([^"]+)"><\/script>/);
    console.log("Script tag deployed to Firebase Hosting:", m ? m[0] : "none");
  } catch (e) {
    console.error(e.message);
  }
}
check();
