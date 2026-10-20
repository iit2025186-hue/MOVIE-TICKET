(() => {
  "use strict";

  const api = window.CineVerseApi;
  const app = document.getElementById("app");
  const state = {
    movies: [],
    catalogMovies: [],
    catalogGenres: [],
    catalogQuery: "",
    catalogGenre: "",
    searchTimer: null,
    searchSequence: 0,
    viewSequence: 0,
    shownRecords: new Map(),
    selectedSeatLabels: new Set(),
    currentBookingShow: null,
    bookingIds: [],
    discoveryStatus: null,
    discoveryCategory: "all",
    discoveryQuery: "",
    discoveryChip: "all",
    discoveryPage: 1,
    discoveryTotalPages: 1,
    discoveryResults: [],
    discoveryLoading: false
  };

  const discoveryCategories = [
    { slug: "trending", label: "Trending Now" },
    { slug: "popular", label: "Popular" },
    { slug: "bollywood", label: "Bollywood" },
    { slug: "hollywood", label: "Hollywood" },
    { slug: "south-indian", label: "South Indian" },
    { slug: "korean", label: "Korean" },
    { slug: "japanese", label: "Japanese" },
    { slug: "upcoming", label: "Upcoming" },
    { slug: "top-rated", label: "Top Rated" },
    { slug: "family-animation", label: "Family & Animation" },
    { slug: "action-adventure", label: "Action & Adventure" },
    { slug: "horror-thriller", label: "Horror & Thriller" },
    { slug: "romance-drama", label: "Romance & Drama" },
    { slug: "sci-fi-fantasy", label: "Sci-Fi & Fantasy" }
  ];
  const discoveryChips = [
    { slug: "all", label: "All Movies" },
    { slug: "trending", label: "Trending" },
    { slug: "bollywood", label: "Bollywood" },
    { slug: "hollywood", label: "Hollywood" },
    { slug: "south-indian", label: "South Indian" },
    { slug: "korean", label: "Korean" },
    { slug: "japanese", label: "Japanese" },
    { slug: "action", label: "Action" },
    { slug: "comedy", label: "Comedy" },
    { slug: "romance", label: "Romance" },
    { slug: "horror", label: "Horror" },
    { slug: "thriller", label: "Thriller" },
    { slug: "animation", label: "Animation" },
    { slug: "sci-fi", label: "Sci-Fi" },
    { slug: "upcoming", label: "Upcoming" }
  ];

  const icons = {
    arrow: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M6.2 4.6v10.8L15.5 10 6.2 4.6Z" fill="currentColor"/></svg>',
    star: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m8 1.4 2 4.1 4.5.7-3.3 3.2.8 4.6L8 11.8l-4 2.2.8-4.6-3.3-3.2L6 5.5l2-4.1Z" fill="currentColor"/></svg>',
    search: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.8" cy="8.8" r="5.8" stroke="currentColor" stroke-width="1.6"/><path d="m13.2 13.2 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    alert: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.2 18 16H2L10 2.2Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M10 7v4.2m0 2.4v.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 0 6.5 5h11A2.5 2.5 0 0 0 20 7.5v2a2.5 2.5 0 0 0 0 5v2a2.5 2.5 0 0 0-2.5 2.5h-11A2.5 2.5 0 0 0 4 16.5v-2a2.5 2.5 0 0 0 0-5v-2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 7.5v1m0 2v1m0 2v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    shield: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2 16 4v4.7c0 3.8-2.5 6.5-6 8.3-3.5-1.8-6-4.5-6-8.3V4l6-2Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="m7.4 9.7 1.8 1.8 3.7-3.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[character]));
  }

  function posterUrl(value) {
    const url = String(value || "").trim();
    if (/^https?:\/\//i.test(url)) return url;
    if (/^\/(?!\/)/.test(url)) return url;
    return "";
  }

  function ratingText(value) {
    const rating = Number(value);
    return Number.isFinite(rating) ? rating.toFixed(1) : "—";
  }

  function movieYear(movie) {
    if (!movie || !movie.releaseDate) return "";
    const year = String(movie.releaseDate).slice(0, 4);
    return /^\d{4}$/.test(year) ? year : "";
  }

  function durationText(minutes) {
    const total = Number(minutes);
    if (!Number.isFinite(total) || total <= 0) return "";
    const hours = Math.floor(total / 60);
    const remainder = total % 60;
    return `${hours ? `${hours}h ` : ""}${remainder ? `${remainder}m` : ""}`.trim();
  }

  function formatTime(value) {
    if (!value) return "Time unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Time unavailable";
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
  }

  function formatShowDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(date);
  }

  function priceText(value) {
    if (value == null || value === "") return "";
    const amount = Number(value);
    return Number.isFinite(amount) ? `Listed price ${amount.toFixed(2)}` : "";
  }

  function setActiveNavigation(routeName) {
    document.querySelectorAll(".nav-link").forEach((link) => {
      const isActive = link.dataset.route === routeName;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function loadingCards(count = 5) {
    return `<div class="loading-grid" aria-label="Loading movies">${Array.from({ length: count }, () => `
      <div class="skeleton-card" aria-hidden="true"><div class="skeleton-poster"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>
    `).join("")}</div>`;
  }

  function statePanel(title, message, retryAction, compact = false) {
    const retry = retryAction
      ? `<button class="button button-secondary" type="button" data-retry="${escapeHtml(retryAction)}">Try again</button>`
      : "";
    return `<div class="state" role="status"><div class="state-inner">
      <span class="state-icon">${icons.alert}</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(message)}</p>${retry}
    </div></div>`;
  }

  function emptyPanel(title, message) {
    return `<div class="state" role="status"><div class="state-inner">
      <span class="state-icon">${icons.search}</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(message)}</p>
    </div></div>`;
  }

  function movieCard(movie, index) {
    const image = posterUrl(movie.posterUrl);
    const title = escapeHtml(movie.title || "Untitled film");
    const genre = escapeHtml(movie.genre || "Film");
    const year = movieYear(movie);
    const fallbackText = escapeHtml(movie.title || "CineVerse");
    return `<article class="movie-card" style="animation-delay:${Math.min(index, 8) * 45}ms">
      <div class="poster-shell">
        <a href="#/movies/${encodeURIComponent(movie.id)}" aria-label="View details for ${title}">
          ${image ? `<img class="poster-image" src="${escapeHtml(image)}" alt="${title} poster" loading="lazy">` : ""}
          <span class="poster-fallback" ${image ? "hidden" : ""} aria-hidden="true">${fallbackText}</span>
        </a>
        <span class="card-rating">${icons.star}${escapeHtml(ratingText(movie.rating))}</span>
        <a class="card-overlay button button-primary" href="#/movies/${encodeURIComponent(movie.id)}/shows">Find showtimes ${icons.arrow}</a>
      </div>
      <h3><a href="#/movies/${encodeURIComponent(movie.id)}">${title}</a></h3>
      <div class="card-subtitle">${genre}${year ? ` <span aria-hidden="true">·</span> ${escapeHtml(year)}` : ""}</div>
    </article>`;
  }

  function discoveryGenres(movie) {
    if (Array.isArray(movie.genres)) return movie.genres.filter(Boolean).join(" · ");
    return movie.genre || "";
  }

  function discoveryRoute(movie) {
    return movie.source === "LOCAL" && movie.localMovieId != null
      ? `#/movies/${encodeURIComponent(movie.localMovieId)}`
      : `#/discover/${encodeURIComponent(movie.id)}`;
  }

  function discoveryCard(movie, index = 0) {
    const image = posterUrl(movie.posterUrl);
    const title = escapeHtml(movie.title || "Untitled film");
    const genres = escapeHtml(discoveryGenres(movie) || "Film");
    const year = movieYear(movie);
    const href = discoveryRoute(movie);
    const hasRating = movie.rating != null && Number.isFinite(Number(movie.rating));
    const bookable = movie.bookable === true && movie.localMovieId != null;
    return `<article class="movie-card discovery-card" style="animation-delay:${Math.min(index, 8) * 35}ms">
      <div class="poster-shell">
        <a href="${href}" aria-label="View details for ${title}">
          ${image ? `<img class="poster-image" src="${escapeHtml(image)}" alt="${title} poster" loading="lazy">` : ""}
          <span class="poster-fallback" ${image ? "hidden" : ""} aria-hidden="true">${title}</span>
        </a>
        ${hasRating ? `<span class="card-rating">${icons.star}${escapeHtml(ratingText(movie.rating))}</span>` : ""}
        ${bookable ? `<a class="card-overlay button button-primary" href="#/movies/${encodeURIComponent(movie.localMovieId)}/shows">Find showtimes ${icons.arrow}</a>` : ""}
      </div>
      <h3><a href="${href}">${title}</a></h3>
      <div class="card-subtitle">${genres}${year ? ` <span aria-hidden="true">·</span> ${escapeHtml(year)}` : ""}</div>
    </article>`;
  }

  function discoveryStatusMarkup(status) {
    if (status?.liveAvailable) {
      return `<div class="discovery-status is-live" role="status"><span class="status-marker" aria-hidden="true"></span>
        <div><strong>Online discovery is connected</strong><p>${escapeHtml(status.message || "Explore live movie information. Showtimes appear only for films linked to CineVerse cinemas.")}</p></div>
        <span class="status-region">${escapeHtml(status.region || "Live catalog")}</span>
      </div>`;
    }
    const message = status?.message || "The online movie catalog is not configured. This page shows CineVerse's local catalog and scheduled cinema screenings.";
    return `<div class="discovery-status" role="status"><span class="status-marker" aria-hidden="true"></span>
      <div><strong>Local cinema catalog</strong><p>${escapeHtml(message)} Online discovery rankings and national categories are unavailable; local films and their real listed showtimes remain available.</p></div>
      <a class="status-action" href="#/movies">Browse local films ${icons.arrow}</a>
    </div>`;
  }

  function railSkeleton(slug) {
    return `<div class="discovery-rail-loading" data-rail-content="${escapeHtml(slug)}" aria-label="Loading ${escapeHtml(slug)}">
      ${Array.from({ length: 5 }, () => `<div class="rail-skeleton"><div></div><span></span><i></i></div>`).join("")}
    </div>`;
  }

  function discoveryRailMarkup(category) {
    return `<section class="discovery-rail-section" aria-labelledby="rail-${escapeHtml(category.slug)}">
      <div class="section-heading rail-heading">
        <div><span class="eyebrow">Discover</span><h2 id="rail-${escapeHtml(category.slug)}">${escapeHtml(category.label)}</h2></div>
        <div class="rail-tools">
          <a class="text-link" href="#/movies?category=${encodeURIComponent(category.slug)}">View all ${icons.arrow}</a>
          <button class="rail-arrow" type="button" data-scroll-rail="${escapeHtml(category.slug)}" data-direction="-1" aria-label="Scroll ${escapeHtml(category.label)} left">‹</button>
          <button class="rail-arrow" type="button" data-scroll-rail="${escapeHtml(category.slug)}" data-direction="1" aria-label="Scroll ${escapeHtml(category.label)} right">›</button>
        </div>
      </div>
      ${railSkeleton(category.slug)}
    </section>`;
  }

  function renderDiscoveryRail(slug, response, error = "") {
    const target = app.querySelector(`[data-rail-content="${CSS.escape(slug)}"]`);
    if (!target) return;
    if (error) {
      target.outerHTML = `<div class="rail-state" data-rail-content="${escapeHtml(slug)}">${statePanel("This collection couldn't load", error, `discovery-rail:${slug}`, true)}</div>`;
      return;
    }
    const movies = Array.isArray(response?.results) ? response.results : [];
    target.outerHTML = movies.length
      ? `<div class="discovery-rail" data-rail-content="${escapeHtml(slug)}" tabindex="0" aria-label="${escapeHtml(slug)} movies">${movies.map(discoveryCard).join("")}</div>`
      : `<div class="rail-state" data-rail-content="${escapeHtml(slug)}">${emptyPanel("No titles in this collection", "There are no matching titles in this catalog collection.")}</div>`;
    bindPosterFallbacks(app);
  }

  async function loadDiscoveryRail(category, viewId) {
    try {
      const response = await api.getDiscoveryMovies(category.slug, 1, "");
      if (viewId !== state.viewSequence) return;
      renderDiscoveryRail(category.slug, response);
    } catch (error) {
      if (viewId !== state.viewSequence) return;
      renderDiscoveryRail(category.slug, null, error.message);
    }
  }

  function bindPosterFallbacks(root = app) {
    root.querySelectorAll(".poster-image").forEach((image) => {
      image.addEventListener("error", () => {
        image.hidden = true;
        const fallback = image.parentElement.querySelector(".poster-fallback");
        if (fallback) fallback.hidden = false;
      }, { once: true });
    });
    root.querySelectorAll(".hero-image, .detail-backdrop").forEach((image) => {
      image.addEventListener("error", () => image.remove(), { once: true });
    });
  }

  function heroMarkup(movie) {
    if (!movie) {
      return `<section class="hero"><div class="hero-content"><div class="hero-copy">
        <span class="eyebrow hero-kicker">A better way to go to the movies</span>
        <h1 class="hero-title">The next great story starts here.</h1>
        <p class="hero-description">Explore films playing near you and find a screening that fits your night.</p>
        <div class="hero-actions"><a class="button button-primary" href="#/movies">Explore movies ${icons.arrow}</a></div>
      </div></div></section>`;
    }
    const image = posterUrl(movie.posterUrl);
    const description = movie.description || "A story worth seeing on the big screen.";
    const genre = movie.genre || "";
    const duration = durationText(movie.durationMinutes);
    const year = movieYear(movie);
    return `<section class="hero" aria-labelledby="featured-title">
      ${image ? `<img class="hero-image" src="${escapeHtml(image)}" alt="" fetchpriority="high">` : ""}
      <div class="hero-content"><div class="hero-copy">
        <span class="eyebrow hero-kicker">The CineVerse spotlight</span>
        <h1 class="hero-title" id="featured-title">${escapeHtml(movie.title || "Featured film")}</h1>
        <div class="hero-meta">
          <span class="rating-pill">${icons.star}${escapeHtml(ratingText(movie.rating))}</span>
          ${genre ? `<span>${escapeHtml(genre)}</span>` : ""}
          ${duration ? `<span>${escapeHtml(duration)}</span>` : ""}
          ${year ? `<span>${escapeHtml(year)}</span>` : ""}
        </div>
        <p class="hero-description">${escapeHtml(description)}</p>
        <div class="hero-actions">
          <a class="button button-primary" href="#/movies/${encodeURIComponent(movie.id)}/shows">${icons.play} Find showtimes</a>
          <a class="button button-secondary" href="#/movies/${encodeURIComponent(movie.id)}">Film details ${icons.arrow}</a>
        </div>
      </div></div>
      <div class="hero-index" aria-hidden="true"><strong>01</strong><span>/</span> FEATURED</div>
    </section>`;
  }

  function renderHomeShell(movie, movies, loading = false) {
    const latestMovies = movies.slice(0, 5);
    app.innerHTML = `${heroMarkup(movie)}
      <div class="page-wrap home-body">
        <section aria-labelledby="now-playing-heading">
          <div class="section-heading">
            <div><span class="eyebrow">On the big screen</span><h2 id="now-playing-heading">Now showing</h2></div>
            <a class="text-link" href="#/movies">Browse all films ${icons.arrow}</a>
          </div>
          ${loading ? loadingCards(5) : latestMovies.length
            ? `<div class="movie-grid">${latestMovies.map(movieCard).join("")}</div>`
            : emptyPanel("The screen is waiting", "There are no movies in the catalog just yet. Check back soon.")}
        </section>
        <section class="notice" aria-label="CineVerse service information">${icons.shield}<span>Explore movies, compare showtimes and reserve available seats. Bookings are demos only; no payment is processed.</span></section>
      </div>`;
    bindPosterFallbacks(app);
  }

  async function renderHome(viewId) {
    renderHomeShell(null, [], true);
    try {
      const movies = await api.getMovies();
      if (viewId !== state.viewSequence) return;
      state.movies = Array.isArray(movies) ? movies : [];
      renderHomeShell(state.movies[0] || null, state.movies);
    } catch (error) {
      if (viewId !== state.viewSequence) return;
      app.innerHTML = `<section class="hero">${statePanel("Movies didn't load", error.message, "home")}</section>
        <div class="page-wrap home-body">${loadingCards(5)}</div>`;
    }
  }

  function genreOptions() {
    const selected = state.catalogGenre;
    return `<option value="">All genres</option>${state.catalogGenres.map((genre) =>
      `<option value="${escapeHtml(genre)}" ${genre === selected ? "selected" : ""}>${escapeHtml(genre)}</option>`
    ).join("")}`;
  }

  function renderCatalogResults(movies, loading = false, error = "") {
    const results = document.getElementById("catalog-results");
    const count = document.getElementById("result-count");
    if (!results || !count) return;
    if (loading) {
      count.textContent = "Searching…";
      results.innerHTML = loadingCards(4);
      return;
    }
    if (error) {
      count.textContent = "";
      results.innerHTML = statePanel("Search couldn't load", error, "catalog");
      return;
    }
    const visible = movies.filter((movie) => !state.catalogGenre || movie.genre === state.catalogGenre);
    count.textContent = `${visible.length} ${visible.length === 1 ? "film" : "films"}`;
    results.innerHTML = visible.length
      ? `<div class="movie-grid">${visible.map(movieCard).join("")}</div>`
      : emptyPanel(state.catalogQuery ? "No matches this time" : "No films in this genre", state.catalogQuery
        ? "Try another title or clear the genre filter to see more films."
        : "Choose another genre to explore the current catalog.");
    bindPosterFallbacks(results);
  }

  function applySearchResults(movies) {
    state.catalogMovies = Array.isArray(movies) ? movies : [];
    renderCatalogResults(state.catalogMovies);
  }

  async function searchCatalog(query, viewId) {
    const sequence = ++state.searchSequence;
    const trimmed = query.trim();
    if (!trimmed) {
      applySearchResults(state.movies);
      return;
    }
    renderCatalogResults([], true);
    try {
      const movies = await api.searchMovies(trimmed);
      if (viewId !== state.viewSequence || sequence !== state.searchSequence) return;
      applySearchResults(movies);
    } catch (error) {
      if (viewId !== state.viewSequence || sequence !== state.searchSequence) return;
      renderCatalogResults([], false, error.message);
    }
  }

  function renderCatalogShell(viewId) {
    state.catalogQuery = "";
    state.catalogGenre = "";
    app.innerHTML = `<div class="page-wrap">
      <section class="catalog-intro">
        <span class="eyebrow">A world of stories</span>
        <h1 class="page-title">Find your next film.</h1>
        <p>Search the live catalog, find a genre that fits your mood, then compare nearby screenings.</p>
      </section>
      <section class="catalog-controls" aria-label="Filter movies">
        <label class="search-field">
          ${icons.search}
          <input class="search-input" id="movie-search" type="search" maxlength="150" placeholder="Search by movie title" autocomplete="off" aria-label="Search movie titles">
        </label>
        <label class="select-wrap">
          <span class="visually-hidden"></span>
          <select class="genre-select" id="genre-filter" aria-label="Filter by genre">${genreOptions()}</select>
        </label>
        <span class="result-count" id="result-count" aria-live="polite">Loading catalog…</span>
      </section>
      <section class="catalog-results" id="catalog-results" aria-label="Movie catalog">${loadingCards(8)}</section>
    </div>`;
    const input = document.getElementById("movie-search");
    const genre = document.getElementById("genre-filter");
    input.addEventListener("input", () => {
      state.catalogQuery = input.value;
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(() => searchCatalog(state.catalogQuery, viewId), 280);
    });
    genre.addEventListener("change", () => {
      state.catalogGenre = genre.value;
      renderCatalogResults(state.catalogMovies);
    });
    return { input, genre };
  }

  async function renderCatalog(viewId) {
    const controls = renderCatalogShell(viewId);
    try {
      const movies = await api.getMovies();
      if (viewId !== state.viewSequence) return;
      state.movies = Array.isArray(movies) ? movies : [];
      state.catalogMovies = state.movies;
      state.catalogGenres = [...new Set(state.movies.map((movie) => movie.genre).filter((genre) => typeof genre === "string" && genre.trim()))]
        .sort((a, b) => a.localeCompare(b));
      controls.genre.innerHTML = genreOptions();
      renderCatalogResults(state.catalogMovies);
      if (location.hash.includes("?search=")) {
        const initialSearch = new URLSearchParams(location.hash.split("?")[1]).get("search") || "";
        controls.input.value = initialSearch;
        state.catalogQuery = initialSearch;
        if (initialSearch) searchCatalog(initialSearch, viewId);
      }
    } catch (error) {
      if (viewId !== state.viewSequence) return;
      document.getElementById("result-count").textContent = "";
      document.getElementById("catalog-results").innerHTML = statePanel("Catalog unavailable", error.message, "catalog");
    }
  }

  function detailMarkup(movie) {
    const image = posterUrl(movie.posterUrl);
    const genre = movie.genre || "";
    const duration = durationText(movie.durationMinutes);
    const year = movieYear(movie);
    return `<section class="detail-hero" aria-labelledby="movie-title">
      ${image ? `<img class="detail-backdrop" src="${escapeHtml(image)}" alt="" aria-hidden="true">` : ""}
      <div class="detail-content">
        <div class="detail-poster">
          ${image ? `<img class="poster-image" src="${escapeHtml(image)}" alt="${escapeHtml(movie.title || "Film")} poster">` : ""}
          <span class="poster-fallback" ${image ? "hidden" : ""} aria-hidden="true">${escapeHtml(movie.title || "CineVerse")}</span>
        </div>
        <div class="detail-info">
          <a class="back-link" href="#/movies">${icons.arrow} All movies</a>
          <span class="eyebrow">The film</span>
          <h1 id="movie-title">${escapeHtml(movie.title || "Untitled film")}</h1>
          <div class="detail-meta">
            ${genre ? `<span class="genre-chip">${escapeHtml(genre)}</span>` : ""}
            ${movie.language ? `<span>${escapeHtml(movie.language)}</span>` : ""}
            ${duration ? `<span>${escapeHtml(duration)}</span>` : ""}
            ${year ? `<span>${escapeHtml(year)}</span>` : ""}
            <span class="rating-pill">${icons.star}${escapeHtml(ratingText(movie.rating))}</span>
          </div>
          <p class="detail-description">${escapeHtml(movie.description || "More information about this film has not been provided.")}</p>
          <a class="button button-primary" href="#/movies/${encodeURIComponent(movie.id)}/shows">${icons.play} Compare showtimes</a>
        </div>
      </div>
    </section>
    <div class="page-wrap detail-body">
      <section class="notice" aria-label="Booking information">${icons.shield}<span>Select a showtime to choose available seats. Confirmed bookings are saved in this browser; no payment is collected.</span></section>
    </div>`;
  }

  async function renderDetail(movieId, viewId) {
    app.innerHTML = `<div class="hero-skeleton" aria-label="Loading movie details"></div><div class="page-wrap detail-body">${loadingCards(1)}</div>`;
    try {
      const movie = await api.getMovie(movieId);
      if (viewId !== state.viewSequence) return;
      app.innerHTML = detailMarkup(movie);
      bindPosterFallbacks(app);
    } catch (error) {
      if (viewId !== state.viewSequence) return;
      app.innerHTML = `<div class="page-wrap" style="padding-top:58px">${statePanel("Film details unavailable", error.message, `detail:${movieId}`)}</div>`;
    }
  }

  function cinemaForShow(show, cinemas) {
    return cinemas.find((cinema) => Number(cinema.id) === Number(show.cinemaId));
  }

  function groupedShowMarkup(shows, cinemas) {
    const scheduled = shows.filter((show) => show.status === "SCHEDULED")
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    state.shownRecords = new Map(scheduled.map((show) => [String(show.id), show]));
    if (!scheduled.length) {
      return emptyPanel("No screenings listed", "There are no scheduled showtimes for this film at this selection right now.");
    }
    const groups = new Map();
    scheduled.forEach((show) => {
      const key = String(show.cinemaId);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(show);
    });
    return [...groups.entries()].map(([cinemaId, cinemaShows]) => {
      const cinema = cinemaForShow(cinemaShows[0], cinemas);
      const cinemaName = cinemaShows[0].cinemaName || (cinema && cinema.name) || "Cinema";
      const address = cinema ? [cinema.address, cinema.city].filter(Boolean).join(", ") : "";
      const screenNames = [...new Set(cinemaShows.map((show) => show.screenName).filter(Boolean))];
      const capacity = cinemaShows[0].totalSeatCapacity;
      return `<article class="cinema-block">
        <div class="cinema-name-row">
          <div><h3>${escapeHtml(cinemaName)}</h3><p class="cinema-address">${escapeHtml(address || "Location details not listed")}</p></div>
          <span class="cinema-capacity">${screenNames.length ? escapeHtml(screenNames.join(" · ")) : "Screening room"}${capacity ? ` · ${escapeHtml(capacity)} seats` : ""}</span>
        </div>
        <div class="show-times">${cinemaShows.map((show) => `<button class="show-time" type="button" data-show-id="${escapeHtml(show.id)}" aria-label="Choose seats for the ${escapeHtml(formatTime(show.startTime))} show at ${escapeHtml(cinemaName)}">
          <strong>${escapeHtml(formatTime(show.startTime))}</strong>
          <span>${escapeHtml(formatShowDate(show.startTime))}${show.ticketPrice != null ? ` · ${escapeHtml(priceText(show.ticketPrice))}` : ""} · Select seats</span>
        </button>`).join("")}</div>
      </article>`;
    }).join("");
  }

  function renderShowsPage(movie, cinemas, shows, selectedCinema, message = "") {
    const options = `<option value="all" ${selectedCinema === "all" ? "selected" : ""}>All cinemas</option>${cinemas.map((cinema) =>
      `<option value="${escapeHtml(cinema.id)}" ${String(cinema.id) === String(selectedCinema) ? "selected" : ""}>${escapeHtml(cinema.name)}${cinema.city ? ` — ${escapeHtml(cinema.city)}` : ""}</option>`
    ).join("")}`;
    app.innerHTML = `<section class="detail-hero" aria-labelledby="show-movie-title">
      ${posterUrl(movie.posterUrl) ? `<img class="detail-backdrop" src="${escapeHtml(posterUrl(movie.posterUrl))}" alt="" aria-hidden="true">` : ""}
      <div class="page-wrap" style="position:relative;padding-top:38px">
        <a class="back-link" href="#/movies/${encodeURIComponent(movie.id)}">${icons.arrow} Film details</a>
        <span class="eyebrow">Choose your cinema</span>
        <h1 class="page-title" id="show-movie-title" style="max-width:760px;margin:12px 0 8px;font-size:clamp(38px,5vw,58px)">${escapeHtml(movie.title || "Film showtimes")}</h1>
        <p style="max-width:590px;margin:0;color:#aaa3a1;font-size:13px;line-height:1.7">Compare real screenings listed by cinemas. Select a showtime to see what is and isn't available next.</p>
      </div>
    </section>
    <div class="page-wrap detail-body">
      <section class="screening-panel" aria-label="Cinema and showtime selection">
        <div class="screening-intro">
          <span class="eyebrow">Screenings</span>
          <h2>Make it a movie night.</h2>
          <p>Showtimes come from the current schedule. Availability may change.</p>
          <div class="cinema-select-wrap"><label for="cinema-filter">Cinema</label><select class="cinema-select" id="cinema-filter">${options}</select></div>
        </div>
        <div>
          <div class="cinema-list" id="cinema-show-list">${message || groupedShowMarkup(shows, cinemas)}</div>
          <div class="notice">${icons.shield}<span>Choose a showtime to view its live seat availability. Confirming a booking does not process a payment.</span></div>
        </div>
      </section>
    </div>`;
    const select = document.getElementById("cinema-filter");
    select.addEventListener("change", () => loadSelectedCinema(movie, cinemas, select.value, state.viewSequence));
  }

  async function loadSelectedCinema(movie, cinemas, cinemaId, viewId) {
    const list = document.getElementById("cinema-show-list");
    if (!list) return;
    if (cinemaId === "all") {
      const select = document.getElementById("cinema-filter");
      select.disabled = true;
      list.innerHTML = `<div class="state" role="status"><div class="state-inner"><h2>Refreshing showtimes</h2><p>Checking the movie schedule.</p></div></div>`;
      try {
        const shows = await api.getShowsByMovie(movie.id);
        if (viewId !== state.viewSequence) return;
        list.innerHTML = groupedShowMarkup(shows, cinemas);
      } catch (error) {
        if (viewId !== state.viewSequence) return;
        list.innerHTML = statePanel("Showtimes unavailable", error.message, `shows:${movie.id}`);
      } finally {
        if (viewId === state.viewSequence && select) select.disabled = false;
      }
      return;
    }
    const select = document.getElementById("cinema-filter");
    if (select) select.disabled = true;
    list.innerHTML = `<div class="state" role="status"><div class="state-inner"><h2>Checking this cinema</h2><p>Loading current showtimes for ${escapeHtml(movie.title)}.</p></div></div>`;
    try {
      const cinemaShows = await api.getShowsByCinema(cinemaId);
      if (viewId !== state.viewSequence) return;
      const matchedShows = cinemaShows.filter((show) => Number(show.movieId) === Number(movie.id));
      list.innerHTML = groupedShowMarkup(matchedShows, cinemas);
    } catch (error) {
      if (viewId !== state.viewSequence) return;
      list.innerHTML = statePanel("Cinema schedule unavailable", error.message, `cinema:${movie.id}:${cinemaId}`);
    } finally {
      if (viewId === state.viewSequence && select) select.disabled = false;
    }
  }

  async function renderShows(movieId, viewId) {
    app.innerHTML = `<div class="hero-skeleton" aria-label="Loading showtimes"></div><div class="page-wrap detail-body">${statePanel("Loading cinemas", "Getting the current movie schedule and cinema list.", "")}</div>`;
    try {
      const [movie, shows, cinemas] = await Promise.all([
        api.getMovie(movieId),
        api.getShowsByMovie(movieId),
        api.getCinemas()
      ]);
      if (viewId !== state.viewSequence) return;
      renderShowsPage(movie, Array.isArray(cinemas) ? cinemas : [], Array.isArray(shows) ? shows : [], "all");
    } catch (error) {
      if (viewId !== state.viewSequence) return;
      app.innerHTML = `<div class="page-wrap" style="padding-top:58px">${statePanel("Screenings couldn't load", error.message, `shows:${movieId}`)}</div>`;
    }
  }

  function savedBookingIds() {
    try {
      const stored = JSON.parse(localStorage.getItem("cineverse-booking-ids") || "[]");
      if (Array.isArray(stored)) return [...new Set(stored.map(String).filter((id) => /^\d+$/.test(id)))];
    } catch (error) {
      // Continue with the in-memory list if browser storage is unavailable.
    }
    return state.bookingIds;
  }

  function saveBookingId(id) {
    state.bookingIds = [...new Set([...savedBookingIds(), String(id)])];
    try {
      localStorage.setItem("cineverse-booking-ids", JSON.stringify(state.bookingIds));
    } catch (error) {
      // The booking is still confirmed by the server for this session.
    }
  }

  function bookingCard(booking) {
    return `<article class="booking-record">
      <div class="booking-record-heading"><div><span class="eyebrow">Confirmed reservation</span><h2>${escapeHtml(booking.movieTitle)}</h2></div><span class="booking-status">${escapeHtml(booking.status)}</span></div>
      <p class="booking-location">${escapeHtml(booking.cinemaName)} · ${escapeHtml(booking.screenName)} · ${escapeHtml(formatShowDate(booking.startTime))} at ${escapeHtml(formatTime(booking.startTime))}</p>
      <div class="booking-seat-list">${booking.seatLabels.map((seat) => `<span>${escapeHtml(seat)}</span>`).join("")}</div>
      <div class="booking-record-footer"><span>Reference <strong>${escapeHtml(booking.bookingReference)}</strong></span><span>Total <strong>${escapeHtml(Number(booking.totalPrice).toFixed(2))}</strong></span></div>
      <p class="booking-demo-note">Demo reservation only — no payment was processed.</p>
    </article>`;
  }

  async function renderBookings(viewId) {
    const ids = savedBookingIds();
    app.innerHTML = `<section class="bookings-page page-wrap">
      <span class="eyebrow">Your CineVerse</span>
      <h1 class="page-title">My Bookings</h1>
      <p class="bookings-intro">Reservations saved in this browser. No account or payment details are collected.</p>
      <div class="notice bookings-storage-note">${icons.shield}<span>Development data is held in an in-memory database and is cleared when the server restarts.</span></div>
      <div id="booking-history" class="booking-history" aria-live="polite">${ids.length ? statePanel("Loading your bookings", "Retrieving confirmed reservations.", "") : ""}</div>
    </section>`;
    if (!ids.length) {
      document.getElementById("booking-history").innerHTML = `<div class="bookings-card">
        <span class="ticket-mark" aria-hidden="true">${icons.ticket}</span>
        <span class="eyebrow">No reservations yet</span>
        <h2>No bookings to show.</h2>
        <p>Choose a movie, select a showtime and reserve available seats to see a confirmation here.</p>
        <a class="button button-primary" href="#/movies">Explore the movies ${icons.arrow}</a>
      </div>`;
      return;
    }
    const results = await Promise.all(ids.map(async (id) => {
      try {
        return { id, booking: await api.getBooking(id) };
      } catch (error) {
        return { id, error };
      }
    }));
    if (viewId !== state.viewSequence) return;
    const bookings = results.filter((result) => result.booking).map((result) => result.booking);
    const expiredIds = results.filter((result) => result.error?.status === 404).map((result) => result.id);
    const remainingIds = ids.filter((id) => !expiredIds.includes(id));
    state.bookingIds = remainingIds;
    try {
      localStorage.setItem("cineverse-booking-ids", JSON.stringify(remainingIds));
    } catch (error) {
      // The current page can still show the successfully retrieved bookings.
    }
    const failedRequests = results.filter((result) => result.error && result.error.status !== 404);
    const history = document.getElementById("booking-history");
    if (failedRequests.length && !bookings.length) {
      history.innerHTML = statePanel("Bookings unavailable", failedRequests[0].error.message, "bookings");
      return;
    }
    history.innerHTML = `${expiredIds.length ? `<div class="notice">${icons.alert}<span>${expiredIds.length === ids.length ? "These reservation records were cleared when the in-memory development server restarted." : "Some reservation records are no longer available because the in-memory development server restarted."}</span></div>` : ""}
      ${failedRequests.length ? `<div class="notice">${icons.alert}<span>Some bookings could not be loaded. Refresh this page to try again.</span></div>` : ""}
      ${bookings.length ? bookings.map(bookingCard).join("") : `<div class="bookings-card"><h2>No active reservations found.</h2><a class="button button-primary" href="#/movies">Explore the movies ${icons.arrow}</a></div>`}`;
  }

  function seatSelectionMarkup(show, seats) {
    const rows = new Map();
    seats.forEach((seat) => {
      if (!rows.has(seat.rowNumber)) rows.set(seat.rowNumber, []);
      rows.get(seat.rowNumber).push(seat);
    });
    const canBook = show.status === "SCHEDULED" && new Date(show.startTime) > new Date();
    const rowMarkup = [...rows.entries()].map(([, rowSeats]) => {
      const rowLabel = rowSeats[0].label.replace(/\d+$/, "");
      return `<div class="seat-row" role="group" aria-label="Row ${escapeHtml(rowLabel)}">${rowSeats.map((seat) =>
        `<button class="seat-button ${seat.available ? "available" : "unavailable"}" type="button" data-seat-label="${escapeHtml(seat.label)}" aria-pressed="false" aria-label="Seat ${escapeHtml(seat.label)}${seat.available ? ", available" : ", booked"}" ${seat.available ? "" : "disabled"}>${escapeHtml(seat.label)}</button>`
      ).join("")}</div>`;
    }).join("");
    return `<section class="seat-selection-page page-wrap" aria-labelledby="seat-page-title">
      <a class="back-link" href="#/movies/${encodeURIComponent(show.movieId)}/shows">${icons.arrow} Back to showtimes</a>
      <span class="eyebrow">Choose your seats</span>
      <h1 class="page-title" id="seat-page-title">${escapeHtml(show.movieTitle)}</h1>
      <p class="seat-show-meta">${escapeHtml(show.cinemaName)} · ${escapeHtml(show.screenName)} · ${escapeHtml(formatShowDate(show.startTime))} at ${escapeHtml(formatTime(show.startTime))}</p>
      <p class="seat-price-note">Listed price per seat: ${escapeHtml(Number(show.ticketPrice).toFixed(2))}. No payment will be collected.</p>
      <div class="seat-selection-layout">
        <section class="seat-map-panel" aria-label="Seat selection">
          <div class="cinema-screen" aria-hidden="true">SCREEN</div>
          <div class="seat-map" aria-label="Available seats">${rowMarkup}</div>
          <div class="seat-legend"><span><i class="legend-seat available"></i>Available</span><span><i class="legend-seat selected"></i>Selected</span><span><i class="legend-seat unavailable"></i>Booked</span></div>
        </section>
        <aside class="seat-checkout-panel" aria-label="Booking summary">
          <span class="eyebrow">Your selection</span>
          <p class="selected-seat-summary" id="selected-seat-summary">No seats selected</p>
          <p class="selected-total">Total <strong id="booking-total">0.00</strong></p>
          <p class="booking-demo-note">Confirming reserves these seats in the demo database. This is not a payment.</p>
          <p id="booking-feedback" class="booking-feedback" role="alert" hidden></p>
          <button class="button button-primary booking-submit" type="button" data-confirm-booking disabled>Select at least one seat</button>
          ${canBook ? "" : `<p class="booking-feedback">This show is no longer accepting reservations.</p>`}
        </aside>
      </div>
    </section>`;
  }

  async function renderSeatSelection(showId, viewId) {
    state.selectedSeatLabels = new Set();
    state.currentBookingShow = null;
    app.innerHTML = `<div class="page-wrap detail-body">${statePanel("Loading seat map", "Checking this show's seat availability.", "")}</div>`;
    try {
      const [show, seats] = await Promise.all([api.getShow(showId), api.getSeatsForShow(showId)]);
      if (viewId !== state.viewSequence) return;
      state.currentBookingShow = show;
      app.innerHTML = seatSelectionMarkup(show, seats);
      if (show.status !== "SCHEDULED" || new Date(show.startTime) <= new Date()) {
        const button = app.querySelector("[data-confirm-booking]");
        if (button) button.disabled = true;
      }
    } catch (error) {
      if (viewId !== state.viewSequence) return;
      app.innerHTML = `<div class="page-wrap" style="padding-top:58px">${statePanel("Seat map unavailable", error.message, `seats:${showId}`)}</div>`;
    }
  }

  function updateBookingSelection() {
    const show = state.currentBookingShow;
    if (!show) return;
    const count = state.selectedSeatLabels.size;
    const total = (Number(show.ticketPrice) * count).toFixed(2);
    const summary = document.getElementById("selected-seat-summary");
    const totalElement = document.getElementById("booking-total");
    const button = app.querySelector("[data-confirm-booking]");
    if (summary) summary.textContent = count ? [...state.selectedSeatLabels].sort().join(", ") : "No seats selected";
    if (totalElement) totalElement.textContent = total;
    if (button && new Date(show.startTime) > new Date() && show.status === "SCHEDULED") {
      button.disabled = count === 0;
      button.textContent = count ? `Confirm booking · ${total}` : "Select at least one seat";
    }
  }

  async function confirmBooking(button) {
    const show = state.currentBookingShow;
    const feedback = document.getElementById("booking-feedback");
    const labels = [...state.selectedSeatLabels];
    if (!show || !labels.length) return;
    button.disabled = true;
    button.textContent = "Confirming reservation…";
    if (feedback) feedback.hidden = true;
    try {
      const booking = await api.createBooking(show.id, labels);
      saveBookingId(booking.id);
      location.hash = "#/bookings";
    } catch (error) {
      if (feedback) {
        feedback.textContent = error.message;
        feedback.hidden = false;
      }
      button.disabled = false;
      button.textContent = `Try again · ${(Number(show.ticketPrice) * labels.length).toFixed(2)}`;
      if (error.status === 409) {
        try {
          const seats = await api.getSeatsForShow(show.id);
          seats.forEach((seat) => {
            const seatButton = app.querySelector(`[data-seat-label="${CSS.escape(seat.label)}"]`);
            if (!seatButton) return;
            seatButton.disabled = !seat.available;
            seatButton.classList.toggle("unavailable", !seat.available);
            seatButton.classList.toggle("available", seat.available);
            seatButton.setAttribute("aria-label", `Seat ${seat.label}${seat.available ? ", available" : ", booked"}`);
            if (!seat.available) {
              seatButton.classList.remove("selected");
              seatButton.setAttribute("aria-pressed", "false");
              state.selectedSeatLabels.delete(seat.label);
            }
          });
          updateBookingSelection();
        } catch (refreshError) {
          // Keep the conflict message visible if refreshed availability is unreachable.
        }
      }
    }
  }

  function parseRoute() {
    const value = location.hash.replace(/^#/, "") || "/";
    const [path] = value.split("?");
    const parts = path.split("/").filter(Boolean);
    if (!parts.length) return { name: "home" };
    if (parts[0] === "movies" && parts.length === 1) return { name: "movies" };
    if (parts[0] === "bookings" && parts.length === 1) return { name: "bookings" };
    if (parts[0] === "shows" && parts[1] && parts[2] === "seats") return { name: "seats", id: parts[1] };
    if (parts[0] === "movies" && parts[1] && parts[2] === "shows") return { name: "shows", id: parts[1] };
    if (parts[0] === "movies" && parts[1]) return { name: "detail", id: parts[1] };
    return { name: "home" };
  }

  function routeTo(route) {
    state.viewSequence += 1;
    const viewId = state.viewSequence;
    setActiveNavigation(route.name === "detail" || route.name === "shows" || route.name === "seats" ? "movies" : route.name);
    if (route.name === "home") renderHome(viewId);
    else if (route.name === "movies") renderCatalog(viewId);
    else if (route.name === "detail") renderDetail(route.id, viewId);
    else if (route.name === "shows") renderShows(route.id, viewId);
    else if (route.name === "seats") renderSeatSelection(route.id, viewId);
    else if (route.name === "bookings") renderBookings(viewId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function retryAction(action) {
    if (action === "home") routeTo({ name: "home" });
    else if (action === "catalog") routeTo({ name: "movies" });
    else if (action.startsWith("detail:")) routeTo({ name: "detail", id: action.split(":")[1] });
    else if (action.startsWith("shows:")) routeTo({ name: "shows", id: action.split(":")[1] });
    else if (action.startsWith("seats:")) routeTo({ name: "seats", id: action.split(":")[1] });
    else if (action === "bookings") routeTo({ name: "bookings" });
    else if (action.startsWith("cinema:")) {
      const [, movieId, cinemaId] = action.split(":");
      const select = document.getElementById("cinema-filter");
      if (select) select.value = cinemaId;
      const movieTitle = document.getElementById("show-movie-title")?.textContent || "this film";
      loadSelectedCinema({ id: movieId, title: movieTitle }, [], cinemaId, state.viewSequence);
    }
  }

  app.addEventListener("click", (event) => {
    const retry = event.target.closest("[data-retry]");
    if (retry) {
      retryAction(retry.dataset.retry);
      return;
    }
    const showtime = event.target.closest("[data-show-id]");
    if (showtime) {
      location.hash = `#/shows/${encodeURIComponent(showtime.dataset.showId)}/seats`;
      return;
    }
    const seat = event.target.closest("[data-seat-label]");
    if (seat && !seat.disabled) {
      const label = seat.dataset.seatLabel;
      if (state.selectedSeatLabels.has(label)) {
        state.selectedSeatLabels.delete(label);
        seat.classList.remove("selected");
        seat.setAttribute("aria-pressed", "false");
      } else if (state.selectedSeatLabels.size < 10) {
        state.selectedSeatLabels.add(label);
        seat.classList.add("selected");
        seat.setAttribute("aria-pressed", "true");
      } else {
        const feedback = document.getElementById("booking-feedback");
        if (feedback) {
          feedback.textContent = "You can book up to 10 seats at a time.";
          feedback.hidden = false;
        }
      }
      updateBookingSelection();
      return;
    }
    const confirmButton = event.target.closest("[data-confirm-booking]");
    if (confirmButton && !confirmButton.disabled) {
      confirmBooking(confirmButton);
    }
  });

  window.addEventListener("hashchange", () => routeTo(parseRoute()));
  routeTo(parseRoute());
})();
