const API_KEY = "AIzaSyB2PhuebmPvGujVkYW22Z1Xs9woZbt6UCY";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/ja-mega-26/databases/(default)/documents`;

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return "h_" + Math.abs(hash).toString(36) + "_" + str.length;
}

async function seedSuperAdmin() {
  console.log("🚀 Syncing 1h3chukwu@gmail.com to Firestore as Super Administrator...");

  const adminDoc = {
    fields: {
      id: { stringValue: "ADM-003" },
      email: { stringValue: "1h3chukwu@gmail.com" },
      name: { stringValue: "Ihechukwu" },
      title: { stringValue: "Super Administrator & Scrutineer" },
      role: { stringValue: "super_admin" },
      createdAt: { stringValue: new Date().toISOString() },
      createdBy: { stringValue: "System" },
      createdFormatted: { stringValue: "24 Sep, 2026" }
    }
  };

  // 1. Write to /admins/ADM-003
  const adminRes = await fetch(`${BASE_URL}/admins/ADM-003?key=${API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adminDoc)
  });
  const adminData = await adminRes.json();
  if (adminData.name) {
    console.log("✅ Successfully saved ADM-003 in /admins:", adminData.name);
  } else {
    console.error("❌ Failed to save admin:", adminData);
  }

  // 2. Write credential store with initial password 'admin2026'
  const passHash = simpleHash("admin2026");
  const credDoc = {
    fields: {
      adminId: { stringValue: "ADM-003" },
      email: { stringValue: "1h3chukwu@gmail.com" },
      passwordHash: { stringValue: passHash },
      updatedAt: { stringValue: new Date().toISOString() }
    }
  };

  const cred1 = await fetch(`${BASE_URL}/admin_credentials/ADM-003?key=${API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credDoc)
  });
  console.log("✅ Credentials saved for ADM-003:", (await cred1.json()).name);

  const cred2 = await fetch(`${BASE_URL}/admin_credentials/1h3chukwu@gmail.com?key=${API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credDoc)
  });
  console.log("✅ Credentials saved for 1h3chukwu@gmail.com:", (await cred2.json()).name);

  console.log("\n🎉 Verification of All Admins in Firestore:");
  const listRes = await fetch(`${BASE_URL}/admins?key=${API_KEY}`);
  const listData = await listRes.json();
  listData.documents.forEach(d => {
    const f = d.fields;
    console.log(`- ${f.id?.stringValue}: ${f.name?.stringValue} (${f.email?.stringValue}) [Role: ${f.role?.stringValue}]`);
  });
}

seedSuperAdmin().catch(console.error);
