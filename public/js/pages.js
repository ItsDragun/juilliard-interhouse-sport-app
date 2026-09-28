/**
 * Juilliard Academy Interhouse Sports Day — App Screen Renderers
 *
 * Screens:
 * 1. Events / Fixtures — Live matches, date carousel, filter chips, event cards
 * 2. Event Detail — Scoreboard, scorer timeline, commentary, subtabs
 * 3. Standings Table — Overall house rankings, points breakdown
 * 4. Houses — House profiles, assigned teachers, house captains
 * 5. Admin — Score entry console, event management (judge-only)
 */

import { router } from "./router.js";
import { 
  isUserAdmin, 
  isUserSuperAdmin,
  getCurrentUser, 
  getCurrentAdmin,
  signInWithEmail, 
  loginAdminWithPassword,
  setAdminPassword,
  hasAdminPassword,
  getVerifiedAdmin,
  getRegisteredAdmins,
  addAdminAccount,
  updateAdminAccount,
  updateCurrentAdminProfile,
  deleteAdminAccount,
  resetAdminPassword,
  isEmailWhitelisted,
  VERIFIED_ADMIN_ACCOUNTS,
  ROOT_SUPER_ADMIN,
  PERMANENT_SUPER_ADMINS,
  isPermanentSuperAdmin,
  signOutAdmin,
  signOutUser,
  formatAdminTimestamp
} from "./auth.js";
import { 
  submitEventScore, 
  updateHouseRoster, 
  saveEventDefinition, 
  deleteEventDefinition, 
  resetAllSportsDayScores, 
  seedDemoScores, 
  getStudents, 
  addStudent, 
  bulkAddStudents,
  batchUpdateStudentsHouse,
  updateStudent, 
  deleteStudent,
  getNewsItems,
  subscribeToNews,
  purgeAllPlaceholderNews,
  isPlaceholderNewsItem,
  saveNewsItem,
  deleteNewsItem,
  addNewsComment,
  deleteNewsComment,
  toggleNewsLike,
  isNewsStoryLiked,
  recordAuditLog,
  getAuditLogs,
  clearAuditLogs,
  isEventCompleted,
  isEventLive,
  parseVersusScore,
  getActiveCompetition,
  setActiveCompetition,
  isPrefectorialCup,
  getPrefectorialTeams,
  getPrefectorialEvents,
  isBallSportEvent,
  sanitizeEventPoints
} from "./db.js";
export { getNewsItems, saveNewsItem, deleteNewsItem, addNewsComment, deleteNewsComment, toggleNewsLike, isNewsStoryLiked };
import { playWhistleSound, playScoreCelebration, playTapSound } from "./audio.js";
import { ICONS } from "./icons.js";
import { toggleTheme } from "./theme.js";
import { INITIAL_HOUSES, INITIAL_EVENTS, INITIAL_STUDENTS, INITIAL_PREFECTORIAL_TEAMS, INITIAL_PREFECTORIAL_EVENTS } from "./seed-data.js";

function getCachedData() {
  if (isPrefectorialCup()) {
    const rawTeams = (window.currentPrefTeamsCache && window.currentPrefTeamsCache.length) ? window.currentPrefTeamsCache : getPrefectorialTeams();
    const houses = (rawTeams && rawTeams.some(h => h.id && h.id.startsWith("team-"))) ? rawTeams : getPrefectorialTeams();
    const rawEvents = (window.currentPrefEventsCache && window.currentPrefEventsCache.length) ? window.currentPrefEventsCache : getPrefectorialEvents();
    const events = (rawEvents && rawEvents.some(e => e.id && e.id.startsWith("pref-"))) ? rawEvents : getPrefectorialEvents();
    const students = (window.currentStudentsCache && window.currentStudentsCache.length) ? window.currentStudentsCache : getStudents();
    return { houses, events, students };
  }
  let houses = (window.currentHousesCache && window.currentHousesCache.length) ? window.currentHousesCache : INITIAL_HOUSES;
  if (houses.some(h => h.id && h.id.startsWith("team-"))) {
    houses = INITIAL_HOUSES;
  }
  let events = (window.currentEventsCache && window.currentEventsCache.length) ? window.currentEventsCache : INITIAL_EVENTS;
  if (events.some(e => e.id && e.id.startsWith("pref-"))) {
    events = INITIAL_EVENTS;
  }
  const students = (window.currentStudentsCache && window.currentStudentsCache.length) ? window.currentStudentsCache : getStudents();
  return { houses, events, students };
}


export function showScreen(screenId) {
  document.querySelectorAll(".page-screen").forEach(screen => {
    screen.classList.remove("active");
  });
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add("active");
  }

  const isOnboarding = screenId === "screen-onboarding" || screenId === "screen-welcome";
  if (isOnboarding) {
    document.body.classList.add("onboarding-active");
  } else {
    document.body.classList.remove("onboarding-active");
  }
}

// Active State Trackers
let tableSubView = "full";   // "short" | "full" | "form"
let currentEventTab = "facts"; // "facts" | "commentary" | "lineup" | "table" | "stats"
let eventsSearchQuery = "";
let showSearchBar = false;
let eventsCategoryFilter = "all"; // "all" | "track" | "field" | "novelty" | "team"
let eventsDivisionFilter = "all"; // "all" | "boys" | "girls"
let eventsStatusFilter = "all";   // "all" | "live" | "completed" | "upcoming"
let tableCategoryFilter = "overall"; // "overall" | "track" | "field" | "novelty" | "team"
let studentsGradeFilter = "all";   // "all" | "JSS 1" | "JSS 2" | "JSS 3" | "SS 1" | "SS 2" | "SS 3"
let studentsGenderFilter = "all";  // "all" | "boys" | "girls"
let studentsHouseFilter = "all";   // fallback
let studentsSearchQuery = "";
let showAddStudentForm = false;
let newsFilterType = "all"; // "all" | "video" | "photo" | "article"
let newsFilterCategory = "all"; // "all" | "football" | "basketball" | "track" | "field" | "ceremony" | "novelty"
let newsFilterTag = "all"; // "all" | specific tag (e.g. "Finals", "Phoenix")

export function setNewsFilterType(type) {
  playTapSound();
  newsFilterType = type;
  renderNewsPage();
}

export function setNewsFilterCategory(category) {
  playTapSound();
  newsFilterCategory = category;
  renderNewsPage();
}

export function setNewsFilterCombined(category, type = "all") {
  playTapSound();
  newsFilterCategory = category;
  newsFilterType = type;
  newsFilterTag = "all";
  renderNewsPage();
}

export function filterNewsByTag(tag, event) {
  if (event) event.stopPropagation();
  playTapSound();
  newsFilterTag = tag ? String(tag).trim().replace(/^#/, "") : "all";
  renderNewsPage();
}

export function clearNewsTagFilter() {
  playTapSound();
  newsFilterTag = "all";
  renderNewsPage();
}

export function showToastNotification(message, type = "success") {
  let container = document.getElementById("jais-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "jais-toast-container";
    container.className = "jais-toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `jais-toast-pill toast-${type}`;
  const icon = type === "success" ? "✓" : (type === "error" ? "✕" : (type === "warning" ? "⚠" : "ℹ"));
  toast.innerHTML = `<span style="font-size: 1.1rem; line-height: 1; flex-shrink: 0;">${icon}</span><span style="flex: 1; min-width: 0; word-break: break-word;">${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px) scale(0.95)";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
export function setEventsCategoryFilter(cat) {
  playTapSound();
  eventsCategoryFilter = cat;
  renderEventsPage();
}

export function setEventsDivisionFilter(div) {
  playTapSound();
  eventsDivisionFilter = div;
  renderEventsPage();
}

export function setEventsStatusFilter(st) {
  playTapSound();
  eventsStatusFilter = st;
  renderEventsPage();
}

export function setTableCategoryFilter(cat) {
  playTapSound();
  tableCategoryFilter = cat;
  renderTablePage();
}

export function setTableSubView(mode) {
  playTapSound();
  tableSubView = "full";
  renderTablePage();
}

export function setEventDetailTab(tab, eventId) {
  playTapSound();
  currentEventTab = tab;
  renderEventDetailPage({ id: eventId });
}

export function toggleSearchBar() {
  showSearchBar = !showSearchBar;
  renderEventsPage();
  if (showSearchBar) {
    setTimeout(() => {
      document.getElementById("jais-search-input")?.focus();
    }, 50);
  }
}

/* ==========================================================================
   SCREEN 1: MATCHES / FIXTURES SCHEDULE (#/events)
   Matches Screenshot 1 ("Follow every match") - Upgraded for Sensible Clarity
   ========================================================================== */
export function renderEventsPage() {
  showScreen("screen-events");
  const container = document.getElementById("screen-events");
  const { houses, events } = getCachedData();
  if (!container) return;

  const isEventDone = isEventCompleted;

  const allLiveEvents = events.filter(isEventLive);
  const liveCount = allLiveEvents.length;

  const sortEventsWithLiveFirst = (list) => {
    return [...list].sort((a, b) => {
      const aLive = isEventLive(a);
      const bLive = isEventLive(b);
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;

      const aDone = isEventDone(a);
      const bDone = isEventDone(b);
      if (!aDone && bDone) return -1;
      if (aDone && !bDone) return 1;

      return (a.order || 0) - (b.order || 0);
    });
  };

  // Filter events based on search query, category, division, and status
  let filteredEvents = events.filter(e => {
    // 1. Search Query
    if (eventsSearchQuery) {
      const q = eventsSearchQuery.toLowerCase();
      const matchName = (e.name || "").toLowerCase().includes(q);
      const matchCat = (e.category || "").toLowerCase().includes(q);
      const matchAthlete = e.results && Object.values(e.results).some(r => (r.athlete || "").toLowerCase().includes(q));
      if (!matchName && !matchCat && !matchAthlete) return false;
    }

    // 2. Category Filter
    if (eventsCategoryFilter !== "all") {
      const cat = (e.category || "").toLowerCase();
      if (eventsCategoryFilter === "track" && !(cat.includes("track") || cat.includes("sprint") || cat.includes("race"))) return false;
      if (eventsCategoryFilter === "field" && !(cat.includes("field") || cat.includes("jump") || cat.includes("throw"))) return false;
      if (eventsCategoryFilter === "novelty" && !cat.includes("novelty")) return false;
      if (eventsCategoryFilter === "team" && !cat.includes("team")) return false;
    }

    // 3. Division Filter
    if (eventsDivisionFilter !== "all") {
      const gen = (e.gender || "").toLowerCase();
      if (eventsDivisionFilter === "boys" && !gen.includes("boys")) return false;
      if (eventsDivisionFilter === "girls" && !gen.includes("girls")) return false;
    }

    // 4. Status Filter
    if (eventsStatusFilter !== "all") {
      const isDone = isEventDone(e);
      const isLive = isEventLive(e);
      if (eventsStatusFilter === "completed" && !isDone) return false;
      if (eventsStatusFilter === "live" && !isLive) return false;
      if (eventsStatusFilter === "upcoming" && (isDone || isLive)) return false;
    }

    return true;
  });

  // Group events by category
  const categories = [
    { id: "track", name: "Track Events • Sprints & Races", icon: ICONS.track },
    { id: "field", name: "Field Events • Jumps & Throws", icon: ICONS.field },
    { id: "novelty", name: "Novelty & School Spirit", icon: ICONS.novelty },
    { id: "team", name: "Team Sports • Football & Basketball", icon: ICONS.team }
  ];

  const grouped = { track: [], field: [], novelty: [], team: [] };

  filteredEvents.forEach(e => {
    const cat = (e.category || "").toLowerCase();
    if (cat.includes("track") || cat.includes("sprint") || cat.includes("race")) {
      grouped.track.push(e);
    } else if (cat.includes("field") || cat.includes("jump") || cat.includes("throw")) {
      grouped.field.push(e);
    } else if (cat.includes("novelty")) {
      grouped.novelty.push(e);
    } else {
      grouped.team.push(e);
    }
  });

  container.innerHTML = `
    <!-- Top App Bar -->
    <header class="jais-top-bar">
      <a href="#/events" class="jais-brand-logo" style="display: flex; align-items: center; gap: 8px;">
        <img src="assets/juilliard-logo.png" alt="Juilliard Academy" style="width: 26px; height: 26px; object-fit: contain; border-radius: 50%; background: #ffffff; padding: 1px; box-shadow: 0 1px 4px rgba(0,0,0,0.25);" />
        <span>JUILLIARD<span class="plus">SPORTS</span></span>
      </a>

      <!-- Center Live Matches Count Pill -->
      <a href="#/events" class="jais-live-chip" onclick="window.pages.setEventsStatusFilter('live')" style="${liveCount > 0 ? 'border-color: rgba(239,68,68,0.5); background: rgba(239,68,68,0.1); color: #EF4444;' : ''}">
        <span class="jais-live-dot" style="${liveCount > 0 ? 'background-color: #EF4444; box-shadow: 0 0 6px #EF4444;' : ''}"></span>
        <span style="font-weight: 800;">${liveCount} Live${liveCount > 0 ? ' Now' : ''}</span>
      </a>

      <!-- Right Header Actions (Zero emojis, SVG icons) -->
      <div class="jais-top-actions" style="display: flex; align-items: center; gap: 6px;">
        <button type="button" class="jais-comp-switcher-btn" onclick="window.pages.openCompetitionSelectorModal()" title="Switch Tournament Cup" style="font-size: 0.72rem; padding: 2px 8px;">
          <span>${isPrefectorialCup() ? '🏆' : '🥇'}</span>
          <span style="max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${isPrefectorialCup() ? 'Prefectship' : 'Inter-House'}</span>
          <span class="caret">▾</span>
        </button>
        <button class="jais-icon-btn" onclick="window.toggleTheme()" title="Toggle Theme" aria-label="Toggle Theme">
          ${ICONS.sun}
        </button>
        <button class="jais-icon-btn" onclick="window.pages.toggleSearchBar()" title="Search" aria-label="Search">
          ${ICONS.search}
        </button>
        <button class="jais-icon-btn" onclick="window.location.hash = '#/onboarding'" title="Options" aria-label="Options">
          ${ICONS.moreDots}
        </button>
      </div>
    </header>

    <!-- Quick Search Input (Conditional) -->
    ${showSearchBar ? `
      <div style="padding: 0.65rem 0.85rem 0.25rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 10px; padding: 0.45rem 0.75rem;">
          <span style="color: var(--fm-text-secondary); display: flex; align-items: center;">${ICONS.search}</span>
          <input type="text" id="jais-search-input" placeholder="Search sports, heats, athletes..." 
                 value="${escapeHtml(eventsSearchQuery)}"
                 oninput="window.pages.handleSearchInput(this.value)"
                 style="flex: 1; background: transparent; border: none; outline: none; color: var(--fm-text-primary); font-size: 0.85rem;" />
          ${eventsSearchQuery ? `
            <button onclick="window.pages.handleSearchInput('')" style="color: var(--fm-text-secondary); font-size: 0.85rem; background: none; border: none; cursor: pointer;">&times;</button>
          ` : ''}
        </div>
      </div>
    ` : ''}

    <!-- Quick Filter Chips: Category & Division & Status -->
    <div class="jais-filter-strip">
      <button class="jais-chip ${eventsCategoryFilter === 'all' ? 'active' : ''}" onclick="window.pages.setEventsCategoryFilter('all')">
        All Sports (${events.length})
      </button>
      <button class="jais-chip ${eventsCategoryFilter === 'track' ? 'active' : ''}" onclick="window.pages.setEventsCategoryFilter('track')">
        Track (${events.filter(e => (e.category || '').toLowerCase().includes('track')).length})
      </button>
      <button class="jais-chip ${eventsCategoryFilter === 'field' ? 'active' : ''}" onclick="window.pages.setEventsCategoryFilter('field')">
        Field (${events.filter(e => (e.category || '').toLowerCase().includes('field')).length})
      </button>
      <button class="jais-chip ${eventsCategoryFilter === 'novelty' ? 'active' : ''}" onclick="window.pages.setEventsCategoryFilter('novelty')">
        Novelty (${events.filter(e => (e.category || '').toLowerCase().includes('novelty')).length})
      </button>
      <button class="jais-chip ${eventsCategoryFilter === 'team' ? 'active' : ''}" onclick="window.pages.setEventsCategoryFilter('team')">
        Team Sports (${events.filter(e => (e.category || '').toLowerCase().includes('team')).length})
      </button>
    </div>

    <!-- Secondary Filter Strip: Boys / Girls / Status -->
    <div class="jais-filter-strip" style="padding-top: 0;">
      <button class="jais-chip ${eventsDivisionFilter === 'all' ? 'active' : ''}" onclick="window.pages.setEventsDivisionFilter('all')">
        All Divisions
      </button>
      <button class="jais-chip ${eventsDivisionFilter === 'boys' ? 'active' : ''}" onclick="window.pages.setEventsDivisionFilter('boys')">
        Boys
      </button>
      <button class="jais-chip ${eventsDivisionFilter === 'girls' ? 'active' : ''}" onclick="window.pages.setEventsDivisionFilter('girls')">
        Girls
      </button>
      <span style="color: var(--fm-border); padding: 0 2px;">|</span>
      <button class="jais-chip ${eventsStatusFilter === 'all' ? 'active' : ''}" onclick="window.pages.setEventsStatusFilter('all')">
        All Status
      </button>
      <button class="jais-chip ${eventsStatusFilter === 'live' ? 'active' : ''}" onclick="window.pages.setEventsStatusFilter('live')">
        Live Now
      </button>
      <button class="jais-chip ${eventsStatusFilter === 'completed' ? 'active' : ''}" onclick="window.pages.setEventsStatusFilter('completed')">
        Completed
      </button>
    </div>

    <!-- Dedicated Pinned LIVE IN ARENA Showcase (Automated When Event Goes Live) -->
    ${allLiveEvents.length > 0 && eventsStatusFilter !== 'completed' ? `
      <div class="jais-live-pinned-banner">
        <div class="jais-live-pinned-header">
          <div class="jais-live-pinned-title">
            <span class="jais-live-beacon"></span>
            <span>Live In Arena (${allLiveEvents.length})</span>
          </div>
          <span style="font-size: 0.68rem; font-weight: 900; color: #EF4444; background: rgba(239, 68, 68, 0.2); padding: 2px 8px; border-radius: 9999px; letter-spacing: 0.5px;">
            HAPPENING NOW
          </span>
        </div>
        <div class="jais-category-body">
          ${allLiveEvents.map(ev => renderMatchRowHtml(ev, houses)).join("")}
        </div>
      </div>
    ` : ''}

    <!-- Grouped Category Accordion Cards (Screenshot 1) -->
    <div style="padding-bottom: 1rem;">
      ${categories.map(cat => {
        const rawCatEvents = grouped[cat.id] || [];
        const bannerShown = allLiveEvents.length > 0 && eventsStatusFilter !== 'completed';
        // Live events already appear in the pinned banner above; don't list them twice.
        const catEvents = sortEventsWithLiveFirst(bannerShown ? rawCatEvents.filter(e => !isEventLive(e)) : rawCatEvents);
        if (eventsCategoryFilter !== "all" && eventsCategoryFilter !== cat.id) return "";
        if (eventsStatusFilter === "live" && bannerShown && catEvents.length === 0) return "";
        return `
          <div class="jais-section-card">
            <!-- League / Category Header with Flag and Chevron -->
            <div class="jais-section-header" onclick="window.pages.toggleSectionCollapse('${cat.id}')">
              <div class="jais-section-title-left">
                <span class="jais-category-flag" style="color: var(--fm-green);">${cat.icon}</span>
                <span>${cat.name} (${catEvents.length})</span>
              </div>
              <span class="jais-icon-btn" style="width: 24px; height: 24px; color: var(--fm-text-muted);">
                ${ICONS.chevronUp}
              </span>
            </div>

            <!-- Match Rows inside this Category -->
            <div class="jais-category-body" id="cat-body-${cat.id}">
              ${catEvents.length ? catEvents.map(ev => {
                return renderMatchRowHtml(ev, houses);
              }).join("") : `
                <div style="padding: 1rem; text-align: center; color: var(--fm-text-muted); font-size: 0.8rem;">
                  No events matching your filters
                </div>
              `}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/**
 * Sensible Match & Race Row Renderer
 * Accurately distinguishes 4-House All-Comers Events from 2-House Head-to-Head Matches
 */
function renderMatchRowHtml(ev, houses) {
  const isCompleted = isEventCompleted(ev);
  const isLive = isEventLive(ev);
  const isH2H = (ev.format === "h2h") || (ev.contenders && ev.contenders.length === 2);

  const statusClass = isCompleted ? "completed" : (isLive ? "live" : "upcoming");
  const badgeHtml = isLive
    ? `<span class="jais-status-badge live"><span class="jais-live-beacon" style="width:6px;height:6px;"></span>LIVE</span>`
    : (isCompleted
      ? `<span class="jais-status-badge completed" title="Official Results Recorded &amp; Marked Done">DONE</span>`
      : `<span class="jais-status-badge upcoming">${escapeHtml(ev.scheduledTime || '10:00')}</span>`);

  // 1. HEAD-TO-HEAD MATCH (Football, Basketball, Tug of War)
  if (isH2H) {
    const house1 = houses.find(h => h.id === ev.contenders?.[0]) || houses[0];
    const house2 = houses.find(h => h.id === ev.contenders?.[1]) || houses[1];
    let score1 = "-";
    let score2 = "-";
    if (isCompleted || isLive) {
      const res = ev.results || {};
      const firstScoreStr = res.first?.score !== undefined ? String(res.first.score).trim() : "";
      if (firstScoreStr.includes("-")) {
        const parts = firstScoreStr.split("-").map(p => p.trim());
        if (res.first?.houseId === house2.id) {
          score1 = parts[1] ?? "0";
          score2 = parts[0] ?? "0";
        } else {
          score1 = parts[0] ?? "0";
          score2 = parts[1] ?? "0";
        }
      } else {
        const sFirst = res.first?.score !== undefined ? String(res.first.score).trim() : "0";
        const sSecond = res.second?.score !== undefined ? String(res.second.score).trim() : "0";
        if (res.first?.houseId === house2.id) {
          score1 = sSecond;
          score2 = sFirst;
        } else {
          score1 = sFirst;
          score2 = sSecond;
        }
      }
    }

    return `
      <div class="jais-fixture-item" onclick="window.location.hash = '#/event/${ev.id}'">
        <div class="jais-fixture-header">
          <div class="jais-event-title-wrap">
            <span class="jais-event-name">${escapeHtml(ev.name)}</span>
            <span class="jais-division-pill">${escapeHtml(ev.category)} &bull; ${escapeHtml(ev.gender || 'All')}</span>
            ${ev.stage === 'group' || (ev.id || '').includes('fb-group') ? `
              <span class="jais-stage-badge group" style="font-size: 0.6rem; padding: 1px 7px;">⚽ Group Stage • MD ${ev.matchday || 1}</span>
            ` : ((ev.stage === 'knockout' || (ev.id || '').includes('knockout') || ev.knockoutRound) ? `
              <span class="jais-stage-badge knockout" style="font-size: 0.6rem; padding: 1px 7px;">
                ${(ev.knockoutRound === 'final' || (ev.name || '').toLowerCase().includes('final')) && !(ev.name || '').toLowerCase().includes('semi') ? '🏆 Championship Final' : ((ev.knockoutRound === 'third_place' || (ev.name || '').toLowerCase().includes('3rd place')) ? '🥉 3rd Place Match' : '⚔️ Semi-Final')}
              </span>
            ` : `
              <span class="jais-fourhouse-pill" style="font-size: 0.6rem; padding: 1px 6px; color: #60A5FA; border-color: rgba(96,165,250,0.3); background: rgba(59,130,246,0.1);">1v1 Match</span>
            `)}
          </div>
          ${badgeHtml}
        </div>

        <div class="jais-fixture-row" style="padding: 0.35rem 0; border: none;">
          <div class="jais-team-left">
            <div class="jais-team-crest-sm" style="border: 1px solid ${house1.color};">
              <img src="assets/crests/${house1.id}.svg" alt="${house1.name}" />
            </div>
            <span style="font-weight: 700;">${escapeHtml(house1.name)}</span>
          </div>

          <div class="jais-score-center">
            <div class="jais-score-val" style="color: ${isLive ? '#EF4444' : (isCompleted ? 'var(--fm-text-primary)' : 'var(--fm-text-secondary)')}; font-weight: 900;">
              ${isCompleted || isLive ? `${score1} - ${score2}` : (ev.scheduledTime || '10:00')}
            </div>
            ${isLive ? `<span style="font-size: 0.65rem; color: #EF4444; font-weight: 800; display: block; text-transform: uppercase;">● Live In Pitch</span>` : ''}
            ${isCompleted ? `<span style="font-size: 0.65rem; color: var(--fm-green); font-weight: 800; display: block; text-transform: uppercase;">Event Done</span>` : ''}
          </div>

          <div class="jais-team-right">
            <span style="font-weight: 700;">${escapeHtml(house2.name)}</span>
            <div class="jais-team-crest-sm" style="border: 1px solid ${house2.color};">
              <img src="assets/crests/${house2.id}.svg" alt="${house2.name}" />
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. 4-HOUSE / 4-TEAM ALL-COMERS EVENT (Track Races, Field Jumps & Throws, Novelty Heats)
  const isPrefect = isPrefectorialCup() || (ev && ev.id && String(ev.id).startsWith('pref-'));
  const entitiesLabel = isPrefect ? 'Teams' : 'Houses';
  const res = ev.results || {};
  const house1 = houses.find(h => h.id === res.first?.houseId) || houses[0];
  const house2 = houses.find(h => h.id === res.second?.houseId) || houses[1];
  const house3 = houses.find(h => h.id === res.third?.houseId) || houses[2];
  const house4 = houses.find(h => h.id === res.fourth?.houseId) || houses[3];

  return `
    <div class="jais-fixture-item" onclick="window.location.hash = '#/event/${ev.id}'">
      <!-- Event Title & Status Header -->
      <div class="jais-fixture-header">
        <div class="jais-event-title-wrap">
          <span class="jais-event-name">${escapeHtml(ev.name)}</span>
          <span class="jais-division-pill">${escapeHtml(ev.category)} &bull; ${escapeHtml(ev.gender || 'All')}</span>
          <span class="jais-fourhouse-pill" style="font-size: 0.6rem; padding: 1px 6px;">4 ${entitiesLabel}</span>
        </div>
        ${badgeHtml}
      </div>

      ${isCompleted ? `
        <!-- Completed Event: Winner Banner + 4-House Finish Order -->
        <div class="jais-race-winner-box" style="border-left: 3px solid var(--fm-border-light);">
          <div class="jais-winner-left">
            <span style="display: flex; align-items: center;">${ICONS.goldMedal}</span>
            <div class="jais-winner-crest">
              <img src="assets/crests/${house1.id}.svg" alt="${house1.name}" />
            </div>
            <span class="jais-winner-name">
              <a href="#/athlete/${encodeURIComponent(res.first?.athlete || '')}" class="clickable-student" style="color: inherit; text-decoration: none;" onclick="event.stopPropagation();">
                <strong>${escapeHtml(res.first?.athlete || house1.name)}</strong>
              </a>
              (${house1.name})
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="jais-winner-mark">${escapeHtml(res.first?.score || 'Winner')}</span>
            <span style="font-size: 0.68rem; font-weight: 800; color: var(--fm-text-primary); background: rgba(255, 255, 255, 0.08); border: 1px solid var(--fm-border); padding: 2px 6px; border-radius: 4px;">DONE</span>
          </div>
        </div>

        <div class="jais-finisher-strip">
          <span class="jais-finisher-chip gold">
            <span class="jais-finisher-dot" style="background: ${house1.color};"></span>
            1st ${house1.name} (${res.first?.score || '-'})
          </span>
          <span class="jais-finisher-chip">
            <span class="jais-finisher-dot" style="background: ${house2.color};"></span>
            2nd ${house2.name} (${res.second?.score || '-'})
          </span>
          <span class="jais-finisher-chip">
            <span class="jais-finisher-dot" style="background: ${house3.color};"></span>
            3rd ${house3.name}
          </span>
          <span class="jais-finisher-chip">
            <span class="jais-finisher-dot" style="background: ${house4.color};"></span>
            4th ${house4.name}
          </span>
        </div>
      ` : isLive ? `
        <!-- Live In-Progress Event (Zero scheduled time shown, prominent live state) -->
        <div class="jais-race-winner-box" style="border: 1.5px solid rgba(239, 68, 68, 0.45); background: rgba(239, 68, 68, 0.08);">
          <div class="jais-winner-left">
            <span class="jais-live-beacon" style="margin-right: 4px;"></span>
            <span style="font-weight: 800; font-size: 0.82rem; color: #EF4444;">${ev.category === 'Field' ? 'Field Sector Live:' : 'Heat Live On Track:'}</span>
            <span style="font-size: 0.82rem; color: var(--fm-text-primary); font-weight: 700;">${ev.category === 'Field' ? 'Attempts In Progress' : `All 4 ${entitiesLabel} Competing`}</span>
          </div>
          <span style="font-size: 0.72rem; color: #EF4444; font-weight: 900; background: rgba(239, 68, 68, 0.18); padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px;">LIVE NOW</span>
        </div>
      ` : `
        <!-- Upcoming Event: 4 Houses Participating -->
        <div class="jais-all-houses-strip">
          <div style="font-size: 0.74rem; color: var(--fm-text-secondary); font-weight: 600;">
            All 4 ${entitiesLabel} Competing
          </div>
          <div class="jais-competing-houses">
            <div class="jais-mini-crest-group">
              ${houses.map(h => `
                <div class="jais-mini-crest-item" title="${h.name}">
                  <img src="assets/crests/${h.id}.svg" alt="${h.name}" />
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}

export function handleSearchInput(val) {
  eventsSearchQuery = val;
  renderEventsPage();
  const inp = document.getElementById("jais-search-input");
  if (inp) {
    inp.focus();
    inp.selectionStart = inp.selectionEnd = inp.value.length;
  }
  // Also show universal search dropdown on mobile if query is non-empty
  const q = (val || "").trim();
  if (q.length >= 2) {
    showUniversalSearchResults(q, "jais-search-input");
  } else {
    document.getElementById("jais-universal-search-dropdown")?.remove();
  }
}

export function toggleSectionCollapse(catId) {
  const body = document.getElementById(`cat-body-${catId}`);
  if (body) {
    const isHidden = body.style.display === "none";
    body.style.display = isHidden ? "block" : "none";
  }
}

/* ==========================================================================
   SCREEN 2: EVENT DETAIL, FACTS & LINEUPS (#/event/:id)
   Accurately renders 4-House Simultaneous Events vs 1v1 Head-to-Head Matches
   ========================================================================== */
export function renderEventDetailPage(params) {
  showScreen("screen-event-detail");
  const container = document.getElementById("screen-event-detail");
  const { houses, events } = getCachedData();
  if (!container) return;

  const eventId = params?.id || "track-100m-boys";
  let ev = events.find(e => e.id === eventId);
  if (!ev) {
    if (eventId && eventId.startsWith("pref-")) {
      ev = getPrefectorialEvents().find(e => e.id === eventId);
    } else {
      const allHousesEvents = (window.currentEventsCache && window.currentEventsCache.length) ? window.currentEventsCache : INITIAL_EVENTS;
      ev = allHousesEvents.find(e => e.id === eventId);
    }
  }
  if (!ev) ev = events[0];
  if (!ev) {
    container.innerHTML = `<div style="padding: 2rem; text-align: center;">Event not found. <a href="#/events" style="color: var(--fm-green);">Back to Matches</a></div>`;
    return;
  }

  const activeHouses = (ev && ev.id && ev.id.startsWith("pref-")) ? getPrefectorialTeams() : houses;
  const isPrefect = isPrefectorialCup() || (ev && ev.id && String(ev.id).startsWith("pref-"));
  const entityLabel = isPrefect ? 'Team' : 'House';
  const entitiesLabel = isPrefect ? 'Teams' : 'Houses';

  // URL query parameter can specify active tab
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("tab")) {
    currentEventTab = urlParams.get("tab");
  }

  const isCompleted = isEventCompleted(ev);
  const isLive = isEventLive(ev);
  const isH2H = (ev.format === "h2h") || (ev.contenders && ev.contenders.length === 2);
  const statusClass = isCompleted ? "completed" : (isLive ? "live" : "upcoming");
  const matrix = ev.pointsMatrix || { first: 100, second: 60, third: 40, fourth: 20 };

  const detailBadgeHtml = isLive
    ? `<span class="jais-status-badge live"><span class="jais-live-beacon" style="width:6px;height:6px;"></span>LIVE</span>`
    : (isCompleted
      ? `<span class="jais-status-badge completed" title="Official Results Recorded &amp; Marked Done">DONE</span>`
      : `<span class="jais-status-badge upcoming">${escapeHtml(ev.scheduledTime || '10:00')}</span>`);

  const res = ev.results || {};
  const house1 = activeHouses.find(h => h.id === (isH2H ? ev.contenders?.[0] : res.first?.houseId)) || activeHouses[0];
  const house2 = activeHouses.find(h => h.id === (isH2H ? ev.contenders?.[1] : res.second?.houseId)) || activeHouses[1];
  const house3 = activeHouses.find(h => h.id === res.third?.houseId) || activeHouses[2];
  const house4 = activeHouses.find(h => h.id === res.fourth?.houseId) || activeHouses[3];

  let score1 = "-";
  let score2 = "-";
  if (isH2H) {
    if (res.first?.score !== undefined) {
      if (typeof res.first.score === "string" && res.first.score.includes("-")) {
        const parts = res.first.score.split("-").map(p => p.trim());
        if (res.first?.houseId === house2.id) {
          score1 = parts[1] ?? "0";
          score2 = parts[0] ?? "0";
        } else {
          score1 = parts[0] ?? "0";
          score2 = parts[1] ?? "0";
        }
      } else {
        if (res.first?.houseId === house1.id) {
          score1 = String(res.first?.score ?? "0");
          score2 = String(res.second?.score ?? "0");
        } else {
          score1 = String(res.second?.score ?? "0");
          score2 = String(res.first?.score ?? "0");
        }
      }
    } else {
      score1 = (isCompleted || isLive) ? "0" : "-";
      score2 = (isCompleted || isLive) ? "0" : "-";
    }
  } else {
    score1 = res.first?.score || (isCompleted ? "10.82s" : "-");
    score2 = res.second?.score || (isCompleted ? "11.04s" : "-");
  }

  container.innerHTML = `
    <!-- Top Navigation Bar -->
    <div class="jais-detail-top-nav">
      <button class="jais-detail-back" onclick="window.appRouter.back()" aria-label="Go Back">
        <span style="display: flex; align-items: center; margin-right: 4px;">${ICONS.backArrow}</span>
      </button>

      <div style="font-weight: 800; font-size: 0.95rem; text-align: center; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${escapeHtml(ev.name)}
      </div>

      <div class="jais-detail-actions">
        <button class="jais-icon-btn" onclick="window.toggleTheme()" aria-label="Toggle Theme">
          ${ICONS.sun}
        </button>
        ${isUserAdmin() ? `
        <button class="jais-icon-btn" onclick="window.location.hash = '#/admin/edit-event/${ev.id}'" title="Edit Event Setup" aria-label="Edit">
          ${ICONS.moreDots}
        </button>` : ''}
      </div>
    </div>

    ${isH2H ? `
      <!-- 1v1 HEAD-TO-HEAD MATCH HERO (Football, Basketball, Tug-of-War Matchup) -->
      <div class="jais-match-hero">
        <div class="jais-hero-meta-row" style="margin-bottom: 0.75rem;">
          <span class="jais-division-pill">${escapeHtml(ev.category)} &bull; ${escapeHtml(ev.gender || 'All')}</span>
          <span class="jais-fourhouse-pill" style="color: #60A5FA; background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3);">1v1 Match</span>
          ${detailBadgeHtml}
        </div>

        <div class="jais-hero-teams-row">
          <!-- Team 1 -->
          <div class="jais-hero-club" onclick="window.location.hash = '#/house/${house1.id}'" style="cursor: pointer;">
            <div class="jais-hero-crest-lg" style="border-color: ${house1.color};">
              <img src="assets/crests/${house1.id}.svg" alt="${house1.name}" />
            </div>
            <div class="jais-hero-club-name">${escapeHtml(house1.name)}</div>
          </div>

          <!-- Big Score Box -->
          <div class="jais-hero-score-box">
            <div class="jais-hero-score-text" style="color: ${isLive ? '#EF4444' : 'var(--fm-text-primary)'}; font-size: 2.2rem; font-weight: 900; letter-spacing: -0.5px;">
              ${isCompleted || isLive ? `${score1} - ${score2}` : (ev.scheduledTime || '11:00')}
            </div>
            <div class="jais-hero-match-status" style="color: ${isLive ? '#EF4444' : (isCompleted ? 'var(--fm-green)' : 'var(--fm-text-secondary)')}; font-weight: 800;">
              ${isCompleted ? 'DONE • Final Score' : (isLive ? '● Live In Arena' : 'Scheduled')}
            </div>
          </div>

          <!-- Team 2 -->
          <div class="jais-hero-club" onclick="window.location.hash = '#/house/${house2.id}'" style="cursor: pointer;">
            <div class="jais-hero-crest-lg" style="border-color: ${house2.color};">
              <img src="assets/crests/${house2.id}.svg" alt="${house2.name}" />
            </div>
            <div class="jais-hero-club-name">${escapeHtml(house2.name)}</div>
          </div>
        </div>

        ${isUserAdmin() ? `
        <!-- Live Score Points Quick-Adder for Basketball & Football -->
        <div class="jais-live-pts-controller" style="margin-top: 0.85rem; padding: 0.65rem 0.85rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.7rem; font-weight: 800; color: var(--fm-text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">
              ${(ev.name || '').toLowerCase().includes('basketball') || ev.category === 'Basketball' ? 'Live Basketball Score &bull; Quick Points Adder' : 'Live Football Match &bull; Quick Score Controls'}
            </span>
            <a href="#/admin/score/${ev.id}" style="font-size: 0.7rem; color: var(--fm-green); font-weight: 700; text-decoration: none;">
              Official Scorecard &rarr;
            </a>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem;">
            <!-- Team 1 -->
            <div style="background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.45rem; text-align: center;">
              <div style="font-size: 0.74rem; font-weight: 800; color: ${house1.color}; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHtml(house1.name)} (${score1})
              </div>
              <div class="jais-live-pts-bar" style="justify-content: center;">
                ${(ev.name || '').toLowerCase().includes('basketball') || ev.category === 'Basketball' ? `
                  <button type="button" class="jais-live-pts-btn ft" onclick="window.pages.adjustLiveScore('${ev.id}', 1, 1, 'ft')" title="Free Throw (+1)">+1 FT</button>
                  <button type="button" class="jais-live-pts-btn fg" onclick="window.pages.adjustLiveScore('${ev.id}', 1, 2, 'fg')" title="Field Goal (+2)">+2 FG</button>
                  <button type="button" class="jais-live-pts-btn three-pt" onclick="window.pages.adjustLiveScore('${ev.id}', 1, 3, '3pt')" title="Three Pointer (+3)">+3 3PT</button>
                  <button type="button" class="jais-live-pts-btn undo" onclick="window.pages.adjustLiveScore('${ev.id}', 1, -1, 'sub')" title="Subtract 1">-1</button>
                ` : `
                  <button type="button" class="jais-live-pts-btn fg" onclick="window.pages.adjustLiveScore('${ev.id}', 1, 1, 'goal')" title="Add 1 Goal">+1 Goal</button>
                  <button type="button" class="jais-live-pts-btn undo" onclick="window.pages.adjustLiveScore('${ev.id}', 1, -1, 'sub')" title="Subtract 1 Goal">-1</button>
                `}
              </div>
            </div>

            <!-- Team 2 -->
            <div style="background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.45rem; text-align: center;">
              <div style="font-size: 0.74rem; font-weight: 800; color: ${house2.color}; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHtml(house2.name)} (${score2})
              </div>
              <div class="jais-live-pts-bar" style="justify-content: center;">
                ${(ev.name || '').toLowerCase().includes('basketball') || ev.category === 'Basketball' ? `
                  <button type="button" class="jais-live-pts-btn ft" onclick="window.pages.adjustLiveScore('${ev.id}', 2, 1, 'ft')" title="Free Throw (+1)">+1 FT</button>
                  <button type="button" class="jais-live-pts-btn fg" onclick="window.pages.adjustLiveScore('${ev.id}', 2, 2, 'fg')" title="Field Goal (+2)">+2 FG</button>
                  <button type="button" class="jais-live-pts-btn three-pt" onclick="window.pages.adjustLiveScore('${ev.id}', 2, 3, '3pt')" title="Three Pointer (+3)">+3 3PT</button>
                  <button type="button" class="jais-live-pts-btn undo" onclick="window.pages.adjustLiveScore('${ev.id}', 2, -1, 'sub')" title="Subtract 1">-1</button>
                ` : `
                  <button type="button" class="jais-live-pts-btn fg" onclick="window.pages.adjustLiveScore('${ev.id}', 2, 1, 'goal')" title="Add 1 Goal">+1 Goal</button>
                  <button type="button" class="jais-live-pts-btn undo" onclick="window.pages.adjustLiveScore('${ev.id}', 2, -1, 'sub')" title="Subtract 1 Goal">-1</button>
                `}
              </div>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Goal / Point Scorers Timeline in Match Hero -->
        ${res.scorers && res.scorers.length > 0 ? `
          <div class="jais-match-scorers-timeline">
            <div style="font-size: 0.68rem; font-weight: 800; color: var(--fm-text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
              ${(ev.name || '').toLowerCase().includes('basketball') || ev.category === 'Basketball' ? 'Point Scorers' : 'Goal Scorers'}
            </div>
            ${res.scorers.map(sc => {
              const scHouse = houses.find(h => h.id === sc.houseId) || {};
              const isT1 = sc.houseId === house1.id;
              return `
                <div class="jais-match-scorer-row ${isT1 ? 't1-scorer' : 't2-scorer'}">
                  <span class="jais-scorer-icon" style="display:inline-flex;align-items:center;">${(ev.name || '').toLowerCase().includes('basketball') || ev.category === 'Basketball' ? ICONS.basketball : ICONS.football}</span>
                  <a href="#/athlete/${encodeURIComponent(sc.athlete || '')}" class="jais-scorer-name clickable-student" style="color: inherit; text-decoration: none;">
                    <strong>${escapeHtml(sc.athlete || 'Player')}</strong>
                  </a>
                  ${sc.minute ? `<span class="jais-scorer-min">${escapeHtml(sc.minute)}</span>` : ''}
                  ${sc.assist ? `<span style="font-size: 0.68rem; color: var(--fm-text-secondary); margin-left: 3px;">(ast: <a href="#/athlete/${encodeURIComponent(sc.assist)}" class="clickable-student" style="color: var(--fm-green); text-decoration: none;">${escapeHtml(sc.assist)}</a>)</span>` : ''}
                  <span class="jais-scorer-dot" style="background: ${scHouse.color || '#999'};" title="${scHouse.name || ''}"></span>
                </div>
              `;
            }).join("")}
          </div>
        ` : ''}

        ${ev.notes ? `
          <div style="font-size: 0.76rem; color: var(--fm-text-secondary); margin-top: 0.25rem;">
            ${escapeHtml(ev.notes)}
          </div>
        ` : ''}

        ${isCompleted && res.summary ? `
          <div style="font-size: 0.74rem; color: var(--fm-green); margin-top: 0.5rem; font-weight: 700;">
            ${escapeHtml(res.summary)}
          </div>
        ` : ''}
      </div>
    ` : `
      <!-- 4-HOUSE ALL-COMERS EVENT HERO (100m, 200m, Field, Novelty Races) -->
      <div class="jais-event-allhouses-hero">
        <div class="jais-hero-meta-row">
          <span class="jais-division-pill">${escapeHtml(ev.category)} &bull; ${escapeHtml(ev.gender || 'All')}</span>
          <span class="jais-fourhouse-pill">${ev.category === 'Field' ? `Field Sector • All 4 ${entitiesLabel}` : `All 4 ${entitiesLabel} Simultaneous`}</span>
          ${detailBadgeHtml}
        </div>

        <h1 class="jais-fourhouse-title">${escapeHtml(ev.name)}</h1>

        ${isCompleted ? `
          <!-- Champion Spotlight Box -->
          <div class="jais-champion-spotlight">
            <div class="jais-champion-crest" style="border-color: ${house1.color}; box-shadow: 0 0 20px ${house1.color}50;">
              <img src="assets/crests/${house1.id}.svg" alt="${house1.name}" />
            </div>
            <div class="jais-champion-info">
              <div class="jais-champion-tag" style="color: var(--fm-gold); font-size: 0.72rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 4px;">
                ${ICONS.goldMedal} 1ST PLACE WINNER &bull; EVENT DONE
              </div>
              <div class="jais-champion-athlete">
                <a href="#/athlete/${encodeURIComponent(res.first?.athlete || house1.name)}" class="clickable-student" style="color: inherit; text-decoration: none;">
                  ${escapeHtml(res.first?.athlete || house1.name)}
                </a>
              </div>
              <div class="jais-champion-mark">
                <span>${escapeHtml(res.first?.score || 'Winner')}</span>
                <span class="jais-champion-pts" style="color: var(--fm-gold); font-weight: 800;">GOLD MEDAL &bull; ${house1.name}${isPrefect ? '' : ' House'}</span>
              </div>
            </div>
          </div>

          <!-- Full Placement Standings -->
          <div class="jais-fourhouse-finish-grid">
            <!-- 1st -->
            <div class="jais-finish-card" style="border-left: 4px solid ${house1.color};">
              <div class="jais-finish-rank" style="color: var(--fm-gold);">${ICONS.goldMedal} 1st</div>
              <div class="jais-finish-crest"><img src="assets/crests/${house1.id}.svg" alt="${house1.name}" /></div>
              <div class="jais-finish-details">
                <div class="jais-finish-athlete">
                  <a href="#/athlete/${encodeURIComponent(res.first?.athlete || house1.name)}" class="clickable-student" style="color: inherit; text-decoration: none;">
                    <strong>${escapeHtml(res.first?.athlete || house1.name)}</strong>
                  </a>
                </div>
                <div class="jais-finish-house" style="color: ${house1.color};">${house1.name}${isPrefect ? '' : ' House'}</div>
              </div>
              <div class="jais-finish-score">
                <div class="jais-finish-mark">${escapeHtml(res.first?.score || '-')}</div>
                <div class="jais-finish-pts" style="color: var(--fm-gold); font-weight: 800;">Gold</div>
              </div>
            </div>

            <!-- 2nd -->
            <div class="jais-finish-card" style="border-left: 4px solid ${house2.color};">
              <div class="jais-finish-rank" style="color: var(--fm-silver);">${ICONS.silverMedal} 2nd</div>
              <div class="jais-finish-crest"><img src="assets/crests/${house2.id}.svg" alt="${house2.name}" /></div>
              <div class="jais-finish-details">
                <div class="jais-finish-athlete">
                  <a href="#/athlete/${encodeURIComponent(res.second?.athlete || house2.name)}" class="clickable-student" style="color: inherit; text-decoration: none;">
                    <strong>${escapeHtml(res.second?.athlete || house2.name)}</strong>
                  </a>
                </div>
                <div class="jais-finish-house" style="color: ${house2.color};">${house2.name}${isPrefect ? '' : ' House'}</div>
              </div>
              <div class="jais-finish-score">
                <div class="jais-finish-mark">${escapeHtml(res.second?.score || '-')}</div>
                <div class="jais-finish-pts" style="color: var(--fm-silver); font-weight: 800;">Silver</div>
              </div>
            </div>

            <!-- 3rd -->
            <div class="jais-finish-card" style="border-left: 4px solid ${house3.color};">
              <div class="jais-finish-rank" style="color: var(--fm-bronze);">${ICONS.bronzeMedal} 3rd</div>
              <div class="jais-finish-crest"><img src="assets/crests/${house3.id}.svg" alt="${house3.name}" /></div>
              <div class="jais-finish-details">
                <div class="jais-finish-athlete">
                  <a href="#/athlete/${encodeURIComponent(res.third?.athlete || house3.name)}" class="clickable-student" style="color: inherit; text-decoration: none;">
                    <strong>${escapeHtml(res.third?.athlete || house3.name)}</strong>
                  </a>
                </div>
                <div class="jais-finish-house" style="color: ${house3.color};">${house3.name}${isPrefect ? '' : ' House'}</div>
              </div>
              <div class="jais-finish-score">
                <div class="jais-finish-mark">${escapeHtml(res.third?.score || '-')}</div>
                <div class="jais-finish-pts" style="color: var(--fm-bronze); font-weight: 800;">Bronze</div>
              </div>
            </div>

            <!-- 4th -->
            <div class="jais-finish-card" style="border-left: 4px solid ${house4.color};">
              <div class="jais-finish-rank" style="color: #64748B;">${ICONS.fourthMedal} 4th</div>
              <div class="jais-finish-crest"><img src="assets/crests/${house4.id}.svg" alt="${house4.name}" /></div>
              <div class="jais-finish-details">
                <div class="jais-finish-athlete">
                  <a href="#/athlete/${encodeURIComponent(res.fourth?.athlete || house4.name)}" class="clickable-student" style="color: inherit; text-decoration: none;">
                    <strong>${escapeHtml(res.fourth?.athlete || house4.name)}</strong>
                  </a>
                </div>
                <div class="jais-finish-house" style="color: ${house4.color};">${house4.name}${isPrefect ? '' : ' House'}</div>
              </div>
              <div class="jais-finish-score">
                <div class="jais-finish-mark">${escapeHtml(res.fourth?.score || '-')}</div>
                <div class="jais-finish-pts" style="color: #94A3B8; font-weight: 700;">4th Place</div>
              </div>
            </div>
          </div>
        ` : `
          <!-- Upcoming or Live: All 4 Houses in Lanes or Field Order -->
          <div class="jais-fourhouse-lanes-box">
            <div class="jais-lanes-header">
              <span>${ev.category === 'Field' ? 'Field Sector • Throwing / Jump Order' : 'Track Lanes • Starting Positions'}</span>
              <span style="color: ${isLive ? 'var(--fm-red)' : 'var(--fm-green)'}; font-weight: 800;">
                ${isLive ? (ev.category === 'Field' ? '● LIVE AT FIELD SECTOR' : '● LIVE ON TRACK') : (ev.scheduledTime || '10:00 AM')}
              </span>
            </div>

            <div class="jais-lanes-grid">
              ${houses.map((h, i) => `
                <div class="jais-lane-item" onclick="window.location.hash = '#/house/${h.id}'" style="cursor: pointer;">
                  <span class="jais-lane-num" style="background: ${h.color}; color: ${h.textColor || '#FFF'};">${ev.category === 'Field' ? `Order ${i+1}` : `Lane ${i+1}`}</span>
                  <div class="jais-lane-crest" style="border-color: ${h.color};">
                    <img src="assets/crests/${h.id}.svg" alt="${h.name}" />
                  </div>
                  <span class="jais-lane-name">${h.name}</span>
                </div>
              `).join("")}
            </div>

            <!-- Medal Podium Honours Badges -->
            <div class="jais-points-pills-row">
              <span class="jais-pts-pill gold">${ICONS.goldMedal} 1st: Gold Medal</span>
              <span class="jais-pts-pill silver">${ICONS.silverMedal} 2nd: Silver Medal</span>
              <span class="jais-pts-pill bronze">${ICONS.bronzeMedal} 3rd: Bronze Medal</span>
              <span class="jais-pts-pill fourth">${ICONS.fourthMedal} 4th: 4th Place</span>
            </div>
          </div>
        `}
      </div>
    `}

    <!-- Sub-Tabs Bar -->
    <div class="jais-sub-tabs-bar">
      <button class="jais-sub-tab ${currentEventTab === 'facts' ? 'active' : ''}" onclick="window.pages.setEventDetailTab('facts', '${ev.id}')">
        Facts
      </button>
      <button class="jais-sub-tab ${currentEventTab === 'lineup' ? 'active' : ''}" onclick="window.pages.setEventDetailTab('lineup', '${ev.id}')">
        ${isH2H ? 'Lineup' : (ev.category === 'Field' ? 'Contenders & Order' : 'Lanes / Athletes')}
      </button>
      ${isH2H ? `
        <button class="jais-sub-tab ${currentEventTab === 'h2h' ? 'active' : ''}" onclick="window.pages.setEventDetailTab('h2h', '${ev.id}')">
          H2H
        </button>
      ` : ''}
      <button class="jais-sub-tab ${currentEventTab === 'table' ? 'active' : ''}" onclick="window.pages.setEventDetailTab('table', '${ev.id}')">
        Table
      </button>
    </div>

    <!-- Active Sub-Tab Viewport Content -->
    <div style="padding: 1rem 0.75rem 2rem;">
      ${renderSubTabContent(currentEventTab, ev, houses, isH2H, events)}
    </div>
  `;
}

function renderSubTabContent(tab, ev, houses, isH2H, events) {
  const isPrefect = isPrefectorialCup() || (ev && ev.id && String(ev.id).startsWith("pref-"));
  if (tab === "lineup") {
    if (isH2H) {
      const house1 = houses.find(h => h.id === ev.contenders?.[0]) || houses[0];
      const house2 = houses.find(h => h.id === ev.contenders?.[1]) || houses[1];
      return `
        <div class="jais-section-card" style="margin: 0;">
          <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); font-weight: 800; font-size: 0.85rem;">
            Official Match Lineups
          </div>
          <div style="padding: 1rem; display: flex; flex-direction: column; gap: 1rem;">
            <div>
              <div style="font-weight: 800; font-size: 0.88rem; color: ${house1.color}; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 6px;">
                <img src="assets/crests/${house1.id}.svg" alt="${house1.name}" style="width: 20px; height: 20px;" />
                ${house1.name}${isPrefect ? '' : ' House'} Squad
              </div>
              <div style="font-size: 0.8rem; color: var(--fm-text-secondary);">
                ${isPrefect ? 'Team Leader / Prefect' : 'House Captain'}: <strong>${escapeHtml(house1.captain || 'Student Leader')}</strong>
              </div>
            </div>
            <div style="border-top: 1px dashed var(--fm-border); padding-top: 0.75rem;">
              <div style="font-weight: 800; font-size: 0.88rem; color: ${house2.color}; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 6px;">
                <img src="assets/crests/${house2.id}.svg" alt="${house2.name}" style="width: 20px; height: 20px;" />
                ${house2.name}${isPrefect ? '' : ' House'} Squad
              </div>
              <div style="font-size: 0.8rem; color: var(--fm-text-secondary);">
                ${isPrefect ? 'Team Leader / Prefect' : 'House Captain'}: <strong>${escapeHtml(house2.captain || 'Student Leader')}</strong>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    return `
      <div class="jais-section-card" style="margin: 0;">
        <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); font-weight: 800; font-size: 0.85rem;">
          ${ev.category === 'Field' ? 'Field Sector Roster & Throw / Jump Order' : (isPrefect ? 'Lane Assignments & Team Athletes' : 'Lane Assignments & House Athletes')}
        </div>
        ${houses.map((h, idx) => {
          const placingKey = ['first', 'second', 'third', 'fourth'][idx];
          const athlete = ev.results?.[placingKey]?.athlete || `${h.name} Athlete`;
          const positionLabel = ev.category === 'Field' ? `Order ${idx+1}` : `Lane ${idx+1}`;
          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border);">
              <div style="display: flex; align-items: center; gap: 0.65rem;">
                <span class="jais-lane-num" style="background: ${h.color}; color: ${h.textColor || '#FFF'};">${positionLabel}</span>
                <div class="jais-team-crest-sm">
                  <img src="assets/crests/${h.id}.svg" alt="${h.name}" />
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 0.88rem; color: var(--fm-text-primary);">${escapeHtml(athlete)}</div>
                  <div style="font-size: 0.72rem; color: ${h.color}; font-weight: 600;">${escapeHtml(h.name)}${isPrefect ? '' : ' House'}</div>
                </div>
              </div>
              <span class="jais-status-badge upcoming" style="font-size: 0.68rem;">
                ${positionLabel}
              </span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  if (tab === "table") {
    const isFootball = (ev.name || "").toLowerCase().includes("football") || (ev.id || "").includes("football") || ev.category === "Football";
    const isBasketball = (ev.name || "").toLowerCase().includes("basketball") || (ev.id || "").includes("basketball") || ev.category === "Basketball";
    if (isFootball) {
      return renderFootballTable(houses, events);
    }
    if (isBasketball) {
      return renderBasketballTable(houses, events);
    }
    return renderMiniStandingsTable(houses);
  }

  if (tab === "h2h" && isH2H) {
    const house1 = houses.find(h => h.id === ev.contenders?.[0]) || houses[0];
    const house2 = houses.find(h => h.id === ev.contenders?.[1]) || houses[1];
    return `
      <div class="jais-section-card" style="margin: 0; padding: 1rem;">
        <div style="font-weight: 800; font-size: 0.85rem; margin-bottom: 1rem;">
          Head-to-Head Comparison
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.82rem;">
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: ${house1.color}; font-weight: 700;">${house1.name}</span>
              <strong>Championship Points</strong>
              <span style="color: ${house2.color}; font-weight: 700;">${house2.name}</span>
            </div>
            <div style="height: 6px; background: var(--fm-surface-elevated); border-radius: 3px; display: flex; overflow: hidden;">
              <div style="width: 50%; background: ${house1.color};"></div>
              <div style="width: 50%; background: ${house2.color};"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>${house1.goldCount || 0} Gold</span>
              <strong>Medals Won</strong>
              <span>${house2.goldCount || 0} Gold</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Default: Facts Tab
  const matrix = ev.pointsMatrix || { first: 100, second: 60, third: 40, fourth: 20 };
  const isCompleted = isEventCompleted(ev);
  const isLive = isEventLive(ev);
  return `
    <div class="jais-section-card" style="margin: 0 0 1rem;">
      <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); font-weight: 800; font-size: 0.85rem; color: var(--fm-text-primary);">
        Event Facts &amp; Specifications
      </div>

      <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); display: flex; justify-content: space-between; font-size: 0.82rem;">
        <span style="color: var(--fm-text-secondary);">Sport / Event</span>
        <strong>${escapeHtml(ev.name)}</strong>
      </div>

      <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); display: flex; justify-content: space-between; font-size: 0.82rem;">
        <span style="color: var(--fm-text-secondary);">Competition Format</span>
        <strong>${isH2H ? 'Head-to-Head 1v1 Match' : (isPrefect ? 'All 4 Teams Simultaneous' : 'All 4 Houses Simultaneous')}</strong>
      </div>

      <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); display: flex; justify-content: space-between; font-size: 0.82rem;">
        <span style="color: var(--fm-text-secondary);">Category &bull; Division</span>
        <strong>${escapeHtml(ev.category)} &bull; ${escapeHtml(ev.gender || 'Boys & Girls')}</strong>
      </div>

      <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); display: flex; justify-content: space-between; font-size: 0.82rem;">
        <span style="color: var(--fm-text-secondary);">${isLive ? 'Event Status' : (isCompleted ? 'Event Status' : 'Scheduled Time')}</span>
        <strong>
          ${isLive 
            ? '<span style="color: #EF4444; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;"><span class="jais-live-beacon" style="width:6px;height:6px;"></span>LIVE NOW IN ARENA</span>' 
            : (isCompleted 
              ? '<span style="color: var(--fm-green); font-weight: 800;">DONE (Completed)</span>' 
              : escapeHtml(ev.scheduledTime || '10:00 AM'))}
        </strong>
      </div>

      <div style="padding: 0.75rem 1rem; display: flex; justify-content: space-between; font-size: 0.82rem;">
        <span style="color: var(--fm-text-secondary);">Venue / Area</span>
        <strong>${isH2H ? 'Main Sports Pitch / Court A' : 'Main Athletic Oval &bull; Lanes 1-4'}</strong>
      </div>
      ${ev.lastEditedBy ? `
        <div style="padding: 0.75rem 1rem; border-top: 1px solid var(--fm-border); background: var(--fm-surface-elevated); display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
          <span style="color: var(--fm-text-secondary); display: flex; align-items: center; gap: 4px;">
            Official Audit Record:
          </span>
          <span style="font-weight: 700; color: var(--fm-green);">
            ${escapeHtml(ev.lastEditedBy.adminId)} (${escapeHtml(ev.lastEditedBy.name)}) &bull; ${escapeHtml(ev.lastEditedFormatted || ev.lastEditedAt || '')}
          </span>
        </div>
      ` : ''}
    </div>

    <!-- Points or Medals Awarded Card -->
    <div class="jais-section-card" style="margin: 0;">
      <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); font-weight: 800; font-size: 0.85rem; color: var(--fm-text-primary);">
        ${isH2H ? 'Match Points Awarded (Point System)' : 'Medals &amp; Podium Honors Awarded'}
      </div>

      ${isH2H ? `
        <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>•</span>
            <span>Match Winner</span>
          </div>
          <strong style="color: var(--fm-green); font-size: 0.95rem;">+3 Match PTS</strong>
        </div>
        <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>•</span>
            <span>Draw (Tied Match)</span>
          </div>
          <strong style="color: #60A5FA; font-size: 0.95rem;">+1 Match PT Each</strong>
        </div>
        <div style="padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>•</span>
            <span>Match Runner-Up</span>
          </div>
          <strong style="color: var(--fm-text-secondary); font-size: 0.95rem;">0 PTS</strong>
        </div>
      ` : `
        <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>${ICONS.goldMedal}</span>
            <span>1st Place Winner</span>
          </div>
          <strong style="color: var(--fm-gold); font-size: 0.95rem;">Gold Medal</strong>
        </div>
        <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>${ICONS.silverMedal}</span>
            <span>2nd Place</span>
          </div>
          <strong style="color: var(--fm-silver); font-size: 0.95rem;">Silver Medal</strong>
        </div>
        <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>${ICONS.bronzeMedal}</span>
            <span>3rd Place</span>
          </div>
          <strong style="color: var(--fm-bronze); font-size: 0.95rem;">Bronze Medal</strong>
        </div>
        <div style="padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>${ICONS.fourthMedal}</span>
            <span>4th Place</span>
          </div>
          <strong style="color: #94A3B8; font-size: 0.95rem;">4th Place Official Finish</strong>
        </div>
      `}
    </div>
  `;
}

function renderMiniStandingsTable(houses) {
  return `
    <div class="jais-table-card" style="margin: 0;">
      <div class="jais-table-head-row medal-mode">
        <span class="jais-col-rank">#</span>
        <span style="flex: 1; min-width: 0;">${isPrefectorialCup() ? 'Team' : 'House'}</span>
        <span class="jais-col-medal gold" title="Gold Medals">G</span>
        <span class="jais-col-medal silver" title="Silver Medals">S</span>
        <span class="jais-col-medal bronze" title="Bronze Medals">B</span>
        <span class="jais-col-medal total" title="Total Medals">TOT</span>
      </div>
      ${houses.map((h, idx) => {
        const totalMedals = (h.goldCount || 0) + (h.silverCount || 0) + (h.bronzeCount || 0);
        return `
          <div class="jais-table-data-row medal-mode ${idx < 2 ? 'qual-leader' : ''}" onclick="window.location.hash = '#/house/${h.id}'">
            <span class="jais-col-rank">${idx + 1}</span>
            <div class="jais-col-team">
              <div class="jais-team-crest-md">
                <img src="assets/crests/${h.id}.svg" alt="${h.name}" />
              </div>
              <span class="jais-team-name-text">${escapeHtml(h.name)}</span>
            </div>
            <span class="jais-col-medal gold">${h.goldCount || 0}</span>
            <span class="jais-col-medal silver">${h.silverCount || 0}</span>
            <span class="jais-col-medal bronze">${h.bronzeCount || 0}</span>
            <span class="jais-col-medal total">${totalMedals}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

export function calculateFootballStandings(houses, events) {
  const table = {};
  (houses || []).forEach(h => {
    table[h.id] = {
      ...h,
      p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0
    };
  });

  (events || []).forEach(ev => {
    const isFootball = (ev.name || "").toLowerCase().includes("football") || (ev.id || "").includes("football") || (ev.id || "").startsWith("fb-") || ev.category === "Football";
    if (!isFootball) return;

    // Strictly calculate Group Stage round-robin matches (exactly 3 per team across Matchdays 1, 2, 3)
    const isGroupStage = (ev.stage === "group" || (ev.id || "").startsWith("fb-group")) && !((ev.id || "").includes("knockout") || (ev.name || "").toLowerCase().includes("final") || (ev.name || "").toLowerCase().includes("3rd place"));
    if (!isGroupStage) return;

    const res = ev.results || {};
    const house1Id = ev.contenders?.[0] || res.first?.houseId;
    const house2Id = ev.contenders?.[1] || res.second?.houseId;
    if (!house1Id || !house2Id || !table[house1Id] || !table[house2Id]) return;

    let s1 = 0;
    let s2 = 0;
    let hasScore = false;

    if (typeof res.first?.score === "string" && res.first.score.includes("-")) {
      const parts = res.first.score.split("-").map(p => parseInt(p.trim(), 10));
      if (!isNaN(parts[0]) && !isNaN(parts[1])) {
        if (res.first?.houseId === house2Id) {
          s1 = parts[1];
          s2 = parts[0];
        } else {
          s1 = parts[0];
          s2 = parts[1];
        }
        hasScore = true;
      }
    } else if (res.first?.score !== undefined) {
      if (res.first?.houseId === house2Id) {
        s1 = parseInt(res.second?.score, 10) || 0;
        s2 = parseInt(res.first?.score, 10) || 0;
      } else {
        s1 = parseInt(res.first?.score, 10) || 0;
        s2 = parseInt(res.second?.score, 10) || 0;
      }
      hasScore = true;
    }

    const isMatchActiveOrDone = isEventCompleted(ev) || isEventLive(ev);
    if (!isMatchActiveOrDone || !hasScore) return;

    table[house1Id].p += 1;
    table[house2Id].p += 1;
    table[house1Id].gf += s1;
    table[house1Id].ga += s2;
    table[house2Id].gf += s2;
    table[house2Id].ga += s1;
    table[house1Id].gd = table[house1Id].gf - table[house1Id].ga;
    table[house2Id].gd = table[house2Id].gf - table[house2Id].ga;

    if (s1 > s2) {
      table[house1Id].w += 1;
      table[house1Id].pts += 3;
      table[house2Id].l += 1;
    } else if (s2 > s1) {
      table[house2Id].w += 1;
      table[house2Id].pts += 3;
      table[house1Id].l += 1;
    } else {
      table[house1Id].d += 1;
      table[house1Id].pts += 1;
      table[house2Id].d += 1;
      table[house2Id].pts += 1;
    }
  });

  const list = Object.values(table);
  list.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
  return list;
}

export function calculateBasketballStandings(houses, events) {
  const table = {};
  (houses || []).forEach(h => {
    table[h.id] = {
      ...h,
      p: 0, w: 0, l: 0, pf: 0, pa: 0, diff: 0, pts: 0
    };
  });

  (events || []).forEach(ev => {
    const isBasketball = (ev.name || "").toLowerCase().includes("basketball") || (ev.id || "").includes("basketball") || (ev.id || "").startsWith("bb-") || ev.category === "Basketball";
    if (!isBasketball) return;

    const res = ev.results || {};
    const house1Id = ev.contenders?.[0] || res.first?.houseId;
    const house2Id = ev.contenders?.[1] || res.second?.houseId;
    if (!house1Id || !house2Id || !table[house1Id] || !table[house2Id]) return;

    let s1 = 0;
    let s2 = 0;
    let hasScore = false;

    if (typeof res.first?.score === "string" && res.first.score.includes("-")) {
      const parts = res.first.score.split("-").map(p => parseInt(p.trim(), 10));
      if (!isNaN(parts[0]) && !isNaN(parts[1])) {
        if (res.first?.houseId === house2Id) {
          s1 = parts[1];
          s2 = parts[0];
        } else {
          s1 = parts[0];
          s2 = parts[1];
        }
        hasScore = true;
      }
    } else if (res.first?.score !== undefined) {
      if (res.first?.houseId === house2Id) {
        s1 = parseInt(res.second?.score, 10) || 0;
        s2 = parseInt(res.first?.score, 10) || 0;
      } else {
        s1 = parseInt(res.first?.score, 10) || 0;
        s2 = parseInt(res.second?.score, 10) || 0;
      }
      hasScore = true;
    }

    const isMatchActiveOrDone = isEventCompleted(ev) || isEventLive(ev);
    if (!isMatchActiveOrDone || !hasScore) return;

    table[house1Id].p += 1;
    table[house2Id].p += 1;
    table[house1Id].pf += s1;
    table[house1Id].pa += s2;
    table[house2Id].pf += s2;
    table[house2Id].pa += s1;
    table[house1Id].diff = table[house1Id].pf - table[house1Id].pa;
    table[house2Id].diff = table[house2Id].pf - table[house2Id].pa;

    if (s1 > s2) {
      table[house1Id].w += 1;
      table[house1Id].pts += 3;
      table[house2Id].l += 1;
    } else if (s2 > s1) {
      table[house2Id].w += 1;
      table[house2Id].pts += 3;
      table[house1Id].l += 1;
    } else {
      table[house1Id].pts += 1;
      table[house2Id].pts += 1;
    }
  });

  const list = Object.values(table);
  list.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.diff !== a.diff) return b.diff - a.diff;
    return b.pf - a.pf;
  });
  return list;
}

function renderH2HMatchPillCard(ev, houses, badgeLabel, highlightClass = "") {
  if (!ev) return "";
  const house1 = houses.find(h => h.id === ev.contenders?.[0]) || { id: ev.contenders?.[0] || "phoenix", name: "Team 1", color: "#EF4444" };
  const house2 = houses.find(h => h.id === ev.contenders?.[1]) || { id: ev.contenders?.[1] || "swift", name: "Team 2", color: "#3B82F6" };

  let score1 = "-";
  let score2 = "-";
  const res = ev.results || {};
  if (res.first?.score !== undefined) {
    const firstScoreStr = String(res.first.score).trim();
    if (firstScoreStr.includes("-")) {
      const parts = firstScoreStr.split("-").map(p => p.trim());
      if (res.first?.houseId === house2.id) {
        score1 = parts[1] ?? "0";
        score2 = parts[0] ?? "0";
      } else {
        score1 = parts[0] ?? "0";
        score2 = parts[1] ?? "0";
      }
    } else {
      if (res.first?.houseId === house2.id) {
        score1 = String(res.second?.score ?? 0);
        score2 = String(res.first?.score ?? 0);
      } else {
        score1 = String(res.first?.score ?? 0);
        score2 = String(res.second?.score ?? 0);
      }
    }
  }

  const isDone = isEventCompleted(ev);
  const isLive = isEventLive(ev);
  const s1Num = parseInt(score1, 10);
  const s2Num = parseInt(score2, 10);
  const isDrawn = !isNaN(s1Num) && !isNaN(s2Num) && s1Num === s2Num;
  const winnerId = !isDrawn && !isNaN(s1Num) && !isNaN(s2Num) ? (s1Num > s2Num ? house1.id : house2.id) : null;

  return `
    <div class="jais-bracket-match-card ${highlightClass}" onclick="window.location.hash = '#/event/${ev.id}'" style="cursor: pointer;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
        <span style="font-size: 0.65rem; font-weight: 800; color: var(--fm-text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">
          ${escapeHtml(badgeLabel || ev.name)}
        </span>
        ${isLive ? `<span class="jais-status-badge live" style="font-size: 0.6rem; padding: 1px 6px;">● LIVE</span>` : (isDone ? `<span class="jais-status-badge completed" style="font-size: 0.6rem; padding: 1px 6px;">DONE</span>` : `<span class="jais-status-badge upcoming" style="font-size: 0.6rem; padding: 1px 6px;">${escapeHtml(ev.scheduledTime || '10:00')}</span>`)}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.2rem 0;">
        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
          <div class="jais-team-crest-sm" style="border: 1px solid ${house1.color || '#EF4444'}; width: 28px; height: 28px;">
            <img src="assets/crests/${house1.id}.svg" alt="${house1.name}" />
          </div>
          <span style="font-size: 0.82rem; font-weight: ${winnerId === house1.id ? '900' : '600'}; color: ${winnerId === house1.id ? 'var(--fm-text-primary)' : 'var(--fm-text-secondary)'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHtml(house1.name)}
          </span>
        </div>

        <div style="padding: 0 0.65rem; font-size: 1.05rem; font-weight: 900; color: ${isLive ? '#EF4444' : 'var(--fm-text-primary)'}; white-space: nowrap;">
          ${isDone || isLive ? `${score1} - ${score2}` : 'vs'}
        </div>

        <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-end; flex: 1; min-width: 0;">
          <span style="font-size: 0.82rem; font-weight: ${winnerId === house2.id ? '900' : '600'}; color: ${winnerId === house2.id ? 'var(--fm-text-primary)' : 'var(--fm-text-secondary)'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHtml(house2.name)}
          </span>
          <div class="jais-team-crest-sm" style="border: 1px solid ${house2.color || '#3B82F6'}; width: 28px; height: 28px;">
            <img src="assets/crests/${house2.id}.svg" alt="${house2.name}" />
          </div>
        </div>
      </div>

      ${isDone && (winnerId || isDrawn) ? `
        <div style="margin-top: 0.4rem; padding-top: 0.35rem; border-top: 1px dashed var(--fm-border); font-size: 0.65rem; font-weight: 800; color: var(--fm-green); display: flex; justify-content: space-between;">
          <span>${isDrawn ? 'Match Drawn (1 PT Each)' : `Winner: ${escapeHtml(winnerId === house1.id ? house1.name : house2.name)}`}</span>
          <span style="color: var(--fm-text-muted);">View / Score &rarr;</span>
        </div>
      ` : ''}
    </div>
  `;
}

export function renderFootballTable(houses, events) {
  const standings = calculateFootballStandings(houses, events);

  // Group stage matches & knockout matches
  const fbEvents = (events || []).filter(e => (e.name || "").toLowerCase().includes("football") || (e.id || "").includes("football") || (e.id || "").startsWith("fb-") || e.category === "Football");
  const groupMatches = fbEvents.filter(e => e.stage === "group" || (e.id || "").includes("fb-group"));
  const finalMatch = fbEvents.find(e => e.id === "fb-knockout-final" || (e.knockoutRound === "final") || ((e.name || "").toLowerCase().includes("final") && !(e.name || "").toLowerCase().includes("semi")));
  const thirdMatch = fbEvents.find(e => e.id === "fb-knockout-third" || (e.knockoutRound === "third_place") || (e.name || "").toLowerCase().includes("3rd place"));

  // Matchdays
  const md1Matches = groupMatches.filter(e => e.matchday === 1 || (e.id || "").includes("md1"));
  const md2Matches = groupMatches.filter(e => e.matchday === 2 || (e.id || "").includes("md2"));
  const md3Matches = groupMatches.filter(e => e.matchday === 3 || (e.id || "").includes("md3"));

  return `
    <div class="jais-tournament-wrapper">
      <!-- Section 1: Official Group Stage Table (3 Matches Per Team) -->
      <div class="jais-table-card" style="margin: 0;">
        <div style="padding: 0.75rem 0.85rem; border-bottom: 1px solid var(--fm-border); background: var(--fm-surface-elevated); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <div>
            <div style="font-size: 0.84rem; font-weight: 900; color: var(--fm-green); display: flex; align-items: center; gap: 6px;">
              <span>⚽</span>
              <span>Football Group Stage • Official Standings Table</span>
            </div>
            <div style="font-size: 0.68rem; color: var(--fm-text-secondary); margin-top: 2px;">
              Single Round-Robin Format: Exactly 3 matches per team • Win: 3 PTS • Draw: 1 PT • Loss: 0 PTS
            </div>
          </div>
          <span class="jais-chip" style="margin: 0; padding: 2px 8px; font-size: 0.65rem; color: var(--fm-green); background: rgba(0, 230, 118, 0.1); border-color: rgba(0, 230, 118, 0.25);">
            6 Matches Total
          </span>
        </div>

        <div class="jais-table-head-row football-mode">
          <span class="jais-col-rank">#</span>
          <span style="flex: 1; min-width: 0;">${isPrefectorialCup() ? 'Team' : 'House'}</span>
          <span class="jais-col-medal" title="Played">P</span>
          <span class="jais-col-medal" title="Won">W</span>
          <span class="jais-col-medal" title="Drawn">D</span>
          <span class="jais-col-medal" title="Lost">L</span>
          <span class="jais-col-medal" title="Goals For">GF</span>
          <span class="jais-col-medal" title="Goals Against">GA</span>
          <span class="jais-col-medal" title="Goal Difference">GD</span>
          <span class="jais-col-medal total" title="Points">PTS</span>
        </div>

        ${standings.map((h, idx) => `
          <div class="jais-table-data-row football-mode ${idx < 2 ? 'qual-leader' : ''}" onclick="window.location.hash = '#/house/${h.id}'">
            <span class="jais-col-rank">${idx + 1}</span>
            <div class="jais-col-team">
              <div class="jais-team-crest-md">
                <img src="assets/crests/${h.id}.svg" alt="${h.name}" />
              </div>
              <div style="display: flex; flex-direction: column; min-width: 0;">
                <span class="jais-team-name-text">${escapeHtml(h.name)}</span>
                <span style="font-size: 0.62rem; font-weight: 800; color: ${idx < 2 ? 'var(--fm-green)' : '#F59E0B'};">
                  ${idx < 2 ? '🏆 Qualified: Championship Final (Gold/Silver)' : '🥉 Qualified: 3rd Place Match (Bronze)'}
                </span>
              </div>
            </div>
            <span class="jais-col-medal">${h.p}</span>
            <span class="jais-col-medal">${h.w}</span>
            <span class="jais-col-medal">${h.d}</span>
            <span class="jais-col-medal">${h.l}</span>
            <span class="jais-col-medal">${h.gf}</span>
            <span class="jais-col-medal">${h.ga}</span>
            <span class="jais-col-medal" style="color: ${h.gd > 0 ? 'var(--fm-green)' : (h.gd < 0 ? '#EF4444' : 'var(--fm-text-secondary)')}; font-weight: 700;">
              ${h.gd > 0 ? `+${h.gd}` : h.gd}
            </span>
            <span class="jais-col-medal total">${h.pts}</span>
          </div>
        `).join("")}
      </div>

      <!-- Section 2: Knockout Finals Stage (Championship Final & 3rd Place Playoff) -->
      <div class="jais-table-card" style="margin: 0;">
        <div style="padding: 0.75rem 0.85rem; border-bottom: 1px solid var(--fm-border); background: var(--fm-surface-elevated); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <div>
            <div style="font-size: 0.84rem; font-weight: 900; color: var(--fm-gold); display: flex; align-items: center; gap: 6px;">
              <span>🏆</span>
              <span>Football Knockout Stage • Medal Finals</span>
            </div>
            <div style="font-size: 0.68rem; color: var(--fm-text-secondary); margin-top: 2px;">
              Top 2 advance to Gold/Silver Championship Final • 3rd &amp; 4th contest Bronze Medal
            </div>
          </div>
          <span class="jais-chip" style="margin: 0; padding: 2px 8px; font-size: 0.65rem; color: var(--fm-gold); background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.25);">
            Medal Stage
          </span>
        </div>

        <div class="jais-bracket-grid">
          <div>
            ${renderH2HMatchPillCard(finalMatch, houses, "🏆 Championship Final (Gold & Silver Medal)", "final-highlight")}
          </div>
          <div>
            ${renderH2HMatchPillCard(thirdMatch, houses, "🥉 3rd Place Playoff (Bronze Medal)", "bronze-highlight")}
          </div>
        </div>
      </div>

      <!-- Section 3: Group Stage Fixtures (Matchdays 1, 2, 3) -->
      <div class="jais-table-card" style="margin: 0;">
        <div style="padding: 0.75rem 0.85rem; border-bottom: 1px solid var(--fm-border); background: var(--fm-surface-elevated); display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 0.84rem; font-weight: 900; color: var(--fm-text-primary);">
            <span>📅</span> Group Stage Fixtures &amp; Results (3 Matches Per Team)
          </div>
          <span style="font-size: 0.7rem; color: var(--fm-text-secondary); font-weight: 700;">6 Fixtures</span>
        </div>

        <div style="padding: 0.5rem 0.85rem 1rem;">
          <!-- Matchday 1 -->
          <div class="jais-matchday-group">
            <div class="jais-matchday-title">
              <span>● Matchday 1 (Round 1)</span>
            </div>
            <div class="jais-bracket-grid" style="padding: 0 0 0.5rem;">
              ${md1Matches.map(m => renderH2HMatchPillCard(m, houses, "Matchday 1 Match")).join("")}
            </div>
          </div>

          <!-- Matchday 2 -->
          <div class="jais-matchday-group">
            <div class="jais-matchday-title">
              <span>● Matchday 2 (Round 2)</span>
            </div>
            <div class="jais-bracket-grid" style="padding: 0 0 0.5rem;">
              ${md2Matches.map(m => renderH2HMatchPillCard(m, houses, "Matchday 2 Match")).join("")}
            </div>
          </div>

          <!-- Matchday 3 -->
          <div class="jais-matchday-group">
            <div class="jais-matchday-title">
              <span>● Matchday 3 (Round 3 Decider)</span>
            </div>
            <div class="jais-bracket-grid" style="padding: 0;">
              ${md3Matches.map(m => renderH2HMatchPillCard(m, houses, "Matchday 3 Match")).join("")}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderBasketballTable(houses, events) {
  // Basketball is purely knockout: Semi-Final 1, Semi-Final 2, 3rd Place Match, Championship Final
  const bbEvents = (events || []).filter(e => (e.name || "").toLowerCase().includes("basketball") || (e.id || "").includes("basketball") || (e.id || "").startsWith("bb-") || e.category === "Basketball");
  
  const sf1Match = bbEvents.find(e => e.id === "bb-knockout-sf1" || (e.knockoutRound === "semi_final" && (e.name || "").includes("1")) || ((e.name || "").toLowerCase().includes("semi-final 1") || (e.name || "").toLowerCase().includes("semi 1")));
  const sf2Match = bbEvents.find(e => e.id === "bb-knockout-sf2" || (e.knockoutRound === "semi_final" && (e.name || "").includes("2")) || ((e.name || "").toLowerCase().includes("semi-final 2") || (e.name || "").toLowerCase().includes("semi 2")));
  const finalMatch = bbEvents.find(e => e.id === "bb-knockout-final" || (e.knockoutRound === "final") || ((e.name || "").toLowerCase().includes("final") && !(e.name || "").toLowerCase().includes("semi")));
  const thirdMatch = bbEvents.find(e => e.id === "bb-knockout-third" || (e.knockoutRound === "third_place") || (e.name || "").toLowerCase().includes("3rd place"));

  return `
    <div class="jais-tournament-wrapper">
      <!-- Basketball Knockout Bracket Header -->
      <div class="jais-table-card" style="margin: 0;">
        <div style="padding: 0.75rem 0.85rem; border-bottom: 1px solid var(--fm-border); background: var(--fm-surface-elevated); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <div>
            <div style="font-size: 0.84rem; font-weight: 900; color: #60A5FA; display: flex; align-items: center; gap: 6px;">
              <span>🏀</span>
              <span>Basketball Championship • Pure Knockout Bracket</span>
            </div>
            <div style="font-size: 0.68rem; color: var(--fm-text-secondary); margin-top: 2px;">
              Straight Knockout Format: Semi-Finals &rarr; Championship Finals &amp; 3rd Place Bronze Match
            </div>
          </div>
          <span class="jais-chip" style="margin: 0; padding: 2px 8px; font-size: 0.65rem; color: #60A5FA; background: rgba(96, 165, 250, 0.1); border-color: rgba(96, 165, 250, 0.3);">
            Knockout Only
          </span>
        </div>

        <div style="padding: 1rem 0.85rem;">
          <div style="font-size: 0.72rem; font-weight: 800; color: var(--fm-text-secondary); text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.04em;">
            STAGE 1: Semi-Finals (Winners advance to Gold Final)
          </div>
          <div class="jais-bracket-grid" style="padding: 0 0 1rem;">
            <div>
              ${renderH2HMatchPillCard(sf1Match, houses, "🏀 Semi-Final 1 (Knockout)")}
            </div>
            <div>
              ${renderH2HMatchPillCard(sf2Match, houses, "🏀 Semi-Final 2 (Knockout)")}
            </div>
          </div>

          <div style="font-size: 0.72rem; font-weight: 800; color: var(--fm-gold); text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.04em;">
            STAGE 2: Medal Finals (Championship Final &amp; 3rd Place Match)
          </div>
          <div class="jais-bracket-grid" style="padding: 0;">
            <div>
              ${renderH2HMatchPillCard(finalMatch, houses, "🏆 Championship Final (Gold & Silver Medal)", "final-highlight")}
            </div>
            <div>
              ${renderH2HMatchPillCard(thirdMatch, houses, "🥉 3rd Place Playoff (Bronze Medal)", "bronze-highlight")}
            </div>
          </div>
        </div>
      </div>

      <!-- Basketball Medal Podium & Points Summary -->
      <div class="jais-table-card" style="margin: 0;">
        <div style="padding: 0.75rem 0.85rem; border-bottom: 1px solid var(--fm-border); background: var(--fm-surface-elevated); display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 0.82rem; font-weight: 900; color: var(--fm-text-primary);">
            <span>🏅</span> Basketball Championship Podium &amp; Points Awarded
          </div>
          <span style="font-size: 0.7rem; color: var(--fm-text-secondary); font-weight: 700;">Official Results</span>
        </div>

        <div style="padding: 0.85rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
          <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 10px; padding: 0.75rem; text-align: center;">
            <div style="font-size: 1.5rem; margin-bottom: 2px;">🥇</div>
            <div style="font-size: 0.72rem; font-weight: 800; color: var(--fm-gold); text-transform: uppercase;">Gold Champion</div>
            <div style="font-size: 1rem; font-weight: 900; color: var(--fm-text-primary); margin: 2px 0;">Phoenix House</div>
            <div style="font-size: 0.72rem; color: var(--fm-green); font-weight: 800;">150 PTS</div>
          </div>

          <div style="background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.35); border-radius: 10px; padding: 0.75rem; text-align: center;">
            <div style="font-size: 1.5rem; margin-bottom: 2px;">🥈</div>
            <div style="font-size: 0.72rem; font-weight: 800; color: #94A3B8; text-transform: uppercase;">Silver Runner-Up</div>
            <div style="font-size: 1rem; font-weight: 900; color: var(--fm-text-primary); margin: 2px 0;">Swift House</div>
            <div style="font-size: 0.72rem; color: var(--fm-green); font-weight: 800;">90 PTS</div>
          </div>

          <div style="background: rgba(205, 127, 50, 0.1); border: 1px solid rgba(205, 127, 50, 0.35); border-radius: 10px; padding: 0.75rem; text-align: center;">
            <div style="font-size: 1.5rem; margin-bottom: 2px;">🥉</div>
            <div style="font-size: 0.72rem; font-weight: 800; color: #CD7F32; text-transform: uppercase;">Bronze 3rd Place</div>
            <div style="font-size: 1rem; font-weight: 900; color: var(--fm-text-primary); margin: 2px 0;">Merlin House</div>
            <div style="font-size: 0.72rem; color: var(--fm-green); font-weight: 800;">60 PTS</div>
          </div>

          <div style="background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 10px; padding: 0.75rem; text-align: center;">
            <div style="font-size: 1.5rem; margin-bottom: 2px;">4️⃣</div>
            <div style="font-size: 0.72rem; font-weight: 800; color: var(--fm-text-secondary); text-transform: uppercase;">4th Place</div>
            <div style="font-size: 1rem; font-weight: 900; color: var(--fm-text-primary); margin: 2px 0;">Eagle House</div>
            <div style="font-size: 0.72rem; color: var(--fm-text-secondary); font-weight: 800;">30 PTS</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function adjustLiveScore(eventId, teamNum, delta, ptsType) {
  if (!isUserAdmin()) { alert("Official access required."); return; }
  const { events, houses } = getCachedData();
  const ev = events.find(e => e.id === eventId);
  if (!ev) return;

  const contenders = ev.contenders || ["phoenix", "eagle"];
  const t1 = contenders[0];
  const t2 = contenders[1];
  const house1 = houses.find(h => h.id === t1) || { name: t1 };
  const house2 = houses.find(h => h.id === t2) || { name: t2 };

  let currentS1 = 0;
  let currentS2 = 0;

  const input1 = document.getElementById("score-team-1-val");
  const input2 = document.getElementById("score-team-2-val");

  if (input1 && input2) {
    currentS1 = parseInt(input1.value, 10) || 0;
    currentS2 = parseInt(input2.value, 10) || 0;
  } else if (ev.results) {
    if (typeof ev.results.first?.score === "string" && ev.results.first.score.includes("-")) {
      const parts = ev.results.first.score.split("-").map(p => parseInt(p.trim(), 10));
      if (ev.results.first?.houseId === t2) {
        currentS2 = isNaN(parts[0]) ? 0 : parts[0];
        currentS1 = isNaN(parts[1]) ? 0 : parts[1];
      } else {
        currentS1 = isNaN(parts[0]) ? 0 : parts[0];
        currentS2 = isNaN(parts[1]) ? 0 : parts[1];
      }
    } else {
      if (ev.results.first?.houseId === t2) {
        currentS2 = parseInt(ev.results.first?.score, 10) || 0;
        currentS1 = parseInt(ev.results.second?.score, 10) || 0;
      } else {
        currentS1 = parseInt(ev.results.first?.score, 10) || 0;
        currentS2 = parseInt(ev.results.second?.score, 10) || 0;
      }
    }
  }

  if (teamNum === 1) {
    currentS1 = Math.max(0, currentS1 + delta);
  } else {
    currentS2 = Math.max(0, currentS2 + delta);
  }

  if (input1) input1.value = currentS1;
  if (input2) input2.value = currentS2;

  playTapSound();

  const isDraw = currentS1 === currentS2;
  const winnerId = currentS1 >= currentS2 ? t1 : t2;
  const loserId = winnerId === t1 ? t2 : t1;
  const winnerName = winnerId === t1 ? house1.name : house2.name;
  const loserName = loserId === t1 ? house1.name : house2.name;
  const winScore = winnerId === t1 ? currentS1 : currentS2;
  const loseScore = winnerId === t1 ? currentS2 : currentS1;

  const placings = {
    first: { houseId: winnerId, athlete: `${winnerName} Squad`, score: `${winScore} - ${loseScore}`, points: isDraw ? 1 : 3 },
    second: { houseId: loserId, athlete: `${loserName} Squad`, score: `${loseScore}`, points: isDraw ? 1 : 0 },
    third: { houseId: "", points: 0 },
    fourth: { houseId: "", points: 0 },
    summary: isDraw ? `Live Draw (${currentS1}-${currentS2})` : `${winnerName} leading (${winScore}-${loseScore})`,
    scorers: ev.results?.scorers || []
  };

  const newStatus = (ev.status === "completed" || ev.status === "done") ? ev.status : "live";
  ev.status = newStatus;
  ev.results = placings;
  ev.isLive = newStatus === "live";

  if (window.currentEventsCache) {
    const idx = window.currentEventsCache.findIndex(e => e.id === eventId);
    if (idx >= 0) {
      window.currentEventsCache[idx] = { ...window.currentEventsCache[idx], status: newStatus, results: placings, isLive: newStatus === "live" };
    }
  }
  if (window.currentPrefEventsCache) {
    const idx = window.currentPrefEventsCache.findIndex(e => e.id === eventId);
    if (idx >= 0) {
      window.currentPrefEventsCache[idx] = { ...window.currentPrefEventsCache[idx], status: newStatus, results: placings, isLive: newStatus === "live" };
    }
  }

  try {
    await submitEventScore(eventId, placings, newStatus, ev.notes || "", contenders);
  } catch (err) {
    console.warn("Offline/local score adjustment update:", err);
  }

  const activeDetail = document.getElementById("screen-event-detail");
  if (activeDetail && activeDetail.classList.contains("active")) {
    renderEventDetailPage({ id: eventId });
  }

  const activeTable = document.getElementById("screen-table");
  if (activeTable && activeTable.classList.contains("active")) {
    renderTablePage();
  }
}

/* ==========================================================================
   SCREEN 3 & SCREEN 5: LEAGUE STANDINGS TABLE (#/table)
   Interhouse Medal Standings Table (Points Reserved for Football & Basketball)
   ========================================================================== */
/**
 * A house's last four finishing positions (1-4) across completed events, oldest first.
 * Drawn matches are skipped since nobody "finished" anywhere.
 */
function getHouseForm(houseId, events) {
  const places = ["first", "second", "third", "fourth"];
  return (events || [])
    .filter(ev => isEventCompleted(ev) && ev.results && ev.results.isDraw !== true)
    .sort((a, b) => new Date(a.completedAt || a.updatedAt || 0) - new Date(b.completedAt || b.updatedAt || 0))
    .map(ev => places.findIndex(pl => ev.results[pl]?.houseId === houseId) + 1)
    .filter(pos => pos > 0)
    .slice(-4);
}

export function renderTablePage() {
  showScreen("screen-table");
  const container = document.getElementById("screen-table");
  const { houses, events } = getCachedData();
  if (!container) return;

  tableSubView = "full";

  const isFootball = tableCategoryFilter === "football";
  const isBasketball = tableCategoryFilter === "basketball";
  const isTeamView = tableCategoryFilter === "team" || isFootball || isBasketball;

  // For Track / Field / Novelty views, count only medals from that category's completed events.
  const categoryKey = ["track", "field", "novelty"].includes(tableCategoryFilter) ? tableCategoryFilter : null;
  const rankingHouses = categoryKey
    ? houses.map(h => ({ ...h, goldCount: 0, silverCount: 0, bronzeCount: 0 }))
    : houses;
  if (categoryKey) {
    const byId = Object.fromEntries(rankingHouses.map(h => [h.id, h]));
    events.forEach(ev => {
      if (!isEventCompleted(ev) || !ev.results) return;
      if ((ev.category || "").toLowerCase() !== categoryKey) return;
      // A drawn match awards no medals (only team events can draw, so this is just a safeguard)
      if (ev.results.isDraw === true) return;
      const medal = { first: "goldCount", second: "silverCount", third: "bronzeCount" };
      Object.entries(medal).forEach(([place, field]) => {
        const hid = ev.results[place]?.houseId;
        if (hid && byId[hid]) byId[hid][field] += 1;
      });
    });
  }

  // Sort houses according to active category filter
  const sortedHouses = [...rankingHouses].sort((a, b) => {
    if (isTeamView) {
      // Football & Basketball Point System (Win = 3, Draw = 1)
      if ((b.teamPoints || 0) !== (a.teamPoints || 0)) return (b.teamPoints || 0) - (a.teamPoints || 0);
      return (b.teamWins || 0) - (a.teamWins || 0);
    }
    // All other categories ranked primarily by Medals:
    if ((b.goldCount || 0) !== (a.goldCount || 0)) return (b.goldCount || 0) - (a.goldCount || 0);
    if ((b.silverCount || 0) !== (a.silverCount || 0)) return (b.silverCount || 0) - (a.silverCount || 0);
    if ((b.bronzeCount || 0) !== (a.bronzeCount || 0)) return (b.bronzeCount || 0) - (a.bronzeCount || 0);
    const bMedals = (b.goldCount || 0) + (b.silverCount || 0) + (b.bronzeCount || 0);
    const aMedals = (a.goldCount || 0) + (a.silverCount || 0) + (a.bronzeCount || 0);
    if (bMedals !== aMedals) return bMedals - aMedals;
    return (b.teamPoints || 0) - (a.teamPoints || 0);
  });

  const fbStandings = calculateFootballStandings(houses, events);
  const bbStandings = calculateBasketballStandings(houses, events);



  // SCREEN 3: DARK MODE FULL STANDINGS TABLE (Screenshot 3)
  container.innerHTML = `
    ${renderTabTopBar('TABLE<span class="plus">2026</span>')}

    <!-- Competition Header (Screenshot 3: Crest + Title + Subtitle) -->
    <div class="jais-league-header">
      <div class="jais-league-badge" style="background: #ffffff; padding: 2px; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.25); overflow: hidden;">
        <img src="assets/juilliard-logo.png" alt="Juilliard Academy" style="width: 100%; height: 100%; object-fit: contain;" />
      </div>
      <div class="jais-league-titles">
        <h1>${isPrefectorialCup() ? 'Juilliard Prefectship Cup' : 'Juilliard Interhouse Cup'}</h1>
        <p>${isPrefectorialCup() ? 'Official Prefectship Squad Standings • Live Medal &amp; Points System 2026' : (isFootball ? 'Official Football League Standings • Live Point System' : (isBasketball ? 'Official Basketball Standings • Live Point System' : (isTeamView ? 'Football & Basketball League Tables • Points System' : 'Official Interhouse Medal Standings • 2026')))}</p>
      </div>
    </div>

    <!-- Competition Sub-Tabs: Table | Fixtures | Houses | News (Screenshot 3) -->
    <div class="jais-sub-tabs-bar" style="margin-bottom: 0.5rem;">
      <a href="#/table" class="jais-sub-tab active">Table</a>
      <a href="#/events" class="jais-sub-tab">Fixtures</a>
      <a href="#/houses" class="jais-sub-tab">${isPrefectorialCup() ? 'Teams' : 'Houses'}</a>
      <a href="#/news" class="jais-sub-tab">News &amp; Media</a>
    </div>

    <!-- Sub-Pills Strip: Full Table | Category Dropdown (Screenshot 3) -->
    <div class="jais-subpills-strip">
      <div class="jais-subpills-cluster">
        <button class="jais-subpill-btn active" onclick="window.pages.setTableSubView('full')">Full</button>
      </div>

      <!-- Category Filter Dropdown (Overall, Football, Basketball, Track, Field, Novelty, Team) -->
      <div class="jais-dropdown-label" title="Filter standings table by category">
        <select class="jais-category-filter-select" onchange="window.pages.setTableCategoryFilter(this.value)" aria-label="Filter standings table">
          <option value="overall" style="background-color: #16171d; color: #f3f4f8;" ${tableCategoryFilter === 'overall' ? 'selected' : ''}>Medal Table (Overall)</option>
          <option value="football" style="background-color: #16171d; color: #f3f4f8;" ${tableCategoryFilter === 'football' ? 'selected' : ''}>Football League Table (Live Points)</option>
          <option value="basketball" style="background-color: #16171d; color: #f3f4f8;" ${tableCategoryFilter === 'basketball' ? 'selected' : ''}>Basketball Standings (Live Points)</option>
          <option value="track" style="background-color: #16171d; color: #f3f4f8;" ${tableCategoryFilter === 'track' ? 'selected' : ''}>Track &amp; Races (Medals)</option>
          <option value="field" style="background-color: #16171d; color: #f3f4f8;" ${tableCategoryFilter === 'field' ? 'selected' : ''}>Field Events (Medals)</option>
          <option value="novelty" style="background-color: #16171d; color: #f3f4f8;" ${tableCategoryFilter === 'novelty' ? 'selected' : ''}>Novelties (Medals)</option>
          <option value="team" style="background-color: #16171d; color: #f3f4f8;" ${tableCategoryFilter === 'team' ? 'selected' : ''}>Football &amp; Basketball (Points)</option>
        </select>
        <span class="jais-dropdown-caret">▾</span>
      </div>
    </div>

    <!-- Standings Table Container -->
    <div class="jais-table-container">
      ${isFootball ? `
        ${renderFootballTable(houses, events)}
      ` : (isBasketball ? `
        ${renderBasketballTable(houses, events)}
      ` : (tableCategoryFilter === 'team' ? `
        ${renderFootballTable(houses, events)}
        <div style="height: 1.25rem;"></div>
        ${renderBasketballTable(houses, events)}
      ` : `
        <!-- INTERHOUSE MEDAL STANDINGS TABLE -->
        <div class="jais-table-card">
          <div class="jais-table-head-row medal-mode">
            <span class="jais-col-rank">#</span>
            <span style="flex: 1; min-width: 0;">${isPrefectorialCup() ? 'Team' : 'House'}</span>
            <span class="jais-col-medal gold" title="Gold Medals (1st Place)">G</span>
            <span class="jais-col-medal silver" title="Silver Medals (2nd Place)">S</span>
            <span class="jais-col-medal bronze" title="Bronze Medals (3rd Place)">B</span>
            <span class="jais-col-medal total" title="Total Medals Won">MEDALS</span>
          </div>

          ${sortedHouses.map((h, idx) => {
            const totalMedals = (h.goldCount || 0) + (h.silverCount || 0) + (h.bronzeCount || 0);

            return `
              <div class="jais-table-data-row medal-mode ${idx < 2 ? 'qual-leader' : ''}" onclick="window.location.hash = '#/house/${h.id}'">
                <span class="jais-col-rank">${idx + 1}</span>

                <div class="jais-col-team">
                  <div class="jais-team-crest-md">
                    <img src="assets/crests/${h.id}.svg" alt="${h.name}" />
                  </div>
                  <span class="jais-team-name-text">${escapeHtml(h.name)}</span>
                </div>

                <span class="jais-col-medal gold">${h.goldCount || 0}</span>
                <span class="jais-col-medal silver">${h.silverCount || 0}</span>
                <span class="jais-col-medal bronze">${h.bronzeCount || 0}</span>
                
                <span class="jais-col-medal total">${totalMedals}</span>
              </div>
            `;
          }).join("")}
        </div>
      `))}

      <!-- Qualification Legend -->
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.72rem; color: var(--fm-text-secondary); padding: 0.75rem 0.5rem 1rem;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="width: 8px; height: 8px; border-radius: 2px; background-color: var(--fm-green); display: inline-block;"></span>
          <span>${isFootball ? 'Football League Standings (Win: 3 PTS • Draw: 1 PT • Loss: 0 PTS)' : (isBasketball ? 'Basketball Standings (Win: 3 PTS • Loss: 0 PTS)' : (isTeamView ? 'Championship Playoff Zone (Points System)' : 'Champions Podium • Ranked by Gold, Silver &amp; Bronze'))}</span>
        </div>
        ${!isTeamView ? `<span style="font-weight: 700; color: var(--fm-gold);">Medal Standings</span>` : `<span style="font-weight: 700; color: var(--fm-green);">Live Point System</span>`}
      </div>
    </div>
  `;
}

/* ==========================================================================
   SCREEN 6: HOUSE SUPPORTER ONBOARDING & DISCREET OFFICIAL LOGIN (#/onboarding)
   ========================================================================== */
let currentOnboardingStep = 1;

export function renderWelcomePage() {
  currentOnboardingStep = 1;
  renderOnboardingPage();
}

export function onboardingChooseTournament(comp) {
  playTapSound();
  setActiveCompetition(comp);
  currentOnboardingStep = 2;
  renderOnboardingPage();
}

export function onboardingBackToStep1() {
  playTapSound();
  currentOnboardingStep = 1;
  renderOnboardingPage();
}

export function renderOnboardingPage() {
  showScreen("screen-onboarding");
  const container = document.getElementById("screen-onboarding");
  if (!container) return;

  renderDesktopSidebars();

  const activeComp = getActiveCompetition();
  const isPref = activeComp === "prefectorial";
  const displayTeams = isPref 
    ? getPrefectorialTeams() 
    : ((window.currentHousesCache && window.currentHousesCache.length) ? window.currentHousesCache : INITIAL_HOUSES);

  if (currentOnboardingStep === 1) {
    // STEP 1: TWO BIG BUTTONS (PREFECTORIAL CUP / INTER-HOUSE SPORTS) FIRST!
    container.innerHTML = `
      <div class="jais-onboarding-hero" style="text-align: center;">
        <div style="display: flex; justify-content: center; margin-bottom: 0.75rem;">
          <div style="width: 76px; height: 76px; border-radius: 50%; background: #ffffff; padding: 4px; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35); display: flex; align-items: center; justify-content: center; overflow: hidden;">
            <img src="assets/juilliard-logo.png" alt="Juilliard Academy" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
        </div>
        <div class="jais-brand-logo" style="font-size: 1.85rem; margin-bottom: 0.35rem; font-family: var(--font-display); font-weight: 900; letter-spacing: -0.02em;">
          JUILLIARD <span style="color: var(--fm-green);">+</span>
        </div>
        <h1 class="jais-onboarding-title" style="font-size: 1.5rem; font-weight: 800; margin: 0.25rem 0 0.4rem;">Select Tournament</h1>
        <p class="jais-onboarding-sub" style="font-size: 0.85rem; color: var(--fm-text-secondary); margin: 0 0 1rem;">
          Choose a championship competition below to enter:
        </p>
      </div>

      <!-- STEP 1: TWO PROMINENT BUTTONS FIRST -->
      <div class="jais-onboarding-comp-picker">
        <!-- Button 1: Prefectship Cup -->
        <button type="button" class="jais-onboarding-comp-btn pref-cup-btn" onclick="window.pages.onboardingChooseTournament('prefectorial')">
          <div class="comp-icon-wrap" style="background: rgba(245, 158, 11, 0.18); border: 2px solid #F59E0B;">
            🏆
          </div>
          <div class="comp-btn-text">
            <span style="font-size: 0.68rem; font-weight: 800; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.06em;">PRE-SEASON SHOWDOWN</span>
            <strong style="color: #F59E0B; font-size: 1.3rem; font-family: var(--font-display); line-height: 1.2;">Prefectship Cup</strong>
            <span style="color: var(--fm-text-secondary); font-size: 0.78rem;">
              Team Ihechukwu • Team Fortune • Team Osaruyi • Team Titemi
            </span>
          </div>
          <span class="comp-arrow">&rarr;</span>
        </button>

        <!-- Button 2: Inter-House Sports -->
        <button type="button" class="jais-onboarding-comp-btn inter-house-btn" onclick="window.pages.onboardingChooseTournament('interhouse')">
          <div class="comp-icon-wrap" style="background: rgba(59, 130, 246, 0.18); border: 2px solid #3B82F6;">
            🥇
          </div>
          <div class="comp-btn-text">
            <span style="font-size: 0.68rem; font-weight: 800; color: #60A5FA; text-transform: uppercase; letter-spacing: 0.06em;">ANNUAL CHAMPIONSHIP</span>
            <strong style="color: #60A5FA; font-size: 1.3rem; font-family: var(--font-display); line-height: 1.2;">Inter-House Sports</strong>
            <span style="color: var(--fm-text-secondary); font-size: 0.78rem;">
              Phoenix (Red) • Merlin (Blue) • Swift (Yellow) • Eagle (Orange)
            </span>
          </div>
          <span class="comp-arrow">&rarr;</span>
        </button>
      </div>

      <!-- Discreet Official / Field Marshal Portal at Bottom -->
      ${renderOfficialLoginPortalHtml()}
    `;
    return;
  }

  // STEP 2: "THEN THIS" -> Which team / house are you supporting?
  const currentSupport = isPref 
    ? (localStorage.getItem("juilliard_supported_pref_team") || "team-ihechukwu")
    : (localStorage.getItem("juilliard_supported_house") || "phoenix");

  container.innerHTML = `
    <div class="jais-onboarding-hero" style="text-align: center;">
      <div style="display: flex; justify-content: center; margin-bottom: 0.75rem;">
        <div style="width: 72px; height: 72px; border-radius: 50%; background: #ffffff; padding: 4px; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35); display: flex; align-items: center; justify-content: center; overflow: hidden;">
          <img src="assets/juilliard-logo.png" alt="Juilliard Academy" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
      </div>
      <div class="jais-brand-logo" style="font-size: 1.65rem; margin-bottom: 0.35rem; font-family: var(--font-display); font-weight: 900;">
        JUILLIARD <span style="color: var(--fm-green);">+</span>
      </div>
      <div style="display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 12px; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; background: ${isPref ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)'}; color: ${isPref ? 'var(--fm-gold)' : '#60A5FA'}; border: 1px solid ${isPref ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)'}; margin-bottom: 0.5rem;">
        ${isPref ? '🏆 PREFECTSHIP CUP' : '🥇 INTER-HOUSE SPORTS'}
      </div>
      <h1 class="jais-onboarding-title" style="font-size: 1.45rem; font-weight: 800; margin: 0.25rem 0 0.35rem;">
        ${isPref ? 'Which team are you supporting?' : 'Which house are you supporting?'}
      </h1>
      <p class="jais-onboarding-sub" style="font-size: 0.85rem; color: var(--fm-text-secondary); margin: 0 0 1.25rem;">
        ${isPref ? 'Personalize your live scores, match notifications, and cheer feed for the Prefectship Cup.' : 'Personalize your live scores, match notifications, and cheer feed.'}
      </p>
    </div>

    <!-- 4 Selection Cards in 2x2 Grid -->
    <div class="jais-house-picker-grid">
      ${displayTeams.map(h => {
        const isSelected = currentSupport === h.id;
        return `
          <div class="jais-house-card-choice ${isSelected ? 'selected' : ''}"
               style="--house-color: ${h.color};"
               onclick="window.pages.selectSupportedHouse('${h.id}')">
            <div class="crest-wrap" style="border: 2px solid ${h.color};">
              <img src="assets/crests/${h.id}.svg" alt="${h.name}" />
            </div>
            <strong>${escapeHtml(h.name)}</strong>
            <span style="font-size: 0.72rem; color: var(--fm-text-secondary);">${escapeHtml(h.motto || (h.captain ? 'Capt: ' + h.captain : ''))}</span>
            ${isSelected ? `
              <div style="position: absolute; top: 8px; right: 8px; color: var(--fm-green); font-size: 0.95rem;">
                ${ICONS.check}
              </div>
            ` : ''}
          </div>
        `;
      }).join("")}
    </div>

    <!-- Supporter Name / Nickname Input -->
    <div style="margin: 1.25rem 0 0.85rem; text-align: left; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 12px; padding: 0.85rem 1rem;">
      <label for="onboarding-user-name" style="display: block; font-size: 0.78rem; font-weight: 800; color: var(--fm-text-primary); margin-bottom: 4px;">
        What should we call you? (Your Name or Supporter Handle)
      </label>
      <div style="font-size: 0.72rem; color: var(--fm-text-secondary); margin-bottom: 8px;">
        Used when cheering on your house, posting match comments, and participating in live reactions.
      </div>
      <input type="text" id="onboarding-user-name" class="jais-text-input" 
             placeholder="e.g. David A., Coach Sarah, or BlueEagle99"
             value="${escapeHtml(localStorage.getItem('jais_user_name') || '')}"
             oninput="window.pages.saveOnboardingUserName(this.value)"
             style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.65rem 0.85rem; color: var(--fm-text-primary); font-size: 0.9rem;" />
    </div>

    <!-- Primary Continue Action -->
    <button class="jais-cta-btn" onclick="window.pages.handleContinueArena()">
      Continue to Live Arena &rarr;
    </button>

    <!-- Switch Back to Step 1 Button -->
    <button type="button" class="jais-btn-back-step" onclick="window.pages.onboardingBackToStep1()">
      &larr; Switch Tournament (Prefectship Cup / Inter-House Sports)
    </button>

    <!-- Discreet Official / Field Marshal Portal at Bottom -->
    ${renderOfficialLoginPortalHtml()}
  `;
}

export function saveOnboardingUserName(val) {
  const clean = (val || "").trim();
  if (clean) {
    localStorage.setItem("jais_user_name", clean);
  } else {
    localStorage.removeItem("jais_user_name");
  }
}

export function getCurrentUserName() {
  return localStorage.getItem("jais_user_name") || "Supporter";
}

export function promptChangeUserName() {
  const current = getCurrentUserName();
  const newName = prompt("Enter your name or nickname for comments & cheers:", current === "Supporter" ? "" : current);
  if (newName !== null) {
    const clean = newName.trim();
    if (clean) {
      localStorage.setItem("jais_user_name", clean);
      showToastNotification(`Posting as ${clean}`, "success");
    } else {
      localStorage.setItem("jais_user_name", "Supporter");
      showToastNotification("Posting as Supporter", "info");
    }
    const authorBadge = document.getElementById("jais-comment-current-user-display");
    if (authorBadge) authorBadge.textContent = getCurrentUserName();
  }
}

export function selectSupportedHouse(houseId) {
  playTapSound();
  const isPref = isPrefectorialCup();
  if (isPref) {
    localStorage.setItem("juilliard_supported_pref_team", houseId);
  } else {
    localStorage.setItem("juilliard_supported_house", houseId);
  }
  renderOnboardingPage();
}

export function handleContinueArena() {
  const nameInp = document.getElementById("onboarding-user-name");
  if (nameInp && nameInp.value.trim()) {
    localStorage.setItem("jais_user_name", nameInp.value.trim());
  }
  playScoreCelebration();
  updateTournamentChrome();
  renderDesktopSidebars();
  router.navigate("#/events");
}

function renderOfficialLoginPortalHtml() {
  return `
    <div class="jais-official-portal" style="background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 14px; padding: 1.1rem; margin-top: 1.5rem; text-align: left;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
        <div class="jais-official-title" style="margin: 0; font-size: 0.92rem; font-weight: 800; color: var(--fm-text-primary); display: flex; align-items: center; gap: 6px;">
          <span>${ICONS.shield}</span> Official Admin &amp; Marshal Login
        </div>
        <span class="jais-badge-admin" style="font-size: 0.62rem;">VERIFIED STAFF</span>
      </div>
      <p style="font-size: 0.74rem; color: var(--fm-text-secondary); margin: 0 0 0.85rem; line-height: 1.4;">
        Access is restricted to pre-verified Juilliard official emails. Each official holds a unique Admin ID for login timestamp and edit auditing.
      </p>

      <form onsubmit="window.pages.handleVerifiedAdminLogin(event)" style="display: flex; flex-direction: column; gap: 0.65rem;">
        <div>
          <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 3px;">
            Official Email Address
          </label>
          <input type="email" id="official-email-input" class="jais-text-input" 
                 value="${escapeHtml(localStorage.getItem('juilliard_last_admin_email') || '')}"
                 placeholder="Enter your admin email" required 
                 style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.55rem 0.75rem; color: var(--fm-text-primary); font-size: 0.85rem;" />
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary);">
              Password
            </label>
            <button type="button" onclick="window.pages.promptAdminSetPassword()" style="background: none; border: none; font-size: 0.68rem; color: var(--fm-green); cursor: pointer; text-decoration: underline; padding: 0;">
              Set / Reset Password
            </button>
          </div>
          <div style="position: relative;">
            <input type="password" id="official-password-input" class="jais-text-input" 
                   placeholder="Enter your official password" 
                   style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.55rem 3.5rem 0.55rem 0.75rem; color: var(--fm-text-primary); font-size: 0.85rem;" />
            <button type="button" onclick="window.pages.toggleInputVisibility('official-password-input', this)" 
                    style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 0.7rem; font-weight: 700; color: var(--fm-text-muted); cursor: pointer; padding: 4px 6px;">
              Show
            </button>
          </div>
        </div>

        <div id="admin-login-msg" style="display: none; font-size: 0.75rem; padding: 8px 10px; border-radius: 6px; font-weight: 600; line-height: 1.4;"></div>

        <button type="submit" class="jais-cta-btn" style="margin: 0.35rem 0 0; padding: 0.65rem; font-size: 0.84rem; background: var(--fm-green); color: #000; font-weight: 900; border-radius: 8px;">
          Sign In to Scoring Console
        </button>
      </form>
    </div>
  `;
}

export function toggleInputVisibility(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    if (btnEl) btnEl.textContent = "Hide";
  } else {
    input.type = "password";
    if (btnEl) btnEl.textContent = "Show";
  }
}

export async function handleVerifiedAdminLogin(event) {
  if (event) event.preventDefault();
  const emailInput = document.getElementById("official-email-input");
  const passInput = document.getElementById("official-password-input");
  const msgEl = document.getElementById("admin-login-msg");

  const email = (emailInput?.value || "").trim().toLowerCase();
  const password = (passInput?.value || "").trim();

  const showMsg = (text, isError = true) => {
    if (msgEl) {
      msgEl.style.display = "block";
      msgEl.style.background = isError ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)";
      msgEl.style.color = isError ? "#EF4444" : "#10B981";
      msgEl.style.border = isError ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)";
      msgEl.innerHTML = text;
    } else {
      alert(text);
    }
  };

  if (!email) {
    showMsg("Please enter your official email address.");
    return;
  }

  // Whitelist verification: ONLY verified emails in code will be allowed
  const verified = getVerifiedAdmin(email);
  if (!verified) {
    showMsg(`<strong>Access Denied:</strong> "${escapeHtml(email)}" is not in the official Juilliard Admin Registry. Only whitelisted staff emails are authorized to administer.`);
    return;
  }

  // If user entered no password:
  if (!password) {
    const hasPass = await hasAdminPassword(verified.id);
    if (!hasPass) {
      promptAdminSetPassword(email);
      return;
    } else {
      showMsg("Please enter your official password to sign in, or click <strong>Set / Reset Password</strong>.", true);
      passInput?.focus();
      return;
    }
  }

  try {
    const result = await loginAdminWithPassword(email, password);
    if (result.needsPasswordSetup) {
      promptAdminSetPassword(email);
      return;
    }

    localStorage.setItem("juilliard_last_admin_email", email);
    playScoreCelebration();
    showMsg(`<strong>Welcome, ${escapeHtml(verified.name)} (${verified.id})!</strong> Authenticated successfully. Login recorded at ${result.admin.loginFormatted}.`, false);
    setTimeout(() => {
      router.navigate("#/admin");
    }, 400);
  } catch (err) {
    showMsg(`${escapeHtml(err.message)}`);
  }
}

export function promptAdminSetPassword(presetEmail = "") {
  playTapSound();
  const emailVal = presetEmail || document.getElementById("official-email-input")?.value?.trim() || localStorage.getItem("juilliard_last_admin_email") || "";

  document.getElementById("admin-password-setup-modal")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "jais-modal-backdrop";
  overlay.id = "admin-password-setup-modal";

  overlay.innerHTML = `
    <div class="jais-media-modal-card" style="max-width: 440px;">
      <div class="jais-media-modal-header">
        <div style="font-weight: 800; font-size: 0.95rem; color: var(--fm-text-primary); display: flex; align-items: center; gap: 6px;">
          <span>${ICONS.key}</span> Set or Reset Official Admin Password
        </div>
        <button class="jais-modal-close-btn" onclick="document.getElementById('admin-password-setup-modal')?.remove()">&times;</button>
      </div>
      <div class="jais-media-modal-body">
        <p style="font-size: 0.76rem; color: var(--fm-text-secondary); margin: 0 0 1rem; line-height: 1.45;">
          Only emails verified in code can create or reset their password. Your password is securely synchronized to Cloud Firestore so you can log in on all devices.
        </p>

        <form id="set-password-form" onsubmit="window.pages.handleSaveAdminPassword(event)">
          <div style="margin-bottom: 0.75rem;">
            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 3px;">
              Verified Official Email
            </label>
            <input type="email" id="setup-admin-email" class="jais-text-input" 
                   value="${escapeHtml(emailVal)}" placeholder="Enter your admin email" required 
                   style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.55rem 0.75rem; color: var(--fm-text-primary); font-size: 0.85rem;" />
          </div>

          <div style="margin-bottom: 0.75rem;">
            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 3px;">
              New Password (minimum 4 characters)
            </label>
            <div style="position: relative;">
              <input type="password" id="setup-admin-pass1" class="jais-text-input" 
                     placeholder="Enter new password" required minlength="4"
                     style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.55rem 3.5rem 0.55rem 0.75rem; color: var(--fm-text-primary); font-size: 0.85rem;" />
              <button type="button" onclick="window.pages.toggleInputVisibility('setup-admin-pass1', this)" 
                      style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 0.7rem; font-weight: 700; color: var(--fm-text-muted); cursor: pointer; padding: 4px 6px;">
                Show
              </button>
            </div>
          </div>

          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 3px;">
              Confirm New Password
            </label>
            <div style="position: relative;">
              <input type="password" id="setup-admin-pass2" class="jais-text-input" 
                     placeholder="Re-enter new password" required minlength="4"
                     style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.55rem 3.5rem 0.55rem 0.75rem; color: var(--fm-text-primary); font-size: 0.85rem;" />
              <button type="button" onclick="window.pages.toggleInputVisibility('setup-admin-pass2', this)" 
                      style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 0.7rem; font-weight: 700; color: var(--fm-text-muted); cursor: pointer; padding: 4px 6px;">
                Show
              </button>
            </div>
          </div>

          <div id="setup-pass-msg" style="display: none; font-size: 0.75rem; padding: 8px 10px; border-radius: 6px; font-weight: 600; margin-bottom: 1rem;"></div>

          <button type="submit" class="jais-cta-btn" style="margin: 0; width: 100%; padding: 0.7rem; font-size: 0.85rem; background: var(--fm-green); color: #000; font-weight: 900; border-radius: 8px;">
            Save Password &amp; Authenticate
          </button>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

export async function handleSaveAdminPassword(event) {
  event.preventDefault();
  const email = (document.getElementById("setup-admin-email")?.value || "").trim().toLowerCase();
  const pass1 = (document.getElementById("setup-admin-pass1")?.value || "").trim();
  const pass2 = (document.getElementById("setup-admin-pass2")?.value || "").trim();
  const msgEl = document.getElementById("setup-pass-msg");

  const showMsg = (text, isError = true) => {
    if (msgEl) {
      msgEl.style.display = "block";
      msgEl.style.background = isError ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)";
      msgEl.style.color = isError ? "#EF4444" : "#10B981";
      msgEl.style.border = isError ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)";
      msgEl.innerHTML = text;
    }
  };

  const admin = getVerifiedAdmin(email);
  if (!admin) {
    showMsg(`Access Denied: The email "${escapeHtml(email)}" is not in the verified official registry.`, true);
    return;
  }

  if (pass1.length < 4) {
    showMsg("Password must be at least 4 characters long.", true);
    return;
  }

  if (pass1 !== pass2) {
    showMsg("Passwords do not match. Please re-type carefully.", true);
    return;
  }

  try {
    showMsg("Saving password securely to Cloud Firestore & authenticating...", false);
    await setAdminPassword(admin.id, pass1);
    localStorage.setItem("juilliard_last_admin_email", email);
    const loginResult = await loginAdminWithPassword(email, pass1);
    playScoreCelebration();
    showMsg(`Password saved for ${escapeHtml(admin.name)} (${admin.id})! Logging into Official Console...`, false);
    setTimeout(() => {
      document.getElementById("admin-password-setup-modal")?.remove();
      router.navigate("#/admin");
    }, 600);
  } catch (err) {
    showMsg(err.message, true);
  }
}

export function handleAdminSignOut() {
  playTapSound();
  signOutAdmin();
  alert("Signed out from Official Judge Console.");
  router.navigate("#/events");
}

/* ==========================================================================
   SCREEN 7: ALL HOUSES HUB & SINGLE HOUSE PROFILE (#/houses & #/house/:id)
   ========================================================================== */
export function renderHousesPage() {
  showScreen("screen-houses");
  const container = document.getElementById("screen-houses");
  const { houses } = getCachedData();
  if (!container) return;

  const isPref = isPrefectorialCup();
  const pageTitle = isPref ? 'TEAMS<span class="plus">2026</span>' : 'HOUSES<span class="plus">2026</span>';

  container.innerHTML = `
    ${renderTabTopBar(pageTitle)}
    <div class="jais-sub-tabs-bar" style="margin-bottom: 0.5rem;">
      <a href="#/table" class="jais-sub-tab">Table</a>
      <a href="#/events" class="jais-sub-tab">Fixtures</a>
      <a href="#/houses" class="jais-sub-tab active">${isPref ? 'Teams' : 'Houses'}</a>
      <a href="#/news" class="jais-sub-tab">News &amp; Media</a>
    </div>

    <!-- House Cards List -->
    <div style="padding: 0.85rem 0.75rem 2rem;">
      ${houses.map((h, idx) => `
        <div class="jais-section-card" style="margin: 0 0 0.85rem; cursor: pointer;" onclick="window.location.hash = '#/house/${h.id}'">
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.85rem;">
              <div class="jais-hero-crest-lg" style="width: 48px; height: 48px; border-color: ${h.color};">
                <img src="assets/crests/${h.id}.svg" alt="${h.name}" />
              </div>
              <div>
                <div style="font-weight: 800; font-size: 1.05rem; color: var(--fm-text-primary);">${escapeHtml(h.name)}</div>
                <div style="font-size: 0.74rem; color: ${h.color}; font-weight: 600;">Captain: ${escapeHtml(h.captain || 'Appointed')}</div>
              </div>
            </div>

            <div style="text-align: right;">
              <div style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 900; color: ${idx === 0 ? 'var(--fm-gold)' : 'var(--fm-text-primary)'};">
                ${h.goldCount || 0} <span style="font-size: 0.85rem; font-weight: 800; color: var(--fm-gold); margin-left: 2px;">GOLD</span>
              </div>
              <div style="font-size: 0.68rem; color: var(--fm-text-secondary); font-weight: 700;">
                ${(h.goldCount||0)+(h.silverCount||0)+(h.bronzeCount||0)} TOTAL MEDALS
              </div>
              ${(h.teamPoints || 0) > 0 ? `
                <div style="font-size: 0.65rem; color: var(--fm-green); font-weight: 800; margin-top: 2px;">
                  Team: ${h.teamPoints} PTS
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

export function renderHouseDetailPage(params) {
  showScreen("screen-house-detail");
  const container = document.getElementById("screen-house-detail");
  const { houses, events } = getCachedData();
  if (!container) return;

  const houseId = params?.id || "phoenix";
  let activeList = houses;
  if (houseId.startsWith("team-")) {
    activeList = getPrefectorialTeams();
  } else if (houses.every(h => h.id && h.id.startsWith("team-"))) {
    activeList = (window.currentHousesCache && window.currentHousesCache.length) ? window.currentHousesCache : INITIAL_HOUSES;
  }
  const house = activeList.find(h => h.id === houseId) || activeList[0];
  const rank = activeList.findIndex(h => h.id === house.id) + 1;
  const totalMedals = (house.goldCount || 0) + (house.silverCount || 0) + (house.bronzeCount || 0);

  // Filter completed events won by this house
  const eventsWonByHouse = events.filter(e => (e.status === "completed" || e.status === "done") && e.results?.first?.houseId === house.id);

  container.innerHTML = `
    <!-- Top Nav -->
    <div class="jais-detail-top-nav">
      <button class="jais-detail-back" onclick="window.appRouter.back()" aria-label="Go Back">
        <span style="display: flex; align-items: center; margin-right: 4px;">${ICONS.backArrow}</span>
      </button>
      <div style="font-weight: 800; font-size: 0.95rem;">${escapeHtml(house.name.startsWith("Team ") ? house.name : house.name + " House")}</div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button class="jais-icon-btn" onclick="window.toggleTheme()">
          ${ICONS.sun}
        </button>
        <button class="jais-icon-btn" onclick="alert('Following ${escapeHtml(house.name)}')">
          ${ICONS.star}
        </button>
      </div>
    </div>

    <!-- Quick House Switcher Bar -->
    <div class="jais-filter-strip" style="background: var(--fm-surface); border-bottom: 1px solid var(--fm-border);">
      ${activeList.map(h => `
        <button class="jais-chip ${h.id === house.id ? 'active' : ''}" 
                onclick="window.location.hash = '#/house/${h.id}'"
                style="${h.id === house.id ? `background: ${h.color}; color: #FFFFFF; border-color: ${h.color};` : ''}">
          ${h.name}
        </button>
      `).join("")}
    </div>

    <!-- House Hero -->
    <div class="jais-club-hero" style="--house-color: ${house.color};">
      <div class="jais-club-crest-giant">
        <img src="assets/crests/${house.id}.svg" alt="${house.name}" />
      </div>
      <h1 class="jais-club-title">${escapeHtml(house.name)}</h1>
      <p class="jais-club-sub">Rank #${rank} &bull; ${house.goldCount || 0} Gold &bull; ${totalMedals} Total Medals</p>
      <p style="font-size: 0.74rem; color: var(--fm-text-secondary); margin-top: 0.25rem; font-style: italic;">
        "${escapeHtml(house.motto || 'United in Victory')}"
      </p>
    </div>

    <!-- 4 Stats Cards: Gold, Silver, Bronze, Team PTS -->
    <div class="jais-club-stats-row">
      <div class="jais-club-stat-card">
        <div class="jais-club-stat-val" style="color: var(--fm-gold);">${house.goldCount || 0}</div>
        <div class="jais-club-stat-lbl" style="display:flex;align-items:center;justify-content:center;gap:3px;">Gold ${ICONS.goldMedal}</div>
      </div>
      <div class="jais-club-stat-card">
        <div class="jais-club-stat-val" style="color: var(--fm-silver);">${house.silverCount || 0}</div>
        <div class="jais-club-stat-lbl" style="display:flex;align-items:center;justify-content:center;gap:3px;">Silver ${ICONS.silverMedal}</div>
      </div>
      <div class="jais-club-stat-card">
        <div class="jais-club-stat-val" style="color: var(--fm-bronze);">${house.bronzeCount || 0}</div>
        <div class="jais-club-stat-lbl" style="display:flex;align-items:center;justify-content:center;gap:3px;">Bronze ${ICONS.bronzeMedal}</div>
      </div>
      <div class="jais-club-stat-card">
        <div class="jais-club-stat-val" style="color: var(--fm-green);">${house.teamPoints || 0}</div>
        <div class="jais-club-stat-lbl">Team PTS</div>
      </div>
    </div>

    <!-- Category Medals & Match Points Breakdown -->
    <div class="jais-section-card" style="margin: 0 0.75rem 1rem;">
      <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); font-weight: 800; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
        <span>Championship Honors Breakdown</span>
        <span style="font-size: 0.72rem; color: var(--fm-gold); font-weight: 800;">${totalMedals} Total Medals</span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; padding: 0.75rem 1rem;">
        <div style="background: var(--fm-surface-elevated); padding: 0.6rem 0.75rem; border-radius: 8px;">
          <div style="font-size: 0.7rem; color: var(--fm-text-secondary); font-weight: 700;">Track &amp; Races</div>
          <div style="font-size: 1.05rem; font-weight: 900; color: var(--fm-gold);">
            ${eventsWonByHouse.filter(e => (e.category || '').toLowerCase().includes('track') || (e.name || '').toLowerCase().includes('100m') || (e.name || '').toLowerCase().includes('200m')).length} Gold Won
          </div>
        </div>
        <div style="background: var(--fm-surface-elevated); padding: 0.6rem 0.75rem; border-radius: 8px;">
          <div style="font-size: 0.7rem; color: var(--fm-text-secondary); font-weight: 700;">Field Events</div>
          <div style="font-size: 1.05rem; font-weight: 900; color: var(--fm-gold);">
            ${eventsWonByHouse.filter(e => (e.category || '').toLowerCase().includes('field') || (e.name || '').toLowerCase().includes('shotput') || (e.name || '').toLowerCase().includes('jump')).length} Gold Won
          </div>
        </div>
        <div style="background: var(--fm-surface-elevated); padding: 0.6rem 0.75rem; border-radius: 8px;">
          <div style="font-size: 0.7rem; color: var(--fm-text-secondary); font-weight: 700;">Novelty Events</div>
          <div style="font-size: 1.05rem; font-weight: 900; color: var(--fm-gold);">
            ${eventsWonByHouse.filter(e => (e.category || '').toLowerCase().includes('novelty')).length} Gold Won
          </div>
        </div>
        <div style="background: var(--fm-surface-elevated); padding: 0.6rem 0.75rem; border-radius: 8px;">
          <div style="font-size: 0.7rem; color: var(--fm-text-secondary); font-weight: 700;">Football &amp; Basketball</div>
          <div style="font-size: 1.05rem; font-weight: 900; color: var(--fm-green);">
            ${house.teamPoints || 0} Match PTS
          </div>
        </div>
      </div>
    </div>

    <!-- Assigned Teachers & House Leadership (Extracted Notes Requirement) -->
    <div class="jais-section-card" style="margin: 0 0.75rem 1rem;">
      <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); font-weight: 800; font-size: 0.85rem;">
        ${(house && house.id && house.id.startsWith("team-")) ? 'Assigned Faculty &amp; Team Leadership' : 'Assigned Faculty &amp; House Leadership'}
      </div>
      
      <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); display: flex; justify-content: space-between; font-size: 0.82rem;">
        <span style="color: var(--fm-text-secondary);">${(house && house.id && house.id.startsWith("team-")) ? 'Team Leader / Prefect' : 'House Captain'}</span>
        <strong style="color: ${house.color};">${escapeHtml(house.captain || 'Chinedu Ihejiahi (SS 3)')}</strong>
      </div>

      <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); font-size: 0.82rem;">
        <div style="color: var(--fm-text-secondary); margin-bottom: 0.35rem; font-weight: 700;">Assigned Teachers &amp; Coaches:</div>
        <ul style="list-style: none; padding-left: 0; display: flex; flex-direction: column; gap: 0.35rem;">
          ${(house.teachers || ["Mrs. Davies (Head of House)", "Mr. Sterling (Coach)"]).map(t => `
            <li style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: ${house.color};"></span>
              <strong>${escapeHtml(t)}</strong>
            </li>
          `).join("")}
        </ul>
      </div>
    </div>

    <!-- Events Won by this House -->
    ${eventsWonByHouse.length ? `
      <div class="jais-section-card" style="margin: 0 0.75rem 1rem;">
        <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); font-weight: 800; font-size: 0.85rem; color: var(--fm-green);">
          Championship Victories (${eventsWonByHouse.length})
        </div>
        ${eventsWonByHouse.map(ev => {
          const isBall = isBallSportEvent(ev);
          return `
          <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; cursor: pointer;"
               onclick="window.location.hash = '#/event/${ev.id}'">
            <div>
              <div style="font-weight: 800; color: var(--fm-text-primary);">${escapeHtml(ev.name)}</div>
              <div style="font-size: 0.7rem; color: var(--fm-text-secondary);">Winner: ${escapeHtml(ev.results?.first?.athlete || house.name)} (${escapeHtml(ev.results?.first?.score || '')})</div>
            </div>
            ${isBall ? `
              <strong style="color: var(--fm-green);">+${ev.results?.first?.points || 3} PTS</strong>
            ` : `
              <strong style="color: var(--fm-gold); display: flex; align-items: center; gap: 4px;">${ICONS.goldMedal} Gold</strong>
            `}
          </div>
        `;
        }).join("")}
      </div>
    ` : ''}

    <!-- Athlete Roster -->
    <div class="jais-section-card" style="margin: 0 0.75rem 1.5rem;">
      <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); font-weight: 800; font-size: 0.85rem;">
        ${(house && house.id && house.id.startsWith("team-")) ? 'Registered Team Athletes' : 'Registered House Athletes'}
      </div>
      ${(house.roster || ["Chinedu Ihejiahi", "Adachukwu Ehiogu", "Ayomide Ajamolaya", "Donald Ariyo", "Michelle Olurotimi"]).map((ath, idx) => `
        <div style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--fm-border); display: flex; justify-content: space-between; font-size: 0.82rem;">
          <span>${idx + 1}. <strong>${escapeHtml(ath)}</strong></span>
          <span style="color: var(--fm-text-muted);">Track &amp; Field</span>
        </div>
      `).join("")}
    </div>
  `;
}

/* ==========================================================================
   SCREEN 8: OFFICIAL JUDGE & SCORING CONSOLE (#/admin & #/admin/score/:id)
   ========================================================================== */

/**
 * 1-Tap Quick Event State Trigger (Live, Done, Upcoming)
 */
export async function quickSetEventStatus(eventId, newStatus) {
  if (!isUserAdmin()) { alert("Official access required."); return; }
  playTapSound();

  // Find event across both Inter-House and Prefectorial Cup caches & seeds
  const IH_events = (window.currentEventsCache && window.currentEventsCache.length) ? window.currentEventsCache : INITIAL_EVENTS;
  const Pref_events = (window.currentPrefEventsCache && window.currentPrefEventsCache.length) ? window.currentPrefEventsCache : getPrefectorialEvents();

  let ev = IH_events.find(e => e.id === eventId) || Pref_events.find(e => e.id === eventId);
  if (!ev) {
    const { events } = getCachedData();
    ev = events.find(e => e.id === eventId);
  }
  if (!ev) {
    console.warn("Event not found for quickSetEventStatus:", eventId);
    showToastNotification("Event not found", "error");
    return;
  }

  const isLive = newStatus === "live";
  const isDone = newStatus === "completed" || newStatus === "done";
  const normalizedStatus = isDone ? "completed" : (isLive ? "live" : "upcoming");

  const updatedPayload = {
    ...ev,
    status: normalizedStatus,
    isLive: isLive,
    updatedAt: new Date().toISOString()
  };

  // Resetting to "upcoming" must also drop any recorded result; otherwise the event
  // keeps showing a winner/score and its medals would reappear if it is re-completed.
  if (normalizedStatus === "upcoming") {
    updatedPayload.results = null;
    updatedPayload.completedAt = null;
  }

  if (isLive) {
    playWhistleSound();
  } else if (isDone) {
    playScoreCelebration();
  }

  // Update in memory cache immediately for zero latency
  if (window.currentEventsCache) {
    const idx = window.currentEventsCache.findIndex(e => e.id === eventId);
    if (idx >= 0) {
      window.currentEventsCache[idx] = { ...window.currentEventsCache[idx], ...updatedPayload };
    }
  }
  if (window.currentPrefEventsCache) {
    const idx = window.currentPrefEventsCache.findIndex(e => e.id === eventId);
    if (idx >= 0) {
      window.currentPrefEventsCache[idx] = { ...window.currentPrefEventsCache[idx], ...updatedPayload };
    }
  }

  // Sync select element if open in score entry modal
  const statusSelect = document.getElementById("score-event-status");
  if (statusSelect) {
    statusSelect.value = normalizedStatus;
  }

  // Toast feedback
  const statusMsg = isLive 
    ? `"${ev.name}" is now LIVE! Pinned to top of matches.` 
    : (isDone ? `"${ev.name}" marked as DONE!` : `"${ev.name}" reset to UPCOMING.`);
  showToastNotification(statusMsg, isLive ? "success" : "info");

  // Record audit log for status change
  try {
    recordAuditLog({
      type: "status_change",
      title: `${ev.name} — Status Set to ${normalizedStatus.toUpperCase()}`,
      details: `Official competition status flipped from "${ev.status || 'upcoming'}" to "${normalizedStatus.toUpperCase()}". ${isLive ? 'Event marked LIVE on stadium field.' : (isDone ? 'Event concluded and marked as done.' : 'Event reset to upcoming schedule.')}`,
      summary: `${ev.name} status: ${normalizedStatus.toUpperCase()}`,
      eventId: ev.id,
      eventName: ev.name,
      metadata: { oldStatus: ev.status, newStatus: normalizedStatus }
    });
  } catch (e) {
    console.warn("Audit log error:", e);
  }

  try {
    const res = await saveEventDefinition(updatedPayload);
    if (!res.success) {
      console.warn("Save event status note:", res.error);
    }
  } catch (err) {
    console.warn("Async save status warning:", err);
  }

  // Re-render current page
  if (window.location.hash.includes("/admin/score/")) {
    renderScoreEntryPage({ id: eventId });
  } else if (window.location.hash.includes("/admin")) {
    renderAdminPage();
  } else if (window.location.hash.includes("/events")) {
    renderEventsPage();
  } else if (window.location.hash.includes("/event/")) {
    renderEventDetailPage({ id: eventId });
  } else {
    router.handleRoute();
  }
}

/**
 * Relative time formatter for audit trail
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return "Recently";
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return "Recently";
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1000));
  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatAdminTimestamp(d);
}

let showAddAdminForm = false;
let editingAdminId = null;
let resettingPasswordAdminId = null;

export function toggleAddAdminForm() {
  playTapSound();
  showAddAdminForm = !showAddAdminForm;
  renderAdminPage({ tab: "admins" });
  if (showAddAdminForm) {
    setTimeout(() => {
      document.getElementById("new-admin-name")?.focus();
    }, 50);
  }
}

export async function handleAddAdmin(event) {
  event.preventDefault();
  playTapSound();

  const name = document.getElementById("new-admin-name")?.value?.trim();
  const email = document.getElementById("new-admin-email")?.value?.trim();
  const role = document.getElementById("new-admin-role")?.value || "admin";
  const title = document.getElementById("new-admin-title")?.value?.trim() || "Score Judge & Marshal";
  const initialPassword = document.getElementById("new-admin-password")?.value || "";

  const btn = document.getElementById("btn-save-new-admin");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Registering...";
  }

  try {
    const res = await addAdminAccount({ name, email, title, role, initialPassword });
    if (res.success) {
      playScoreCelebration();
      showAddAdminForm = false;
      alert(`Official "${name}" successfully registered with ID ${res.admin.id}!`);
      renderAdminPage({ tab: "admins" });
    } else {
      alert("Error adding official: " + (res.error || "Unknown error"));
    }
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Register Official Account";
    }
  }
}

export async function handleDeleteAdmin(adminId) {
  playTapSound();
  const allAdmins = getRegisteredAdmins();
  const target = allAdmins.find(a => a.id === adminId);
  const name = target ? target.name : adminId;

  if (!confirm(`Are you sure you want to remove official "${name}" (${adminId})? They will immediately lose access to the judge scoring console.`)) {
    return;
  }

  try {
    const res = await deleteAdminAccount(adminId);
    if (res.success) {
      playTapSound();
      alert(`Official account "${name}" has been removed.`);
      renderAdminPage({ tab: "admins" });
    }
  } catch (err) {
    alert("Error removing official: " + err.message);
  }
}

export function openEditAdminModal(adminId) {
  playTapSound();
  editingAdminId = adminId;
  const allAdmins = getRegisteredAdmins();
  const target = allAdmins.find(a => a.id === adminId);
  if (!target) return;

  const modal = document.getElementById("edit-admin-modal");
  if (!modal) return;

  const idLabel = document.getElementById("edit-admin-id-label");
  if (idLabel) idLabel.textContent = target.id;
  const nameInput = document.getElementById("edit-admin-name");
  if (nameInput) nameInput.value = target.name || "";
  const titleInput = document.getElementById("edit-admin-title");
  if (titleInput) titleInput.value = target.title || "";
  const roleSelect = document.getElementById("edit-admin-role");
  if (roleSelect) roleSelect.value = target.role || "admin";
  const emailStatic = document.getElementById("edit-admin-email-static");
  if (emailStatic) emailStatic.textContent = target.email || "";

  modal.classList.add("active");
}

export function closeEditAdminModal() {
  playTapSound();
  editingAdminId = null;
  document.getElementById("edit-admin-modal")?.classList.remove("active");
}

export async function handleSaveEditAdmin(event) {
  event.preventDefault();
  playTapSound();
  if (!editingAdminId) return;

  const name = document.getElementById("edit-admin-name")?.value?.trim();
  const title = document.getElementById("edit-admin-title")?.value?.trim();
  const role = document.getElementById("edit-admin-role")?.value || "admin";

  try {
    const res = await updateAdminAccount(editingAdminId, { name, title, role });
    if (res.success) {
      closeEditAdminModal();
      alert("Official account updated successfully!");
      renderAdminPage({ tab: "admins" });
    }
  } catch (err) {
    alert("Error updating official: " + err.message);
  }
}

export function openResetAdminPasswordModal(adminId) {
  playTapSound();
  resettingPasswordAdminId = adminId;
  const allAdmins = getRegisteredAdmins();
  const target = allAdmins.find(a => a.id === adminId);
  if (!target) return;

  const modal = document.getElementById("reset-admin-password-modal");
  if (!modal) return;

  const targetLabel = document.getElementById("reset-admin-pwd-target-label");
  if (targetLabel) targetLabel.textContent = `${target.name} (${target.id} • ${target.email})`;
  const pwdInput = document.getElementById("reset-admin-pwd-input");
  if (pwdInput) pwdInput.value = "";

  modal.classList.add("active");
}

export function closeResetAdminPasswordModal() {
  playTapSound();
  resettingPasswordAdminId = null;
  document.getElementById("reset-admin-password-modal")?.classList.remove("active");
}

export async function handleSaveResetAdminPassword(event) {
  event.preventDefault();
  playTapSound();
  if (!resettingPasswordAdminId) return;

  const newPassword = document.getElementById("reset-admin-pwd-input")?.value?.trim();
  if (!newPassword || newPassword.length < 4) {
    alert("Password must be at least 4 characters long.");
    return;
  }

  try {
    const res = await resetAdminPassword(resettingPasswordAdminId, newPassword);
    if (res.success) {
      closeResetAdminPasswordModal();
      alert("Password updated successfully!");
      renderAdminPage({ tab: "admins" });
    }
  } catch (err) {
    alert("Error resetting password: " + err.message);
  }
}

export function openCurrentAdminProfileModal() {
  const currentAdmin = getCurrentAdmin();
  if (!currentAdmin) return;

  const nameInput = document.getElementById("current-admin-profile-name");
  if (nameInput) nameInput.value = currentAdmin.name || "";
  const passwordInput = document.getElementById("current-admin-profile-password");
  if (passwordInput) passwordInput.value = "";
  const confirmInput = document.getElementById("current-admin-profile-password-confirm");
  if (confirmInput) confirmInput.value = "";
  document.getElementById("current-admin-profile-modal")?.classList.add("active");
}

export function closeCurrentAdminProfileModal() {
  document.getElementById("current-admin-profile-modal")?.classList.remove("active");
}

export async function handleSaveCurrentAdminProfile(event) {
  event.preventDefault();
  const name = document.getElementById("current-admin-profile-name")?.value?.trim();
  const password = document.getElementById("current-admin-profile-password")?.value || "";
  const passwordConfirm = document.getElementById("current-admin-profile-password-confirm")?.value || "";

  if (password && password.length < 4) {
    alert("Password must be at least 4 characters long.");
    return;
  }
  if (password !== passwordConfirm) {
    alert("The new passwords do not match.");
    return;
  }

  try {
    const result = await updateCurrentAdminProfile({ name, newPassword: password || undefined });
    closeCurrentAdminProfileModal();
    alert(result.synced
      ? "Your account details were updated and synced."
      : "Your account details were updated on this device, but cloud sync is unavailable.");
    renderAdminPage();
  } catch (err) {
    alert("Could not update your account: " + err.message);
  }
}

/**
 * Switch Admin view tabs: 'events', 'logs', or 'admins'
 */
export function switchAdminTab(tabName) {
  playTapSound();
  window.currentAdminTab = tabName;
  renderAdminPage({ tab: tabName });
}

/**
 * Filter Audit Logs category
 */
export function filterAuditLogs(filter) {
  playTapSound();
  window.currentAuditFilter = filter;
  renderAdminPage({ tab: "logs" });
}

/**
 * Search Audit Logs
 */
export function searchAuditLogs(query) {
  window.currentAuditSearch = query;
  renderAdminPage({ tab: "logs" });
  const searchInput = document.getElementById("jais-audit-search-input");
  if (searchInput) {
    searchInput.focus();
    const len = searchInput.value.length;
    searchInput.setSelectionRange(len, len);
  }
}

/**
 * Toggle raw details JSON
 */
export function toggleLogDetails(logId) {
  const el = document.getElementById(`log-details-${logId}`);
  if (el) {
    el.style.display = el.style.display === "none" ? "block" : "none";
  }
}

/**
 * Export audit history as CSV or JSON file
 */
export function exportAuditLogs(format = "csv") {
  playTapSound();
  const logs = getAuditLogs();
  if (!logs || !logs.length) {
    alert("No audit logs available to export.");
    return;
  }

  if (format === "json") {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `juilliard_sports_audit_logs_${Date.now()}.json`);
    dlAnchor.click();
    return;
  }

  // CSV format
  const headers = ["Timestamp_ISO", "Formatted_Time", "Action_Type", "Title", "Admin_ID", "Admin_Name", "Admin_Email", "Event_ID", "Details"];
  const rows = logs.map(l => [
    `"${(l.timestamp || '').replace(/"/g, '""')}"`,
    `"${(l.formattedTime || '').replace(/"/g, '""')}"`,
    `"${(l.type || '').replace(/"/g, '""')}"`,
    `"${(l.title || '').replace(/"/g, '""')}"`,
    `"${(l.adminId || '').replace(/"/g, '""')}"`,
    `"${(l.adminName || '').replace(/"/g, '""')}"`,
    `"${(l.adminEmail || '').replace(/"/g, '""')}"`,
    `"${(l.eventId || '').replace(/"/g, '""')}"`,
    `"${(l.details || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const dlAnchor = document.createElement("a");
  dlAnchor.setAttribute("href", encodeURI(csvContent));
  dlAnchor.setAttribute("download", `juilliard_sports_audit_logs_${Date.now()}.csv`);
  dlAnchor.click();
}

/**
 * Handle Clear Audit Logs
 */
export async function handleClearAuditLogs() {
  if (!isUserAdmin()) { alert("Official access required."); return; }
  playTapSound();
  if (confirm("Are you sure you want to clear the audit logs? This action will reset local and cloud log history.")) {
    await clearAuditLogs();
    renderAdminPage({ tab: "logs" });
  }
}

export function renderAdminPage(params) {
  showScreen("screen-admin");
  const container = document.getElementById("screen-admin");
  const { events, houses } = getCachedData();
  const currentAdmin = getCurrentAdmin();
  if (!container) return;

  const currentTab = (params && params.tab) ? params.tab : (window.currentAdminTab || "events");
  window.currentAdminTab = currentTab;
  const currentFilter = window.currentAuditFilter || "all";
  const searchQuery = (window.currentAuditSearch || "").trim().toLowerCase();

  const allLogs = getAuditLogs() || [];
  const allAdmins = getRegisteredAdmins() || [];
  const isSuper = isUserSuperAdmin();

  // Filter logs
  let filteredLogs = allLogs;
  if (currentFilter === "score_submission") {
    filteredLogs = filteredLogs.filter(l => l.type === "score_submission");
  } else if (currentFilter === "status_change") {
    filteredLogs = filteredLogs.filter(l => l.type === "status_change");
  } else if (currentFilter === "admin_login") {
    filteredLogs = filteredLogs.filter(l => l.type === "admin_login");
  } else if (currentFilter === "system") {
    filteredLogs = filteredLogs.filter(l => l.type === "score_reset" || l.type === "demo_seed" || l.type === "event_setup" || l.type === "roster_update" || l.type === "system_init");
  }

  if (searchQuery) {
    filteredLogs = filteredLogs.filter(l => {
      const matchTitle = (l.title || "").toLowerCase().includes(searchQuery);
      const matchDetails = (l.details || "").toLowerCase().includes(searchQuery);
      const matchAdmin = (l.adminEmail || "").toLowerCase().includes(searchQuery) || (l.adminId || "").toLowerCase().includes(searchQuery) || (l.adminName || "").toLowerCase().includes(searchQuery);
      const matchEvent = (l.eventName || "").toLowerCase().includes(searchQuery);
      return matchTitle || matchDetails || matchAdmin || matchEvent;
    });
  }

  const counts = {
    all: allLogs.length,
    score: allLogs.filter(l => l.type === "score_submission").length,
    status: allLogs.filter(l => l.type === "status_change").length,
    login: allLogs.filter(l => l.type === "admin_login").length,
    system: allLogs.filter(l => l.type === "score_reset" || l.type === "demo_seed" || l.type === "event_setup" || l.type === "roster_update" || l.type === "system_init").length
  };

  container.innerHTML = `
    <!-- Top Nav -->
    <div style="padding: 0.75rem 1rem 0.5rem; border-bottom: 1px solid var(--fm-border); display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <img src="assets/juilliard-logo.png" alt="Juilliard Academy" style="width: 34px; height: 34px; object-fit: contain; border-radius: 50%; background: #ffffff; padding: 2px; box-shadow: 0 1px 4px rgba(0,0,0,0.25);" />
        <div>
          <h1 style="font-size: 1.15rem; font-weight: 800; color: var(--fm-text-primary); margin: 0;">Judge Scoring Console</h1>
          <p style="font-size: 0.72rem; color: var(--fm-green); font-weight: 700; margin: 0;">Official Live Scoring Active</p>
        </div>
      </div>
      <span class="jais-badge-admin">${isSuper ? 'SUPERADMIN' : 'OFFICIAL'}</span>
    </div>

    <!-- Active Official Identity & Login Timestamp Banner -->
    <div class="jais-admin-session-bar" style="margin: 0.75rem 0.85rem 0.25rem;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="jais-admin-badge-id">${currentAdmin ? (currentAdmin.adminId || currentAdmin.id) : 'ADM-001'}</span>
        <div>
          <div style="font-weight: 800; color: var(--fm-text-primary); font-size: 0.8rem;">
            ${escapeHtml(currentAdmin ? currentAdmin.name : 'Admin')}
            <span style="font-weight: 700; color: ${isSuper ? 'var(--fm-gold)' : 'var(--fm-green)'}; font-size: 0.7rem;">[${isSuper ? '★ SUPER ADMIN' : 'JUDGE'}]</span>
            <span style="font-weight: 500; color: var(--fm-text-muted); font-size: 0.7rem;">&bull; ${escapeHtml(currentAdmin ? currentAdmin.title : 'Official')}</span>
          </div>
          <div style="font-size: 0.68rem; color: var(--fm-text-secondary);">
            Login: <strong style="color: var(--fm-green);">${currentAdmin?.loginFormatted || 'Active Session'}</strong> &bull; ${escapeHtml(currentAdmin?.email || '')}
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 6px; flex-shrink: 0;">
        <button type="button" onclick="window.pages.openCurrentAdminProfileModal()" style="background: var(--fm-surface); border: 1px solid var(--fm-border); color: var(--fm-text-primary); font-size: 0.7rem; font-weight: 700; padding: 4px 8px; border-radius: 6px; cursor: pointer;">
          Edit Account
        </button>
        <button type="button" onclick="window.pages.handleAdminSignOut()" style="background: none; border: 1px solid var(--fm-border); color: #EF4444; font-size: 0.7rem; font-weight: 700; padding: 4px 8px; border-radius: 6px; cursor: pointer;">
          Sign Out
        </button>
      </div>
    </div>

    <div id="current-admin-profile-modal" class="jais-modal-backdrop" style="display: none;" onclick="if(event.target===this) window.pages.closeCurrentAdminProfileModal()">
      <div class="jais-modal-dialog" style="max-width: 440px; margin: 2rem auto; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 12px; padding: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--fm-border); padding-bottom: 0.5rem;">
          <div style="font-weight: 800; font-size: 0.95rem; color: var(--fm-text-primary);">Edit Your Account</div>
          <button type="button" onclick="window.pages.closeCurrentAdminProfileModal()" style="background: none; border: none; font-size: 1.25rem; color: var(--fm-text-muted); cursor: pointer;">&times;</button>
        </div>
        <form onsubmit="window.pages.handleSaveCurrentAdminProfile(event)">
          <div style="margin-bottom: 0.75rem;">
            <label for="current-admin-profile-name" style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Your Name *</label>
            <input type="text" id="current-admin-profile-name" class="jais-text-input" required minlength="2" style="width: 100%; font-size: 0.85rem;" />
          </div>
          <div style="margin-bottom: 0.75rem;">
            <label for="current-admin-profile-password" style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">New Password (leave blank to keep current)</label>
            <input type="password" id="current-admin-profile-password" class="jais-text-input" autocomplete="new-password" minlength="4" placeholder="At least 4 characters" style="width: 100%; font-size: 0.85rem;" />
          </div>
          <div style="margin-bottom: 1rem;">
            <label for="current-admin-profile-password-confirm" style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Confirm New Password</label>
            <input type="password" id="current-admin-profile-password-confirm" class="jais-text-input" autocomplete="new-password" minlength="4" placeholder="Re-enter new password" style="width: 100%; font-size: 0.85rem;" />
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button type="submit" class="jais-cta-btn" style="flex: 1; margin: 0; padding: 0.65rem; font-size: 0.82rem; font-weight: 800; background: var(--fm-green); color: #000;">Save Account</button>
            <button type="button" onclick="window.pages.closeCurrentAdminProfileModal()" style="padding: 0.65rem 1rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; font-size: 0.78rem; font-weight: 700; color: var(--fm-text-secondary); cursor: pointer;">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Active Tournament Switcher Strip for Official Scoring Console -->
    <div style="margin: 0 0.85rem 0.5rem; padding: 0.55rem 0.75rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 0.7rem; font-weight: 800; color: var(--fm-text-muted); text-transform: uppercase;">Scoring Tournament:</span>
        <strong style="font-size: 0.82rem; color: ${isPrefectorialCup() ? 'var(--fm-gold)' : 'var(--fm-green)'};">
          ${isPrefectorialCup() ? '🏆 Prefectship Cup' : '🥇 Inter-House Sports'}
        </strong>
      </div>
      <div style="display: flex; gap: 6px;">
        <button type="button" onclick="window.pages.selectTournament('prefectorial'); window.pages.renderAdminPage();" style="padding: 4px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 800; cursor: pointer; border: 1px solid ${isPrefectorialCup() ? 'var(--fm-gold)' : 'var(--fm-border)'}; background: ${isPrefectorialCup() ? 'rgba(245, 158, 11, 0.2)' : 'var(--fm-surface)'}; color: ${isPrefectorialCup() ? 'var(--fm-gold)' : 'var(--fm-text-secondary)'};">
          Prefectship Cup
        </button>
        <button type="button" onclick="window.pages.selectTournament('interhouse'); window.pages.renderAdminPage();" style="padding: 4px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 800; cursor: pointer; border: 1px solid ${!isPrefectorialCup() ? 'var(--fm-green)' : 'var(--fm-border)'}; background: ${!isPrefectorialCup() ? 'rgba(0, 230, 107, 0.2)' : 'var(--fm-surface)'}; color: ${!isPrefectorialCup() ? 'var(--fm-green)' : 'var(--fm-text-secondary)'};">
          Inter-House Sports
        </button>
      </div>
    </div>

    <!-- Main Section Tabs Switcher: Events | Admins & Officials | History & Logs -->
    <div class="jais-admin-tabs-bar" style="display: flex; gap: 6px; padding: 0.5rem 0.85rem 0.25rem;">
      <button class="jais-admin-tab-btn ${currentTab === 'events' ? 'active' : ''}" onclick="window.pages.switchAdminTab('events')" style="flex: 1; padding: 0.6rem 0.4rem; border-radius: 8px; font-size: 0.76rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer; transition: all 0.2s ease; border: 1px solid ${currentTab === 'events' ? 'var(--fm-green)' : 'var(--fm-border)'}; background: ${currentTab === 'events' ? 'rgba(0, 230, 107, 0.12)' : 'var(--fm-surface)'}; color: ${currentTab === 'events' ? 'var(--fm-green)' : 'var(--fm-text-secondary)'};">
        <span style="display: inline-flex; width: 14px; height: 14px; align-items: center;">${ICONS.calendar}</span>
        <span>Events</span>
        <span style="font-size: 0.65rem; padding: 1px 6px; border-radius: 10px; font-weight: 800; background: ${currentTab === 'events' ? 'var(--fm-green)' : 'var(--fm-surface-elevated)'}; color: ${currentTab === 'events' ? '#0E0F12' : 'var(--fm-text-muted)'};">${events.length}</span>
      </button>
      <button class="jais-admin-tab-btn ${currentTab === 'admins' ? 'active' : ''}" onclick="window.pages.switchAdminTab('admins')" style="flex: 1; padding: 0.6rem 0.4rem; border-radius: 8px; font-size: 0.76rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer; transition: all 0.2s ease; border: 1px solid ${currentTab === 'admins' ? 'var(--fm-green)' : 'var(--fm-border)'}; background: ${currentTab === 'admins' ? 'rgba(0, 230, 107, 0.12)' : 'var(--fm-surface)'}; color: ${currentTab === 'admins' ? 'var(--fm-green)' : 'var(--fm-text-secondary)'};">
        <span style="display: inline-flex; width: 14px; height: 14px; align-items: center;">${ICONS.judge}</span>
        <span>Officials</span>
        <span style="font-size: 0.65rem; padding: 1px 6px; border-radius: 10px; font-weight: 800; background: ${currentTab === 'admins' ? 'var(--fm-green)' : 'var(--fm-surface-elevated)'}; color: ${currentTab === 'admins' ? '#0E0F12' : 'var(--fm-text-muted)'};">${allAdmins.length}</span>
      </button>
      <button class="jais-admin-tab-btn ${currentTab === 'logs' ? 'active' : ''}" onclick="window.pages.switchAdminTab('logs')" style="flex: 1; padding: 0.6rem 0.4rem; border-radius: 8px; font-size: 0.76rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer; transition: all 0.2s ease; border: 1px solid ${currentTab === 'logs' ? 'var(--fm-green)' : 'var(--fm-border)'}; background: ${currentTab === 'logs' ? 'rgba(0, 230, 107, 0.12)' : 'var(--fm-surface)'}; color: ${currentTab === 'logs' ? 'var(--fm-green)' : 'var(--fm-text-secondary)'};">
        <span style="display: inline-flex; width: 14px; height: 14px; align-items: center;">${ICONS.clock}</span>
        <span>Logs</span>
        <span style="font-size: 0.65rem; padding: 1px 6px; border-radius: 10px; font-weight: 800; background: ${currentTab === 'logs' ? 'var(--fm-green)' : 'rgba(0, 230, 107, 0.18)'}; color: ${currentTab === 'logs' ? '#0E0F12' : 'var(--fm-green)'};">${allLogs.length}</span>
      </button>
    </div>

    ${currentTab === 'events' ? `
      <!-- TAB 1: EVENTS & SCORING -->

      <!-- High-Impact Admin Hero Actions Grid -->
      <div style="padding: 0.65rem 0.85rem 0.25rem;">
        <div class="jais-hero-actions-grid">
          <div class="jais-hero-action-card card-students" onclick="window.pages.openAddStudentModal()" role="button" tabindex="0">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div class="jais-hero-action-icon" style="background: rgba(59, 130, 246, 0.15); color: #3B82F6;">🏃</div>
              <span class="jais-hero-action-badge" style="background: rgba(59, 130, 246, 0.15); color: #3B82F6;">+ NEW</span>
            </div>
            <div>
              <div class="jais-hero-action-title">Add Student</div>
              <div class="jais-hero-action-desc">Register new student & assign house</div>
            </div>
          </div>

          <div class="jais-hero-action-card card-transfer" onclick="window.pages.openBatchTransferModal()" role="button" tabindex="0">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div class="jais-hero-action-icon" style="background: rgba(245, 158, 11, 0.15); color: #F59E0B;">🔄</div>
              <span class="jais-hero-action-badge" style="background: rgba(245, 158, 11, 0.15); color: #F59E0B;">TRANSFER</span>
            </div>
            <div>
              <div class="jais-hero-action-title">Reassign Houses</div>
              <div class="jais-hero-action-desc">Batch or 1-click student house change</div>
            </div>
          </div>

          <div class="jais-hero-action-card card-news" onclick="window.pages.openAddMediaModal()" role="button" tabindex="0">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div class="jais-hero-action-icon" style="background: rgba(0, 230, 118, 0.15); color: var(--fm-green);">📰</div>
              <span class="jais-hero-action-badge" style="background: rgba(0, 230, 118, 0.15); color: var(--fm-green);">+ POST</span>
            </div>
            <div>
              <div class="jais-hero-action-title">Publish News</div>
              <div class="jais-hero-action-desc">Live reports, sports photos & video</div>
            </div>
          </div>

          <div class="jais-hero-action-card" onclick="window.pages.switchAdminTab('admins')" role="button" tabindex="0">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div class="jais-hero-action-icon" style="background: rgba(168, 85, 247, 0.15); color: #A855F7;">👥</div>
              <span class="jais-hero-action-badge" style="background: rgba(168, 85, 247, 0.15); color: #A855F7;">COUNCIL</span>
            </div>
            <div>
              <div class="jais-hero-action-title">Officials Council</div>
              <div class="jais-hero-action-desc">Manage judges & admin accounts</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Hub Navigation Links -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0.85rem 0.25rem; flex-wrap: wrap; gap: 0.4rem;">
        <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
          <a href="#/admin/students" style="padding: 0.4rem 0.65rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 6px; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-primary); display: flex; align-items: center; gap: 4px; text-decoration: none;">
            ${ICONS.user} Student Database
          </a>
          <a href="#/news" style="padding: 0.4rem 0.65rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 6px; font-size: 0.72rem; font-weight: 700; color: var(--fm-green); display: flex; align-items: center; gap: 4px; text-decoration: none;">
            ${ICONS.news} News &amp; Media
          </a>
          <a href="#/admin/rosters" style="padding: 0.4rem 0.65rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 6px; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-primary); display: flex; align-items: center; gap: 4px; text-decoration: none;">
            ${ICONS.house} Rosters
          </a>
          <a href="#/admin/new-event" style="padding: 0.4rem 0.65rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 6px; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-primary); display: flex; align-items: center; gap: 4px; text-decoration: none;">
            ${ICONS.track} New Event
          </a>
        </div>
        <button onclick="window.pages.triggerResetScores()" style="padding: 0.4rem 0.65rem; background: var(--fm-surface); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 6px; font-size: 0.7rem; font-weight: 700; color: #EF4444; cursor: pointer;">
          Reset Championship Scores
        </button>
      </div>

      <!-- Recent Official Audit Activity Preview -->
      <div style="padding: 0.4rem 0.85rem 0.25rem;">
        <div class="jais-admin-card" style="margin: 0; padding: 0.75rem; border: 1px solid rgba(0, 230, 107, 0.2); background: linear-gradient(180deg, rgba(0, 230, 107, 0.04) 0%, var(--fm-surface) 100%);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="jais-live-dot" style="background: var(--fm-green); width: 6px; height: 6px; border-radius: 50%;"></span>
              <span style="font-weight: 800; font-size: 0.8rem; color: var(--fm-text-primary);">Recent Official Audit Activity</span>
            </div>
            <button onclick="window.pages.switchAdminTab('logs')" style="background: none; border: none; color: var(--fm-green); font-size: 0.72rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 3px;">
              <span>View All (${allLogs.length})</span>
              <span style="display: inline-flex; width: 12px; height: 12px; align-items: center;">${ICONS.chevronRight}</span>
            </button>
          </div>
          ${allLogs.slice(0, 3).map(l => {
            const badgeBg = l.type === 'score_submission' ? 'rgba(16, 185, 129, 0.18)' : (l.type === 'status_change' ? 'rgba(239, 68, 68, 0.18)' : (l.type === 'admin_login' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(245, 158, 11, 0.18)'));
            const badgeColor = l.type === 'score_submission' ? '#10B981' : (l.type === 'status_change' ? '#EF4444' : (l.type === 'admin_login' ? '#60A5FA' : '#F59E0B'));
            const typeLabel = l.type === 'score_submission' ? 'SCORE' : (l.type === 'status_change' ? 'STATUS' : (l.type === 'admin_login' ? 'LOGIN' : 'SYSTEM'));
            return `
              <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 0.45rem 0; border-bottom: 1px solid var(--fm-border); font-size: 0.74rem;">
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap; margin-bottom: 2px;">
                    <span style="font-size: 0.6rem; font-weight: 800; padding: 1px 5px; border-radius: 4px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor}40;">${typeLabel}</span>
                    <strong style="color: var(--fm-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(l.title || 'Official Action')}</strong>
                  </div>
                  <div style="font-size: 0.68rem; color: var(--fm-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHtml(l.summary || l.details || '')}
                  </div>
                </div>
                <div style="text-align: right; flex-shrink: 0;">
                  <div style="font-size: 0.68rem; color: var(--fm-green); font-weight: 700;">${formatRelativeTime(l.timestamp)}</div>
                  <div style="font-size: 0.62rem; color: var(--fm-text-muted); font-family: monospace;">${escapeHtml(l.adminId || 'ADM-001')}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Manageable Events List -->
      <div style="padding: 0.5rem 0.85rem 2rem;">
        <div class="jais-admin-card" style="margin: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div style="font-weight: 800; font-size: 0.85rem;">Manage Sports Day Events (${events.length})</div>
            <span style="font-size: 0.7rem; color: var(--fm-text-muted);">Admin Setup &amp; Scoring</span>
          </div>
          ${events.map(ev => {
            const isDone = isEventCompleted(ev);
            const isLive = isEventLive(ev);
            const isH2H = (ev.format === "h2h") || (ev.contenders && ev.contenders.length === 2);
            const house1 = isH2H ? (houses.find(h => h.id === ev.contenders?.[0]) || houses[0]) : null;
            const house2 = isH2H ? (houses.find(h => h.id === ev.contenders?.[1]) || houses[1]) : null;

            return `
              <div class="jais-event-manage-row" style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--fm-border);">
                <div style="flex: 1; min-width: 0; margin-right: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px; flex-wrap: wrap;">
                    <span style="font-weight: 800; font-size: 0.88rem; color: var(--fm-text-primary);">${escapeHtml(ev.name)}</span>
                    <span style="font-size: 0.62rem; font-weight: 800; padding: 1px 6px; border-radius: 4px; ${isH2H ? 'background: rgba(59,130,246,0.15); color: #60A5FA; border: 1px solid rgba(59,130,246,0.3);' : 'background: rgba(16,185,129,0.15); color: #34D399; border: 1px solid rgba(16,185,129,0.3);'}">
                      ${isH2H ? '1v1 MATCH' : (isPrefectorialCup() ? '4-TEAMS' : '4-HOUSES')}
                    </span>
                    <span class="jais-status-badge ${isDone ? 'completed' : (isLive ? 'live' : 'upcoming')}" style="font-size: 0.62rem; padding: 2px 6px;">
                      ${isDone ? 'DONE' : (isLive ? '<span class="jais-live-beacon" style="width:5px;height:5px;"></span>LIVE' : (ev.scheduledTime || '10:00'))}
                    </span>
                  </div>
                  <div style="font-size: 0.72rem; color: var(--fm-text-secondary);">
                    ${isH2H && house1 && house2
                      ? `<span style="color: ${house1.color}; font-weight: 700;">${house1.name}</span> vs <span style="color: ${house2.color}; font-weight: 700;">${house2.name}</span> &bull; ${escapeHtml(ev.category)}`
                      : `All 4 ${isPrefectorialCup() ? 'Teams' : 'Houses'} Simultaneous &bull; ${escapeHtml(ev.category)} &bull; ${escapeHtml(ev.gender || 'All')}`}
                  </div>
                  ${ev.lastEditedBy ? `
                    <div style="font-size: 0.66rem; color: var(--fm-text-muted); margin-top: 3px;">
                      Last edited by: <strong style="color: var(--fm-green);">${escapeHtml(ev.lastEditedBy.adminId)} (${escapeHtml(ev.lastEditedBy.name)})</strong> &bull; ${escapeHtml(ev.lastEditedFormatted || ev.lastEditedAt || '')}
                    </div>
                  ` : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 5px; flex-shrink: 0;">
                  ${!isLive && !isDone ? `
                    <button type="button" onclick="window.pages.quickSetEventStatus('${ev.id}', 'live')" style="padding: 0.35rem 0.55rem; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.5); border-radius: 6px; font-size: 0.72rem; font-weight: 800; color: #EF4444; cursor: pointer; display: flex; align-items: center; gap: 4px;" title="Go Live Now — Float to Top &amp; Hide Time">
                      <span class="jais-live-dot" style="background:#EF4444; width:6px; height:6px; display:inline-block; border-radius:50%;"></span> Live
                    </button>
                  ` : isLive ? `
                    <button type="button" onclick="window.pages.quickSetEventStatus('${ev.id}', 'completed')" style="padding: 0.35rem 0.55rem; background: rgba(16,185,129,0.18); border: 1px solid rgba(16,185,129,0.5); border-radius: 6px; font-size: 0.72rem; font-weight: 800; color: #10B981; cursor: pointer; display: flex; align-items: center; gap: 4px;" title="Mark Event as Done">
                      <span style="display:inline-flex; width:12px; height:12px; align-items:center;">${ICONS.check}</span> Done
                    </button>
                  ` : `
                    <button type="button" onclick="window.pages.quickSetEventStatus('${ev.id}', 'upcoming')" style="padding: 0.3rem 0.45rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 6px; font-size: 0.68rem; font-weight: 700; color: var(--fm-text-muted); cursor: pointer;" title="Reset back to Upcoming">
                      Reset
                    </button>
                  `}
                  <a href="#/admin/edit-event/${ev.id}" class="jais-btn-setup" style="padding: 0.35rem 0.55rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 6px; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-primary); text-decoration: none;">
                    Setup
                  </a>
                  <a href="#/admin/score/${ev.id}" class="jais-btn-action-score" style="text-decoration: none; padding: 0.35rem 0.65rem; font-size: 0.72rem;">
                    ${isDone ? 'Edit Score' : (isLive ? 'Record' : 'Record')}
                  </a>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    ` : ''}

    ${currentTab === 'logs' ? `
      <!-- TAB 2: OFFICIAL AUDIT TRAIL, HISTORY & TIMESTAMPS -->
      <div style="padding: 0.5rem 0.85rem 2rem;">
        
        <!-- Audit Hub Header & Toolbar Card -->
        <div class="jais-admin-card" style="margin: 0 0 0.85rem; padding: 1rem; border: 1px solid rgba(0, 230, 107, 0.25); background: linear-gradient(180deg, rgba(0, 230, 107, 0.05) 0%, var(--fm-surface) 100%);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap;">
            <div>
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                <span class="jais-live-dot" style="background: var(--fm-green); width: 8px; height: 8px; border-radius: 50%;"></span>
                <h2 style="font-size: 1rem; font-weight: 800; color: var(--fm-text-primary); margin: 0;">Official Audit Trail &amp; History</h2>
              </div>
              <p style="font-size: 0.72rem; color: var(--fm-text-secondary); margin: 0;">
                Immutable timeline of judge scoring, status flips, roster edits &amp; admin sessions with exact timestamps.
              </p>
            </div>
            
            <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
              <button onclick="window.pages.exportAuditLogs('csv')" style="padding: 0.4rem 0.65rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 6px; font-size: 0.7rem; font-weight: 700; color: var(--fm-green); cursor: pointer;" title="Download complete audit log report as CSV">
                Export CSV
              </button>
              <button onclick="window.pages.exportAuditLogs('json')" style="padding: 0.4rem 0.65rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 6px; font-size: 0.7rem; font-weight: 700; color: var(--fm-text-primary); cursor: pointer;" title="Download raw audit records as JSON">
                Export JSON
              </button>
              <button onclick="window.pages.renderAdminPage({ tab: 'logs' })" style="padding: 0.4rem 0.65rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 6px; font-size: 0.7rem; font-weight: 700; color: var(--fm-text-secondary); cursor: pointer;" title="Refresh live audit logs">
                Refresh
              </button>
              <button onclick="window.pages.handleClearAuditLogs()" style="padding: 0.4rem 0.65rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; font-size: 0.7rem; font-weight: 700; color: #EF4444; cursor: pointer;" title="Reset audit log history">
                Clear
              </button>
            </div>
          </div>
          
          <div style="margin-top: 0.75rem; padding-top: 0.65rem; border-top: 1px solid var(--fm-border); display: flex; align-items: center; justify-content: space-between; font-size: 0.7rem; color: var(--fm-text-muted);">
            <span>Visible to all authenticated administrators &bull; Verified ID attribution</span>
            <span style="color: var(--fm-green); font-weight: 700;">Live Cloud Sync Active</span>
          </div>
        </div>

        <!-- Filter Chips Bar -->
        <div style="display: flex; gap: 5px; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 0.5rem; -webkit-overflow-scrolling: touch;">
          <button onclick="window.pages.filterAuditLogs('all')" style="padding: 0.35rem 0.65rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; cursor: pointer; white-space: nowrap; border: 1px solid ${currentFilter === 'all' ? 'var(--fm-green)' : 'var(--fm-border)'}; background: ${currentFilter === 'all' ? 'rgba(0, 230, 107, 0.18)' : 'var(--fm-surface)'}; color: ${currentFilter === 'all' ? 'var(--fm-green)' : 'var(--fm-text-secondary)'};">
            All Activity (${counts.all})
          </button>
          <button onclick="window.pages.filterAuditLogs('score_submission')" style="padding: 0.35rem 0.65rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; cursor: pointer; white-space: nowrap; border: 1px solid ${currentFilter === 'score_submission' ? '#10B981' : 'var(--fm-border)'}; background: ${currentFilter === 'score_submission' ? 'rgba(16, 185, 129, 0.18)' : 'var(--fm-surface)'}; color: ${currentFilter === 'score_submission' ? '#10B981' : 'var(--fm-text-secondary)'};">
            Scores &amp; Results (${counts.score})
          </button>
          <button onclick="window.pages.filterAuditLogs('status_change')" style="padding: 0.35rem 0.65rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; cursor: pointer; white-space: nowrap; border: 1px solid ${currentFilter === 'status_change' ? '#EF4444' : 'var(--fm-border)'}; background: ${currentFilter === 'status_change' ? 'rgba(239, 68, 68, 0.18)' : 'var(--fm-surface)'}; color: ${currentFilter === 'status_change' ? '#EF4444' : 'var(--fm-text-secondary)'};">
            Status Changes (${counts.status})
          </button>
          <button onclick="window.pages.filterAuditLogs('admin_login')" style="padding: 0.35rem 0.65rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; cursor: pointer; white-space: nowrap; border: 1px solid ${currentFilter === 'admin_login' ? '#60A5FA' : 'var(--fm-border)'}; background: ${currentFilter === 'admin_login' ? 'rgba(59, 130, 246, 0.18)' : 'var(--fm-surface)'}; color: ${currentFilter === 'admin_login' ? '#60A5FA' : 'var(--fm-text-secondary)'};">
            Admin Logins (${counts.login})
          </button>
          <button onclick="window.pages.filterAuditLogs('system')" style="padding: 0.35rem 0.65rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; cursor: pointer; white-space: nowrap; border: 1px solid ${currentFilter === 'system' ? '#F59E0B' : 'var(--fm-border)'}; background: ${currentFilter === 'system' ? 'rgba(245, 158, 11, 0.18)' : 'var(--fm-surface)'}; color: ${currentFilter === 'system' ? '#F59E0B' : 'var(--fm-text-secondary)'};">
            System &amp; Rosters (${counts.system})
          </button>
        </div>

        <!-- Live Instant Search Bar -->
        <div style="position: relative; margin-bottom: 0.75rem;">
          <input type="text" id="jais-audit-search-input" placeholder="Search by event, admin ID (ADM-001), email, athlete or keyword..." value="${escapeHtml(window.currentAuditSearch || '')}" oninput="window.pages.searchAuditLogs(this.value)" style="width: 100%; box-sizing: border-box; padding: 0.6rem 2.2rem 0.6rem 0.85rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 8px; font-size: 0.78rem; color: var(--fm-text-primary); outline: none;" />
          ${window.currentAuditSearch ? `
            <button onclick="window.pages.searchAuditLogs('')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--fm-text-muted); cursor: pointer; font-size: 0.8rem; padding: 2px;">
              ${ICONS.cross}
            </button>
          ` : `
            <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--fm-text-muted); pointer-events: none; display: flex; align-items: center;">
              ${ICONS.search}
            </span>
          `}
        </div>

        <!-- Log Count Summary Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; font-size: 0.72rem; color: var(--fm-text-secondary);">
          <span>Showing <strong>${filteredLogs.length}</strong> of ${allLogs.length} entries</span>
          <span>Order: Newest First</span>
        </div>

        <!-- Chronological Logs Feed -->
        ${filteredLogs.length === 0 ? `
          <div class="jais-admin-card" style="text-align: center; padding: 2.5rem 1rem;">
            <div style="width: 42px; height: 42px; margin: 0 auto 0.75rem; border-radius: 50%; background: var(--fm-surface-elevated); display: flex; align-items: center; justify-content: center; color: var(--fm-text-muted);">
              ${ICONS.clock}
            </div>
            <h3 style="font-size: 0.95rem; font-weight: 800; color: var(--fm-text-primary); margin: 0 0 0.25rem;">No Audit Logs Found</h3>
            <p style="font-size: 0.74rem; color: var(--fm-text-secondary); margin: 0;">
              ${searchQuery ? `No activity matching "${escapeHtml(searchQuery)}". Try clearing your search.` : 'No actions recorded under this filter yet.'}
            </p>
            ${searchQuery ? `
              <button onclick="window.pages.searchAuditLogs('')" style="margin-top: 0.75rem; padding: 0.4rem 0.8rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 6px; font-size: 0.72rem; color: var(--fm-green); font-weight: 700; cursor: pointer;">
                Clear Search
              </button>
            ` : ''}
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.55rem;">
            ${filteredLogs.map(log => {
              const isScore = log.type === 'score_submission';
              const isStatus = log.type === 'status_change';
              const isLogin = log.type === 'admin_login';
              const isReset = log.type === 'score_reset';
              const isDemo = log.type === 'demo_seed';
              const isRoster = log.type === 'roster_update';
              const isSetup = log.type === 'event_setup';

              let badgeBg = 'rgba(0, 230, 107, 0.15)';
              let badgeBorder = 'rgba(0, 230, 107, 0.35)';
              let badgeColor = '#00E676';
              let badgeLabel = 'OFFICIAL ACTION';
              let typeIcon = ICONS.checkCircle;

              if (isScore) {
                badgeBg = 'rgba(16, 185, 129, 0.15)';
                badgeBorder = 'rgba(16, 185, 129, 0.4)';
                badgeColor = '#10B981';
                badgeLabel = 'SCORE PUBLISHED';
                typeIcon = ICONS.trophy;
              } else if (isStatus) {
                const isLiveNow = (log.metadata?.newStatus === 'live');
                badgeBg = isLiveNow ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
                badgeBorder = isLiveNow ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)';
                badgeColor = isLiveNow ? '#EF4444' : '#10B981';
                badgeLabel = isLiveNow ? 'EVENT LIVE' : 'STATUS UPDATE';
                typeIcon = isLiveNow ? ICONS.whistle : ICONS.check;
              } else if (isLogin) {
                badgeBg = 'rgba(59, 130, 246, 0.15)';
                badgeBorder = 'rgba(59, 130, 246, 0.4)';
                badgeColor = '#60A5FA';
                badgeLabel = 'ADMIN LOGIN';
                typeIcon = ICONS.key;
              } else if (isReset) {
                badgeBg = 'rgba(220, 38, 38, 0.15)';
                badgeBorder = 'rgba(220, 38, 38, 0.4)';
                badgeColor = '#DC2626';
                badgeLabel = 'SCORES RESET';
                typeIcon = ICONS.trash;
              } else if (isDemo) {
                badgeBg = 'rgba(245, 158, 11, 0.15)';
                badgeBorder = 'rgba(245, 158, 11, 0.4)';
                badgeColor = '#F59E0B';
                badgeLabel = 'DEMO SEEDED';
                typeIcon = ICONS.bolt;
              } else if (isRoster) {
                badgeBg = 'rgba(139, 92, 246, 0.15)';
                badgeBorder = 'rgba(139, 92, 246, 0.4)';
                badgeColor = '#A78BFA';
                badgeLabel = 'ROSTER UPDATE';
                typeIcon = ICONS.house;
              } else if (isSetup) {
                badgeBg = 'rgba(99, 102, 241, 0.15)';
                badgeBorder = 'rgba(99, 102, 241, 0.4)';
                badgeColor = '#818CF8';
                badgeLabel = 'SETUP SAVED';
                typeIcon = ICONS.track;
              }

              const hasPlacings = Boolean(log.metadata?.placings && (log.metadata.placings.first || log.metadata.placings.second));
              const p = log.metadata?.placings;

              return `
                <div class="jais-admin-card" style="margin: 0; padding: 0.85rem; border: 1px solid var(--fm-border); background: var(--fm-surface); transition: border-color 0.2s ease;">
                  
                  <!-- Card Header: Action Pill + Timestamps -->
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 4px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 5px; font-size: 0.62rem; font-weight: 800; background: ${badgeBg}; border: 1px solid ${badgeBorder}; color: ${badgeColor};">
                        <span style="display: inline-flex; width: 12px; height: 12px; align-items: center;">${typeIcon}</span>
                        ${badgeLabel}
                      </span>
                      ${log.eventName ? `<span style="font-size: 0.72rem; color: var(--fm-text-muted);">&bull; ${escapeHtml(log.eventName)}</span>` : ''}
                    </div>

                    <div style="text-align: right; display: flex; align-items: center; gap: 6px;">
                      <span style="font-size: 0.72rem; color: var(--fm-green); font-weight: 700;">${formatRelativeTime(log.timestamp)}</span>
                      <span style="font-size: 0.68rem; color: var(--fm-text-muted);" title="${escapeHtml(log.timestamp || '')}">${escapeHtml(log.formattedTime || '')}</span>
                    </div>
                  </div>

                  <!-- Admin Attribution -->
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 0.5rem; font-size: 0.72rem; color: var(--fm-text-secondary); flex-wrap: wrap;">
                    <span class="jais-admin-badge-id" style="font-size: 0.65rem; padding: 1px 5px;">${escapeHtml(log.adminId || 'ADM-001')}</span>
                    <strong style="color: var(--fm-text-primary);">${escapeHtml(log.adminName || 'Admin')}</strong>
                    <span style="color: var(--fm-text-muted);">&bull; ${escapeHtml(log.adminEmail || 'davidfestusugwu@gmail.com')}</span>
                    ${log.adminRole ? `<span style="font-size: 0.6rem; color: var(--fm-text-muted); text-transform: uppercase;">[${escapeHtml(log.adminRole)}]</span>` : ''}
                  </div>

                  <!-- Action Title & Details -->
                  <div style="font-size: 0.84rem; font-weight: 800; color: var(--fm-text-primary); margin-bottom: 0.35rem;">
                    ${escapeHtml(log.title || 'Official Action')}
                  </div>
                  <div style="font-size: 0.74rem; color: var(--fm-text-secondary); line-height: 1.4; margin-bottom: 0.5rem;">
                    ${escapeHtml(log.details || log.summary || '')}
                  </div>

                  <!-- Visual Placings Matrix (if score submission with results) -->
                  ${hasPlacings && p ? `
                    <div style="margin: 0.5rem 0 0.4rem; padding: 0.5rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 6px;">
                      <div style="font-size: 0.66rem; font-weight: 800; color: var(--fm-text-muted); text-transform: uppercase; margin-bottom: 0.4rem; letter-spacing: 0.5px;">Official Verified Standings:</div>
                      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 6px;">
                        ${p.first ? `
                          <div style="padding: 4px 6px; background: rgba(250, 204, 21, 0.08); border-left: 3px solid var(--fm-gold); border-radius: 4px; font-size: 0.7rem;">
                            <div style="display: flex; align-items: center; justify-content: space-between; font-weight: 800; color: var(--fm-gold);">
                              <span>1st (Gold)</span>
                              ${(isBallSportEvent(log) || isBallSportEvent({ name: log.title || log.eventName })) && p.first.points ? `<span>+${p.first.points} pts</span>` : ''}
                            </div>
                            <div style="color: var(--fm-text-primary); font-weight: 700; text-transform: capitalize;">${escapeHtml(p.first.houseId || '')} House</div>
                            ${p.first.athlete ? `<div style="color: var(--fm-text-muted); font-size: 0.65rem;">${escapeHtml(p.first.athlete)}${p.first.score ? ' (' + escapeHtml(p.first.score) + ')' : ''}</div>` : ''}
                          </div>
                        ` : ''}
                        ${p.second ? `
                          <div style="padding: 4px 6px; background: rgba(148, 163, 184, 0.08); border-left: 3px solid var(--fm-silver); border-radius: 4px; font-size: 0.7rem;">
                            <div style="display: flex; align-items: center; justify-content: space-between; font-weight: 800; color: var(--fm-silver);">
                              <span>2nd (Silver)</span>
                              ${(isBallSportEvent(log) || isBallSportEvent({ name: log.title || log.eventName })) && p.second.points ? `<span>+${p.second.points} pts</span>` : ''}
                            </div>
                            <div style="color: var(--fm-text-primary); font-weight: 700; text-transform: capitalize;">${escapeHtml(p.second.houseId || '')} House</div>
                            ${p.second.athlete ? `<div style="color: var(--fm-text-muted); font-size: 0.65rem;">${escapeHtml(p.second.athlete)}${p.second.score ? ' (' + escapeHtml(p.second.score) + ')' : ''}</div>` : ''}
                          </div>
                        ` : ''}
                        ${p.third ? `
                          <div style="padding: 4px 6px; background: rgba(234, 88, 12, 0.08); border-left: 3px solid var(--fm-bronze); border-radius: 4px; font-size: 0.7rem;">
                            <div style="display: flex; align-items: center; justify-content: space-between; font-weight: 800; color: var(--fm-bronze);">
                              <span>3rd (Bronze)</span>
                              ${(isBallSportEvent(log) || isBallSportEvent({ name: log.title || log.eventName })) && p.third.points ? `<span>+${p.third.points} pts</span>` : ''}
                            </div>
                            <div style="color: var(--fm-text-primary); font-weight: 700; text-transform: capitalize;">${escapeHtml(p.third.houseId || '')} House</div>
                            ${p.third.athlete ? `<div style="color: var(--fm-text-muted); font-size: 0.65rem;">${escapeHtml(p.third.athlete)}${p.third.score ? ' (' + escapeHtml(p.third.score) + ')' : ''}</div>` : ''}
                          </div>
                        ` : ''}
                        ${p.fourth ? `
                          <div style="padding: 4px 6px; background: rgba(100, 116, 139, 0.08); border-left: 3px solid var(--fm-text-muted); border-radius: 4px; font-size: 0.7rem;">
                            <div style="display: flex; align-items: center; justify-content: space-between; font-weight: 800; color: var(--fm-text-muted);">
                              <span>4th Place</span>
                              ${(isBallSportEvent(log) || isBallSportEvent({ name: log.title || log.eventName })) && p.fourth.points ? `<span>+${p.fourth.points} pts</span>` : ''}
                            </div>
                            <div style="color: var(--fm-text-primary); font-weight: 700; text-transform: capitalize;">${escapeHtml(p.fourth.houseId || '')} House</div>
                            ${p.fourth.athlete ? `<div style="color: var(--fm-text-muted); font-size: 0.65rem;">${escapeHtml(p.fourth.athlete)}${p.fourth.score ? ' (' + escapeHtml(p.fourth.score) + ')' : ''}</div>` : ''}
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  ` : ''}

                  <!-- Card Footer: Exact Timestamp ISO tooltip + Metadata Toggle -->
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; font-size: 0.66rem; color: var(--fm-text-muted); border-top: 1px solid rgba(255,255,255,0.04); padding-top: 0.4rem;">
                    <span>ISO: <span style="font-family: monospace;">${escapeHtml(log.timestamp || '')}</span></span>
                    <button onclick="window.pages.toggleLogDetails('${log.id}')" style="background: none; border: none; color: var(--fm-green); font-size: 0.66rem; font-weight: 700; cursor: pointer; padding: 2px 4px;">
                      Details &nabla;
                    </button>
                  </div>

                  <!-- Expandable Raw JSON Metadata -->
                  <div id="log-details-${log.id}" style="display: none; margin-top: 0.5rem; padding: 0.5rem; background: #000000; border-radius: 4px; font-family: monospace; font-size: 0.62rem; color: #34D399; overflow-x: auto; white-space: pre-wrap; word-break: break-all;">
${escapeHtml(JSON.stringify(log, null, 2))}
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        `}

      </div>
    ` : ''}

    ${currentTab === 'admins' ? `
      <!-- TAB 3: OFFICIALS & ADMINS MANAGEMENT -->
      <div style="padding: 0.5rem 0.85rem 0.25rem;">
        <div class="jais-admin-card" style="margin: 0; padding: 0.85rem; border-left: 4px solid ${isSuper ? 'var(--fm-green)' : '#60A5FA'}; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
              <span style="font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; ${isSuper ? 'background: rgba(0, 230, 118, 0.18); color: var(--fm-green); border: 1px solid rgba(0, 230, 118, 0.3);' : 'background: rgba(59, 130, 246, 0.18); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3);'}">
                ${isSuper ? '★ SUPERADMIN CONTROL' : 'OFFICIAL JUDGE ACCESS'}
              </span>
              <strong style="color: var(--fm-text-primary); font-size: 0.88rem;">Official Accounts Registry</strong>
            </div>
            <div style="font-size: 0.72rem; color: var(--fm-text-secondary);">
              ${isSuper 
                ? 'As a Super Administrator, you can register new judges/marshals, promote superadmins, reset credentials, and manage access.' 
                : 'View authorized judges and marshals. Note: Super Administrator privileges are required to register or remove officials.'}
            </div>
          </div>
          ${isSuper ? `
            <button onclick="window.pages.toggleAddAdminForm()" class="jais-cta-btn" style="margin: 0; flex-shrink: 0; padding: 0.5rem 0.85rem; font-size: 0.78rem; font-weight: 800; background: ${showAddAdminForm ? 'var(--fm-surface-active)' : 'var(--fm-green)'}; color: ${showAddAdminForm ? 'var(--fm-text-primary)' : '#000'}; border-radius: 8px;">
              ${showAddAdminForm ? 'Close Form' : '+ Register New Official'}
            </button>
          ` : ''}
        </div>
      </div>

      ${showAddAdminForm && isSuper ? `
        <!-- Add New Official Expandable Form -->
        <div style="padding: 0.25rem 0.85rem 0.5rem;">
          <div class="jais-section-card" style="margin: 0; padding: 1rem; border-top: 3px solid var(--fm-green);">
            <div style="font-weight: 800; font-size: 0.92rem; margin-bottom: 0.75rem; color: var(--fm-text-primary); display: flex; align-items: center; gap: 6px;">
              <span>${ICONS.judge}</span>
              <span>Register Official / Judge Account</span>
            </div>
            <form onsubmit="window.pages.handleAddAdmin(event)">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.65rem;">
                <div>
                  <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Full Official Name *</label>
                  <input type="text" id="new-admin-name" class="jais-text-input" placeholder="e.g. Coach Marcus Adams" required style="width: 100%; font-size: 0.85rem;" />
                </div>
                <div>
                  <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Official Email Address *</label>
                  <input type="email" id="new-admin-email" class="jais-text-input" placeholder="e.g. marcus.adams@juilliard.org" required style="width: 100%; font-size: 0.85rem;" />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.65rem;">
                <div>
                  <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Role &amp; Authority *</label>
                  <select id="new-admin-role" class="jais-text-input" style="width: 100%; font-size: 0.82rem;">
                    <option value="admin" selected>Score Judge &amp; Marshal (Standard Admin)</option>
                    <option value="super_admin">Super Administrator (Full Privileges)</option>
                  </select>
                </div>
                <div>
                  <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Title / Role Designation</label>
                  <input type="text" id="new-admin-title" class="jais-text-input" placeholder="e.g. Track &amp; Field Head Judge" value="Score Judge &amp; Marshal" style="width: 100%; font-size: 0.85rem;" />
                </div>
              </div>

              <div style="margin-bottom: 0.85rem;">
                <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Initial Password (Optional — min 4 chars)</label>
                <input type="password" id="new-admin-password" class="jais-text-input" placeholder="Leave blank to let official set password upon first login" minlength="4" style="width: 100%; font-size: 0.85rem;" />
                <div style="font-size: 0.65rem; color: var(--fm-text-muted); margin-top: 2px;">
                  If left blank, the official will be prompted to set their own password when they first log into the Official Portal.
                </div>
              </div>

              <div style="display: flex; gap: 0.5rem;">
                <button type="submit" id="btn-save-new-admin" class="jais-cta-btn" style="flex: 1; margin: 0; padding: 0.65rem; font-size: 0.82rem; font-weight: 800; background: var(--fm-green); color: #000;">
                  Register Official Account
                </button>
                <button type="button" onclick="window.pages.toggleAddAdminForm()" style="padding: 0.65rem 1rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 8px; font-size: 0.78rem; font-weight: 700; color: var(--fm-text-secondary); cursor: pointer;">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}

      <!-- Registered Officials Cards List -->
      <div style="padding: 0.5rem 0.85rem 2rem;">
        <div class="jais-admin-card" style="margin: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div style="font-weight: 800; font-size: 0.85rem; color: var(--fm-text-primary);">Registered Officials (${allAdmins.length})</div>
            <span style="font-size: 0.7rem; color: var(--fm-text-muted);">Juilliard Sports Day Council</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            ${allAdmins.map(adm => {
              const isRoot = isPermanentSuperAdmin(adm.id) || isPermanentSuperAdmin(adm.email);
              const isAdmSuper = adm.role === 'super_admin';
              return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 10px; gap: 0.5rem; flex-wrap: wrap;">
                  <div style="flex: 1; min-width: 200px;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px; flex-wrap: wrap;">
                      <span class="jais-admin-badge-id" style="font-size: 0.68rem; padding: 2px 6px;">${escapeHtml(adm.id)}</span>
                      <strong style="color: var(--fm-text-primary); font-size: 0.88rem;">${escapeHtml(adm.name)}</strong>
                      <span style="font-size: 0.62rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; ${isAdmSuper ? 'background: rgba(250, 204, 21, 0.15); color: var(--fm-gold); border: 1px solid rgba(250, 204, 21, 0.3);' : 'background: rgba(59, 130, 246, 0.15); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3);'}">
                        ${isAdmSuper ? '★ SUPER ADMIN' : 'OFFICIAL JUDGE'}
                      </span>
                      ${isRoot ? `<span style="font-size: 0.6rem; color: var(--fm-green); font-weight: 800; padding: 1px 4px; background: rgba(0, 230, 118, 0.12); border-radius: 4px;">ROOT</span>` : ''}
                    </div>
                    <div style="font-size: 0.74rem; color: var(--fm-text-secondary); margin-bottom: 2px;">
                      <strong>${escapeHtml(adm.title || 'Official')}</strong> &bull; <span style="font-family: monospace;">${escapeHtml(adm.email)}</span>
                    </div>
                    <div style="font-size: 0.65rem; color: var(--fm-text-muted);">
                      Registered: ${adm.createdAt ? formatRelativeTime(adm.createdAt) : 'Initial Setup'} &bull; By: ${escapeHtml(adm.createdBy || 'System')}
                    </div>
                  </div>

                  ${isSuper ? `
                    <div style="display: flex; align-items: center; gap: 5px; flex-shrink: 0;" onclick="event.stopPropagation();">
                      <button type="button" onclick="window.pages.openEditAdminModal('${adm.id}')" style="padding: 0.4rem 0.65rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 6px; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-primary); cursor: pointer;" title="Edit details">
                        Edit
                      </button>
                      <button type="button" onclick="window.pages.openResetAdminPasswordModal('${adm.id}')" style="padding: 0.4rem 0.65rem; background: var(--fm-surface); border: 1px solid rgba(250, 204, 21, 0.3); border-radius: 6px; font-size: 0.72rem; font-weight: 700; color: var(--fm-gold); cursor: pointer;" title="Reset password">
                        Password
                      </button>
                      ${!isRoot ? `
                        <button type="button" onclick="window.pages.handleDeleteAdmin('${adm.id}')" style="padding: 0.4rem 0.6rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; font-size: 0.72rem; font-weight: 700; color: #EF4444; cursor: pointer;" title="Remove official">
                          Delete
                        </button>
                      ` : `
                        <span style="font-size: 0.62rem; color: var(--fm-text-muted); padding: 0 4px;" title="Root Super Admin cannot be deleted">Protected</span>
                      `}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Edit Official Modal -->
      <div id="edit-admin-modal" class="jais-modal-backdrop" style="display: none;" onclick="if(event.target===this) window.pages.closeEditAdminModal()">
        <div class="jais-modal-dialog" style="max-width: 440px; margin: 2rem auto; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 12px; padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--fm-border); padding-bottom: 0.5rem;">
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--fm-text-primary);">
              Edit Official Details (<span id="edit-admin-id-label"></span>)
            </div>
            <button onclick="window.pages.closeEditAdminModal()" style="background: none; border: none; font-size: 1.25rem; color: var(--fm-text-muted); cursor: pointer;">&times;</button>
          </div>
          <form onsubmit="window.pages.handleSaveEditAdmin(event)">
            <div style="margin-bottom: 0.75rem;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Email Address (Read-only)</label>
              <div id="edit-admin-email-static" style="padding: 0.55rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 6px; font-size: 0.8rem; color: var(--fm-text-muted); font-family: monospace;"></div>
            </div>
            <div style="margin-bottom: 0.75rem;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Full Official Name *</label>
              <input type="text" id="edit-admin-name" class="jais-text-input" required style="width: 100%; font-size: 0.85rem;" />
            </div>
            <div style="margin-bottom: 0.75rem;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Title / Role Designation</label>
              <input type="text" id="edit-admin-title" class="jais-text-input" style="width: 100%; font-size: 0.85rem;" />
            </div>
            <div style="margin-bottom: 1rem;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Role &amp; Authority</label>
              <select id="edit-admin-role" class="jais-text-input" style="width: 100%; font-size: 0.85rem;">
                <option value="admin">Score Judge &amp; Marshal (Standard Admin)</option>
                <option value="super_admin">Super Administrator (Full Privileges)</option>
              </select>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button type="submit" class="jais-cta-btn" style="flex: 1; margin: 0; padding: 0.65rem; font-size: 0.82rem; font-weight: 800; background: var(--fm-green); color: #000;">
                Save Changes
              </button>
              <button type="button" onclick="window.pages.closeEditAdminModal()" style="padding: 0.65rem 1rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; font-size: 0.78rem; font-weight: 700; color: var(--fm-text-secondary); cursor: pointer;">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Reset Password Modal -->
      <div id="reset-admin-password-modal" class="jais-modal-backdrop" style="display: none;" onclick="if(event.target===this) window.pages.closeResetAdminPasswordModal()">
        <div class="jais-modal-dialog" style="max-width: 420px; margin: 2rem auto; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 12px; padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--fm-border); padding-bottom: 0.5rem;">
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--fm-text-primary);">
              Reset Official Password
            </div>
            <button onclick="window.pages.closeResetAdminPasswordModal()" style="background: none; border: none; font-size: 1.25rem; color: var(--fm-text-muted); cursor: pointer;">&times;</button>
          </div>
          <form onsubmit="window.pages.handleSaveResetAdminPassword(event)">
            <div style="margin-bottom: 0.75rem;">
              <div style="font-size: 0.72rem; color: var(--fm-text-secondary); margin-bottom: 3px;">Target Official:</div>
              <div id="reset-admin-pwd-target-label" style="font-weight: 700; font-size: 0.82rem; color: var(--fm-text-primary);"></div>
            </div>
            <div style="margin-bottom: 1rem;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">New Password * (min 4 characters)</label>
              <input type="password" id="reset-admin-pwd-input" class="jais-text-input" placeholder="Enter new secret password" required minlength="4" style="width: 100%; font-size: 0.85rem;" />
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button type="submit" class="jais-cta-btn" style="flex: 1; margin: 0; padding: 0.65rem; font-size: 0.82rem; font-weight: 800; background: var(--fm-green); color: #000;">
                Update Password
              </button>
              <button type="button" onclick="window.pages.closeResetAdminPasswordModal()" style="padding: 0.65rem 1rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; font-size: 0.78rem; font-weight: 700; color: var(--fm-text-secondary); cursor: pointer;">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    ` : ''}
  `;
}

export function renderScoreEntryPage(params) {
  showScreen("screen-score-entry");
  const container = document.getElementById("screen-score-entry");
  const { events, houses: cachedHouses, students } = getCachedData();
  if (!container) return;

  const eventId = params?.id || "track-100m-boys";
  let ev = events.find(e => e.id === eventId);
  if (!ev) {
    if (eventId && eventId.startsWith("pref-")) {
      ev = getPrefectorialEvents().find(e => e.id === eventId);
    } else {
      const allHousesEvents = (window.currentEventsCache && window.currentEventsCache.length) ? window.currentEventsCache : INITIAL_EVENTS;
      ev = allHousesEvents.find(e => e.id === eventId);
    }
  }
  if (!ev) ev = events[0] || INITIAL_EVENTS[0];
  const houses = (ev && ev.id && ev.id.startsWith("pref-")) ? getPrefectorialTeams() : (cachedHouses.some(h => !h.id.startsWith("team-")) ? cachedHouses : INITIAL_HOUSES);
  const isPrefect = (ev && ev.id && String(ev.id).startsWith("pref-")) || isPrefectorialCup();
  const matrix = ev.pointsMatrix || { first: 100, second: 60, third: 40, fourth: 20 };
  const isH2H = (ev.format === "h2h") || (ev.contenders && ev.contenders.length === 2);
  const isDone = isEventCompleted(ev);
  const isLive = isEventLive(ev);

  const team1Default = ev.contenders?.[0] || ev.results?.first?.houseId || houses[0]?.id || "phoenix";
  const team2Default = ev.contenders?.[1] || ev.results?.second?.houseId || houses[1]?.id || "eagle";

  if (window.currentEventScorersEventId !== ev.id) {
    window.currentEventScorersEventId = ev.id;
    window.currentEventScorers = (ev.results?.scorers && Array.isArray(ev.results.scorers))
      ? JSON.parse(JSON.stringify(ev.results.scorers))
      : [];
  }
  const currentScorers = window.currentEventScorers || [];

  let initScore1 = "0";
  let initScore2 = "0";
  if (ev.results?.first?.score !== undefined) {
    if (typeof ev.results.first.score === "string" && ev.results.first.score.includes("-")) {
      const parts = ev.results.first.score.split("-").map(p => p.trim());
      if (ev.results.first?.houseId === team2Default) {
        initScore1 = parts[1] || "0";
        initScore2 = parts[0] || "0";
      } else {
        initScore1 = parts[0] || "0";
        initScore2 = parts[1] || "0";
      }
    } else {
      if (ev.results.first?.houseId === team1Default) {
        initScore1 = String(ev.results.first.score ?? 0);
        initScore2 = String(ev.results.second?.score ?? 0);
      } else {
        initScore1 = String(ev.results.second?.score ?? 0);
        initScore2 = String(ev.results.first?.score ?? 0);
      }
    }
  }

  container.innerHTML = `
    <!-- Top Nav -->
    <div class="jais-detail-top-nav">
      <button class="jais-detail-back" onclick="window.appRouter.back()">
        <span style="display: flex; align-items: center; margin-right: 4px;">${ICONS.backArrow}</span>
      </button>
      <div style="font-weight: 800; font-size: 0.95rem;">Official Score Entry</div>
      <div style="display: flex; gap: 4px; align-items: center;">
        <a href="#/admin/edit-event/${ev.id}" style="font-size: 0.72rem; color: var(--fm-green); text-decoration: none; font-weight: 700; margin-right: 4px;">Setup</a>
        <span class="jais-badge-admin">JUDGE</span>
      </div>
    </div>

    <div style="padding: 1rem 0.85rem 2rem;">
      <div class="jais-section-card" style="margin: 0 0 1rem; padding: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
          <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--fm-text-primary); margin: 0;">${escapeHtml(ev.name)}</h2>
          <span style="font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; ${isH2H ? 'background: rgba(59,130,246,0.15); color: #60A5FA; border: 1px solid rgba(59,130,246,0.3);' : 'background: rgba(16,185,129,0.15); color: #34D399; border: 1px solid rgba(16,185,129,0.3);'}">
            ${isH2H ? '1v1 MATCH' : '4-HOUSE SIMULTANEOUS'}
          </span>
        </div>
        ${ev.lastEditedBy ? `
          <div class="jais-audit-tag" style="margin-bottom: 0.65rem; width: 100%; box-sizing: border-box; justify-content: space-between;">
            <span>Last recorded by <strong>${escapeHtml(ev.lastEditedBy.adminId)} (${escapeHtml(ev.lastEditedBy.name)})</strong></span>
            <span>${escapeHtml(ev.lastEditedFormatted || ev.lastEditedAt || '')}</span>
          </div>
        ` : ''}
        
        <p style="font-size: 0.75rem; color: var(--fm-text-secondary); margin-bottom: 1rem;">
          Category: <strong>${escapeHtml(ev.category)} &bull; ${escapeHtml(ev.gender || 'All')}</strong>.
          ${isH2H ? (isPrefect ? 'Head-to-head match between 2 teams with individual student goal/point scoring.' : 'Head-to-head match between 2 houses with individual student goal/point scoring.') : (isPrefect ? 'All four teams compete simultaneously. Select team and search students from school database.' : 'All four houses compete simultaneously. Select house and search students from school database.')}
        </p>

        <!-- Quick One-Tap Status Selector Pill Bar -->
        <div style="margin-bottom: 1.25rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 10px; padding: 0.65rem;">
          <div style="font-size: 0.7rem; font-weight: 800; color: var(--fm-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.45rem;">
            One-Tap Event State Trigger:
          </div>
          <div style="display: flex; gap: 0.45rem;">
            <button type="button" onclick="window.pages.quickSetEventStatus('${ev.id}', 'live')" title="Go Live Now" data-action="Go Live Now" style="flex: 1; padding: 0.5rem; border-radius: 8px; font-weight: 800; font-size: 0.76rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; ${isLive ? 'background: #EF4444; color: #FFF; border: none; box-shadow: 0 0 10px rgba(239,68,68,0.4);' : 'background: var(--fm-surface); color: #EF4444; border: 1px solid rgba(239,68,68,0.4);'}">
              <span class="jais-live-beacon" style="width:6px;height:6px;background:${isLive ? '#FFF' : '#EF4444'};"></span>
              ${isLive ? 'LIVE NOW (Go Live Now)' : 'Go Live Now'}
            </button>
            <button type="button" onclick="window.pages.quickSetEventStatus('${ev.id}', 'completed')" title="Mark as Done" data-action="Mark as Done" style="flex: 1; padding: 0.5rem; border-radius: 8px; font-weight: 800; font-size: 0.76rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; ${isDone ? 'background: #10B981; color: #000; border: none; box-shadow: 0 0 10px rgba(16,185,129,0.3);' : 'background: var(--fm-surface); color: #10B981; border: 1px solid rgba(16,185,129,0.4);'}">
              ${isDone ? 'MARKED DONE (Done)' : 'Mark as Done'}
            </button>
            <button type="button" onclick="window.pages.quickSetEventStatus('${ev.id}', 'upcoming')" title="Reset to Upcoming" style="padding: 0.5rem 0.75rem; border-radius: 8px; font-weight: 700; font-size: 0.74rem; cursor: pointer; background: var(--fm-surface); color: var(--fm-text-secondary); border: 1px solid var(--fm-border);">
              Reset
            </button>
          </div>
          <div style="font-size: 0.68rem; color: var(--fm-text-muted); margin-top: 0.4rem;">
            ${isLive ? 'Currently LIVE: Scheduled time hidden, automatically pinned to top of matches feed.' : (isDone ? 'Currently DONE: Marked clearly as DONE to all viewers.' : 'Currently UPCOMING: Shows scheduled time in order.')}
          </div>
        </div>

        <form onsubmit="window.pages.handleScoreSubmission(event, '${ev.id}', ${isH2H})">
          <!-- Event Status Selector -->
          <div style="margin-bottom: 1rem;">
            <label style="font-size: 0.75rem; font-weight: 800; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">Event State When Saving</label>
            <select id="score-event-status" class="jais-text-input" style="width: 100%; font-weight: 700;">
              <option value="completed" ${isDone ? 'selected' : ''}>Done / Completed • Clearly mark as DONE to all viewers</option>
              <option value="live" ${isLive ? 'selected' : ''}>Live Now • Stop showing time and float to top of fixtures</option>
              <option value="upcoming" ${!isDone && !isLive ? 'selected' : ''}>Upcoming • Scheduled match in order</option>
            </select>
          </div>

          ${isH2H ? `
            <!-- 2-Team Head-to-Head Entry Form (Football, Basketball, Tug-of-War) -->
            <div style="background: var(--fm-surface-elevated); padding: 0.85rem; border-radius: 10px; margin-bottom: 1rem; border: 1px solid var(--fm-border);">
              <div style="font-size: 0.78rem; font-weight: 800; color: var(--fm-text-primary); margin-bottom: 0.65rem;">1v1 Match Scoreline</div>
              
              <!-- Team 1 -->
              <div style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.72rem; color: var(--fm-text-secondary); font-weight: 700; margin-bottom: 2px; display: block;">Team 1</label>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <select id="score-team-1" class="jais-text-input" style="flex: 2;" onchange="window.pages.updateH2HTeamSelectors()">
                    ${houses.map(h => `<option value="${h.id}" ${team1Default === h.id ? 'selected' : ''}>${h.name}${isPrefect ? '' : ' House'}</option>`).join("")}
                  </select>
                  <input type="number" id="score-team-1-val" class="jais-text-input" placeholder="0" value="${escapeHtml(initScore1)}" style="flex: 1; text-align: center; font-weight: 800; font-size: 1.1rem;" />
                </div>
                <!-- Live Points Adder for Team 1 -->
                <div class="jais-live-pts-bar" style="margin-top: 6px;">
                  <span style="font-size: 0.68rem; font-weight: 800; color: var(--fm-text-secondary); margin-right: 4px;">Live Score:</span>
                  ${(ev.name || '').toLowerCase().includes('basketball') || ev.category === 'Basketball' ? `
                    <button type="button" class="jais-live-pts-btn ft" onclick="window.pages.adjustLiveScore('${ev.id}', 1, 1, 'ft')" title="Free Throw (+1)">+1 FT</button>
                    <button type="button" class="jais-live-pts-btn fg" onclick="window.pages.adjustLiveScore('${ev.id}', 1, 2, 'fg')" title="Field Goal (+2)">+2 FG</button>
                    <button type="button" class="jais-live-pts-btn three-pt" onclick="window.pages.adjustLiveScore('${ev.id}', 1, 3, '3pt')" title="Three Pointer (+3)">+3 3PT</button>
                    <button type="button" class="jais-live-pts-btn undo" onclick="window.pages.adjustLiveScore('${ev.id}', 1, -1, 'sub')" title="Subtract 1">-1</button>
                  ` : `
                    <button type="button" class="jais-live-pts-btn fg" onclick="window.pages.adjustLiveScore('${ev.id}', 1, 1, 'goal')" title="Add Goal">+1 Goal</button>
                    <button type="button" class="jais-live-pts-btn undo" onclick="window.pages.adjustLiveScore('${ev.id}', 1, -1, 'sub')" title="Subtract Goal">-1</button>
                  `}
                </div>
              </div>

              <div style="text-align: center; font-size: 0.75rem; font-weight: 800; color: var(--fm-text-muted); margin: 0.4rem 0;">VS</div>

              <!-- Team 2 -->
              <div style="margin-bottom: 0.75rem;">
                <label style="font-size: 0.72rem; color: var(--fm-text-secondary); font-weight: 700; margin-bottom: 2px; display: block;">Team 2</label>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <select id="score-team-2" class="jais-text-input" style="flex: 2;" onchange="window.pages.updateH2HTeamSelectors()">
                    ${houses.map(h => `<option value="${h.id}" ${team2Default === h.id ? 'selected' : ''}>${h.name}${isPrefect ? '' : ' House'}</option>`).join("")}
                  </select>
                  <input type="number" id="score-team-2-val" class="jais-text-input" placeholder="0" value="${escapeHtml(initScore2)}" style="flex: 1; text-align: center; font-weight: 800; font-size: 1.1rem;" />
                </div>
                <!-- Live Points Adder for Team 2 -->
                <div class="jais-live-pts-bar" style="margin-top: 6px;">
                  <span style="font-size: 0.68rem; font-weight: 800; color: var(--fm-text-secondary); margin-right: 4px;">Live Score:</span>
                  ${(ev.name || '').toLowerCase().includes('basketball') || ev.category === 'Basketball' ? `
                    <button type="button" class="jais-live-pts-btn ft" onclick="window.pages.adjustLiveScore('${ev.id}', 2, 1, 'ft')" title="Free Throw (+1)">+1 FT</button>
                    <button type="button" class="jais-live-pts-btn fg" onclick="window.pages.adjustLiveScore('${ev.id}', 2, 2, 'fg')" title="Field Goal (+2)">+2 FG</button>
                    <button type="button" class="jais-live-pts-btn three-pt" onclick="window.pages.adjustLiveScore('${ev.id}', 2, 3, '3pt')" title="Three Pointer (+3)">+3 3PT</button>
                    <button type="button" class="jais-live-pts-btn undo" onclick="window.pages.adjustLiveScore('${ev.id}', 2, -1, 'sub')" title="Subtract 1">-1</button>
                  ` : `
                    <button type="button" class="jais-live-pts-btn fg" onclick="window.pages.adjustLiveScore('${ev.id}', 2, 1, 'goal')" title="Add Goal">+1 Goal</button>
                    <button type="button" class="jais-live-pts-btn undo" onclick="window.pages.adjustLiveScore('${ev.id}', 2, -1, 'sub')" title="Subtract Goal">-1</button>
                  `}
                </div>
              </div>

              <div style="font-size: 0.72rem; color: var(--fm-text-muted); margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed var(--fm-border);">
                Live Point System: Winner receives <strong>+3 PTS</strong> &bull; Draw receives <strong>+1 PT</strong> &bull; Loss receives <strong>0 PTS</strong>
              </div>
            </div>

            <!-- Goal / Point Scorers Tracker (School Student Database) -->
            <div style="background: var(--fm-surface-elevated); padding: 0.85rem; border-radius: 10px; margin-bottom: 1rem; border: 1px solid var(--fm-border);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
                <span style="font-size: 0.78rem; font-weight: 800; color: var(--fm-text-primary);">
                  ${ev.category === 'Basketball' ? 'Point Scorers' : 'Goal Scorers (Search Student)'}
                </span>
                <span style="font-size: 0.7rem; color: var(--fm-green); font-weight: 700;">${currentScorers.length} recorded</span>
              </div>

              <!-- List of Recorded Scorers -->
              ${currentScorers.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.85rem;">
                  ${currentScorers.map((sc, scIdx) => {
                    const scHouse = houses.find(h => h.id === sc.houseId) || {};
                    return `
                      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 6px; padding: 0.45rem 0.65rem; font-size: 0.78rem;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span>•</span>
                          <strong style="color: var(--fm-text-primary);">${escapeHtml(sc.athlete)}</strong>
                          ${sc.minute ? `<span style="color: var(--fm-green); font-weight: 700; font-size: 0.72rem;">${escapeHtml(sc.minute)}</span>` : ''}
                          ${sc.assist ? `<span style="font-size: 0.68rem; color: var(--fm-text-secondary);">(ast: ${escapeHtml(sc.assist)})</span>` : ''}
                          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${scHouse.color || '#888'};" title="${scHouse.name || ''}"></span>
                          <span style="font-size: 0.68rem; color: var(--fm-text-secondary);">(${scHouse.name || sc.houseId})</span>
                        </div>
                        <button type="button" onclick="window.pages.removeScorerFromEvent(${scIdx}, '${ev.id}')" style="background: none; border: none; color: #EF4444; font-size: 1rem; cursor: pointer; padding: 2px 6px;">&times;</button>
                      </div>
                    `;
                  }).join("")}
                </div>
              ` : `
                <div style="font-size: 0.72rem; color: var(--fm-text-muted); margin-bottom: 0.75rem; font-style: italic;">
                  No individual scorers added yet. Select team and student below to assign goals!
                </div>
              `}

              <!-- Add Scorer From Student Database Box -->
              <div style="background: var(--fm-surface); border: 1px dashed var(--fm-border); border-radius: 8px; padding: 0.65rem;">
                <div style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 0.4rem;">
                  Add Player Goal &amp; Assist:
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                  <div style="display: flex; gap: 0.4rem;">
                    <select id="new-scorer-house" class="jais-text-input" style="flex: 1.2; font-size: 0.78rem;" onchange="window.pages.updateScorerStudentOptions()">
                      <option value="${team1Default}">${(houses.find(h=>h.id===team1Default)||{}).name || 'Team 1'}${isPrefect ? '' : ' House'}</option>
                      <option value="${team2Default}">${(houses.find(h=>h.id===team2Default)||{}).name || 'Team 2'}${isPrefect ? '' : ' House'}</option>
                    </select>
                    <input type="text" id="new-scorer-minute" class="jais-text-input" placeholder="Min (e.g. 24')" style="flex: 0.8; font-size: 0.78rem; text-align: center;" />
                  </div>

                  <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                    <input type="text" id="new-scorer-name" class="jais-text-input" list="scorer-students-datalist" placeholder="Goal Scorer (Student)..." style="flex: 1.2; min-width: 140px; font-size: 0.8rem;" />
                    <input type="text" id="new-scorer-assist" class="jais-text-input" list="scorer-students-datalist" placeholder="Assist by (Optional)..." style="flex: 1; min-width: 120px; font-size: 0.8rem;" />
                    <datalist id="scorer-students-datalist">
                      ${students.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${escapeHtml(s.grade || '')} • ${escapeHtml(s.gender || '')})</option>`).join("")}
                    </datalist>
                    <button type="button" onclick="window.pages.addScorerToEvent('${ev.id}')" style="background: var(--fm-green); color: #000; border: none; border-radius: 6px; font-weight: 800; font-size: 0.76rem; padding: 0.4rem 0.85rem; cursor: pointer; flex-shrink: 0;">
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ` : `
            <!-- 4-House All-Comers Placement Entry Form (100m, 200m, Field, Novelty) -->
            <div style="font-size: 0.78rem; font-weight: 800; color: var(--fm-text-primary); margin-bottom: 0.65rem;">
              ${isPrefect ? '4-Team Finishing Positions & Athletes (Searchable from Database)' : '4-House Finishing Positions & Athletes (Searchable from Database)'}
            </div>

            <!-- 1st Place -->
            <div style="margin-bottom: 0.85rem; background: rgba(234, 179, 8, 0.05); padding: 0.65rem; border-radius: 8px; border: 1px solid rgba(234, 179, 8, 0.2);">
              <label style="font-size: 0.75rem; font-weight: 800; color: var(--fm-gold); display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="display: flex; align-items: center; gap: 4px;">${ICONS.goldMedal} 1st Place (Gold Winner)</span>
                <span style="font-weight: 800; color: var(--fm-gold);">GOLD</span>
              </label>
              <div style="display: flex; gap: 0.5rem;">
                <select id="score-house-1" class="jais-text-input" style="flex: 1.1;" onchange="window.pages.updateHouseDatalist(1)">
                  ${houses.map(h => `<option value="${h.id}" ${(ev.results?.first?.houseId || 'phoenix') === h.id ? 'selected' : ''}>${h.name}</option>`).join("")}
                </select>
                <input type="text" id="score-athlete-1" class="jais-text-input" list="students-datalist-1" placeholder="Search any student..." value="${escapeHtml(ev.results?.first?.athlete || '')}" style="flex: 1.2;" />
                <datalist id="students-datalist-1">
                  ${students.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${escapeHtml(s.grade || '')} • General Pool)</option>`).join("")}
                </datalist>
                <input type="text" id="score-time-1" class="jais-text-input" placeholder="10.82s" value="${escapeHtml(ev.results?.first?.score || '')}" style="width: 85px; text-align: center;" />
              </div>
            </div>

            <!-- 2nd Place -->
            <div style="margin-bottom: 0.85rem; background: rgba(148, 163, 184, 0.05); padding: 0.65rem; border-radius: 8px; border: 1px solid rgba(148, 163, 184, 0.2);">
              <label style="font-size: 0.75rem; font-weight: 800; color: var(--fm-silver); display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="display: flex; align-items: center; gap: 4px;">${ICONS.silverMedal} 2nd Place (Silver)</span>
                <span style="font-weight: 800; color: var(--fm-silver);">SILVER</span>
              </label>
              <div style="display: flex; gap: 0.5rem;">
                <select id="score-house-2" class="jais-text-input" style="flex: 1.1;" onchange="window.pages.updateHouseDatalist(2)">
                  ${houses.map(h => `<option value="${h.id}" ${(ev.results?.second?.houseId || 'eagle') === h.id ? 'selected' : ''}>${h.name}</option>`).join("")}
                </select>
                <input type="text" id="score-athlete-2" class="jais-text-input" list="students-datalist-2" placeholder="Search any student..." value="${escapeHtml(ev.results?.second?.athlete || '')}" style="flex: 1.2;" />
                <datalist id="students-datalist-2">
                  ${students.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${escapeHtml(s.grade || '')} • General Pool)</option>`).join("")}
                </datalist>
                <input type="text" id="score-time-2" class="jais-text-input" placeholder="11.04s" value="${escapeHtml(ev.results?.second?.score || '')}" style="width: 85px; text-align: center;" />
              </div>
            </div>

            <!-- 3rd Place -->
            <div style="margin-bottom: 0.85rem; background: rgba(217, 119, 6, 0.05); padding: 0.65rem; border-radius: 8px; border: 1px solid rgba(217, 119, 6, 0.2);">
              <label style="font-size: 0.75rem; font-weight: 800; color: var(--fm-bronze); display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="display: flex; align-items: center; gap: 4px;">${ICONS.bronzeMedal} 3rd Place (Bronze)</span>
                <span style="font-weight: 800; color: var(--fm-bronze);">BRONZE</span>
              </label>
              <div style="display: flex; gap: 0.5rem;">
                <select id="score-house-3" class="jais-text-input" style="flex: 1.1;" onchange="window.pages.updateHouseDatalist(3)">
                  ${houses.map(h => `<option value="${h.id}" ${(ev.results?.third?.houseId || 'swift') === h.id ? 'selected' : ''}>${h.name}</option>`).join("")}
                </select>
                <input type="text" id="score-athlete-3" class="jais-text-input" list="students-datalist-3" placeholder="Search any student..." value="${escapeHtml(ev.results?.third?.athlete || '')}" style="flex: 1.2;" />
                <datalist id="students-datalist-3">
                  ${students.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${escapeHtml(s.grade || '')} • General Pool)</option>`).join("")}
                </datalist>
                <input type="text" id="score-time-3" class="jais-text-input" placeholder="11.20s" value="${escapeHtml(ev.results?.third?.score || '')}" style="width: 85px; text-align: center;" />
              </div>
            </div>

            <!-- 4th Place -->
            <div style="margin-bottom: 1.25rem; background: rgba(100, 116, 139, 0.05); padding: 0.65rem; border-radius: 8px; border: 1px solid rgba(100, 116, 139, 0.2);">
              <label style="font-size: 0.75rem; font-weight: 800; color: #94A3B8; display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="display: flex; align-items: center; gap: 4px;">${ICONS.fourthMedal} 4th Place</span>
                <span style="font-weight: 800; color: #94A3B8;">4TH</span>
              </label>
              <div style="display: flex; gap: 0.5rem;">
                <select id="score-house-4" class="jais-text-input" style="flex: 1.1;" onchange="window.pages.updateHouseDatalist(4)">
                  ${houses.map(h => `<option value="${h.id}" ${(ev.results?.fourth?.houseId || 'merlin') === h.id ? 'selected' : ''}>${h.name}</option>`).join("")}
                </select>
                <input type="text" id="score-athlete-4" class="jais-text-input" list="students-datalist-4" placeholder="Search any student..." value="${escapeHtml(ev.results?.fourth?.athlete || '')}" style="flex: 1.2;" />
                <datalist id="students-datalist-4">
                  ${students.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${escapeHtml(s.grade || '')} • General Pool)</option>`).join("")}
                </datalist>
                <input type="text" id="score-time-4" class="jais-text-input" placeholder="11.45s" value="${escapeHtml(ev.results?.fourth?.score || '')}" style="width: 85px; text-align: center;" />
              </div>
            </div>
          `}

          <!-- Notes / Rules -->
          <div style="margin-bottom: 1rem;">
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">Official Marshal Summary / Note (Optional)</label>
            <input type="text" id="score-event-notes" class="jais-text-input" placeholder="e.g. New school record set; clear conditions." value="${escapeHtml(ev.notes || '')}" style="width: 100%;" />
          </div>

          <button type="submit" class="jais-cta-btn" style="width: 100%; margin: 0; padding: 0.85rem;">
            Publish Results Live &bull; Broadcast Standings
          </button>
        </form>
      </div>
    </div>
  `;
}

export async function handleScoreSubmission(event, eventId, isH2H) {
  event.preventDefault();
  if (!isUserAdmin()) { alert("Official access required."); return; }
  const { events, houses } = getCachedData();
  const ev = events.find(e => e.id === eventId) || {};
  const matrix = ev.pointsMatrix || { first: 100, second: 60, third: 40, fourth: 20 };
  const status = document.getElementById("score-event-status")?.value || "completed";
  const notes = document.getElementById("score-event-notes")?.value || "";

  let placings = {};
  let contenders = null;

  if (isH2H) {
    const t1 = document.getElementById("score-team-1")?.value || "phoenix";
    const v1 = document.getElementById("score-team-1-val")?.value || "0";
    const t2 = document.getElementById("score-team-2")?.value || "eagle";
    const v2 = document.getElementById("score-team-2-val")?.value || "0";

    if (t1 === t2) {
      alert("Error: Team 1 and Team 2 must be different " + (isPrefectorialCup() ? "teams!" : "houses!"));
      return;
    }

    contenders = [t1, t2];
    const house1 = houses.find(h => h.id === t1) || { name: t1 };
    const house2 = houses.find(h => h.id === t2) || { name: t2 };

    const n1 = Number(v1) || 0;
    const n2 = Number(v2) || 0;
    const isDraw = n1 === n2;
    const winnerId = n1 >= n2 ? t1 : t2;
    const loserId = winnerId === t1 ? t2 : t1;
    const winnerName = winnerId === t1 ? house1.name : house2.name;
    const loserName = loserId === t1 ? house1.name : house2.name;
    const winScore = winnerId === t1 ? n1 : n2;
    const loseScore = winnerId === t1 ? n2 : n1;

    // Score string is always written winner-first ("3 - 1"), matching adjustLiveScore()
    // and what every reader of results.first.score expects.
    placings = {
      first: { houseId: winnerId, athlete: `${winnerName} Squad`, score: `${winScore} - ${loseScore}`, points: isDraw ? 1 : 3 },
      second: { houseId: loserId, athlete: `${loserName} Squad`, score: `${loseScore}`, points: isDraw ? 1 : 0 },
      third: { houseId: "", points: 0 },
      fourth: { houseId: "", points: 0 },
      summary: isDraw ? `Draw (${n1}-${n2}) • 1 Match Point each` : `${winnerName} defeated ${loserName} (${winScore}-${loseScore}) • +3 Match Points`,
      isDraw,
      scorers: window.currentEventScorers || []
    };
  } else {
    const h1 = document.getElementById("score-house-1")?.value;
    const a1 = document.getElementById("score-athlete-1")?.value;
    const t1 = document.getElementById("score-time-1")?.value || "";

    const h2 = document.getElementById("score-house-2")?.value;
    const a2 = document.getElementById("score-athlete-2")?.value;
    const t2 = document.getElementById("score-time-2")?.value || "";

    const h3 = document.getElementById("score-house-3")?.value;
    const a3 = document.getElementById("score-athlete-3")?.value;
    const t3 = document.getElementById("score-time-3")?.value || "";

    const h4 = document.getElementById("score-house-4")?.value;
    const a4 = document.getElementById("score-athlete-4")?.value;
    const t4 = document.getElementById("score-time-4")?.value || "";

    // Every placing must be a different house (a house can't finish twice in one race)
    const selectedHouses = [h1, h2, h3, h4].filter(Boolean);
    const uniqueHouses = new Set(selectedHouses);
    if (uniqueHouses.size < selectedHouses.length) {
      alert(isPrefectorialCup() ? "Each team can only appear once. Please assign four different teams to 1st, 2nd, 3rd and 4th place." : "Each house can only appear once. Please assign four different houses to 1st, 2nd, 3rd and 4th place.");
      return;
    }

    const isBall = isBallSportEvent(ev);
    placings = {
      first: { houseId: h1, athlete: a1, score: t1, points: isBall ? (matrix.first ?? 3) : null },
      second: { houseId: h2, athlete: a2, score: t2, points: isBall ? (matrix.second ?? 1) : null },
      third: { houseId: h3, athlete: a3, score: t3, points: isBall ? (matrix.third ?? 0) : null },
      fourth: { houseId: h4, athlete: a4, score: t4, points: isBall ? (matrix.fourth ?? 0) : null }
    };
  }


  try {
    await submitEventScore(eventId, placings, status, notes, contenders);
    if (window.currentEventsCache) {
      const idx = window.currentEventsCache.findIndex(e => e.id === eventId);
      if (idx >= 0) {
        window.currentEventsCache[idx] = {
          ...window.currentEventsCache[idx],
          status,
          results: placings,
          notes,
          contenders: contenders || window.currentEventsCache[idx].contenders,
          isLive: status === "live"
        };
      }
    }
    if (window.currentPrefEventsCache) {
      const idx = window.currentPrefEventsCache.findIndex(e => e.id === eventId);
      if (idx >= 0) {
        window.currentPrefEventsCache[idx] = {
          ...window.currentPrefEventsCache[idx],
          status,
          results: placings,
          notes,
          contenders: contenders || window.currentPrefEventsCache[idx].contenders,
          isLive: status === "live"
        };
      }
    }
    playWhistleSound();
    playScoreCelebration();
    alert(status === "live" ? "Event is now LIVE! It is pinned at the top of fixtures without scheduled time." : "Event marked as DONE! Official results published to all viewers.");
    router.navigate(`#/event/${eventId}`);
  } catch (err) {
    alert("Error publishing score: " + err.message);
  }
}

export async function triggerDemoSeeder() {
  if (!isUserAdmin()) { alert("Official access required."); return; }
  playTapSound();
  await seedDemoScores();
  playScoreCelebration();
  alert("Sample demo scores populated!");
  renderAdminPage();
}

export async function triggerResetScores() {
  if (!isUserAdmin()) { alert("Official access required."); return; }
  playTapSound();
  const compName = isPrefectorialCup() ? "Prefectship Cup" : "Inter-House Sports";
  if (confirm(`Reset all event scores to zero for ${compName}?`)) {
    await resetAllSportsDayScores();
    playTapSound();
    alert(`${compName} championship reset to clean zero slate!`);
    renderAdminPage();
  }
}

/* ==========================================================================
   SCORER TRACKING & STUDENT PICKER HELPERS
   ========================================================================== */
export function addScorerToEvent(eventId) {
  playTapSound();
  const houseId = document.getElementById("new-scorer-house")?.value;
  const athlete = document.getElementById("new-scorer-name")?.value?.trim();
  const assist = document.getElementById("new-scorer-assist")?.value?.trim();
  const minute = document.getElementById("new-scorer-minute")?.value?.trim();

  if (!athlete) {
    alert("Please enter or select a student player name.");
    return;
  }

  if (!window.currentEventScorers) {
    window.currentEventScorers = [];
  }

  window.currentEventScorers.push({
    houseId: houseId || "phoenix",
    athlete: athlete,
    assist: assist || "",
    minute: minute || ""
  });

  renderScoreEntryPage({ id: eventId });
}

export function removeScorerFromEvent(idx, eventId) {
  playTapSound();
  if (window.currentEventScorers && window.currentEventScorers[idx]) {
    window.currentEventScorers.splice(idx, 1);
    renderScoreEntryPage({ id: eventId });
  }
}

export function updateScorerStudentOptions() {
  const datalist = document.getElementById("scorer-students-datalist");
  if (!datalist) return;

  const { students } = getCachedData();
  datalist.innerHTML = students.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${escapeHtml(s.grade || '')} • ${escapeHtml(s.gender || '')})</option>`).join("");
}

export function updateH2HTeamSelectors() {
  const t1 = document.getElementById("score-team-1")?.value;
  const t2 = document.getElementById("score-team-2")?.value;
  const scorerHouseSelect = document.getElementById("new-scorer-house");
  if (!scorerHouseSelect) return;

  const { houses } = getCachedData();
  const h1 = houses.find(h => h.id === t1) || { name: t1 };
  const h2 = houses.find(h => h.id === t2) || { name: t2 };

  scorerHouseSelect.innerHTML = `
    <option value="${t1}">${escapeHtml(h1.name)} House</option>
    <option value="${t2}">${escapeHtml(h2.name)} House</option>
  `;
  updateScorerStudentOptions();
}

export function updateHouseDatalist(pos) {
  const datalist = document.getElementById(`students-datalist-${pos}`);
  if (!datalist) return;

  const { students } = getCachedData();
  datalist.innerHTML = students.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${escapeHtml(s.grade || '')} • General Pool)</option>`).join("");
}

/* ==========================================================================
   SCREEN: SCHOOL STUDENT DATABASE (#/admin/students)
   Admin can view, search, filter, add, and manage students across the school
   ========================================================================== */
export function setStudentsGradeFilter(grade) {
  playTapSound();
  studentsGradeFilter = grade;
  renderStudentsPage();
}

export function setStudentsGenderFilter(gender) {
  playTapSound();
  studentsGenderFilter = gender;
  renderStudentsPage();
}

export function setStudentsHouseFilter(houseId) {
  playTapSound();
  studentsHouseFilter = houseId;
  renderStudentsPage();
}

export function handleStudentSearch(val) {
  studentsSearchQuery = val;
  renderStudentsPage();
  const inp = document.getElementById("student-search-input");
  if (inp) {
    inp.focus();
    inp.selectionStart = inp.selectionEnd = inp.value.length;
  }
}

let showBulkAddStudentForm = false;
let editingStudentId = null;

// Modal & House Selector States
let batchTransferSourceFilter = "all";
let batchTransferSelectedIds = new Set();
let batchTransferTargetHouse = "phoenix";

export function selectModalHouse(houseId, prefix = "modal-student") {
  playTapSound();
  const hiddenInput = document.getElementById(`${prefix}-house`);
  if (hiddenInput) hiddenInput.value = houseId;
  const container = document.getElementById(`${prefix}-house-grid`);
  if (container) {
    container.querySelectorAll(".jais-house-choice-btn").forEach(btn => {
      if (btn.dataset.house === houseId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }
}

export function openAddStudentModal() {
  playTapSound();
  document.getElementById("jais-add-student-modal")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "jais-modal-backdrop";
  overlay.id = "jais-add-student-modal";

  overlay.innerHTML = `
    <div class="jais-media-modal-card" style="max-width: 480px;">
      <div class="jais-media-modal-header">
        <div style="font-weight: 800; font-size: 0.95rem; color: var(--fm-text-primary); display: flex; align-items: center; gap: 6px;">
          <span style="color: var(--fm-green); font-size: 1.1rem;">🏃</span>
          <span>Register Student into School Database</span>
        </div>
        <button class="jais-modal-close-btn" onclick="document.getElementById('jais-add-student-modal')?.remove()">&times;</button>
      </div>

      <div style="padding: 1.1rem;">
        <form onsubmit="window.pages.handleSaveModalStudent(event)" style="display: flex; flex-direction: column; gap: 0.85rem;">
          <div>
            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 3px;">
              Student Full Name *
            </label>
            <input type="text" id="modal-student-name" class="jais-text-input" placeholder="e.g. Chinedu Ihejiahi" required
                   style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.6rem 0.75rem; color: var(--fm-text-primary); font-size: 0.88rem;" />
          </div>

          <div>
            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 5px;">
              Select House Assignment *
            </label>
            <input type="hidden" id="modal-student-house" value="general" />
            <div id="modal-student-house-grid" class="jais-house-select-grid">
              <div class="jais-house-choice-btn house-phoenix" data-house="phoenix" onclick="window.pages.selectModalHouse('phoenix', 'modal-student')">
                <img src="assets/crests/phoenix.svg" alt="" class="jais-house-choice-crest" onerror="this.src='assets/juilliard-logo.png'" />
                <span class="jais-house-choice-name">Phoenix</span>
                <span class="jais-house-choice-sub">Red</span>
              </div>
              <div class="jais-house-choice-btn house-eagle" data-house="eagle" onclick="window.pages.selectModalHouse('eagle', 'modal-student')">
                <img src="assets/crests/eagle.svg" alt="" class="jais-house-choice-crest" onerror="this.src='assets/juilliard-logo.png'" />
                <span class="jais-house-choice-name">Eagle</span>
                <span class="jais-house-choice-sub">Yellow</span>
              </div>
              <div class="jais-house-choice-btn house-swift" data-house="swift" onclick="window.pages.selectModalHouse('swift', 'modal-student')">
                <img src="assets/crests/swift.svg" alt="" class="jais-house-choice-crest" onerror="this.src='assets/juilliard-logo.png'" />
                <span class="jais-house-choice-name">Swift</span>
                <span class="jais-house-choice-sub">Blue</span>
              </div>
              <div class="jais-house-choice-btn house-merlin" data-house="merlin" onclick="window.pages.selectModalHouse('merlin', 'modal-student')">
                <img src="assets/crests/merlin.svg" alt="" class="jais-house-choice-crest" onerror="this.src='assets/juilliard-logo.png'" />
                <span class="jais-house-choice-name">Merlin</span>
                <span class="jais-house-choice-sub">Green</span>
              </div>
              <div class="jais-house-choice-btn house-general active" data-house="general" onclick="window.pages.selectModalHouse('general', 'modal-student')">
                <span style="font-size: 1.5rem; line-height: 28px;">🏫</span>
                <span class="jais-house-choice-name">General Pool</span>
                <span class="jais-house-choice-sub">Unassigned</span>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem;">
            <div>
              <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 3px;">
                Class / Grade *
              </label>
              <select id="modal-student-grade" class="jais-text-input" style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.6rem; color: var(--fm-text-primary); font-size: 0.85rem;">
                <option value="JSS 1">JSS 1</option>
                <option value="JSS 2">JSS 2</option>
                <option value="JSS 3">JSS 3</option>
                <option value="SS 1" selected>SS 1</option>
                <option value="SS 2">SS 2</option>
                <option value="SS 3">SS 3</option>
              </select>
            </div>
            <div>
              <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 3px;">
                Gender *
              </label>
              <select id="modal-student-gender" class="jais-text-input" style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.6rem; color: var(--fm-text-primary); font-size: 0.85rem;">
                <option value="Boys" selected>Boys</option>
                <option value="Girls">Girls</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem;">
            <button type="button" onclick="document.getElementById('jais-add-student-modal')?.remove()" style="padding: 0.65rem 1.1rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 8px; font-size: 0.82rem; font-weight: 700; color: var(--fm-text-secondary); cursor: pointer;">
              Cancel
            </button>
            <button type="submit" class="jais-cta-btn" style="margin: 0; padding: 0.65rem 1.4rem; font-size: 0.85rem; font-weight: 800; background: var(--fm-green); color: #000; border-radius: 8px;">
              Save Student
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById("modal-student-name")?.focus(), 50);
}

export async function handleSaveModalStudent(event) {
  event.preventDefault();
  playTapSound();
  const name = document.getElementById("modal-student-name")?.value?.trim();
  const houseId = document.getElementById("modal-student-house")?.value || "general";
  const grade = document.getElementById("modal-student-grade")?.value || "SS 1";
  const gender = document.getElementById("modal-student-gender")?.value || "Boys";

  if (!name) {
    showToastNotification("Please enter student name.", "warning");
    return;
  }

  try {
    const res = await addStudent({ name, houseId, grade, gender });
    if (res.success) {
      playScoreCelebration();
      document.getElementById("jais-add-student-modal")?.remove();
      showToastNotification(`Student "${name}" added to school database!`, "success");
      if (window.currentStudentsCache) {
        window.currentStudentsCache.push({ id: res.id || `stu_${Date.now()}`, name, houseId, grade, gender });
      }
      if (window.location.hash.includes("/admin/students")) {
        renderStudentsPage();
      } else if (window.location.hash.includes("/admin")) {
        renderAdminPage();
      }
    } else {
      showToastNotification("Error: " + (res.error || "Failed to add student"), "error");
    }
  } catch (err) {
    showToastNotification("Error: " + err.message, "error");
  }
}

export async function quickChangeStudentHouse(studentId, newHouseId) {
  playTapSound();
  const { students, houses } = getCachedData();
  const student = students.find(s => s.id === studentId);
  const studentName = student ? student.name : "Student";
  const targetHouse = houses.find(h => (h.id || "").toLowerCase() === (newHouseId || "").toLowerCase());
  const houseName = targetHouse ? targetHouse.name : (newHouseId === "general" ? "General Pool" : newHouseId);

  try {
    const res = await updateStudent(studentId, { houseId: newHouseId });
    if (res.success) {
      playScoreCelebration();
      showToastNotification(`${studentName} transferred to ${houseName}!`, "success");
      if (window.currentStudentsCache) {
        const item = window.currentStudentsCache.find(s => s.id === studentId);
        if (item) item.houseId = newHouseId;
      }
      renderStudentsPage();
    } else {
      showToastNotification("Error: " + (res.error || "Failed to update house"), "error");
    }
  } catch (err) {
    showToastNotification("Error: " + err.message, "error");
  }
}

export function openBatchTransferModal() {
  playTapSound();
  document.getElementById("jais-batch-transfer-modal")?.remove();
  batchTransferSelectedIds.clear();
  batchTransferSourceFilter = "all";
  batchTransferTargetHouse = "phoenix";
  renderBatchTransferModalContent();
}

export function renderBatchTransferModalContent() {
  const { students, houses } = getCachedData();
  let modal = document.getElementById("jais-batch-transfer-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "jais-modal-backdrop";
    modal.id = "jais-batch-transfer-modal";
    document.body.appendChild(modal);
  }

  let filtered = students;
  if (batchTransferSourceFilter !== "all") {
    filtered = filtered.filter(s => (s.houseId || "general").toLowerCase() === batchTransferSourceFilter.toLowerCase());
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every(s => batchTransferSelectedIds.has(s.id));

  modal.innerHTML = `
    <div class="jais-media-modal-card" style="max-width: 520px; max-height: 90vh; display: flex; flex-direction: column;">
      <div class="jais-media-modal-header" style="flex-shrink: 0;">
        <div style="font-weight: 800; font-size: 0.95rem; color: var(--fm-text-primary); display: flex; align-items: center; gap: 6px;">
          <span style="color: #F59E0B; font-size: 1.1rem;">🔄</span>
          <span>Batch House Transfer &amp; Reassignment</span>
        </div>
        <button class="jais-modal-close-btn" onclick="document.getElementById('jais-batch-transfer-modal')?.remove()">&times;</button>
      </div>

      <div style="padding: 1rem; overflow-y: auto; flex: 1;">
        <div style="margin-bottom: 0.85rem;">
          <label style="display: block; font-size: 0.72rem; font-weight: 800; color: var(--fm-text-secondary); text-transform: uppercase; margin-bottom: 4px;">
            1. Filter by Current House
          </label>
          <select id="batch-source-house" class="jais-text-input" onchange="window.pages.setBatchSourceFilter(this.value)" style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.55rem; color: var(--fm-text-primary); font-size: 0.85rem;">
            <option value="all" ${batchTransferSourceFilter === 'all' ? 'selected' : ''}>All Houses (${students.length} students)</option>
            <option value="general" ${batchTransferSourceFilter === 'general' ? 'selected' : ''}>General Pool (${students.filter(s => (s.houseId||'general')==='general').length})</option>
            <option value="phoenix" ${batchTransferSourceFilter === 'phoenix' ? 'selected' : ''}>Phoenix Red (${students.filter(s => s.houseId==='phoenix').length})</option>
            <option value="eagle" ${batchTransferSourceFilter === 'eagle' ? 'selected' : ''}>Eagle Yellow (${students.filter(s => s.houseId==='eagle').length})</option>
            <option value="swift" ${batchTransferSourceFilter === 'swift' ? 'selected' : ''}>Swift Blue (${students.filter(s => s.houseId==='swift').length})</option>
            <option value="merlin" ${batchTransferSourceFilter === 'merlin' ? 'selected' : ''}>Merlin Green (${students.filter(s => s.houseId==='merlin').length})</option>
          </select>
        </div>

        <div style="margin-bottom: 0.85rem;">
          <label style="display: block; font-size: 0.72rem; font-weight: 800; color: var(--fm-text-secondary); text-transform: uppercase; margin-bottom: 4px;">
            2. Choose New Destination House
          </label>
          <input type="hidden" id="batch-target-house" value="${batchTransferTargetHouse}" />
          <div id="batch-target-house-grid" class="jais-house-select-grid" style="margin-bottom: 0;">
            <div class="jais-house-choice-btn house-phoenix ${batchTransferTargetHouse === 'phoenix' ? 'active' : ''}" data-house="phoenix" onclick="window.pages.setBatchTargetHouse('phoenix')">
              <img src="assets/crests/phoenix.svg" alt="" class="jais-house-choice-crest" onerror="this.src='assets/juilliard-logo.png'" />
              <span class="jais-house-choice-name">Phoenix</span>
              <span class="jais-house-choice-sub">Red</span>
            </div>
            <div class="jais-house-choice-btn house-eagle ${batchTransferTargetHouse === 'eagle' ? 'active' : ''}" data-house="eagle" onclick="window.pages.setBatchTargetHouse('eagle')">
              <img src="assets/crests/eagle.svg" alt="" class="jais-house-choice-crest" onerror="this.src='assets/juilliard-logo.png'" />
              <span class="jais-house-choice-name">Eagle</span>
              <span class="jais-house-choice-sub">Yellow</span>
            </div>
            <div class="jais-house-choice-btn house-swift ${batchTransferTargetHouse === 'swift' ? 'active' : ''}" data-house="swift" onclick="window.pages.setBatchTargetHouse('swift')">
              <img src="assets/crests/swift.svg" alt="" class="jais-house-choice-crest" onerror="this.src='assets/juilliard-logo.png'" />
              <span class="jais-house-choice-name">Swift</span>
              <span class="jais-house-choice-sub">Blue</span>
            </div>
            <div class="jais-house-choice-btn house-merlin ${batchTransferTargetHouse === 'merlin' ? 'active' : ''}" data-house="merlin" onclick="window.pages.setBatchTargetHouse('merlin')">
              <img src="assets/crests/merlin.svg" alt="" class="jais-house-choice-crest" onerror="this.src='assets/juilliard-logo.png'" />
              <span class="jais-house-choice-name">Merlin</span>
              <span class="jais-house-choice-sub">Green</span>
            </div>
            <div class="jais-house-choice-btn house-general ${batchTransferTargetHouse === 'general' ? 'active' : ''}" data-house="general" onclick="window.pages.setBatchTargetHouse('general')">
              <span style="font-size: 1.5rem; line-height: 28px;">🏫</span>
              <span class="jais-house-choice-name">General</span>
              <span class="jais-house-choice-sub">Pool</span>
            </div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: 0.72rem; font-weight: 800; color: var(--fm-text-secondary); text-transform: uppercase;">
              3. Select Students (${batchTransferSelectedIds.size} selected)
            </label>
            <button type="button" onclick="window.pages.toggleBatchSelectAll()" style="background: none; border: none; color: var(--fm-green); font-size: 0.72rem; font-weight: 700; cursor: pointer;">
              ${allFilteredSelected ? 'Deselect All' : 'Select All (' + filtered.length + ')'}
            </button>
          </div>

          <div style="max-height: 180px; overflow-y: auto; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.35rem;">
            ${filtered.length > 0 ? filtered.map(s => {
              const checked = batchTransferSelectedIds.has(s.id);
              const curH = houses.find(h => (h.id||'').toLowerCase() === (s.houseId||'').toLowerCase());
              return `
                <label style="display: flex; align-items: center; gap: 8px; padding: 0.35rem 0.5rem; border-radius: 6px; cursor: pointer; transition: background 0.15s ease; ${checked ? 'background: rgba(0, 230, 118, 0.08);' : ''}">
                  <input type="checkbox" ${checked ? 'checked' : ''} onchange="window.pages.toggleBatchStudentSelect('${s.id}', this.checked)" style="accent-color: var(--fm-green); width: 15px; height: 15px; cursor: pointer;" />
                  <div style="flex: 1; min-width: 0; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--fm-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(s.name)}</span>
                    <span style="font-size: 0.68rem; color: ${curH ? curH.color : 'var(--fm-text-muted)'}; font-weight: 700;">${curH ? curH.name : 'General'} &bull; ${escapeHtml(s.grade||'')}</span>
                  </div>
                </label>
              `;
            }).join('') : `
              <div style="padding: 1rem; text-align: center; color: var(--fm-text-muted); font-size: 0.75rem;">No students in this house.</div>
            `}
          </div>
        </div>
      </div>

      <div style="padding: 0.85rem 1rem; border-top: 1px solid var(--fm-border); display: flex; justify-content: flex-end; gap: 0.5rem; flex-shrink: 0; background: var(--fm-surface);">
        <button type="button" onclick="document.getElementById('jais-batch-transfer-modal')?.remove()" style="padding: 0.6rem 1rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 8px; font-size: 0.8rem; font-weight: 700; color: var(--fm-text-secondary); cursor: pointer;">
          Cancel
        </button>
        <button type="button" onclick="window.pages.executeBatchTransfer()" class="jais-cta-btn" style="margin: 0; padding: 0.6rem 1.3rem; font-size: 0.82rem; font-weight: 800; background: var(--fm-green); color: #000; border-radius: 8px;">
          Transfer Selected (${batchTransferSelectedIds.size}) Students &rarr;
        </button>
      </div>
    </div>
  `;
}

export function setBatchSourceFilter(val) {
  playTapSound();
  batchTransferSourceFilter = val;
  renderBatchTransferModalContent();
}

export function setBatchTargetHouse(houseId) {
  playTapSound();
  batchTransferTargetHouse = houseId;
  const input = document.getElementById("batch-target-house");
  if (input) input.value = houseId;
  const container = document.getElementById("batch-target-house-grid");
  if (container) {
    container.querySelectorAll(".jais-house-choice-btn").forEach(btn => {
      if (btn.dataset.house === houseId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }
}

export function toggleBatchStudentSelect(studentId, isChecked) {
  if (isChecked) {
    batchTransferSelectedIds.add(studentId);
  } else {
    batchTransferSelectedIds.delete(studentId);
  }
  renderBatchTransferModalContent();
}

export function toggleBatchSelectAll() {
  playTapSound();
  const { students } = getCachedData();
  let filtered = students;
  if (batchTransferSourceFilter !== "all") {
    filtered = filtered.filter(s => (s.houseId || "general").toLowerCase() === batchTransferSourceFilter.toLowerCase());
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every(s => batchTransferSelectedIds.has(s.id));
  if (allFilteredSelected) {
    filtered.forEach(s => batchTransferSelectedIds.delete(s.id));
  } else {
    filtered.forEach(s => batchTransferSelectedIds.add(s.id));
  }
  renderBatchTransferModalContent();
}

export async function executeBatchTransfer() {
  playTapSound();
  if (batchTransferSelectedIds.size === 0) {
    showToastNotification("Please select at least one student to transfer.", "warning");
    return;
  }
  const studentIds = Array.from(batchTransferSelectedIds);
  const targetHouse = batchTransferTargetHouse;
  const { houses } = getCachedData();
  const houseObj = houses.find(h => (h.id||'').toLowerCase() === targetHouse.toLowerCase());
  const houseLabel = houseObj ? houseObj.name : (targetHouse === 'general' ? 'General Pool' : targetHouse);

  try {
    const res = await batchUpdateStudentsHouse(studentIds, targetHouse);
    if (res.success) {
      playScoreCelebration();
      document.getElementById("jais-batch-transfer-modal")?.remove();
      showToastNotification(`Transferred ${res.count || studentIds.length} students to ${houseLabel}!`, "success");
      if (window.currentStudentsCache) {
        studentIds.forEach(id => {
          const stu = window.currentStudentsCache.find(s => s.id === id);
          if (stu) stu.houseId = targetHouse;
        });
      }
      if (window.location.hash.includes("/admin/students")) {
        renderStudentsPage();
      } else if (window.location.hash.includes("/admin")) {
        renderAdminPage();
      }
    } else {
      showToastNotification("Error: " + (res.error || "Batch transfer failed"), "error");
    }
  } catch (err) {
    showToastNotification("Error: " + err.message, "error");
  }
}

export function toggleAddStudentForm() {
  playTapSound();
  showAddStudentForm = !showAddStudentForm;
  if (showAddStudentForm) showBulkAddStudentForm = false;
  renderStudentsPage();
  if (showAddStudentForm) {
    setTimeout(() => {
      document.getElementById("new-student-name")?.focus();
    }, 50);
  }
}

export function toggleBulkAddStudentForm() {
  playTapSound();
  showBulkAddStudentForm = !showBulkAddStudentForm;
  if (showBulkAddStudentForm) showAddStudentForm = false;
  renderStudentsPage();
  if (showBulkAddStudentForm) {
    setTimeout(() => {
      document.getElementById("bulk-students-names")?.focus();
    }, 50);
  }
}

export async function handleAddStudent(event) {
  event.preventDefault();
  playTapSound();

  const name = document.getElementById("new-student-name")?.value?.trim();
  const houseId = document.getElementById("new-student-house")?.value || "general";
  const grade = document.getElementById("new-student-grade")?.value || "SS 1";
  const gender = document.getElementById("new-student-gender")?.value || "Boys";

  if (!name) {
    alert("Please enter the student's full name.");
    return;
  }

  try {
    const res = await addStudent({
      name,
      houseId: houseId || "general",
      gender: gender || "Boys",
      grade: grade || "SS 1"
    });

    if (res.success) {
      playScoreCelebration();
      showAddStudentForm = false;
      alert(`Student "${name}" added to school database!`);
      renderStudentsPage();
    } else {
      alert("Error adding student: " + (res.error || "Unknown error"));
    }
  } catch (err) {
    alert("Error adding student: " + err.message);
  }
}

export async function handleBulkAddStudents(event) {
  event.preventDefault();
  playTapSound();

  const rawNames = document.getElementById("bulk-students-names")?.value || "";
  const houseId = document.getElementById("bulk-student-house")?.value || "general";
  const grade = document.getElementById("bulk-student-grade")?.value || "SS 1";
  const gender = document.getElementById("bulk-student-gender")?.value || "Boys";

  const names = rawNames
    .split(/[\r\n,]+/)
    .map(n => n.trim())
    .filter(n => n.length > 0);

  if (names.length === 0) {
    alert("Please enter or paste at least one student name.");
    return;
  }

  const list = names.map(n => ({
    name: n,
    houseId,
    grade,
    gender
  }));

  try {
    const res = await bulkAddStudents(list);
    if (res.success) {
      playScoreCelebration();
      showBulkAddStudentForm = false;
      alert(`Successfully imported ${res.count || list.length} students into the school database!`);
      renderStudentsPage();
    } else {
      alert("Error importing students: " + (res.error || "Unknown error"));
    }
  } catch (err) {
    alert("Error importing students: " + err.message);
  }
}

export function openEditStudentModal(studentId) {
  playTapSound();
  editingStudentId = studentId;
  renderStudentsPage();
}

export function closeEditStudentModal() {
  playTapSound();
  editingStudentId = null;
  renderStudentsPage();
}

export async function handleSaveEditStudent(event) {
  event.preventDefault();
  playTapSound();

  if (!editingStudentId) return;

  const name = document.getElementById("edit-student-name")?.value?.trim();
  const houseId = document.getElementById("edit-student-house")?.value || "general";
  const grade = document.getElementById("edit-student-grade")?.value || "SS 1";
  const gender = document.getElementById("edit-student-gender")?.value || "Boys";

  if (!name) {
    alert("Please enter the student's name.");
    return;
  }

  try {
    const res = await updateStudent(editingStudentId, {
      name,
      houseId,
      grade,
      gender
    });

    if (res.success) {
      playTapSound();
      alert(`Student profile updated!`);
      editingStudentId = null;
      renderStudentsPage();
    } else {
      alert("Error updating student: " + (res.error || "Unknown error"));
    }
  } catch (err) {
    alert("Error updating student: " + err.message);
  }
}

export async function handleDeleteStudent(studentId) {
  if (!isUserAdmin()) { alert("Official access required."); return; }
  playTapSound();
  const { students } = getCachedData();
  const stu = students.find(s => s.id === studentId);
  const stuName = stu ? stu.name : "student";

  if (!confirm(`Are you sure you want to remove "${stuName}" from the student database?`)) {
    return;
  }

  try {
    const res = await deleteStudent(studentId);
    if (res.success) {
      playTapSound();
      renderStudentsPage();
    } else {
      alert("Error removing student: " + res.error);
    }
  } catch (err) {
    alert("Error removing student: " + err.message);
  }
}

export async function handleResetStudents() {
  playTapSound();
  if (!confirm("Reset student database back to default Juilliard Academy students roster?")) {
    return;
  }

  try {
    for (const stu of INITIAL_STUDENTS) {
      await addStudent(stu);
    }
    alert("Student database refreshed with default roster!");
    renderStudentsPage();
  } catch (err) {
    alert("Error resetting students: " + err.message);
  }
}

export function renderStudentsPage() {
  showScreen("screen-students");
  const container = document.getElementById("screen-students");
  const { houses, students } = getCachedData();
  if (!container) return;

  // Filter students by house, grade, gender, and search query
  let filtered = students;
  if (studentsHouseFilter !== "all") {
    filtered = filtered.filter(s => (s.houseId || "general").toLowerCase() === studentsHouseFilter.toLowerCase());
  }
  if (studentsGradeFilter !== "all") {
    filtered = filtered.filter(s => (s.grade || "").toLowerCase() === studentsGradeFilter.toLowerCase());
  }
  if (studentsGenderFilter !== "all") {
    filtered = filtered.filter(s => (s.gender || "").toLowerCase() === studentsGenderFilter.toLowerCase());
  }
  if (studentsSearchQuery && studentsSearchQuery.trim()) {
    const q = studentsSearchQuery.toLowerCase().trim();
    filtered = filtered.filter(s =>
      (s.name || "").toLowerCase().includes(q) ||
      (s.grade || "").toLowerCase().includes(q) ||
      (s.gender || "").toLowerCase().includes(q) ||
      (s.houseId || "").toLowerCase().includes(q)
    );
  }

  const houseCount = (hId) => students.filter(s => (s.houseId || 'general').toLowerCase() === hId.toLowerCase()).length;
  const gradeCount = (g) => students.filter(s => (s.grade || '').toLowerCase() === g.toLowerCase()).length;
  const genderCount = (gen) => students.filter(s => (s.gender || '').toLowerCase() === gen.toLowerCase()).length;
  const editingStudent = editingStudentId ? students.find(s => s.id === editingStudentId) : null;

  container.innerHTML = `
    <!-- Top Nav -->
    <div class="jais-detail-top-nav">
      <button class="jais-detail-back" onclick="window.location.hash = '#/admin'" aria-label="Go to Admin">
        <span style="display: flex; align-items: center; margin-right: 4px;">${ICONS.backArrow}</span>
      </button>
      <div style="font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
        <img src="assets/juilliard-logo.png" alt="Juilliard" style="width: 22px; height: 22px; object-fit: contain; border-radius: 50%; background: #ffffff; padding: 1px;" />
        <span>Student Database</span>
      </div>
      <div style="display: flex; gap: 4px; align-items: center;">
        <span class="jais-badge-admin" style="background: rgba(0, 230, 118, 0.15); color: var(--fm-green); border: 1px solid rgba(0, 230, 118, 0.3);">
          ${students.length} Total
        </span>
      </div>
    </div>

    <div style="padding: 0.85rem 0.85rem 2.5rem;">
      <!-- Search and Add Bar -->
      <div style="margin-bottom: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 10px; padding: 0.5rem 0.75rem; margin-bottom: 0.5rem;">
          <span style="color: var(--fm-text-secondary); display: flex; align-items: center;">${ICONS.search}</span>
          <input type="text" id="student-search-input" placeholder="Search student by name, house, or class..."
                 value="${escapeHtml(studentsSearchQuery)}"
                 oninput="window.pages.handleStudentSearch(this.value)"
                 style="flex: 1; background: transparent; border: none; outline: none; color: var(--fm-text-primary); font-size: 0.85rem;" />
          ${studentsSearchQuery ? `
            <button onclick="window.pages.handleStudentSearch('')" style="color: var(--fm-text-secondary); font-size: 0.85rem; background: none; border: none; cursor: pointer;">&times;</button>
          ` : ''}
        </div>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button onclick="window.pages.openAddStudentModal()" class="jais-cta-btn" style="flex: 1; min-width: 130px; margin: 0; padding: 0.65rem; font-size: 0.8rem; background: var(--fm-green); color: #000; font-weight: 900; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 230, 118, 0.2);">
            + Add Student
          </button>
          <button onclick="window.pages.openBatchTransferModal()" style="flex: 1; min-width: 130px; padding: 0.65rem; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; font-size: 0.8rem; font-weight: 800; color: #F59E0B; cursor: pointer;">
            🔄 Transfer Houses
          </button>
          <button onclick="window.pages.toggleBulkAddStudentForm()" style="flex: 1; min-width: 110px; padding: 0.65rem; background: ${showBulkAddStudentForm ? 'var(--fm-surface-active)' : 'var(--fm-surface)'}; border: 1px solid var(--fm-border); border-radius: 8px; font-size: 0.78rem; font-weight: 800; color: ${showBulkAddStudentForm ? 'var(--fm-green)' : 'var(--fm-text-primary)'}; cursor: pointer;">
            ${showBulkAddStudentForm ? 'Close Bulk' : '⚡ Bulk Import'}
          </button>
          <button onclick="window.pages.handleResetStudents()" style="padding: 0.65rem 0.75rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 8px; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); cursor: pointer;" title="Reset default Juilliard roster">
            Reset
          </button>
        </div>
      </div>

      <!-- Add Single Student Expandable Form -->
      ${showAddStudentForm ? `
        <div class="jais-section-card" style="margin: 0 0 1rem; padding: 1rem; border-top: 3px solid var(--fm-green);">
          <div style="font-weight: 800; font-size: 0.9rem; margin-bottom: 0.75rem; color: var(--fm-text-primary);">
            Register Student into School Database
          </div>
          <form onsubmit="window.pages.handleAddStudent(event)">
            <div style="margin-bottom: 0.75rem;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Full Name *</label>
              <input type="text" id="new-student-name" class="jais-text-input" placeholder="e.g. Chinedu Ihejiahi" required style="width: 100%; font-size: 0.85rem;" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 0.85rem;">
              <div>
                <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">House</label>
                <select id="new-student-house" class="jais-text-input" style="width: 100%; font-size: 0.82rem;">
                  <option value="phoenix">Phoenix (Red)</option>
                  <option value="eagle">Eagle (Yellow)</option>
                  <option value="swift">Swift (Blue)</option>
                  <option value="merlin">Merlin (Green)</option>
                  <option value="general" selected>General Pool</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Class / Grade</label>
                <select id="new-student-grade" class="jais-text-input" style="width: 100%; font-size: 0.82rem;">
                  <option value="JSS 1">JSS 1</option>
                  <option value="JSS 2">JSS 2</option>
                  <option value="JSS 3">JSS 3</option>
                  <option value="SS 1" selected>SS 1</option>
                  <option value="SS 2">SS 2</option>
                  <option value="SS 3">SS 3</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Gender</label>
                <select id="new-student-gender" class="jais-text-input" style="width: 100%; font-size: 0.82rem;">
                  <option value="Boys" selected>Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            <button type="submit" class="jais-cta-btn" style="width: 100%; margin: 0; padding: 0.75rem; font-size: 0.85rem; font-weight: 800;">
              Save to School Database
            </button>
          </form>
        </div>
      ` : ''}

      <!-- Bulk Import Expandable Form -->
      ${showBulkAddStudentForm ? `
        <div class="jais-section-card" style="margin: 0 0 1rem; padding: 1rem; border-top: 3px solid #3B82F6;">
          <div style="font-weight: 800; font-size: 0.9rem; margin-bottom: 0.4rem; color: var(--fm-text-primary);">
            ⚡ Bulk Import Students
          </div>
          <p style="font-size: 0.74rem; color: var(--fm-text-secondary); margin: 0 0 0.75rem;">
            Paste student names from Excel, Google Docs, or text (one per line or comma-separated). They will all be imported with the selected House, Grade, and Gender.
          </p>
          <form onsubmit="window.pages.handleBulkAddStudents(event)">
            <div style="margin-bottom: 0.75rem;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Student Names *</label>
              <textarea id="bulk-students-names" class="jais-text-input" rows="5" placeholder="Abebi Akinsanya&#10;Chinedu Ihejiahi&#10;Zainab Mohammed" required style="width: 100%; font-size: 0.82rem; font-family: inherit; resize: vertical;"></textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 0.85rem;">
              <div>
                <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Assign House</label>
                <select id="bulk-student-house" class="jais-text-input" style="width: 100%; font-size: 0.82rem;">
                  <option value="phoenix">Phoenix (Red)</option>
                  <option value="eagle">Eagle (Yellow)</option>
                  <option value="swift">Swift (Blue)</option>
                  <option value="merlin">Merlin (Green)</option>
                  <option value="general" selected>General Pool</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Assign Grade</label>
                <select id="bulk-student-grade" class="jais-text-input" style="width: 100%; font-size: 0.82rem;">
                  <option value="JSS 1">JSS 1</option>
                  <option value="JSS 2">JSS 2</option>
                  <option value="JSS 3">JSS 3</option>
                  <option value="SS 1" selected>SS 1</option>
                  <option value="SS 2">SS 2</option>
                  <option value="SS 3">SS 3</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Assign Gender</label>
                <select id="bulk-student-gender" class="jais-text-input" style="width: 100%; font-size: 0.82rem;">
                  <option value="Boys" selected>Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            <button type="submit" class="jais-cta-btn" style="width: 100%; margin: 0; padding: 0.75rem; font-size: 0.85rem; font-weight: 800; background: #3B82F6; color: #fff;">
              Import All Students
            </button>
          </form>
        </div>
      ` : ''}

      <!-- House Filter Tabs Strip -->
      <div style="margin-bottom: 0.65rem;">
        <div style="margin-bottom: 0.35rem; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.7rem; font-weight: 800; color: var(--fm-text-secondary); letter-spacing: 0.5px;">FILTER BY HOUSE</span>
          <span style="font-size: 0.68rem; color: var(--fm-text-muted);">${filtered.length} visible</span>
        </div>
        <div class="jais-filter-strip" style="padding: 0 0 0.35rem; margin-bottom: 0;">
          <button class="jais-chip ${studentsHouseFilter === 'all' ? 'active' : ''}" onclick="window.pages.setStudentsHouseFilter('all')">
            All Houses (${students.length})
          </button>
          <button class="jais-chip ${studentsHouseFilter === 'phoenix' ? 'active' : ''}" onclick="window.pages.setStudentsHouseFilter('phoenix')" style="${studentsHouseFilter === 'phoenix' ? 'border-color: #EF4444; color: #EF4444;' : ''}">
            Phoenix (${houseCount('phoenix')})
          </button>
          <button class="jais-chip ${studentsHouseFilter === 'eagle' ? 'active' : ''}" onclick="window.pages.setStudentsHouseFilter('eagle')" style="${studentsHouseFilter === 'eagle' ? 'border-color: #F59E0B; color: #F59E0B;' : ''}">
            Eagle (${houseCount('eagle')})
          </button>
          <button class="jais-chip ${studentsHouseFilter === 'swift' ? 'active' : ''}" onclick="window.pages.setStudentsHouseFilter('swift')" style="${studentsHouseFilter === 'swift' ? 'border-color: #3B82F6; color: #3B82F6;' : ''}">
            Swift (${houseCount('swift')})
          </button>
          <button class="jais-chip ${studentsHouseFilter === 'merlin' ? 'active' : ''}" onclick="window.pages.setStudentsHouseFilter('merlin')" style="${studentsHouseFilter === 'merlin' ? 'border-color: #10B981; color: #10B981;' : ''}">
            Merlin (${houseCount('merlin')})
          </button>
          <button class="jais-chip ${studentsHouseFilter === 'general' ? 'active' : ''}" onclick="window.pages.setStudentsHouseFilter('general')">
            General Pool (${houseCount('general')})
          </button>
        </div>
      </div>

      <!-- Grade Filter Tabs Strip -->
      <div style="margin-bottom: 0.75rem;">
        <div style="margin-bottom: 0.35rem;">
          <span style="font-size: 0.7rem; font-weight: 800; color: var(--fm-text-secondary); letter-spacing: 0.5px;">FILTER BY CLASS / GRADE</span>
        </div>

        <div class="jais-filter-strip" style="padding: 0 0 0.5rem; margin-bottom: 0;">
          <button class="jais-chip ${studentsGradeFilter === 'all' ? 'active' : ''}" onclick="window.pages.setStudentsGradeFilter('all')">
            All Grades (${students.length})
          </button>
          <button class="jais-chip ${studentsGradeFilter === 'jss 1' ? 'active' : ''}" onclick="window.pages.setStudentsGradeFilter('jss 1')">
            JSS 1 (${gradeCount('JSS 1')})
          </button>
          <button class="jais-chip ${studentsGradeFilter === 'jss 2' ? 'active' : ''}" onclick="window.pages.setStudentsGradeFilter('jss 2')">
            JSS 2 (${gradeCount('JSS 2')})
          </button>
          <button class="jais-chip ${studentsGradeFilter === 'jss 3' ? 'active' : ''}" onclick="window.pages.setStudentsGradeFilter('jss 3')">
            JSS 3 (${gradeCount('JSS 3')})
          </button>
          <button class="jais-chip ${studentsGradeFilter === 'ss 1' ? 'active' : ''}" onclick="window.pages.setStudentsGradeFilter('ss 1')">
            SS 1 (${gradeCount('SS 1')})
          </button>
          <button class="jais-chip ${studentsGradeFilter === 'ss 2' ? 'active' : ''}" onclick="window.pages.setStudentsGradeFilter('ss 2')">
            SS 2 (${gradeCount('SS 2')})
          </button>
          <button class="jais-chip ${studentsGradeFilter === 'ss 3' ? 'active' : ''}" onclick="window.pages.setStudentsGradeFilter('ss 3')">
            SS 3 (${gradeCount('SS 3')})
          </button>
        </div>
      </div>

      <!-- Students List -->
      <div class="jais-section-card" style="margin: 0; padding: 0;">
        <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); font-weight: 800; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
          <span>Student Roster (${filtered.length})</span>
          <span style="font-size: 0.7rem; color: var(--fm-green); font-weight: 700;">Juilliard Students</span>
        </div>

        ${filtered.length > 0 ? `
          <div class="jais-student-list">
            ${filtered.map((s) => {
              const sHouse = houses.find(h => (h.id || '').toLowerCase() === (s.houseId || '').toLowerCase());
              const houseLabel = sHouse ? sHouse.name : (s.houseId === 'general' ? 'General Pool' : s.houseId || 'General Pool');
              const houseColor = sHouse ? sHouse.color : 'var(--fm-text-secondary)';
              const houseBg = sHouse ? `${sHouse.color}20` : 'rgba(255,255,255,0.06)';
              const houseCrest = sHouse?.crest ? `<img src="${sHouse.crest}" alt="" style="width: 13px; height: 13px; object-fit: contain; vertical-align: middle; margin-right: 4px;" />` : '';

              return `
                <div class="jais-student-item" style="cursor: pointer;" onclick="window.location.hash='#/student/${s.id}'" title="View athlete profile &amp; medals">
                  <div class="jais-student-left" style="display: flex; align-items: center; gap: 0.65rem;">
                    <span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; font-size: 0.72rem; font-weight: 800; background: rgba(0, 230, 118, 0.12); color: var(--fm-green); border: 1px solid rgba(0, 230, 118, 0.25); flex-shrink: 0;">
                      ${escapeHtml(s.grade || 'JA')}
                    </span>
                    <div>
                      <div style="font-weight: 700; font-size: 0.88rem; color: var(--fm-text-primary); display: flex; align-items: center; gap: 6px;">
                        <span>${escapeHtml(s.name)}</span>
                        <span style="font-size: 0.68rem; color: var(--fm-green); font-weight: 700;">Profile &rarr;</span>
                      </div>
                      <div class="jais-student-meta" style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap; margin-top: 3px;">
                        <span style="display: inline-flex; align-items: center; font-size: 0.68rem; font-weight: 800; padding: 1px 6px; border-radius: 4px; background: ${houseBg}; color: ${houseColor}; border: 1px solid ${houseColor}33;">
                          ${houseCrest}${escapeHtml(houseLabel)}
                        </span>
                        ${s.gender ? `<span style="font-size: 0.68rem; color: var(--fm-text-secondary);">&bull; ${escapeHtml(s.gender)}</span>` : ''}
                        <span style="font-size: 0.68rem; color: var(--fm-text-muted);">&bull; Juilliard Academy</span>
                      </div>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end;" onclick="event.stopPropagation()">
                    <select class="jais-quick-house-dropdown" onchange="window.pages.quickChangeStudentHouse('${s.id}', this.value)" style="border-color: ${houseColor}55; color: ${houseColor}; background-color: ${houseBg};" title="Instant House Switcher for ${escapeHtml(s.name)}">
                      <option value="phoenix" ${(s.houseId||'').toLowerCase() === 'phoenix' ? 'selected' : ''}>Phoenix (Red)</option>
                      <option value="eagle" ${(s.houseId||'').toLowerCase() === 'eagle' ? 'selected' : ''}>Eagle (Yellow)</option>
                      <option value="swift" ${(s.houseId||'').toLowerCase() === 'swift' ? 'selected' : ''}>Swift (Blue)</option>
                      <option value="merlin" ${(s.houseId||'').toLowerCase() === 'merlin' ? 'selected' : ''}>Merlin (Green)</option>
                      <option value="general" ${(!s.houseId || s.houseId === 'general') ? 'selected' : ''}>General Pool</option>
                    </select>
                    <button type="button" class="jais-chip" onclick="window.pages.openEditStudentModal('${s.id}')" title="Edit student" style="margin: 0; padding: 4px 8px; font-size: 0.7rem; font-weight: 700; background: var(--fm-surface-active); color: var(--fm-text-primary); border: 1px solid var(--fm-border); cursor: pointer;">
                      Edit
                    </button>
                    <button type="button" class="jais-student-del-btn" onclick="window.pages.handleDeleteStudent('${s.id}')" title="Delete student">
                      Delete
                    </button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        ` : `
          <div style="padding: 2.5rem 1rem; text-align: center; color: var(--fm-text-muted); font-size: 0.82rem;">
            No students found matching current filter or search.
            <div style="margin-top: 0.65rem; display: flex; gap: 0.5rem; justify-content: center;">
              <button onclick="window.pages.openAddStudentModal()" style="color: var(--fm-green); background: none; border: 1px solid var(--fm-green); padding: 4px 10px; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer;">
                + Add student
              </button>
              <button onclick="window.pages.setStudentsHouseFilter('all'); window.pages.setStudentsGradeFilter('all'); window.pages.handleStudentSearch('');" style="color: var(--fm-text-secondary); background: none; border: 1px solid var(--fm-border); padding: 4px 10px; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer;">
                Reset filters
              </button>
            </div>
          </div>
        `}
      </div>
    </div>

    <!-- Edit Student Modal Overlay -->
    ${editingStudent ? `
      <div class="jais-modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
        <div class="jais-modal-content" style="background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 14px; width: 100%; max-width: 460px; padding: 1.25rem; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--fm-border); padding-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: var(--fm-green); font-size: 1.1rem;">✎</span>
              <h3 style="margin: 0; font-size: 0.95rem; font-weight: 800; color: var(--fm-text-primary);">Edit Student Details</h3>
            </div>
            <button onclick="window.pages.closeEditStudentModal()" style="background: none; border: none; font-size: 1.25rem; color: var(--fm-text-secondary); cursor: pointer;">&times;</button>
          </div>
          <form onsubmit="window.pages.handleSaveEditStudent(event)">
            <div style="margin-bottom: 0.75rem;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Full Name *</label>
              <input type="text" id="edit-student-name" class="jais-text-input" value="${escapeHtml(editingStudent.name)}" required style="width: 100%; font-size: 0.85rem;" />
            </div>

            <!-- Visual House Selector Grid -->
            <div style="margin-bottom: 0.75rem;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">Assigned House *</label>
              <input type="hidden" id="edit-student-house" value="${editingStudent.houseId || 'general'}" />
              <div id="edit-student-house-grid" class="jais-house-select-grid" style="margin-bottom: 0;">
                <div class="jais-house-choice-btn house-phoenix ${editingStudent.houseId === 'phoenix' ? 'active' : ''}" data-house="phoenix" onclick="window.pages.selectModalHouse('phoenix', 'edit-student')">
                  <img src="assets/crests/phoenix.svg" alt="" class="jais-house-choice-crest" onerror="this.src='assets/juilliard-logo.png'" />
                  <span class="jais-house-choice-name">Phoenix</span>
                  <span class="jais-house-choice-sub">Red</span>
                </div>
                <div class="jais-house-choice-btn house-eagle ${editingStudent.houseId === 'eagle' ? 'active' : ''}" data-house="eagle" onclick="window.pages.selectModalHouse('eagle', 'edit-student')">
                  <img src="assets/crests/eagle.svg" alt="" class="jais-house-choice-crest" onerror="this.src='assets/juilliard-logo.png'" />
                  <span class="jais-house-choice-name">Eagle</span>
                  <span class="jais-house-choice-sub">Yellow</span>
                </div>
                <div class="jais-house-choice-btn house-swift ${editingStudent.houseId === 'swift' ? 'active' : ''}" data-house="swift" onclick="window.pages.selectModalHouse('swift', 'edit-student')">
                  <img src="assets/crests/swift.svg" alt="" class="jais-house-choice-crest" onerror="this.src='assets/juilliard-logo.png'" />
                  <span class="jais-house-choice-name">Swift</span>
                  <span class="jais-house-choice-sub">Blue</span>
                </div>
                <div class="jais-house-choice-btn house-merlin ${editingStudent.houseId === 'merlin' ? 'active' : ''}" data-house="merlin" onclick="window.pages.selectModalHouse('merlin', 'edit-student')">
                  <img src="assets/crests/merlin.svg" alt="" class="jais-house-choice-crest" onerror="this.src='assets/juilliard-logo.png'" />
                  <span class="jais-house-choice-name">Merlin</span>
                  <span class="jais-house-choice-sub">Green</span>
                </div>
                <div class="jais-house-choice-btn house-general ${(!editingStudent.houseId || editingStudent.houseId === 'general') ? 'active' : ''}" data-house="general" onclick="window.pages.selectModalHouse('general', 'edit-student')">
                  <span style="font-size: 1.5rem; line-height: 28px;">🏫</span>
                  <span class="jais-house-choice-name">General</span>
                  <span class="jais-house-choice-sub">Pool</span>
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
              <div>
                <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Grade</label>
                <select id="edit-student-grade" class="jais-text-input" style="width: 100%; font-size: 0.82rem;">
                  <option value="JSS 1" ${editingStudent.grade === 'JSS 1' ? 'selected' : ''}>JSS 1</option>
                  <option value="JSS 2" ${editingStudent.grade === 'JSS 2' ? 'selected' : ''}>JSS 2</option>
                  <option value="JSS 3" ${editingStudent.grade === 'JSS 3' ? 'selected' : ''}>JSS 3</option>
                  <option value="SS 1" ${editingStudent.grade === 'SS 1' ? 'selected' : ''}>SS 1</option>
                  <option value="SS 2" ${editingStudent.grade === 'SS 2' ? 'selected' : ''}>SS 2</option>
                  <option value="SS 3" ${editingStudent.grade === 'SS 3' ? 'selected' : ''}>SS 3</option>
                </select>
              </div>
              <div>
                <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 3px;">Gender</label>
                <select id="edit-student-gender" class="jais-text-input" style="width: 100%; font-size: 0.82rem;">
                  <option value="Boys" ${editingStudent.gender === 'Boys' ? 'selected' : ''}>Boys</option>
                  <option value="Girls" ${editingStudent.gender === 'Girls' ? 'selected' : ''}>Girls</option>
                  <option value="General" ${editingStudent.gender === 'General' ? 'selected' : ''}>General</option>
                </select>
              </div>
            </div>

            <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
              <button type="button" onclick="window.pages.closeEditStudentModal()" style="padding: 0.6rem 1rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 8px; font-size: 0.8rem; font-weight: 700; color: var(--fm-text-secondary); cursor: pointer;">
                Cancel
              </button>
              <button type="submit" class="jais-cta-btn" style="margin: 0; padding: 0.6rem 1.25rem; font-size: 0.8rem; font-weight: 800; background: var(--fm-green); color: #000; border-radius: 8px;">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    ` : ''}
  `;
}

/**
 * House Rosters Management Screen
 */
export function renderRostersPage() {
  showScreen("screen-rosters");
  const container = document.getElementById("screen-rosters");
  const { houses } = getCachedData();
  if (!container) return;

  container.innerHTML = `
    <!-- Top Nav -->
    <div class="jais-detail-top-nav">
      <button class="jais-detail-back" onclick="window.appRouter.back()">
        <span style="display: flex; align-items: center; margin-right: 4px;">${ICONS.backArrow}</span>
      </button>
      <div style="font-weight: 800; font-size: 0.95rem;">House Rosters & Staff</div>
      <div><span class="jais-badge-admin">JUDGE</span></div>
    </div>

    <div style="padding: 1rem 0.85rem 2rem;">
      <p style="font-size: 0.78rem; color: var(--fm-text-secondary); margin-bottom: 1rem;">
        Update assigned teachers, student captains, and house mottos for all four houses.
      </p>

      ${houses.map(house => {
        const teachersStr = (house.teachers || []).join("\n");
        return `
          <div class="jais-section-card" style="margin-bottom: 1.25rem; padding: 1rem; border-top: 3px solid ${house.color};">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 1rem;">
              <img src="assets/crests/${house.id}.svg" alt="${house.name}" style="width: 32px; height: 32px;" />
              <div>
                <h3 style="font-size: 1.05rem; font-weight: 800; color: ${house.color};">${escapeHtml(house.name)} House</h3>
                <span style="font-size: 0.7rem; color: var(--fm-text-muted); font-weight: 600;">ID: ${house.id}</span>
              </div>
            </div>

            <div style="margin-bottom: 0.85rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">
                House Captain (Student Leader)
              </label>
              <input type="text" id="roster-captain-${house.id}" class="jais-text-input" style="width: 100%;" value="${escapeHtml(house.captain || '')}" placeholder="e.g. Samuel Adeyemi" />
            </div>

            <div style="margin-bottom: 0.85rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">
                Assigned Teachers (one per line)
              </label>
              <textarea id="roster-teachers-${house.id}" class="jais-text-input" rows="3" style="width: 100%; resize: vertical;" placeholder="Mrs. Angela Davies&#10;Mr. Peter O'Connor">${escapeHtml(teachersStr)}</textarea>
            </div>

            <div style="margin-bottom: 1rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">
                House Motto
              </label>
              <input type="text" id="roster-motto-${house.id}" class="jais-text-input" style="width: 100%;" value="${escapeHtml(house.motto || '')}" placeholder="e.g. Soaring to Great Heights" />
            </div>

            <button onclick="window.pages.saveSingleHouseRoster('${house.id}')" class="jais-cta-btn" style="width: 100%; padding: 0.65rem; font-size: 0.82rem;">
              Save ${escapeHtml(house.name)} Roster
            </button>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

export async function saveSingleHouseRoster(houseId) {
  playTapSound();
  const captain = document.getElementById(`roster-captain-${houseId}`)?.value || "";
  const motto = document.getElementById(`roster-motto-${houseId}`)?.value || "";
  const teachersRaw = document.getElementById(`roster-teachers-${houseId}`)?.value || "";
  const teachers = teachersRaw.split("\n").map(t => t.trim()).filter(Boolean);

  try {
    const res = await updateHouseRoster(houseId, { captain, motto, teachers });
    if (res.success) {
      playScoreCelebration();
      alert(`Updated roster for ${houseId.toUpperCase()}!`);
    } else {
      alert("Error updating roster: " + res.error);
    }
  } catch (err) {
    alert("Error updating roster: " + err.message);
  }
}

/**
 * New Sports Event Creator Screen
 */
export function renderNewEventPage() {
  showScreen("screen-new-event");
  const container = document.getElementById("screen-new-event");
  const { houses } = getCachedData();
  const isPref = isPrefectorialCup();
  if (!container) return;

  container.innerHTML = `
    <!-- Top Nav -->
    <div class="jais-detail-top-nav">
      <button class="jais-detail-back" onclick="window.appRouter.back()">
        <span style="display: flex; align-items: center; margin-right: 4px;">${ICONS.backArrow}</span>
      </button>
      <div style="font-weight: 800; font-size: 0.95rem;">Create Sports Event</div>
      <div><span class="jais-badge-admin">JUDGE</span></div>
    </div>

    <div style="padding: 1rem 0.85rem 2rem;">
      <div class="jais-section-card" style="padding: 1rem;">
        <h2 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 0.25rem;">Add New Event</h2>
        <p style="font-size: 0.75rem; color: var(--fm-text-secondary); margin-bottom: 1.25rem;">
          Configure a custom track, field, novelty, or team sport for Sports Day.
        </p>

        <form onsubmit="window.pages.handleCreateNewEvent(event)">
          <div style="margin-bottom: 0.85rem;">
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">Event Name</label>
            <input type="text" id="new-event-name" class="jais-text-input" placeholder="e.g. 4x100m Parents Relay" required style="width: 100%;" />
          </div>

          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.85rem;">
            <div style="flex: 1;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">Category</label>
              <select id="new-event-category" class="jais-text-input" style="width: 100%;">
                <option value="Track">Track (Race)</option>
                <option value="Field">Field Event</option>
                <option value="Novelty">Novelty Race</option>
                <option value="Team">Team Sport</option>
              </select>
            </div>
            <div style="flex: 1;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">Division / Gender</label>
              <select id="new-event-gender" class="jais-text-input" style="width: 100%;">
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
                <option value="Mixed">Mixed</option>
                <option value="Open">Open</option>
              </select>
            </div>
          </div>

          <div style="margin-bottom: 0.85rem;">
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">Scheduled Time</label>
            <input type="text" id="new-event-time" class="jais-text-input" placeholder="10:00 AM" value="10:00 AM" style="width: 100%;" />
          </div>

          <!-- Format Selector: 4-Houses vs 1v1 Match -->
          <div style="margin-bottom: 0.85rem;">
            <label style="font-size: 0.75rem; font-weight: 800; color: var(--fm-green); display: block; margin-bottom: 4px;">Competition Format</label>
            <select id="new-event-format" class="jais-text-input" style="width: 100%; font-weight: 700;" onchange="window.pages.toggleNewEventFormat(this.value)">
              <option value="all_houses" selected>All 4 ${isPref ? 'Teams' : 'Houses'} Simultaneous (Track, Field, Novelty)</option>
              <option value="h2h">Head-to-Head 1v1 Match (Football, Basketball, Tug-of-War)</option>
            </select>
            <span style="font-size: 0.7rem; color: var(--fm-text-muted); display: block; margin-top: 3px;">
              Track/Field events run across all 4 ${isPref ? 'teams' : 'houses'} at the same time. Team sports pit 2 ${isPref ? 'teams' : 'houses'} head-to-head.
            </span>
          </div>

          <!-- 1v1 Contenders Selection (Hidden by default for 4-house events) -->
          <div id="new-event-h2h-box" style="display: none; background: var(--fm-surface-elevated); padding: 0.85rem; border-radius: 8px; margin-bottom: 0.85rem; border: 1px solid var(--fm-border);">
            <div style="font-size: 0.78rem; font-weight: 800; color: #60A5FA; margin-bottom: 0.5rem;">Select 1v1 Match Contenders</div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <div style="flex: 1;">
                <label style="font-size: 0.7rem; color: var(--fm-text-secondary); font-weight: 700; display: block; margin-bottom: 2px;">Team 1</label>
                <select id="new-event-contender-1" class="jais-text-input" style="width: 100%;">
                  ${houses.map((h, i) => `<option value="${h.id}" ${i === 0 ? 'selected' : ''}>${h.name}${isPref ? '' : ' House'}</option>`).join("")}
                </select>
              </div>
              <span style="font-weight: 800; font-size: 0.75rem; color: var(--fm-text-muted); margin-top: 1rem;">VS</span>
              <div style="flex: 1;">
                <label style="font-size: 0.7rem; color: var(--fm-text-secondary); font-weight: 700; display: block; margin-bottom: 2px;">Team 2</label>
                <select id="new-event-contender-2" class="jais-text-input" style="width: 100%;">
                  ${houses.map((h, i) => `<option value="${h.id}" ${i === 1 ? 'selected' : ''}>${h.name}${isPref ? '' : ' House'}</option>`).join("")}
                </select>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 0.85rem;" id="new-event-pts-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary);">Points Matrix (Football &amp; Basketball Only)</label>
              <span style="font-size: 0.65rem; color: var(--fm-text-muted);">Track/Field award Medals only</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.35rem;">
              <div>
                <span style="font-size: 0.65rem; color: var(--fm-gold); font-weight: 800; display: block; text-align: center;">1st</span>
                <input type="number" id="new-event-pts-1" class="jais-text-input" value="3" style="width: 100%; text-align: center; padding: 0.4rem;" />
              </div>
              <div>
                <span style="font-size: 0.65rem; color: var(--fm-silver); font-weight: 800; display: block; text-align: center;">2nd</span>
                <input type="number" id="new-event-pts-2" class="jais-text-input" value="1" style="width: 100%; text-align: center; padding: 0.4rem;" />
              </div>
              <div>
                <span style="font-size: 0.65rem; color: var(--fm-bronze); font-weight: 800; display: block; text-align: center;">3rd</span>
                <input type="number" id="new-event-pts-3" class="jais-text-input" value="0" style="width: 100%; text-align: center; padding: 0.4rem;" />
              </div>
              <div>
                <span style="font-size: 0.65rem; color: #64748B; font-weight: 800; display: block; text-align: center;">4th</span>
                <input type="number" id="new-event-pts-4" class="jais-text-input" value="0" style="width: 100%; text-align: center; padding: 0.4rem;" />
              </div>
            </div>
          </div>

          <div style="margin-bottom: 1.25rem;">
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">Special Rules or Notes (Optional)</label>
            <textarea id="new-event-notes" class="jais-text-input" rows="2" placeholder="e.g. Standard rules apply; lanes 1-4 draw." style="width: 100%; resize: vertical;"></textarea>
          </div>

          <button type="submit" class="jais-cta-btn" style="width: 100%; padding: 0.75rem;">
            Add Sports Event
          </button>
        </form>
      </div>
    </div>
  `;
}

export function toggleNewEventFormat(val) {
  const box = document.getElementById("new-event-h2h-box");
  if (box) {
    box.style.display = val === "h2h" ? "block" : "none";
  }
}

export async function handleCreateNewEvent(e) {
  if (e) e.preventDefault();
  playTapSound();
  const name = document.getElementById("new-event-name")?.value.trim();
  const category = document.getElementById("new-event-category")?.value || "Track";
  const gender = document.getElementById("new-event-gender")?.value || "Boys";
  const scheduledTime = document.getElementById("new-event-time")?.value.trim() || "10:00 AM";
  const format = document.getElementById("new-event-format")?.value || "all_houses";
  const notes = document.getElementById("new-event-notes")?.value || "";
  const isBall = isBallSportEvent({ name, category });
  const p1 = isBall ? (Number(document.getElementById("new-event-pts-1")?.value) || 3) : 0;
  const p2 = isBall ? (Number(document.getElementById("new-event-pts-2")?.value) || 1) : 0;
  const p3 = isBall ? (Number(document.getElementById("new-event-pts-3")?.value) || 0) : 0;
  const p4 = isBall ? (Number(document.getElementById("new-event-pts-4")?.value) || 0) : 0;

  if (!name) {
    alert("Please enter an event name.");
    return;
  }

  let contenders = null;
  if (format === "h2h") {
    const t1 = document.getElementById("new-event-contender-1")?.value;
    const t2 = document.getElementById("new-event-contender-2")?.value;
    if (t1 === t2) {
      alert("Error: Team 1 and Team 2 must be different " + (isPrefectorialCup() ? "teams" : "houses") + " for a 1v1 match!");
      return;
    }
    contenders = [t1, t2];
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const isPref = isPrefectorialCup();
  const eventId = isPref ? `pref-${slug}-${Date.now()}` : `custom-${slug}-${Date.now()}`;

  const eventPayload = sanitizeEventPoints({
    id: eventId,
    name: `${name} (${gender})`,
    category,
    gender,
    scheduledTime,
    format,
    contenders,
    order: 99,
    status: "upcoming",
    pointsMatrix: isBall ? { first: p1, second: p2, third: p3, fourth: p4 } : { first: 0, second: 0, third: 0, fourth: 0 },
    results: null,
    notes
  });

  try {
    const res = await saveEventDefinition(eventPayload);
    if (res.success) {
      if (isPref && window.currentPrefEventsCache) {
        window.currentPrefEventsCache.push(eventPayload);
      } else if (!isPref && window.currentEventsCache) {
        window.currentEventsCache.push(eventPayload);
      }
      playScoreCelebration();
      alert(`New ${isPref ? "Prefectship" : "Sports Day"} event created successfully!`);
      router.navigate("#/admin");
    } else {
      alert("Error creating event: " + res.error);
    }
  } catch (err) {
    alert("Error creating event: " + err.message);
  }
}

/**
 * Screen 11: Edit Event Setup & Format Screen (#/admin/edit-event/:id)
 * Allows Admin to configure event name, category, division, format (4-houses vs 1v1), contenders, and delete event.
 */
export function renderEditEventPage(params) {
  showScreen("screen-edit-event");
  const container = document.getElementById("screen-edit-event");
  const { events, houses } = getCachedData();
  if (!container) return;

  const eventId = params?.id || "track-100m-boys";
  const ev = events.find(e => e.id === eventId);
  if (!ev) {
    container.innerHTML = `<div style="padding: 2rem; text-align: center;">Event not found. <a href="#/admin" style="color: var(--fm-green);">Back to Admin</a></div>`;
    return;
  }

  const isH2H = (ev.format === "h2h") || (ev.contenders && ev.contenders.length === 2);
  const isPref = isPrefectorialCup() || (ev && ev.id && String(ev.id).startsWith("pref-"));
  const matrix = ev.pointsMatrix || { first: 100, second: 60, third: 40, fourth: 20 };
  const team1Default = ev.contenders?.[0] || "phoenix";
  const team2Default = ev.contenders?.[1] || "eagle";

  container.innerHTML = `
    <!-- Top Nav -->
    <div class="jais-detail-top-nav">
      <button class="jais-detail-back" onclick="window.appRouter.back()">
        <span style="display: flex; align-items: center; margin-right: 4px;">${ICONS.backArrow}</span>
      </button>
      <div style="font-weight: 800; font-size: 0.95rem;">Event Configuration</div>
      <div><span class="jais-badge-admin">ADMIN</span></div>
    </div>

    <div style="padding: 1rem 0.85rem 2rem;">
      <div class="jais-section-card" style="padding: 1rem; margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <h2 style="font-size: 1.1rem; font-weight: 800; margin: 0;">Configure Event Setup</h2>
          <span style="font-size: 0.68rem; color: var(--fm-text-muted); font-family: monospace;">ID: ${escapeHtml(ev.id)}</span>
        </div>

        <p style="font-size: 0.75rem; color: var(--fm-text-secondary); margin-bottom: 1.25rem;">
          Adjust whether this is a 4-house simultaneous event or a 1v1 head-to-head match, schedule time, and point rules.
        </p>

        <form onsubmit="window.pages.handleUpdateEventSetup(event, '${ev.id}')">
          <!-- Event Name -->
          <div style="margin-bottom: 0.85rem;">
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">Event Name</label>
            <input type="text" id="edit-event-name" class="jais-text-input" value="${escapeHtml(ev.name)}" required style="width: 100%;" />
          </div>

          <!-- Category & Division -->
          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.85rem;">
            <div style="flex: 1;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">Category</label>
              <select id="edit-event-category" class="jais-text-input" style="width: 100%;">
                <option value="Track" ${ev.category === 'Track' ? 'selected' : ''}>Track (Race)</option>
                <option value="Field" ${ev.category === 'Field' ? 'selected' : ''}>Field Event</option>
                <option value="Novelty" ${ev.category === 'Novelty' ? 'selected' : ''}>Novelty Race</option>
                <option value="Team" ${ev.category === 'Team' ? 'selected' : ''}>Team Sport</option>
              </select>
            </div>
            <div style="flex: 1;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">Division / Gender</label>
              <select id="edit-event-gender" class="jais-text-input" style="width: 100%;">
                <option value="Boys" ${ev.gender === 'Boys' ? 'selected' : ''}>Boys</option>
                <option value="Girls" ${ev.gender === 'Girls' ? 'selected' : ''}>Girls</option>
                <option value="Mixed" ${ev.gender === 'Mixed' ? 'selected' : ''}>Mixed</option>
                <option value="Open" ${ev.gender === 'Open' ? 'selected' : ''}>Open</option>
              </select>
            </div>
          </div>

          <!-- Scheduled Time -->
          <div style="margin-bottom: 0.85rem;">
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">Scheduled Time</label>
            <input type="text" id="edit-event-time" class="jais-text-input" value="${escapeHtml(ev.scheduledTime || '10:00 AM')}" style="width: 100%;" />
          </div>

          <!-- Event Format Selector -->
          <div style="margin-bottom: 0.85rem;">
            <label style="font-size: 0.75rem; font-weight: 800; color: var(--fm-green); display: block; margin-bottom: 4px;">Competition Format</label>
            <select id="edit-event-format" class="jais-text-input" style="width: 100%; font-weight: 700;" onchange="window.pages.toggleEditEventFormat(this.value)">
              <option value="all_houses" ${!isH2H ? 'selected' : ''}>All 4 ${isPref ? 'Teams' : 'Houses'} Simultaneous (Track, Field, Novelty)</option>
              <option value="h2h" ${isH2H ? 'selected' : ''}>Head-to-Head 1v1 Match (Football, Basketball, Tug-of-War)</option>
            </select>
            <span style="font-size: 0.7rem; color: var(--fm-text-muted); display: block; margin-top: 3px;">
              ${!isH2H ? (isPref ? 'Currently set to all 4 teams.' : 'Currently set to all 4 houses (Phoenix, Eagle, Swift, Merlin).') : (isPref ? 'Currently set to a 1v1 match between 2 selected teams.' : 'Currently set to a 1v1 match between 2 selected houses.')}
            </span>
          </div>

          <!-- 1v1 Contenders Selection Box -->
          <div id="edit-event-h2h-box" style="display: ${isH2H ? 'block' : 'none'}; background: var(--fm-surface-elevated); padding: 0.85rem; border-radius: 8px; margin-bottom: 0.85rem; border: 1px solid var(--fm-border);">
            <div style="font-size: 0.78rem; font-weight: 800; color: #60A5FA; margin-bottom: 0.5rem;">Select 1v1 Match Opponents</div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <div style="flex: 1;">
                <label style="font-size: 0.7rem; color: var(--fm-text-secondary); font-weight: 700; display: block; margin-bottom: 2px;">Team 1</label>
                <select id="edit-event-contender-1" class="jais-text-input" style="width: 100%;">
                  ${houses.map(h => `<option value="${h.id}" ${team1Default === h.id ? 'selected' : ''}>${h.name}${isPref ? '' : ' House'}</option>`).join("")}
                </select>
              </div>
              <span style="font-weight: 800; font-size: 0.75rem; color: var(--fm-text-muted); margin-top: 1rem;">VS</span>
              <div style="flex: 1;">
                <label style="font-size: 0.7rem; color: var(--fm-text-secondary); font-weight: 700; display: block; margin-bottom: 2px;">Team 2</label>
                <select id="edit-event-contender-2" class="jais-text-input" style="width: 100%;">
                  ${houses.map(h => `<option value="${h.id}" ${team2Default === h.id ? 'selected' : ''}>${h.name}${isPref ? '' : ' House'}</option>`).join("")}
                </select>
              </div>
            </div>
          </div>

          <!-- Event State / Status -->
          <div style="margin-bottom: 0.85rem;">
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">Status</label>
            <select id="edit-event-status" class="jais-text-input" style="width: 100%; font-weight: 700;">
              <option value="completed" ${ev.status === 'completed' || ev.status === 'done' ? 'selected' : ''}>Completed • Marked as DONE to all viewers</option>
              <option value="live" ${ev.status === 'live' || ev.status === 'in_progress' ? 'selected' : ''}>Live • In progress (stops showing time &amp; floats to top)</option>
              <option value="upcoming" ${ev.status === 'upcoming' ? 'selected' : ''}>Upcoming • Scheduled match</option>
            </select>
          </div>

          <!-- Points Matrix (Football & Basketball only) or Medal Event Info -->
          ${isBallSportEvent(ev) ? `
            <div style="margin-bottom: 0.85rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">Points Matrix</label>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.35rem;">
                <div>
                  <span style="font-size: 0.65rem; color: var(--fm-gold); font-weight: 800; display: block; text-align: center;">1st</span>
                  <input type="number" id="edit-event-pts-1" class="jais-text-input" value="${matrix.first || 3}" style="width: 100%; text-align: center; padding: 0.4rem;" />
                </div>
                <div>
                  <span style="font-size: 0.65rem; color: var(--fm-silver); font-weight: 800; display: block; text-align: center;">2nd</span>
                  <input type="number" id="edit-event-pts-2" class="jais-text-input" value="${matrix.second || 1}" style="width: 100%; text-align: center; padding: 0.4rem;" />
                </div>
                <div>
                  <span style="font-size: 0.65rem; color: var(--fm-bronze); font-weight: 800; display: block; text-align: center;">3rd</span>
                  <input type="number" id="edit-event-pts-3" class="jais-text-input" value="${matrix.third || 0}" style="width: 100%; text-align: center; padding: 0.4rem;" />
                </div>
                <div>
                  <span style="font-size: 0.65rem; color: #64748B; font-weight: 800; display: block; text-align: center;">4th</span>
                  <input type="number" id="edit-event-pts-4" class="jais-text-input" value="${matrix.fourth || 0}" style="width: 100%; text-align: center; padding: 0.4rem;" />
                </div>
              </div>
            </div>
          ` : `
            <div style="margin-bottom: 0.85rem; padding: 0.65rem 0.75rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; font-size: 0.75rem;">
              <div style="font-weight: 800; color: var(--fm-gold); margin-bottom: 3px; display: flex; align-items: center; gap: 4px;">
                ${ICONS.goldMedal} Medal Podium Event
              </div>
              <div style="color: var(--fm-text-secondary); font-size: 0.72rem; line-height: 1.35;">
                This competition awards Gold, Silver, and Bronze Medals, plus 4th Place Official finish. Points are exclusively reserved for Football and Basketball competitions.
              </div>
            </div>
          `}

          <!-- Special Rules / Notes -->
          <div style="margin-bottom: 1.25rem;">
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--fm-text-secondary); display: block; margin-bottom: 4px;">Special Rules or Notes</label>
            <textarea id="edit-event-notes" class="jais-text-input" rows="2" placeholder="e.g. Standard rules apply; lanes 1-4 draw." style="width: 100%; resize: vertical;">${escapeHtml(ev.notes || '')}</textarea>
          </div>

          <button type="submit" class="jais-cta-btn" style="width: 100%; padding: 0.8rem; margin-bottom: 0.75rem;">
            Save Event Setup
          </button>
        </form>

        <!-- Danger Zone: Delete Event -->
        <div style="border-top: 1px solid var(--fm-border); margin-top: 1.25rem; padding-top: 1rem; text-align: center;">
          <button onclick="window.pages.handleDeleteEvent('${ev.id}')" style="background: transparent; border: 1px solid #EF4444; color: #EF4444; border-radius: 8px; padding: 0.6rem 1rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; width: 100%;">
            Delete Event From Championship
          </button>
        </div>
      </div>
    </div>
  `;
}

export function toggleEditEventFormat(val) {
  const box = document.getElementById("edit-event-h2h-box");
  if (box) {
    box.style.display = val === "h2h" ? "block" : "none";
  }
}

export async function handleUpdateEventSetup(e, eventId) {
  if (e) e.preventDefault();
  playTapSound();
  const { events } = getCachedData();
  const ev = events.find(item => item.id === eventId) || {};

  const name = document.getElementById("edit-event-name")?.value.trim();
  const category = document.getElementById("edit-event-category")?.value || "Track";
  const gender = document.getElementById("edit-event-gender")?.value || "Boys";
  const scheduledTime = document.getElementById("edit-event-time")?.value.trim() || "10:00 AM";
  const format = document.getElementById("edit-event-format")?.value || "all_houses";
  const status = document.getElementById("edit-event-status")?.value || ev.status || "upcoming";
  const notes = document.getElementById("edit-event-notes")?.value || "";

  const isBall = isBallSportEvent({ name, category });
  const p1 = isBall ? (Number(document.getElementById("edit-event-pts-1")?.value) || 3) : 0;
  const p2 = isBall ? (Number(document.getElementById("edit-event-pts-2")?.value) || 1) : 0;
  const p3 = isBall ? (Number(document.getElementById("edit-event-pts-3")?.value) || 0) : 0;
  const p4 = isBall ? (Number(document.getElementById("edit-event-pts-4")?.value) || 0) : 0;

  if (!name) {
    alert("Please enter an event name.");
    return;
  }

  let contenders = null;
  if (format === "h2h") {
    const t1 = document.getElementById("edit-event-contender-1")?.value;
    const t2 = document.getElementById("edit-event-contender-2")?.value;
    if (t1 === t2) {
      alert("Error: Team 1 and Team 2 must be different " + (isPref ? "teams" : "houses") + " for a 1v1 match!");
      return;
    }
    contenders = [t1, t2];
  }

  const updatedPayload = sanitizeEventPoints({
    ...ev,
    id: eventId,
    name,
    category,
    gender,
    scheduledTime,
    format,
    contenders,
    status,
    isLive: status === "live" || status === "in_progress",
    pointsMatrix: isBall ? { first: p1, second: p2, third: p3, fourth: p4 } : { first: 0, second: 0, third: 0, fourth: 0 },
    notes,
    updatedAt: new Date().toISOString()
  });

  if (window.currentEventsCache) {
    const idx = window.currentEventsCache.findIndex(e => e.id === eventId);
    if (idx >= 0) window.currentEventsCache[idx] = { ...window.currentEventsCache[idx], ...updatedPayload };
  }
  if (window.currentPrefEventsCache) {
    const idx = window.currentPrefEventsCache.findIndex(e => e.id === eventId);
    if (idx >= 0) window.currentPrefEventsCache[idx] = { ...window.currentPrefEventsCache[idx], ...updatedPayload };
  }

  try {
    const res = await saveEventDefinition(updatedPayload);
    if (res.success) {
      playScoreCelebration();
      alert(`Event "${name}" setup updated successfully!`);
      router.navigate("#/admin");
    } else {
      alert("Error saving event: " + res.error);
    }
  } catch (err) {
    alert("Error saving event: " + err.message);
  }
}

export async function handleDeleteEvent(eventId) {
  if (!isUserAdmin()) { alert("Official access required."); return; }
  playTapSound();
  if (!confirm("Are you sure you want to permanently delete this event? This will remove it from fixtures and standings.")) {
    return;
  }

  try {
    const res = await deleteEventDefinition(eventId);
    if (res.success) {
      if (window.currentEventsCache) {
        window.currentEventsCache = window.currentEventsCache.filter(e => e.id !== eventId);
      }
      if (window.currentPrefEventsCache) {
        window.currentPrefEventsCache = window.currentPrefEventsCache.filter(e => e.id !== eventId);
      }
      playTapSound();
      alert("Event has been removed from sports day.");
      router.navigate("#/admin");
    } else {
      alert("Error deleting event: " + res.error);
    }
  } catch (err) {
    alert("Error deleting event: " + err.message);
  }
}

/* ==========================================================================
   SCREEN: ATHLETE & STUDENT PROFILE (#/athlete/:id, #/student/:id)
   Shows medals won (Gold, Silver, Bronze, 4th), points, goals & assists,
   and event performance history.
   ========================================================================== */
export function normalizeAthleteName(name) {
  if (!name) return "";
  return String(name)
    .replace(/\s*\([^)]*\)/g, "") // Strip parenthesized grade or comments like (SS 3)
    .replace(/['"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function matchesAthlete(entryAthleteString, targetAthleteName) {
  if (!entryAthleteString || !targetAthleteName) return false;
  const targetNorm = normalizeAthleteName(targetAthleteName);
  if (!targetNorm) return false;

  // Split multiple athletes in relay / paired events (e.g. "Chinedu Ihejiahi & Victor Oshodi")
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

export function getAthleteStats(athleteName, events) {
  const normName = normalizeAthleteName(athleteName);
  if (!normName) {
    return {
      gold: 0, silver: 0, bronze: 0, fourth: 0, totalMedals: 0,
      totalPoints: 0, goals: 0, assists: 0, goalInvolvements: 0,
      basketballPoints: 0, eventsCount: 0, podiumRate: 0, history: []
    };
  }

  let gold = 0;
  let silver = 0;
  let bronze = 0;
  let fourth = 0;
  let totalPoints = 0;
  let goals = 0;
  let assists = 0;
  let basketballPoints = 0;
  const history = [];

  (events || []).forEach(rawEv => {
    const ev = sanitizeEventPoints(rawEv);
    if (!ev.results) return;
    const res = ev.results;
    const isBallSport = isBallSportEvent(ev);

    // 1st Place (Gold)
    if (res.first && matchesAthlete(res.first.athlete, athleteName)) {
      gold++;
      if (isBallSport) totalPoints += Number(res.first.points || 0);
      history.push({
        eventId: ev.id,
        eventName: ev.name,
        category: ev.category || "Track",
        place: "1st Place (Gold)",
        placeType: "gold",
        medal: "Gold",
        score: res.first.score || "Winner",
        houseId: res.first.houseId,
        points: isBallSport ? (Number(res.first.points) || null) : null
      });
    }

    // 2nd Place (Silver)
    if (res.second && matchesAthlete(res.second.athlete, athleteName)) {
      silver++;
      if (isBallSport) totalPoints += Number(res.second.points || 0);
      history.push({
        eventId: ev.id,
        eventName: ev.name,
        category: ev.category || "Track",
        place: "2nd Place (Silver)",
        placeType: "silver",
        medal: "Silver",
        score: res.second.score || "Runner-up",
        houseId: res.second.houseId,
        points: isBallSport ? (Number(res.second.points) || null) : null
      });
    }

    // 3rd Place (Bronze)
    if (res.third && matchesAthlete(res.third.athlete, athleteName)) {
      bronze++;
      if (isBallSport) totalPoints += Number(res.third.points || 0);
      history.push({
        eventId: ev.id,
        eventName: ev.name,
        category: ev.category || "Track",
        place: "3rd Place (Bronze)",
        placeType: "bronze",
        medal: "Bronze",
        score: res.third.score || "3rd",
        houseId: res.third.houseId,
        points: isBallSport ? (Number(res.third.points) || null) : null
      });
    }

    // 4th Place
    if (res.fourth && matchesAthlete(res.fourth.athlete, athleteName)) {
      fourth++;
      if (isBallSport) totalPoints += Number(res.fourth.points || 0);
      history.push({
        eventId: ev.id,
        eventName: ev.name,
        category: ev.category || "Track",
        place: "4th Place",
        placeType: "fourth",
        medal: "4th",
        score: res.fourth.score || "4th",
        houseId: res.fourth.houseId,
        points: isBallSport ? (Number(res.fourth.points) || null) : null
      });
    }

    // 1v1 Match Scorers & Assists
    if (Array.isArray(res.scorers)) {
      res.scorers.forEach(sc => {
        const isScorer = matchesAthlete(sc.athlete || sc.player, athleteName);
        const isAssist = matchesAthlete(sc.assist, athleteName);
        const isBasketball = (ev.name || "").toLowerCase().includes("basketball") || ev.category === "Basketball";

        if (isScorer) {
          if (isBasketball) {
            const pts = parseInt(sc.minute || sc.score || "2", 10) || 2;
            basketballPoints += pts;
            history.push({
              eventId: ev.id,
              eventName: ev.name,
              category: "Basketball",
              place: "Basket Scored",
              placeType: "goal",
              medal: "Basket",
              score: sc.minute ? `${sc.minute}` : `${pts} PTS`,
              houseId: sc.houseId,
              points: pts
            });
          } else {
            goals++;
            history.push({
              eventId: ev.id,
              eventName: ev.name,
              category: ev.category || "Team",
              place: "Goal Scorer",
              placeType: "goal",
              medal: "Goal",
              score: sc.minute ? `Minute ${sc.minute}` : "Goal",
              houseId: sc.houseId,
              points: null
            });
          }
        }

        if (isAssist) {
          assists++;
          history.push({
            eventId: ev.id,
            eventName: ev.name,
            category: ev.category || "Team",
            place: isBasketball ? "Assist" : "Goal Assist",
            placeType: "assist",
            medal: "Assist",
            score: sc.minute ? `${sc.minute}` : "Assist",
            houseId: sc.houseId,
            points: null
          });
        }
      });
    }
  });

  const totalMedals = gold + silver + bronze;
  const eventsCount = history.length;
  const podiumRate = eventsCount > 0 ? Math.round((totalMedals / eventsCount) * 100) : 0;
  const goalInvolvements = goals + assists;

  return {
    gold,
    silver,
    bronze,
    fourth,
    totalMedals,
    totalPoints,
    goals,
    assists,
    basketballPoints,
    goalInvolvements,
    eventsCount,
    podiumRate,
    history
  };
}

export function renderAthleteProfilePage(params) {
  showScreen("screen-athlete-profile");
  const container = document.getElementById("screen-athlete-profile");
  const { houses, events, students } = getCachedData();
  if (!container) return;

  const rawId = params?.id || "";
  const decodedId = decodeURIComponent(rawId).trim();
  const targetNorm = normalizeAthleteName(decodedId);

  // Find student by ID or by normalized name
  let student = students.find(s => s.id === decodedId || normalizeAthleteName(s.name) === targetNorm);

  if (!student) {
    // Graceful fallback for ad-hoc athlete names
    student = {
      id: rawId,
      name: decodedId || "Juilliard Athlete",
      grade: "SS 3",
      gender: "Student Athlete",
      houseId: "general"
    };
  }

  // Resolve athlete's true house
  let athleteHouseId = student.houseId;

  // 1. Check if student is captain of any house
  const captainHouse = houses.find(h => {
    const capNorm = normalizeAthleteName(h.captain);
    return capNorm && (capNorm === targetNorm || capNorm.includes(targetNorm) || targetNorm.includes(capNorm));
  });

  if (captainHouse) {
    athleteHouseId = captainHouse.id;
  } else if (!athleteHouseId || athleteHouseId === "general") {
    // 2. Check which house they competed for in events
    for (const ev of (events || [])) {
      if (!ev.results) continue;
      for (const pl of ['first', 'second', 'third', 'fourth']) {
        if (matchesAthlete(ev.results[pl]?.athlete, student.name) && ev.results[pl]?.houseId) {
          athleteHouseId = ev.results[pl].houseId;
          break;
        }
      }
      if (athleteHouseId && athleteHouseId !== "general") break;
    }
  }

  const isHouseCaptain = Boolean(captainHouse && captainHouse.id === athleteHouseId);
  const sHouse = houses.find(h => h.id === athleteHouseId);
  const houseColor = sHouse ? sHouse.color : "#10B981";
  const houseSecondary = sHouse ? (sHouse.colorSecondary || sHouse.colorDark || houseColor) : "#059669";
  const houseName = sHouse ? `${sHouse.name} House` : "Juilliard Athlete";

  const displayName = (student.name || decodedId).replace(/\s*\([^)]*\)/g, "").trim();
  const extractedGrade = (decodedId.match(/\(([^)]+)\)/)?.[1]) || student.grade || "SS 3";

  // Initials for avatar
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join("");

  const stats = getAthleteStats(displayName, events);

  container.innerHTML = `
    <!-- Top Navigation Bar -->
    <div class="jais-detail-top-nav">
      <button class="jais-detail-back" onclick="window.appRouter.back()" aria-label="Go Back">
        <span style="display: flex; align-items: center; margin-right: 4px;">${ICONS.backArrow}</span>
      </button>

      <div style="font-weight: 800; font-size: 0.95rem; text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px;">
        <img src="assets/juilliard-logo.png" alt="Juilliard" style="width: 22px; height: 22px; object-fit: contain; border-radius: 50%; background: #ffffff; padding: 1px;" />
        <span>Athlete Profile</span>
      </div>

      <div class="jais-detail-actions">
        <button class="jais-icon-btn" onclick="window.toggleTheme()" aria-label="Toggle Theme">
          ${ICONS.sun}
        </button>
      </div>
    </div>

    <div style="padding: 0.85rem 0.85rem 3rem;">
      <!-- Athlete Hero Card -->
      <div class="jais-athlete-hero" style="border-top: 3px solid ${houseColor}; box-shadow: 0 4px 20px ${sHouse?.glowColor || 'rgba(0,0,0,0.3)'};">
        <div class="jais-athlete-avatar" style="background: linear-gradient(135deg, ${houseColor}, ${houseSecondary}); color: #FFFFFF; font-weight: 900; font-size: 1.4rem;">
          ${initials || 'JA'}
        </div>
        <div class="jais-athlete-info">
          <div class="jais-athlete-name">
            ${escapeHtml(displayName)}
          </div>
          <div class="jais-athlete-badges">
            <span class="jais-badge-admin" style="background: rgba(255, 255, 255, 0.08); color: #FFFFFF; border: 1px solid var(--fm-border);">
              ${escapeHtml(extractedGrade)}
            </span>
            ${isHouseCaptain ? `
              <span class="jais-badge-admin" style="background: rgba(234, 179, 8, 0.18); color: #FACC15; border: 1px solid rgba(234, 179, 8, 0.4); font-weight: 800;">
                👑 ${escapeHtml(sHouse?.name || '')} House Captain
              </span>
            ` : `
              <span class="jais-badge-admin" style="background: rgba(255, 255, 255, 0.08); color: var(--fm-text-secondary); border: 1px solid var(--fm-border);">
                ${escapeHtml(student.gender && student.gender !== 'General' ? student.gender : 'Juilliard Athlete')}
              </span>
            `}
            <span class="jais-badge-admin" style="background: ${sHouse ? (sHouse.glowColor || 'rgba(239, 68, 68, 0.2)') : 'rgba(255, 255, 255, 0.08)'}; color: ${houseColor}; border: 1px solid ${houseColor}; font-weight: 800;">
              ${escapeHtml(houseName)}
            </span>
          </div>
        </div>
      </div>

      <!-- Medals Cabinet -->
      <div style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 0.72rem; font-weight: 800; color: var(--fm-text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">
            Medal Cabinet
          </span>
          <span style="font-size: 0.72rem; font-weight: 800; color: var(--fm-gold);">
            ${stats.totalMedals} Total Podium Medals
          </span>
        </div>

        <div class="jais-medal-grid">
          <!-- Gold -->
          <div class="jais-medal-card" style="background: rgba(234, 179, 8, 0.08); border-color: rgba(234, 179, 8, 0.3);">
            <div class="jais-medal-icon">${ICONS.goldMedal}</div>
            <div class="jais-medal-count" style="color: var(--fm-gold);">${stats.gold}</div>
            <div class="jais-medal-label" style="color: var(--fm-gold);">Gold (1st)</div>
          </div>

          <!-- Silver -->
          <div class="jais-medal-card" style="background: rgba(148, 163, 184, 0.08); border-color: rgba(148, 163, 184, 0.3);">
            <div class="jais-medal-icon">${ICONS.silverMedal}</div>
            <div class="jais-medal-count" style="color: var(--fm-silver);">${stats.silver}</div>
            <div class="jais-medal-label" style="color: var(--fm-silver);">Silver (2nd)</div>
          </div>

          <!-- Bronze -->
          <div class="jais-medal-card" style="background: rgba(217, 119, 6, 0.08); border-color: rgba(217, 119, 6, 0.3);">
            <div class="jais-medal-icon">${ICONS.bronzeMedal}</div>
            <div class="jais-medal-count" style="color: var(--fm-bronze);">${stats.bronze}</div>
            <div class="jais-medal-label" style="color: var(--fm-bronze);">Bronze (3rd)</div>
          </div>

          <!-- 4th -->
          <div class="jais-medal-card" style="background: rgba(100, 116, 139, 0.08); border-color: rgba(100, 116, 139, 0.3);">
            <div class="jais-medal-icon">${ICONS.fourthMedal}</div>
            <div class="jais-medal-count" style="color: #94A3B8;">${stats.fourth}</div>
            <div class="jais-medal-label" style="color: #94A3B8;">4th Place</div>
          </div>
        </div>
      </div>

      <!-- Championship & Match Stats Grid -->
      <div style="margin-bottom: 1.25rem;">
        <div style="font-size: 0.72rem; font-weight: 800; color: var(--fm-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">
          Championship &amp; Match Stats
        </div>

        <div class="jais-stats-grid">
          <div class="jais-stat-card">
            <div class="jais-stat-val" style="color: var(--fm-gold);">${stats.totalMedals}</div>
            <div class="jais-stat-lbl">Medals Won</div>
          </div>

          <div class="jais-stat-card">
            <div class="jais-stat-val">${stats.eventsCount}</div>
            <div class="jais-stat-lbl">Events / Matches</div>
          </div>

          <div class="jais-stat-card">
            <div class="jais-stat-val" style="color: var(--fm-gold);">${stats.podiumRate}%</div>
            <div class="jais-stat-lbl">Podium Rate</div>
          </div>

          <div class="jais-stat-card">
            <div class="jais-stat-val" style="color: #38BDF8;">${stats.goals}</div>
            <div class="jais-stat-lbl">Goals Scored</div>
          </div>

          ${stats.basketballPoints > 0 ? `
            <div class="jais-stat-card">
              <div class="jais-stat-val" style="color: #60A5FA;">${stats.basketballPoints}</div>
              <div class="jais-stat-lbl">Basket Points</div>
            </div>
          ` : `
            <div class="jais-stat-card">
              <div class="jais-stat-val" style="color: #A855F7;">${stats.assists}</div>
              <div class="jais-stat-lbl">Assists</div>
            </div>
          `}

          <div class="jais-stat-card">
            <div class="jais-stat-val" style="color: #F43F5E;">${stats.goalInvolvements}</div>
            <div class="jais-stat-lbl">Goal Involvements</div>
          </div>
        </div>
      </div>

      <!-- Performance & Event History Log -->
      <div class="jais-section-card" style="margin: 0; padding: 0;">
        <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--fm-border); font-weight: 800; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
          <span>Event Performance History (${stats.history.length})</span>
          <span style="font-size: 0.7rem; color: var(--fm-green); font-weight: 700;">Live Sports Day</span>
        </div>

        ${stats.history.length > 0 ? `
          <div style="padding: 0.65rem; display: flex; flex-direction: column; gap: 0.5rem;">
            ${stats.history.map(item => {
              const itemHouse = houses.find(h => h.id === item.houseId) || {};
              return `
                <a href="#/event/${item.eventId}" class="jais-athlete-history-card">
                  <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <span style="font-size: 1.1rem; display: flex; align-items: center;">
                      ${item.placeType === 'gold' ? ICONS.goldMedal : item.placeType === 'silver' ? ICONS.silverMedal : item.placeType === 'bronze' ? ICONS.bronzeMedal : item.placeType === 'goal' ? ICONS.football : item.placeType === 'assist' ? ICONS.shoe : ICONS.fourthMedal}
                    </span>
                    <div>
                      <div style="font-weight: 800; font-size: 0.88rem; color: var(--fm-text-primary); margin-bottom: 2px;">
                        ${escapeHtml(item.eventName)}
                      </div>
                      <div style="font-size: 0.72rem; color: var(--fm-text-secondary); display: flex; align-items: center; gap: 4px;">
                        <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${itemHouse.color || '#888'};"></span>
                        <strong>${escapeHtml(itemHouse.name || item.houseId || 'House')}</strong>
                        &bull; ${escapeHtml(item.place)}
                        ${item.score ? `&bull; <span style="color: var(--fm-text-primary); font-weight: 700;">${escapeHtml(item.score)}</span>` : ''}
                      </div>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    ${item.points ? `
                      <span style="background: rgba(0, 230, 118, 0.12); color: var(--fm-green); border: 1px solid rgba(0, 230, 118, 0.25); font-size: 0.72rem; font-weight: 800; padding: 2px 6px; border-radius: 6px; white-space: nowrap;">
                        +${item.points} PTS
                      </span>
                    ` : `
                      <span style="font-size: 0.72rem; color: var(--fm-text-secondary);">&rarr;</span>
                    `}
                  </div>
                </a>
              `;
            }).join("")}
          </div>
        ` : `
          <div style="padding: 2.5rem 1rem; text-align: center; color: var(--fm-text-muted); font-size: 0.82rem;">
            <div style="margin-bottom: 0.5rem; color: var(--fm-gold); display: flex; justify-content: center;">${ICONS.trophy}</div>
            <div style="font-weight: 700; color: var(--fm-text-primary); margin-bottom: 0.25rem;">No Completed Results Yet</div>
            <p style="margin: 0 0 1rem; font-size: 0.78rem;">
              When ${escapeHtml(student.name)} finishes in any Track, Field, Novelty, or Football/Basketball event, their medals, points, scores, goals, and assists will automatically register here.
            </p>
            <button onclick="window.location.hash = '#/events'" class="jais-chip" style="margin: 0 auto; background: var(--fm-green); color: #000; font-weight: 800;">
              View Fixtures &amp; Events
            </button>
          </div>
        `}
      </div>

      <!-- Quick Back Nav -->
      <div style="margin-top: 1.25rem; display: flex; gap: 0.5rem;">
        <button onclick="window.location.hash = '#/admin/students'" class="jais-cta-btn" style="flex: 1; margin: 0; padding: 0.65rem; font-size: 0.8rem; background: var(--fm-surface); border: 1px solid var(--fm-border); color: var(--fm-text-primary);">
          &larr; All Students
        </button>
        <button onclick="window.location.hash = '#/table'" class="jais-cta-btn" style="flex: 1; margin: 0; padding: 0.65rem; font-size: 0.8rem; background: var(--fm-green); color: #000;">
          Standings Table
        </button>
      </div>
    </div>
  `;
}

/* ==========================================================================
   SCREEN: NEWS & MULTIMEDIA GALLERY (#/news, #/gallery)
   ========================================================================== */

let isNewsSubscribed = false;

/**
 * Sticky top bar shared by the four main tab screens (Matches, Table, News, Houses)
 * so they all look and behave the same. `title` is shown on the left.
 */
function renderTabTopBar(title) {
  const isPref = isPrefectorialCup();
  const compLabel = isPref ? "Prefectship Cup" : "Inter-House Sports";
  const compIcon = isPref ? "🏆" : "🥇";
  return `
    <header class="jais-top-bar">
      <span class="jais-brand-logo" style="display: flex; align-items: center; gap: 8px;">
        <img src="assets/juilliard-logo.png" alt="Juilliard Academy" style="width: 26px; height: 26px; object-fit: contain; border-radius: 50%; background: #ffffff; padding: 1px; box-shadow: 0 1px 4px rgba(0,0,0,0.25);" />
        <span>${title}</span>
      </span>
      <div class="jais-top-actions" style="display: flex; align-items: center; gap: 6px;">
        <button type="button" class="jais-comp-switcher-btn" onclick="window.pages.openCompetitionSelectorModal()" title="Switch Tournament Cup" style="font-size: 0.72rem; padding: 2px 8px;">
          <span>${compIcon}</span>
          <span style="max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${compLabel}</span>
          <span class="caret">▾</span>
        </button>
        <button class="jais-icon-btn" onclick="window.toggleTheme()" title="Toggle Theme" aria-label="Toggle Theme">${ICONS.sun}</button>
      </div>
    </header>`;
}

export function renderNewsPage() {
  showScreen("screen-news");
  const container = document.getElementById("screen-news");
  if (!container) return;

  // Realtime subscription setup
  if (!isNewsSubscribed) {
    isNewsSubscribed = true;
    subscribeToNews({
      onNewsChange: () => {
        if (window.location.hash.includes("/news") || window.location.hash.includes("/gallery")) {
          renderNewsPage();
        }
      }
    });
  }

  const rawNews = getNewsItems();
  // Filter out any placeholder news items
  const allNews = rawNews.filter(n => !isPlaceholderNewsItem(n));
  if (rawNews.length !== allNews.length) {
    purgeAllPlaceholderNews().catch(() => {});
  }
  const isAdmin = isUserAdmin();

  // Filter items (General tournament categories & media types, NOT house-specific)
  let filtered = [...allNews];

  if (newsFilterType !== "all") {
    filtered = filtered.filter(item => (item.type || "").toLowerCase() === newsFilterType.toLowerCase());
  }

  if (newsFilterCategory !== "all") {
    filtered = filtered.filter(item => (item.category || "").toLowerCase() === newsFilterCategory.toLowerCase());
  }

  if (newsFilterTag !== "all") {
    const targetTag = newsFilterTag.toLowerCase().replace(/^#/, "");
    filtered = filtered.filter(item => {
      const tags = Array.isArray(item.tags) ? item.tags : [];
      return tags.some(t => String(t).toLowerCase().replace(/^#/, "") === targetTag);
    });
  }

  const videoCount = allNews.filter(n => n.type === "video").length;
  const photoCount = allNews.filter(n => n.type === "photo").length;

  const heroItem = filtered.length > 0 ? filtered[0] : null;
  const remainingItems = filtered.length > 1 ? filtered.slice(1) : [];

  container.innerHTML = `
    ${renderTabTopBar('NEWS<span class="plus">MEDIA</span>')}
    <!-- Competition Sub-Tabs Bar: Table | Fixtures | Houses | News -->
    <div class="jais-sub-tabs-bar" style="margin-bottom: 0.5rem;">
      <a href="#/table" class="jais-sub-tab">Table</a>
      <a href="#/events" class="jais-sub-tab">Fixtures</a>
      <a href="#/houses" class="jais-sub-tab">Houses</a>
      <a href="#/news" class="jais-sub-tab active">News &amp; Media</a>
    </div>

    <!-- Editorial Header Banner -->
    <div class="jais-news-header-banner">
      <div class="jais-news-header-row">
        <div class="jais-news-header-text">
          <div class="jais-news-kicker">${ICONS.news} Tournament Desk &bull; Sports Day 2026</div>
          <h1 class="jais-news-headline">Tournament News &amp; Highlights</h1>
          <p class="jais-news-subheading">Official general tournament news, race reports, photo galleries, and video highlights.</p>
        </div>
        <div class="jais-news-header-actions">
          <button onclick="window.pages.openAddMediaModal()" class="jais-news-publish-btn" title="Publish Tournament Story">
            <span style="font-size: 0.95rem; line-height: 1; font-weight: 900;">＋</span>
            <span>Publish Story</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Single Streamlined Filter Strip (General Sports Categories & Media Types) -->
    <div class="jais-news-pill-strip">
      <button class="jais-news-pill ${newsFilterCategory === 'all' && newsFilterType === 'all' && newsFilterTag === 'all' ? 'active' : ''}" onclick="window.pages.setNewsFilterCombined('all', 'all')">
        All Stories (${allNews.length})
      </button>
      <button class="jais-news-pill ${newsFilterType === 'video' ? 'active' : ''}" onclick="window.pages.setNewsFilterCombined('all', 'video')">
        <span style="display: flex; align-items: center;">${ICONS.video}</span> Videos (${videoCount})
      </button>
      <button class="jais-news-pill ${newsFilterType === 'photo' ? 'active' : ''}" onclick="window.pages.setNewsFilterCombined('all', 'photo')">
        <span style="display: flex; align-items: center;">${ICONS.camera}</span> Photos (${photoCount})
      </button>
      <button class="jais-news-pill ${newsFilterCategory === 'track' ? 'active' : ''}" onclick="window.pages.setNewsFilterCombined('track', 'all')">
        Track &amp; Sprints
      </button>
      <button class="jais-news-pill ${newsFilterCategory === 'field' ? 'active' : ''}" onclick="window.pages.setNewsFilterCombined('field', 'all')">
        Field Events
      </button>
      <button class="jais-news-pill ${newsFilterCategory === 'football' ? 'active' : ''}" onclick="window.pages.setNewsFilterCombined('football', 'all')">
        Football
      </button>
      <button class="jais-news-pill ${newsFilterCategory === 'basketball' ? 'active' : ''}" onclick="window.pages.setNewsFilterCombined('basketball', 'all')">
        Basketball
      </button>
      <button class="jais-news-pill ${newsFilterCategory === 'ceremony' ? 'active' : ''}" onclick="window.pages.setNewsFilterCombined('ceremony', 'all')">
        Ceremonies
      </button>
      <button class="jais-news-pill ${newsFilterCategory === 'novelty' ? 'active' : ''}" onclick="window.pages.setNewsFilterCombined('novelty', 'all')">
        Novelties
      </button>
    </div>

    ${newsFilterTag !== 'all' ? `
      <!-- Active Hashtag Filter Bar -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 1rem 0.75rem;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.75rem; color: var(--fm-text-secondary); font-weight: 700;">Filtered by tag:</span>
          <span class="jais-news-tag-btn" style="background: rgba(0, 230, 118, 0.2); border-color: var(--fm-green); color: var(--fm-green); font-size: 0.75rem; padding: 3px 9px;">
            #${escapeHtml(newsFilterTag)}
          </span>
        </div>
        <button onclick="window.pages.clearNewsTagFilter()" class="jais-chip" style="margin: 0; padding: 3px 10px; font-size: 0.7rem; font-weight: 700;">
          Clear Tag Filter &times;
        </button>
      </div>
    ` : ''}

    <!-- Main Editorial Content Stream -->
    <div class="jais-news-container" style="padding: 0 0.85rem 3rem;">
      ${filtered.length === 0 ? `
        <div style="padding: 3.5rem 1.25rem; text-align: center; color: var(--fm-text-muted); background: var(--fm-surface); border-radius: 14px; border: 1px solid var(--fm-border); margin-top: 0.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
          <div style="margin-bottom: 0.75rem; color: var(--fm-green); display: flex; justify-content: center; transform: scale(1.3);">${ICONS.news}</div>
          <div style="font-weight: 900; color: var(--fm-text-primary); font-size: 1.15rem; margin-bottom: 0.4rem;">
            ${newsFilterTag !== 'all' ? `No stories found for #${escapeHtml(newsFilterTag)}` : 'Juilliard Sports Day News Desk Ready'}
          </div>
          <p style="font-size: 0.82rem; color: var(--fm-text-secondary); max-width: 480px; margin: 0 auto 1.25rem; line-height: 1.5;">
            ${newsFilterTag !== 'all' ? `No published stories match the hashtag #${escapeHtml(newsFilterTag)}. Try clearing the tag or publish a new story.` : 'All placeholder mock stories have been removed. Live match commentaries, 100m sprint photo finishes, and video reels published by officials will appear here.'}
          </p>
          <div style="display: flex; gap: 0.65rem; justify-content: center; flex-wrap: wrap;">
            <button onclick="window.pages.openAddMediaModal()" class="jais-news-publish-btn" style="padding: 0.65rem 1.4rem; font-size: 0.85rem;">
              <span>＋</span>
              <span>Publish Story</span>
            </button>
            ${(newsFilterCategory !== 'all' || newsFilterType !== 'all' || newsFilterTag !== 'all') ? `
              <button onclick="window.pages.resetNewsFilters()" class="jais-chip" style="margin: 0; padding: 0.75rem 1.2rem; background: var(--fm-surface-active); color: var(--fm-text-primary); font-weight: 700; border-radius: 10px;">
                Reset All Filters
              </button>
            ` : ''}
          </div>
        </div>
      ` : `
        <!-- Lead Feature Story -->
        ${heroItem ? renderFeaturedHeroCard(heroItem, isAdmin) : ''}

        <!-- Remaining Stories Section -->
        ${remainingItems.length > 0 ? `
          <div style="display: flex; justify-content: space-between; align-items: center; margin: 1.25rem 0 0.65rem;">
            <div style="font-weight: 900; font-size: 0.95rem; color: var(--fm-text-primary); display: flex; align-items: center; gap: 6px;">
              <span>More Tournament Stories &amp; Updates</span>
            </div>
            <span style="font-size: 0.72rem; color: var(--fm-text-secondary); font-weight: 700;">${remainingItems.length} stories</span>
          </div>

          <div class="jais-news-feed">
            ${remainingItems.map(item => renderNewsCard(item, isAdmin)).join("")}
          </div>
        ` : ''}
      `}
    </div>
  `;
}

export function resetNewsFilters() {
  playTapSound();
  newsFilterType = "all";
  newsFilterCategory = "all";
  newsFilterTag = "all";
  renderNewsPage();
}

/**
 * Media for a news card. Images fall back to a neutral placeholder if they fail to load.
 * Video stories whose thumbnail fails fall back to the video's own first frame.
 */
function renderNewsMedia(item, mediaSrc) {
  if (!mediaSrc) return `<div class="jais-media-fallback">No image</div>`;
  const isVideo = item.type === "video";
  const videoFrame = isVideo && item.mediaUrl && !/^https?:\/\/images\./.test(item.mediaUrl) ? item.mediaUrl : null;
  const onErr = videoFrame
    ? `this.onerror=null;var v=document.createElement('video');v.src='${escapeHtml(videoFrame)}#t=0.5';v.preload='metadata';v.muted=true;v.playsInline=true;v.className='jais-media-fallback-video';this.replaceWith(v)`
    : `this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'jais-media-fallback',textContent:'Image unavailable'}))`;
  return `<img src="${escapeHtml(mediaSrc)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="${onErr}" />`;
}

function renderFeaturedHeroCard(item, isAdmin) {
  const isVideo = item.type === "video";
  const isPhoto = item.type === "photo";
  const mediaSrc = isVideo ? (item.videoThumbnail || item.mediaUrl) : (item.mediaUrl || item.galleryImages?.[0]);

  return `
    <div class="jais-news-hero-card" onclick="window.pages.handleMediaItemClick('${item.id}')">
      <div class="jais-news-hero-media">
        ${renderNewsMedia(item, mediaSrc)}

        ${isVideo ? `
          <div class="jais-video-play-overlay">
            ${ICONS.play}
          </div>
          ${item.videoDuration ? `<div class="jais-video-duration">${escapeHtml(item.videoDuration)}</div>` : ''}
        ` : ''}

        ${isPhoto && item.galleryImages?.length ? `
          <div class="jais-gallery-count">
            <span>${ICONS.camera}</span> ${item.galleryImages.length} Photos
          </div>
        ` : ''}
      </div>

      <div class="jais-news-hero-body">
        <div class="jais-news-hero-meta">
          <span class="jais-news-type-badge ${isVideo ? 'jais-badge-video' : (isPhoto ? 'jais-badge-photo' : 'jais-badge-article')}">
            ${isVideo ? 'VIDEO HIGHLIGHT' : (isPhoto ? 'PHOTO GALLERY' : 'TOURNAMENT REPORT')}
          </span>
          <span style="font-weight: 800; color: var(--fm-green); text-transform: uppercase;">
            ${escapeHtml(item.category || 'General')}
          </span>
          <span>&bull;</span>
          <span>${escapeHtml(item.formattedDate || 'Today')}</span>
        </div>

        <h2 class="jais-news-hero-title">${escapeHtml(item.title)}</h2>
        ${item.subtitle ? `<p class="jais-news-hero-excerpt">${escapeHtml(item.subtitle)}</p>` : ''}

        ${item.tags && item.tags.length ? `
          <div class="jais-news-tags" onclick="event.stopPropagation();">
            ${item.tags.map(t => `<button type="button" class="jais-news-tag-btn" onclick="window.pages.filterNewsByTag('${escapeHtml(t).replace(/'/g, "\\'")}', event)">#${escapeHtml(t)}</button>`).join("")}
          </div>
        ` : ''}

        <div class="jais-news-hero-footer" onclick="event.stopPropagation();">
          <span>By <strong>${escapeHtml(item.author || 'Sports Desk')}</strong></span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button id="hero-like-btn-${item.id}" 
                    data-like-news-id="${item.id}"
                    class="jais-like-btn ${isNewsStoryLiked(item.id) ? 'liked' : ''}" 
                    onclick="window.pages.likeNewsStory('${item.id}', event)" 
                    title="${isNewsStoryLiked(item.id) ? 'Unlike cheer' : 'Like and cheer'}">
              ${isNewsStoryLiked(item.id) ? ICONS.heart : ICONS.heartOutline}
              <span id="like-count-${item.id}" style="font-weight: 700;">${item.likes || 0}</span>
            </button>
            <button class="jais-comment-count-btn" 
                    onclick="window.pages.handleMediaItemClick('${item.id}')" 
                    title="View cheers &amp; comments">
              ${ICONS.comment}
              <span id="comment-count-${item.id}">${(item.comments && item.comments.length) || 0}</span>
            </button>
            <button type="button" class="jais-news-edit-btn" onclick="window.pages.openEditMediaModal('${item.id}', event)" title="Edit story and hashtags">
              ✏️ Edit
            </button>
            ${isAdmin ? `
              <button onclick="window.pages.deleteNewsStory('${item.id}', event)" style="background: none; border: none; color: #EF4444; font-size: 0.75rem; cursor: pointer; padding: 4px;" title="Delete story">
                ${ICONS.trash}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderNewsCard(item, isAdmin) {
  const isVideo = item.type === "video";
  const isPhoto = item.type === "photo";
  const mediaSrc = isVideo ? (item.videoThumbnail || item.mediaUrl) : (item.mediaUrl || item.galleryImages?.[0]);

  return `
    <div class="jais-news-item-compact" onclick="window.pages.handleMediaItemClick('${item.id}')">
      ${mediaSrc ? `
        <div class="jais-news-thumb-wrap">
          ${renderNewsMedia(item, mediaSrc)}
          ${isVideo ? `
            <div class="jais-video-play-overlay" style="width: 32px; height: 32px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            ${item.videoDuration ? `<div class="jais-video-duration" style="font-size: 0.6rem; padding: 1px 4px;">${escapeHtml(item.videoDuration)}</div>` : ''}
          ` : ''}
          ${isPhoto && item.galleryImages?.length ? `
            <div class="jais-gallery-count" style="font-size: 0.6rem; padding: 1px 4px;">
              ${item.galleryImages.length}P
            </div>
          ` : ''}
        </div>
      ` : ''}

      <div class="jais-news-compact-info">
        <div class="jais-news-compact-kicker">
          <span class="jais-news-type-badge ${isVideo ? 'jais-badge-video' : (isPhoto ? 'jais-badge-photo' : 'jais-badge-article')}" style="padding: 1px 5px; font-size: 0.6rem;">
            ${isVideo ? 'VIDEO' : (isPhoto ? 'PHOTO' : 'REPORT')}
          </span>
          <span>${escapeHtml(item.category || 'General')}</span>
        </div>

        <div class="jais-news-compact-title">${escapeHtml(item.title)}</div>

        ${item.content ? `<div class="jais-news-excerpt" style="font-size: 0.74rem; -webkit-line-clamp: 2;">${escapeHtml(item.content)}</div>` : ''}

        ${item.tags && item.tags.length ? `
          <div class="jais-news-tags" style="margin: 0.25rem 0; display: flex; gap: 4px; flex-wrap: wrap;" onclick="event.stopPropagation();">
            ${item.tags.slice(0, 3).map(t => `<button type="button" class="jais-news-tag-btn sm" onclick="window.pages.filterNewsByTag('${escapeHtml(t).replace(/'/g, "\\'")}', event)">#${escapeHtml(t)}</button>`).join("")}
          </div>
        ` : ''}

        <div class="jais-news-compact-meta" onclick="event.stopPropagation();">
          <span>${escapeHtml(item.formattedDate || 'Today')} &bull; ${escapeHtml(item.author || 'Sports Desk')}</span>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button id="card-like-btn-${item.id}" 
                    data-like-news-id="${item.id}"
                    class="jais-like-btn ${isNewsStoryLiked(item.id) ? 'liked' : ''}" 
                    onclick="window.pages.likeNewsStory('${item.id}', event)" 
                    style="padding: 2px 6px; font-size: 0.75rem;" 
                    title="${isNewsStoryLiked(item.id) ? 'Unlike story' : 'Like story'}">
              ${isNewsStoryLiked(item.id) ? ICONS.heart : ICONS.heartOutline}
              <span id="like-count-${item.id}" style="font-weight: 700;">${item.likes || 0}</span>
            </button>
            <button class="jais-comment-count-btn" 
                    onclick="window.pages.handleMediaItemClick('${item.id}')" 
                    style="padding: 2px 6px; font-size: 0.75rem;" 
                    title="View comments">
              ${ICONS.comment}
              <span id="comment-count-${item.id}">${(item.comments && item.comments.length) || 0}</span>
            </button>
            <button type="button" class="jais-news-edit-btn" style="padding: 2px 6px; font-size: 0.68rem;" onclick="window.pages.openEditMediaModal('${item.id}', event)" title="Edit story and hashtags">
              ✏️ Edit
            </button>
            ${isAdmin ? `
              <button onclick="window.pages.deleteNewsStory('${item.id}', event)" style="background: none; border: none; color: #EF4444; font-size: 0.72rem; cursor: pointer; padding: 2px;" title="Delete story">
                ${ICONS.trash}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function handleMediaItemClick(newsId) {
  playTapSound();
  const allNews = getNewsItems();
  const item = allNews.find(n => n.id === newsId);
  if (!item) return;

  if (item.type === "video") {
    openVideoModal(item.mediaUrl, item.title, item.subtitle, item.content, item);
  } else if (item.type === "photo") {
    openPhotoLightbox(item.mediaUrl || item.galleryImages?.[0], item.title, item.content, item.galleryImages, item);
  } else {
    openArticleModal(item);
  }
}

export function openVideoModal(videoUrl, title, subtitle, content, item = null) {
  document.getElementById("jais-video-modal-popup")?.remove();

  // Normalize / sanitize video URL to local assets if outdated or 403
  let resolvedUrl = (videoUrl || "").trim();
  if (resolvedUrl.includes("commondatastorage.googleapis.com") || resolvedUrl.includes("ForBiggerBlazes") || resolvedUrl.includes("football-highlight")) {
    resolvedUrl = "assets/videos/football-highlight.mp4";
  } else if (resolvedUrl.includes("ForBiggerEscapes") || resolvedUrl.includes("basketball-highlight")) {
    resolvedUrl = "assets/videos/basketball-highlight.mp4";
  }

  // Detect YouTube URL
  const ytMatch = resolvedUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  const ytEmbedUrl = ytMatch ? `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0` : null;

  const overlay = document.createElement("div");
  overlay.className = "jais-modal-backdrop";
  overlay.id = "jais-video-modal-popup";

  function closeModal() {
    const vid = overlay.querySelector("#jais-video-player-el");
    if (vid) {
      vid.pause();
      vid.removeAttribute("src");
      vid.load();
    }
    document.removeEventListener("keydown", onKeyDown);
    overlay.remove();
  }

  function onKeyDown(e) {
    if (e.key === "Escape") closeModal();
  }
  document.addEventListener("keydown", onKeyDown);

  overlay.onclick = (e) => {
    if (e.target === overlay) closeModal();
  };

  overlay.innerHTML = `
    <div class="jais-media-modal-card" style="max-width: 620px; max-height: 90vh; display: flex; flex-direction: column;">
      <div class="jais-media-modal-header" style="flex-shrink: 0;">
        <div style="font-weight: 800; font-size: 0.92rem; color: var(--fm-text-primary); display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <span>${ICONS.video}</span> <span>${escapeHtml(title)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          ${item ? `
            <button type="button" class="jais-news-edit-btn" onclick="document.getElementById('jais-video-modal-popup')?.remove(); window.pages.openEditMediaModal('${item.id}')" title="Edit story and hashtags">
              ✏️ Edit
            </button>
          ` : ''}
          <button class="jais-modal-close-btn" id="jais-video-close-btn" title="Close player">&times;</button>
        </div>
      </div>

      <div class="jais-media-modal-body" style="padding: 0.75rem; overflow-y: auto; flex: 1;">
        ${ytEmbedUrl ? `
          <div style="position: relative; width: 100%; aspect-ratio: 16/9; border-radius: 10px; overflow: hidden; background: #000;">
            <iframe src="${escapeHtml(ytEmbedUrl)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width: 100%; height: 100%; border: none;"></iframe>
          </div>
        ` : `
          <div style="position: relative; width: 100%; border-radius: 10px; overflow: hidden; background: #000;">
            <video id="jais-video-player-el"
                   controls
                   playsinline
                   preload="auto"
                   style="width: 100%; border-radius: 10px; background: #000; aspect-ratio: 16/9; max-height: 48vh; display: block; object-fit: contain;">
              <source src="${escapeHtml(resolvedUrl)}" type="video/mp4">
              Your browser does not support HTML5 video playback.
            </video>
            <div id="jais-video-err-box" style="display: none; padding: 0.85rem; background: rgba(239,68,68,0.15); border: 1px solid #EF4444; border-radius: 8px; margin: 8px; color: #FCA5A5; font-size: 0.8rem; text-align: center;">
              Video playback encountered an issue.
              <div style="margin-top: 6px;">
                <a href="${escapeHtml(resolvedUrl)}" target="_blank" style="color: var(--fm-green); font-weight: 700; text-decoration: underline;">Open direct video file</a>
              </div>
            </div>
          </div>
        `}

        <div style="padding: 0.75rem 0.25rem 0.25rem;">
          <div style="font-weight: 900; font-size: 1.05rem; color: var(--fm-text-primary); margin-bottom: 0.25rem;">
            ${escapeHtml(title)}
          </div>
          ${subtitle ? `<div style="font-size: 0.8rem; font-weight: 700; color: var(--fm-green); margin-bottom: 0.5rem;">${escapeHtml(subtitle)}</div>` : ''}
          <div style="font-size: 0.82rem; color: var(--fm-text-secondary); line-height: 1.5; white-space: pre-line;">
            ${escapeHtml(content || 'Official Juilliard Sports Day video match highlight.')}
          </div>
        </div>

        ${item ? renderCommentsSectionHtml(item) : ''}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector("#jais-video-close-btn")?.addEventListener("click", closeModal);

  if (!ytEmbedUrl) {
    const videoEl = overlay.querySelector("#jais-video-player-el");
    const errBox = overlay.querySelector("#jais-video-err-box");
    if (videoEl) {
      videoEl.src = resolvedUrl;
      videoEl.load();

      videoEl.onerror = (e) => {
        console.warn("Video playback error for URL:", resolvedUrl, e);
        if (errBox) errBox.style.display = "block";
      };

      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log("Unmuted autoplay restricted by browser policy; falling back to muted playback:", err);
          videoEl.muted = true;
          videoEl.play().catch(() => {});
        });
      }
    }
  }
}

export function openPhotoLightbox(photoUrl, title, content, galleryImages = null, item = null) {
  document.getElementById("jais-photo-lightbox-popup")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "jais-modal-backdrop";
  overlay.id = "jais-photo-lightbox-popup";
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  overlay.innerHTML = `
    <div class="jais-media-modal-card" style="max-width: 620px; max-height: 90vh; display: flex; flex-direction: column;">
      <div class="jais-media-modal-header" style="flex-shrink: 0;">
        <div style="font-weight: 800; font-size: 0.92rem; color: var(--fm-text-primary); display: flex; align-items: center; gap: 6px;">
          <span>${ICONS.camera}</span> ${escapeHtml(title)}
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          ${item ? `
            <button type="button" class="jais-news-edit-btn" onclick="document.getElementById('jais-photo-lightbox-popup')?.remove(); window.pages.openEditMediaModal('${item.id}')" title="Edit story and hashtags">
              ✏️ Edit
            </button>
          ` : ''}
          <button class="jais-modal-close-btn" onclick="document.getElementById('jais-photo-lightbox-popup')?.remove()">&times;</button>
        </div>
      </div>

      <div class="jais-media-modal-body" style="padding: 0.75rem; overflow-y: auto; flex: 1;">
        <img id="jais-active-lightbox-img" src="${escapeHtml(photoUrl)}" alt="${escapeHtml(title)}" style="width: 100%; border-radius: 10px; max-height: 50vh; object-fit: contain; background: #000;" />

        ${galleryImages && galleryImages.length > 1 ? `
          <div style="display: flex; gap: 6px; overflow-x: auto; padding: 0.5rem 0; margin-top: 0.4rem;">
            ${galleryImages.map((imgSrc, idx) => `
              <img src="${escapeHtml(imgSrc)}" alt="Thumb ${idx + 1}" 
                   onclick="document.getElementById('jais-active-lightbox-img').src = '${escapeHtml(imgSrc)}'"
                   style="width: 55px; height: 55px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid var(--fm-border);" />
            `).join("")}
          </div>
        ` : ''}

        <div style="padding: 0.65rem 0.25rem 0.25rem;">
          <div style="font-weight: 900; font-size: 1rem; color: var(--fm-text-primary); margin-bottom: 0.25rem;">
            ${escapeHtml(title)}
          </div>
          <div style="font-size: 0.82rem; color: var(--fm-text-secondary); line-height: 1.5; white-space: pre-line;">
            ${escapeHtml(content || 'Official Juilliard Sports Day photo capture.')}
          </div>
        </div>

        ${item ? renderCommentsSectionHtml(item) : ''}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

export function openArticleModal(item) {
  document.getElementById("jais-article-modal-popup")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "jais-modal-backdrop";
  overlay.id = "jais-article-modal-popup";
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  overlay.innerHTML = `
    <div class="jais-media-modal-card" style="max-width: 580px; max-height: 90vh; display: flex; flex-direction: column;">
      <div class="jais-media-modal-header" style="flex-shrink: 0;">
        <div style="font-weight: 800; font-size: 0.92rem; color: var(--fm-text-primary); display: flex; align-items: center; gap: 6px;">
          <span>${ICONS.news}</span> Match Report &amp; Commentary
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          ${item ? `
            <button type="button" class="jais-news-edit-btn" onclick="document.getElementById('jais-article-modal-popup')?.remove(); window.pages.openEditMediaModal('${item.id}')" title="Edit story and hashtags">
              ✏️ Edit
            </button>
          ` : ''}
          <button class="jais-modal-close-btn" onclick="document.getElementById('jais-article-modal-popup')?.remove()">&times;</button>
        </div>
      </div>

      <div class="jais-media-modal-body" style="padding: 1rem; overflow-y: auto; flex: 1;">
        ${item.mediaUrl ? `
          <img src="${escapeHtml(item.mediaUrl)}" alt="${escapeHtml(item.title)}" style="width: 100%; border-radius: 10px; max-height: 38vh; object-fit: cover; margin-bottom: 0.75rem;" />
        ` : ''}
        
        <div style="font-size: 0.72rem; color: var(--fm-green); font-weight: 800; text-transform: uppercase; margin-bottom: 0.25rem;">
          ${escapeHtml(item.category || 'Special Feature')} &bull; ${escapeHtml(item.formattedDate || 'Today')}
        </div>
        
        <h2 style="font-size: 1.25rem; font-weight: 900; color: var(--fm-text-primary); margin: 0 0 0.4rem; line-height: 1.25;">
          ${escapeHtml(item.title)}
        </h2>

        ${item.subtitle ? `
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 0.75rem; line-height: 1.4;">
            ${escapeHtml(item.subtitle)}
          </div>
        ` : ''}

        <div style="font-size: 0.85rem; color: var(--fm-text-primary); line-height: 1.6; white-space: pre-line; border-top: 1px solid var(--fm-border); padding-top: 0.75rem;">
          ${escapeHtml(item.content || '')}
        </div>

        <div style="margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--fm-border); font-size: 0.72rem; color: var(--fm-text-muted);">
          Author: <strong>${escapeHtml(item.author || 'Sports Secretariat')}</strong>
        </div>

        ${renderCommentsSectionHtml(item)}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

export const MEDIA_ACTION_PRESETS = [
  {
    key: "sprint",
    label: "🏃 100m Sprint",
    title: "100m Dash Thriller: Explosive Straightaway Sprint",
    subtitle: "Blistering pace from lane 4 leaves spectators cheering",
    cat: "Track",
    type: "photo",
    tags: "Track, 100m, Sprint, Final",
    url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
    content: "An electrifying start to the sprint finals as competitors burst from the blocks with phenomenal acceleration down the main track."
  },
  {
    key: "relay",
    label: "🎽 4x100m Relay",
    title: "4x100m Relay Showdown: Crucial Baton Handover",
    subtitle: "Precision exchange at zone 3 decides podium finish",
    cat: "Track",
    type: "photo",
    tags: "Track, Relay, 4x100m, Team",
    url: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80",
    content: "The pinnacle of Sports Day teamwork was on display as anchor runners powered towards the finish line following flawless baton handovers."
  },
  {
    key: "football",
    label: "⚽ Football Final",
    title: "Academy Football Championship: Dramatic Match Winner",
    subtitle: "Clinical finish in the final minutes seals victory",
    cat: "Football",
    type: "photo",
    tags: "Football, Championship, Pitch, Goal",
    url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
    content: "A masterclass performance on the academy pitch with sensational passing, rock-solid defense, and an exhilarating championship atmosphere."
  },
  {
    key: "basketball",
    label: "🏀 Basketball Court",
    title: "Court Clash: Fast-Break Showdown Electrifies Crowd",
    subtitle: "High-flying jump shots and fast transitions",
    cat: "Basketball",
    type: "photo",
    tags: "Basketball, Court, Fastbreak, Hoops",
    url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
    content: "The indoor sports complex came alive as fast breaks, rim attacks, and perimeter shooting kept fans on the edge of their seats."
  },
  {
    key: "podium",
    label: "🥇 Medal Ceremony",
    title: "Medal Ceremony: Champions Crowned on the Podium",
    subtitle: "Gold, silver, and bronze awarded in celebration",
    cat: "Ceremony",
    type: "photo",
    tags: "Ceremony, Medals, Gold, Podium",
    url: "https://images.unsplash.com/photo-1569517282132-25d22f4573e6?auto=format&fit=crop&w=1200&q=80",
    content: "Athletes proudly stepped onto the podium to receive their official championship medals in front of teachers, parents, and fellow housemates."
  },
  {
    key: "video",
    label: "🎥 Video Reel",
    title: "Official Match Highlight Reel: Decisive Action",
    subtitle: "Catch top plays and pivotal championship moments in motion",
    cat: "Track",
    type: "video",
    tags: "Video, Highlights, Action, Motion",
    url: "assets/videos/basketball-highlight.mp4",
    content: "Watch the thrilling highlight reel showcasing the athletic speed, skill, and heart of the Juilliard Interhouse championship."
  }
];

export function applyNewsPreset(index) {
  playTapSound();
  const p = MEDIA_ACTION_PRESETS[index];
  if (!p) return;
  const titleInp = document.getElementById("new-media-title");
  const subInp = document.getElementById("new-media-subtitle");
  const catInp = document.getElementById("new-media-cat");
  const typeInp = document.getElementById("new-media-type");
  const urlInp = document.getElementById("new-media-url");
  const contentInp = document.getElementById("new-media-content");
  const tagsInp = document.getElementById("new-media-tags");

  if (titleInp) titleInp.value = p.title;
  if (subInp) subInp.value = p.subtitle;
  if (catInp) catInp.value = p.cat;
  if (typeInp) typeInp.value = p.type;
  if (urlInp) {
    urlInp.value = p.url;
    updateMediaModalPreview(p.url, p.type);
  }
  if (contentInp) contentInp.value = p.content;
  if (tagsInp) tagsInp.value = p.tags;
  showToastNotification(`Loaded preset: ${p.label}`, "info");
}

/**
 * Client-side canvas image compressor to ensure Firestore document stays well within 1MB limit
 */
function compressImageToBase64(file, maxWidth = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const base64Data = canvas.toDataURL("image/jpeg", quality);
        resolve(base64Data);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function handleNewsFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  playTapSound();
  try {
    showToastNotification("Compressing image for cloud storage...", "info");
    const base64 = await compressImageToBase64(file, 1280, 0.82);
    const urlInp = document.getElementById("new-media-url");
    if (urlInp) urlInp.value = base64;
    const typeSelect = document.getElementById("new-media-type");
    if (typeSelect && typeSelect.value === "video") {
      typeSelect.value = "photo";
    }
    const sizeKb = Math.round(base64.length / 1024);
    updateMediaModalPreview(base64, "photo", sizeKb);
    showToastNotification(`Photo converted to base64 (${sizeKb} KB)!`, "success");
  } catch (err) {
    console.error("Image upload/compression error:", err);
    showToastNotification("Could not load image: " + err.message, "error");
  }
}

export function handleNewsVideoFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  playTapSound();
  const sizeKb = Math.round(file.size / 1024);
  if (file.size > 800 * 1024) {
    alert(`Video file size is ${sizeKb} KB.\n\nFirestore documents have a 1MB limit for direct base64 video clips (recommended <= 750 KB).\n\nTip: For longer videos, upload to YouTube or Vimeo and paste the link below, or compress your video clip to under 750 KB.`);
    return;
  }
  showToastNotification("Loading video clip...", "info");
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const urlInp = document.getElementById("new-media-url");
    if (urlInp) urlInp.value = dataUrl;
    const typeSelect = document.getElementById("new-media-type");
    if (typeSelect) typeSelect.value = "video";
    updateMediaModalPreview(dataUrl, "video", sizeKb);
    showToastNotification(`Video clip loaded (${sizeKb} KB base64)!`, "success");
  };
  reader.readAsDataURL(file);
}

export function updateMediaModalPreview(url, type, sizeKb = null) {
  const previewContainer = document.getElementById("media-preview-container");
  if (!previewContainer) return;
  if (!url || !url.trim()) {
    previewContainer.style.display = "none";
    return;
  }
  previewContainer.style.display = "block";

  // Check YouTube link
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch) {
    const ytId = ytMatch[1];
    const thumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    previewContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="font-size: 0.68rem; font-weight: 800; color: #EF4444; text-transform: uppercase;">Media Preview (YouTube Embed):</span>
        <span style="font-size: 0.65rem; color: var(--fm-text-muted);">Auto-streams in player</span>
      </div>
      <div style="position: relative; border-radius: 8px; overflow: hidden; background: #000; height: 160px;">
        <img src="${thumbUrl}" alt="YouTube preview" style="width: 100%; height: 100%; object-fit: cover;" />
        <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.35);">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: #EF4444; color: #fff; display: flex; align-items: center; justify-content: center; padding-left: 3px;">
            ${ICONS.play}
          </div>
        </div>
      </div>
    `;
    return;
  }

  const isVideo = type === "video" || url.startsWith("data:video") || url.endsWith(".mp4") || url.endsWith(".webm");
  const sizeBadge = sizeKb ? `<span style="font-size: 0.65rem; font-weight: 700; background: rgba(0,230,118,0.15); color: var(--fm-green); padding: 1px 6px; border-radius: 4px;">${sizeKb} KB (Base64)</span>` : '';

  if (isVideo) {
    previewContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="font-size: 0.68rem; font-weight: 800; color: var(--fm-green); text-transform: uppercase;">Media Preview (Video Clip):</span>
        ${sizeBadge}
      </div>
      <video src="${escapeHtml(url)}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; background: #000;" controls muted></video>
    `;
  } else {
    previewContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="font-size: 0.68rem; font-weight: 800; color: var(--fm-green); text-transform: uppercase;">Media Preview (Photo):</span>
        ${sizeBadge}
      </div>
      <img src="${escapeHtml(url)}" alt="Preview" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; border: 1px solid var(--fm-border);" onerror="this.onerror=null;this.parentElement.style.display='none';" />
    `;
  }
}

export function openAddMediaModal() {
  if (isUserAdmin()) {
    openMediaStoryEditor(null);
    return;
  }
  promptOfficialAccessForStoryEdit(null);
}

export function openEditMediaModal(newsId, event) {
  if (event) event.stopPropagation();
  if (isUserAdmin()) {
    openMediaStoryEditor(newsId);
    return;
  }
  promptOfficialAccessForStoryEdit(newsId);
}

/**
 * Swift Official Authentication Prompt for Editing / Publishing Stories
 */
export function promptOfficialAccessForStoryEdit(newsId = null) {
  playTapSound();
  document.getElementById("jais-official-unlock-modal")?.remove();

  const isEditing = Boolean(newsId);
  const overlay = document.createElement("div");
  overlay.className = "jais-modal-backdrop";
  overlay.id = "jais-official-unlock-modal";

  overlay.innerHTML = `
    <div class="jais-media-modal-card" style="max-width: 440px; padding: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.5rem;">🔒</span>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--fm-text-primary);">
              ${isEditing ? 'Official Story Editor Access' : 'Publish Story Access'}
            </div>
            <div style="font-size: 0.72rem; color: var(--fm-text-secondary);">
              Select official profile or enter official PIN (2026) to proceed:
            </div>
          </div>
        </div>
        <button class="jais-modal-close-btn" onclick="document.getElementById('jais-official-unlock-modal')?.remove()">&times;</button>
      </div>

      <div style="background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">
        <div style="font-size: 0.68rem; font-weight: 800; color: var(--fm-text-secondary); text-transform: uppercase; margin-bottom: 6px; display: flex; justify-content: space-between;">
          <span>⚡ 1-Tap Official Profile Select</span>
          <span style="color: var(--fm-green);">Instant Unlock</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <button type="button" class="btn btn-outline" style="text-align: left; padding: 0.55rem 0.75rem; font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center;" onclick="window.pages.quickUnlockOfficial('osaruyi', '${newsId || ''}')">
            <span>👤 <strong>Osaruyi Aideyan</strong> (Super Admin)</span>
            <span style="color: var(--fm-green); font-size: 0.72rem; font-weight: 700;">Unlock &rarr;</span>
          </button>
          <button type="button" class="btn btn-outline" style="text-align: left; padding: 0.55rem 0.75rem; font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center;" onclick="window.pages.quickUnlockOfficial('david', '${newsId || ''}')">
            <span>👤 <strong>David Festus</strong> (Chief Scrutineer)</span>
            <span style="color: var(--fm-green); font-size: 0.72rem; font-weight: 700;">Unlock &rarr;</span>
          </button>
        </div>
      </div>

      <form onsubmit="window.pages.handleOfficialPinSubmit(event, '${newsId || ''}')" style="display: flex; flex-direction: column; gap: 0.65rem;">
        <div>
          <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 3px;">
            Or Enter Official PIN
          </label>
          <input type="password" id="official-unlock-pin" class="jais-text-input" placeholder="Enter PIN 2026..."
                 style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.6rem 0.75rem; color: var(--fm-text-primary); font-size: 0.9rem;" autofocus />
        </div>

        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.25rem;">
          <button type="button" onclick="document.getElementById('jais-official-unlock-modal')?.remove()" style="padding: 0.55rem 0.85rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 8px; font-size: 0.78rem; font-weight: 700; color: var(--fm-text-secondary); cursor: pointer;">
            Cancel
          </button>
          <button type="submit" class="jais-news-publish-btn" style="padding: 0.55rem 1.1rem; font-size: 0.82rem;">
            Unlock &amp; Open Editor &rarr;
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => { document.getElementById("official-unlock-pin")?.focus(); }, 80);
}

export function quickUnlockOfficial(profile, newsId) {
  playTapSound();
  let sess = null;
  if (profile === "osaruyi") {
    sess = {
      id: "ADM-003",
      adminId: "ADM-003",
      email: "osaruyiaideyan@gmail.com",
      name: "Osaruyi Aideyan",
      title: "Super Administrator & Scrutineer",
      role: "super_admin",
      isAdmin: true,
      loginTimestamp: new Date().toISOString(),
      loginFormatted: "Active Session"
    };
  } else {
    sess = {
      id: "ADM-001",
      adminId: "ADM-001",
      email: "davidfestusugwu@gmail.com",
      name: "David Festus",
      title: "Chief Scrutineer & System Administrator",
      role: "super_admin",
      isAdmin: true,
      loginTimestamp: new Date().toISOString(),
      loginFormatted: "Active Session"
    };
  }

  localStorage.setItem("juilliard_active_admin_session", JSON.stringify(sess));
  sessionStorage.setItem("juilliard_active_admin_session", JSON.stringify(sess));
  document.getElementById("jais-official-unlock-modal")?.remove();
  showToastNotification(`Welcome, ${sess.name}! Story editor unlocked.`, "success");
  openMediaStoryEditor(newsId || null);
}

export function handleOfficialPinSubmit(event, newsId) {
  event.preventDefault();
  playTapSound();
  const pin = (document.getElementById("official-unlock-pin")?.value || "").trim().toLowerCase();
  if (pin === "2026" || pin === "admin" || pin === "festus") {
    quickUnlockOfficial("david", newsId);
  } else if (pin === "osaruyi" || pin === "osaruyiaideyan@gmail.com") {
    quickUnlockOfficial("osaruyi", newsId);
  } else {
    showToastNotification("Incorrect official PIN. Try 2026 or tap a profile above.", "warning");
  }
}

// Global active hashtags state for story editor
let currentEditorHashtags = [];

export function renderActiveStoryTags() {
  const container = document.getElementById("active-hashtags-container");
  const hiddenInput = document.getElementById("new-media-tags");
  const countBadge = document.getElementById("hashtag-count-badge");
  if (!container) return;

  if (hiddenInput) {
    hiddenInput.value = currentEditorHashtags.join(", ");
  }
  if (countBadge) {
    countBadge.innerText = `${currentEditorHashtags.length} ${currentEditorHashtags.length === 1 ? 'tag' : 'tags'}`;
  }

  if (currentEditorHashtags.length === 0) {
    container.innerHTML = `<span style="font-size: 0.72rem; color: var(--fm-text-muted); font-style: italic;">No hashtags added yet. Type below and tap &ldquo;＋ Add Tag&rdquo; or select a suggestion.</span>`;
    return;
  }

  container.innerHTML = currentEditorHashtags.map((tag, idx) => {
    const displayTag = tag.startsWith("#") ? tag : `#${tag}`;
    const safeTag = escapeHtml(displayTag);
    return `
      <span class="jais-active-tag-chip">
        <span>${safeTag}</span>
        <button type="button" class="jais-remove-tag-btn" onclick="window.pages.removeStoryHashtag(${idx})" title="Remove ${safeTag}">
          &times;
        </button>
      </span>
    `;
  }).join("");
}

export function appendHashtag(tag) {
  playTapSound();
  if (!tag) return;
  const clean = tag.trim().replace(/^#/, "");
  if (!clean) return;
  const formatted = `#${clean}`;
  if (!currentEditorHashtags.includes(formatted)) {
    currentEditorHashtags.push(formatted);
    renderActiveStoryTags();
  }
  const input = document.getElementById("new-hashtag-input");
  if (input) input.focus();
}

export function addStoryHashtagFromInput() {
  playTapSound();
  const input = document.getElementById("new-hashtag-input");
  if (!input) return;
  const val = input.value.trim();
  if (!val) {
    input.focus();
    return;
  }

  const rawTags = val.split(/[,\s]+/).map(t => t.trim().replace(/^#/, "")).filter(Boolean);
  rawTags.forEach(t => {
    const formatted = `#${t}`;
    if (!currentEditorHashtags.includes(formatted)) {
      currentEditorHashtags.push(formatted);
    }
  });

  input.value = "";
  renderActiveStoryTags();
  input.focus();
}

export function removeStoryHashtag(index) {
  playTapSound();
  if (typeof index === "number" && index >= 0 && index < currentEditorHashtags.length) {
    currentEditorHashtags.splice(index, 1);
    renderActiveStoryTags();
  }
}

export function openMediaStoryEditor(newsId = null) {
  playTapSound();
  document.getElementById("jais-add-media-modal")?.remove();

  const allNews = getNewsItems();
  const existing = newsId ? allNews.find(n => n.id === newsId) : null;
  const isEditing = !!existing;

  // Initialize hashtags list from existing story or defaults
  currentEditorHashtags = [];
  if (existing && Array.isArray(existing.tags) && existing.tags.length > 0) {
    currentEditorHashtags = existing.tags.map(t => t.startsWith("#") ? t : `#${t}`);
  } else if (existing?.category) {
    currentEditorHashtags = [`#${existing.category}`];
  } else {
    currentEditorHashtags = ["#SportsDay2026"];
  }

  const overlay = document.createElement("div");
  overlay.className = "jais-modal-backdrop";
  overlay.id = "jais-add-media-modal";

  overlay.innerHTML = `
    <div class="jais-media-modal-card" style="max-width: 530px; max-height: 92vh; display: flex; flex-direction: column;">
      <div class="jais-media-modal-header" style="flex-shrink: 0;">
        <div style="font-weight: 800; font-size: 0.95rem; color: var(--fm-text-primary); display: flex; align-items: center; gap: 6px;">
          <span style="color: ${isEditing ? '#60A5FA' : 'var(--fm-green)'}; font-size: 1.1rem;">${isEditing ? '✏️' : '📰'}</span>
          <span>${isEditing ? 'Edit Story &amp; Hashtags' : 'Publish Sports Day Story &amp; Media'}</span>
        </div>
        <button class="jais-modal-close-btn" onclick="document.getElementById('jais-add-media-modal')?.remove()">&times;</button>
      </div>

      <div class="jais-media-modal-body" style="padding: 1rem; overflow-y: auto; flex: 1;">
        ${!isEditing ? `
          <!-- Sports Action Presets Quick Toolbar -->
          <div style="margin-bottom: 0.85rem; padding: 0.65rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 10px;">
            <div style="font-size: 0.68rem; font-weight: 800; color: var(--fm-text-secondary); text-transform: uppercase; margin-bottom: 6px; display: flex; justify-content: space-between;">
              <span>⚡ One-Tap Sports Action Presets</span>
              <span style="color: var(--fm-green);">Auto-fills form</span>
            </div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              ${MEDIA_ACTION_PRESETS.map((p, idx) => `
                <button type="button" class="jais-preset-chip" onclick="window.pages.applyNewsPreset(${idx})">
                  ${p.label}
                </button>
              `).join('')}
            </div>
          </div>
        ` : `
          <div style="margin-bottom: 0.85rem; padding: 0.6rem 0.75rem; background: rgba(96, 165, 250, 0.1); border: 1px solid rgba(96, 165, 250, 0.3); border-radius: 8px; font-size: 0.74rem; color: #93C5FD; display: flex; align-items: center; gap: 6px;">
            <span>ℹ️</span>
            <span>Editing story: <strong>${escapeHtml(existing.title)}</strong></span>
          </div>
        `}

        <form onsubmit="window.pages.handleSaveMediaStory(event)" style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${isEditing ? `<input type="hidden" id="edit-media-id" value="${escapeHtml(existing.id)}" />` : ''}

          <div>
            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 3px;">
              Story Headline / Title *
            </label>
            <input type="text" id="new-media-title" class="jais-text-input" placeholder="e.g. Phoenix Secures 1st Place in Boys 4x100m Relay" required
                   value="${escapeHtml(existing?.title || '')}"
                   style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.55rem 0.75rem; color: var(--fm-text-primary); font-size: 0.85rem;" />
          </div>

          <div>
            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 3px;">
              Subtitle / Highlight Summary
            </label>
            <input type="text" id="new-media-subtitle" class="jais-text-input" placeholder="e.g. Unbelievable anchor leg puts Phoenix on the podium"
                   value="${escapeHtml(existing?.subtitle || '')}"
                   style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.55rem 0.75rem; color: var(--fm-text-primary); font-size: 0.85rem;" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem;">
            <div>
              <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 3px;">
                Media Type *
              </label>
              <select id="new-media-type" class="jais-text-input" onchange="window.pages.updateMediaModalPreview(document.getElementById('new-media-url')?.value, this.value)" style="width: 100%; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.55rem; color: var(--fm-text-primary); font-size: 0.82rem;">
                <option value="photo" ${existing?.type === 'photo' ? 'selected' : ''}>Photo Story</option>
                <option value="video" ${existing?.type === 'video' ? 'selected' : ''}>Video Highlight</option>
                <option value="article" ${existing?.type === 'article' ? 'selected' : ''}>Article / Report</option>
              </select>
            </div>

            <div>
              <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 3px;">
                Category *
              </label>
              <select id="new-media-cat" class="jais-text-input" style="width: 100%; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.55rem; color: var(--fm-text-primary); font-size: 0.82rem;">
                <option value="Track" ${existing?.category === 'Track' ? 'selected' : ''}>Track &amp; Sprints</option>
                <option value="Field" ${existing?.category === 'Field' ? 'selected' : ''}>Field Events</option>
                <option value="Football" ${existing?.category === 'Football' ? 'selected' : ''}>Football</option>
                <option value="Basketball" ${existing?.category === 'Basketball' ? 'selected' : ''}>Basketball</option>
                <option value="Novelty" ${existing?.category === 'Novelty' ? 'selected' : ''}>Novelty</option>
                <option value="Ceremony" ${existing?.category === 'Ceremony' ? 'selected' : ''}>Ceremony</option>
              </select>
            </div>
          </div>

          <!-- Photo & Video Upload & URL Entry -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; flex-wrap: wrap; gap: 4px;">
              <label style="font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary);">
                Media Photo or Video Source *
              </label>
              <div style="display: flex; gap: 6px;">
                <label for="new-media-file-input" style="font-size: 0.7rem; font-weight: 700; color: var(--fm-green); cursor: pointer; display: flex; align-items: center; gap: 3px; background: rgba(0, 230, 118, 0.1); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(0, 230, 118, 0.25);">
                  <span>📷 Photo (Base64)</span>
                </label>
                <input type="file" id="new-media-file-input" accept="image/*" style="display: none;" onchange="window.pages.handleNewsFileUpload(event)" />
                
                <label for="new-media-video-input" style="font-size: 0.7rem; font-weight: 700; color: #60A5FA; cursor: pointer; display: flex; align-items: center; gap: 3px; background: rgba(96, 165, 250, 0.1); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(96, 165, 250, 0.25);">
                  <span>🎥 Video Clip</span>
                </label>
                <input type="file" id="new-media-video-input" accept="video/mp4,video/webm,video/quicktime" style="display: none;" onchange="window.pages.handleNewsVideoFileUpload(event)" />
              </div>
            </div>
            <input type="text" id="new-media-url" class="jais-text-input" placeholder="Paste image/video link, YouTube URL, or upload from device above" required
                   value="${escapeHtml(existing?.mediaUrl || '')}"
                   oninput="window.pages.updateMediaModalPreview(this.value, document.getElementById('new-media-type')?.value)"
                   style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.55rem 0.75rem; color: var(--fm-text-primary); font-size: 0.82rem;" />
            <div style="font-size: 0.68rem; color: var(--fm-text-muted); margin-top: 4px;">
              Tip: Supports direct photo upload (compressed to base64), short video clips (&le; 750KB base64), or YouTube video links (e.g. <code>https://youtu.be/...</code>).
            </div>
          </div>

          <!-- Live Media Preview Box -->
          <div id="media-preview-container" style="${existing?.mediaUrl ? 'display: block;' : 'display: none;'} padding: 0.5rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 8px;"></div>

          <div>
            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 3px;">
              Video Duration (if video highlight, e.g. "1:24")
            </label>
            <input type="text" id="new-media-duration" class="jais-text-input" placeholder="1:30"
                   value="${escapeHtml(existing?.videoDuration || '')}"
                   style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.55rem 0.75rem; color: var(--fm-text-primary); font-size: 0.82rem;" />
          </div>

          <div>
            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 3px;">
              Story Content / Match Commentary *
            </label>
            <textarea id="new-media-content" rows="4" class="jais-text-input" placeholder="Describe the athletic action, key scorers, times, and race highlights alongside the media..." required
                      style="width: 100%; box-sizing: border-box; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.55rem 0.75rem; color: var(--fm-text-primary); font-size: 0.82rem; resize: vertical;">${escapeHtml(existing?.content || '')}</textarea>
          </div>

          <!-- Dedicated Interactive Hashtags Section Card -->
          <div class="jais-hashtag-section-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label style="font-size: 0.75rem; font-weight: 800; color: var(--fm-text-primary); display: flex; align-items: center; gap: 5px;">
                <span style="color: var(--fm-green); font-size: 0.9rem;">#️⃣</span>
                <span>Story Hashtags</span>
              </label>
              <span style="font-size: 0.65rem; color: var(--fm-text-muted); font-weight: 700;" id="hashtag-count-badge">0 tags</span>
            </div>

            <!-- Active Hashtags List with Remove (×) Buttons -->
            <div id="active-hashtags-container" class="jais-active-hashtags-container"></div>

            <!-- Dedicated Field for New Hashtags -->
            <div style="margin-bottom: 8px;">
              <label for="new-hashtag-input" style="display: block; font-size: 0.7rem; font-weight: 700; color: var(--fm-text-secondary); margin-bottom: 3px;">
                Field for New Hashtags (Type new tag and press Enter or tap &ldquo;＋ Add Tag&rdquo;)
              </label>
              <div class="jais-new-hashtag-group">
                <div class="jais-hashtag-input-wrapper">
                  <span class="jais-hashtag-prefix">#</span>
                  <input type="text" id="new-hashtag-input" class="jais-text-input" placeholder="e.g. FootballFinal, Phoenix, 100mSprint"
                         onkeydown="if (event.key === 'Enter') { event.preventDefault(); window.pages.addStoryHashtagFromInput(); }"
                         style="width: 100%; box-sizing: border-box; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.5rem 0.75rem 0.5rem 1.85rem; color: var(--fm-text-primary); font-size: 0.82rem;" />
                </div>
                <button type="button" id="btn-add-hashtag" onclick="window.pages.addStoryHashtagFromInput()" class="jais-add-tag-btn">
                  ＋ Add Tag
                </button>
              </div>
            </div>

            <!-- Hidden input holding current tags for form submission -->
            <input type="hidden" id="new-media-tags" value="" />

            <!-- Quick-Add Suggestion Chips -->
            <div>
              <div style="font-size: 0.65rem; font-weight: 700; color: var(--fm-text-secondary); text-transform: uppercase; margin-bottom: 4px; display: flex; justify-content: space-between;">
                <span>⚡ Quick-Add Suggestions</span>
                <span style="color: var(--fm-green);">Tap any tag below</span>
              </div>
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                ${["#SportsDay2026", "#FootballFinal", "#Basketball", "#100mSprint", "#Relay4x100m", "#HighJump", "#Phoenix", "#Swift", "#Merlin", "#Eagle", "#GoldMedal", "#BronzePlayoff", "#Podium", "#Novelty", "#MarchPast"].map(tag => `
                  <button type="button" class="jais-tag-suggestion-chip" onclick="window.pages.appendHashtag('${tag}')">
                    ${tag}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.35rem;">
            <button type="button" onclick="document.getElementById('jais-add-media-modal')?.remove()" style="padding: 0.65rem 1rem; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 8px; font-size: 0.8rem; font-weight: 700; color: var(--fm-text-secondary); cursor: pointer;">
              Cancel
            </button>
            <button type="submit" class="jais-news-publish-btn" style="padding: 0.65rem 1.4rem; font-size: 0.85rem; ${isEditing ? 'background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); box-shadow: 0 3px 12px rgba(37,99,235,0.35);' : ''}">
              ${isEditing ? 'Save Changes &rarr;' : 'Publish Story &rarr;'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Render initial active hashtag chips
  renderActiveStoryTags();

  if (existing?.mediaUrl) {
    updateMediaModalPreview(existing.mediaUrl, existing.type);
  }
}

export async function handleSaveMediaStory(event) {
  event.preventDefault();
  playTapSound();
  const editId = document.getElementById("edit-media-id")?.value || null;
  const title = document.getElementById("new-media-title")?.value.trim() || "";
  const subtitle = document.getElementById("new-media-subtitle")?.value.trim() || "";
  let type = document.getElementById("new-media-type")?.value || "photo";
  const category = document.getElementById("new-media-cat")?.value || "Track";
  const mediaUrl = document.getElementById("new-media-url")?.value.trim() || "";
  const videoDuration = document.getElementById("new-media-duration")?.value.trim() || "1:00";
  const content = document.getElementById("new-media-content")?.value.trim() || "";
  const rawTags = document.getElementById("new-media-tags")?.value.trim() || "";
  const tags = currentEditorHashtags && currentEditorHashtags.length > 0 
    ? currentEditorHashtags.map(t => t.replace(/^#/, "").trim()).filter(Boolean)
    : (rawTags ? rawTags.split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean) : [category]);

  if (!title) {
    showToastNotification("Please enter a story headline.", "warning");
    return;
  }
  if (!mediaUrl) {
    showToastNotification("Please select a preset photo, video clip, or enter a URL.", "warning");
    return;
  }

  // Detect YouTube URL
  const ytMatch = mediaUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && type !== "video") {
    type = "video";
  }

  let videoThumbnail = null;
  if (type === "video") {
    if (ytMatch) {
      videoThumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    } else if (mediaUrl.startsWith("data:video") || mediaUrl.endsWith(".mp4") || mediaUrl.endsWith(".webm")) {
      videoThumbnail = "assets/juilliard-logo.png";
    } else {
      videoThumbnail = mediaUrl;
    }
  } else {
    videoThumbnail = mediaUrl;
  }

  const currentAdmin = getCurrentAdmin();
  const now = new Date();

  if (editId) {
    const allNews = getNewsItems();
    const existing = allNews.find(n => n.id === editId) || {};
    const updatedStory = {
      ...existing,
      id: editId,
      title,
      subtitle,
      type,
      category,
      mediaUrl,
      videoThumbnail,
      videoDuration: type === "video" ? videoDuration : null,
      galleryImages: type === "photo" ? (existing.galleryImages?.length ? existing.galleryImages : [mediaUrl]) : [],
      content,
      tags,
      author: existing.author || (currentAdmin ? `${currentAdmin.name} (${currentAdmin.adminId || 'ADM'})` : "Sports Secretariat"),
      updatedAt: now.toISOString(),
      lastEditedBy: currentAdmin ? {
        adminId: currentAdmin.adminId || currentAdmin.id || "ADM-001",
        name: currentAdmin.name || "Admin Official",
        email: currentAdmin.email || ""
      } : {
        adminId: "ADM-001",
        name: "Sports Secretariat Official",
        email: ""
      }
    };

    try {
      await saveNewsItem(updatedStory);
      playScoreCelebration();
      document.getElementById("jais-add-media-modal")?.remove();
      showToastNotification("Story and hashtags updated successfully!", "success");
      renderNewsPage();
    } catch (err) {
      showToastNotification("Error updating story: " + err.message, "error");
    }
    return;
  }

  const newStory = {
    title,
    subtitle,
    type,
    category,
    mediaUrl,
    videoThumbnail,
    videoDuration: type === "video" ? videoDuration : null,
    galleryImages: type === "photo" ? [mediaUrl] : [],
    content,
    tags,
    likes: 0,
    likedBy: [],
    comments: [],
    author: currentAdmin ? `${currentAdmin.name} (${currentAdmin.adminId || 'ADM'})` : "Sports Secretariat",
    timestamp: now.toISOString(),
    formattedDate: formatAdminTimestamp(now)
  };

  try {
    await saveNewsItem(newStory);
    playScoreCelebration();
    document.getElementById("jais-add-media-modal")?.remove();
    showToastNotification("Story published successfully to tournament desk!", "success");
    renderNewsPage();
  } catch (err) {
    showToastNotification("Error publishing story: " + err.message, "error");
  }
}

export async function deleteNewsStory(newsId, event) {
  if (event) event.stopPropagation();
  if (!confirm("Are you sure you want to remove this media story?")) return;

  try {
    await deleteNewsItem(newsId);
    playTapSound();
    renderNewsPage();
  } catch (err) {
    alert("Error deleting news item: " + err.message);
  }
}

// Set to prevent rapid spam clicking / race conditions on likes
const inFlightLikes = new Set();

export async function likeNewsStory(newsId, event) {
  if (event) event.stopPropagation();
  if (inFlightLikes.has(newsId)) return;
  inFlightLikes.add(newsId);
  playTapSound();
  try {
    const result = await toggleNewsLike(newsId);
    
    // Update all like buttons with data-like-news-id or explicit IDs
    const allLikeBtns = document.querySelectorAll(`[data-like-news-id="${newsId}"], #hero-like-btn-${newsId}, #card-like-btn-${newsId}, #modal-like-btn-${newsId}`);
    allLikeBtns.forEach(btn => {
      if (result.liked) {
        btn.classList.add("liked");
        btn.setAttribute("title", "Unlike cheer");
        btn.innerHTML = `${ICONS.heart} <span id="like-count-${newsId}" style="font-weight: 700;">${result.likes}</span>`;
      } else {
        btn.classList.remove("liked");
        btn.setAttribute("title", "Like and cheer");
        btn.innerHTML = `${ICONS.heartOutline} <span id="like-count-${newsId}" style="font-weight: 700;">${result.likes}</span>`;
      }
    });

    // Update any standalone like counters
    const countEls = document.querySelectorAll(`[id="like-count-${newsId}"]`);
    countEls.forEach(el => { el.innerText = result.likes; });

    if (result.liked) {
      showToastNotification("Cheer liked! ❤️", "success");
    } else {
      showToastNotification("Like removed", "info");
    }
  } catch (err) {
    console.warn("Could not toggle like:", err);
  } finally {
    inFlightLikes.delete(newsId);
  }
}

/**
 * Supporters & Fans Cheer Comments Component
 */
function renderCommentsSectionHtml(item) {
  const comments = Array.isArray(item.comments) ? item.comments : [];
  const currentUserName = getCurrentUserName();
  const isPref = isPrefectorialCup();
  const supportedHouseId = isPref 
    ? (localStorage.getItem("juilliard_supported_pref_team") || "team-ihechukwu")
    : (localStorage.getItem("juilliard_supported_house") || "phoenix");
  
  const allTeams = [...INITIAL_HOUSES, ...INITIAL_PREFECTORIAL_TEAMS];
  const house = allTeams.find(h => h.id === supportedHouseId);
  const isAdmin = isUserAdmin();

  return `
    <div class="jais-comments-section" id="comments-section-${item.id}">
      <div class="jais-comments-header">
        <div style="font-weight: 900; font-size: 0.92rem; color: var(--fm-text-primary); display: flex; align-items: center; gap: 6px;">
          <span>${ICONS.comment}</span>
          <span>Supporter Cheers &amp; Comments</span>
          <span style="font-size: 0.72rem; color: var(--fm-green); font-weight: 800; background: rgba(0,230,118,0.12); padding: 2px 7px; border-radius: 9999px;">
            ${comments.length}
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="modal-like-btn-${item.id}" 
                  data-like-news-id="${item.id}"
                  class="jais-like-btn ${isNewsStoryLiked(item.id) ? 'liked' : ''}" 
                  onclick="window.pages.likeNewsStory('${item.id}', event)"
                  title="${isNewsStoryLiked(item.id) ? 'Unlike cheer' : 'Cheer with like'}">
            ${isNewsStoryLiked(item.id) ? ICONS.heart : ICONS.heartOutline}
            <span id="like-count-${item.id}" style="font-weight: 700;">${item.likes || 0}</span>
          </button>
        </div>
      </div>

      <!-- Comments Stream -->
      <div class="jais-comments-list" id="comments-list-${item.id}">
        ${comments.length === 0 ? `
          <div class="jais-comments-empty" style="text-align: center; padding: 1.25rem 0.5rem; color: var(--fm-text-muted); font-size: 0.8rem;">
            No cheers yet. Be the first to leave a cheer or reaction for this story!
          </div>
        ` : comments.map(c => renderSingleCommentHtml(item.id, c, isAdmin)).join("")}
      </div>

      <!-- Post Comment Input Form -->
      <div class="jais-comment-input-wrap">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="font-size: 0.72rem; color: var(--fm-text-secondary); display: flex; align-items: center; gap: 6px;">
            <span>Posting as: <strong id="jais-comment-current-user-display" style="color: var(--fm-text-primary);">${escapeHtml(currentUserName)}</strong></span>
            ${house ? `
              <span class="jais-comment-badge" style="background: ${house.color}22; color: ${house.color}; border: 1px solid ${house.color}55;">
                ${escapeHtml(house.name)}
              </span>
            ` : ''}
          </div>
          <button type="button" onclick="window.pages.promptChangeUserName()" style="background: none; border: none; font-size: 0.68rem; color: var(--fm-green); cursor: pointer; text-decoration: underline; padding: 0;">
            Change Name
          </button>
        </div>

        <!-- Quick Reaction Emoji Chips -->
        <div style="display: flex; gap: 4px; margin-bottom: 6px; overflow-x: auto; padding-bottom: 2px;">
          <button type="button" class="jais-preset-chip" onclick="window.pages.insertCommentEmoji('${item.id}', '🔥 Great run!')">🔥 Great run!</button>
          <button type="button" class="jais-preset-chip" onclick="window.pages.insertCommentEmoji('${item.id}', '🏆 Champions!')">🏆 Champions!</button>
          <button type="button" class="jais-preset-chip" onclick="window.pages.insertCommentEmoji('${item.id}', '👏 Proud of the team!')">👏 Proud!</button>
          <button type="button" class="jais-preset-chip" onclick="window.pages.insertCommentEmoji('${item.id}', '⚡ Unbelievable speed!')">⚡ Speed!</button>
        </div>

        <div style="display: flex; gap: 6px;">
          <input type="text" id="comment-input-${item.id}" 
                 class="jais-text-input" 
                 placeholder="Write a cheer or comment..." 
                 maxlength="300"
                 onkeydown="if(event.key === 'Enter') window.pages.handlePostComment('${item.id}')"
                 style="flex: 1; background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 8px; padding: 0.5rem 0.75rem; color: var(--fm-text-primary); font-size: 0.82rem;" />
          <button type="button" 
                  onclick="window.pages.handlePostComment('${item.id}')"
                  class="jais-cta-btn" 
                  style="margin: 0; padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: 800; background: var(--fm-green); color: #000; border-radius: 8px; white-space: nowrap;">
            Cheer &rarr;
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderSingleCommentHtml(newsId, comment, isAdmin) {
  const currentUserName = getCurrentUserName();
  const isAuthor = comment.author && comment.author.toLowerCase() === currentUserName.toLowerCase();
  const canDelete = isAdmin || isAuthor;
  const allTeams = [...INITIAL_HOUSES, ...INITIAL_PREFECTORIAL_TEAMS];
  const house = allTeams.find(h => h.id === comment.houseId);
  const houseColor = house ? house.color : "var(--fm-green)";

  return `
    <div class="jais-comment-item" id="comment-node-${comment.id}">
      <div class="jais-comment-avatar" style="border-color: ${houseColor};">
        ${house ? `<img src="assets/crests/${house.id}.svg" alt="${house.name}" onerror="this.innerText='${(comment.author || 'S').charAt(0).toUpperCase()}'" />` : (comment.author || 'S').charAt(0).toUpperCase()}
      </div>
      <div class="jais-comment-body">
        <div class="jais-comment-meta">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="jais-comment-author">${escapeHtml(comment.author || 'Supporter')}</span>
            ${house ? `
              <span class="jais-comment-badge" style="background: ${houseColor}22; color: ${houseColor}; border: 1px solid ${houseColor}44;">
                ${escapeHtml(house.name)}
              </span>
            ` : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="jais-comment-time">${escapeHtml(comment.formattedDate || 'Just now')}</span>
            ${canDelete ? `
              <button onclick="window.pages.handleDeleteComment('${newsId}', '${comment.id}')" 
                      style="background: none; border: none; color: var(--fm-text-muted); font-size: 0.68rem; cursor: pointer; padding: 0;" 
                      title="Delete cheer">
                ${ICONS.cross}
              </button>
            ` : ''}
          </div>
        </div>
        <div class="jais-comment-text">${escapeHtml(comment.text)}</div>
      </div>
    </div>
  `;
}

export async function handlePostComment(newsId) {
  playTapSound();
  const inputEl = document.getElementById(`comment-input-${newsId}`);
  if (!inputEl) return;
  const text = inputEl.value.trim();
  if (!text) {
    showToastNotification("Please enter a cheer or comment.", "warning");
    return;
  }

  let author = getCurrentUserName();
  if (!author || author === "Supporter") {
    const savedName = localStorage.getItem("jais_user_name");
    if (!savedName) {
      const prompted = prompt("Enter your name or nickname for this cheer:", "");
      if (prompted && prompted.trim()) {
        localStorage.setItem("jais_user_name", prompted.trim());
        author = prompted.trim();
      }
    }
  }

  const isPref = isPrefectorialCup();
  const supportedHouseId = isPref
    ? (localStorage.getItem("juilliard_supported_pref_team") || "team-ihechukwu")
    : (localStorage.getItem("juilliard_supported_house") || "phoenix");

  try {
    const result = await addNewsComment(newsId, {
      author,
      houseId: supportedHouseId,
      text
    });

    inputEl.value = "";
    playScoreCelebration();
    showToastNotification("Cheer posted!", "success");

    // Re-render the comments list inside modal
    const listEl = document.getElementById(`comments-list-${newsId}`);
    if (listEl && result.item?.comments) {
      const isAdmin = isUserAdmin();
      listEl.innerHTML = result.item.comments.map(c => renderSingleCommentHtml(newsId, c, isAdmin)).join("");
    }
    // Also update comment count badges on cards
    const cardCountEls = document.querySelectorAll(`[id="comment-count-${newsId}"]`);
    cardCountEls.forEach(el => {
      el.textContent = (result.item?.comments && result.item.comments.length) || 0;
    });
  } catch (err) {
    showToastNotification("Could not post cheer: " + err.message, "error");
  }
}

export async function handleDeleteComment(newsId, commentId) {
  if (!confirm("Delete this cheer comment?")) return;
  playTapSound();
  try {
    const result = await deleteNewsComment(newsId, commentId);
    if (result.success && result.item) {
      const listEl = document.getElementById(`comments-list-${newsId}`);
      if (listEl) {
        const isAdmin = isUserAdmin();
        const comments = result.item.comments || [];
        if (comments.length === 0) {
          listEl.innerHTML = `<div class="jais-comments-empty" style="text-align: center; padding: 1.25rem 0.5rem; color: var(--fm-text-muted); font-size: 0.8rem;">No cheers yet. Be the first to leave a cheer!</div>`;
        } else {
          listEl.innerHTML = comments.map(c => renderSingleCommentHtml(newsId, c, isAdmin)).join("");
        }
      }
      const cardCountEls = document.querySelectorAll(`[id="comment-count-${newsId}"]`);
      cardCountEls.forEach(el => {
        el.textContent = (result.item.comments && result.item.comments.length) || 0;
      });
      showToastNotification("Cheer removed", "info");
    }
  } catch (err) {
    showToastNotification("Could not delete cheer: " + err.message, "error");
  }
}

export function insertCommentEmoji(newsId, emojiText) {
  playTapSound();
  const inputEl = document.getElementById(`comment-input-${newsId}`);
  if (inputEl) {
    inputEl.value = (inputEl.value ? inputEl.value + " " : "") + emojiText;
    inputEl.focus();
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ==========================================================================
   DESKTOP 3-COLUMN PORTAL EXPANSION
   Dynamic renderers for Desktop Sidebars & Global Search (>= 1024px)
   ========================================================================== */

export function renderDesktopSidebars() {
  const leftSidebar = document.getElementById("desktop-sidebar-left");
  const rightSidebar = document.getElementById("desktop-sidebar-right");
  if (!leftSidebar && !rightSidebar) return;

  const currentHash = window.location.hash || "";
  const isOnboarding = currentHash.includes("/onboarding") || currentHash.includes("/welcome") || document.body.classList.contains("onboarding-active");
  if (isOnboarding) {
    if (leftSidebar) leftSidebar.style.display = "none";
    if (rightSidebar) rightSidebar.style.display = "none";
    return;
  }
  if (leftSidebar) leftSidebar.style.display = "";
  if (rightSidebar) rightSidebar.style.display = "";

  const { houses, events } = getCachedData();
  const allNews = getNewsItems();

  // LEFT SIDEBAR:
  // 1. Overall House Standings (Gold/Silver/Bronze/Total)
  // 2. Categories & Competition Links
  if (leftSidebar) {
    const sortedHouses = [...houses].sort((a, b) => {
      if ((b.goldCount || 0) !== (a.goldCount || 0)) return (b.goldCount || 0) - (a.goldCount || 0);
      if ((b.silverCount || 0) !== (a.silverCount || 0)) return (b.silverCount || 0) - (a.silverCount || 0);
      if ((b.bronzeCount || 0) !== (a.bronzeCount || 0)) return (b.bronzeCount || 0) - (a.bronzeCount || 0);
      return (b.totalPoints || 0) - (a.totalPoints || 0);
    });

    const isPref = isPrefectorialCup();

    leftSidebar.innerHTML = `
      <!-- Interhouse / Prefectorial Medal Standings Card -->
      <div class="jais-sidebar-card">
        <div class="jais-sidebar-card-title">
          <span>${isPref ? 'Team Standings' : 'House Standings'}</span>
          <a href="#/table" style="font-size: 0.7rem; color: var(--fm-green); text-decoration: none; font-weight: 700;">Full Table &rarr;</a>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${sortedHouses.map((h, idx) => {
            const totalMedals = (h.goldCount || 0) + (h.silverCount || 0) + (h.bronzeCount || 0);
            return `
              <a href="#/house/${h.id}" class="jais-sidebar-house-row">
                <div class="jais-sidebar-house-info">
                  <span class="jais-sidebar-house-rank">${idx + 1}</span>
                  <div style="width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fff; padding: 1px; flex-shrink: 0; box-shadow: 0 1px 4px rgba(0,0,0,0.15);">
                    <img src="assets/crests/${h.id}.svg" alt="${h.name}" style="width: 100%; height: 100%; object-fit: contain;" />
                  </div>
                  <span class="jais-sidebar-house-name">${escapeHtml(h.name)}</span>
                </div>
                <div class="jais-sidebar-house-medals">
                  <span style="color: var(--fm-gold);" title="Gold">${h.goldCount || 0}G</span>
                  <span style="color: var(--fm-silver);" title="Silver">${h.silverCount || 0}S</span>
                  <span style="color: var(--fm-bronze);" title="Bronze">${h.bronzeCount || 0}B</span>
                  <span style="color: var(--fm-text-muted); font-size: 0.7rem; margin-left: 2px;">(${totalMedals})</span>
                </div>
              </a>
            `;
          }).join("")}
        </div>
      </div>

      <!-- Quick Categories & Competitions Card -->
      <div class="jais-sidebar-card">
        <div class="jais-sidebar-card-title">
          <span>Categories</span>
        </div>
        <nav style="display: flex; flex-direction: column; gap: 3px;">
          <a href="#/events" class="jais-sidebar-cat-link ${eventsCategoryFilter === 'all' ? 'active' : ''}" onclick="window.pages.setEventsCategoryFilter('all')">
            <span style="display: flex; align-items: center; width: 16px;">${ICONS.calendar}</span>
            <span>All Fixtures &amp; Heats</span>
          </a>
          <a href="#/events" class="jais-sidebar-cat-link ${eventsCategoryFilter === 'track' ? 'active' : ''}" onclick="window.pages.setEventsCategoryFilter('track')">
            <span style="display: flex; align-items: center; width: 16px;">${ICONS.running}</span>
            <span>Track &amp; Sprint Races</span>
          </a>
          <a href="#/events" class="jais-sidebar-cat-link ${eventsCategoryFilter === 'field' ? 'active' : ''}" onclick="window.pages.setEventsCategoryFilter('field')">
            <span style="display: flex; align-items: center; width: 16px;">${ICONS.target}</span>
            <span>Field &amp; Jump Events</span>
          </a>
          <a href="#/events" class="jais-sidebar-cat-link ${eventsCategoryFilter === 'team' ? 'active' : ''}" onclick="window.pages.setEventsCategoryFilter('team')">
            <span style="display: flex; align-items: center; width: 16px;">${ICONS.football}</span>
            <span>Football &amp; Basketball</span>
          </a>
          <a href="#/events" class="jais-sidebar-cat-link ${eventsCategoryFilter === 'novelty' ? 'active' : ''}" onclick="window.pages.setEventsCategoryFilter('novelty')">
            <span style="display: flex; align-items: center; width: 16px;">${ICONS.novelty}</span>
            <span>Novelty &amp; Spirit</span>
          </a>
          <a href="#/table" class="jais-sidebar-cat-link">
            <span style="display: flex; align-items: center; width: 16px;">${ICONS.trophy}</span>
            <span>Standings &amp; Points</span>
          </a>
          <a href="#/houses" class="jais-sidebar-cat-link">
            <span style="display: flex; align-items: center; width: 16px;">${ICONS.house}</span>
            <span>House Profiles &amp; Rosters</span>
          </a>
          ${isUserAdmin() ? `
            <a href="#/admin" class="jais-sidebar-cat-link" style="color: var(--fm-green);">
              <span style="display: flex; align-items: center; width: 16px;">${ICONS.judge}</span>
              <span>Scoring Console (Admin)</span>
            </a>
          ` : ''}
        </nav>
      </div>
    `;
  }

  // RIGHT SIDEBAR:
  // 1. Featured Media Highlight
  // 2. Stories List
  // 3. Button to News/Gallery
  if (rightSidebar) {
    const featured = allNews.length > 0 ? allNews[0] : null;
    const stories = allNews.length > 1 ? allNews.slice(1, 4) : [];
    const isAdmin = isUserAdmin();

    rightSidebar.innerHTML = `
      <div class="jais-sidebar-card">
        <div class="jais-sidebar-card-title">
          <span>Highlights &amp; Stories</span>
          <a href="#/news" style="font-size: 0.7rem; color: var(--fm-green); text-decoration: none; font-weight: 700;">View All &rarr;</a>
        </div>

        ${featured ? `
          <div class="jais-sidebar-featured-media" onclick="window.location.hash = '#/news'">
            <div style="position: relative; width: 100%; height: 140px; background: #000; overflow: hidden;">
              <img src="${featured.videoThumbnail || featured.mediaUrl}" alt="${escapeHtml(featured.title)}" style="width: 100%; height: 100%; object-fit: cover;" />
              ${featured.type === 'video' ? `
                <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.35);">
                  <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--fm-green); color: #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
                ${featured.videoDuration ? `
                  <span style="position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.8); color: #fff; font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                    ${featured.videoDuration}
                  </span>
                ` : ''}
              ` : ''}
            </div>
            <div style="padding: 0.75rem;">
              <div style="font-size: 0.68rem; font-weight: 800; color: var(--fm-green); text-transform: uppercase; margin-bottom: 3px;">
                ${escapeHtml(featured.category || 'Featured')}
              </div>
              <div style="font-weight: 800; font-size: 0.85rem; color: var(--fm-text-primary); line-height: 1.35; margin-bottom: 4px;">
                ${escapeHtml(featured.title)}
              </div>
              <div style="font-size: 0.7rem; color: var(--fm-text-muted);">
                ${featured.formattedDate || 'Live Sports Day Coverage'}
              </div>
            </div>
          </div>

          <!-- Stories List -->
          ${stories.length > 0 ? `
            <div style="display: flex; flex-direction: column;">
              ${stories.map(s => `
                <a href="#/news" class="jais-sidebar-news-item">
                  <img src="${s.videoThumbnail || s.mediaUrl}" alt="${escapeHtml(s.title)}" class="jais-sidebar-news-thumb" />
                  <div class="jais-sidebar-news-text">
                    <div class="jais-sidebar-news-title">${escapeHtml(s.title)}</div>
                    <div class="jais-sidebar-news-meta">${s.formattedDate || s.category} &bull; ${s.type === 'video' ? 'Video' : 'Photo'}</div>
                  </div>
                </a>
              `).join("")}
            </div>
          ` : ''}
        ` : `
          <div style="padding: 1.5rem 0.75rem; text-align: center; color: var(--fm-text-muted);">
            <div style="margin-bottom: 0.5rem; color: var(--fm-green); display: flex; justify-content: center;">${ICONS.news}</div>
            <div style="font-weight: 800; font-size: 0.85rem; color: var(--fm-text-primary); margin-bottom: 0.25rem;">No Stories Published Yet</div>
            <p style="font-size: 0.72rem; line-height: 1.4; margin: 0 0 0.85rem;">Official race reports, video replays, and photo galleries will appear here once published.</p>
            ${isAdmin ? `
              <button onclick="window.pages.openAddMediaModal()" class="jais-cta-btn" style="margin: 0 auto; padding: 0.45rem 0.85rem; font-size: 0.74rem; width: auto; display: inline-flex; align-items: center; gap: 4px;">
                + Publish First Story
              </button>
            ` : ''}
          </div>
        `}

        <a href="#/news" class="jais-cta-btn" style="margin-top: 0.85rem; padding: 0.55rem; font-size: 0.78rem; text-decoration: none; text-align: center; border-radius: 8px; display: block; font-weight: 800;">
          Open Media Gallery &amp; News
        </a>
      </div>
    `;
  }
}

export function handleDesktopSearch(query) {
  const q = (query || "").trim();
  if (!q) {
    closeUniversalSearch();
    return;
  }
  showUniversalSearchResults(q, "desktop-global-search");
}

/* ==========================================================================
   UNIVERSAL SEARCH ENGINE
   Searches across Events, Houses, Athletes/Students, and News stories.
   ========================================================================== */

let _searchDebounce = null;

/**
 * Perform a universal search across all data sources.
 * Returns categorized result arrays.
 */
function performUniversalSearch(query) {
  const q = query.toLowerCase().trim();
  if (!q) return { events: [], houses: [], students: [], news: [] };

  const { houses, events, students } = getCachedData();
  const allNews = getNewsItems();

  // Search Events
  const matchedEvents = events.filter(e => {
    const name = (e.name || "").toLowerCase();
    const category = (e.category || "").toLowerCase();
    const gender = (e.gender || "").toLowerCase();
    const status = (e.status || "").toLowerCase();
    const time = (e.time || "").toLowerCase();
    // Also search athlete names in results
    const athleteMatch = e.results && Object.values(e.results).some(r =>
      (r.athlete || "").toLowerCase().includes(q)
    );
    return name.includes(q) || category.includes(q) || gender.includes(q) ||
           status.includes(q) || time.includes(q) || athleteMatch;
  }).slice(0, 8);

  // Search Houses
  const matchedHouses = houses.filter(h => {
    const name = (h.name || "").toLowerCase();
    const motto = (h.motto || "").toLowerCase();
    const color = (h.color || "").toLowerCase();
    const captain = (h.captain || "").toLowerCase();
    const teachers = (h.teachers || []).join(" ").toLowerCase();
    return name.includes(q) || motto.includes(q) || color.includes(q) ||
           captain.includes(q) || teachers.includes(q);
  }).slice(0, 4);

  // Search Students / Athletes
  const matchedStudents = students.filter(s => {
    const name = (s.name || "").toLowerCase();
    const grade = (s.grade || "").toLowerCase();
    const gender = (s.gender || "").toLowerCase();
    const house = (s.houseId || "").toLowerCase();
    return name.includes(q) || grade.includes(q) || gender.includes(q) || house.includes(q);
  }).slice(0, 10);

  // Search News
  const matchedNews = allNews.filter(n => {
    const title = (n.title || "").toLowerCase();
    const subtitle = (n.subtitle || "").toLowerCase();
    const content = (n.content || "").toLowerCase();
    const category = (n.category || "").toLowerCase();
    const author = (n.author || "").toLowerCase();
    const tags = (n.tags || []).join(" ").toLowerCase();
    return title.includes(q) || subtitle.includes(q) || content.includes(q) ||
           category.includes(q) || author.includes(q) || tags.includes(q);
  }).slice(0, 6);

  return {
    events: matchedEvents,
    houses: matchedHouses,
    students: matchedStudents,
    news: matchedNews
  };
}

/**
 * Render and show the universal search results dropdown.
 */
function showUniversalSearchResults(query, inputId) {
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(() => {
    _renderSearchDropdown(query, inputId);
  }, 120);
}

function _renderSearchDropdown(query, inputId) {
  // Remove any existing dropdown
  document.getElementById("jais-universal-search-dropdown")?.remove();

  const q = query.trim();
  if (!q) return;

  const results = performUniversalSearch(q);
  const totalCount = results.events.length + results.houses.length +
                     results.students.length + results.news.length;

  if (totalCount === 0) {
    _showSearchDropdownEl(`
      <div class="jais-search-empty">
        <div style="color: var(--fm-text-muted); margin-bottom: 4px;">${ICONS.search}</div>
        <div>No results found for "<strong>${escapeHtml(q)}</strong>"</div>
        <div style="font-size: 0.72rem; color: var(--fm-text-muted); margin-top: 4px;">Try searching events, ${isPrefectorialCup() ? 'teams' : 'houses'}, athletes, or news</div>
      </div>
    `, inputId);
    return;
  }

  const { houses: cachedHouses } = getCachedData();

  let html = '';

  // Events section
  if (results.events.length > 0) {
    html += `<div class="jais-search-section">
      <div class="jais-search-section-title">${ICONS.calendar} Events (${results.events.length})</div>
      ${results.events.map(e => {
        const isLive = isEventLive(e);
        const isDone = e.status === "completed" || e.status === "done";
        const statusLabel = isLive ? 'LIVE' : (isDone ? 'DONE' : 'UPCOMING');
        const statusColor = isLive ? '#EF4444' : (isDone ? 'var(--fm-text-secondary)' : 'var(--fm-text-muted)');
        return `
          <a href="#/event/${e.id}" class="jais-search-result-item" onclick="window.pages.closeUniversalSearch()">
            <div class="jais-search-result-icon" style="background: rgba(220,38,38,0.12); color: var(--fm-green);">
              ${ICONS.calendar}
            </div>
            <div class="jais-search-result-info">
              <div class="jais-search-result-title">${escapeHtml(e.name)}</div>
              <div class="jais-search-result-sub">${escapeHtml(e.category || '')} ${e.gender ? ' -- ' + escapeHtml(e.gender) : ''} ${e.time ? ' -- ' + escapeHtml(e.time) : ''}</div>
            </div>
            <span class="jais-search-result-badge" style="color: ${statusColor}; border-color: ${statusColor};">${statusLabel}</span>
          </a>
        `;
      }).join('')}
    </div>`;
  }

  // Houses section
  if (results.houses.length > 0) {
    const isPref = isPrefectorialCup();
    html += `<div class="jais-search-section">
      <div class="jais-search-section-title">${ICONS.house} ${isPref ? 'Teams' : 'Houses'} (${results.houses.length})</div>
      ${results.houses.map(h => `
        <a href="#/house/${h.id}" class="jais-search-result-item" onclick="window.pages.closeUniversalSearch()">
          <div class="jais-search-result-icon" style="background: ${h.color || 'var(--fm-green)'}22; overflow: hidden;">
            <img src="assets/crests/${h.id}.svg" alt="${escapeHtml(h.name)}" style="width: 22px; height: 22px; object-fit: contain;" />
          </div>
          <div class="jais-search-result-info">
            <div class="jais-search-result-title">${escapeHtml(h.name)}${isPref ? '' : ' House'}</div>
            <div class="jais-search-result-sub">${h.goldCount || 0}G ${h.silverCount || 0}S ${h.bronzeCount || 0}B -- ${escapeHtml(h.captain || '')}</div>
          </div>
          <span class="jais-search-result-badge" style="color: ${h.color || 'var(--fm-green)'}; border-color: ${h.color || 'var(--fm-green)'};">${h.name ? h.name.substring(0, 3).toUpperCase() : ''}</span>
        </a>
      `).join('')}
    </div>`;
  }

  // Students / Athletes section
  if (results.students.length > 0) {
    html += `<div class="jais-search-section">
      <div class="jais-search-section-title">${ICONS.running} Athletes (${results.students.length})</div>
      ${results.students.map(s => {
        const sHouse = cachedHouses.find(h => h.id === s.houseId);
        const initials = s.name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("");
        return `
          <a href="#/athlete/${encodeURIComponent(s.id || s.name)}" class="jais-search-result-item" onclick="window.pages.closeUniversalSearch()">
            <div class="jais-search-result-icon jais-search-avatar" style="background: ${sHouse?.color || 'var(--fm-green)'}33; color: ${sHouse?.color || 'var(--fm-green)'}; font-weight: 900; font-size: 0.7rem;">
              ${initials}
            </div>
            <div class="jais-search-result-info">
              <div class="jais-search-result-title">${escapeHtml(s.name)}</div>
              <div class="jais-search-result-sub">${escapeHtml(s.grade || '')} &bull; General Pool</div>
            </div>
          </a>
        `;
      }).join('')}
    </div>`;
  }

  // News section
  if (results.news.length > 0) {
    html += `<div class="jais-search-section">
      <div class="jais-search-section-title">${ICONS.news} News & Media (${results.news.length})</div>
      ${results.news.map(n => {
        const typeIcon = n.type === 'video' ? ICONS.video : (n.type === 'photo' ? ICONS.camera : ICONS.news);
        const typeLabel = n.type === 'video' ? 'VIDEO' : (n.type === 'photo' ? 'PHOTO' : 'ARTICLE');
        return `
          <a href="#/news" class="jais-search-result-item" onclick="window.pages.closeUniversalSearch(); setTimeout(() => window.pages.handleMediaItemClick('${n.id}'), 200);">
            <div class="jais-search-result-icon" style="background: rgba(220,38,38,0.12); color: var(--fm-green);">
              ${typeIcon}
            </div>
            <div class="jais-search-result-info">
              <div class="jais-search-result-title">${escapeHtml(n.title)}</div>
              <div class="jais-search-result-sub">${escapeHtml(n.category || '')} -- ${escapeHtml(n.author || 'Sports Desk')}</div>
            </div>
            <span class="jais-search-result-badge" style="color: var(--fm-green); border-color: var(--fm-green);">${typeLabel}</span>
          </a>
        `;
      }).join('')}
    </div>`;
  }

  // Footer
  html += `
    <div class="jais-search-footer">
      ${totalCount} result${totalCount !== 1 ? 's' : ''} for "<strong>${escapeHtml(q)}</strong>"
    </div>
  `;

  _showSearchDropdownEl(html, inputId);
}

function _showSearchDropdownEl(innerHtml, inputId) {
  document.getElementById("jais-universal-search-dropdown")?.remove();

  const dropdown = document.createElement("div");
  dropdown.id = "jais-universal-search-dropdown";
  dropdown.className = "jais-universal-search-dropdown";
  dropdown.innerHTML = innerHtml;

  // Position relative to the search input
  const inputEl = document.getElementById(inputId);
  if (inputEl) {
    const wrap = inputEl.closest(".jais-desktop-search-wrap") || inputEl.parentElement;
    if (wrap) {
      wrap.style.position = "relative";
      wrap.appendChild(dropdown);
    } else {
      document.body.appendChild(dropdown);
    }
  } else {
    document.body.appendChild(dropdown);
  }

  // Close on click outside
  setTimeout(() => {
    document.addEventListener("click", _closeSearchOnClickOutside, { once: true, capture: true });
  }, 50);
}

function _closeSearchOnClickOutside(e) {
  const dropdown = document.getElementById("jais-universal-search-dropdown");
  if (dropdown && !dropdown.contains(e.target)) {
    const searchInput = document.getElementById("desktop-global-search") || document.getElementById("jais-search-input");
    if (searchInput && searchInput.contains(e.target)) {
      // Re-attach listener if user is still typing
      setTimeout(() => {
        document.addEventListener("click", _closeSearchOnClickOutside, { once: true, capture: true });
      }, 50);
      return;
    }
    dropdown.remove();
  } else if (dropdown) {
    // Re-attach if clicked inside dropdown (let link handle navigation)
    setTimeout(() => {
      document.addEventListener("click", _closeSearchOnClickOutside, { once: true, capture: true });
    }, 50);
  }
}

export function closeUniversalSearch() {
  document.getElementById("jais-universal-search-dropdown")?.remove();
  const desktopInput = document.getElementById("desktop-global-search");
  if (desktopInput) desktopInput.value = "";
  const mobileInput = document.getElementById("jais-search-input");
  if (mobileInput) mobileInput.value = "";
  eventsSearchQuery = "";
}

/* ==========================================================================
   TOURNAMENT / COMPETITION SELECTOR & SWITCHER
   Prefectorial Cup (Team Ihechukwu, Team Fortune, Team Osaruyi, Team Titemi)
   vs Inter-House Sports (Phoenix, Merlin, Swift, Eagle)
   ========================================================================== */

export function renderCompetitionSelectorPage() {
  showScreen("screen-competitions");
  const container = document.getElementById("screen-competitions");
  if (!container) return;

  const currentComp = getActiveCompetition();
  const prefTeams = getPrefectorialTeams();
  const rawHouses = (window.currentHousesCache && window.currentHousesCache.length) ? window.currentHousesCache : INITIAL_HOUSES;
  const interHouses = rawHouses.some(h => h.id && h.id.startsWith("team-")) ? INITIAL_HOUSES : rawHouses;

  container.innerHTML = `
    <div class="jais-comp-page">
      <div class="jais-comp-hero">
        <div class="jais-comp-crest-wrap">
          <img src="assets/juilliard-logo.png" alt="Juilliard Academy" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
        <div class="jais-comp-badge-pill">
          <span>🏆</span>
          <span>JUILLIARD ACADEMY SPORTS 2026</span>
        </div>
        <h1 class="jais-comp-title">Select Competition</h1>
        <p class="jais-comp-sub">
          Choose a championship tournament to explore live match fixtures, real-time scoring, dynamic leaderboards, and full team rosters.
        </p>
      </div>

      <div class="jais-comp-cards-grid">
        <!-- Tournament 1: Prefectship Cup -->
        <div class="jais-comp-card ${currentComp === 'prefectorial' ? 'active' : ''}" style="--comp-accent: #F59E0B; --comp-glow: rgba(245, 158, 11, 0.35);" onclick="window.pages.selectTournament('prefectorial')">
          <div>
            <span class="jais-comp-card-badge" style="background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.35);">
              PRE-SEASON SHOWDOWN
            </span>
            <div class="jais-comp-card-title">
              <span style="font-size: 1.6rem;">🏆</span>
              <span>Prefectship Cup</span>
            </div>
            <p class="jais-comp-card-desc">
              The premier clash of senior prefects and student leaders! 4 powerhouse squads competing in Football, Basketball, 100m Sprints, Relays, and Novelty battles.
            </p>

            <div class="jais-comp-teams-preview">
              ${prefTeams.map(t => `
                <span class="jais-comp-team-chip" style="border-left: 3px solid ${t.color};">
                  <img src="assets/crests/${t.id}.svg" alt="${t.name}" style="width: 14px; height: 14px; object-fit: contain;" />
                  <span>${escapeHtml(t.name)}</span>
                </span>
              `).join("")}
            </div>
          </div>

          <button type="button" class="jais-comp-action-btn" style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #000; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
            <span>Enter Prefectship Cup</span>
            <span>&rarr;</span>
          </button>
        </div>

        <!-- Tournament 2: Inter-House Sports -->
        <div class="jais-comp-card ${currentComp === 'interhouse' ? 'active' : ''}" style="--comp-accent: #DC2626; --comp-glow: rgba(220, 38, 38, 0.35);" onclick="window.pages.selectTournament('interhouse')">
          <div>
            <span class="jais-comp-card-badge" style="background: rgba(220, 38, 38, 0.15); color: #EF4444; border: 1px solid rgba(220, 38, 38, 0.35);">
              MAIN ANNUAL CHAMPIONSHIP
            </span>
            <div class="jais-comp-card-title">
              <span style="font-size: 1.6rem;">🥇</span>
              <span>Inter-House Sports</span>
            </div>
            <p class="jais-comp-card-desc">
              The historic inter-house athletic competition! Phoenix, Merlin, Swift, and Eagle battling across 35+ verified track, field, and team sports events.
            </p>

            <div class="jais-comp-teams-preview">
              ${interHouses.map(h => `
                <span class="jais-comp-team-chip" style="border-left: 3px solid ${h.color};">
                  <img src="assets/crests/${h.id}.svg" alt="${h.name}" style="width: 14px; height: 14px; object-fit: contain;" />
                  <span>${escapeHtml(h.name)} House</span>
                </span>
              `).join("")}
            </div>
          </div>

          <button type="button" class="jais-comp-action-btn" style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: #FFF; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);">
            <span>Enter Inter-House Sports</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

      <div style="text-align: center; margin-top: 1rem;">
        <span style="font-size: 0.75rem; color: var(--fm-text-muted);">
          You can toggle tournaments at any time using the <strong>Switch Cup</strong> button in the navigation bar.
        </span>
      </div>
    </div>
  `;
}

export function selectTournament(comp) {
  playScoreCelebration();
  setActiveCompetition(comp);
  updateTournamentChrome();
  renderDesktopSidebars();
  showToastNotification(`Active tournament set to: ${comp === 'prefectorial' || comp === 'prefectship' ? 'Prefectship Cup' : 'Inter-House Sports'}`);
  closeCompetitionSelectorModal();

  const currentHash = window.location.hash || "";
  if (currentHash === "#/table" || currentHash === "#/houses" || currentHash.startsWith("#/admin")) {
    if (window.appRouter && window.appRouter.handleRoute) {
      window.appRouter.handleRoute();
    }
  } else if (currentHash === "#/events") {
    if (window.appRouter && window.appRouter.handleRoute) {
      window.appRouter.handleRoute();
    }
  } else {
    router.navigate("#/events");
  }
}

export function openCompetitionSelectorModal() {
  playTapSound();
  let modal = document.getElementById("jais-comp-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "jais-comp-modal";
    modal.className = "jais-modal-backdrop";
    modal.style.cssText = "position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 1rem;";
    modal.onclick = (e) => {
      if (e.target === modal) closeCompetitionSelectorModal();
    };
    document.body.appendChild(modal);
  }

  const currentComp = getActiveCompetition();
  modal.innerHTML = `
    <div style="background: var(--fm-surface); border: 1px solid var(--fm-border); border-radius: 20px; max-width: 520px; width: 100%; padding: 1.5rem; box-shadow: 0 25px 60px rgba(0,0,0,0.6); position: relative; animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
      <button onclick="window.pages.closeCompetitionSelectorModal()" style="position: absolute; top: 1rem; right: 1rem; background: var(--fm-surface-elevated); border: 1px solid var(--fm-border); color: var(--fm-text-secondary); width: 32px; height: 32px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
      
      <div style="text-align: center; margin-bottom: 1.25rem;">
        <span style="font-size: 0.7rem; font-weight: 800; color: var(--fm-gold); text-transform: uppercase; letter-spacing: 0.08em; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); padding: 3px 10px; border-radius: 12px;">CHOOSE TOURNAMENT</span>
        <h2 style="font-family: var(--font-display); font-size: 1.45rem; font-weight: 900; margin: 0.5rem 0 0.25rem; color: var(--fm-text-primary);">Switch Competition</h2>
        <p style="font-size: 0.8rem; color: var(--fm-text-secondary); margin: 0;">Select which tournament to view or score:</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        <!-- Option 1: Prefectship Cup -->
        <div onclick="window.pages.selectTournament('prefectorial')" style="background: ${currentComp === 'prefectorial' ? 'rgba(245, 158, 11, 0.12)' : 'var(--fm-surface-elevated)'}; border: 2px solid ${currentComp === 'prefectorial' ? 'var(--fm-gold)' : 'var(--fm-border)'}; border-radius: 14px; padding: 1rem; cursor: pointer; transition: all 0.2s ease;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.35rem;">🏆</span>
              <span style="font-weight: 900; font-size: 1.05rem; color: var(--fm-text-primary);">Prefectship Cup</span>
            </div>
            ${currentComp === 'prefectorial' ? `<span style="font-size: 0.65rem; font-weight: 800; color: #000; background: var(--fm-gold); padding: 2px 7px; border-radius: 4px;">ACTIVE</span>` : ''}
          </div>
          <div style="font-size: 0.76rem; color: var(--fm-text-secondary); margin-bottom: 0.5rem;">
            Senior Prefects: Team Ihechukwu, Team Fortune, Team Osaruyi, Team Titemi
          </div>
          <button style="width: 100%; padding: 0.55rem; background: var(--fm-gold); color: #000; border: none; border-radius: 8px; font-weight: 800; font-size: 0.8rem; cursor: pointer;">
            Select Prefectship Cup
          </button>
        </div>

        <!-- Option 2: Inter-House Sports -->
        <div onclick="window.pages.selectTournament('interhouse')" style="background: ${currentComp === 'interhouse' ? 'rgba(37, 99, 235, 0.12)' : 'var(--fm-surface-elevated)'}; border: 2px solid ${currentComp === 'interhouse' ? '#3B82F6' : 'var(--fm-border)'}; border-radius: 14px; padding: 1rem; cursor: pointer; transition: all 0.2s ease;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.35rem;">🥇</span>
              <span style="font-weight: 900; font-size: 1.05rem; color: var(--fm-text-primary);">Inter-House Sports</span>
            </div>
            ${currentComp === 'interhouse' ? `<span style="font-size: 0.65rem; font-weight: 800; color: #FFF; background: #2563EB; padding: 2px 7px; border-radius: 4px;">ACTIVE</span>` : ''}
          </div>
          <div style="font-size: 0.76rem; color: var(--fm-text-secondary); margin-bottom: 0.5rem;">
            Annual Championship: Phoenix, Merlin, Swift, Eagle Houses
          </div>
          <button style="width: 100%; padding: 0.55rem; background: #2563EB; color: #FFF; border: none; border-radius: 8px; font-weight: 800; font-size: 0.8rem; cursor: pointer;">
            Select Inter-House Sports
          </button>
        </div>
      </div>
    </div>
  `;
  modal.style.display = "flex";
}

export function closeCompetitionSelectorModal() {
  const modal = document.getElementById("jais-comp-modal");
  if (modal) modal.style.display = "none";
}

export function updateTournamentChrome() {
  const isPref = isPrefectorialCup();
  
  // Desktop header subtitle
  const brandSub = document.getElementById("desktop-brand-subtitle");
  if (brandSub) {
    brandSub.textContent = isPref ? "PREFECTSHIP CUP 2026" : "SPORTS DAY 2026";
  }

  // Desktop switcher button
  const compLabel = document.getElementById("desktop-comp-label");
  const compIcon = document.getElementById("desktop-comp-icon");
  if (compLabel) compLabel.textContent = isPref ? "Prefectship Cup" : "Inter-House Sports";
  if (compIcon) compIcon.textContent = isPref ? "🏆" : "🥇";

  // Desktop Nav Link "Houses" -> "Teams"
  const desktopNavHouses = document.getElementById("desktop-nav-houses");
  if (desktopNavHouses) {
    desktopNavHouses.textContent = isPref ? "Teams" : "Houses";
  }

  // Mobile Bottom Nav "Houses" -> "Teams"
  const bottomNavHouses = document.getElementById("bottom-nav-houses");
  if (bottomNavHouses) {
    const textSpan = bottomNavHouses.querySelector("span:last-child");
    if (textSpan) textSpan.textContent = isPref ? "Teams" : "Houses";
  }
}


