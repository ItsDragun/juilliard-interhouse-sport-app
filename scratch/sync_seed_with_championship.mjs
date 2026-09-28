import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const simContent = fs.readFileSync(path.join(root, 'scratch', 'simulate_full_championship.mjs'), 'utf-8');

// Extract CHAMPIONSHIP_RESULTS
const startMarker = "const CHAMPIONSHIP_RESULTS = [";
const endMarker = "];\n\nfunction formatAdminTimestamp";
const startIndex = simContent.indexOf(startMarker);
const endIndex = simContent.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find CHAMPIONSHIP_RESULTS in simulate_full_championship.mjs");
  process.exit(1);
}

const resultsCode = simContent.slice(startIndex + startMarker.length - 1, endIndex + 1);
const championshipResults = eval(`(${resultsCode})`);
console.log(`Loaded ${championshipResults.length} championship event results.`);

// Read seed-data.js
const seedPath = path.join(root, 'public', 'js', 'seed-data.js');
let seedContent = fs.readFileSync(seedPath, 'utf-8');

// Fetch current initial events from seed-data
// We'll update each event in INITIAL_EVENTS with its completed results
const ADMIN_OFFICIAL = {
  adminId: "ADM-003",
  name: "Ihechukwu",
  email: "1h3chukwu@gmail.com",
  role: "super_admin"
};

// Update INITIAL_HOUSES in seed-data.js
const updatedHousesStr = `export const INITIAL_HOUSES = [
  {
    id: "phoenix",
    name: "Phoenix",
    motto: "From the Ashes, We Rise to Glory",
    mascot: "Phoenix Bird",
    color: "#EF4444",          // Solid Red
    colorSecondary: "#DC2626",
    colorDark: "#7F1D1D",
    bgGradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
    glowColor: "rgba(239, 68, 68, 0.4)",
    textColor: "#FFFFFF",
    captain: "Chinedu Ihejiahi (SS 3)",
    teachers: ["Mrs. Angela Davies (Head of House)", "Mr. Peter O'Connor", "Ms. Fatima Bello"],
    totalPoints: 9,
    teamPoints: 9,
    teamWins: 3,
    teamDraws: 0,
    teamLosses: 0,
    goldCount: 13,
    silverCount: 9,
    bronzeCount: 9,
    fourthCount: 1,
    totalMedals: 31
  },
  {
    id: "merlin",
    name: "Merlin",
    motto: "Wisdom, Power & Unyielding Focus",
    mascot: "Merlin Falcon Bird",
    color: "#2563EB",          // Solid Blue
    colorSecondary: "#1D4ED8",
    colorDark: "#1E3A8A",
    bgGradient: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
    glowColor: "rgba(37, 99, 235, 0.4)",
    textColor: "#FFFFFF",
    captain: "Michelle Olurotimi (SS 3)",
    teachers: ["Dr. Evelyn Wright (Head of House)", "Mr. Kenneth Cole", "Mrs. Sarah Jenkins"],
    totalPoints: 0,
    teamPoints: 0,
    teamWins: 0,
    teamDraws: 0,
    teamLosses: 2,
    goldCount: 8,
    silverCount: 10,
    bronzeCount: 7,
    fourthCount: 6,
    totalMedals: 25
  },
  {
    id: "swift",
    name: "Swift",
    motto: "Swift as Lightning, United as One",
    mascot: "Swift Bird",
    color: "#FACC15",          // Solid Yellow
    colorSecondary: "#EAB308",
    colorDark: "#713F12",
    bgGradient: "linear-gradient(135deg, #FACC15 0%, #EAB308 100%)",
    glowColor: "rgba(250, 204, 21, 0.4)",
    textColor: "#000000",
    captain: "Adefilewa Adebimpe (SS 3)",
    teachers: ["Ms. Rebecca Taylor (Head of House)", "Coach Ibrahim Bello", "Mr. David Alabi"],
    totalPoints: 6,
    teamPoints: 6,
    teamWins: 2,
    teamDraws: 0,
    teamLosses: 1,
    goldCount: 8,
    silverCount: 7,
    bronzeCount: 8,
    fourthCount: 9,
    totalMedals: 23
  },
  {
    id: "eagle",
    name: "Eagle",
    motto: "Soar High with Honor and Courage",
    mascot: "Eagle Bird",
    color: "#F97316",          // Solid Orange
    colorSecondary: "#EA580C",
    colorDark: "#7C2D12",
    bgGradient: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
    glowColor: "rgba(249, 115, 22, 0.4)",
    textColor: "#FFFFFF",
    captain: "Donald Ariyo (SS 3)",
    teachers: ["Mr. Harrison (Head of House)", "Ms. Chen", "Coach Adams"],
    totalPoints: 0,
    teamPoints: 0,
    teamWins: 0,
    teamDraws: 0,
    teamLosses: 2,
    goldCount: 6,
    silverCount: 9,
    bronzeCount: 4,
    fourthCount: 12,
    totalMedals: 19
  }
];`;

const housesRegex = /export const INITIAL_HOUSES = \[[\s\S]*?\n\];/;
seedContent = seedContent.replace(housesRegex, updatedHousesStr);

// Now update INITIAL_EVENTS
import { INITIAL_EVENTS as currentEvents } from '../public/js/seed-data.js';

const updatedEvents = currentEvents.map((ev, idx) => {
  const resultData = championshipResults.find(r => r.id === ev.id);
  if (!resultData) return ev;
  return {
    ...ev,
    status: "completed",
    format: resultData.format || ev.format || "multi",
    contenders: resultData.contenders || ev.contenders || null,
    notes: resultData.notes || ev.notes,
    results: resultData.results,
    completedAt: "2026-09-25T16:00:00.000Z",
    updatedAt: "2026-09-25T16:00:00.000Z",
    lastEditedBy: ADMIN_OFFICIAL,
    lastEditedFormatted: "25 Sep, 16:00"
  };
});

const updatedEventsStr = `export const INITIAL_EVENTS = ${JSON.stringify(updatedEvents, null, 2)};`;
const eventsRegex = /export const INITIAL_EVENTS = \[[\s\S]*?\n\];/;
seedContent = seedContent.replace(eventsRegex, updatedEventsStr);

fs.writeFileSync(seedPath, seedContent, 'utf-8');
console.log("✓ Successfully synchronized public/js/seed-data.js with full championship results!");
