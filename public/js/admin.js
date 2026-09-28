/**
 * Admin Panel & Score Entry Controller
 * Juilliard Interhouse Sports Day
 */

import { submitEventScore, updateHouseRoster, saveEventDefinition, resetAllSportsDayScores, seedDemoScores, isBallSportEvent, sanitizeEventPoints } from "./db.js";
import { isUserAdmin, signOutUser } from "./auth.js";
import { playWhistleSound, playTapSound } from "./audio.js";
import { INITIAL_STUDENTS } from "./seed-data.js";

const HOUSES_LIST = [
  { id: "phoenix", name: "Phoenix", icon: "", color: "#EF4444" },
  { id: "eagle", name: "Eagle", icon: "", color: "#F59E0B" },
  { id: "merlin", name: "Merlin", icon: "", color: "#8B5CF6" },
  { id: "swift", name: "Swift", icon: "", color: "#10B981" }
];

let selectedEventForScore = null;
let currentScoreEntry = {
  first: { houseId: "phoenix", athlete: "", score: "", points: null },
  second: { houseId: "eagle", athlete: "", score: "", points: null },
  third: { houseId: "swift", athlete: "", score: "", points: null },
  fourth: { houseId: "merlin", athlete: "", score: "", points: null }
};

/**
 * Open Score Entry Modal for an event
 */
export function openScoreModal(eventId) {
  playTapSound();
  const events = window.currentEventsCache || [];
  const ev = events.find(e => e.id === eventId);
  if (!ev) return;

  selectedEventForScore = ev;
  const isBall = isBallSportEvent(ev);
  const modal = document.getElementById("score-entry-modal");
  const modalTitle = document.getElementById("score-modal-event-title");
  if (!modal) return;

  if (modalTitle) {
    modalTitle.textContent = `${ev.name} (${ev.category} • ${ev.gender})`;
  }

  // Prepopulate if event already has results or points matrix
  const matrix = ev.pointsMatrix || (isBall ? { first: 3, second: 1, third: 0, fourth: 0 } : { first: 0, second: 0, third: 0, fourth: 0 });
  if (ev.results) {
    currentScoreEntry = JSON.parse(JSON.stringify(ev.results));
    if (!isBall) {
      if (currentScoreEntry.first) currentScoreEntry.first.points = null;
      if (currentScoreEntry.second) currentScoreEntry.second.points = null;
      if (currentScoreEntry.third) currentScoreEntry.third.points = null;
      if (currentScoreEntry.fourth) currentScoreEntry.fourth.points = null;
    }
  } else {
    currentScoreEntry = {
      first: { houseId: "phoenix", athlete: "", score: "", points: isBall ? (matrix.first || 3) : null },
      second: { houseId: "eagle", athlete: "", score: "", points: isBall ? (matrix.second || 1) : null },
      third: { houseId: "swift", athlete: "", score: "", points: isBall ? (matrix.third || 0) : null },
      fourth: { houseId: "merlin", athlete: "", score: "", points: isBall ? (matrix.fourth || 0) : null }
    };
  }

  renderScoreEntryForm();
  modal.classList.add("active");
}

/**
 * Render the tactile placing entry form
 */
function renderScoreEntryForm() {
  const container = document.getElementById("score-entry-form-container");
  if (!container) return;

  const isBall = isBallSportEvent(selectedEventForScore);
  const positions = [
    { key: "first", title: "1st Place Winner", badgeColor: "var(--gold)" },
    { key: "second", title: "2nd Place Runner-Up", badgeColor: "var(--silver)" },
    { key: "third", title: "3rd Place", badgeColor: "var(--bronze)" },
    { key: "fourth", title: "4th Place", badgeColor: "var(--text-muted)" }
  ];

  container.innerHTML = positions.map(pos => {
    const entry = currentScoreEntry[pos.key];
    return `
      <div class="placing-entry-card">
        <div class="placing-card-header">
          <span class="placing-badge" style="color: ${pos.badgeColor}">${pos.title}</span>
          ${isBall ? `
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">Points: 
              <input type="number" class="form-input" style="width: 70px; display: inline-block; padding: 2px 6px; font-weight: 800;" 
                id="pts-${pos.key}" value="${entry.points || 0}" onchange="window.adminUI.updateScoreField('${pos.key}', 'points', this.value)"/>
            </span>
          ` : `
            <span style="font-size: 0.75rem; color: ${pos.badgeColor}; font-weight: 800;">${pos.key === 'first' ? 'Gold Medal' : pos.key === 'second' ? 'Silver Medal' : pos.key === 'third' ? 'Bronze Medal' : '4th Place'}</span>
          `}
        </div>

        <div>
          <span class="form-label" style="font-size: 0.75rem;">Select House:</span>
          <div class="house-selector-grid">
            ${HOUSES_LIST.map(h => {
              const isSelected = entry.houseId === h.id;
              const selClass = isSelected ? `selected-${h.id}` : "";
              return `
                <div class="house-btn-radio ${selClass}" onclick="window.adminUI.selectPlacingHouse('${pos.key}', '${h.id}')">
                  <span class="house-btn-icon">${h.icon}</span>
                  <span class="house-btn-name">${h.name}</span>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <div class="placing-row-inputs" style="margin-top: 0.5rem;">
          <input type="text" class="form-input" list="admin-athletes-datalist" placeholder="Search any student across school..." id="ath-${pos.key}" 
            value="${escapeHtml(entry.athlete || '')}" oninput="window.adminUI.updateScoreField('${pos.key}', 'athlete', this.value)"/>
          <input type="text" class="form-input" placeholder="Time / Distance (e.g. 10.8s, 14.2m)" id="scr-${pos.key}" 
            value="${escapeHtml(entry.score || '')}" oninput="window.adminUI.updateScoreField('${pos.key}', 'score', this.value)"/>
        </div>
      </div>
    `;
  }).join("");

  const allStudents = (window.currentStudentsCache && window.currentStudentsCache.length) 
    ? window.currentStudentsCache 
    : INITIAL_STUDENTS;

  container.innerHTML += `
    <datalist id="admin-athletes-datalist">
      ${allStudents.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${escapeHtml(s.grade || '')} • General Pool)</option>`).join("")}
    </datalist>
  `;
}

export function selectPlacingHouse(positionKey, houseId) {
  playTapSound();
  currentScoreEntry[positionKey].houseId = houseId;
  renderScoreEntryForm();
}

export function updateScoreField(positionKey, field, value) {
  if (field === "points") {
    currentScoreEntry[positionKey].points = Number(value) || 0;
  } else {
    currentScoreEntry[positionKey][field] = value;
  }
}

/**
 * Submit Score Live
 */
export async function submitScore() {
  if (!selectedEventForScore) return;

  const btn = document.getElementById("btn-publish-score");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Publishing Live...";
  }

  const notes = document.getElementById("score-entry-notes")?.value || "";

  try {
    const res = await submitEventScore(selectedEventForScore.id, currentScoreEntry, notes);
    if (res.success) {
      document.getElementById("score-entry-modal")?.classList.remove("active");
    } else {
      alert("Error saving score: " + (res.error || "Unknown error"));
    }
  } catch (err) {
    alert("Error publishing score: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Publish Result Live";
    }
  }
}

/**
 * House Roster Management Modal
 */
export function openRosterModal() {
  playTapSound();
  const modal = document.getElementById("house-roster-modal");
  const container = document.getElementById("roster-modal-container");
  if (!modal || !container) return;

  const houses = window.currentHousesCache || [];

  container.innerHTML = houses.map(house => {
    const teachersStr = Array.isArray(house.teachers) ? house.teachers.join("\n") : (house.teachers || "");

    return `
      <div class="roster-card" style="border-top: 4px solid ${house.color}">
        <div class="roster-header">
          <img src="assets/crests/${house.id}.svg" style="width: 32px; height: 32px;" alt="${house.name}" />
          <h4>${escapeHtml(house.name)} House</h4>
        </div>

        <div class="form-group">
          <label class="form-label">House Captain (Student Leader)</label>
          <input type="text" class="form-input" id="captain-${house.id}" value="${escapeHtml(house.captain || '')}" />
        </div>

        <div class="form-group">
          <label class="form-label">Assigned Teachers (one per line)</label>
          <textarea class="form-textarea" rows="3" id="teachers-${house.id}">${escapeHtml(teachersStr)}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">House Motto</label>
          <input type="text" class="form-input" id="motto-${house.id}" value="${escapeHtml(house.motto || '')}" />
        </div>

        <button class="btn btn-secondary btn-sm" onclick="window.adminUI.saveSingleHouseRoster('${house.id}')">Save ${house.name} Roster</button>
      </div>
    `;
  }).join("");

  modal.classList.add("active");
}

export async function saveSingleHouseRoster(houseId) {
  playTapSound();
  const captain = document.getElementById(`captain-${houseId}`)?.value || "";
  const motto = document.getElementById(`motto-${houseId}`)?.value || "";
  const teachersRaw = document.getElementById(`teachers-${houseId}`)?.value || "";
  const teachers = teachersRaw.split("\n").map(t => t.trim()).filter(Boolean);

  const res = await updateHouseRoster(houseId, { captain, motto, teachers });
  if (res.success) {
    alert(`Updated roster for ${houseId.toUpperCase()}!`);
  } else {
    alert("Error updating roster: " + res.error);
  }
}

/**
 * Add New Custom Event Modal
 */
export function openCreateEventModal() {
  playTapSound();
  const modal = document.getElementById("create-event-modal");
  if (modal) modal.classList.add("active");
}

export async function createNewEvent() {
  const name = document.getElementById("new-event-name")?.value.trim();
  const category = document.getElementById("new-event-category")?.value || "Track";
  const gender = document.getElementById("new-event-gender")?.value || "Boys";
  const notes = document.getElementById("new-event-notes")?.value || "";
  const p1 = Number(document.getElementById("new-event-pts-1")?.value) || 100;
  const p2 = Number(document.getElementById("new-event-pts-2")?.value) || 60;
  const p3 = Number(document.getElementById("new-event-pts-3")?.value) || 40;
  const p4 = Number(document.getElementById("new-event-pts-4")?.value) || 20;

  if (!name) {
    alert("Please enter an event name.");
    return;
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const eventId = `custom-${slug}-${Date.now()}`;

  const isBall = isBallSportEvent({ name, category });
  const eventPayload = sanitizeEventPoints({
    id: eventId,
    name: `${name} (${gender})`,
    category,
    gender,
    order: 99,
    status: "upcoming",
    pointsMatrix: isBall ? { first: p1, second: p2, third: p3, fourth: p4 } : { first: 0, second: 0, third: 0, fourth: 0 },
    results: null,
    notes
  });

  const res = await saveEventDefinition(eventPayload);
  if (res.success) {
    document.getElementById("create-event-modal")?.classList.remove("active");
    alert("New sports event added successfully!");
  } else {
    alert("Error creating event: " + res.error);
  }
}

/**
 * Demo Data Seeder Trigger
 */
export async function runDemoSeeder() {
  playWhistleSound();
  if (confirm("Populate realistic sample scores for 3 track & field events to test live podium calculation?")) {
    await seedDemoScores();
  }
}

/**
 * Reset All Sports Day Scores
 */
export async function triggerResetScores() {
  playTapSound();
  if (confirm("DANGER: Are you sure you want to reset all event scores and house standings to zero for a fresh Sports Day?")) {
    await resetAllSportsDayScores();
    alert("Sports Day scores have been reset to zero.");
  }
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
