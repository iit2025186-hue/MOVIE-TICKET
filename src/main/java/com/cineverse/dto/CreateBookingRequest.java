package com.cineverse.dto;

import java.util.HashSet;
import java.util.List;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateBookingRequest(
        @NotNull(message = "A show ID is required")
        @Positive(message = "Show ID must be a positive number")
        Long showId,

        @NotEmpty(message = "Choose at least one seat")
        @Size(max = 10, message = "You can book up to 10 seats at a time")
        List<
                @NotBlank(message = "Seat labels cannot be blank")
                @Pattern(regexp = "[A-Z]{1,3}[1-9][0-9]*",
                        message = "Seat labels must look like A1 or B12")
                String> seatLabels,

        @NotBlank(message = "Choose a demo payment method")
        @Pattern(regexp = "(?i)upi|card|netbanking|wallet",
                message = "Choose a supported demo payment method")
        String paymentMethod,

        @NotBlank(message = "Complete the simulated payment before booking")
        @Pattern(regexp = "SUCCESS", message = "Only successful simulated payments can create a booking")
        String paymentOutcome) {

    public CreateBookingRequest(Long showId, List<String> seatLabels) {
        this(showId, seatLabels, "upi", "SUCCESS");
    }

    public CreateBookingRequest(Long showId, List<String> seatLabels, String paymentMethod) {
        this(showId, seatLabels, paymentMethod, "SUCCESS");
    }

    @AssertTrue(message = "Choose each seat only once")
    public boolean isSeatSelectionUnique() {
        return seatLabels == null || new HashSet<>(seatLabels).size() == seatLabels.size();
    }
}
