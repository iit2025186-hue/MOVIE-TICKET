package com.cineverse.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.cineverse.entity.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Override
    @EntityGraph(attributePaths = {
            "show", "show.movie", "show.screen", "show.screen.cinema", "bookedSeats", "bookedSeats.seat"
    })
    Optional<Booking> findById(Long id);

    void deleteAllByShow_Screen_Cinema_Id(Long cinemaId);
}
