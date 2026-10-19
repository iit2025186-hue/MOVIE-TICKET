package com.cineverse.controller;

import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cineverse.dto.MovieDto;
import com.cineverse.dto.MovieRequest;
import com.cineverse.service.MovieService;

@Validated
@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping
    public List<MovieDto> getAllMovies() {
        return movieService.getAllMovies();
    }

    @GetMapping("/search")
    public List<MovieDto> searchMovies(
            @RequestParam("title")
            @NotBlank(message = "Search title is required")
            @Size(max = 150, message = "Search title must be at most 150 characters")
            String title) {
        return movieService.searchMoviesByTitle(title);
    }

    @GetMapping("/{id}")
    public MovieDto getMovieById(@PathVariable @Positive Long id) {
        return movieService.getMovieById(id);
    }

    @PostMapping
    public ResponseEntity<MovieDto> createMovie(@Valid @RequestBody MovieRequest request) {
        MovieDto movie = movieService.createMovie(request);
        return ResponseEntity.created(URI.create("/api/movies/" + movie.id())).body(movie);
    }

    @PutMapping("/{id}")
    public MovieDto updateMovie(
            @PathVariable @Positive Long id,
            @Valid @RequestBody MovieRequest request) {
        return movieService.updateMovie(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable @Positive Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }
}
