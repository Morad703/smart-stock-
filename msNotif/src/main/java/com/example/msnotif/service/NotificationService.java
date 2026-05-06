package com.example.msnotif.service;

import com.example.msnotif.model.Notification;
import com.example.msnotif.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification addNotification(String message) {
        Notification notif = new Notification();
        notif.setMessage(message);
        notif.setDateNotif(LocalDateTime.now());
        return notificationRepository.save(notif);
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }
}
