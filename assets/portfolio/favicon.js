(() => {
  const icon = document.querySelector('link[data-mac-favicon]');
  if (!icon) return;

  const restingIcon = icon.href;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const frameURLs = ['mac-half.png', 'mac-blink.png'].map(name => {
    const frameURL = new URL(name, restingIcon);
    frameURL.search = new URL(restingIcon).search;
    return frameURL.href;
  });
  let timer;
  let ready = false;

  // Preload two tiny frames so a blink never depends on a network round trip.
  Promise.all(frameURLs.map(src => new Promise(resolve => {
    const frame = new Image();
    frame.onload = () => resolve(true);
    frame.onerror = () => resolve(false);
    frame.src = src;
  }))).then(results => {
    ready = results.every(Boolean);
    sync();
  });

  function scheduleBlink() {
    timer = setTimeout(() => {
      const frames = [
        { src: frameURLs[0], duration: 50 },
        { src: frameURLs[1], duration: 100 },
        { src: frameURLs[0], duration: 50 },
        { src: restingIcon },
      ];
      // Occasionally blink again after a brief moment with the eyes open.
      if (Math.random() < 0.25) {
        frames[frames.length - 1].duration = 150;
        frames.push(
          { src: frameURLs[0], duration: 50 },
          { src: frameURLs[1], duration: 100 },
          { src: frameURLs[0], duration: 50 },
          { src: restingIcon },
        );
      }
      let index = 0;
      function nextFrame() {
        const frame = frames[index++];
        icon.href = frame.src;
        if (index < frames.length) timer = setTimeout(nextFrame, frame.duration);
        else scheduleBlink();
      }
      nextFrame();
    }, 7000 + Math.random() * 5000);
  }

  function sync() {
    clearTimeout(timer);
    icon.href = restingIcon;
    if (ready && !document.hidden && !motion.matches) scheduleBlink();
  }

  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => {
    clearTimeout(timer);
    icon.href = restingIcon;
  });
  window.addEventListener('pageshow', sync);
  motion.addEventListener('change', sync);
})();
