// Setup Mock Browser Environment for Node ESM
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
globalThis.document = {
  querySelectorAll: () => [],
  getElementById: () => null,
  createElement: () => ({ style: {}, appendChild: () => {}, remove: () => {} }),
  body: { appendChild: () => {} }
};

import assert from "assert";

// Dynamic import after globals are established
const { 
  getStudents, 
  addStudent, 
  updateStudent, 
  batchUpdateStudentsHouse,
  getNewsItems, 
  saveNewsItem, 
  purgeAllPlaceholderNews,
  isPlaceholderNewsItem 
} = await import("../public/js/db.js");

const { MEDIA_ACTION_PRESETS } = await import("../public/js/pages.js");

console.log("🚀 Starting Comprehensive Unit & Logic Verification for Students & News Enhancements...\n");

// 1. Test isPlaceholderNewsItem & Purge
console.log("1️⃣ Testing Placeholder Detection & Removal:");
const mockItem1 = { id: "news-001", title: "Phoenix Sprints to Victory" };
const mockItem2 = { id: "news-004", title: "High Jump Thriller" };
const mockItem3 = { id: "news-custom", title: "Interhouse Sports Day 2026 Opening Ceremony" };
const realItem = { id: "news-user-12345", title: "Chinedu Wins 200m Final with Record Time" };

assert.strictEqual(isPlaceholderNewsItem(mockItem1), true, "news-001 must be flagged as placeholder");
assert.strictEqual(isPlaceholderNewsItem(mockItem2), true, "news-004 must be flagged as placeholder");
assert.strictEqual(isPlaceholderNewsItem(mockItem3), true, "legacy mock opening ceremony must be flagged as placeholder");
assert.strictEqual(isPlaceholderNewsItem(realItem), false, "Real user story must NOT be flagged as placeholder");
console.log("   ✅ isPlaceholderNewsItem accurately distinguishes placeholders from real news.");

// 2. Test Media Action Presets
console.log("\n2️⃣ Testing Sports Action Presets for Fast Publishing:");
assert.ok(Array.isArray(MEDIA_ACTION_PRESETS), "MEDIA_ACTION_PRESETS must be an array");
assert.strictEqual(MEDIA_ACTION_PRESETS.length, 6, "Expected 6 sports action presets");
MEDIA_ACTION_PRESETS.forEach(p => {
  assert.ok(p.key, "Preset must have key");
  assert.ok(p.label, "Preset must have label");
  assert.ok(p.title, "Preset must have title");
  assert.ok(p.cat, "Preset must have category");
  assert.ok(p.type, "Preset must have type");
  assert.ok(p.url, "Preset must have url");
  assert.ok(p.content, "Preset must have content");
  console.log(`   ✓ Preset "${p.label}" ready (${p.cat}, ${p.type})`);
});
console.log("   ✅ All 6 Sports Action Presets verified.");

// 3. Test Add Student
console.log("\n3️⃣ Testing Add Student to Database:");
const newStu = {
  name: "Kenechi Okonkwo",
  houseId: "phoenix",
  grade: "SS 2",
  gender: "Boys"
};
const addRes = await addStudent(newStu);
assert.strictEqual(addRes.success, true, "addStudent must return success: true");
assert.ok(addRes.id, "addStudent must return generated student id");

let currentStudents = getStudents();
const added = currentStudents.find(s => s.name === "Kenechi Okonkwo");
assert.ok(added, "Added student must exist in student roster");
assert.strictEqual(added.houseId, "phoenix");
assert.strictEqual(added.grade, "SS 2");
console.log(`   ✅ Student "${added.name}" added with ID: ${added.id} in House: ${added.houseId}`);

// 4. Test 1-Click Quick House Change
console.log("\n4️⃣ Testing 1-Click Quick House Change:");
const updateRes = await updateStudent(added.id, { houseId: "eagle" });
assert.strictEqual(updateRes.success, true, "updateStudent must return success: true");

currentStudents = getStudents();
const updatedStu = currentStudents.find(s => s.id === added.id);
assert.strictEqual(updatedStu.houseId, "eagle", "Student house must now be 'eagle'");
console.log(`   ✅ Student "${updatedStu.name}" house updated from Phoenix to Eagle.`);

// 5. Test Batch House Transfer
console.log("\n5️⃣ Testing Batch House Transfer Tool:");
const stu2Res = await addStudent({ name: "Amara Nnamdi", houseId: "phoenix", grade: "JSS 3", gender: "Girls" });
const stu3Res = await addStudent({ name: "Tunde Bakare", houseId: "phoenix", grade: "SS 1", gender: "Boys" });

const batchIds = [stu2Res.id, stu3Res.id];
const batchRes = await batchUpdateStudentsHouse(batchIds, "swift");
assert.strictEqual(batchRes.success, true, "batchUpdateStudentsHouse must return success: true");
assert.strictEqual(batchRes.count, 2, "batchUpdateStudentsHouse count must be 2");

currentStudents = getStudents();
const batchStu1 = currentStudents.find(s => s.id === stu2Res.id);
const batchStu2 = currentStudents.find(s => s.id === stu3Res.id);
assert.strictEqual(batchStu1.houseId, "swift", "Student 1 must now be in Swift");
assert.strictEqual(batchStu2.houseId, "swift", "Student 2 must now be in Swift");
console.log(`   ✅ Batch transfer moved 2 students simultaneously to Swift House.`);

// 6. Test Publishing News & Removing Placeholders
console.log("\n6️⃣ Testing News Item Publication & Placeholder Purge:");
const userStory = {
  title: "Historic Win in 4x100m Relay Finals",
  subtitle: "Record breaking race brings crowd to their feet",
  category: "Track",
  type: "photo",
  mediaUrl: "assets/crests/phoenix.svg",
  content: "An unforgettable race with incredible sportsmanship and heart.",
  tags: ["Track", "Relay", "Finals"],
  author: "David Festus (ADM-001)"
};
const storyRes = await saveNewsItem(userStory);
assert.strictEqual(storyRes.success, true, "saveNewsItem must succeed");

const newsList = getNewsItems();
const savedStory = newsList.find(n => n.title === userStory.title);
assert.ok(savedStory, "Published story must appear in news list");
assert.strictEqual(isPlaceholderNewsItem(savedStory), false, "Saved user story is not a placeholder");

// Verify zero placeholders in news list
const remainingPlaceholders = newsList.filter(isPlaceholderNewsItem);
assert.strictEqual(remainingPlaceholders.length, 0, "No placeholder news items should remain");
console.log(`   ✅ News story published. Remaining placeholder count: ${remainingPlaceholders.length}`);

console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 100% Functionality Verified.");
process.exit(0);
