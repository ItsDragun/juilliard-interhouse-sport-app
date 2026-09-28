const API_KEY = "AIzaSyB2PhuebmPvGujVkYW22Z1Xs9woZbt6UCY";
const BASE_URL = "https://firestore.googleapis.com/v1/projects/ja-mega-26/databases/(default)/documents";

async function check() {
  const res = await fetch(`${BASE_URL}/admins?key=${API_KEY}`);
  const data = await res.json();
  console.log("Documents in /admins:");
  (data.documents || []).forEach(d => {
    console.log(d.name.split("/").pop(), JSON.stringify(d.fields));
  });

  const cRes = await fetch(`${BASE_URL}/admin_credentials?key=${API_KEY}`);
  const cData = await cRes.json();
  console.log("\nDocuments in /admin_credentials:");
  (cData.documents || []).forEach(d => {
    console.log(d.name.split("/").pop(), JSON.stringify(d.fields));
  });
}
check();
