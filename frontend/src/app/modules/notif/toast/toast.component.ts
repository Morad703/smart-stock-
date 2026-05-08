import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent {

  toastText: string | null = null;
  isRapportNotification: boolean = false;
  private currentMessage: string | null = null;

  constructor(private toast: ToastService) {
    this.toast.message$.subscribe(msg => {
      if (msg) {
        this.currentMessage = msg;
        this.isRapportNotification = this.isRapport(msg);
        this.toastText = this.extractForToast(msg);
      } else {
        this.toastText = null;
        this.currentMessage = null;
        this.isRapportNotification = false;
      }
    });
  }

  extractForToast(message: string): string {
    // Détecter si c'est un rapport ou une alerte et retourner un texte simplifié
    if (this.isRapport(message)) {
      return 'Rapport quotidien - Consulter vos notifications';
    } else {
      return 'Alerte de stock - Consulter vos notifications';
    }
  }

  private isRapport(message: string): boolean {
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
}
