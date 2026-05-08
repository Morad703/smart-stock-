import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Alert {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  public alerts$ = this.alertsSubject.asObservable();
  private alertIdCounter = 0;

  show(type: Alert['type'], message: string, title?: string): void {
    const alert: Alert = {
      id: this.alertIdCounter++,
      type,
      message,
      title
    };

    const currentAlerts = this.alertsSubject.value;
    this.alertsSubject.next([...currentAlerts, alert]);

    // Auto-dismiss après 5 secondes
    setTimeout(() => {
      this.dismiss(alert.id);
    }, 5000);
  }

  success(message: string, title?: string): void {
    this.show('success', message, title);
  }

  error(message: string, title: string = 'Erreur'): void {
    this.show('error', message, title);
  }

  warning(message: string, title?: string): void {
    this.show('warning', message, title);
  }

  info(message: string, title?: string): void {
    this.show('info', message, title);
  }

  dismiss(id: number): void {
    const currentAlerts = this.alertsSubject.value;
    this.alertsSubject.next(currentAlerts.filter(alert => alert.id !== id));
  }

  clearAll(): void {
    this.alertsSubject.next([]);
  }
}

