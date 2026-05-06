package com.example.msnotif.listener;
import com.example.msnotif.model.Notification;
import com.example.msnotif.repository.NotificationRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationListener {

    private final NotificationRepository repo;

    public NotificationListener(NotificationRepository repo) {
        this.repo = repo;
    }

    @RabbitListener(queues = "notification-queue")
    public void receiveMessage(String message) {
        // Vérifier si une notification avec le même message existe déjà aujourd'hui
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfNextDay = startOfDay.plusDays(1);
        
        List<Notification> existingNotifs = repo.findByMessageAndDate(message, startOfDay, startOfNextDay);
        
        if (!existingNotifs.isEmpty()) {
            System.out.println("[NOTIF] Notification deja existante aujourd'hui (" + existingNotifs.size() + " trouvee(s)), ignoree");
            return;
        }

        // Créer et sauvegarder la nouvelle notification
        Notification notif = new Notification();
        notif.setMessage(message);
        notif.setDateNotif(now);

        repo.save(notif);

        System.out.println("[NOTIF] Notification recue et enregistree avec succes");
    }
}
