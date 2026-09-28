const API_KEY = "AIzaSyB2PhuebmPvGujVkYW22Z1Xs9woZbt6UCY";
const BASE_URL = "https://firestore.googleapis.com/v1/projects/ja-mega-26/databases/(default)/documents";

async function deletePlaceholderStudents() {
  console.log("--- Fetching all students from Firestore ---");
  const res = await fetch(`${BASE_URL}/students?pageSize=500&key=${API_KEY}`);
  const data = await res.json();
  const docs = data.documents || [];
  console.log(`Found ${docs.length} total students in Firestore.`);

  const toDelete = docs.filter(doc => {
    const docId = doc.name.split("/").pop();
    const f = doc.fields || {};
    const grade = (f.grade?.stringValue || "").toLowerCase();
    const isMockId = docId.startsWith("stu-ea-") || docId.startsWith("stu-me-") || docId.startsWith("stu-ph-") || docId.startsWith("stu-sw-");
    const isMockGrade = grade.includes("grade");
    return isMockId || isMockGrade;
  });

  console.log(`Identified ${toDelete.length} placeholder students to delete.`);

  for (const doc of toDelete) {
    const docId = doc.name.split("/").pop();
    const name = doc.fields?.name?.stringValue || docId;
    const grade = doc.fields?.grade?.stringValue || "";
    const house = doc.fields?.houseId?.stringValue || "";
    const delUrl = `${BASE_URL}/students/${docId}?key=${API_KEY}`;
    await fetch(delUrl, { method: "DELETE" });
    console.log(`🗑️ Deleted placeholder student: ${docId} - ${name} (${grade}, ${house})`);
  }

  console.log("\n--- Verifying remaining students in Firestore ---");
  const verifyRes = await fetch(`${BASE_URL}/students?pageSize=500&key=${API_KEY}`);
  const verifyData = await verifyRes.json();
  const remaining = verifyData.documents || [];
  console.log(`Remaining students in Firestore: ${remaining.length}`);
  
  const remainingGrade = remaining.filter(d => (d.fields?.grade?.stringValue || "").toLowerCase().includes("grade"));
  console.log(`Remaining students with 'Grade': ${remainingGrade.length}`);

  const byHouse = {};
  remaining.forEach(d => {
    const h = d.fields?.houseId?.stringValue || "unknown";
    byHouse[h] = (byHouse[h] || 0) + 1;
  });
  console.log("Remaining students by house:", byHouse);
}

deletePlaceholderStudents().catch(console.error);
