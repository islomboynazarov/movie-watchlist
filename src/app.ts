// ==================== Interfaces ====================
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
  constructor(movieData) {
    this.imdbID = movieData.imdbID;
    this.title  = movieData.Title;
    this.year   = movieData.Year;
    this.poster = movieData.Poster;

    // Handle missing poster
    if (this.poster === "N/A" || !this.poster) {
      this.poster = "https://via.placeholder.com/300x450?text=No+Poster";
    }

    this.type   = movieData.Type || "movie";
    this.plot   = movieData.Plot || "No plot available";
  }

  createCard(isInWatchlist = false) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img src="${this.poster}" alt="${this.title}">
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
const WATCHLIST_KEY = 'myMovieWatchlist';

function saveToLocalStorage(watchlistArray) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlistArray));
}

function getFromLocalStorage() {
  const data = localStorage.getItem(WATCHLIST_KEY);
  return data ? JSON.parse(data) : [];
}

// Load saved movies and turn them back into Movie objects
function loadWatchlist() {
  const savedMovies = getFromLocalStorage();
  return savedMovies.map(movieData => new Movie(movieData));
}

// ==================== State & DOM Elements ====================
let watchlist = loadWatchlist();   // This loads saved movies (currently empty)

// Get all HTML elements we need
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');
const watchlistContainer = document.getElementById('watchlist-container');
const watchlistCount = document.getElementById('watchlist-count');

// ==================== Render Watchlist Function ====================
function renderWatchlist() {
  watchlistContainer.innerHTML = '';   // Clear previous content

  if (watchlist.length === 0) {
    watchlistContainer.innerHTML = `
      <p style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 2rem;">
        Your watchlist is empty.<br>Search for movies and add them!
      </p>`;
    watchlistCount.textContent = '(0)';
    return;
  }

  // Create a card for every movie in watchlist
  watchlist.forEach(movie => {
    const card = movie.createCard(true);   // true = show Remove button
    watchlistContainer.appendChild(card);
  });

  watchlistCount.textContent = `(${watchlist.length})`;
}

// Initial render when page loads
renderWatchlist();

// ==================== Search Functionality ====================

async function searchMovies(query) {
  try {
    const response = await fetch(`http://www.omdbapi.com/?apikey=e72f9e6f&s=${query}`);
    const data = await response.json();

    if (data.Response === "False") {
      resultsContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #ef4444;">No movies found for "${query}"</p>`;
      return;
    }

    resultsContainer.innerHTML = '';   // Clear previous results

    // data.Search is an array of movie objects from OMDB
    data.Search.forEach(movieData => {
      const movie = new Movie(movieData);
      const card = movie.createCard(false);   // false = show "Add" button
      resultsContainer.appendChild(card);
    });

  } catch (error) {
    console.error("Search error:", error);
    resultsContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #ef4444;">Something went wrong. Please try again.</p>`;
  }
}

// Handle search form submission
searchForm.addEventListener('submit', (event) => {
  event.preventDefault();                    // Stop page from reloading
  const query = searchInput.value.trim();

  if (query) {
    searchMovies(query);
  }
});


// ==================== Add to Watchlist Logic ====================

// This function adds a movie to watchlist
function addToWatchlist(imdbID) {
  // Check if already in watchlist
  if (watchlist.some(movie => movie.imdbID === imdbID)) {
    alert("This movie is already in your watchlist!");
    return;
  }

  // For now, we will re-fetch the movie details from OMDB using imdbID
  // This is not the most efficient, but it's simple and works well for learning
  fetch(`http://www.omdbapi.com/?apikey=e72f9e6f&i=${imdbID}`)
    .then(res => res.json())
    .then(movieData => {
      if (movieData.Response === "True") {
        const newMovie = new Movie(movieData);
        
        watchlist.push(newMovie);           // Add to our array
        saveToLocalStorage(watchlist);      // Save to localStorage
        renderWatchlist();                  // Refresh the watchlist UI

        alert(`${newMovie.title} added to your watchlist!`);
      }
    })
    .catch(err => {
      console.error("Failed to add movie:", err);
      alert("Failed to add movie. Please try again.");
    });
}

// Event Delegation - One listener for all dynamic buttons
document.addEventListener('click', (event) => {
  const target = event.target;

  // Add button clicked
  if (target.classList.contains('add-btn')) {
    const imdbID = target.dataset.id;
    addToWatchlist(imdbID);
  }

  // Remove button clicked (we'll implement remove next)
  if (target.classList.contains('remove-btn')) {
    const imdbID = target.dataset.id;
    removeFromWatchlist(imdbID);
  }
});


// ==================== Remove from Watchlist ====================
function removeFromWatchlist(imdbID) {
  // Filter out the movie with matching imdbID
  watchlist = watchlist.filter(movie => movie.imdbID !== imdbID);

  // Save the updated list
  saveToLocalStorage(watchlist);

  // Re-render the watchlist
  renderWatchlist();

  // Optional: nice feedback
  // alert("Movie removed from watchlist");   // you can uncomment if you want
}


// ==================== Final Polish & Extra Features ====================

// Clear search results button functionality
function clearSearchResults() {
  resultsContainer.innerHTML = `
    <p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem;">
      Search for movies to get started
    </p>`;
  searchInput.value = '';
}

// Add a "Clear Results" button to the header (optional but nice)
const clearButton = document.createElement('button');
clearButton.textContent = 'Clear Results';
clearButton.style.marginLeft = '10px';
clearButton.style.background = '#64748b';

clearButton.addEventListener('click', () => {
  clearSearchResults();
});

document.getElementById('search-form').appendChild(clearButton);

// Loading indicator while searching
async function searchMovies(query) {
  try {
    // Show loading state
    resultsContainer.innerHTML = `
      <p style="grid-column: 1/-1; text-align: center; color: #64748b;">
        Searching for "${query}"...
      </p>`;

    const response = await fetch(`http://www.omdbapi.com/?apikey=e72f9e6f&s=${query}`);
    const data = await response.json();

    if (data.Response === "False" || !data.Search) {
      resultsContainer.innerHTML = `
        <p style="grid-column: 1/-1; text-align: center; color: #ef4444;">
          No movies found for "${query}"
        </p>`;
      return;
    }

    resultsContainer.innerHTML = ''; 

    data.Search.forEach(movieData => {
      const movie = new Movie(movieData);
      const card = movie.createCard(false);   // false = Add button
      resultsContainer.appendChild(card);
    });

  } catch (error) {
    console.error("Search error:", error);
    resultsContainer.innerHTML = `
      <p style="grid-column: 1/-1; text-align: center; color: #ef4444;">
        Something went wrong. Please try again later.
      </p>`;
  }
}

// Bonus: Show watchlist stats
function updateWatchlistStats() {
  const total = watchlist.length;
  const moviesOnly = watchlist.filter(m => m.type === 'movie').length;
  
  console.log(`Watchlist Stats → Total: ${total} | Movies: ${moviesOnly}`);
}

// Call it after render
const originalRenderWatchlist = renderWatchlist;
renderWatchlist = function() {
  originalRenderWatchlist.call(this);
  updateWatchlistStats();
};

// Make search case-insensitive and trim spaces automatically
searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  
  if (query.length < 3) {
    alert("Please enter at least 3 characters to search");
    return;
  }
  
  searchMovies(query);
});