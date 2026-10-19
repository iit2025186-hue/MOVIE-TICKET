package com.cineverse.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cineverse.entity.Show;
import com.cineverse.entity.ShowStatus;

public interface ShowRepository extends JpaRepository<Show, Long> {

    List<Show> findAllByOrderByStartTimeAsc();

    List<Show> findByMovie_IdOrderByStartTimeAsc(Long movieId);

    List<Show> findByScreen_Cinema_IdOrderByStartTimeAsc(Long cinemaId);

    void deleteAllByScreen_Cinema_Id(Long cinemaId);

    boolean existsByScreen_IdAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
            Long screenId,
            ShowStatus status,
            LocalDateTime requestedEnd,
            LocalDateTime requestedStart);

    boolean existsByMovie_Id(Long movieId);
}
