// Setup Mock Browser Environment
const memoryStore = {};
globalThis.localStorage = {
  getItem: (key) => memoryStore[key] || null,
  setItem: (key, val) => { memoryStore[key] = String(val); },
  removeItem: (key) => { delete memoryStore[key]; },
  clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); }
};
globalThis.sessionStorage = globalThis.localStorage;
globalThis.window = {
  ...globalThis,
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { hash: "#/admin" }
};

import assert from "assert";

const { 
  getRegisteredAdmins, 
  getVerifiedAdmin, 
  isEmailWhitelisted, 
  isPermanentSuperAdmin, 
  isUserSuperAdmin,
  loginAdminWithPassword,
  completeAdminLogin,
  deleteAdminAccount,
  PERMANENT_SUPER_ADMINS
} = await import("../public/js/auth.js");

console.log("🧪 Running Comprehensive Superadmin Verification for 1h3chukwu@gmail.com...\n");

// 1. Check permanent super admins list
console.log("1️⃣ Testing Permanent Super Admin Definitions:");
assert.ok(Array.isArray(PERMANENT_SUPER_ADMINS), "PERMANENT_SUPER_ADMINS must be an array");
const ihechukwu = PERMANENT_SUPER_ADMINS.find(a => a.email.toLowerCase() === "1h3chukwu@gmail.com");
assert.ok(ihechukwu, "1h3chukwu@gmail.com must exist in PERMANENT_SUPER_ADMINS");
assert.strictEqual(ihechukwu.role, "super_admin", "Role must be super_admin");
console.log(`   ✅ 1h3chukwu@gmail.com is defined as Permanent Super Admin (${ihechukwu.id})`);

// 2. Check getRegisteredAdmins
console.log("\n2️⃣ Testing getRegisteredAdmins():");
const all = getRegisteredAdmins();
const inAll = all.find(a => a.email.toLowerCase() === "1h3chukwu@gmail.com");
assert.ok(inAll, "Must be present in registered admins list");
assert.strictEqual(inAll.role, "super_admin");
console.log(`   ✅ Found in registered admins list with role: ${inAll.role}`);

// 3. Check getVerifiedAdmin & isEmailWhitelisted
console.log("\n3️⃣ Testing Whitelist & Lookup:");
const verified = getVerifiedAdmin("1h3chukwu@gmail.com");
assert.ok(verified, "getVerifiedAdmin must return admin object");
assert.strictEqual(verified.email, "1h3chukwu@gmail.com");
assert.strictEqual(isEmailWhitelisted("1h3chukwu@gmail.com"), true);
assert.strictEqual(isPermanentSuperAdmin("1h3chukwu@gmail.com"), true);
assert.strictEqual(isPermanentSuperAdmin(verified.id), true);
console.log("   ✅ Whitelist, Lookup, and isPermanentSuperAdmin all verified.");

// 4. Test Super Admin Privileges Check
console.log("\n4️⃣ Testing isUserSuperAdmin() for Session:");
await completeAdminLogin(verified);
assert.strictEqual(isUserSuperAdmin(), true, "Must be recognized as Super Admin in active session");
console.log("   ✅ Session active: isUserSuperAdmin() returned TRUE.");

// 5. Test Protection against Deletion
console.log("\n5️⃣ Testing Super Admin Protection from Deletion:");
let errorThrown = false;
try {
  await deleteAdminAccount(verified.id);
} catch (err) {
  errorThrown = true;
  assert.ok(err.message.includes("Permanent Super Administrator"));
}
assert.strictEqual(errorThrown, true, "Deleting permanent super admin MUST throw error");
console.log("   ✅ Protection verified: Account cannot be deleted.");

// 6. Test Password Login with seeded password 'admin2026'
console.log("\n6️⃣ Testing Authentication with Password:");
const loginRes = await loginAdminWithPassword("1h3chukwu@gmail.com", "admin2026");
assert.strictEqual(loginRes.success, true, "Login with admin2026 must succeed");
assert.strictEqual(loginRes.admin.role, "super_admin");
console.log("   ✅ Authentication succeeded! Logged in as:", loginRes.admin.name, `(${loginRes.admin.role})`);

console.log("\n🎉 ALL TESTS PASSED! 1h3chukwu@gmail.com is fully configured as Super Administrator.");
process.exit(0);
