package com.cineverse.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.cineverse.entity.Cinema;
import com.cineverse.entity.Movie;
import com.cineverse.entity.Screen;
import com.cineverse.entity.Show;
import com.cineverse.entity.ShowStatus;
import com.cineverse.repository.BookingRepository;
import com.cineverse.repository.CinemaRepository;
import com.cineverse.repository.MovieRepository;
import com.cineverse.repository.ScreenRepository;
import com.cineverse.repository.ShowRepository;

@SpringBootTest
@AutoConfigureMockMvc
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ShowRepository showRepository;

    @Autowired
    private ScreenRepository screenRepository;

    @Autowired
    private CinemaRepository cinemaRepository;

    @Autowired
    private MovieRepository movieRepository;

    private Long showId;

    @BeforeEach
    void createFutureShow() {
        bookingRepository.deleteAll();
        showRepository.deleteAll();
        screenRepository.deleteAll();
        cinemaRepository.deleteAll();

        Movie movie = movieRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Development movie data was not seeded"));
        Cinema cinema = cinemaRepository.save(new Cinema(
                "Booking Test Cinema",
                "5 Test Road",
                "Bengaluru",
                List.of("Parking")));
        Screen screen = screenRepository.save(new Screen("Booking Screen", 2, 4, cinema));
        LocalDateTime startTime = LocalDateTime.now().plusDays(3);
        Show show = showRepository.save(new Show(
                movie,
                screen,
                startTime,
                startTime.plusHours(2),
                new BigDecimal("12.50"),
                ShowStatus.SCHEDULED));
        showId = show.getId();
    }

    @Test
    void createsConfirmedBookingWithCalculatedTotalAndRetrievesIt() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookingRequest(List.of("A1", "A2"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bookingReference").isNotEmpty())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.showId").value(showId))
                .andExpect(jsonPath("$.seatLabels[0]").value("A1"))
                .andExpect(jsonPath("$.seatLabels[1]").value("A2"))
                .andExpect(jsonPath("$.totalPrice").value(25.0))
                .andReturn();

        JsonNode response = objectMapper.readTree(createResult.getResponse().getContentAsString());
        long bookingId = response.get("id").asLong();

        mockMvc.perform(get("/api/shows/{showId}/seats", showId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(8))
                .andExpect(jsonPath("$[0].label").value("A1"))
                .andExpect(jsonPath("$[0].available").value(false))
                .andExpect(jsonPath("$[2].label").value("A3"))
                .andExpect(jsonPath("$[2].available").value(true));

        mockMvc.perform(get("/api/bookings/{bookingId}", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(bookingId))
                .andExpect(jsonPath("$.bookingReference").value(response.get("bookingReference").asText()))
                .andExpect(jsonPath("$.seatLabels.length()").value(2))
                .andExpect(jsonPath("$.totalPrice").value(25.0));
    }

    @Test
    void rejectsSeatsAlreadyBookedForTheSameShow() throws Exception {
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookingRequest(List.of("A1"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookingRequest(List.of("A1"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("A1")));
    }

    @Test
    void rejectsEmptyDuplicateAndUnknownSeatSelectionsWithUsefulErrors() throws Exception {
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookingRequest(List.of())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.seatLabels").exists());

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookingRequest(List.of("A1", "A1"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.seatSelectionUnique").value("Choose each seat only once"));

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookingRequest(List.of("Z99"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.seatLabels").value("Unknown seat label(s): Z99"));
    }

    @Test
    void rejectsConcurrentAttemptsToBookTheSameSeat() throws Exception {
        String requestBody = bookingRequest(List.of("B2"));
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<Integer> first = executor.submit(() -> postBookingAtSameTime(requestBody, ready, start));
            Future<Integer> second = executor.submit(() -> postBookingAtSameTime(requestBody, ready, start));
            assertTrue(ready.await(5, java.util.concurrent.TimeUnit.SECONDS));
            start.countDown();

            List<Integer> results = List.of(
                    first.get(10, java.util.concurrent.TimeUnit.SECONDS),
                    second.get(10, java.util.concurrent.TimeUnit.SECONDS));
            assertTrue(results.contains(201), "One request should reserve the seat");
            assertTrue(results.contains(409), "The competing request should receive a conflict");
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void rejectsMalformedBookingRequests() throws Exception {
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"showId\":0,\"seatLabels\":[\"A!\"]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.showId").exists())
                .andExpect(jsonPath("$.fieldErrors['seatLabels[0]']").exists());
    }

    private Integer postBookingAtSameTime(
            String requestBody,
            CountDownLatch ready,
            CountDownLatch start) throws Exception {
        ready.countDown();
        if (!start.await(5, java.util.concurrent.TimeUnit.SECONDS)) {
            throw new IllegalStateException("Concurrent booking test did not start");
        }
        return mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andReturn()
                .getResponse()
                .getStatus();
    }

    private String bookingRequest(List<String> seatLabels) throws Exception {
        return objectMapper.writeValueAsString(new com.cineverse.dto.CreateBookingRequest(showId, seatLabels));
    }
}
