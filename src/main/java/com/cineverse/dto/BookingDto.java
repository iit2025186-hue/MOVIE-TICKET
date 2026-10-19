package com.cineverse.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.cineverse.entity.BookingStatus;

public record BookingDto(
        Long id,
        String bookingReference,
        BookingStatus status,
        Long showId,
        String movieTitle,
        String cinemaName,
        String screenName,
        LocalDateTime startTime,
        List<String> seatLabels,
        BigDecimal totalPrice,
        LocalDateTime createdAt) {
}
