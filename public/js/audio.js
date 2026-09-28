/**
 * Web Audio API Synthesizer for Interhouse Sports Day
 * Generates procedural athletic sound effects with zero external audio assets!
 */

let audioCtx = null;
let soundEnabled = true;

function getAudioContext() {
  if (!audioCtx && typeof window !== "undefined") {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleSound(forceState) {
  if (typeof forceState === "boolean") {
    soundEnabled = forceState;
  } else {
    soundEnabled = !soundEnabled;
  }
  localStorage.setItem("juilliard_sound_enabled", soundEnabled ? "true" : "false");
  return soundEnabled;
}

export function isSoundEnabled() {
  const stored = localStorage.getItem("juilliard_sound_enabled");
  if (stored !== null) {
    soundEnabled = stored === "true";
  }
  return soundEnabled;
}

let lastTapTimestamp = 0;

/**
 * Play Sports Whistle / Start Tone (Softened)
 */
export function playWhistleSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(2200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2600, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.22);

    filter.type = "bandpass";
    filter.frequency.value = 2400;
    filter.Q.value = 2;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch (err) {
    console.debug("Audio play error:", err);
  }
}

/**
 * Play Victory Fanfare / Points Award Chime (Gentle)
 */
export function playScoreCelebration() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.07;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.04, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0005, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.38);
    });
  } catch (err) {
    console.debug("Celebration audio error:", err);
  }
}

/**
 * Play crisp tap / UI click (Ultra-soft, throttled)
 */
export function playTapSound() {
  if (!soundEnabled) return;
  const now = Date.now();
  if (now - lastTapTimestamp < 90) return; // prevent spamming clicks
  lastTapTimestamp = now;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(380, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0002, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch (err) {
    console.debug("Tap sound error:", err);
  }
}
