package com.cineverse.controller;

import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cineverse.dto.BookingDto;
import com.cineverse.dto.CreateBookingRequest;
import com.cineverse.dto.SeatAvailabilityDto;
import com.cineverse.service.BookingService;

@Validated
@RestController
@RequestMapping("/api")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/shows/{showId}/seats")
    public List<SeatAvailabilityDto> getShowSeats(@PathVariable @Positive Long showId) {
        return bookingService.getSeatsForShow(showId);
    }

    @PostMapping("/bookings")
    public ResponseEntity<BookingDto> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        BookingDto booking = bookingService.createBooking(request);
        return ResponseEntity.created(URI.create("/api/bookings/" + booking.id())).body(booking);
    }

    @GetMapping("/bookings/{bookingId}")
    public BookingDto getBooking(@PathVariable @Positive Long bookingId) {
        return bookingService.getBooking(bookingId);
    }
}
