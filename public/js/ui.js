/**
 * UI Rendering and Interaction Controller
 * Juilliard Interhouse Sports Day
 */

import { isUserAdmin } from "./auth.js";
import { isSoundEnabled, toggleSound, playTapSound } from "./audio.js";

// Cached app data
let currentHouses = [];
let currentEvents = [];
let currentActivity = [];
let activeFilters = {
  category: "all",
  gender: "all",
  status: "all",
  search: ""
};

/**
 * Animate numeric counter smoothly
 */
export function animateValue(element, start, end, duration = 600) {
  if (!element) return;
  if (start === end) {
    element.textContent = end.toLocaleString();
    return;
  }
  const range = end - start;
  let current = start;
  const increment = range / (duration / 20);
  const stepTime = 20;

  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = Math.round(current).toLocaleString();
  }, stepTime);
}

/**
 * Render Live Ticker
 */
export function renderTicker(activityList) {
  currentActivity = activityList || [];
  const track = document.getElementById("ticker-track");
  if (!track) return;

  if (!currentActivity.length) {
    track.innerHTML = `<span class="ticker-item">Juilliard Interhouse Sports Day underway! Awaiting initial event results.</span>`;
    return;
  }

  const itemsHtml = currentActivity.map(act => {
    return `<span class="ticker-item">
      <span style="font-weight: 800; color: var(--gold);">•</span>
      <strong>${escapeHtml(act.title)}</strong>
      <span>${escapeHtml(act.text)}</span>
    </span>`;
  }).join("");

  // Duplicate for seamless loop
  track.innerHTML = itemsHtml + itemsHtml;
}

/**
 * Render Interhouse 3D Podium & Runner-Up
 */
export function renderPodium(houses) {
  currentHouses = houses || [];
  if (!houses || houses.length < 4) return;

  const first = houses[0];
  const second = houses[1];
  const third = houses[2];
  const fourth = houses[3];

  // Helper to update column
  function setPodiumCol(colId, house, rankNum) {
    const crestImg = document.querySelector(`#${colId} .podium-crest img`);
    const crestBg = document.querySelector(`#${colId} .podium-crest`);
    const nameEl = document.querySelector(`#${colId} .podium-house-name`);
    const ptsEl = document.querySelector(`#${colId} .podium-house-pts-num`);
    const medalsEl = document.querySelector(`#${colId} .pedestal-medals`);

    if (crestImg) crestImg.src = `assets/crests/${house.id}.svg`;
    if (crestBg) {
      crestBg.style.boxShadow = `0 10px 30px ${house.glowColor || 'rgba(0,0,0,0.5)'}`;
      crestBg.style.borderColor = house.color;
    }
    if (nameEl) nameEl.textContent = house.name;
    if (ptsEl) {
      const prevVal = parseInt(ptsEl.textContent.replace(/,/g, "")) || 0;
      animateValue(ptsEl, prevVal, house.totalPoints);
    }
    if (medalsEl) {
      medalsEl.innerHTML = `<span title="Gold Medals">G: ${house.goldCount || 0}</span> <span title="Silver Medals">S: ${house.silverCount || 0}</span> <span title="Bronze Medals">B: ${house.bronzeCount || 0}</span>`;
    }
  }

  setPodiumCol("podium-1st", first, 1);
  setPodiumCol("podium-2nd", second, 2);
  setPodiumCol("podium-3rd", third, 3);

  // 4th Place Runner-Up
  const runnerCrest = document.getElementById("runner-up-crest-img");
  const runnerName = document.getElementById("runner-up-name");
  const runnerPts = document.getElementById("runner-up-pts");
  const runnerMotto = document.getElementById("runner-up-motto");

  if (runnerCrest) runnerCrest.src = `assets/crests/${fourth.id}.svg`;
  if (runnerName) runnerName.textContent = fourth.name;
  if (runnerPts) {
    const prevVal = parseInt(runnerPts.textContent.replace(/,/g, "")) || 0;
    animateValue(runnerPts, prevVal, fourth.totalPoints);
  }
  if (runnerMotto) runnerMotto.textContent = fourth.motto;

  // Render detailed cards below
  renderHouseCards(houses);

  // Render Stadium overlay if open
  renderStadiumScoreboard(houses);
}

/**
 * Render House Detail Cards
 */
export function renderHouseCards(houses) {
  const container = document.getElementById("house-standings-grid");
  if (!container) return;

  const maxPoints = Math.max(...houses.map(h => h.totalPoints), 100);

  container.innerHTML = houses.map((house, idx) => {
    const pct = Math.min(100, Math.round((house.totalPoints / maxPoints) * 100));
    const teachersList = Array.isArray(house.teachers) ? house.teachers.join(", ") : (house.teachers || "None assigned");

    return `
      <div class="house-standing-card" style="--house-accent: ${house.color}" onclick="window.appUI.openHouseDetailModal('${house.id}')">
        <div class="card-top">
          <div class="card-house-info">
            <div class="card-crest" style="border-color: ${house.color}; box-shadow: 0 0 16px ${house.glowColor}">
              <img src="assets/crests/${house.id}.svg" alt="${house.name}" />
            </div>
            <div class="card-title">
              <h3>#${idx + 1} ${escapeHtml(house.name)}</h3>
              <span>${escapeHtml(house.motto)}</span>
            </div>
          </div>
          <div class="card-score-box">
            <div class="card-score-number" style="color: ${house.color}">${(house.totalPoints || 0).toLocaleString()}</div>
            <span>POINTS</span>
          </div>
        </div>

        <div class="points-meter-bg">
          <div class="points-meter-fill" style="width: ${pct}%; background: ${house.bgGradient}"></div>
        </div>

        <div class="card-medals-row">
          <div class="medal-item"><span style="color: var(--gold); font-weight: 800;">G</span> ${house.goldCount || 0} Gold</div>
          <div class="medal-item"><span style="color: var(--silver); font-weight: 800;">S</span> ${house.silverCount || 0} Silver</div>
          <div class="medal-item"><span style="color: var(--bronze); font-weight: 800;">B</span> ${house.bronzeCount || 0} Bronze</div>
        </div>

        <div class="card-personnel">
          <div class="personnel-line">
            <span>Captain:</span>
            <strong>${escapeHtml(house.captain || "TBD")}</strong>
          </div>
          <div class="personnel-line">
            <span>Teachers:</span>
            <span style="color: var(--text-secondary); font-size: 0.75rem; text-align: right; max-width: 60%;">${escapeHtml(teachersList)}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

/**
 * Render Events Grid
 */
export function renderEvents(events) {
  currentEvents = events || [];
  const container = document.getElementById("events-grid-container");
  const countEl = document.getElementById("events-filtered-count");
  if (!container) return;

  // Filter events
  const filtered = currentEvents.filter(ev => {
    if (activeFilters.category !== "all" && ev.category.toLowerCase() !== activeFilters.category.toLowerCase()) return false;
    if (activeFilters.gender !== "all" && ev.gender.toLowerCase() !== activeFilters.gender.toLowerCase()) return false;
    if (activeFilters.status !== "all" && ev.status.toLowerCase() !== activeFilters.status.toLowerCase()) return false;
    if (activeFilters.search.trim()) {
      const q = activeFilters.search.toLowerCase();
      const matchName = (ev.name || "").toLowerCase().includes(q);
      const matchCat = (ev.category || "").toLowerCase().includes(q);
      const matchNotes = (ev.notes || "").toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchNotes) return false;
    }
    return true;
  });

  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${currentEvents.length} events`;
  }

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No Events Found</h3>
        <p>Try resetting filters or adjusting search keywords.</p>
        <button class="btn btn-secondary btn-sm" style="margin-top: 1rem;" onclick="window.appUI.resetFilters()">Clear Filters</button>
      </div>
    `;
    return;
  }

  const isAdmin = isUserAdmin();

  container.innerHTML = filtered.map(ev => {
    const isCompleted = ev.status === "completed" && ev.results;
    const isLive = ev.status === "live";

    let resultsBlock = "";
    if (isCompleted && ev.results) {
      const r = ev.results;
      const getHouseName = (id) => {
        const h = currentHouses.find(x => x.id === id);
        return h ? h.name : (id || "—");
      };

      resultsBlock = `
        <div class="event-mini-results">
          <div class="result-row">
            <div class="result-place"><span class="place-num place-1">1st</span> <span class="result-athlete">${escapeHtml(r.first?.athlete || getHouseName(r.first?.houseId))}</span></div>
            <span class="result-points">+${r.first?.points || 0} pts</span>
          </div>
          <div class="result-row">
            <div class="result-place"><span class="place-num place-2">2nd</span> <span class="result-athlete">${escapeHtml(r.second?.athlete || getHouseName(r.second?.houseId))}</span></div>
            <span class="result-points">+${r.second?.points || 0} pts</span>
          </div>
          <div class="result-row">
            <div class="result-place"><span class="place-num place-3">3rd</span> <span class="result-athlete">${escapeHtml(r.third?.athlete || getHouseName(r.third?.houseId))}</span></div>
            <span class="result-points">+${r.third?.points || 0} pts</span>
          </div>
        </div>
      `;
    }

    const tagClass = `event-tag-${(ev.category || "track").toLowerCase()}`;
    const badgeClass = `badge-${ev.status || "upcoming"}`;
    const statusText = ev.status === "live" ? "LIVE NOW" : (ev.status === "completed" ? "FINISHED" : "UPCOMING");

    return `
      <div class="event-card card-${ev.status}">
        <div class="event-card-header">
          <div class="event-meta-tags">
            <span class="event-tag ${tagClass}">${escapeHtml(ev.category)}</span>
            <span class="event-tag">${escapeHtml(ev.gender)}</span>
          </div>
          <span class="badge ${badgeClass}">${statusText}</span>
        </div>

        <div>
          <h4 class="event-title">${escapeHtml(ev.name)}</h4>
          <p class="event-notes">${escapeHtml(ev.notes || "Official sports day event")}</p>
        </div>

        ${resultsBlock}

        <div class="event-card-actions">
          <button class="btn btn-secondary btn-sm" onclick="window.appUI.openEventDetailModal('${ev.id}')">View Details</button>
          ${isAdmin ? `<button class="btn btn-admin btn-sm" onclick="window.adminUI.openScoreModal('${ev.id}')">Record Score</button>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

/**
 * Filter Management
 */
export function setFilter(type, value) {
  playTapSound();
  activeFilters[type] = value;
  renderEvents(currentEvents);
}

export function resetFilters() {
  activeFilters = { category: "all", gender: "all", status: "all", search: "" };
  const searchInput = document.getElementById("event-search-input");
  if (searchInput) searchInput.value = "";
  document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.value === "all");
  });
  renderEvents(currentEvents);
}

/**
 * Open House Detail Modal
 */
export function openHouseDetailModal(houseId) {
  playTapSound();
  const house = currentHouses.find(h => h.id === houseId);
  if (!house) return;

  const modal = document.getElementById("house-detail-modal");
  const title = document.getElementById("house-modal-title");
  const body = document.getElementById("house-modal-body");

  if (!modal || !body) return;

  title.textContent = `${house.name} House Profile`;
  const teachersList = Array.isArray(house.teachers) ? house.teachers.join("<br/>") : house.teachers;

  // Find all events this house took 1st place in
  const wonEvents = currentEvents.filter(ev => ev.status === "completed" && ev.results?.first?.houseId === house.id);

  body.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem;">
      <div style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid ${house.color}; box-shadow: 0 0 20px ${house.glowColor}; display: flex; align-items: center; justify-content: center; background: var(--bg-surface-elevated)">
        <img src="assets/crests/${house.id}.svg" style="width: 65%; height: 65%;" alt="${house.name}" />
      </div>
      <div>
        <h2 style="font-family: var(--font-display); font-size: 1.6rem; color: #FFF; line-height: 1;">${escapeHtml(house.name)}</h2>
        <p style="color: ${house.color}; font-size: 0.9rem; font-weight: 600; margin-top: 0.25rem;">"${escapeHtml(house.motto)}"</p>
        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
          <span class="badge" style="background: rgba(255,255,255,0.1); color: #FFF;">Total Points: ${(house.totalPoints || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
      <div style="background: var(--bg-surface-elevated); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle)">
        <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">House Captain</span>
        <h4 style="font-family: var(--font-display); color: #FFF; margin-top: 0.25rem;">${escapeHtml(house.captain || "Not appointed")}</h4>
      </div>
      <div style="background: var(--bg-surface-elevated); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle)">
        <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Medal Tally</span>
        <h4 style="font-family: var(--font-display); color: #FFF; margin-top: 0.25rem;">G: ${house.goldCount || 0} | S: ${house.silverCount || 0} | B: ${house.bronzeCount || 0}</h4>
      </div>
    </div>

    <div style="margin-top: 1rem; background: var(--bg-surface-elevated); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle)">
      <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Assigned Teachers & Patrons</span>
      <div style="color: var(--text-secondary); margin-top: 0.4rem; font-size: 0.9rem; line-height: 1.5;">
        ${teachersList}
      </div>
    </div>

    <div style="margin-top: 1rem;">
      <h4 style="font-family: var(--font-display); font-size: 0.95rem; margin-bottom: 0.5rem; color: #FFF;">Gold Medals Won (${wonEvents.length})</h4>
      <div style="max-height: 140px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.4rem;">
        ${wonEvents.length ? wonEvents.map(e => `
          <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.04); padding: 0.4rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.85rem;">
            <span>[1st] ${escapeHtml(e.name)}</span>
            <span style="color: ${house.color}; font-weight: 700;">+${e.results?.first?.points || 0} pts</span>
          </div>
        `).join("") : `<p style="font-size: 0.85rem; color: var(--text-muted);">No 1st place victories recorded yet.</p>`}
      </div>
    </div>
  `;

  modal.classList.add("active");
}

/**
 * Open Event Detail Modal
 */
export function openEventDetailModal(eventId) {
  playTapSound();
  const ev = currentEvents.find(e => e.id === eventId);
  if (!ev) return;

  const modal = document.getElementById("event-detail-modal");
  const title = document.getElementById("event-modal-title");
  const body = document.getElementById("event-modal-body");

  if (!modal || !body) return;

  title.textContent = ev.name;

  let standingsHtml = "";
  if (ev.status === "completed" && ev.results) {
    const r = ev.results;
    const places = [
      { key: "first", num: "1st", color: "var(--gold)", data: r.first },
      { key: "second", num: "2nd", color: "var(--silver)", data: r.second },
      { key: "third", num: "3rd", color: "var(--bronze)", data: r.third },
      { key: "fourth", num: "4th", color: "var(--text-muted)", data: r.fourth }
    ];

    standingsHtml = `
      <div style="margin-top: 1rem;">
        <h4 style="font-family: var(--font-display); font-size: 0.95rem; margin-bottom: 0.75rem; color: #FFF;">Official Results & Points Awarded</h4>
        <div style="display: flex; flex-direction: column; gap: 0.6rem;">
          ${places.map(p => {
            const h = currentHouses.find(x => x.id === p.data?.houseId);
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface-elevated); padding: 0.75rem 1rem; border-radius: var(--radius-md); border-left: 4px solid ${h ? h.color : 'transparent'}">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="font-family: var(--font-display); font-weight: 800; font-size: 1.1rem; color: ${p.color};">${p.num}</span>
                  <div>
                    <strong style="color: #FFF; font-size: 0.95rem;">${escapeHtml(p.data?.athlete || "Athlete")}</strong>
                    <div style="font-size: 0.75rem; color: ${h ? h.color : 'var(--text-muted)'}; font-weight: 700;">${h ? h.name + " House" : "House"} ${p.data?.score ? `• ${p.data.score}` : ""}</div>
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 800; color: #FFF;">+${p.data?.points || 0}</span>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">POINTS</div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  } else {
    standingsHtml = `
      <div class="empty-state" style="margin-top: 1rem; padding: 2rem;">
        <p>This event is currently scheduled as <strong>${ev.status.toUpperCase()}</strong>.</p>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Scores will appear here in real-time once entered by the sports judges.</p>
      </div>
    `;
  }

  body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface-elevated); padding: 0.75rem 1rem; border-radius: var(--radius-md);">
      <div>
        <span class="event-tag event-tag-${ev.category.toLowerCase()}">${escapeHtml(ev.category)}</span>
        <span class="event-tag">${escapeHtml(ev.gender)}</span>
      </div>
      <span class="badge badge-${ev.status}">${ev.status.toUpperCase()}</span>
    </div>

    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">${escapeHtml(ev.notes || "Standard Interhouse Competition Event Rules apply.")}</p>

    ${standingsHtml}

    <div style="margin-top: 1rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
      ${isUserAdmin() ? `<button class="btn btn-admin" onclick="window.adminUI.openScoreModal('${ev.id}')">Enter / Edit Score</button>` : ""}
    </div>
  `;

  modal.classList.add("active");
}

/**
 * Stadium / Big Screen Display Mode
 */
export function toggleStadiumMode(show) {
  playTapSound();
  const overlay = document.getElementById("stadium-mode-overlay");
  if (!overlay) return;

  if (typeof show === "boolean") {
    overlay.classList.toggle("active", show);
  } else {
    overlay.classList.toggle("active");
  }

  if (overlay.classList.contains("active")) {
    renderStadiumScoreboard(currentHouses);
  }
}

export function renderStadiumScoreboard(houses) {
  const container = document.getElementById("stadium-grid");
  if (!container || !houses || houses.length < 4) return;

  container.innerHTML = houses.map((house, idx) => {
    return `
      <div class="stadium-house-box" style="--house-accent: ${house.color}">
        <div class="stadium-rank-pill" style="color: ${idx === 0 ? 'var(--gold)' : (idx === 1 ? 'var(--silver)' : (idx === 2 ? 'var(--bronze)' : '#FFF'))}">
          #${idx + 1}
        </div>
        <div class="stadium-crest-giant" style="border-color: ${house.color}; box-shadow: 0 0 30px ${house.glowColor}">
          <img src="assets/crests/${house.id}.svg" alt="${house.name}" />
        </div>
        <div class="stadium-house-title" style="color: ${house.color}">${escapeHtml(house.name)}</div>
        <div class="stadium-house-captain">Captain: ${escapeHtml(house.captain || "TBD")}</div>
        <div class="stadium-score-display">
          <div class="stadium-score-value">${(house.totalPoints || 0).toLocaleString()}</div>
          <div class="stadium-score-sub">Total Points</div>
        </div>
      </div>
    `;
  }).join("");
}

/**
 * Clock Updater
 */
export function startClock() {
  function update() {
    const now = new Date();
    const str = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const c1 = document.getElementById("stadium-clock-header");
    const c2 = document.getElementById("stadium-clock-giant");
    if (c1) c1.textContent = str;
    if (c2) c2.textContent = str;
  }
  update();
  setInterval(update, 1000);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
