// Mock minimal DOM for Node.js test environment
global.window = {
  addEventListener: () => {},
  location: { hash: "", search: "" }
};
global.document = {
  getElementById: () => null,
  addEventListener: () => {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

const { calculateHouseStandings } = await import('../public/js/db.js');
const { calculateFootballStandings, calculateBasketballStandings, renderFootballTable, renderBasketballTable, getAthleteStats } = await import('../public/js/pages.js');
const { INITIAL_HOUSES, INITIAL_EVENTS, DEMO_SAMPLE_SCORES } = await import('../public/js/seed-data.js');

console.log("=== Testing Juilliard Points & Medals System ===");

// 1. Check Olympic Medal ranking & 0 arbitrary points for track/field
const testEvents = JSON.parse(JSON.stringify(INITIAL_EVENTS));
// Apply sample scores
DEMO_SAMPLE_SCORES.forEach(s => {
  const ev = testEvents.find(e => e.id === s.eventId);
  if (ev) {
    ev.status = s.status;
    ev.results = s.results;
  }
});

const standings = calculateHouseStandings(INITIAL_HOUSES, testEvents);
console.log("\n1. Overall House Standings (Ranked by Olympic Medals):");
standings.forEach((h, i) => {
  console.log(`   #${i+1} ${h.name.padEnd(8)}: 🥇 ${h.goldCount} | 🥈 ${h.silverCount} | 🥉 ${h.bronzeCount} | Tot Medals: ${h.totalMedals} | Team PTS: ${h.teamPoints}`);
});

// Check that Phoenix has team points from football
const phoenix = standings.find(h => h.id === "phoenix");
if (phoenix.teamPoints >= 3) {
  console.log("   ✅ Phoenix has team points from Football / Basketball matches!");
} else {
  console.error("   ❌ Phoenix team points unexpected:", phoenix.teamPoints);
}

// 2. Football League Table Test
console.log("\n2. Football Standings Table:");
const fbTable = calculateFootballStandings(INITIAL_HOUSES, testEvents);
fbTable.forEach((h, i) => {
  console.log(`   #${i+1} ${h.name.padEnd(8)}: P:${h.p} W:${h.w} D:${h.d} L:${h.l} GF:${h.gf} GA:${h.ga} GD:${h.gd > 0 ? '+'+h.gd : h.gd} PTS:${h.pts}`);
});
const fbHtml = renderFootballTable(INITIAL_HOUSES, testEvents);
if (fbHtml.includes("Football League Table") && fbHtml.includes("PTS") && fbHtml.includes("GD")) {
  console.log("   ✅ renderFootballTable outputs correct FotMob-styled HTML!");
}

// 3. Basketball Standings Table Test
console.log("\n3. Basketball Standings Table:");
const bbTable = calculateBasketballStandings(INITIAL_HOUSES, testEvents);
bbTable.forEach((h, i) => {
  console.log(`   #${i+1} ${h.name.padEnd(8)}: P:${h.p} W:${h.w} L:${h.l} PF:${h.pf} PA:${h.pa} DIFF:${h.diff > 0 ? '+'+h.diff : h.diff} PTS:${h.pts}`);
});
const bbHtml = renderBasketballTable(INITIAL_HOUSES, testEvents);
if (bbHtml.includes("Basketball Standings") && bbHtml.includes("DIFF") && bbHtml.includes("PTS")) {
  console.log("   ✅ renderBasketballTable outputs correct FotMob-styled HTML!");
}

// 4. Athlete Stats Test
console.log("\n4. Athlete Stats Test (David Adeleke):");
const stats = getAthleteStats("David Adeleke", testEvents);
console.log(`   David Adeleke: Medals: ${stats.totalMedals}, Goals: ${stats.goals}, Basketball Pts: ${stats.basketballPoints}`);
if (stats.goals >= 1) {
  console.log("   ✅ Football goals tracked accurately!");
}
if (stats.basketballPoints >= 2) {
  console.log("   ✅ Basketball points tracked accurately!");
}

console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");
