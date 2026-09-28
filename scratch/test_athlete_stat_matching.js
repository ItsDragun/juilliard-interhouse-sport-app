const fs = require('fs');

function normalizeAthleteName(name) {
  if (!name) return "";
  return String(name)
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/['"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function matchesAthlete(entryAthleteString, targetAthleteName) {
  if (!entryAthleteString || !targetAthleteName) return false;
  const targetNorm = normalizeAthleteName(targetAthleteName);
  if (!targetNorm) return false;

  const rawParts = String(entryAthleteString).split(/&|,|\band\b|\//i);
  for (const part of rawParts) {
    const normPart = normalizeAthleteName(part);
    if (!normPart) continue;
    if (normPart === targetNorm) return true;
    if (normPart.length >= 4 && targetNorm.length >= 4) {
      if (normPart.includes(targetNorm) || targetNorm.includes(normPart)) {
        return true;
      }
    }
  }
  return false;
}

// Read seed events from seed-data.js
const seedContent = fs.readFileSync('public/js/seed-data.js', 'utf8');
const match = seedContent.match(/export const INITIAL_EVENTS = (\[[\s\S]*?\]);\s*export/);
let events = [];
if (match) {
  try {
    events = eval(match[1]);
  } catch (e) {
    console.error("Eval error:", e);
  }
}

console.log(`Loaded ${events.length} initial events.`);

function getAthleteStats(athleteName, events) {
  const normName = normalizeAthleteName(athleteName);
  if (!normName) return { gold: 0, silver: 0, bronze: 0, fourth: 0, totalMedals: 0, eventsCount: 0, history: [] };

  let gold = 0;
  let silver = 0;
  let bronze = 0;
  let fourth = 0;
  let totalPoints = 0;
  let basketballPoints = 0;
  const history = [];

  events.forEach(ev => {
    if (!ev.results) return;
    const res = ev.results;

    if (res.first && matchesAthlete(res.first.athlete, athleteName)) {
      gold++;
      totalPoints += Number(res.first.points || 0);
      history.push({ eventName: ev.name, medal: 'Gold', points: res.first.points });
    }
    if (res.second && matchesAthlete(res.second.athlete, athleteName)) {
      silver++;
      totalPoints += Number(res.second.points || 0);
      history.push({ eventName: ev.name, medal: 'Silver', points: res.second.points });
    }
    if (res.third && matchesAthlete(res.third.athlete, athleteName)) {
      bronze++;
      totalPoints += Number(res.third.points || 0);
      history.push({ eventName: ev.name, medal: 'Bronze', points: res.third.points });
    }
    if (res.fourth && matchesAthlete(res.fourth.athlete, athleteName)) {
      fourth++;
      totalPoints += Number(res.fourth.points || 0);
      history.push({ eventName: ev.name, medal: '4th', points: res.fourth.points });
    }
    if (Array.isArray(res.scorers)) {
      res.scorers.forEach(sc => {
        if (matchesAthlete(sc.athlete || sc.player, athleteName)) {
          const pts = parseInt(sc.minute || sc.score || "2", 10) || 2;
          basketballPoints += pts;
          history.push({ eventName: ev.name, medal: 'Basket', points: pts });
        }
      });
    }
  });

  return {
    gold,
    silver,
    bronze,
    fourth,
    totalMedals: gold + silver + bronze,
    totalPoints,
    basketballPoints,
    eventsCount: history.length,
    history
  };
}

const statsWithoutGrade = getAthleteStats("Chinedu Ihejiahi", events);
const statsWithGrade = getAthleteStats("Chinedu Ihejiahi (SS 3)", events);

console.log("Stats WITHOUT '(SS 3)':");
console.log(JSON.stringify(statsWithoutGrade, null, 2));

console.log("\nStats WITH '(SS 3)':");
console.log(JSON.stringify(statsWithGrade, null, 2));

const areEqual = JSON.stringify(statsWithoutGrade) === JSON.stringify(statsWithGrade);
console.log("\nAre stats IDENTICAL between both URLs?", areEqual ? "YES! PERFECT!" : "NO! MISMATCH!");
