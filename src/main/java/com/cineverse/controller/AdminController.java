package com.cineverse.controller;

import java.time.LocalDate;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cineverse.dto.AdminDashboardDto;
import com.cineverse.service.AdminDashboardService;
import com.cineverse.service.CustomerSession;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminDashboardService dashboardService;

    public AdminController(AdminDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            HttpServletRequest request) {
        Long accountId = CustomerSession.accountId(request.getSession(false));
        if (accountId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Please log in"));
        }
        if (!dashboardService.isAdmin(accountId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Admin access is required"));
        }
        if (from != null && to != null && from.isAfter(to)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Start date must not be after end date"));
        }
        AdminDashboardDto dashboard = dashboardService.getDashboard(from, to);
        return ResponseEntity.ok(dashboard);
    }
}
