const API_KEY = "AIzaSyB2PhuebmPvGujVkYW22Z1Xs9woZbt6UCY";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/ja-mega-26/databases/(default)/documents`;

async function resetHouses() {
  console.log("--- Resetting Houses in Firestore ---");
  const houses = [
    { id: "phoenix", name: "Phoenix", captain: "Chinedu Ihejiahi (SS 3)" },
    { id: "eagle", name: "Eagle", captain: "Donald Ariyo (SS 3)" },
    { id: "swift", name: "Swift", captain: "Adefilewa Adebimpe (SS 3)" },
    { id: "merlin", name: "Merlin", captain: "Michelle Olurotimi (SS 3)" }
  ];

  for (const h of houses) {
    const url = `${BASE_URL}/houses/${h.id}?updateMask.fieldPaths=totalPoints&updateMask.fieldPaths=teamPoints&updateMask.fieldPaths=goldCount&updateMask.fieldPaths=silverCount&updateMask.fieldPaths=bronzeCount&updateMask.fieldPaths=fourthCount&updateMask.fieldPaths=captain&key=${API_KEY}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          totalPoints: { integerValue: "0" },
          teamPoints: { integerValue: "0" },
          goldCount: { integerValue: "0" },
          silverCount: { integerValue: "0" },
          bronzeCount: { integerValue: "0" },
          fourthCount: { integerValue: "0" },
          captain: { stringValue: h.captain }
        }
      })
    });
    const data = await res.json();
    if (data.fields) {
      console.log(`✅ House ${h.id} reset to 0 points / 0 medals.`);
    } else {
      console.error(`❌ House ${h.id} error:`, data);
    }
  }
}

async function resetEvents() {
  console.log("\n--- Resetting Events in Firestore ---");
  const listRes = await fetch(`${BASE_URL}/events?pageSize=100&key=${API_KEY}`);
  const listData = await listRes.json();
  const docs = listData.documents || [];
  console.log(`Found ${docs.length} events in Firestore.`);

  for (const doc of docs) {
    const eventId = doc.name.split("/").pop();
    const url = `${BASE_URL}/events/${eventId}?updateMask.fieldPaths=status&updateMask.fieldPaths=results&key=${API_KEY}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          status: { stringValue: "upcoming" },
          results: { nullValue: null }
        }
      })
    });
    const data = await res.json();
    if (data.fields) {
      console.log(`✅ Event ${eventId} reset to upcoming.`);
    } else {
      console.error(`❌ Event ${eventId} error:`, data);
    }
  }
}

async function clearCollection(colName) {
  console.log(`\n--- Clearing ${colName} in Firestore ---`);
  const listRes = await fetch(`${BASE_URL}/${colName}?pageSize=100&key=${API_KEY}`);
  const listData = await listRes.json();
  const docs = listData.documents || [];
  console.log(`Found ${docs.length} documents in ${colName}.`);

  for (const doc of docs) {
    const docId = doc.name.split("/").pop();
    const delUrl = `${BASE_URL}/${colName}/${docId}?key=${API_KEY}`;
    await fetch(delUrl, { method: "DELETE" });
    console.log(`🗑️ Deleted ${colName}/${docId}`);
  }
}

async function run() {
  await resetHouses();
  await resetEvents();
  await clearCollection("activity_logs");
  await clearCollection("admin_audit_logs");
  console.log("\n🎉 Complete Firestore Reset Finished!");
}

run().catch(console.error);
