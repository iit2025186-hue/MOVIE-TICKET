(() => {
  "use strict";

  async function request(path) {
    let response;
    try {
      response = await fetch(path, {
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      });
    } catch (error) {
      throw new Error("We couldn't reach CineVerse. Check your connection and try again.");
    }

    if (!response.ok) {
      let message = "Something went wrong while loading this information.";
      try {
        const body = await response.json();
        if (body && typeof body.message === "string") message = body.message;
      } catch (error) {
        // Some server errors do not include a JSON response body.
      }
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  window.CineVerseApi = {
    getMovies() {
      return request("/api/movies");
    },
    searchMovies(title) {
      return request(`/api/movies/search?title=${encodeURIComponent(title)}`);
    },
    getDiscoveryStatus() {
      return request("/api/discovery/status");
    },
    getDiscoveryMovies(category, page = 1, query = "") {
      const params = new URLSearchParams({
        category: String(category || "all"),
        page: String(Math.max(1, Number(page) || 1))
      });
      if (String(query || "").trim()) params.set("query", String(query).trim());
      return request(`/api/discovery/movies?${params.toString()}`);
    },
    getDiscoveryMovie(id) {
      return request(`/api/discovery/movies/${encodeURIComponent(id)}`);
    },
    getMovie(id) {
      return request(`/api/movies/${encodeURIComponent(id)}`);
    },
    getCinemas() {
      return request("/api/cinemas");
    },
    getShowsByMovie(movieId) {
      return request(`/api/movies/${encodeURIComponent(movieId)}/shows`);
    },
    getShowsByCinema(cinemaId) {
      return request(`/api/cinemas/${encodeURIComponent(cinemaId)}/shows`);
    },
    getShow(showId) {
      return request(`/api/shows/${encodeURIComponent(showId)}`);
    },
    getSeatsForShow(showId) {
      return request(`/api/shows/${encodeURIComponent(showId)}/seats`);
    },
    createBooking(showId, seatLabels) {
      return fetch("/api/bookings", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ showId: Number(showId), seatLabels })
      }).then(async (response) => {
        if (!response.ok) {
          let message = "Your booking couldn't be confirmed. Please try again.";
          try {
            const body = await response.json();
            if (body && typeof body.message === "string") message = body.message;
          } catch (error) {
            // Some server errors do not include a JSON response body.
          }
          const error = new Error(message);
          error.status = response.status;
          throw error;
        }
        return response.json();
      });
    },
    getBooking(bookingId) {
      return request(`/api/bookings/${encodeURIComponent(bookingId)}`);
    }
  };
})();
