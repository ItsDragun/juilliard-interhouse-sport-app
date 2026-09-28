import assert from "assert";
import { 
  VERIFIED_ADMIN_ACCOUNTS, 
  getVerifiedAdmin, 
  isEmailWhitelisted, 
  formatAdminTimestamp 
} from "../public/js/auth.js";
import { INITIAL_NEWS } from "../public/js/seed-news.js";

console.log("🧪 Starting Automated Verification for Admin Whitelist & News Gallery...");

// 1. Test Admin Registry Whitelist
assert.ok(Array.isArray(VERIFIED_ADMIN_ACCOUNTS), "VERIFIED_ADMIN_ACCOUNTS must be an array");
assert.ok(VERIFIED_ADMIN_ACCOUNTS.length >= 2, "Expected verified permanent super admin accounts");

const admin1 = getVerifiedAdmin("davidfestusugwu@gmail.com");
assert.ok(admin1, "davidfestusugwu@gmail.com must be verified");
assert.strictEqual(admin1.id, "ADM-001");
assert.strictEqual(admin1.role, "super_admin");

const admin2 = getVerifiedAdmin("1H3CHUKWU@GMAIL.COM"); // Case insensitivity
assert.ok(admin2, "1h3chukwu@gmail.com must match case-insensitively");
assert.strictEqual(admin2.id, "ADM-003");
assert.strictEqual(admin2.role, "super_admin");

// Test that unauthorized email is rejected
const fakeAdmin = getVerifiedAdmin("random_hacker@example.com");
assert.strictEqual(fakeAdmin, null, "Unverified email must return null");
assert.strictEqual(isEmailWhitelisted("random_hacker@example.com"), false);
assert.strictEqual(isEmailWhitelisted("davidfestusugwu@gmail.com"), true);
assert.strictEqual(isEmailWhitelisted("1h3chukwu@gmail.com"), true);

console.log("✅ Admin Email Whitelist & ID Assignment: PASSED");

// 2. Test Timestamp Formatting
const testDate = new Date("2026-09-23T14:35:10Z");
const formatted = formatAdminTimestamp(testDate);
assert.ok(formatted.includes("Sep"), "Formatted timestamp must include month name");
assert.ok(formatted.includes("23"), "Formatted timestamp must include day");
console.log("✅ Admin Timestamp Formatting: PASSED (" + formatted + ")");

// 3. Test News & Gallery Data
assert.ok(Array.isArray(INITIAL_NEWS), "INITIAL_NEWS must be an array");
assert.ok(INITIAL_NEWS.length >= 6, "Expected at least 6 initial stories");

const videoStories = INITIAL_NEWS.filter(n => n.type === "video");
const photoStories = INITIAL_NEWS.filter(n => n.type === "photo");
const articleStories = INITIAL_NEWS.filter(n => n.type === "article");

assert.ok(videoStories.length > 0, "Must have video highlights");
assert.ok(photoStories.length > 0, "Must have photo gallery stories");
assert.ok(articleStories.length > 0, "Must have article reports");

videoStories.forEach(v => {
  assert.ok(v.mediaUrl, "Video story must have mediaUrl");
  assert.ok(v.title, "Video story must have title");
  assert.ok(v.videoDuration, "Video story must have videoDuration");
});

photoStories.forEach(p => {
  assert.ok(p.mediaUrl, "Photo story must have mediaUrl");
  assert.ok(p.title, "Photo story must have title");
});

console.log(`✅ News & Gallery Dataset: PASSED (${videoStories.length} videos, ${photoStories.length} photos, ${articleStories.length} articles)`);

console.log("🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
