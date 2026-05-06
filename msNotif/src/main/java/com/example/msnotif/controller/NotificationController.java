package com.example.msnotif.controller;

import com.example.msnotif.model.Notification;
import com.example.msnotif.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<Notification> getAllNotifications() {
        return notificationService.getAllNotifications();
    }

    // Endpoint pour tester en direct
    @PostMapping
    public Notification createNotification(@RequestBody Notification notif) {
        return notificationService.addNotification(notif.getMessage());
    }
}
