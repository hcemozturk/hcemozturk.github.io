"use strict";

// Beige uses the original Macintosh; the other swatches use colored iMacs.
const colors = {
  beige: { label: "Beige", design: "macintosh", image: "macintosh-body.webp", width: 1100, height: 1536 },
  "bondi-blue": { label: "Bondi Blue", design: "imac", image: "imac-bondi-blue.webp", width: 1254, height: 1254 },
  tangerine: { label: "Tangerine", design: "imac", image: "imac-tangerine.webp", width: 1254, height: 1254 },
  lime: { label: "Lime", design: "imac", image: "imac-lime.webp", width: 1254, height: 1254 },
  strawberry: { label: "Strawberry", design: "imac", image: "imac-strawberry.webp", width: 1254, height: 1254 },
  grape: { label: "Grape", design: "imac", image: "imac-grape.webp", width: 1254, height: 1254 },
};
const states = {
  idle: { label: "Standing by" },
  thinking: { label: "Thinking" },
  working: { label: "Coding" },
  attention: { label: "Needs your input" },
  completed: { label: "Completed" },
};
const stateSequence = Object.keys(states);
const stage = document.getElementById("characterStage");
const shell = document.getElementById("characterShell");
const motionButton = document.getElementById("motionToggle");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let color = "beige";
let stateIndex = 0;
let motionPaused = false;
let heroVisible = true;
let cycleTimer = null;

function markSelected(selector, attribute, selected) {
  document.querySelectorAll(selector).forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset[attribute] === selected));
  });
}

function renderDesign() {
  const item = colors[color];
  const state = stateSequence[stateIndex];
  stage.dataset.design = item.design;
  stage.dataset.state = state;
  const src = `../assets/wobbit/${item.image}`;
  if (shell.getAttribute("src") !== src) shell.src = src;
  shell.width = item.width;
  shell.height = item.height;
  document.getElementById("character").setAttribute("aria-label", `${item.label} Wobbit, ${states[state].label.toLowerCase()}`);
  // This changes automatically, so avoid repeatedly announcing it with aria-live.
  document.getElementById("previewStatus").textContent = states[state].label;
  markSelected(".color-options button", "color", color);
}

const imageLoads = new Map();
let colorRequest = 0;
function loadImage(src) {
  if (!imageLoads.has(src)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = async () => {
        try { if (image.decode) await image.decode(); resolve(); }
        catch (error) { imageLoads.delete(src); reject(error); }
      };
      image.onerror = () => { imageLoads.delete(src); reject(new Error("Artwork could not load")); };
      image.src = src;
    });
    imageLoads.set(src, promise);
  }
  return imageLoads.get(src);
}
function warmColor(key) {
  const item = colors[key];
  const loads = [loadImage(`../assets/wobbit/${item.image}`)];
  if (item.design === "imac") loads.push(loadImage("../assets/wobbit/imac-mask.webp"));
  return Promise.all(loads);
}
document.querySelectorAll(".color-options button").forEach((button) => {
  button.disabled = false;
  for (const event of ["pointerenter", "focus", "touchstart"]) {
    button.addEventListener(event, () => { warmColor(button.dataset.color).catch(() => {}); }, { passive: true });
  }
  button.addEventListener("click", async () => {
    const request = ++colorRequest;
    const nextColor = button.dataset.color;
    button.setAttribute("aria-busy", "true");
    try {
      await warmColor(nextColor);
      if (request === colorRequest) { color = nextColor; renderDesign(); }
    } catch { /* Keep the current Wobbit visible if an asset fails to load. */ }
    finally { button.removeAttribute("aria-busy"); }
  });
});

function renderMotion() {
  const active = !motionPaused && !motionPreference.matches && heroVisible && !document.hidden;
  document.documentElement.classList.toggle("preview-motion", active);
  motionButton.disabled = motionPreference.matches;
  motionButton.setAttribute("aria-pressed", String(motionPaused || motionPreference.matches));
  motionButton.textContent = motionPreference.matches ? "Motion reduced" : motionPaused ? "Resume motion" : "Pause motion";
  if (!active && cycleTimer !== null) {
    clearTimeout(cycleTimer);
    cycleTimer = null;
  }
  if (active && cycleTimer === null) {
    cycleTimer = setTimeout(() => {
      cycleTimer = null;
      stateIndex = (stateIndex + 1) % stateSequence.length;
      renderDesign();
      renderMotion();
    }, 3600);
  }
}
motionButton.addEventListener("click", () => { motionPaused = !motionPaused; renderMotion(); });
motionPreference.addEventListener("change", () => {
  if (motionPreference.matches) document.getElementById("wobbitVideo").pause();
  renderMotion();
});
document.addEventListener("visibilitychange", renderMotion);
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    renderMotion();
  }, { threshold: 0.15 }).observe(stage);
}
const logo = document.createElement("span");
logo.className = "character-logo";
logo.setAttribute("aria-hidden", "true");
document.getElementById("character").append(logo);
renderDesign();
renderMotion();

const video = document.getElementById("wobbitVideo");
const videoToggle = document.getElementById("demoVideoToggle");
let videoStarted = false;
let videoVisible = false;
let resumeVideo = false;
videoToggle.disabled = false;
function playDemo() {
  videoStarted = true;
  video.play().catch(() => { videoToggle.textContent = "Play demo"; });
}
videoToggle.addEventListener("click", () => {
  if (video.paused) playDemo();
  else { resumeVideo = false; video.pause(); }
});
video.addEventListener("play", () => { videoToggle.textContent = "Pause demo"; videoStarted = true; });
video.addEventListener("pause", () => { videoToggle.textContent = "Play demo"; });
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    videoVisible = entry.isIntersecting;
    if (videoVisible && !document.hidden) {
      if ((!videoStarted || resumeVideo) && !motionPreference.matches) playDemo();
      resumeVideo = false;
    } else {
      resumeVideo = !video.paused;
      video.pause();
    }
  }, { threshold: 0.35 }).observe(video);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (videoVisible) resumeVideo = !video.paused;
    video.pause();
  } else if (videoVisible && resumeVideo && !motionPreference.matches) {
    resumeVideo = false;
    playDemo();
  }
});
motionPreference.addEventListener("change", () => {
  if (motionPreference.matches) { resumeVideo = false; video.pause(); }
});
function revealSecurityNote() {
  if (window.location.hash === "#download-security") document.getElementById("download-security").open = true;
}
window.addEventListener("hashchange", revealSecurityNote);
revealSecurityNote();
