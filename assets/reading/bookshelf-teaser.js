(() => {
const { loadReadingData, safeHttpUrl } = window.ReadingData;

const coverStack = document.querySelector("[data-personal-reading-covers]");

function createTeaserCover(book) {
  const coverUrl = safeHttpUrl(book.cover);
  if (!coverUrl) {
    const placeholder = document.createElement("span");
    placeholder.className = "personal-reading-cover personal-reading-cover-placeholder";
    return placeholder;
  }

  const image = document.createElement("img");
  image.className = "personal-reading-cover";
  image.src = coverUrl;
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => image.remove(), { once: true });
  return image;
}

async function loadTeaserCovers() {
  if (!coverStack) return;

  try {
    const { current, read } = await loadReadingData();
    const featuredBooks = (read.length ? read : current).slice(0, 3);
    if (!featuredBooks.length) return;
    coverStack.replaceChildren(...featuredBooks.map(createTeaserCover));
  } catch {
    // The link and its abstract cover fan remain useful when the feed is unavailable.
  }
}

loadTeaserCovers();
})();
