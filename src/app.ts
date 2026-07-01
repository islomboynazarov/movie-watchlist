// ==================== Types & Interfaces ====================
interface OmdbMovieBasic {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type?: string;
}

interface OmdbMovieFull extends OmdbMovieBasic {
  Plot?: string;
  Response: string;
}

interface OmdbSearchResponse {
  Search?: OmdbMovieBasic[];
  Response: string;
  Error?: string;
}

// ==================== Movie Class ====================
class Movie {
  readonly imdbID: string;
  readonly title: string;
  readonly year: string;
  readonly poster: string;
  readonly type: string;
  readonly plot: string;

  constructor(movieData: OmdbMovieBasic | OmdbMovieFull) {
    this.imdbID = movieData.imdbID;
    this.title = movieData.Title;
    this.year = movieData.Year;
    this.type = movieData.Type || "movie";
    this.plot = (movieData as OmdbMovieFull).Plot || "No plot available";

    // Handle missing poster
    this.poster =
      movieData.Poster === "N/A" || !movieData.Poster
        ? "https://via.placeholder.com/300x450?text=No+Poster"
        : movieData.Poster;
  }

  createCard(isInWatchlist = false): HTMLDivElement {
    const card = document.createElement("div");
    card.className = "movie-card";

    card.innerHTML = `
      <img src="${this.poster}" alt="${this.title}" loading="lazy">
      <div class="movie-info">
        <h3>${this.title}</h3>
        <p>${this.year} • ${this.type}</p>
        ${isInWatchlist
          ? `<button class="remove-btn" data-id="${this.imdbID}">Remove</button>`
          : `<button class="add-btn" data-id="${this.imdbID}">Add to Watchlist</button>`
        }
      </div>
    `;

    return card;
  }
}

// ==================== Storage Helper Functions ====================
const WATCHLIST_KEY = "myMovieWatchlist" as const;

function saveToLocalStorage(watchlist: Movie[]): void {
  const dataToSave = watchlist.map((movie) => ({
    imdbID: movie.imdbID,
    Title: movie.title,
    Year: movie.year,
    Poster: movie.poster,
    Type: movie.type,
    Plot: movie.plot,
  }));

  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(dataToSave));
}

function getFromLocalStorage(): OmdbMovieFull[] {
  const data = localStorage.getItem(WATCHLIST_KEY);
  return data ? JSON.parse(data) : [];
}

function loadWatchlist(): Movie[] {
  const savedMovies = getFromLocalStorage();
  return savedMovies.map((movieData) => new Movie(movieData));
}

// ==================== State & DOM Elements ====================
let watchlist: Movie[] = loadWatchlist();

const searchForm = document.getElementById("search-form") as HTMLFormElement;
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const resultsContainer = document.getElementById("results-container") as HTMLDivElement;
const watchlistContainer = document.getElementById("watchlist-container") as HTMLDivElement;
const watchlistCount = document.getElementById("watchlist-count") as HTMLElement;

// ==================== Render Watchlist ====================
function renderWatchlist(): void {
  watchlistContainer.innerHTML = "";

  if (watchlist.length === 0) {
    watchlistContainer.innerHTML = `
      <p style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 2rem;">
        Your watchlist is empty.<br>Search for movies and add them!
      </p>`;
    watchlistCount.textContent = "(0)";
    return;
  }

  watchlist.forEach((movie) => {
    const card = movie.createCard(true);
    watchlistContainer.appendChild(card);
  });

  watchlistCount.textContent = `(${watchlist.length})`;
}

// ==================== Search Functionality ====================
async function searchMovies(query: string): Promise<void> {
  try {
    resultsContainer.innerHTML = `<p>Searching for "${query}"...</p>`;

    const url = `http://www.omdbapi.com/?apikey=e72f9e6f&s=${encodeURIComponent(query)}`;
    console.log("Fetching from:", url);   // ← Add this for debugging

    const response = await fetch(url);
    console.log("Response status:", response.status);

    const data: OmdbSearchResponse = await response.json();
    console.log("API Response:", data);   // ← Very important

    if (data.Response === "False" || !data.Search) {
      resultsContainer.innerHTML = `
        <p style="color: #ef4444;">No movies found for "${query}".<br>Error: ${data.Error || 'Unknown'}</p>`;
      return;
    }

    resultsContainer.innerHTML = '';
    data.Search.forEach(movieData => {
      const movie = new Movie(movieData);
      resultsContainer.appendChild(movie.createCard(false));
    });

  } catch (error) {
    console.error("Full Error:", error);
    resultsContainer.innerHTML = `<p style="color: red;">Network error. Check console.</p>`;
  }
}

// ==================== Watchlist Operations ====================
function addToWatchlist(imdbID: string): void {
  if (watchlist.some((movie) => movie.imdbID === imdbID)) {
    alert("This movie is already in your watchlist!");
    return;
  }

  fetch(`http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbID}`)
    .then((res) => res.json())
    .then((movieData: OmdbMovieFull) => {
      if (movieData.Response === "True") {
        const newMovie = new Movie(movieData);
        watchlist.push(newMovie);

        saveToLocalStorage(watchlist);
        renderWatchlist();

        alert(`${newMovie.title} added to your watchlist!`);
      }
    })
    .catch((err) => {
      console.error("Failed to add movie:", err);
      alert("Failed to add movie. Please try again.");
    });
}

function removeFromWatchlist(imdbID: string): void {
  watchlist = watchlist.filter((movie) => movie.imdbID !== imdbID);
  saveToLocalStorage(watchlist);
  renderWatchlist();
}

// ==================== Event Listeners ====================
function handleDocumentClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;

  if (target.classList.contains("add-btn")) {
    const imdbID = target.dataset.id;
    if (imdbID) addToWatchlist(imdbID);
  }

  if (target.classList.contains("remove-btn")) {
    const imdbID = target.dataset.id;
    if (imdbID) removeFromWatchlist(imdbID);
  }
}

searchForm.addEventListener("submit", (event: SubmitEvent) => {
  event.preventDefault();
  const query = searchInput.value.trim();

  if (query.length < 3) {
    alert("Please enter at least 3 characters to search");
    return;
  }

  searchMovies(query);
});

// Clear Results Button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear Results";
clearButton.style.marginLeft = "10px";
clearButton.style.background = "#64748b";

clearButton.addEventListener("click", () => {
  resultsContainer.innerHTML = `
    <p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem;">
      Search for movies to get started
    </p>`;
  searchInput.value = "";
});

searchForm.appendChild(clearButton);

// Global click handler (event delegation)
document.addEventListener("click", handleDocumentClick);

// ==================== Initialize ====================
renderWatchlist();