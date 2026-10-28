export const STATUS_LABELS = {
  confirmed: "Confirmed",
  inferred: "Inferred",
  unknown: "Unknown",
  provisional: "Provisional",
};

export const STATUS_DESCRIPTIONS = {
  confirmed: "Visible in the supplied walkthrough or stated in the owner brief.",
  inferred: "Reasonable interpretation supported by the footage, but not directly proven.",
  unknown: "Not established by the available evidence. Deliberately left unresolved.",
  provisional: "A visual modelling estimate, not a measured value.",
};

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function formatSeconds(value, decimals = 1) {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(decimals)} s`;
}

export function parseTimeLabel(label) {
  const parts = String(label)
    .trim()
    .split(":")
    .map(Number);
  if (parts.some((part) => Number.isNaN(part))) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function areaFromPolygon(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[(i + 1) % points.length];
    area += x1 * z2 - x2 * z1;
  }
  return Math.abs(area / 2);
}

export function seededRandom(seed = 1) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function safeStorageGet(key, fallback = null) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function safeStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
