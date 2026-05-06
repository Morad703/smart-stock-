package com.example.msnotif.repository;

import com.example.msnotif.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    @Query("SELECT n FROM Notification n WHERE n.message = :message " +
           "AND n.dateNotif >= :startOfDay AND n.dateNotif < :startOfNextDay")
    List<Notification> findByMessageAndDate(@Param("message") String message, 
                                            @Param("startOfDay") java.time.LocalDateTime startOfDay,
                                            @Param("startOfNextDay") java.time.LocalDateTime startOfNextDay);
}
