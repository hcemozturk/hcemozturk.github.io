(() => {
  const READING_FEED_URL = "https://cem-book-data.vercel.app/books.json";

  function firstValue(source, keys) {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return "";
  }

  function normalizeAuthor(value) {
    if (Array.isArray(value)) {
      return value.map((author) => String(author).trim()).filter(Boolean).join(", ");
    }
    return String(value || "").trim();
  }

  function normalizeRating(value) {
    if (value === "" || value === null || value === undefined) return null;
    const rating = Number(value);
    return Number.isFinite(rating) && rating >= 1 && rating <= 5 ? Math.round(rating) : null;
  }

  function normalizeBook(rawBook) {
    return {
      title: String(firstValue(rawBook, ["title", "name", "bookTitle"]) || "Untitled"),
      author: normalizeAuthor(firstValue(rawBook, ["author", "authors", "bookAuthor"])),
      cover: String(firstValue(rawBook, ["coverImageUrl", "cover", "coverUrl", "coverURL", "image", "imageUrl", "thumbnail"]) || ""),
      url: String(firstValue(rawBook, ["url", "link", "bookUrl", "goodreadsUrl", "goodreadsURL"]) || ""),
      startDate: String(firstValue(rawBook, ["startDate", "startedAt", "dateStarted"]) || ""),
      readDate: String(firstValue(rawBook, ["readDate", "finishedAt", "dateRead", "dateFinished"]) || ""),
      rating: normalizeRating(firstValue(rawBook, ["rating", "myRating", "userRating", "stars"]))
    };
  }

  function asBookArray(value) {
    if (!Array.isArray(value)) return [];
    return value.filter((book) => book && typeof book === "object").map(normalizeBook);
  }

  function normalizeReadingData(data) {
    if (Array.isArray(data)) {
      const books = data.filter((book) => book && typeof book === "object");
      const currentBooks = books.filter((book) => /current|reading/i.test(String(firstValue(book, ["status", "shelf", "state"]))));
      const readBooks = books.filter((book) => !currentBooks.includes(book));
      return { current: asBookArray(currentBooks), read: asBookArray(readBooks) };
    }

    const current = asBookArray(firstValue(data, ["currentlyReading", "currentReads", "current", "reading"]));
    const read = asBookArray(firstValue(data, ["recentlyRead", "recentReads", "recent", "finished", "read"]));

    read.sort((left, right) => String(right.readDate).localeCompare(String(left.readDate)));
    return { current, read };
  }

  function safeHttpUrl(value, baseUrl = window.location.href) {
    if (!value) return "";
    try {
      const url = new URL(value, baseUrl);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  async function loadReadingData() {
    const response = await fetch(READING_FEED_URL, {
      cache: "no-store",
      headers: { Accept: "application/json" }
    });

    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
      throw new Error("The reading feed returned an unexpected response.");
    }

    return normalizeReadingData(await response.json());
  }

  window.ReadingData = {
    READING_FEED_URL,
    loadReadingData,
    normalizeReadingData,
    safeHttpUrl
  };
})();
