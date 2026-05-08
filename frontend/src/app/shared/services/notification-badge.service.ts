import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationBadgeService {
  private hasNewNotificationsSubject = new BehaviorSubject<boolean>(false);
  public hasNewNotifications$ = this.hasNewNotificationsSubject.asObservable();

  private lastViewedNotificationId: number | null = null;

  setHasNewNotifications(hasNew: boolean): void {
    this.hasNewNotificationsSubject.next(hasNew);
  }

  markAsViewed(latestNotificationId: number): void {
    this.lastViewedNotificationId = latestNotificationId;
    this.setHasNewNotifications(false);
  }

  checkForNewNotifications(latestNotificationId: number): void {
    if (this.lastViewedNotificationId === null) {
      // Première fois : initialiser sans afficher le badge
      this.lastViewedNotificationId = latestNotificationId;
      this.setHasNewNotifications(false);
    } else if (latestNotificationId > this.lastViewedNotificationId) {
      // Nouvelle notification détectée
      this.setHasNewNotifications(true);
    }
  }

  getLastViewedNotificationId(): number | null {
    return this.lastViewedNotificationId;
  }
}

