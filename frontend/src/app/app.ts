import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, map, startWith, distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { ToastComponent } from './modules/notif/toast/toast.component';
import { AlertComponent } from './shared/components/alert/alert.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { NotificationService } from './shared/services/notification.service';
import { ToastService } from './shared/services/toast.service';
import { NotificationBadgeService } from './shared/services/notification-badge.service';
import { Notification } from './shared/models/notification.model';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ToastComponent,
    AlertComponent,
    ConfirmDialogComponent,
    CommonModule
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  private lastNotificationId: number | null = null;
  private pollingInterval: any;
  hasNewNotifications$;
  isHomePage: boolean = false;
  isAuthenticated: boolean = false;
  showLogoutDialog: boolean = false;
  isPublicRoute: boolean = false;

  constructor(
    private notifService: NotificationService,
    private toastService: ToastService,
    private badgeService: NotificationBadgeService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.hasNewNotifications$ = this.badgeService.hasNewNotifications$;
    // Initialiser avec la valeur actuelle
    this.isAuthenticated = this.authService.isAuthenticated();
    
    // S'abonner aux changements d'authentification
    this.authService.currentUser$.subscribe(token => {
      const newAuthState = !!token || this.authService.isAuthenticated();
      // Toujours mettre à jour pour éviter les problèmes de timing
      if (this.isAuthenticated !== newAuthState) {
        this.isAuthenticated = newAuthState;
        // Utiliser setTimeout pour s'assurer que la mise à jour se fait après le cycle de changement
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  logout(): void {
    // Afficher le dialogue de confirmation
    this.showLogoutDialog = true;
  }

  onLogoutConfirmed(confirmed: boolean): void {
    this.showLogoutDialog = false;
    if (confirmed) {
      this.authService.logout();
    }
  }

  ngOnInit(): void {
    // Initialiser le polling au démarrage de l'application
    this.startNotificationPolling();
    
    // Vérifier la route initiale au démarrage
    const currentUrl = this.router.url;
    const publicRoutes = ['/login', '/register'];
    this.isPublicRoute = publicRoutes.includes(currentUrl) || 
                         currentUrl.startsWith('/login') || 
                         currentUrl.startsWith('/register');
    
    // Définir isHomePage initialement
    this.isHomePage = currentUrl === '/home' || currentUrl === '/';
    
    // Mettre à jour l'état d'authentification au démarrage
    this.isAuthenticated = this.authService.isAuthenticated();
    
    // Rediriger vers login si non authentifié au démarrage et pas sur une route publique
    if (!this.isAuthenticated && !this.isPublicRoute) {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
    
    // Détecter la route actuelle lors des navigations
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isHomePage = event.url === '/home' || event.url === '/';
      // Routes publiques (login et register)
      this.isPublicRoute = publicRoutes.includes(event.url) || 
                          event.url.startsWith('/login') || 
                          event.url.startsWith('/register');
      
      // Mettre à jour l'état d'authentification à chaque navigation
      this.isAuthenticated = this.authService.isAuthenticated();
      
      // Rediriger vers login si non authentifié et pas sur une route publique
      if (!this.isAuthenticated && !this.isPublicRoute) {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
      
      // Forcer la détection de changement
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.stopNotificationPolling();
  }

  private startNotificationPolling(): void {
    // Charger immédiatement
    this.checkForNewNotifications();

    // Puis toutes les 2 secondes
    this.pollingInterval = setInterval(() => {
      this.checkForNewNotifications();
    }, 2000);
  }

  private stopNotificationPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  private checkForNewNotifications(): void {
    this.notifService.getNotifications().subscribe({
      next: (data: Notification[]) => {
        if (data.length === 0) return;

        // Trier par ID décroissant pour avoir la plus récente en premier
        const sortedData = [...data].sort((a, b) => b.id - a.id);
        const latestNotif = sortedData[0];

        // Si c'est une nouvelle notification (ID supérieur au dernier enregistré)
        if (this.lastNotificationId !== null && latestNotif.id > this.lastNotificationId) {
          // Afficher le toast
          this.toastService.show(latestNotif.message);
          console.log('🔔 Nouvelle notification détectée:', latestNotif);
        }

        // Mettre à jour le badge
        this.badgeService.checkForNewNotifications(latestNotif.id);

        // Mettre à jour le dernier ID (même si c'est la première fois)
        if (this.lastNotificationId === null || latestNotif.id > this.lastNotificationId) {
          this.lastNotificationId = latestNotif.id;
        }
      },
      error: (err) => {
        console.error('Erreur lors de la vérification des notifications:', err);
      }
    });
  }
}
