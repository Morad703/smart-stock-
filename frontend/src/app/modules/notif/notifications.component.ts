import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationService } from '../../shared/services/notification.service';
import { NotificationBadgeService } from '../../shared/services/notification-badge.service';
import { Notification } from '../../shared/models/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, DatePipe],   // <-- OBLIGATOIRE
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {

  notifications: Notification[] = [];
  private pollingInterval: any;

  constructor(
    private notifService: NotificationService,
    private badgeService: NotificationBadgeService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.loadNotifications();

    // Rafraîchir toutes les 2 secondes pour mettre à jour l'affichage
    this.pollingInterval = setInterval(() => {
      this.loadNotifications();
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  loadNotifications(): void {
    this.notifService.getNotifications().subscribe({
      next: (data: Notification[]) => {
        // Filtrer les notifications des 2 derniers jours
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        const filteredData = data.filter(notif => {
          const notifDate = new Date(notif.dateNotif);
          return notifDate >= twoDaysAgo;
        });

        // Trier par ID pour s'assurer que la dernière est vraiment la plus récente
        const sortedData = [...filteredData].sort((a, b) => b.id - a.id);

        // Mettre à jour la liste
        this.notifications = sortedData;

        // Marquer comme lues si on a des notifications
        if (sortedData.length > 0) {
          const latestId = sortedData[0].id;
          this.badgeService.markAsViewed(latestId);
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur récupération notifications:', err);
      }
    });
  }

  formatMessage(message: string): string {
    // Nettoie et formate le message pour un meilleur affichage
    return message.trim();
  }

  isRapport(message: string): boolean {
    // Détecte si c'est un rapport quotidien (généré par le batch)
    const msg = message.trim();
    // Un rapport quotidien commence par "RAPPORT QUOTIDIEN DE STOCK"
    if (msg.startsWith('RAPPORT QUOTIDIEN DE STOCK')) {
      return true;
    }
    // Sinon, vérifier les indicateurs spécifiques aux rapports
    return msg.includes('Etat :') && 
           (msg.includes('stock(s) critique(s) détecté(s)') || msg.includes('Tous les stocks sont dans les normes'));
  }

  getNotificationType(message: string): string {
    return this.isRapport(message) ? 'Rapport quotidien' : 'Stock critique';
  }

  getNotificationIcon(message: string): string {
    return this.isRapport(message) ? 'fa-file-alt' : 'fa-exclamation-triangle';
  }

}
