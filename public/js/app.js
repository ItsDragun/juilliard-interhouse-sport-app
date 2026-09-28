/**
 * Main Application Bootstrapper
 * Juilliard Academy Interhouse Sports Day
 */

import { initFirebase } from "./firebase-config.js";
import { subscribeToSportsData, subscribeToNews, subscribeToAuditLogs } from "./db.js?v=20260927_news_edit_tags_like_v3";
import { initAuth, onAuthChange, signInWithGoogle, signOutUser, isUserAdmin, subscribeToAdmins } from "./auth.js?v=20260927_news_edit_tags_like_v3";
import { router } from "./router.js";
import * as pages from "./pages.js?v=20260927_news_edit_tags_like_v3";
import { isSoundEnabled, toggleSound, playTapSound } from "./audio.js";
import { initTheme, toggleTheme } from "./theme.js";
import { ICONS } from "./icons.js";

window.pages = pages;
window.appRouter = router;
window.ICONS = ICONS;
window.toggleTheme = toggleTheme;

// Global triggers
window.appUI = {
  triggerGoogleSignIn: async () => {
    try {
      await signInWithGoogle();
      router.navigate("#/table");
    } catch (err) {
      alert("Note: " + err.message);
    }
  }
};

function bootApp() {
  console.log("[Juilliard Sports] Booting application...");

  // Support test / admin pin query parameters before auth initialization
  const urlParams = new URLSearchParams(window.location.search);
  const pinParam = (urlParams.get("pin") || "").toLowerCase();
  const adminParam = (urlParams.get("admin") || "").toLowerCase();
  const emailParam = (urlParams.get("email") || "").toLowerCase();
  if (
    pinParam === "osaruyi" ||
    adminParam === "osaruyi" ||
    emailParam === "osaruyiaideyan@gmail.com" ||
    pinParam === "ihechukwu" ||
    adminParam === "ihechukwu" ||
    emailParam === "1h3chukwu@gmail.com"
  ) {
    const sess = {
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
    localStorage.setItem("juilliard_supported_house", "phoenix");
    localStorage.setItem("juilliard_active_admin_session", JSON.stringify(sess));
    sessionStorage.setItem("juilliard_active_admin_session", JSON.stringify(sess));
  } else if (urlParams.get("autologin") === "admin" || urlParams.get("pin") === "2026") {
    const sess = {
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
    localStorage.setItem("juilliard_supported_house", "phoenix");
    localStorage.setItem("juilliard_active_admin_session", JSON.stringify(sess));
    sessionStorage.setItem("juilliard_active_admin_session", JSON.stringify(sess));
  }

  try {
    // 1. Initialize Light/Dark Theme
    initTheme();

    // 2. Firebase & Auth Initialization
    initFirebase();
    initAuth();

    // 3. Register Multi-Page Routes
    setupRoutes();

    // 4. Populate Native Vector SVG Icons
    populateChromeIcons();

    // 5. Header Action Triggers
    setupHeaderControls();

    // 6. Route change listener to update Bottom Navigation & Desktop Nav Active State
    router.onRouteChange(({ route, path }) => {
      updateNavState(path);
      pages.updateTournamentChrome();
      pages.renderDesktopSidebars();
    });

    // 7. Initial Route selection
    const activeComp = localStorage.getItem("juilliard_active_competition");
    const supportedPref = localStorage.getItem("juilliard_supported_pref_team");
    const supportedHouse = localStorage.getItem("juilliard_supported_house");
    if (!window.location.hash || window.location.hash === "#/" || window.location.hash === "#/welcome") {
      if (!activeComp || (!supportedPref && !supportedHouse)) {
        window.location.hash = "#/onboarding";
      } else {
        window.location.hash = "#/events";
      }
    }

    // 8. Kick off Router
    router.init();
    pages.updateTournamentChrome();

    // Render sidebars immediately after router initialization
    pages.renderDesktopSidebars();

    // 9. Subscribe to Real-Time Cloud Firestore Data
    subscribeToSportsData({
      onHousesChange: (houses) => {
        const isPref = (window.isPrefectorialCup && window.isPrefectorialCup()) || (Array.isArray(houses) && houses.some(h => h.id && h.id.startsWith("team-")));
        if (isPref) {
          window.currentPrefTeamsCache = houses;
        } else {
          window.currentHousesCache = houses;
        }
        pages.renderDesktopSidebars();
        renderCurrentRoute();
      },
      onEventsChange: (events) => {
        const isPref = (window.isPrefectorialCup && window.isPrefectorialCup()) || (Array.isArray(events) && events.some(e => e.id && e.id.startsWith("pref-")));
        if (isPref) {
          window.currentPrefEventsCache = events;
        } else {
          window.currentEventsCache = events;
        }
        updateLiveBadgeCount(events);
        pages.renderDesktopSidebars();
        renderCurrentRoute();
      },
      onStudentsChange: (students) => {
        window.currentStudentsCache = students;
        pages.renderDesktopSidebars();
        renderCurrentRoute();
      },
      onActivityChange: (activity) => {
        window.currentActivityCache = activity;
      },
      onStatusChange: () => {}
    });

    // Subscribe to realtime news stories
    subscribeToNews({
      onNewsChange: () => {
        pages.renderDesktopSidebars();
      }
    });

    // Subscribe to realtime official audit logs
    subscribeToAuditLogs((logs) => {
      window.currentAuditLogsCache = logs;
      const hash = window.location.hash || "";
      if (hash === "#/admin" || hash.startsWith("#/admin/logs") || hash.startsWith("#/admin/history")) {
        pages.renderAdminPage();
      }
    });

    // Subscribe to realtime registered admins
    subscribeToAdmins((admins) => {
      window.currentAdminsCache = admins;
      const hash = window.location.hash || "";
      if (hash === "#/admin" || hash.startsWith("#/admin/admins")) {
        pages.renderAdminPage();
      }
    });

    // 10. Handle Auth Role changes
    onAuthChange(({ user, role }) => {
      updateAuthWidgets(user, role);
      pages.renderDesktopSidebars();
      renderCurrentRoute();
    });
  } catch (err) {
    console.error("Critical error booting Juilliard app:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootApp);
} else {
  bootApp();
}

/**
 * Register all Multi-Page Routes matching Juilliard Academy Sports Screens
 */
function setupRoutes() {
  const requireAdmin = (handler) => (params) => {
    if (!isUserAdmin()) {
      router.navigate("#/welcome");
      return;
    }
    handler(params);
  };

  router.register("/competitions", () => pages.renderCompetitionSelectorPage());
  router.register("/select-cup", () => pages.renderCompetitionSelectorPage());
  router.register("/events", () => pages.renderEventsPage());
  router.register("/table", () => pages.renderTablePage());
  router.register("/news", () => pages.renderNewsPage());
  router.register("/gallery", () => pages.renderNewsPage());
  router.register("/event/:id", (params) => pages.renderEventDetailPage(params));
  router.register("/houses", () => pages.renderHousesPage());
  router.register("/house/:id", (params) => pages.renderHouseDetailPage(params));
  router.register("/onboarding", () => pages.renderOnboardingPage());
  router.register("/welcome", () => pages.renderWelcomePage());
  router.register("/login", () => pages.renderWelcomePage());
  router.register("/athlete/:id", (params) => pages.renderAthleteProfilePage(params));
  router.register("/student/:id", (params) => pages.renderAthleteProfilePage(params));

  // Judge / Admin Routes
  router.register("/admin", requireAdmin(() => pages.renderAdminPage()));
  router.register("/admin/logs", requireAdmin(() => pages.renderAdminPage({ tab: "logs" })));
  router.register("/admin/history", requireAdmin(() => pages.renderAdminPage({ tab: "logs" })));
  router.register("/admin/admins", requireAdmin(() => pages.renderAdminPage({ tab: "admins" })));
  router.register("/admin/officials", requireAdmin(() => pages.renderAdminPage({ tab: "admins" })));
  router.register("/admin/score/:id", requireAdmin((params) => pages.renderScoreEntryPage(params)));
  router.register("/admin/edit-event/:id", requireAdmin((params) => pages.renderEditEventPage(params)));
  router.register("/admin/rosters", requireAdmin(() => pages.renderRostersPage()));
  router.register("/admin/students", requireAdmin(() => pages.renderStudentsPage()));
  router.register("/admin/new-event", requireAdmin(() => pages.renderNewEventPage()));
}

function renderCurrentRoute() {
  router.handleRoute();
}

/**
 * Populate Vector SVG Icons into Juilliard Academy Sports Bars (Mobile & Desktop)
 */
function populateChromeIcons() {
  const navTableIcon = document.getElementById("bottom-nav-table-icon");
  const navEventsIcon = document.getElementById("bottom-nav-events-icon");
  const navNewsIcon = document.getElementById("bottom-nav-news-icon");
  const navHousesIcon = document.getElementById("bottom-nav-houses-icon");
  const navAdminIcon = document.getElementById("bottom-nav-admin-icon");

  if (navTableIcon) navTableIcon.innerHTML = ICONS.trophy;
  if (navEventsIcon) navEventsIcon.innerHTML = ICONS.calendar;
  if (navNewsIcon) navNewsIcon.innerHTML = ICONS.news;
  if (navHousesIcon) navHousesIcon.innerHTML = ICONS.house;
  if (navAdminIcon) navAdminIcon.innerHTML = ICONS.judge;

  // Desktop header icons
  const desktopSearchIcon = document.getElementById("desktop-search-icon");
  if (desktopSearchIcon) desktopSearchIcon.innerHTML = ICONS.search;

  const desktopThemeToggle = document.getElementById("desktop-theme-toggle");
  if (desktopThemeToggle) desktopThemeToggle.innerHTML = ICONS.sun;
}

/**
 * Update Navigation Highlights (Both Mobile Bottom Bar & Desktop Top Header)
 */
function updateNavState(path) {
  // Mobile bottom bar
  document.querySelectorAll(".jais-bottom-bar .jais-nav-item").forEach(item => {
    const target = item.getAttribute("href")?.replace(/^#/, "");
    if (!target) return;
    const isActive = path === target || (target !== "/events" && path.startsWith(target));
    item.classList.toggle("active", isActive);
  });

  // Desktop top header links
  document.querySelectorAll(".jais-desktop-nav-link").forEach(link => {
    const target = link.getAttribute("href")?.replace(/^#/, "");
    if (!target) return;
    const isActive = path === target || (target !== "/events" && path.startsWith(target));
    link.classList.toggle("active", isActive);
  });
}

/**
 * Top Live Count Badge Updater
 */
function updateLiveBadgeCount(events) {
  const badge = document.getElementById("header-live-count");
  if (!badge || !events) return;
  const liveCount = events.filter(e => (e.status === "in_progress" || e.status === "live" || e.isLive) && e.status !== "completed" && e.status !== "done").length;
  badge.textContent = liveCount;
}

/**
 * Global Controls Setup
 */
function setupHeaderControls() {
  const signoutBtn = document.getElementById("btn-signout");
  if (signoutBtn) {
    signoutBtn.addEventListener("click", () => {
      playTapSound();
      signOutUser();
      router.navigate("#/welcome");
    });
  }
}

/**
 * Update Header Auth status
 */
function updateAuthWidgets(user, role) {
  const authBtn = document.getElementById("btn-auth-trigger");
  const userProfile = document.getElementById("user-profile-widget");
  const userRoleBadge = document.getElementById("user-role-badge");
  const bottomNavAdmin = document.getElementById("bottom-nav-admin");
  const desktopNavAdmin = document.getElementById("desktop-nav-admin");

  // Show "Judge" navigation tab ONLY if the authenticated user is an administrator
  if (bottomNavAdmin) {
    bottomNavAdmin.style.display = role === "admin" ? "flex" : "none";
  }
  if (desktopNavAdmin) {
    desktopNavAdmin.style.display = role === "admin" ? "inline-flex" : "none";
  }

  if (user && role === "admin") {
    if (authBtn) authBtn.style.display = "none";
    if (userProfile) userProfile.style.display = "flex";
    if (userRoleBadge) {
      userRoleBadge.textContent = "JUDGE";
    }
  } else {
    if (authBtn) authBtn.style.display = "flex";
    if (userProfile) userProfile.style.display = "none";
  }
}
