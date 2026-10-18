/**
 * Subtle Pop Sound Utility for One Bite Motihari
 * Uses the Web Audio API to synthesize a pleasant, soft, non-annoying UI pop sound.
 * Zero external audio assets, zero network latency, respects browser autoplay restrictions.
 */

const SOUND_MUTE_STORAGE_KEY = 'onebite_sound_muted';

let audioCtx: AudioContext | null = null;
let lastPlayTimestamp = 0;
const MIN_CLICK_INTERVAL_MS = 65; // Avoid overlapping sounds on rapid clicks

/**
 * Lazily initialize and resume the AudioContext upon user gesture.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return null;

    if (!audioCtx) {
      audioCtx = new AudioCtxClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Checks whether sound effects are currently muted in the session.
 */
export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(SOUND_MUTE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Updates the sound mute preference and persists it in the current session.
 */
export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SOUND_MUTE_STORAGE_KEY, muted ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('onebite_sound_mute_changed', { detail: { muted } }));
  } catch {}
}

/**
 * Toggles sound muted status and returns the new value.
 */
export function toggleSound(): boolean {
  const current = isSoundMuted();
  const next = !current;
  setSoundMuted(next);
  if (!next) {
    // Play a gentle feedback pop when unmuted
    playPopSound(true);
  }
  return next;
}

/**
 * Plays a short, soft, pleasant pop sound.
 * Tuned to be subtle, clean, and unobtrusive (~45ms duration).
 * 
 * @param forcePlay If true, bypasses the mute check (used for unmute feedback).
 */
export function playPopSound(forcePlay = false): void {
  if (!forcePlay && isSoundMuted()) return;

  const now = performance.now();
  if (now - lastPlayTimestamp < MIN_CLICK_INTERVAL_MS) {
    // Avoid overlapping sounds on rapid clicks
    return;
  }
  lastPlayTimestamp = now;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Gentle bubble/wooden pop envelope
    osc.type = 'sine';
    // Frequency glide: starts at 540Hz and glides down to 240Hz
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.04);

    // Gain envelope: soft peak at ~0.08 then drops to zero smoothly
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.048);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);

    // Garbage collection cleanup
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };
  } catch {
    // Fail gracefully without interrupting UI
  }
}

/**
 * Attaches a global click listener to automatically trigger the subtle pop sound
 * on all interactive buttons, links with role="button", and clickable controls across the site.
 * 
 * Strict rules respected:
 * - Does not play for disabled buttons (disabled attribute, aria-disabled="true", or .disabled).
 * - Avoids overlapping sounds on rapid clicks.
 * - Respects autoplay restrictions by unlocking AudioContext on user interaction.
 * - Respects mute preference.
 */
let isListenerAttached = false;

export function initGlobalButtonSound(): () => void {
  if (typeof window === 'undefined' || isListenerAttached) {
    return () => {};
  }

  const handleGlobalClick = (event: MouseEvent) => {
    // Ensure AudioContext is primed on user interaction
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const target = event.target as HTMLElement | null;
    if (!target) return;

    // Check if clicked element or its ancestor is an interactive button / control
    const clickable = target.closest<HTMLElement>(
      'button, [role="button"], input[type="button"], input[type="submit"], a.btn, a[data-button="true"]'
    );

    if (!clickable) return;

    // Check if the button or control is disabled
    const isElementDisabled =
      (clickable as HTMLButtonElement).disabled === true ||
      clickable.getAttribute('aria-disabled') === 'true' ||
      clickable.classList.contains('disabled') ||
      clickable.classList.contains('pointer-events-none');

    if (isElementDisabled) {
      return; // Do NOT play sound for disabled buttons
    }

    // Check if specifically excluded
    if (clickable.dataset.noSound === 'true') {
      return;
    }

    playPopSound();
  };

  document.addEventListener('click', handleGlobalClick, true);
  isListenerAttached = true;

  return () => {
    document.removeEventListener('click', handleGlobalClick, true);
    isListenerAttached = false;
  };
}
