/**
 * Theme Management Module — Light & Dark Mode Support
 * Juilliard Academy Interhouse Sports Day
 */

import { ICONS } from "./icons.js";
import { playTapSound } from "./audio.js";

const THEME_STORAGE_KEY = "juilliard_theme";

export function getPreferredTheme() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramTheme = urlParams.get("theme");
  if (paramTheme === "light" || paramTheme === "dark") return paramTheme;

  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  // Fallback to dark theme for sports broadcast aesthetic
  return "dark";
}

export function applyTheme(theme) {
  const activeTheme = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", activeTheme);
  document.body.setAttribute("data-theme", activeTheme);
  localStorage.setItem(THEME_STORAGE_KEY, activeTheme);

  // Update mobile status bar theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", activeTheme === "light" ? "#F4F5F7" : "#0A0A0C");
  }

  // Update theme toggle button icon & title
  const btn = document.getElementById("btn-toggle-theme");
  if (btn) {
    btn.innerHTML = activeTheme === "dark" ? ICONS.sun : ICONS.moon;
    btn.setAttribute("title", activeTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode");
    btn.setAttribute("aria-label", activeTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode");
  }
}

export function toggleTheme() {
  playTapSound();
  const current = getPreferredTheme();
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

export function initTheme() {
  const theme = getPreferredTheme();
  applyTheme(theme);

  const btn = document.getElementById("btn-toggle-theme");
  if (btn) {
    btn.addEventListener("click", () => toggleTheme());
  }
}
