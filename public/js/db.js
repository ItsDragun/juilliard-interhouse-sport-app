/**
 * Database & Realtime Sync Layer for Juilliard Interhouse Sports Day
 * Firestore collections: 'houses', 'events', 'activity_logs', 'settings'
 * Includes seamless LocalStorage fallback and automatic self-healing seed.
 */

import { getFirebaseInstances } from "./firebase-config.js";
import { 
  INITIAL_HOUSES, 
  INITIAL_EVENTS, 
  INITIAL_STUDENTS, 
  DEMO_SAMPLE_SCORES,
  INITIAL_PREFECTORIAL_TEAMS,
  INITIAL_PREFECTORIAL_EVENTS
} from "./seed-data.js";
import { INITIAL_NEWS } from "./seed-news.js";
import { playWhistleSound, playScoreCelebration } from "./audio.js";
import { getCurrentAdmin, formatAdminTimestamp, getAdminLoginHistory } from "./auth.js";

const LOCAL_STORAGE_KEY_HOUSES = "juilliard_sports_houses_v3";
const LOCAL_STORAGE_KEY_EVENTS = "juilliard_sports_events_v3";
const LOCAL_STORAGE_KEY_ACTIVITY = "juilliard_sports_activity_v3";
const LOCAL_STORAGE_KEY_STUDENTS = "juilliard_sports_students_v6";
const LOCAL_STORAGE_KEY_NEWS = "juilliard_sports_news_v2";
const LOCAL_STORAGE_KEY_AUDIT_LOGS = "juilliard_admin_audit_logs_v1";

const LOCAL_STORAGE_KEY_PREF_TEAMS = "juilliard_prefectorial_teams_v1";
const LOCAL_STORAGE_KEY_PREF_EVENTS = "juilliard_prefectorial_events_v1";
const LOCAL_STORAGE_KEY_ACTIVE_COMP = "juilliard_active_competition";

let unsubs = [];
let localHouses = null;
let localEvents = null;
let localPrefTeams = null;
let localPrefEvents = null;
let localActivity = [];
let localStudents = null;
let localNews = null;
let localAuditLogs = [];
let auditListeners = [];
let activeSportsDataListeners = null;

export function getActiveCompetition() {
  if (typeof localStorage !== "undefined") {
    const comp = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_COMP);
    if (comp === "prefectorial" || comp === "prefectship") return "prefectorial";
    if (comp === "interhouse") return comp;
  }
  return "interhouse";
}

export function setActiveCompetition(comp) {
  const normalized = (comp === "prefectship") ? "prefectorial" : comp;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_COMP, normalized);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("competitionChanged", { detail: { competition: normalized } }));
  }
}

export function isPrefectorialCup() {
  return getActiveCompetition() === "prefectorial";
}
export const isPrefectshipCup = isPrefectorialCup;

export function getPrefectorialTeams() {
  if (!localPrefTeams) getLocalFallback();
  return localPrefTeams || INITIAL_PREFECTORIAL_TEAMS;
}
export const getPrefectshipTeams = getPrefectorialTeams;

export function getPrefectorialEvents() {
  if (!localPrefEvents) getLocalFallback();
  return localPrefEvents || INITIAL_PREFECTORIAL_EVENTS;
}
export const getPrefectshipEvents = getPrefectorialEvents;

if (typeof window !== "undefined") {
  window.getActiveCompetition = getActiveCompetition;
  window.setActiveCompetition = setActiveCompetition;
  window.isPrefectorialCup = isPrefectorialCup;
  window.isPrefectshipCup = isPrefectshipCup;
  window.getPrefectorialTeams = getPrefectorialTeams;
  window.getPrefectshipTeams = getPrefectshipTeams;
  window.getPrefectorialEvents = getPrefectorialEvents;
  window.getPrefectshipEvents = getPrefectshipEvents;
}

/**
 * Sanitize news item media URLs to replace dead/forbidden remote URLs
 * with local project assets.
 */
export function sanitizeNewsItem(item) {
  if (!item || typeof item !== "object") return item;
  let mediaUrl = item.mediaUrl || "";
  let updated = false;

  if (mediaUrl.includes("commondatastorage.googleapis.com") || mediaUrl.includes("ForBiggerBlazes") || (item.id === "news-001" && (!mediaUrl || mediaUrl.includes("sample")))) {
    mediaUrl = "assets/videos/football-highlight.mp4";
    updated = true;
  } else if (mediaUrl.includes("ForBiggerEscapes") || (item.id === "news-003" && (!mediaUrl || mediaUrl.includes("sample")))) {
    mediaUrl = "assets/videos/basketball-highlight.mp4";
    updated = true;
  }

  if (updated) {
    return { ...item, mediaUrl };
  }
  return item;
}

export function isPlaceholderNewsItem(item) {
  if (!item || typeof item !== "object") return true;
  const id = String(item.id || "");
  if (id.startsWith("mock-")) return true;
  const title = String(item.title || "").toLowerCase();
  if (title.includes("lorem ipsum")) return true;
  return false;
}

export function sanitizeNewsList(list) {
  if (!Array.isArray(list)) return { cleaned: [], modified: false };
  let modified = false;
  const cleaned = list
    .filter(item => !isPlaceholderNewsItem(item))
    .map(item => {
      const sanitized = sanitizeNewsItem(item);
      if (sanitized !== item) modified = true;
      return sanitized;
    });
  return { cleaned, modified };
}

export function sanitizeStudentsList(list) {
  if (!Array.isArray(list)) return JSON.parse(JSON.stringify(INITIAL_STUDENTS));
  return list.filter(s => {
    const isMockId = (s.id || '').startsWith('stu-ea-') || (s.id || '').startsWith('stu-me-') || (s.id || '').startsWith('stu-ph-') || (s.id || '').startsWith('stu-sw-');
    const isMockGrade = (s.grade || '').toLowerCase().includes('grade');
    return !isMockId && !isMockGrade;
  }).map(s => {
    const canonical = INITIAL_STUDENTS.find(cs => cs.id === s.id || (cs.name && cs.name.toLowerCase() === (s.name || '').toLowerCase()));
    return {
      ...s,
      houseId: (canonical && canonical.houseId && canonical.houseId !== 'general') ? canonical.houseId : (s.houseId || 'general'),
      gender: (canonical && canonical.gender && canonical.gender !== 'General') ? canonical.gender : (s.gender || 'General')
    };
  });
}

/**
 * Load fallback data from localStorage or initial seed
 */
function getLocalFallback() {
  try {
    const STORAGE_RESET_KEY = "ja_sports_reset_clean_slate_2026_v17";
    if (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_RESET_KEY) !== "clean_reset_v17") {
      localStorage.removeItem(LOCAL_STORAGE_KEY_HOUSES);
      localStorage.removeItem(LOCAL_STORAGE_KEY_EVENTS);
      localStorage.removeItem(LOCAL_STORAGE_KEY_PREF_TEAMS);
      localStorage.removeItem(LOCAL_STORAGE_KEY_PREF_EVENTS);
      localStorage.removeItem(LOCAL_STORAGE_KEY_NEWS);
      localStorage.removeItem("juilliard_supported_house");
      localStorage.removeItem("juilliard_supported_pref_team");
      localStorage.removeItem("juilliard_active_competition");
      localStorage.removeItem("ja_sports_pref_firestore_reset_v16");
      localStorage.setItem(STORAGE_RESET_KEY, "clean_reset_v17");
      if (typeof window !== "undefined") {
        window._needsFirestorePrefReset = true;
      }
    }

    // Delete any stale IndexedDB cache left over from Firestore offline persistence
    if (typeof window !== "undefined" && window.indexedDB) {
      try {
        window.indexedDB.deleteDatabase("firestore/[DEFAULT]/ja-mega-26/main");
      } catch (e) {}
    }

    const rawHouses = localStorage.getItem(LOCAL_STORAGE_KEY_HOUSES);
    const rawEvents = localStorage.getItem(LOCAL_STORAGE_KEY_EVENTS);
    const rawPrefTeams = localStorage.getItem(LOCAL_STORAGE_KEY_PREF_TEAMS);
    const rawPrefEvents = localStorage.getItem(LOCAL_STORAGE_KEY_PREF_EVENTS);
    const rawActivity = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVITY);
    const rawStudents = localStorage.getItem(LOCAL_STORAGE_KEY_STUDENTS);
    const rawNews = localStorage.getItem(LOCAL_STORAGE_KEY_NEWS);
    const rawAuditLogs = localStorage.getItem(LOCAL_STORAGE_KEY_AUDIT_LOGS);

    localHouses = rawHouses ? JSON.parse(rawHouses) : JSON.parse(JSON.stringify(INITIAL_HOUSES));
    localEvents = rawEvents ? JSON.parse(rawEvents) : JSON.parse(JSON.stringify(INITIAL_EVENTS));

    // Prefectorial Cup pristine clean slate guarantee
    localPrefTeams = JSON.parse(JSON.stringify(INITIAL_PREFECTORIAL_TEAMS));
    localPrefEvents = JSON.parse(JSON.stringify(INITIAL_PREFECTORIAL_EVENTS));
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PREF_TEAMS, JSON.stringify(localPrefTeams));
      localStorage.setItem(LOCAL_STORAGE_KEY_PREF_EVENTS, JSON.stringify(localPrefEvents));
    } catch (e) {}

    // Self-healing guard: If localEvents has fewer events than INITIAL_EVENTS or lacks tournament structure, heal to INITIAL_EVENTS!
    const completedCount = Array.isArray(localEvents) ? localEvents.filter(e => e.status === "completed" || e.results).length : 0;
    const hasTournamentStructure = Array.isArray(localEvents) && localEvents.some(e => e.id === "fb-group-md1-m1");
    if (!Array.isArray(localEvents) || localEvents.length < INITIAL_EVENTS.length || completedCount < 30 || !hasTournamentStructure) {
      localEvents = JSON.parse(JSON.stringify(INITIAL_EVENTS));
      try { localStorage.setItem(LOCAL_STORAGE_KEY_EVENTS, JSON.stringify(localEvents)); } catch (err) {}
    }

    // Ensure all events strictly strip points for non-football/basketball competitions
    localEvents = (localEvents || []).map(sanitizeEventPoints);
    localPrefEvents = (localPrefEvents || []).map(sanitizeEventPoints);

    // Self-healing guard: If Phoenix has fewer than 13 gold in localHouses, heal to INITIAL_HOUSES!
    const phoenix = Array.isArray(localHouses) ? localHouses.find(h => h.id === "phoenix") : null;
    if (!phoenix || (phoenix.goldCount !== undefined && phoenix.goldCount < 10)) {
      localHouses = JSON.parse(JSON.stringify(INITIAL_HOUSES));
      try { localStorage.setItem(LOCAL_STORAGE_KEY_HOUSES, JSON.stringify(localHouses)); } catch (err) {}
    }
    localStudents = rawStudents ? sanitizeStudentsList(JSON.parse(rawStudents)) : JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    const parsedNews = rawNews ? JSON.parse(rawNews) : [];
    // Purge any mock/dummy news items
    localNews = Array.isArray(parsedNews) ? parsedNews.filter(n => !isPlaceholderNewsItem(n)) : [];
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_NEWS, JSON.stringify(localNews));
    } catch (err) {}
    localActivity = rawActivity ? JSON.parse(rawActivity) : [
      {
        id: "log-init",
        timestamp: new Date().toISOString(),
        title: "Championship Opened",
        text: "Juilliard Interhouse Sports Day live scoreboard is online! Ready for action.",
        houseId: "phoenix"
      }
    ];

    if (rawAuditLogs) {
      try {
        localAuditLogs = JSON.parse(rawAuditLogs);
      } catch (err) {
        localAuditLogs = [];
      }
    } else {
      localAuditLogs = [];
    }

    if (!localAuditLogs || localAuditLogs.length === 0) {
      localAuditLogs = bootstrapInitialAuditLogs(localEvents || INITIAL_EVENTS);
    }
  } catch (e) {
    localHouses = JSON.parse(JSON.stringify(INITIAL_HOUSES));
    localEvents = JSON.parse(JSON.stringify(INITIAL_EVENTS));
    localPrefTeams = JSON.parse(JSON.stringify(INITIAL_PREFECTORIAL_TEAMS));
    localPrefEvents = JSON.parse(JSON.stringify(INITIAL_PREFECTORIAL_EVENTS));
    localStudents = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    const { cleaned } = sanitizeNewsList(JSON.parse(JSON.stringify(INITIAL_NEWS)));
    localNews = cleaned;
    localActivity = [];
    localAuditLogs = bootstrapInitialAuditLogs(localEvents || INITIAL_EVENTS);
  }
}

function saveLocalFallback() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_HOUSES, JSON.stringify(localHouses));
    localStorage.setItem(LOCAL_STORAGE_KEY_EVENTS, JSON.stringify(localEvents));
    localStorage.setItem(LOCAL_STORAGE_KEY_PREF_TEAMS, JSON.stringify(localPrefTeams));
    localStorage.setItem(LOCAL_STORAGE_KEY_PREF_EVENTS, JSON.stringify(localPrefEvents));
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVITY, JSON.stringify(localActivity));
    localStorage.setItem(LOCAL_STORAGE_KEY_STUDENTS, JSON.stringify(localStudents));
    localStorage.setItem(LOCAL_STORAGE_KEY_NEWS, JSON.stringify(localNews));
    localStorage.setItem(LOCAL_STORAGE_KEY_AUDIT_LOGS, JSON.stringify(localAuditLogs));
  } catch (e) {
    console.debug("Error saving local fallback", e);
  }
}

/**
 * Bootstrap initial audit logs from completed events and admin login history
 */
function bootstrapInitialAuditLogs(eventsList) {
  const initialLogs = [];
  const now = new Date();

  // 1. Completed events with scores/placings
  if (Array.isArray(eventsList)) {
    eventsList.forEach(ev => {
      if ((ev.status === "completed" || ev.status === "done") && ev.results) {
        const p1 = ev.results.first;
        const p2 = ev.results.second;
        const p3 = ev.results.third;
        const p4 = ev.results.fourth;
        const editInfo = ev.lastEditedBy || {
          adminId: "ADM-001",
          name: "Admin",
          email: "davidfestusugwu@gmail.com",
          role: "super_admin"
        };
        const dt = ev.completedAt ? new Date(ev.completedAt) : (ev.updatedAt ? new Date(ev.updatedAt) : now);

        let details = "";
        if (ev.format === "h2h" && ev.contenders && ev.contenders.length === 2) {
          details = `1v1 Match Result: ${ev.contenders[0].toUpperCase()} vs ${ev.contenders[1].toUpperCase()} (${p1?.score || ''}). Winner: ${p1?.houseId?.toUpperCase() || ''} (${p1?.points || 0} pts)`;
        } else {
          details = `1st: ${p1?.houseId?.toUpperCase()} (${p1?.points || 0} pts, ${p1?.athlete || 'Athlete'}) • 2nd: ${p2?.houseId?.toUpperCase()} (${p2?.points || 0} pts, ${p2?.athlete || 'Athlete'}) • 3rd: ${p3?.houseId?.toUpperCase()} (${p3?.points || 0} pts) • 4th: ${p4?.houseId?.toUpperCase()} (${p4?.points || 0} pts)`;
        }

        initialLogs.push({
          id: "audit-init-ev-" + ev.id,
          type: "score_submission",
          title: `${ev.name} — Score Published`,
          details,
          summary: `Official results published for ${ev.name}`,
          adminId: editInfo.adminId || "ADM-001",
          adminName: editInfo.name || "Admin",
          adminEmail: editInfo.email || "davidfestusugwu@gmail.com",
          adminRole: editInfo.role || "super_admin",
          eventId: ev.id,
          eventName: ev.name,
          houseId: p1?.houseId || null,
          timestamp: dt.toISOString(),
          formattedTime: formatAdminTimestamp(dt),
          metadata: { placings: ev.results, status: ev.status }
        });
      }
    });
  }

  // 2. Admin login logs from local history
  try {
    const loginHistory = getAdminLoginHistory();
    if (Array.isArray(loginHistory) && loginHistory.length > 0) {
      loginHistory.slice(0, 10).forEach(lh => {
        initialLogs.push({
          id: "audit-init-login-" + (lh.timestamp || Math.random()),
          type: "admin_login",
          title: `Admin Login: ${lh.adminName || 'Admin'} (${lh.adminId || 'ADM-001'})`,
          details: `Official verified login session opened for ${lh.adminEmail || 'davidfestusugwu@gmail.com'} (${lh.title || 'System Administrator'}).`,
          summary: `Admin session started by ${lh.adminName || 'Admin'}`,
          adminId: lh.adminId || "ADM-001",
          adminName: lh.adminName || "Admin",
          adminEmail: lh.adminEmail || "davidfestusugwu@gmail.com",
          adminRole: "super_admin",
          timestamp: lh.timestamp || now.toISOString(),
          formattedTime: lh.formatted || formatAdminTimestamp(new Date(lh.timestamp || now)),
          metadata: { type: "login" }
        });
      });
    }
  } catch (err) {}

  // 3. System activation milestone
  initialLogs.push({
    id: "audit-init-system",
    type: "system_init",
    title: "Championship Scoring System Activated",
    details: "Juilliard Interhouse Sports Day official scoring registry and audit trail initialized.",
    summary: "System initialized and ready for live sports day officiating.",
    adminId: "ADM-001",
    adminName: "Admin",
    adminEmail: "davidfestusugwu@gmail.com",
    adminRole: "super_admin",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    formattedTime: formatAdminTimestamp(new Date(Date.now() - 3600000)),
    metadata: { system: "Juilliard Sports Day 2026" }
  });

  initialLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return initialLogs;
}

function notifyAuditListeners() {
  auditListeners.forEach(cb => {
    try {
      if (typeof cb === "function") cb(localAuditLogs);
    } catch (e) {
      console.error("Audit listener error:", e);
    }
  });
}

/**
 * Retrieve all recorded audit logs (sorted newest first)
 */
export function getAuditLogs() {
  if (!localAuditLogs || localAuditLogs.length === 0) {
    getLocalFallback();
  }
  return localAuditLogs || [];
}

/**
 * Record a verified audit log for any official judge or admin action
 */
export async function recordAuditLog({
  type = "score_submission",
  title = "Official Action",
  details = "",
  summary = "",
  adminId = null,
  adminName = null,
  adminEmail = null,
  adminRole = null,
  eventId = null,
  eventName = null,
  houseId = null,
  metadata = {}
}) {
  const currentAdmin = getCurrentAdmin();
  const aid = adminId || (currentAdmin?.adminId || currentAdmin?.id || "ADM-001");
  const aname = adminName || (currentAdmin?.name || "Admin");
  const aemail = adminEmail || (currentAdmin?.email || "davidfestusugwu@gmail.com");
  const arole = adminRole || (currentAdmin?.role || "super_admin");
  const now = new Date();

  const logEntry = {
    id: "audit-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    type,
    title,
    details: details || summary,
    summary: summary || details,
    adminId: aid,
    adminName: aname,
    adminEmail: aemail,
    adminRole: arole,
    eventId: eventId || null,
    eventName: eventName || null,
    houseId: houseId || null,
    timestamp: now.toISOString(),
    formattedTime: formatAdminTimestamp(now),
    metadata: metadata || {}
  };

  getLocalFallback();
  localAuditLogs.unshift(logEntry);
  if (localAuditLogs.length > 300) {
    localAuditLogs = localAuditLogs.slice(0, 300);
  }
  saveLocalFallback();
  notifyAuditListeners();

  // Sync to Firestore admin_audit_logs collection
  const { db, isConnected } = getFirebaseInstances();
  if (isConnected && db) {
    try {
      await db.collection("admin_audit_logs").add(logEntry);
    } catch (err) {
      console.warn("Could not save audit log to Firestore:", err);
    }
  }

  return logEntry;
}

/**
 * Subscribe to realtime Audit Logs
 */
export function subscribeToAuditLogs(callback) {
  auditListeners.push(callback);
  getLocalFallback();
  callback(localAuditLogs);

  const { db, isConnected } = getFirebaseInstances();
  if (!isConnected || !db) {
    return () => {
      auditListeners = auditListeners.filter(cb => cb !== callback);
    };
  }

  const unsub = db.collection("admin_audit_logs").orderBy("timestamp", "desc").limit(100).onSnapshot((snapshot) => {
    if (!snapshot.empty) {
      const remoteLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const logMap = new Map();
      remoteLogs.forEach(l => logMap.set(l.id || l.timestamp, l));
      localAuditLogs.forEach(l => {
        const key = l.id || l.timestamp;
        if (!logMap.has(key)) logMap.set(key, l);
      });
      localAuditLogs = Array.from(logMap.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      saveLocalFallback();
      notifyAuditListeners();
    }
  }, (err) => {
    console.warn("Audit logs firestore listen error (using local):", err);
  });

  return () => {
    if (typeof unsub === "function") unsub();
    auditListeners = auditListeners.filter(cb => cb !== callback);
  };
}

/**
 * Clear all audit logs (Admin authorized)
 */
export async function clearAuditLogs() {
  localAuditLogs = [];
  saveLocalFallback();
  notifyAuditListeners();

  const { db, isConnected } = getFirebaseInstances();
  if (isConnected && db) {
    try {
      const snap = await db.collection("admin_audit_logs").limit(100).get();
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.warn("Could not clear remote audit logs:", e);
    }
  }
  return { success: true };
}

if (typeof window !== "undefined") {
  window.recordAuditLog = recordAuditLog;
  window.getAuditLogs = getAuditLogs;
}

/**
 * Event status helpers. The app historically used two vocabularies for the same
 * states ("completed"/"done" and "live"/"in_progress"); these normalise them.
 */
export function isEventCompleted(ev) {
  return Boolean(ev) && (ev.status === "completed" || ev.status === "done");
}

export function isEventLive(ev) {
  return Boolean(ev) && !isEventCompleted(ev) &&
    (ev.status === "live" || ev.status === "in_progress" || ev.isLive === true);
}

/**
 * Parse a "2 - 2" style head-to-head score string into [scoreA, scoreB].
 * Returns null when the score can't be read as two numbers.
 */
export function parseVersusScore(score) {
  if (typeof score !== "string" || !score.includes("-")) return null;
  const parts = score.split("-").map(p => parseInt(p.trim(), 10));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return [parts[0], parts[1]];
}

/**
 * A result is a draw only for head-to-head events whose two scores are equal.
 * (A 4-house race can never be "drawn" for medal purposes.)
 */
export function isDrawnResult(ev) {
  if (!ev || !ev.results) return false;
  const isH2H = ev.format === "h2h" || (Array.isArray(ev.contenders) && ev.contenders.length === 2);
  if (!isH2H) return false;
  if (ev.results.isDraw === true) return true;
  const parsed = parseVersusScore(ev.results.first?.score);
  return Boolean(parsed) && parsed[0] === parsed[1];
}

/**
 * Check if an event is a ball sport (Football or Basketball).
 * ONLY Football & Basketball use the points system. All other events (Track, Field, Novelty)
 * award Medals (Gold, Silver, Bronze, 4th) with NO points.
 */
export function isBallSportEvent(ev) {
  if (!ev) return false;
  const name = (ev.name || "").toLowerCase();
  const cat = (ev.category || "").toLowerCase();
  return name.includes("football") || cat.includes("football") ||
         name.includes("soccer") || cat.includes("soccer") ||
         name.includes("basketball") || cat.includes("basketball");
}

/**
 * Sanitize event to strictly eliminate points for non-football/basketball events
 */
export function sanitizeEventPoints(ev) {
  if (!ev) return ev;
  const copy = { ...ev };
  if (!isBallSportEvent(copy)) {
    copy.pointsMatrix = { first: 0, second: 0, third: 0, fourth: 0 };
    if (copy.results) {
      copy.results = { ...copy.results };
      if (copy.results.first) copy.results.first = { ...copy.results.first, points: null };
      if (copy.results.second) copy.results.second = { ...copy.results.second, points: null };
      if (copy.results.third) copy.results.third = { ...copy.results.third, points: null };
      if (copy.results.fourth) copy.results.fourth = { ...copy.results.fourth, points: null };
    }
  }
  return copy;
}

/**
 * Recalculate all house point totals & medal counts based on completed events
 */
export function calculateHouseStandings(housesList, eventsList) {
  const houseMap = {};
  housesList.forEach(h => {
    houseMap[h.id] = {
      ...h,
      totalPoints: 0,
      trackPoints: 0,
      fieldPoints: 0,
      noveltyPoints: 0,
      teamPoints: 0, // Exclusively for Football & Basketball points
      goldCount: 0,
      silverCount: 0,
      bronzeCount: 0,
      fourthCount: 0,
      totalMedals: 0,
      playedCount: 0,
      teamPlayed: 0,
      teamWins: 0,
      teamDraws: 0,
      teamLosses: 0,
      teamGoalsFor: 0,
      teamGoalsAgainst: 0,
      eventsWon: []
    };
  });

  (eventsList || []).forEach(rawEv => {
    const ev = sanitizeEventPoints(rawEv);
    if ((ev.status === "completed" || ev.status === "done") && ev.results) {
      const res = ev.results;
      const isFootballOrBasketball = isBallSportEvent(ev);

      // Track participants played count
      const housesInEvent = new Set();
      if (res.first?.houseId) housesInEvent.add(res.first.houseId);
      if (res.second?.houseId) housesInEvent.add(res.second.houseId);
      if (res.third?.houseId) housesInEvent.add(res.third.houseId);
      if (res.fourth?.houseId) housesInEvent.add(res.fourth.houseId);
      if (ev.contenders && Array.isArray(ev.contenders)) {
        ev.contenders.forEach(cid => { if (cid) housesInEvent.add(cid); });
      }
      housesInEvent.forEach(hid => {
        if (houseMap[hid]) {
          houseMap[hid].playedCount += 1;
          if (isFootballOrBasketball) houseMap[hid].teamPlayed += 1;
        }
      });

      // A drawn head-to-head match has no winner, so it must not award any medals.
      const drawn = isDrawnResult(ev);
      const isBallSport = isBallSportEvent(ev);
      const isFinal = isBallSport && ((ev.knockoutRound === "final") || ((ev.name || "").toLowerCase().includes("final") && !(ev.name || "").toLowerCase().includes("semi")));
      const isThirdPlaceMatch = isBallSport && ((ev.knockoutRound === "third_place") || (ev.name || "").toLowerCase().includes("3rd place") || (ev.name || "").toLowerCase().includes("bronze"));
      const isPreliminaryBallMatch = isBallSport && !isFinal && !isThirdPlaceMatch;

      if (!drawn && !isPreliminaryBallMatch) {
        if (isThirdPlaceMatch) {
          // Winner of 3rd place match gets Bronze medal
          if (res.first && res.first.houseId && houseMap[res.first.houseId]) {
            houseMap[res.first.houseId].bronzeCount += 1;
            houseMap[res.first.houseId].eventsWon.push(ev.name);
          }
        } else {
          // 1st place awards Gold medal
          if (res.first && res.first.houseId && houseMap[res.first.houseId]) {
            houseMap[res.first.houseId].goldCount += 1;
            houseMap[res.first.houseId].eventsWon.push(ev.name);
          }
          // 2nd place awards Silver medal
          if (res.second && res.second.houseId && houseMap[res.second.houseId]) {
            houseMap[res.second.houseId].silverCount += 1;
          }
          // 3rd place awards Bronze medal (for multi-house events)
          if (res.third && res.third.houseId && houseMap[res.third.houseId]) {
            houseMap[res.third.houseId].bronzeCount += 1;
          }
          // 4th place
          if (res.fourth && res.fourth.houseId && houseMap[res.fourth.houseId]) {
            houseMap[res.fourth.houseId].fourthCount += 1;
          }
        }
      }

      // ONLY Football & Basketball have a point system
      if (isFootballOrBasketball) {
        const house1Id = res.first?.houseId || ev.contenders?.[0];
        const house2Id = res.second?.houseId || ev.contenders?.[1];

        let score1 = 0;
        let score2 = 0;
        const versus = parseVersusScore(res.first?.score);
        if (versus) {
          [score1, score2] = versus;
        } else {
          score1 = parseInt(res.first?.score, 10) || 0;
          score2 = parseInt(res.second?.score, 10) || 0;
        }

        const isDraw = drawn || (score1 === score2 && res.first?.score !== undefined);

        if (house1Id && houseMap[house1Id]) {
          if (isDraw) {
            houseMap[house1Id].teamPoints += 1;
            houseMap[house1Id].teamDraws += 1;
          } else {
            const winPts = (res.first?.points && res.first.points <= 10) ? Number(res.first.points) : 3;
            houseMap[house1Id].teamPoints += winPts;
            houseMap[house1Id].teamWins += 1;
          }
          houseMap[house1Id].teamGoalsFor += score1;
          houseMap[house1Id].teamGoalsAgainst += score2;
        }

        if (house2Id && houseMap[house2Id]) {
          if (isDraw) {
            houseMap[house2Id].teamPoints += 1;
            houseMap[house2Id].teamDraws += 1;
          } else {
            houseMap[house2Id].teamLosses += 1;
          }
          houseMap[house2Id].teamGoalsFor += score2;
          houseMap[house2Id].teamGoalsAgainst += score1;
        }
      }
    }
  });

  const updatedHouses = Object.values(houseMap);
  updatedHouses.forEach(h => {
    h.totalMedals = (h.goldCount || 0) + (h.silverCount || 0) + (h.bronzeCount || 0);
    h.totalPoints = h.teamPoints || 0; // Purely Football & Basketball points
  });

  // Sort primarily by Interhouse Medal Standings:
  // 1. Gold medals
  // 2. Silver medals
  // 3. Bronze medals
  // 4. Total medals
  // 5. Team points (Football & Basketball point system)
  // 6. 4th finishes
  updatedHouses.sort((a, b) => {
    if (b.goldCount !== a.goldCount) return b.goldCount - a.goldCount;
    if (b.silverCount !== a.silverCount) return b.silverCount - a.silverCount;
    if (b.bronzeCount !== a.bronzeCount) return b.bronzeCount - a.bronzeCount;
    if (b.totalMedals !== a.totalMedals) return b.totalMedals - a.totalMedals;
    if (b.teamPoints !== a.teamPoints) return b.teamPoints - a.teamPoints;
    return (b.fourthCount || 0) - (a.fourthCount || 0);
  });

  return updatedHouses;
}

/**
 * Subscribe to realtime Firestore updates
 */
export function subscribeToSportsData({ onHousesChange, onEventsChange, onActivityChange, onStudentsChange, onStatusChange }) {
  getLocalFallback();
  activeSportsDataListeners = { onHousesChange, onEventsChange, onActivityChange, onStudentsChange, onStatusChange };

  // Calculate standings for both competitions
  const initialStandings = calculateHouseStandings(localHouses, localEvents);
  const initialPrefStandings = calculateHouseStandings(localPrefTeams, localPrefEvents);

  window.currentHousesCache = initialStandings;
  window.currentEventsCache = localEvents;
  window.currentPrefTeamsCache = initialPrefStandings;
  window.currentPrefEventsCache = localPrefEvents;

  // Immediately dispatch local fallback data matching active competition
  if (isPrefectorialCup()) {
    if (onHousesChange) onHousesChange(initialPrefStandings);
    if (onEventsChange) onEventsChange(localPrefEvents);
  } else {
    if (onHousesChange) onHousesChange(initialStandings);
    if (onEventsChange) onEventsChange(localEvents);
  }
  if (onActivityChange) onActivityChange(localActivity);
  if (onStudentsChange) onStudentsChange(localStudents || INITIAL_STUDENTS);

  const { db, isConnected } = getFirebaseInstances();

  if (!isConnected || !db) {
    if (onStatusChange) onStatusChange({ connected: false, mode: "local" });
    // Retry subscribing when Firebase SDK initializes on window
    const retryInterval = setInterval(() => {
      const inst = getFirebaseInstances();
      if (inst.isConnected && inst.db) {
        clearInterval(retryInterval);
        subscribeToSportsData({ onHousesChange, onEventsChange, onActivityChange, onStudentsChange, onStatusChange });
      }
    }, 400);
    setTimeout(() => clearInterval(retryInterval), 8000);
    return () => clearInterval(retryInterval);
  }

  if (onStatusChange) onStatusChange({ connected: true, mode: "live" });

  // Automatic clean slate reset for Prefectorial Cup tournament data
  if (typeof localStorage !== "undefined" && localStorage.getItem("ja_sports_pref_firestore_reset_v16") !== "done") {
    try {
      const cleanBatch = db.batch();
      INITIAL_PREFECTORIAL_TEAMS.forEach(team => {
        cleanBatch.set(db.collection("prefectorial_teams").doc(team.id), team);
      });
      INITIAL_PREFECTORIAL_EVENTS.forEach(ev => {
        cleanBatch.set(db.collection("prefectorial_events").doc(ev.id), ev);
      });
      cleanBatch.commit().then(() => {
        localStorage.setItem("ja_sports_pref_firestore_reset_v16", "done");
        console.log("[Juilliard] Successfully reset all Prefectorial data in Firestore to pristine clean slate!");
      }).catch(err => console.warn("Firestore clean batch error:", err));
    } catch (err) {
      console.warn("Could not initiate clean slate batch:", err);
    }
  }

  // Unsubscribe any previous listeners
  unsubs.forEach(u => typeof u === "function" && u());
  unsubs = [];

  let currentEvents = [];
  let currentRawHouses = [];
  let currentPrefEvents = [];
  let currentRawPrefTeams = [];

  // 1. Listen to INTERHOUSE HOUSES
  const unsubHouses = db.collection("houses").onSnapshot(async (snapshot) => {
    if (snapshot.empty) {
      console.log("Firestore 'houses' collection is empty. Seeding initial houses...");
      await seedInitialFirestoreData(db);
      return;
    }
    const incomingHouses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    currentRawHouses = incomingHouses;
    const baseEvents = (currentEvents && currentEvents.length >= INITIAL_EVENTS.length) ? currentEvents : (localEvents && localEvents.length >= INITIAL_EVENTS.length ? localEvents : INITIAL_EVENTS);
    const standings = calculateHouseStandings(currentRawHouses, baseEvents);
    window.currentHousesCache = standings;
    if (!isPrefectorialCup() && onHousesChange) onHousesChange(standings);
  }, (err) => {
    console.warn("Firestore houses listen error (using local cache):", err);
    if (onStatusChange) onStatusChange({ connected: false, mode: "cached" });
    const baseEvents = (currentEvents && currentEvents.length >= INITIAL_EVENTS.length) ? currentEvents : (localEvents && localEvents.length >= INITIAL_EVENTS.length ? localEvents : INITIAL_EVENTS);
    const baseHouses = (localHouses && localHouses.length === 4) ? localHouses : INITIAL_HOUSES;
    const standings = calculateHouseStandings(baseHouses, baseEvents);
    window.currentHousesCache = standings;
    if (!isPrefectorialCup() && onHousesChange) onHousesChange(standings);
  });
  unsubs.push(unsubHouses);

  // 2. Listen to INTERHOUSE EVENTS
  const unsubEvents = db.collection("events").onSnapshot((snapshot) => {
    if (snapshot.empty) {
      console.log("Firestore 'events' collection is empty. Seeding initial events...");
      seedInitialEvents(db);
      return;
    }
    const incomingEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter incoming events to only valid canonical events in INITIAL_EVENTS
    const validIncomingEvents = incomingEvents.filter(ev => INITIAL_EVENTS.some(ie => ie.id === ev.id));

    // Self-healing: if Firestore contains obsolete match documents or lacks tournament events, clean up and sync
    const hasTournamentEvents = snapshot.docs.some(d => d.id === "fb-group-md1-m1");
    const hasObsoleteDocs = incomingEvents.some(ev => !INITIAL_EVENTS.some(ie => ie.id === ev.id));
    if (!hasTournamentEvents || hasObsoleteDocs) {
      try {
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          if (!INITIAL_EVENTS.some(ie => ie.id === doc.id)) {
            batch.delete(doc.ref);
          }
        });
        INITIAL_EVENTS.forEach(ev => {
          const docRef = db.collection("events").doc(ev.id);
          batch.set(docRef, ev, { merge: true });
        });
        batch.commit().then(() => {
          console.log("[Juilliard] Successfully synchronized 12 tournament matches to Firestore!");
        }).catch(err => console.warn("Firestore tournament sync error:", err));
      } catch (err) {
        console.warn("Could not batch sync tournament events:", err);
      }
    }

    const mergedEvents = validIncomingEvents.map(ev => {
      const canonical = INITIAL_EVENTS.find(ie => ie.id === ev.id);
      if (canonical && (canonical.status === "completed" || canonical.results)) {
        if (!ev.results && ev.status !== "completed") {
          return { ...canonical, ...ev, results: canonical.results, status: canonical.status };
        }
      }
      return ev;
    });

    INITIAL_EVENTS.forEach(ie => {
      if (!mergedEvents.some(me => me.id === ie.id)) {
        mergedEvents.push(ie);
      }
    });

    const cleanedMergedEvents = mergedEvents.map(sanitizeEventPoints);
    cleanedMergedEvents.sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
    currentEvents = cleanedMergedEvents;
    localEvents = cleanedMergedEvents;
    saveLocalFallback();

    window.currentEventsCache = cleanedMergedEvents;
    if (!isPrefectorialCup() && onEventsChange) onEventsChange(cleanedMergedEvents);

    const baseHouses = (currentRawHouses && currentRawHouses.length > 0) ? currentRawHouses : (localHouses && localHouses.length > 0 ? localHouses : INITIAL_HOUSES);
    const standings = calculateHouseStandings(baseHouses, cleanedMergedEvents);
    window.currentHousesCache = standings;
    if (!isPrefectorialCup() && onHousesChange) onHousesChange(standings);
  }, (err) => {
    console.warn("Firestore events listen error (using local cache):", err);
    const safeEvents = ((localEvents && localEvents.length >= INITIAL_EVENTS.length) ? localEvents : INITIAL_EVENTS).map(sanitizeEventPoints);
    window.currentEventsCache = safeEvents;
    if (!isPrefectorialCup() && onEventsChange) onEventsChange(safeEvents);
    const baseHouses = (currentRawHouses && currentRawHouses.length > 0) ? currentRawHouses : (localHouses && localHouses.length > 0 ? localHouses : INITIAL_HOUSES);
    const standings = calculateHouseStandings(baseHouses, safeEvents);
    window.currentHousesCache = standings;
    if (!isPrefectorialCup() && onHousesChange) onHousesChange(standings);
  });
  unsubs.push(unsubEvents);

  // 3. Listen to PREFECTORIAL TEAMS
  const unsubPrefTeams = db.collection("prefectorial_teams").onSnapshot(async (snapshot) => {
    if (snapshot.empty) {
      console.log("Firestore 'prefectorial_teams' collection is empty. Seeding initial teams...");
      await seedInitialPrefectorialTeams(db);
      return;
    }
    const incomingTeams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    currentRawPrefTeams = incomingTeams.map(t => {
      const canonical = INITIAL_PREFECTORIAL_TEAMS.find(it => it.id === t.id);
      return canonical ? { ...canonical, ...t } : t;
    });
    const basePrefEvents = (currentPrefEvents && currentPrefEvents.length > 0) ? currentPrefEvents : (localPrefEvents || INITIAL_PREFECTORIAL_EVENTS);
    const standings = calculateHouseStandings(currentRawPrefTeams, basePrefEvents);
    window.currentPrefTeamsCache = standings;
    if (isPrefectorialCup() && onHousesChange) onHousesChange(standings);
  }, (err) => {
    console.warn("Firestore prefectorial_teams listen error (using local cache):", err);
    const baseTeams = (localPrefTeams && localPrefTeams.length === 4) ? localPrefTeams : INITIAL_PREFECTORIAL_TEAMS;
    const basePrefEvents = (localPrefEvents && localPrefEvents.length > 0) ? localPrefEvents : INITIAL_PREFECTORIAL_EVENTS;
    const standings = calculateHouseStandings(baseTeams, basePrefEvents);
    window.currentPrefTeamsCache = standings;
    if (isPrefectorialCup() && onHousesChange) onHousesChange(standings);
  });
  unsubs.push(unsubPrefTeams);

  // 4. Listen to PREFECTORIAL EVENTS
  const unsubPrefEvents = db.collection("prefectorial_events").onSnapshot(async (snapshot) => {
    if (snapshot.empty) {
      console.log("Firestore 'prefectorial_events' collection is empty. Seeding initial prefectorial events...");
      await seedInitialPrefectorialEvents(db);
      return;
    }
    const incomingEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const mergedPrefEvents = incomingEvents.map(ev => {
      const canonical = INITIAL_PREFECTORIAL_EVENTS.find(ie => ie.id === ev.id);
      // Clean slate guarantee: All Prefectship events are upcoming clean slate unless scored in current session
      if (canonical && (!window._adminScoresUpdated || !window._adminScoresUpdated[ev.id])) {
        return { ...canonical, status: "upcoming", results: null, isLive: false };
      }
      if (ev && ev.name && ev.name.includes("Prefectorial")) {
        ev = { ...ev, name: ev.name.replace(/Prefectorial/g, "Prefectship") };
      }
      return ev;
    });

    INITIAL_PREFECTORIAL_EVENTS.forEach(ie => {
      if (!mergedPrefEvents.some(me => me.id === ie.id)) {
        mergedPrefEvents.push(ie);
      }
    });

    const cleanedPrefEvents = mergedPrefEvents.map(sanitizeEventPoints);
    cleanedPrefEvents.sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
    currentPrefEvents = cleanedPrefEvents;
    localPrefEvents = cleanedPrefEvents;
    saveLocalFallback();

    window.currentPrefEventsCache = cleanedPrefEvents;
    if (isPrefectorialCup() && onEventsChange) onEventsChange(cleanedPrefEvents);

    const baseTeams = (currentRawPrefTeams && currentRawPrefTeams.length > 0) ? currentRawPrefTeams : (localPrefTeams || INITIAL_PREFECTORIAL_TEAMS);
    const standings = calculateHouseStandings(baseTeams, cleanedPrefEvents);
    window.currentPrefTeamsCache = standings;
    if (isPrefectorialCup() && onHousesChange) onHousesChange(standings);
  }, (err) => {
    console.warn("Firestore prefectorial_events listen error (using local cache):", err);
    const safePrefEvents = ((localPrefEvents && localPrefEvents.length > 0) ? localPrefEvents : INITIAL_PREFECTORIAL_EVENTS).map(sanitizeEventPoints);
    window.currentPrefEventsCache = safePrefEvents;
    if (isPrefectorialCup() && onEventsChange) onEventsChange(safePrefEvents);
    const baseTeams = (localPrefTeams && localPrefTeams.length > 0) ? localPrefTeams : INITIAL_PREFECTORIAL_TEAMS;
    const standings = calculateHouseStandings(baseTeams, safePrefEvents);
    window.currentPrefTeamsCache = standings;
    if (isPrefectorialCup() && onHousesChange) onHousesChange(standings);
  });
  unsubs.push(unsubPrefEvents);

  // Listen to STUDENTS
  const unsubStudents = db.collection("students").orderBy("name").onSnapshot(async (snapshot) => {
    if (snapshot.empty) {
      console.log("Firestore 'students' collection is empty. Seeding initial students...");
      await seedInitialStudents(db);
      return;
    }
    const currentStudents = sanitizeStudentsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    localStudents = currentStudents;
    saveLocalFallback();
    if (onStudentsChange) onStudentsChange(currentStudents);
  }, (err) => {
    console.warn("Firestore students listen error (using local cache):", err);
    if (onStudentsChange) onStudentsChange(localStudents || INITIAL_STUDENTS);
  });
  unsubs.push(unsubStudents);

  // Listen to ACTIVITY LOGS
  const unsubActivity = db.collection("activity_logs").orderBy("timestamp", "desc").limit(30).onSnapshot((snapshot) => {
    if (!snapshot.empty) {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      localActivity = logs;
      saveLocalFallback();
      if (onActivityChange) onActivityChange(logs);
    } else {
      if (onActivityChange) onActivityChange(localActivity);
    }
  }, (err) => {
    console.warn("Firestore activity listen error:", err);
    if (onActivityChange) onActivityChange(localActivity);
  });
  unsubs.push(unsubActivity);

  return () => {
    unsubs.forEach(u => typeof u === "function" && u());
    unsubs = [];
  };
}

// Global competition switch listener
if (typeof window !== "undefined") {
  window.addEventListener("competitionChanged", () => {
    if (!activeSportsDataListeners) return;
    if (isPrefectorialCup()) {
      const prefStandings = (window.currentPrefTeamsCache && window.currentPrefTeamsCache.length)
        ? window.currentPrefTeamsCache
        : calculateHouseStandings(currentRawPrefTeams || localPrefTeams || INITIAL_PREFECTORIAL_TEAMS, currentPrefEvents || localPrefEvents || INITIAL_PREFECTORIAL_EVENTS);
      const prefEvents = (window.currentPrefEventsCache && window.currentPrefEventsCache.length)
        ? window.currentPrefEventsCache
        : (currentPrefEvents || localPrefEvents || INITIAL_PREFECTORIAL_EVENTS);
      window.currentPrefTeamsCache = prefStandings;
      window.currentPrefEventsCache = prefEvents;
      if (activeSportsDataListeners.onHousesChange) activeSportsDataListeners.onHousesChange(prefStandings);
      if (activeSportsDataListeners.onEventsChange) activeSportsDataListeners.onEventsChange(prefEvents);
    } else {
      const validHouses = (window.currentHousesCache && window.currentHousesCache.length && !window.currentHousesCache.some(h => h.id && h.id.startsWith("team-")))
        ? window.currentHousesCache
        : (currentRawHouses && currentRawHouses.length > 0 ? currentRawHouses : (localHouses || INITIAL_HOUSES));
      const validEvents = (window.currentEventsCache && window.currentEventsCache.length && !window.currentEventsCache.some(e => e.id && e.id.startsWith("pref-")))
        ? window.currentEventsCache
        : (currentEvents && currentEvents.length >= 35 ? currentEvents : (localEvents || INITIAL_EVENTS));
      const houseStandings = calculateHouseStandings(validHouses, validEvents);
      window.currentHousesCache = houseStandings;
      window.currentEventsCache = validEvents;
      if (activeSportsDataListeners.onHousesChange) activeSportsDataListeners.onHousesChange(houseStandings);
      if (activeSportsDataListeners.onEventsChange) activeSportsDataListeners.onEventsChange(validEvents);
    }
  });
}

/**
 * Seed initial houses if Firestore collection is fresh
 */
async function seedInitialFirestoreData(db) {
  try {
    const batch = db.batch();
    INITIAL_HOUSES.forEach(house => {
      const ref = db.collection("houses").doc(house.id);
      batch.set(ref, house);
    });
    await batch.commit();
    console.log("Initial houses seeded in Firestore!");
  } catch (err) {
    console.error("Error seeding initial houses:", err);
  }
}

/**
 * Seed initial events if Firestore collection is fresh
 */
async function seedInitialEvents(db) {
  try {
    const batch = db.batch();
    INITIAL_EVENTS.forEach(ev => {
      const ref = db.collection("events").doc(ev.id);
      batch.set(ref, ev);
    });
    await batch.commit();
    console.log("Initial events seeded in Firestore!");
  } catch (err) {
    console.error("Error seeding initial events:", err);
  }
}

/**
 * Seed initial prefectorial teams if Firestore collection is fresh
 */
async function seedInitialPrefectorialTeams(db) {
  try {
    const batch = db.batch();
    INITIAL_PREFECTORIAL_TEAMS.forEach(team => {
      const ref = db.collection("prefectorial_teams").doc(team.id);
      batch.set(ref, team);
    });
    await batch.commit();
    console.log("Initial prefectorial teams seeded in Firestore!");
  } catch (err) {
    console.error("Error seeding prefectorial teams:", err);
  }
}

/**
 * Seed initial prefectorial events if Firestore collection is fresh
 */
async function seedInitialPrefectorialEvents(db) {
  try {
    const batch = db.batch();
    INITIAL_PREFECTORIAL_EVENTS.forEach(ev => {
      const ref = db.collection("prefectorial_events").doc(ev.id);
      batch.set(ref, ev);
    });
    await batch.commit();
    console.log("Initial prefectorial events seeded in Firestore!");
  } catch (err) {
    console.error("Error seeding prefectorial events:", err);
  }
}

/**
 * Seed initial students if Firestore collection is fresh
 */
async function seedInitialStudents(db) {
  try {
    const batch = db.batch();
    INITIAL_STUDENTS.forEach(stu => {
      const ref = db.collection("students").doc(stu.id);
      batch.set(ref, stu);
    });
    await batch.commit();
    console.log("Initial students seeded in Firestore!");
  } catch (err) {
    console.error("Error seeding initial students:", err);
  }
}

/**
 * Submit / Update Event Placings & Scores
 */
export async function submitEventScore(eventId, placings, status = "completed", notes = "", contenders = null) {
  const { db, isConnected } = getFirebaseInstances();
  playWhistleSound();

  const isPref = eventId.startsWith("pref-") || (localPrefEvents && localPrefEvents.some(e => e.id === eventId)) || isPrefectorialCup();
  const activeTeamsList = isPref ? (localPrefTeams || INITIAL_PREFECTORIAL_TEAMS) : (localHouses || INITIAL_HOUSES);
  const activeEventsList = isPref ? (localPrefEvents || INITIAL_PREFECTORIAL_EVENTS) : (localEvents || INITIAL_EVENTS);

  const currentAdmin = getCurrentAdmin();
  const auditInfo = currentAdmin ? {
    adminId: currentAdmin.id || currentAdmin.adminId || "ADM-001",
    name: currentAdmin.name || "Admin Official",
    email: currentAdmin.email || "",
    role: currentAdmin.role || "admin",
    editedAt: new Date().toISOString(),
    editedFormatted: formatAdminTimestamp(new Date())
  } : null;

  const eventPayload = {
    status: status || "completed",
    isLive: status === "live",
    results: placings,
    notes: notes,
    completedAt: status === "completed" ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
    ...(auditInfo ? {
      lastEditedBy: auditInfo,
      lastEditedAt: auditInfo.editedAt,
      lastEditedFormatted: auditInfo.editedFormatted
    } : {})
  };

  if (contenders && Array.isArray(contenders) && contenders.length) {
    eventPayload.contenders = contenders;
    eventPayload.format = "h2h";
  }

  // Find winner house/team name for activity announcement
  const winnerHouseId = placings.first?.houseId;
  const winnerHouse = activeTeamsList.find(h => h.id === winnerHouseId);
  const eventObj = activeEventsList.find(e => e.id === eventId);
  const eventTitle = eventObj ? eventObj.name : "Event";
  const isBall = isBallSportEvent(eventObj);

  // Eliminate points for non-football/basketball competitions
  if (!isBall && placings) {
    if (placings.first) placings.first.points = null;
    if (placings.second) placings.second.points = null;
    if (placings.third) placings.third.points = null;
    if (placings.fourth) placings.fourth.points = null;
  }

  const newLog = {
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    title: `${eventTitle} Completed!`,
    text: isBall
      ? `1st: ${winnerHouse ? winnerHouse.name : "Winner"} (${placings.first?.points || 3} pts) • ${placings.first?.athlete || "Athlete"}`
      : `1st: ${winnerHouse ? winnerHouse.name : "Winner"} (Gold Medal) • ${placings.first?.athlete || "Athlete"}`,
    houseId: winnerHouseId || null,
    competition: isPref ? "prefectorial" : "interhouse"
  };

  const isFinal = (status || "completed") === "completed";

  // Local sync first for zero-latency UI
  if (isPref) {
    if (localPrefEvents) {
      const evIdx = localPrefEvents.findIndex(e => e.id === eventId);
      if (evIdx >= 0) {
        localPrefEvents[evIdx] = { ...localPrefEvents[evIdx], ...eventPayload };
      }
    }
  } else {
    if (localEvents) {
      const evIdx = localEvents.findIndex(e => e.id === eventId);
      if (evIdx >= 0) {
        localEvents[evIdx] = { ...localEvents[evIdx], ...eventPayload };
      }
    }
  }
  if (isFinal) localActivity.unshift(newLog);

  // Record comprehensive audit log with exact placings and timestamp
  let placingsSummary = "";
  if (contenders && contenders.length === 2) {
    const h1 = activeTeamsList.find(h => h.id === contenders[0]);
    const h2 = activeTeamsList.find(h => h.id === contenders[1]);
    const scoreStr = placings?.first?.score || "";
    placingsSummary = `1v1 Match: ${h1 ? h1.name : "Team 1"} vs ${h2 ? h2.name : "Team 2"} (${scoreStr}) • Winner: ${winnerHouse ? winnerHouse.name : "None"} (${placings?.first?.points || 0} pts)`;
  } else {
    const p1 = placings?.first;
    const p2 = placings?.second;
    const p3 = placings?.third;
    const p4 = placings?.fourth;
    const h1 = activeTeamsList.find(h => h.id === p1?.houseId);
    const h2 = activeTeamsList.find(h => h.id === p2?.houseId);
    const h3 = activeTeamsList.find(h => h.id === p3?.houseId);
    const h4 = activeTeamsList.find(h => h.id === p4?.houseId);
    if (isBall) {
      placingsSummary = `1st: ${h1 ? h1.name : p1?.houseId} (${p1?.points || 0} pts${p1?.athlete ? ', ' + p1.athlete : ''}) • 2nd: ${h2 ? h2.name : p2?.houseId} (${p2?.points || 0} pts${p2?.athlete ? ', ' + p2.athlete : ''}) • 3rd: ${h3 ? h3.name : p3?.houseId} (${p3?.points || 0} pts${p3?.athlete ? ', ' + p3.athlete : ''}) • 4th: ${h4 ? h4.name : p4?.houseId} (${p4?.points || 0} pts${p4?.athlete ? ', ' + p4.athlete : ''})`;
    } else {
      placingsSummary = `1st: ${h1 ? h1.name : p1?.houseId} (Gold${p1?.athlete ? ', ' + p1.athlete : ''}) • 2nd: ${h2 ? h2.name : p2?.houseId} (Silver${p2?.athlete ? ', ' + p2.athlete : ''}) • 3rd: ${h3 ? h3.name : p3?.houseId} (Bronze${p3?.athlete ? ', ' + p3.athlete : ''}) • 4th: ${h4 ? h4.name : p4?.houseId} (4th${p4?.athlete ? ', ' + p4.athlete : ''})`;
    }
  }

  if (isFinal) recordAuditLog({
    type: "score_submission",
    title: `${eventTitle} — Score Published`,
    details: placingsSummary + (notes ? ` • Note: ${notes}` : ""),
    summary: `${status === "completed" ? "Official results published" : "Live score recorded"} for ${eventTitle}`,
    eventId,
    eventName: eventTitle,
    houseId: winnerHouseId,
    metadata: {
      competition: isPref ? "prefectorial" : "interhouse",
      status,
      placings,
      notes,
      contenders
    }
  });

  saveLocalFallback();

  if (!isConnected || !db) {
    setTimeout(playScoreCelebration, 300);
    return { success: true, mode: "local" };
  }

  try {
    const eventsCol = isPref ? "prefectorial_events" : "events";
    const teamsCol = isPref ? "prefectorial_teams" : "houses";

    // 1. Update event document
    await db.collection(eventsCol).doc(eventId).set(eventPayload, { merge: true });

    // 2. Add activity log (final results only)
    if (isFinal) await db.collection("activity_logs").add(newLog);

    // 3. Recalculate all house/team totals in Firestore
    const allEventsSnap = await db.collection(eventsCol).get();
    const allEvents = allEventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const allHousesSnap = await db.collection(teamsCol).get();
    const allHouses = allHousesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const updatedStandings = calculateHouseStandings(allHouses, allEvents);

    const batch = db.batch();
    updatedStandings.forEach(h => {
      const houseRef = db.collection(teamsCol).doc(h.id);
      batch.update(houseRef, {
        totalPoints: h.totalPoints,
        teamPoints: h.teamPoints || 0,
        teamWins: h.teamWins || 0,
        teamDraws: h.teamDraws || 0,
        teamLosses: h.teamLosses || 0,
        goldCount: h.goldCount,
        silverCount: h.silverCount,
        bronzeCount: h.bronzeCount,
        fourthCount: h.fourthCount
      });
    });
    await batch.commit();

    setTimeout(playScoreCelebration, 300);
    return { success: true, mode: "live" };
  } catch (err) {
    console.error("Error updating score in Firestore:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Update House/Team Roster (Captain, Teachers, Motto)
 */
export async function updateHouseRoster(houseId, data) {
  const { db, isConnected } = getFirebaseInstances();
  const isPref = houseId.startsWith("team-") || (localPrefTeams && localPrefTeams.some(h => h.id === houseId)) || isPrefectorialCup();
  const activeTeamsList = isPref ? (localPrefTeams || INITIAL_PREFECTORIAL_TEAMS) : (localHouses || INITIAL_HOUSES);

  // Local update
  if (isPref && localPrefTeams) {
    const idx = localPrefTeams.findIndex(h => h.id === houseId);
    if (idx >= 0) {
      localPrefTeams[idx] = { ...localPrefTeams[idx], ...data };
      saveLocalFallback();
    }
  } else if (!isPref && localHouses) {
    const idx = localHouses.findIndex(h => h.id === houseId);
    if (idx >= 0) {
      localHouses[idx] = { ...localHouses[idx], ...data };
      saveLocalFallback();
    }
  }

  const houseObj = activeTeamsList.find(h => h.id === houseId);
  const houseName = houseObj ? houseObj.name : (houseId ? houseId.toUpperCase() : "Team");
  recordAuditLog({
    type: "roster_update",
    title: `${houseName} Roster Updated`,
    details: `Captain: "${data.captain || 'Not set'}", Motto: "${data.motto || ''}", Patrons/Teachers: ${(data.teachers || []).join(", ") || 'None'}`,
    summary: `Roster saved for ${houseName}`,
    houseId,
    metadata: { competition: isPref ? "prefectorial" : "interhouse", houseId, captain: data.captain, teachers: data.teachers, motto: data.motto }
  });

  if (isConnected && db) {
    try {
      const teamsCol = isPref ? "prefectorial_teams" : "houses";
      await db.collection(teamsCol).doc(houseId).set(data, { merge: true });
      return { success: true };
    } catch (err) {
      console.error("Error updating roster in Firestore:", err);
      return { success: false, error: err.message };
    }
  }
  return { success: true, mode: "local" };
}

/**
 * Add or Update Event Definition
 */
export async function saveEventDefinition(eventData) {
  const { db, isConnected } = getFirebaseInstances();
  const isPref = (eventData.id && eventData.id.startsWith("pref-")) || isPrefectorialCup();
  const id = eventData.id || ((isPref ? "pref-event-" : "event-") + Date.now());
  const currentAdmin = getCurrentAdmin();
  const auditInfo = currentAdmin ? {
    adminId: currentAdmin.id || currentAdmin.adminId || "ADM-001",
    name: currentAdmin.name || "Admin Official",
    email: currentAdmin.email || "",
    role: currentAdmin.role || "admin",
    editedAt: new Date().toISOString(),
    editedFormatted: formatAdminTimestamp(new Date())
  } : null;

  const cleanData = sanitizeEventPoints({
    ...eventData,
    id,
    updatedAt: new Date().toISOString(),
    ...(auditInfo ? {
      lastEditedBy: auditInfo,
      lastEditedAt: auditInfo.editedAt,
      lastEditedFormatted: auditInfo.editedFormatted
    } : {})
  });

  if (isPref && localPrefEvents) {
    const idx = localPrefEvents.findIndex(e => e.id === id);
    if (idx >= 0) {
      localPrefEvents[idx] = { ...localPrefEvents[idx], ...cleanData };
    } else {
      localPrefEvents.push(cleanData);
    }
    saveLocalFallback();
  } else if (!isPref && localEvents) {
    const idx = localEvents.findIndex(e => e.id === id);
    if (idx >= 0) {
      localEvents[idx] = { ...localEvents[idx], ...cleanData };
    } else {
      localEvents.push(cleanData);
    }
    saveLocalFallback();
  }

  recordAuditLog({
    type: "event_setup",
    title: `${eventData.name || 'Event'} — Setup Saved`,
    details: `Category: "${eventData.category || 'Track'}", Gender: "${eventData.gender || 'All'}", Format: "${eventData.format || '4-houses'}".`,
    summary: `Configuration updated for ${eventData.name || 'Event'}`,
    eventId: id,
    eventName: eventData.name,
    metadata: { competition: isPref ? "prefectorial" : "interhouse", category: eventData.category, gender: eventData.gender, format: eventData.format }
  });

  if (isConnected && db) {
    try {
      const eventsCol = isPref ? "prefectorial_events" : "events";
      await db.collection(eventsCol).doc(id).set(cleanData, { merge: true });
      return { success: true, id };
    } catch (err) {
      console.error("Error saving event in Firestore:", err);
      return { success: false, error: err.message };
    }
  }
  return { success: true, id, mode: "local" };
}

/**
 * Delete Event Definition
 */
export async function deleteEventDefinition(eventId) {
  const { db, isConnected } = getFirebaseInstances();
  const isPref = eventId.startsWith("pref-") || (localPrefEvents && localPrefEvents.some(e => e.id === eventId));

  if (isPref && localPrefEvents) {
    localPrefEvents = localPrefEvents.filter(e => e.id !== eventId);
    saveLocalFallback();
  } else if (!isPref && localEvents) {
    localEvents = localEvents.filter(e => e.id !== eventId);
    saveLocalFallback();
  }

  recordAuditLog({
    type: "event_setup",
    title: `Event Removed`,
    details: `Event ID "${eventId}" was removed from the schedule.`,
    summary: `Event ${eventId} deleted`,
    eventId,
    metadata: { competition: isPref ? "prefectorial" : "interhouse" }
  });

  if (isConnected && db) {
    try {
      const eventsCol = isPref ? "prefectorial_events" : "events";
      await db.collection(eventsCol).doc(eventId).delete();
      return { success: true };
    } catch (err) {
      console.error("Error deleting event in Firestore:", err);
      return { success: false, error: err.message };
    }
  }
  return { success: true, mode: "local" };
}

/**
 * Reset All Scores for a fresh Sports Day or Prefectorial Cup
 */
export async function resetAllSportsDayScores(targetCompetition = null) {
  const { db, isConnected } = getFirebaseInstances();
  const target = targetCompetition || (isPrefectorialCup() ? "prefectorial" : "interhouse");

  if (target === "prefectorial") {
    if (localPrefEvents) {
      localPrefEvents = localPrefEvents.map(ev => ({
        ...ev,
        status: "upcoming",
        results: null,
        notes: ""
      }));
    }
    if (localPrefTeams) {
      localPrefTeams = localPrefTeams.map(h => ({
        ...h,
        totalPoints: 0,
        teamPoints: 0,
        goldCount: 0,
        silverCount: 0,
        bronzeCount: 0,
        fourthCount: 0
      }));
    }
  } else {
    if (localEvents) {
      localEvents = localEvents.map(ev => ({
        ...ev,
        status: "upcoming",
        results: null,
        notes: ""
      }));
    }
    if (localHouses) {
      localHouses = localHouses.map(h => ({
        ...h,
        totalPoints: 0,
        teamPoints: 0,
        goldCount: 0,
        silverCount: 0,
        bronzeCount: 0,
        fourthCount: 0
      }));
    }
  }

  localActivity.unshift({
    id: "log-reset-" + Date.now(),
    timestamp: new Date().toISOString(),
    title: `${target === "prefectorial" ? "Prefectship Cup" : "Interhouse Sports Day"} Scores Reset`,
    text: `All event scores for ${target === "prefectorial" ? "Prefectship Cup" : "Interhouse Sports"} have been reset to zero for competition start.`,
    competition: target
  });

  recordAuditLog({
    type: "score_reset",
    title: `${target === "prefectorial" ? "Prefectship Cup" : "Interhouse Sports"} Scores Reset to Zero`,
    details: `Administrator initiated a complete score reset for ${target === "prefectorial" ? "Prefectship Cup" : "Inter-House Sports"}.`,
    summary: `All scores and standings reset to zero for ${target === "prefectorial" ? "Prefectship Cup" : "Interhouse"}`,
    metadata: { resetAt: new Date().toISOString(), competition: target }
  });

  saveLocalFallback();

  if (isConnected && db) {
    try {
      const eventsCol = target === "prefectorial" ? "prefectorial_events" : "events";
      const teamsCol = target === "prefectorial" ? "prefectorial_teams" : "houses";

      const eventsSnap = await db.collection(eventsCol).get();
      const batch = db.batch();

      eventsSnap.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: "upcoming",
          results: null,
          notes: ""
        });
      });

      const housesSnap = await db.collection(teamsCol).get();
      housesSnap.docs.forEach(doc => {
        batch.update(doc.ref, {
          totalPoints: 0,
          teamPoints: 0,
          goldCount: 0,
          silverCount: 0,
          bronzeCount: 0,
          fourthCount: 0
        });
      });

      await batch.commit();
      return { success: true };
    } catch (err) {
      console.error("Error resetting in Firestore:", err);
      return { success: false, error: err.message };
    }
  }

  return { success: true, mode: "local" };
}

/**
 * Get Current In-Memory / Cached Students
 */
export function getStudents() {
  if (localStudents && localStudents.length > 0) return localStudents;
  getLocalFallback();
  return localStudents || INITIAL_STUDENTS;
}

/**
 * Add New Student to School Database
 */
export async function addStudent(studentData) {
  const { db, isConnected } = getFirebaseInstances();
  const id = studentData.id || ("stu-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4));
  const newStudent = { ...studentData, id, createdAt: new Date().toISOString() };

  if (!localStudents) localStudents = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
  localStudents.push(newStudent);
  saveLocalFallback();

  if (isConnected && db) {
    try {
      await db.collection("students").doc(id).set(newStudent);
      return { success: true, id: newStudent.id, student: newStudent };
    } catch (err) {
      console.error("Error adding student to Firestore:", err);
      return { success: false, error: err.message };
    }
  }
  return { success: true, id: newStudent.id, student: newStudent, mode: "local" };
}

/**
 * Bulk Add Multiple Students to School Database
 */
export async function bulkAddStudents(studentsList) {
  const { db, isConnected } = getFirebaseInstances();
  if (!localStudents) localStudents = JSON.parse(JSON.stringify(INITIAL_STUDENTS));

  const added = [];
  const batch = (isConnected && db) ? db.batch() : null;

  for (const item of studentsList) {
    if (!item.name || !item.name.trim()) continue;
    const id = item.id || ("stu-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5));
    const student = {
      id,
      name: item.name.trim(),
      houseId: item.houseId || "general",
      gender: item.gender || "General",
      grade: item.grade || "SS 1",
      createdAt: new Date().toISOString()
    };
    localStudents.push(student);
    added.push(student);

    if (batch) {
      const ref = db.collection("students").doc(id);
      batch.set(ref, student);
    }
  }

  saveLocalFallback();

  if (batch && added.length > 0) {
    try {
      await batch.commit();
    } catch (err) {
      console.warn("Firestore batch add students error:", err);
    }
  }

  return { success: true, count: added.length, students: added };
}

/**
 * Batch Update Multiple Students' House Assignment
 */
export async function batchUpdateStudentsHouse(studentIds, newHouseId) {
  const { db, isConnected } = getFirebaseInstances();
  if (!localStudents) localStudents = JSON.parse(JSON.stringify(INITIAL_STUDENTS));

  const idSet = new Set(studentIds);
  const updatedStudents = [];
  const batch = (isConnected && db) ? db.batch() : null;

  for (let i = 0; i < localStudents.length; i++) {
    if (idSet.has(localStudents[i].id)) {
      localStudents[i] = {
        ...localStudents[i],
        houseId: newHouseId,
        updatedAt: new Date().toISOString()
      };
      updatedStudents.push(localStudents[i]);
      if (batch) {
        const ref = db.collection("students").doc(localStudents[i].id);
        batch.set(ref, { houseId: newHouseId, updatedAt: new Date().toISOString() }, { merge: true });
      }
    }
  }

  saveLocalFallback();

  if (batch && updatedStudents.length > 0) {
    try {
      await batch.commit();
    } catch (err) {
      console.warn("Firestore batchUpdateStudentsHouse error:", err);
    }
  }

  return { success: true, count: updatedStudents.length };
}

/**
 * Update Existing Student
 */
export async function updateStudent(studentId, data) {
  const { db, isConnected } = getFirebaseInstances();
  const currentAdmin = getCurrentAdmin();
  const auditInfo = currentAdmin ? {
    adminId: currentAdmin.id || currentAdmin.adminId || "ADM-001",
    name: currentAdmin.name || "Admin Official",
    email: currentAdmin.email || "",
    editedAt: new Date().toISOString(),
    editedFormatted: formatAdminTimestamp(new Date())
  } : null;

  const updatedData = {
    ...data,
    updatedAt: new Date().toISOString(),
    ...(auditInfo ? {
      lastEditedBy: auditInfo,
      lastEditedAt: auditInfo.editedAt,
      lastEditedFormatted: auditInfo.editedFormatted
    } : {})
  };

  if (localStudents) {
    const idx = localStudents.findIndex(s => s.id === studentId);
    if (idx >= 0) {
      localStudents[idx] = { ...localStudents[idx], ...updatedData };
      saveLocalFallback();
    }
  }

  if (isConnected && db) {
    try {
      await db.collection("students").doc(studentId).set(updatedData, { merge: true });
      return { success: true };
    } catch (err) {
      console.error("Error updating student in Firestore:", err);
      return { success: false, error: err.message };
    }
  }
  return { success: true, mode: "local" };
}

/**
 * Delete Student from School Database
 */
export async function deleteStudent(studentId) {
  const { db, isConnected } = getFirebaseInstances();

  if (localStudents) {
    localStudents = localStudents.filter(s => s.id !== studentId);
    saveLocalFallback();
  }

  if (isConnected && db) {
    try {
      await db.collection("students").doc(studentId).delete();
      return { success: true };
    } catch (err) {
      console.error("Error deleting student in Firestore:", err);
      return { success: false, error: err.message };
    }
  }
  return { success: true, mode: "local" };
}

/**
 * Populate Sample Demonstration Scores
 */
export async function seedDemoScores() {
  for (const demo of DEMO_SAMPLE_SCORES) {
    await submitEventScore(demo.eventId, demo.results, demo.status || "completed", "Sample official demonstration score");
  }
  recordAuditLog({
    type: "demo_seed",
    title: "Demonstration Results Populated",
    details: "Sample scores seeded across track and field events for live testing and podium preview.",
    summary: "Demo scores populated for testing",
    metadata: { count: DEMO_SAMPLE_SCORES.length }
  });
  return { success: true };
}

/* ==========================================================================
   NEWS & MULTIMEDIA GALLERY LAYER
   ========================================================================== */

/**
 * Retrieve cached or initial news items (real published stories only)
 */
export function getNewsItems() {
  if (localNews && Array.isArray(localNews) && localNews.length > 0) {
    const valid = localNews.filter(n => !isPlaceholderNewsItem(n));
    if (valid.length > 0) return valid;
  }
  getLocalFallback();
  if (localNews && Array.isArray(localNews) && localNews.length > 0) {
    const valid = localNews.filter(n => !isPlaceholderNewsItem(n));
    if (valid.length > 0) return valid;
  }
  return JSON.parse(JSON.stringify(INITIAL_NEWS));
}

/**
 * Realtime subscription to News & Gallery stories
 */
export function subscribeToNews({ onNewsChange }) {
  getLocalFallback();
  const initialList = getNewsItems();
  if (onNewsChange) onNewsChange(initialList);

  const { db, isConnected } = getFirebaseInstances();
  if (!isConnected || !db) return () => {};

  const unsub = db.collection("news").orderBy("timestamp", "desc").onSnapshot(async (snapshot) => {
    if (snapshot.empty) {
      localNews = JSON.parse(JSON.stringify(INITIAL_NEWS));
      saveLocalFallback();
      if (onNewsChange) onNewsChange(localNews);
      try {
        const batch = db.batch();
        INITIAL_NEWS.forEach(item => {
          batch.set(db.collection("news").doc(item.id), item);
        });
        await batch.commit();
      } catch (e) {
        console.warn("Could not batch seed INITIAL_NEWS to Firestore:", e);
      }
      return;
    }
    const currentNews = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const item = { id: doc.id, ...data };
      if (isPlaceholderNewsItem(item)) {
        doc.ref.delete().catch(() => {});
        return;
      }
      const sanitized = sanitizeNewsItem(item);
      if (sanitized.mediaUrl !== data.mediaUrl) {
        doc.ref.update({ mediaUrl: sanitized.mediaUrl }).catch(() => {});
      }
      currentNews.push(sanitized);
    });
    localNews = currentNews;
    saveLocalFallback();
    if (onNewsChange) onNewsChange(currentNews);
  }, (err) => {
    console.warn("Firestore news listen error (using local cache):", err);
    if (onNewsChange) onNewsChange((localNews || []).filter(n => !isPlaceholderNewsItem(n)));
  });

  return unsub;
}

/**
 * Purge any and all legacy placeholder news from local & Cloud Firestore
 */
export async function purgeAllPlaceholderNews() {
  const { db, isConnected } = getFirebaseInstances();
  if (localNews) {
    localNews = localNews.filter(n => !isPlaceholderNewsItem(n));
    saveLocalFallback();
  }
  if (isConnected && db) {
    try {
      const snapshot = await db.collection("news").get();
      const batch = db.batch();
      let deleteCount = 0;
      snapshot.docs.forEach(doc => {
        const item = { id: doc.id, ...doc.data() };
        if (isPlaceholderNewsItem(item)) {
          batch.delete(doc.ref);
          deleteCount++;
        }
      });
      if (deleteCount > 0) {
        await batch.commit();
      }
    } catch (err) {
      console.warn("Error purging placeholder news from Firestore:", err);
    }
  }
  return { success: true };
}

/**
 * Add or update a News or Gallery Story
 */
export async function saveNewsItem(newsData) {
  const { db, isConnected } = getFirebaseInstances();
  const id = newsData.id || "news-" + Date.now();
  const currentAdmin = getCurrentAdmin();
  const now = new Date();

  const cleanItem = {
    ...newsData,
    id,
    timestamp: newsData.timestamp || now.toISOString(),
    formattedDate: newsData.formattedDate || formatAdminTimestamp(now),
    author: newsData.author || (currentAdmin ? currentAdmin.name : "Sports Desk"),
    updatedAt: now.toISOString(),
    lastEditedBy: currentAdmin ? {
      adminId: currentAdmin.id || currentAdmin.adminId || "ADM-001",
      name: currentAdmin.name || "Admin Official",
      email: currentAdmin.email || ""
    } : null
  };

  const sanitizedItem = sanitizeNewsItem(cleanItem);

  if (!localNews) localNews = JSON.parse(JSON.stringify(INITIAL_NEWS));
  const idx = localNews.findIndex(n => n.id === id);
  if (idx >= 0) {
    localNews[idx] = { ...localNews[idx], ...sanitizedItem };
  } else {
    localNews.unshift(sanitizedItem);
  }
  saveLocalFallback();

  if (isConnected && db) {
    try {
      await db.collection("news").doc(id).set(sanitizedItem, { merge: true });
      return { success: true, item: sanitizedItem };
    } catch (err) {
      console.error("Error saving news to Firestore:", err);
      return { success: false, error: err.message };
    }
  }
  return { success: true, item: sanitizedItem, mode: "local" };
}

/**
 * Delete a news story or media item
 */
export async function deleteNewsItem(newsId) {
  const { db, isConnected } = getFirebaseInstances();

  if (localNews) {
    localNews = localNews.filter(n => n.id !== newsId);
    saveLocalFallback();
  }

  if (isConnected && db) {
    try {
      await db.collection("news").doc(newsId).delete();
      return { success: true };
    } catch (err) {
      console.error("Error deleting news in Firestore:", err);
      return { success: false, error: err.message };
    }
  }
  return { success: true, mode: "local" };
}

/**
 * Add a supporter comment to a news story
 */
export async function addNewsComment(newsId, commentData) {
  const allNews = getNewsItems();
  const item = allNews.find(n => n.id === newsId);
  if (!item) throw new Error("News item not found");

  const comments = Array.isArray(item.comments) ? item.comments : [];
  const now = new Date();
  const newComment = {
    id: "cmt-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    author: (commentData.author || "").trim() || "Supporter",
    houseId: commentData.houseId || null,
    text: (commentData.text || "").trim(),
    timestamp: now.toISOString(),
    formattedDate: formatAdminTimestamp(now)
  };

  item.comments = [...comments, newComment];
  await saveNewsItem(item);
  return { success: true, comment: newComment, item };
}

/**
 * Delete a supporter comment from a news story
 */
export async function deleteNewsComment(newsId, commentId) {
  const allNews = getNewsItems();
  const item = allNews.find(n => n.id === newsId);
  if (!item || !Array.isArray(item.comments)) return { success: false };

  item.comments = item.comments.filter(c => c.id !== commentId);
  await saveNewsItem(item);
  return { success: true, item };
}

/**
 * Get unique identifier for the current user/device to strictly limit to 1 like
 */
export function getCurrentUserLikeKey() {
  const currentAdmin = getCurrentAdmin();
  if (currentAdmin && currentAdmin.email) return currentAdmin.email.toLowerCase().trim();
  const userName = localStorage.getItem("jais_user_name");
  let deviceId = localStorage.getItem("jais_device_id");
  if (!deviceId) {
    deviceId = "dev-" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    try { localStorage.setItem("jais_device_id", deviceId); } catch (e) {}
  }
  return userName && userName !== "Supporter" ? `${userName.toLowerCase().trim()}#${deviceId.slice(-4)}` : deviceId;
}

/**
 * Check if the current device/user has liked a news story
 */
export function isNewsStoryLiked(newsId) {
  const userKey = getCurrentUserLikeKey();
  try {
    const likedIds = JSON.parse(localStorage.getItem("juilliard_liked_news_ids") || "[]");
    if (likedIds.includes(newsId)) return true;
  } catch (e) {}

  const allNews = getNewsItems();
  const item = allNews.find(n => n.id === newsId);
  if (item && Array.isArray(item.likedBy) && item.likedBy.includes(userKey)) {
    return true;
  }
  return false;
}

/**
 * Toggle like on a news story for the current user/device (1 like max per user / dislike toggle)
 */
export async function toggleNewsLike(newsId) {
  const allNews = getNewsItems();
  const item = allNews.find(n => n.id === newsId);
  if (!item) return { liked: false, likes: 0 };

  const storageKey = "juilliard_liked_news_ids";
  const userKey = getCurrentUserLikeKey();
  let likedIds = [];
  try {
    likedIds = JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch (e) {
    likedIds = [];
  }

  item.likedBy = Array.isArray(item.likedBy) ? item.likedBy : [];
  const alreadyLiked = likedIds.includes(newsId) || item.likedBy.includes(userKey);
  let currentLikes = typeof item.likes === "number" ? item.likes : 0;

  if (alreadyLiked) {
    // User already liked -> unlike / dislike (remove their like)
    currentLikes = Math.max(0, currentLikes - 1);
    likedIds = likedIds.filter(id => id !== newsId);
    item.likedBy = item.likedBy.filter(k => k !== userKey);
  } else {
    // User hasn't liked yet -> add like
    currentLikes += 1;
    if (!likedIds.includes(newsId)) likedIds.push(newsId);
    if (!item.likedBy.includes(userKey)) item.likedBy.push(userKey);
  }

  try { localStorage.setItem(storageKey, JSON.stringify(likedIds)); } catch (e) {}
  item.likes = currentLikes;
  await saveNewsItem(item);

  return { liked: !alreadyLiked, likes: currentLikes, item };
}


