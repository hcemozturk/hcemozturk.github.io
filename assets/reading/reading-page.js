(() => {
const { loadReadingData, safeHttpUrl } = window.ReadingData;

const currentSection = document.querySelector("[data-current-section]");
const currentGrid = document.querySelector("[data-current-grid]");
const readSection = document.querySelector("[data-read-section]");
const readYears = document.querySelector("[data-read-years]");
const readingStatus = document.querySelector("[data-reading-status]");
const placeCopy = document.querySelector("[data-place-copy]");

function updatePlaceCopy() {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    hour12: false
  });
  const hour = Number(formatter.format(new Date()));
  placeCopy.textContent = hour >= 7 && hour < 19 ? "In my backpack" : "On my nightstand";
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function createCover(book, eager = false) {
  const frame = document.createElement("div");
  frame.className = "book-cover-frame";

  const coverUrl = safeHttpUrl(book.cover);
  if (!coverUrl) {
    const placeholder = document.createElement("span");
    placeholder.className = "book-cover-placeholder";
    placeholder.textContent = book.title.slice(0, 1).toUpperCase();
    placeholder.setAttribute("aria-hidden", "true");
    frame.append(placeholder);
    return frame;
  }

  const image = document.createElement("img");
  image.className = "book-cover";
  image.src = coverUrl;
  image.alt = `Cover of ${book.title}`;
  image.loading = eager ? "eager" : "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => {
    const placeholder = document.createElement("span");
    placeholder.className = "book-cover-placeholder";
    placeholder.textContent = book.title.slice(0, 1).toUpperCase();
    placeholder.setAttribute("aria-hidden", "true");
    image.replaceWith(placeholder);
  }, { once: true });
  frame.append(image);
  return frame;
}

function createRating(rating) {
  if (rating === null) return null;

  const ratingRow = document.createElement("span");
  ratingRow.className = "book-rating";
  ratingRow.setAttribute("aria-label", `Rated ${rating} out of 5 stars`);

  const filled = document.createElement("span");
  filled.className = "book-rating-filled";
  filled.setAttribute("aria-hidden", "true");
  filled.textContent = "★".repeat(rating);

  const empty = document.createElement("span");
  empty.className = "book-rating-empty";
  empty.setAttribute("aria-hidden", "true");
  empty.textContent = "☆".repeat(5 - rating);

  ratingRow.append(filled, empty);
  return ratingRow;
}

function createBookCopy(book, headingLevel) {
  const copy = document.createElement("div");
  copy.className = "book-copy";

  const title = document.createElement(headingLevel);
  title.className = "book-title";
  title.textContent = book.title;
  copy.append(title);

  if (book.author) {
    const author = document.createElement("p");
    author.className = "book-author";
    author.textContent = book.author;
    copy.append(author);
  }

  return copy;
}

function createCurrentBook(book, index) {
  const card = document.createElement("article");
  card.className = "current-book";
  card.append(createCover(book, index < 2));

  const copy = createBookCopy(book, "h3");
  const started = formatDate(book.startDate);
  if (started) {
    const date = document.createElement("p");
    date.className = "book-date";
    date.textContent = `Started ${started}`;
    copy.append(date);
  }

  card.append(copy);
  return card;
}

function createReadBook(book) {
  const card = document.createElement("article");
  card.className = "read-book";
  card.append(createCover(book));

  const copy = createBookCopy(book, "h4");
  const rating = createRating(book.rating);
  if (rating) copy.append(rating);
  card.append(copy);
  return card;
}

function readYear(book) {
  const match = /^(\d{4})-/.exec(book.readDate);
  return match ? match[1] : "Earlier";
}

function groupReadBooks(books) {
  return books.reduce((groups, book) => {
    const year = readYear(book);
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(book);
    return groups;
  }, new Map());
}

function createYearSection(year, books) {
  const section = document.createElement("section");
  section.className = "reading-year";
  section.setAttribute("aria-labelledby", `reading-year-${year.toLowerCase()}`);

  const headingRow = document.createElement("div");
  headingRow.className = "reading-year-heading";
  const heading = document.createElement("h3");
  heading.id = `reading-year-${year.toLowerCase()}`;
  heading.textContent = year;
  headingRow.append(heading);

  const grid = document.createElement("div");
  grid.className = "read-grid";
  grid.append(...books.map(createReadBook));
  section.append(headingRow, grid);
  return section;
}

async function renderReading() {
  updatePlaceCopy();

  try {
    const { current, read } = await loadReadingData();

    if (current.length) {
      currentGrid.replaceChildren(...current.map(createCurrentBook));
      currentSection.hidden = false;
    }

    if (read.length) {
      readYears.replaceChildren(...Array.from(groupReadBooks(read), ([year, books]) => createYearSection(year, books)));
      readSection.hidden = false;
    }

    readingStatus.hidden = true;
  } catch {
    readingStatus.textContent = "My reading list is taking a short break. Please try again later.";
  }
}

renderReading();
})();
