/**
 * H. Cem Öztürk — Products & Timeline Page Script
 * Theme toggle, obfuscated email assembly, and interactive 3D showcase deck micro-interactions.
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. THEME SWITCHER
  // ==========================================
  const themeToggle = document.getElementById("themeToggle");
  const storedTheme = localStorage.getItem("theme");

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    if (theme === "dark" || theme === "light") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  if (storedTheme) {
    applyTheme(storedTheme);
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || getSystemTheme();
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      showToast(`Switched to ${newTheme} mode`);
    });
  }

  // ==========================================
  // 2. TOAST NOTIFICATION UTILITY
  // ==========================================
  const toast = document.getElementById("toastPopup");
  let toastTimer = null;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  }

  // ==========================================
  // 3. OBFUSCATED EMAIL LINK
  // ==========================================
  const emailUser = "hi";
  const emailDomain = "hcemozturk.com";
  const emailAddress = `${emailUser}@${emailDomain}`;
  const emailBtn = document.getElementById("emailLink");

  if (emailBtn) {
    emailBtn.textContent = "Email";
    emailBtn.setAttribute("href", `mailto:${emailAddress}`);
  }

  // ==========================================
  // 4. INTERACTIVE 3D PERSPECTIVE ON SHOWCASE DECKS
  // ==========================================
  const showcaseDecks = document.querySelectorAll(".showcase-deck");

  showcaseDecks.forEach((deck) => {
    deck.addEventListener("mousemove", (e) => {
      const rect = deck.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within element
      const y = e.clientY - rect.top;  // y position within element
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6; // max 6deg tilt
      const rotateY = ((x - centerX) / centerX) * 6;

      deck.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    });

    deck.addEventListener("mouseleave", () => {
      deck.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    });
  });

  // ==========================================
  // 5. VIEWPORT-AWARE DEMO VIDEOS
  // ==========================================
  const demoVideos = Array.from(document.querySelectorAll(".wobbit-demo-video"));
  const demoMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

  function syncDemoVideo(video) {
    const shouldPlay = video.dataset.inView === "true"
      && !document.hidden
      && !demoMotionPreference.matches;

    if (shouldPlay) {
      video.play().catch(() => {
        // The poster remains visible if the browser declines autoplay.
      });
    } else {
      video.pause();
    }
  }

  if ("IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        video.dataset.inView = String(entry.isIntersecting && entry.intersectionRatio >= 0.35);
        syncDemoVideo(video);
      });
    }, { threshold: [0, 0.35, 0.75] });

    demoVideos.forEach((video) => videoObserver.observe(video));
  }

  function syncDemoVideos() {
    demoVideos.forEach(syncDemoVideo);
  }

  document.addEventListener("visibilitychange", syncDemoVideos);
  demoMotionPreference.addEventListener?.("change", syncDemoVideos);

  // ==========================================
  // 6. PRODUCT METRO LINE
  // ==========================================
  const timelineFeed = document.querySelector(".timeline-feed");
  const productRows = Array.from(document.querySelectorAll(".timeline-feed > .product-row"));
  const finaleCopy = document.querySelector(".finale-copy");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let finaleRevealed = false;
  let finaleUsesObserver = false;
  let metroFrame = null;

  function revealFinale() {
    if (finaleRevealed) return;
    finaleRevealed = true;
    document.body.classList.add("finale-is-revealed");
  }

  if (finaleCopy && "IntersectionObserver" in window) {
    finaleUsesObserver = true;
    const finaleObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        revealFinale();
        finaleObserver.disconnect();
      }
    }, { threshold: 0.2 });

    finaleObserver.observe(finaleCopy);
  }

  function updateStationPositions() {
    const isMobile = window.innerWidth <= 980;

    productRows.forEach((row) => {
      const title = row.querySelector(".product-title");
      if (title) {
        const rowRect = row.getBoundingClientRect();
        const titleRect = title.getBoundingClientRect();
        const stationY = titleRect.top + titleRect.height / 2 - rowRect.top;
        row.style.setProperty("--station-y", `${stationY}px`);
      }

      const branch = row.querySelector(".akbank-branch");
      if (branch) {
        row.style.setProperty("--branch-y", `${branch.offsetTop}px`);

        const firstBranchStation = branch.querySelector(".branch-juzdan .branch-station");
        const finalBranchStation = branch.querySelector(".branch-nfc .branch-station");
        if (firstBranchStation && finalBranchStation) {
          const routeSvg = row.querySelector(".akbank-route-svg");
          const routePath = row.querySelector(".akbank-route-path");
          const station = row.querySelector(".metro-station");

          if (routeSvg && routePath && station) {
            const rowRect = row.getBoundingClientRect();
            const branchRect = branch.getBoundingClientRect();
            const stationRect = station.getBoundingClientRect();
            const firstBranchStationRect = firstBranchStation.getBoundingClientRect();
            const finalBranchStationRect = finalBranchStation.getBoundingClientRect();
            const redOffset = 9;
            const startX = stationRect.left + stationRect.width / 2 - rowRect.left + redOffset;
            const startY = stationRect.top + stationRect.height / 2 - rowRect.top;
            const firstStationX = firstBranchStationRect.left + firstBranchStationRect.width / 2 - rowRect.left;
            const firstStationY = firstBranchStationRect.top + firstBranchStationRect.height / 2 - rowRect.top;
            const finalStationX = finalBranchStationRect.left + finalBranchStationRect.width / 2 - rowRect.left;
            const finalStationY = finalBranchStationRect.top + finalBranchStationRect.height / 2 - rowRect.top;
            const branchX = isMobile
              ? firstStationX
              : branchRect.left - rowRect.left + redOffset;
            const turnY = firstStationY - Math.abs(branchX - startX);
            const pathData = isMobile
              ? `M ${startX} ${startY} L ${startX} ${turnY} L ${branchX} ${firstStationY} L ${branchX} ${finalStationY}`
              : `M ${startX} ${startY} L ${startX} ${turnY} L ${branchX} ${firstStationY} L ${finalStationX} ${firstStationY}`;

            routeSvg.setAttribute("viewBox", `0 0 ${row.offsetWidth} ${row.offsetHeight}`);
            routePath.setAttribute("d", pathData);
          }
        }
      }
    });
  }

  function updateMetro() {
    metroFrame = null;
    if (!timelineFeed || productRows.length === 0) return;

    const viewportMarker = window.innerHeight * 0.5;

    let activeIndex = 0;

    productRows.forEach((row, index) => {
      const station = row.querySelector(".metro-station");
      const stationRect = station?.getBoundingClientRect();
      const rowMarker = stationRect
        ? stationRect.top + stationRect.height / 2
        : row.getBoundingClientRect().top;

      // Keep the previous station active until the next station itself
      // crosses the viewport midpoint.
      if (rowMarker <= viewportMarker) {
        activeIndex = index;
      }
    });

    productRows.forEach((row, index) => {
      const station = row.querySelector(".metro-station");
      row.classList.toggle("is-active", index === activeIndex);
      row.classList.toggle("is-past", index < activeIndex);

      if (station) {
        if (index === activeIndex) {
          station.setAttribute("aria-current", "true");
        } else {
          station.removeAttribute("aria-current");
        }
      }
    });

    if (!finaleUsesObserver && activeIndex === productRows.length - 1) {
      revealFinale();
    }

  }

  function requestMetroUpdate() {
    if (metroFrame !== null) return;
    metroFrame = window.requestAnimationFrame(updateMetro);
  }

  function refreshMetroLayout() {
    updateStationPositions();
    requestMetroUpdate();
  }

  if (timelineFeed && productRows.length > 0) {
    updateStationPositions();
    updateMetro();
    window.addEventListener("scroll", requestMetroUpdate, { passive: true });
    window.addEventListener("resize", refreshMetroLayout);
    window.addEventListener("load", refreshMetroLayout, { once: true });
    document.fonts?.ready.then(refreshMetroLayout);

    prefersReducedMotion.addEventListener?.("change", refreshMetroLayout);
  }
});
