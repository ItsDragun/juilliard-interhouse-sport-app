const API_KEY = "AIzaSyB2PhuebmPvGujVkYW22Z1Xs9woZbt6UCY";
const BASE_URL = "https://firestore.googleapis.com/v1/projects/ja-mega-26/databases/(default)/documents";

async function setGeneralGenderInFirestore() {
  console.log("--- Updating all students in Firestore to gender: General ---");
  const res = await fetch(`${BASE_URL}/students?pageSize=500&key=${API_KEY}`);
  const data = await res.json();
  const docs = data.documents || [];
  console.log(`Found ${docs.length} students in Firestore.`);

  let updated = 0;
  for (const doc of docs) {
    const docId = doc.name.split("/").pop();
    const url = `${BASE_URL}/students/${docId}?updateMask.fieldPaths=gender&updateMask.fieldPaths=houseId&key=${API_KEY}`;
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          gender: { stringValue: "General" },
          houseId: { stringValue: "general" }
        }
      })
    });
    updated++;
  }
  console.log(`✅ Updated ${updated} students in Firestore to gender: General, houseId: general.`);
}

setGeneralGenderInFirestore().catch(console.error);
