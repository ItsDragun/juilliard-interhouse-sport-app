const API_KEY = "AIzaSyB2PhuebmPvGujVkYW22Z1Xs9woZbt6UCY";
const BASE_URL = "https://firestore.googleapis.com/v1/projects/ja-mega-26/databases/(default)/documents";

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return "h_" + Math.abs(hash).toString(36) + "_" + str.length;
}

async function syncOsaruyiAdmin() {
  console.log("🚀 Syncing osaruyiaideyan@gmail.com in Firestore...");

  // 1. Update /admins/ADM-003
  const adminDoc = {
    fields: {
      id: { stringValue: "ADM-003" },
      email: { stringValue: "osaruyiaideyan@gmail.com" },
      name: { stringValue: "Osaruyi Aideyan" },
      title: { stringValue: "Super Administrator & Scrutineer" },
      role: { stringValue: "super_admin" },
      createdAt: { stringValue: "2026-09-24T00:00:00.000Z" },
      createdBy: { stringValue: "System" },
      createdFormatted: { stringValue: "24 Sep, 2026" }
    }
  };

  const adminRes = await fetch(`${BASE_URL}/admins/ADM-003?key=${API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adminDoc)
  });
  console.log("✅ Updated /admins/ADM-003:", (await adminRes.json()).name);

  // 2. Set credentials for ADM-003 and osaruyiaideyan@gmail.com with default password 'admin2026'
  const defaultHash = simpleHash("admin2026");
  const credDoc = {
    fields: {
      adminId: { stringValue: "ADM-003" },
      email: { stringValue: "osaruyiaideyan@gmail.com" },
      passwordHash: { stringValue: defaultHash },
      updatedAt: { stringValue: new Date().toISOString() }
    }
  };

  const c1 = await fetch(`${BASE_URL}/admin_credentials/ADM-003?key=${API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credDoc)
  });
  console.log("✅ Updated /admin_credentials/ADM-003:", (await c1.json()).name);

  const c2 = await fetch(`${BASE_URL}/admin_credentials/osaruyiaideyan@gmail.com?key=${API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credDoc)
  });
  console.log("✅ Updated /admin_credentials/osaruyiaideyan@gmail.com:", (await c2.json()).name);

  // 3. Remove duplicate ADM-004 and old 1h3chukwu credentials
  await fetch(`${BASE_URL}/admins/ADM-004?key=${API_KEY}`, { method: "DELETE" });
  await fetch(`${BASE_URL}/admin_credentials/ADM-004?key=${API_KEY}`, { method: "DELETE" });
  await fetch(`${BASE_URL}/admin_credentials/1h3chukwu@gmail.com?key=${API_KEY}`, { method: "DELETE" });
  console.log("✅ Cleaned up old/duplicate docs (ADM-004, 1h3chukwu).");

  // Clean ADM-002 credentials to match Anthony Obi
  const anthonyCred = {
    fields: {
      adminId: { stringValue: "ADM-002" },
      email: { stringValue: "anthony.obi@juilliard.sch.ng" },
      passwordHash: { stringValue: "h_t6swm8_16" },
      updatedAt: { stringValue: new Date().toISOString() }
    }
  };
  await fetch(`${BASE_URL}/admin_credentials/ADM-002?key=${API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(anthonyCred)
  });
  console.log("✅ ADM-002 credentials cleaned to Anthony Obi");

  // 4. Verify /admins
  console.log("\n📋 Final Admin Registry in Firestore:");
  const listRes = await fetch(`${BASE_URL}/admins?key=${API_KEY}`);
  const listData = await listRes.json();
  (listData.documents || []).forEach(d => {
    const f = d.fields;
    console.log(`- ${f.id?.stringValue}: ${f.name?.stringValue} (${f.email?.stringValue}) [${f.title?.stringValue}] -> Role: ${f.role?.stringValue}`);
  });

  // 5. Verify /admin_credentials
  console.log("\n🔑 Final Credentials in Firestore:");
  const credsRes = await fetch(`${BASE_URL}/admin_credentials?key=${API_KEY}`);
  const credsData = await credsRes.json();
  (credsData.documents || []).forEach(d => {
    const f = d.fields;
    console.log(`- ${d.name.split("/").pop()}: ${f.adminId?.stringValue} (${f.email?.stringValue}) [Hash: ${f.passwordHash?.stringValue}]`);
  });
}

syncOsaruyiAdmin().catch(console.error);
