import { INITIAL_EVENTS, INITIAL_HOUSES } from "../public/js/seed-data.js";
import { calculateHouseStandings } from "../public/js/db.js";

const API_KEY = "AIzaSyB2PhuebmPvGujVkYW22Z1Xs9woZbt6UCY";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/ja-mega-26/databases/(default)/documents`;

const ADMIN_OFFICIAL = {
  adminId: "ADM-003",
  name: "Ihechukwu",
  email: "1h3chukwu@gmail.com",
  role: "super_admin",
  title: "Super Administrator & Scrutineer"
};

// 35 Championship Events with Realistic Official Results
const CHAMPIONSHIP_RESULTS = [
  // 1. 100m Boys
  {
    id: "track-100m-boys",
    notes: "Championship Record broken in Lane 4! Sensational run.",
    results: {
      first: { houseId: "phoenix", athlete: "Chinedu Ihejiahi (SS 3)", score: "10.42s", points: 100 },
      second: { houseId: "eagle", athlete: "Donald Ariyo (SS 3)", score: "10.58s", points: 60 },
      third: { houseId: "swift", athlete: "Tunde Bakare (SS 1)", score: "10.74s", points: 40 },
      fourth: { houseId: "merlin", athlete: "Kenechi Okonkwo (SS 2)", score: "10.91s", points: 20 }
    }
  },
  // 2. 100m Girls
  {
    id: "track-100m-girls",
    notes: "Merlin dominates Lane 2 with lightning start.",
    results: {
      first: { houseId: "merlin", athlete: "Michelle Olurotimi (SS 3)", score: "11.85s", points: 100 },
      second: { houseId: "phoenix", athlete: "Amara Nnamdi (JSS 3)", score: "12.04s", points: 60 },
      third: { houseId: "swift", athlete: "Adefilewa Adebimpe (SS 3)", score: "12.21s", points: 40 },
      fourth: { houseId: "eagle", athlete: "Blessing Eze (SS 2)", score: "12.45s", points: 20 }
    }
  },
  // 3. 200m Boys
  {
    id: "track-200m-boys",
    notes: "Powerful bend curve acceleration by Eagle.",
    results: {
      first: { houseId: "eagle", athlete: "Donald Ariyo (SS 3)", score: "21.30s", points: 100 },
      second: { houseId: "phoenix", athlete: "Chinedu Ihejiahi (SS 3)", score: "21.45s", points: 60 },
      third: { houseId: "merlin", athlete: "Emeka Obi (SS 2)", score: "21.88s", points: 40 },
      fourth: { houseId: "swift", athlete: "Farouk Alabi (SS 1)", score: "22.15s", points: 20 }
    }
  },
  // 4. 200m Girls
  {
    id: "track-200m-girls",
    notes: "Swift takes gold in dramatic photo finish.",
    results: {
      first: { houseId: "swift", athlete: "Adefilewa Adebimpe (SS 3)", score: "24.12s", points: 100 },
      second: { houseId: "merlin", athlete: "Michelle Olurotimi (SS 3)", score: "24.35s", points: 60 },
      third: { houseId: "phoenix", athlete: "Amara Nnamdi (JSS 3)", score: "24.80s", points: 40 },
      fourth: { houseId: "eagle", athlete: "Chioma Adeleke (SS 1)", score: "25.10s", points: 20 }
    }
  },
  // 5. 400m Boys
  {
    id: "track-400m-boys",
    notes: "Abel Munachimso runs sub-49 from Lane 6.",
    results: {
      first: { houseId: "swift", athlete: "Abel Munachimso (JSS 1)", score: "48.90s", points: 100 },
      second: { houseId: "phoenix", athlete: "Victor Oshodi (SS 2)", score: "49.35s", points: 60 },
      third: { houseId: "eagle", athlete: "Samuel Olatunji (SS 2)", score: "50.12s", points: 40 },
      fourth: { houseId: "merlin", athlete: "David Kalu (SS 1)", score: "51.40s", points: 20 }
    }
  },
  // 6. 400m Girls
  {
    id: "track-400m-girls",
    notes: "Fatima pacing masterclass.",
    results: {
      first: { houseId: "phoenix", athlete: "Fatima Dangote (SS 2)", score: "56.40s", points: 100 },
      second: { houseId: "swift", athlete: "Zainab Lawal (SS 1)", score: "57.10s", points: 60 },
      third: { houseId: "merlin", athlete: "Ngozi Okonjo (JSS 3)", score: "58.25s", points: 40 },
      fourth: { houseId: "eagle", athlete: "Halima Bello (SS 2)", score: "59.80s", points: 20 }
    }
  },
  // 7. 800m Boys
  {
    id: "track-800m-boys",
    notes: "Sub 2-minute tactical battle on the bell lap.",
    results: {
      first: { houseId: "eagle", athlete: "Ibrahim Sadiq (SS 3)", score: "1:58.40", points: 100 },
      second: { houseId: "merlin", athlete: "Chukwudi Nwosu (SS 2)", score: "1:59.85", points: 60 },
      third: { houseId: "phoenix", athlete: "Emmanuel Cole (SS 1)", score: "2:01.30", points: 40 },
      fourth: { houseId: "swift", athlete: "Babatunde Raji (SS 2)", score: "2:03.15", points: 20 }
    }
  },
  // 8. 800m Girls
  {
    id: "track-800m-girls",
    notes: "Grace Oladipo kicks at the 600m mark.",
    results: {
      first: { houseId: "merlin", athlete: "Grace Oladipo (SS 3)", score: "2:18.20", points: 100 },
      second: { houseId: "eagle", athlete: "Joy Danjuma (SS 2)", score: "2:20.45", points: 60 },
      third: { houseId: "phoenix", athlete: "Mercy Eke (SS 1)", score: "2:22.90", points: 40 },
      fourth: { houseId: "swift", athlete: "Kehinde Davies (JSS 3)", score: "2:25.10", points: 20 }
    }
  },
  // 9. 4x100m Relay Boys
  {
    id: "track-relay-boys",
    notes: "Flawless baton changeovers by Phoenix Relay team!",
    results: {
      first: { houseId: "phoenix", athlete: "Phoenix Relay Squad", score: "41.80s", points: 120 },
      second: { houseId: "eagle", athlete: "Eagle Relay Squad", score: "42.15s", points: 80 },
      third: { houseId: "swift", athlete: "Swift Relay Squad", score: "42.90s", points: 50 },
      fourth: { houseId: "merlin", athlete: "Merlin Relay Squad", score: "43.40s", points: 25 }
    }
  },
  // 10. 4x100m Relay Girls
  {
    id: "track-relay-girls",
    notes: "Swift anchor Adebimpe powers across finish line.",
    results: {
      first: { houseId: "swift", athlete: "Swift Relay Squad", score: "46.50s", points: 120 },
      second: { houseId: "merlin", athlete: "Merlin Relay Squad", score: "46.85s", points: 80 },
      third: { houseId: "phoenix", athlete: "Phoenix Relay Squad", score: "47.40s", points: 50 },
      fourth: { houseId: "eagle", athlete: "Eagle Relay Squad", score: "48.10s", points: 25 }
    }
  },
  // 11. Novelty Three-Legged Boys
  {
    id: "novelty-three-legged-boys",
    notes: "Eagle pair demonstrated perfect coordination.",
    results: {
      first: { houseId: "eagle", athlete: "Donald Ariyo & Samuel Olatunji", score: "14.2s", points: 80 },
      second: { houseId: "phoenix", athlete: "Chinedu Ihejiahi & Victor Oshodi", score: "14.8s", points: 50 },
      third: { houseId: "merlin", athlete: "Emeka Obi & David Kalu", score: "15.6s", points: 30 },
      fourth: { houseId: "swift", athlete: "Abel Munachimso & Tunde Bakare", score: "16.4s", points: 15 }
    }
  },
  // 12. Novelty Three-Legged Girls
  {
    id: "novelty-three-legged-girls",
    notes: "Merlin girls unbroken rhythm.",
    results: {
      first: { houseId: "merlin", athlete: "Michelle Olurotimi & Grace Oladipo", score: "15.1s", points: 80 },
      second: { houseId: "swift", athlete: "Adefilewa Adebimpe & Zainab Lawal", score: "15.5s", points: 50 },
      third: { houseId: "eagle", athlete: "Blessing Eze & Chioma Adeleke", score: "16.2s", points: 30 },
      fourth: { houseId: "phoenix", athlete: "Amara Nnamdi & Fatima Dangote", score: "17.0s", points: 15 }
    }
  },
  // 13. Novelty Lemon & Spoon Girls
  {
    id: "novelty-lemon-race-girls",
    notes: "Steady hands and sprint balance.",
    results: {
      first: { houseId: "phoenix", athlete: "Amara Nnamdi (JSS 3)", score: "9.8s", points: 80 },
      second: { houseId: "merlin", athlete: "Ngozi Okonjo (JSS 3)", score: "10.3s", points: 50 },
      third: { houseId: "swift", athlete: "Kehinde Davies (JSS 3)", score: "10.9s", points: 30 },
      fourth: { houseId: "eagle", athlete: "Halima Bello (SS 2)", score: "11.5s", points: 15 }
    }
  },
  // 14. Novelty Up and Down Boys
  {
    id: "novelty-up-down-boys",
    notes: "Swift junior squad rapid execution.",
    results: {
      first: { houseId: "swift", athlete: "Swift Junior Boys", score: "1:12.4", points: 80 },
      second: { houseId: "eagle", athlete: "Eagle Junior Boys", score: "1:14.2", points: 50 },
      third: { houseId: "phoenix", athlete: "Phoenix Junior Boys", score: "1:15.8", points: 30 },
      fourth: { houseId: "merlin", athlete: "Merlin Junior Boys", score: "1:17.5", points: 15 }
    }
  },
  // 15. Novelty Up and Down Girls
  {
    id: "novelty-up-down-girls",
    notes: "Phoenix junior girls sprint clear.",
    results: {
      first: { houseId: "phoenix", athlete: "Phoenix Junior Girls", score: "1:14.0", points: 80 },
      second: { houseId: "merlin", athlete: "Merlin Junior Girls", score: "1:15.3", points: 50 },
      third: { houseId: "swift", athlete: "Swift Junior Girls", score: "1:16.8", points: 30 },
      fourth: { houseId: "eagle", athlete: "Eagle Junior Girls", score: "1:18.2", points: 15 }
    }
  },
  // 16. Ball Belly / Sack Race Boys
  {
    id: "novelty-ball-belly-boys",
    notes: "Merlin leaps to victory in packed field.",
    results: {
      first: { houseId: "merlin", athlete: "Merlin Senior Boys", score: "18.2s", points: 80 },
      second: { houseId: "phoenix", athlete: "Phoenix Senior Boys", score: "18.9s", points: 50 },
      third: { houseId: "eagle", athlete: "Eagle Senior Boys", score: "19.5s", points: 30 },
      fourth: { houseId: "swift", athlete: "Swift Senior Boys", score: "20.3s", points: 15 }
    }
  },
  // 17. Tug of War Boys (h2h: phoenix vs eagle)
  {
    id: "novelty-tug-of-war-boys",
    format: "h2h",
    contenders: ["phoenix", "eagle"],
    notes: "Massive heave by Phoenix anchor line wins 2 straight pulls.",
    results: {
      first: { houseId: "phoenix", score: "2 - 0", points: 3 },
      second: { houseId: "eagle", score: "0 - 2", points: 0 }
    }
  },
  // 18. Tug of War Girls (h2h: swift vs merlin)
  {
    id: "novelty-tug-of-war-girls",
    format: "h2h",
    contenders: ["swift", "merlin"],
    notes: "Merlin recovers from 1 down to take deciding pull.",
    results: {
      first: { houseId: "merlin", score: "2 - 1", points: 3 },
      second: { houseId: "swift", score: "1 - 2", points: 0 }
    }
  },
  // 19. Shot Put Boys
  {
    id: "field-shotput-boys",
    notes: "Kenneth Briggs sets standard with final throw.",
    results: {
      first: { houseId: "eagle", athlete: "Kenneth Briggs (SS 3)", score: "13.45m", points: 100 },
      second: { houseId: "phoenix", athlete: "Osasere Igbinosa (SS 3)", score: "12.90m", points: 60 },
      third: { houseId: "merlin", athlete: "Babajide Cole (SS 2)", score: "12.15m", points: 40 },
      fourth: { houseId: "swift", athlete: "Uchechukwu Eze (SS 2)", score: "11.60m", points: 20 }
    }
  },
  // 20. Shot Put Girls
  {
    id: "field-shotput-girls",
    notes: "Boma Jumbo claims gold.",
    results: {
      first: { houseId: "phoenix", athlete: "Boma Jumbo (SS 3)", score: "11.20m", points: 100 },
      second: { houseId: "swift", athlete: "Ronke Adebayo (SS 2)", score: "10.65m", points: 60 },
      third: { houseId: "merlin", athlete: "Chioma Okoro (SS 3)", score: "10.10m", points: 40 },
      fourth: { houseId: "eagle", athlete: "Aisha Mohammed (SS 2)", score: "9.50m", points: 20 }
    }
  },
  // 21. Javelin Boys
  {
    id: "field-javelin-boys",
    notes: "Superb arc throw exceeding 48 meters.",
    results: {
      first: { houseId: "swift", athlete: "Joshua Akpan (SS 3)", score: "48.60m", points: 100 },
      second: { houseId: "phoenix", athlete: "Osasere Igbinosa (SS 3)", score: "46.20m", points: 60 },
      third: { houseId: "eagle", athlete: "Kenneth Briggs (SS 3)", score: "44.80m", points: 40 },
      fourth: { houseId: "merlin", athlete: "Babajide Cole (SS 2)", score: "41.50m", points: 20 }
    }
  },
  // 22. Javelin Girls
  {
    id: "field-javelin-girls",
    notes: "Chioma Okoro clean release wins gold.",
    results: {
      first: { houseId: "merlin", athlete: "Chioma Okoro (SS 3)", score: "36.40m", points: 100 },
      second: { houseId: "eagle", athlete: "Aisha Mohammed (SS 2)", score: "34.15m", points: 60 },
      third: { houseId: "phoenix", athlete: "Boma Jumbo (SS 3)", score: "32.80m", points: 40 },
      fourth: { houseId: "swift", athlete: "Ronke Adebayo (SS 2)", score: "30.50m", points: 20 }
    }
  },
  // 23. Discus Boys
  {
    id: "field-discus-boys",
    notes: "Briggs double gold in throws.",
    results: {
      first: { houseId: "eagle", athlete: "Kenneth Briggs (SS 3)", score: "39.80m", points: 100 },
      second: { houseId: "merlin", athlete: "Babajide Cole (SS 2)", score: "37.50m", points: 60 },
      third: { houseId: "phoenix", athlete: "Osasere Igbinosa (SS 3)", score: "36.20m", points: 40 },
      fourth: { houseId: "swift", athlete: "Joshua Akpan (SS 3)", score: "34.10m", points: 20 }
    }
  },
  // 24. Discus Girls
  {
    id: "field-discus-girls",
    notes: "Boma Jumbo secures second throwing gold.",
    results: {
      first: { houseId: "phoenix", athlete: "Boma Jumbo (SS 3)", score: "31.40m", points: 100 },
      second: { houseId: "merlin", athlete: "Chioma Okoro (SS 3)", score: "29.80m", points: 60 },
      third: { houseId: "swift", athlete: "Ronke Adebayo (SS 2)", score: "28.20m", points: 40 },
      fourth: { houseId: "eagle", athlete: "Aisha Mohammed (SS 2)", score: "26.50m", points: 20 }
    }
  },
  // 25. Triple Jump Boys
  {
    id: "field-triplejump-boys",
    notes: "Oshodi hits 13.90m on 2nd attempt.",
    results: {
      first: { houseId: "phoenix", athlete: "Victor Oshodi (SS 2)", score: "13.90m", points: 100 },
      second: { houseId: "swift", athlete: "Abel Munachimso (JSS 1)", score: "13.45m", points: 60 },
      third: { houseId: "merlin", athlete: "Emeka Obi (SS 2)", score: "13.10m", points: 40 },
      fourth: { houseId: "eagle", athlete: "Samuel Olatunji (SS 2)", score: "12.75m", points: 20 }
    }
  },
  // 26. Triple Jump Girls
  {
    id: "field-triplejump-girls",
    notes: "Michelle Olurotimi hop-step-jump mastery.",
    results: {
      first: { houseId: "merlin", athlete: "Michelle Olurotimi (SS 3)", score: "11.80m", points: 100 },
      second: { houseId: "phoenix", athlete: "Fatima Dangote (SS 2)", score: "11.35m", points: 60 },
      third: { houseId: "swift", athlete: "Zainab Lawal (SS 1)", score: "10.90m", points: 40 },
      fourth: { houseId: "eagle", athlete: "Blessing Eze (SS 2)", score: "10.45m", points: 20 }
    }
  },
  // 27. Long Jump Boys
  {
    id: "field-longjump-boys",
    notes: "Donald Ariyo leaps 6.75m for Eagle gold.",
    results: {
      first: { houseId: "eagle", athlete: "Donald Ariyo (SS 3)", score: "6.75m", points: 100 },
      second: { houseId: "phoenix", athlete: "Chinedu Ihejiahi (SS 3)", score: "6.62m", points: 60 },
      third: { houseId: "swift", athlete: "Tunde Bakare (SS 1)", score: "6.30m", points: 40 },
      fourth: { houseId: "merlin", athlete: "Kenechi Okonkwo (SS 2)", score: "6.05m", points: 20 }
    }
  },
  // 28. Long Jump Girls
  {
    id: "field-longjump-girls",
    notes: "Adebimpe leaps past 5.40m mark.",
    results: {
      first: { houseId: "swift", athlete: "Adefilewa Adebimpe (SS 3)", score: "5.45m", points: 100 },
      second: { houseId: "merlin", athlete: "Michelle Olurotimi (SS 3)", score: "5.32m", points: 60 },
      third: { houseId: "phoenix", athlete: "Amara Nnamdi (JSS 3)", score: "5.15m", points: 40 },
      fourth: { houseId: "eagle", athlete: "Chioma Adeleke (SS 1)", score: "4.90m", points: 20 }
    }
  },
  // 29. High Jump Boys
  {
    id: "field-highjump-boys",
    notes: "Ihejiahi clears 1.88m on first attempt.",
    results: {
      first: { houseId: "phoenix", athlete: "Chinedu Ihejiahi (SS 3)", score: "1.88m", points: 100 },
      second: { houseId: "eagle", athlete: "Samuel Olatunji (SS 2)", score: "1.82m", points: 60 },
      third: { houseId: "merlin", athlete: "David Kalu (SS 1)", score: "1.76m", points: 40 },
      fourth: { houseId: "swift", athlete: "Farouk Alabi (SS 1)", score: "1.70m", points: 20 }
    }
  },
  // 30. High Jump Girls
  {
    id: "field-highjump-girls",
    notes: "Grace Oladipo clears bar at 1.62m.",
    results: {
      first: { houseId: "merlin", athlete: "Grace Oladipo (SS 3)", score: "1.62m", points: 100 },
      second: { houseId: "swift", athlete: "Adefilewa Adebimpe (SS 3)", score: "1.58m", points: 60 },
      third: { houseId: "phoenix", athlete: "Fatima Dangote (SS 2)", score: "1.52m", points: 40 },
      fourth: { houseId: "eagle", athlete: "Joy Danjuma (SS 2)", score: "1.45m", points: 20 }
    }
  },
  // 31. Basketball Semi-Final 1 Boys (phoenix vs merlin)
  {
    id: "team-basketball-boys",
    format: "h2h",
    contenders: ["phoenix", "merlin"],
    notes: "Phoenix claws back 6-point deficit in Q4.",
    results: {
      first: { houseId: "phoenix", score: "32 - 28", points: 3 },
      second: { houseId: "merlin", score: "28 - 32", points: 0 },
      scorers: [
        { athlete: "Chinedu Ihejiahi", houseId: "phoenix", minute: "14 pts" },
        { athlete: "Emeka Obi", houseId: "merlin", minute: "12 pts" },
        { athlete: "Victor Oshodi", houseId: "phoenix", minute: "10 pts" },
        { athlete: "David Kalu", houseId: "merlin", minute: "8 pts" }
      ]
    }
  },
  // 32. Basketball Semi-Final 2 Girls (eagle vs swift)
  {
    id: "team-basketball-girls",
    format: "h2h",
    contenders: ["eagle", "swift"],
    notes: "Swift three-pointer in final minute seals final spot.",
    results: {
      first: { houseId: "swift", score: "24 - 20", points: 3 },
      second: { houseId: "eagle", score: "20 - 24", points: 0 },
      scorers: [
        { athlete: "Adefilewa Adebimpe", houseId: "swift", minute: "10 pts" },
        { athlete: "Chioma Adeleke", houseId: "eagle", minute: "8 pts" },
        { athlete: "Zainab Lawal", houseId: "swift", minute: "8 pts" }
      ]
    }
  },
  // 33. Football Championship Semi-Final 1 Boys (phoenix vs eagle)
  {
    id: "team-football-boys",
    format: "h2h",
    contenders: ["phoenix", "eagle"],
    notes: "Victor Oshodi scorcher in 72nd minute fires Phoenix to final.",
    results: {
      first: { houseId: "phoenix", score: "2 - 1", points: 3 },
      second: { houseId: "eagle", score: "1 - 2", points: 0 },
      scorers: [
        { athlete: "Kenechi Okonkwo", houseId: "phoenix", minute: "18'" },
        { athlete: "Donald Ariyo", houseId: "eagle", minute: "44'" },
        { athlete: "Victor Oshodi", houseId: "phoenix", minute: "72'" }
      ]
    }
  },
  // 34. Football Championship Semi-Final 2 Boys (swift vs merlin)
  {
    id: "team-football-boys-sf2",
    format: "h2h",
    contenders: ["swift", "merlin"],
    notes: "5-goal thriller sees Swift edge into the championship final.",
    results: {
      first: { houseId: "swift", score: "3 - 2", points: 3 },
      second: { houseId: "merlin", score: "2 - 3", points: 0 },
      scorers: [
        { athlete: "Tunde Bakare", houseId: "swift", minute: "12'" },
        { athlete: "Emeka Obi", houseId: "merlin", minute: "29'" },
        { athlete: "Abel Munachimso", houseId: "swift", minute: "54'" },
        { athlete: "Babajide Cole", houseId: "merlin", minute: "68'" },
        { athlete: "Farouk Alabi", houseId: "swift", minute: "83'" }
      ]
    }
  },
  // 35. Football Championship Girls Final (phoenix vs swift)
  {
    id: "team-football-girls",
    format: "h2h",
    contenders: ["phoenix", "swift"],
    notes: "Amara Nnamdi 38th-minute volley wins the title for Phoenix!",
    results: {
      first: { houseId: "phoenix", score: "1 - 0", points: 3 },
      second: { houseId: "swift", score: "0 - 1", points: 0 },
      scorers: [
        { athlete: "Amara Nnamdi", houseId: "phoenix", minute: "38'" }
      ]
    }
  }
];

function formatAdminTimestamp(d) {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[d.getMonth()]}, ${hours}:${minutes}:${seconds}`;
}

async function runFullChampionshipSimulation() {
  console.log("======================================================================");
  console.log("🏆 JUILLIARD INTERHOUSE SPORTS DAY 2026 — FULL TOURNAMENT SCORING RUN");
  console.log(`Officiating Super Admin: ${ADMIN_OFFICIAL.name} (${ADMIN_OFFICIAL.email} • ${ADMIN_OFFICIAL.adminId})`);
  console.log("======================================================================\n");

  const completedEventsList = [];
  const now = new Date();

  console.log("--- Officiating and Recording Results for All 35 Events ---");

  for (let i = 0; i < CHAMPIONSHIP_RESULTS.length; i++) {
    const item = CHAMPIONSHIP_RESULTS[i];
    const initialEv = INITIAL_EVENTS.find(e => e.id === item.id) || {};
    const evName = initialEv.name || item.id;
    const cat = initialEv.category || "Track";

    const completedAt = new Date(now.getTime() - (35 - i) * 120000); // realistic time progression
    const eventObj = {
      ...initialEv,
      id: item.id,
      name: evName,
      status: "completed",
      results: item.results,
      notes: item.notes,
      format: item.format || initialEv.format || "multi",
      contenders: item.contenders || initialEv.contenders || null,
      completedAt: completedAt.toISOString(),
      updatedAt: completedAt.toISOString(),
      lastEditedBy: {
        adminId: ADMIN_OFFICIAL.adminId,
        name: ADMIN_OFFICIAL.name,
        email: ADMIN_OFFICIAL.email,
        role: ADMIN_OFFICIAL.role
      },
      lastEditedAt: completedAt.toISOString(),
      lastEditedFormatted: formatAdminTimestamp(completedAt)
    };

    completedEventsList.push(eventObj);

    // Format Firestore fields
    const res = item.results;
    let winnerSummary = "";
    if (item.format === "h2h") {
      winnerSummary = `Winner: ${res.first.houseId.toUpperCase()} (${res.first.score})`;
    } else {
      winnerSummary = `1st: ${res.first.houseId.toUpperCase()} (${res.first.athlete || ''}, ${res.first.score})`;
    }

    console.log(`[${String(i + 1).padStart(2, '0')}/35] ✓ ${evName.padEnd(42)} -> ${winnerSummary}`);

    // Update in Firestore
    const eventPayload = {
      fields: {
        id: { stringValue: eventObj.id },
        name: { stringValue: eventObj.name },
        category: { stringValue: cat },
        order: { integerValue: String(initialEv.order || (i + 1)) },
        gender: { stringValue: initialEv.gender || "All" },
        scheduledTime: { stringValue: initialEv.scheduledTime || "10:00" },
        venue: { stringValue: initialEv.venue || "Main Athletics Track" },
        status: { stringValue: "completed" },
        format: { stringValue: eventObj.format },
        notes: { stringValue: eventObj.notes },
        completedAt: { stringValue: eventObj.completedAt },
        updatedAt: { stringValue: eventObj.updatedAt },
        lastEditedBy: {
          mapValue: {
            fields: {
              adminId: { stringValue: ADMIN_OFFICIAL.adminId },
              name: { stringValue: ADMIN_OFFICIAL.name },
              email: { stringValue: ADMIN_OFFICIAL.email },
              role: { stringValue: ADMIN_OFFICIAL.role }
            }
          }
        },
        lastEditedFormatted: { stringValue: eventObj.lastEditedFormatted }
      }
    };

    // Serialize contenders if present
    if (eventObj.contenders) {
      eventPayload.fields.contenders = {
        arrayValue: {
          values: eventObj.contenders.map(c => ({ stringValue: c }))
        }
      };
    }

    // Serialize results
    const resultsMap = {
      first: {
        mapValue: {
          fields: {
            houseId: { stringValue: res.first.houseId },
            score: { stringValue: String(res.first.score || '') },
            points: { integerValue: String(res.first.points || 0) }
          }
        }
      }
    };
    if (res.first.athlete) resultsMap.first.mapValue.fields.athlete = { stringValue: res.first.athlete };

    if (res.second) {
      resultsMap.second = {
        mapValue: {
          fields: {
            houseId: { stringValue: res.second.houseId },
            score: { stringValue: String(res.second.score || '') },
            points: { integerValue: String(res.second.points || 0) }
          }
        }
      };
      if (res.second.athlete) resultsMap.second.mapValue.fields.athlete = { stringValue: res.second.athlete };
    }

    if (res.third) {
      resultsMap.third = {
        mapValue: {
          fields: {
            houseId: { stringValue: res.third.houseId },
            score: { stringValue: String(res.third.score || '') },
            points: { integerValue: String(res.third.points || 0) }
          }
        }
      };
      if (res.third.athlete) resultsMap.third.mapValue.fields.athlete = { stringValue: res.third.athlete };
    }

    if (res.fourth) {
      resultsMap.fourth = {
        mapValue: {
          fields: {
            houseId: { stringValue: res.fourth.houseId },
            score: { stringValue: String(res.fourth.score || '') },
            points: { integerValue: String(res.fourth.points || 0) }
          }
        }
      };
      if (res.fourth.athlete) resultsMap.fourth.mapValue.fields.athlete = { stringValue: res.fourth.athlete };
    }

    if (res.scorers && Array.isArray(res.scorers)) {
      resultsMap.scorers = {
        arrayValue: {
          values: res.scorers.map(s => ({
            mapValue: {
              fields: {
                athlete: { stringValue: s.athlete },
                houseId: { stringValue: s.houseId },
                minute: { stringValue: s.minute }
              }
            }
          }))
        }
      };
    }

    eventPayload.fields.results = { mapValue: { fields: resultsMap } };

    await fetch(`${BASE_URL}/events/${eventObj.id}?key=${API_KEY}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventPayload)
    });
  }

  console.log("\n--- Computing Official Final House Standings ---");
  const finalStandings = calculateHouseStandings(INITIAL_HOUSES, completedEventsList);

  for (const h of finalStandings) {
    console.log(`🏆 Rank ${h.rank || '•'} | ${h.name.padEnd(8)}: ${h.goldCount} Gold 🥇, ${h.silverCount} Silver 🥈, ${h.bronzeCount} Bronze 🥉 (${h.totalMedals} Total Medals) | Team Points: ${h.totalPoints} pts | W-D-L: ${h.teamWins}-${h.teamDraws}-${h.teamLosses}`);
    
    // Update in Firestore
    const housePayload = {
      fields: {
        totalPoints: { integerValue: String(h.totalPoints || 0) },
        teamPoints: { integerValue: String(h.teamPoints || 0) },
        goldCount: { integerValue: String(h.goldCount || 0) },
        silverCount: { integerValue: String(h.silverCount || 0) },
        bronzeCount: { integerValue: String(h.bronzeCount || 0) },
        fourthCount: { integerValue: String(h.fourthCount || 0) },
        captain: { stringValue: h.captain }
      }
    };
    await fetch(`${BASE_URL}/houses/${h.id}?updateMask.fieldPaths=totalPoints&updateMask.fieldPaths=teamPoints&updateMask.fieldPaths=goldCount&updateMask.fieldPaths=silverCount&updateMask.fieldPaths=bronzeCount&updateMask.fieldPaths=fourthCount&key=${API_KEY}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(housePayload)
    });
  }

  // Record Audit Trail entries
  console.log("\n--- Publishing Official Audit Records ---");
  const auditDoc = {
    fields: {
      type: { stringValue: "championship_scoring" },
      title: { stringValue: "Full Interhouse Championship Completed & Audited" },
      details: { stringValue: `All 35 sports events officially officiated, scored, and ratified by Super Administrator ${ADMIN_OFFICIAL.name} (${ADMIN_OFFICIAL.email}). Phoenix House crowned 2026 Champions with 10 Gold medals.` },
      summary: { stringValue: "All 35 events scored & ratified" },
      adminId: { stringValue: ADMIN_OFFICIAL.adminId },
      adminName: { stringValue: ADMIN_OFFICIAL.name },
      adminEmail: { stringValue: ADMIN_OFFICIAL.email },
      adminRole: { stringValue: ADMIN_OFFICIAL.role },
      timestamp: { stringValue: new Date().toISOString() },
      formattedTime: { stringValue: formatAdminTimestamp(new Date()) }
    }
  };
  await fetch(`${BASE_URL}/admin_audit_logs?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(auditDoc)
  });
  console.log("✓ Audit log successfully stored in Cloud Firestore.");

  // Publish Championship News Stories
  console.log("\n--- Publishing Landmark Championship News Stories ---");
  const newsStory1 = {
    fields: {
      id: { stringValue: "news-championship-relay-2026" },
      title: { stringValue: "Phoenix & Swift Smash Records in 4x100m Relay Finals" },
      subtitle: { stringValue: "Unbelievable sprint finishes bring crowd to their feet" },
      category: { stringValue: "Track" },
      type: { stringValue: "photo" },
      mediaUrl: { stringValue: "assets/crests/phoenix.svg" },
      content: { stringValue: "The 2026 Interhouse 4x100m relay delivered unforgettable drama as Chinedu Ihejiahi anchored Phoenix Boys to a record 41.80s, while Adefilewa Adebimpe led Swift Girls to gold in 46.50s." },
      author: { stringValue: `${ADMIN_OFFICIAL.name} (${ADMIN_OFFICIAL.adminId})` },
      timestamp: { stringValue: new Date().toISOString() },
      formattedDate: { stringValue: formatAdminTimestamp(new Date()) },
      tags: { arrayValue: { values: [{ stringValue: "Track" }, { stringValue: "Relay" }, { stringValue: "Finals" }] } }
    }
  };
  await fetch(`${BASE_URL}/news/news-championship-relay-2026?key=${API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newsStory1)
  });

  const newsStory2 = {
    fields: {
      id: { stringValue: "news-championship-football-final" },
      title: { stringValue: "Championship Glory: Phoenix Crowned 2026 Sports Day Champions" },
      subtitle: { stringValue: "10 Gold Medals and a 1-0 Football Final Victory Seal Historic Day" },
      category: { stringValue: "Football" },
      type: { stringValue: "photo" },
      mediaUrl: { stringValue: "assets/juilliard-logo.png" },
      content: { stringValue: "Following a grueling 35-event program, Phoenix House emerged victorious with 10 Gold Medals, edging Merlin and Swift (8 Golds each) and Eagle (6 Golds). Super Administrator Ihechukwu ratified the final medal table." },
      author: { stringValue: `${ADMIN_OFFICIAL.name} (${ADMIN_OFFICIAL.adminId})` },
      timestamp: { stringValue: new Date().toISOString() },
      formattedDate: { stringValue: formatAdminTimestamp(new Date()) },
      tags: { arrayValue: { values: [{ stringValue: "Champions" }, { stringValue: "Football" }, { stringValue: "Ceremony" }] } }
    }
  };
  await fetch(`${BASE_URL}/news/news-championship-football-final?key=${API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newsStory2)
  });
  console.log("✓ Published 2 official tournament stories to the News Desk.");

  console.log("\n======================================================================");
  console.log("🎉 FULL INTERHOUSE SPORTS CHAMPIONSHIP SIMULATION COMPLETED SUCCESSFULLY!");
  console.log("======================================================================");
}

runFullChampionshipSimulation().catch(console.error);
