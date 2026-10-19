package com.cineverse.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cineverse.dto.BookingDto;
import com.cineverse.dto.CreateBookingRequest;
import com.cineverse.dto.SeatAvailabilityDto;
import com.cineverse.entity.Booking;
import com.cineverse.entity.BookingSeat;
import com.cineverse.entity.Seat;
import com.cineverse.entity.Show;
import com.cineverse.entity.ShowStatus;
import com.cineverse.exception.InvalidRequestException;
import com.cineverse.exception.RequestConflictException;
import com.cineverse.exception.ShowNotFoundException;
import com.cineverse.repository.BookingRepository;
import com.cineverse.repository.BookingSeatRepository;
import com.cineverse.repository.SeatRepository;
import com.cineverse.repository.ShowRepository;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final SeatRepository seatRepository;
    private final ShowRepository showRepository;

    public BookingService(
            BookingRepository bookingRepository,
            BookingSeatRepository bookingSeatRepository,
            SeatRepository seatRepository,
            ShowRepository showRepository) {
        this.bookingRepository = bookingRepository;
        this.bookingSeatRepository = bookingSeatRepository;
        this.seatRepository = seatRepository;
        this.showRepository = showRepository;
    }

    @Transactional(readOnly = true)
    public List<SeatAvailabilityDto> getSeatsForShow(Long showId) {
        Show show = showRepository.findById(showId).orElseThrow(() -> new ShowNotFoundException(showId));
        Set<Long> bookedSeatIds = new HashSet<>(bookingSeatRepository.findBookedSeatIdsByShowId(showId));

        return seatRepository.findByScreen_IdOrderByRowNumberAscSeatNumberAsc(show.getScreen().getId())
                .stream()
                .map(seat -> new SeatAvailabilityDto(
                        seat.getLabel(),
                        seat.getRowNumber(),
                        seat.getSeatNumber(),
                        !bookedSeatIds.contains(seat.getId())))
                .toList();
    }

    @Transactional
    public BookingDto createBooking(CreateBookingRequest request) {
        Show show = showRepository.findByIdForUpdate(request.showId())
                .orElseThrow(() -> new ShowNotFoundException(request.showId()));
        if (show.getStatus() != ShowStatus.SCHEDULED || !show.getStartTime().isAfter(LocalDateTime.now())) {
            throw new RequestConflictException("This show is no longer available for booking");
        }

        List<Seat> screenSeats = seatRepository
                .findByScreen_IdOrderByRowNumberAscSeatNumberAsc(show.getScreen().getId());
        Map<String, Seat> seatsByLabel = screenSeats.stream()
                .collect(java.util.stream.Collectors.toMap(Seat::getLabel, seat -> seat));
        List<Seat> selectedSeats = request.seatLabels().stream()
                .map(seatsByLabel::get)
                .toList();

        if (selectedSeats.stream().anyMatch(seat -> seat == null)) {
            Set<String> validLabels = seatsByLabel.keySet();
            List<String> invalidLabels = request.seatLabels().stream()
                    .filter(label -> !validLabels.contains(label))
                    .toList();
            throw new InvalidRequestException(
                    "One or more selected seats do not exist in this screen",
                    Map.of("seatLabels", "Unknown seat label(s): " + String.join(", ", invalidLabels)));
        }

        Set<Long> bookedSeatIds = new HashSet<>(bookingSeatRepository.findBookedSeatIdsByShowId(show.getId()));
        List<String> unavailableLabels = selectedSeats.stream()
                .filter(seat -> bookedSeatIds.contains(seat.getId()))
                .map(Seat::getLabel)
                .toList();
        if (!unavailableLabels.isEmpty()) {
            throw new RequestConflictException(
                    "These seats are no longer available for this show: " + String.join(", ", unavailableLabels));
        }

        BigDecimal totalPrice = show.getTicketPrice()
                .multiply(BigDecimal.valueOf(selectedSeats.size()))
                .setScale(2);
        String reference = "CV-" + UUID.randomUUID().toString().toUpperCase(Locale.ROOT);
        Booking booking = new Booking(reference, show, totalPrice);
        selectedSeats.forEach(booking::addSeat);
        return toDto(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public BookingDto getBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new com.cineverse.exception.ResourceNotFoundException("Booking", bookingId));
        return toDto(booking);
    }

    private static BookingDto toDto(Booking booking) {
        Show show = booking.getShow();
        List<String> seatLabels = booking.getBookedSeats().stream()
                .sorted(Comparator
                        .comparing((BookingSeat bookedSeat) -> bookedSeat.getSeat().getRowNumber())
                        .thenComparing(bookedSeat -> bookedSeat.getSeat().getSeatNumber()))
                .map(bookedSeat -> bookedSeat.getSeat().getLabel())
                .toList();

        return new BookingDto(
                booking.getId(),
                booking.getBookingReference(),
                booking.getStatus(),
                show.getId(),
                show.getMovie().getTitle(),
                show.getScreen().getCinema().getName(),
                show.getScreen().getName(),
                show.getStartTime(),
                seatLabels,
                booking.getTotalPrice(),
                booking.getCreatedAt());
    }
}
