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
      throw new Error(message);
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
    }
  };
})();
