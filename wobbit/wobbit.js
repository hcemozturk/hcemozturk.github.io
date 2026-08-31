const screen = document.getElementById("macScreen");
const statusText = document.getElementById("statusText");
const activeLine = document.getElementById("activeLine");

const states = [
  { mode: "idle", label: "Standing by", tint: "#a8d1bd" },
  { mode: "thinking", label: "Thinking", tint: "#85e5ff" },
  { mode: "waiting", label: "Needs your input", tint: "#ffb34c" },
  { mode: "coding", label: "Coding", tint: "#85e5ff" },
  { mode: "idle", label: "Completed", tint: "#6aff94" },
];

let stateIndex = 0;
let lastSwitch = performance.now();

function render(now) {
  if (now - lastSwitch > 3200) {
    stateIndex = (stateIndex + 1) % states.length;
    lastSwitch = now;
    const state = states[stateIndex];
    screen.dataset.mode = state.mode;
    statusText.textContent = state.label;
    document.documentElement.style.setProperty("--screen-tint", state.tint);
  }

  activeLine.style.transform = `translateY(${Math.round((now / 20) % Math.max(1, screen.clientHeight))}px)`;
  requestAnimationFrame(render);
}

screen.dataset.mode = states[0].mode;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduceMotion) requestAnimationFrame(render);

document.querySelectorAll("video").forEach((video) => {
  if (reduceMotion) {
    video.removeAttribute("autoplay");
    video.pause();
    return;
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.2 }).observe(video);
  }
});
