import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService, LoginRequest } from '../../../shared/services/auth.service';
import { AlertService } from '../../../shared/services/alert.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  credentials: LoginRequest = {
    username: '',
    password: ''
  };
  
  isLoading = false;
  formErrors: any = {};
  returnUrl: string = '/home';
  generalError: string = '';

  private apiUrl = 'http://localhost:9090';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertService: AlertService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Si déjà authentifié, rediriger vers home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
      return;
    }
    
    // Récupérer l'URL de retour depuis les query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.credentials.username || !this.credentials.username.trim()) {
      this.formErrors.username = 'Le nom d\'utilisateur est requis';
    }

    if (!this.credentials.password || !this.credentials.password.trim()) {
      this.formErrors.password = 'Le mot de passe est requis';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  login(): void {
    if (!this.validateForm()) {
      const firstError = Object.values(this.formErrors)[0];
      this.alertService.warning(firstError as string, 'Formulaire invalide');
      return;
    }

    // Réinitialiser l'état avant de commencer
    this.isLoading = true;
    this.generalError = '';

    // Timeout de sécurité pour garantir que isLoading est toujours réinitialisé
    const timeoutId = setTimeout(() => {
      if (this.isLoading) {
        console.warn('Timeout de sécurité déclenché');
        this.isLoading = false;
        this.generalError = 'Le serveur ne répond pas. Vérifiez votre connexion.';
        this.alertService.error('Timeout: Le serveur ne répond pas', 'Erreur de connexion');
      }
    }, 10000);

    // Appel direct à l'API pour éviter tout problème avec le service ou l'intercepteur
    this.http.post(`${this.apiUrl}/auth/login`, this.credentials).subscribe({
      next: (response: any) => {
        clearTimeout(timeoutId);
        this.isLoading = false;
        
        if (response && (response.token || response.access_token)) {
          // Sauvegarder le token via le service pour mettre à jour l'Observable
          const token = response.token || response.access_token;
          if (token) {
            // Utiliser le service pour sauvegarder le token et mettre à jour l'Observable
            this.authService.updateToken(token);
          }
          
          this.alertService.success('Connexion réussie !');
          setTimeout(() => {
            this.router.navigate([this.returnUrl]);
          }, 1000);
        } else {
          this.generalError = 'Erreur de connexion. Aucun token reçu.';
          this.alertService.error(response?.message || 'Erreur de connexion', 'Erreur');
        }
      },
      error: (err: HttpErrorResponse) => {
        clearTimeout(timeoutId);
        this.isLoading = false;
        
        console.error('=== ERREUR HTTP ===');
        console.error('Status:', err.status);
        console.error('StatusText:', err.statusText);
        console.error('Error body:', err.error);
        console.error('Error type:', typeof err);
        console.error('Is HttpErrorResponse:', err instanceof HttpErrorResponse);
        
        // Le message d'erreur est dans error.error
        if (err.error && err.error.error) {
          console.error('Message d\'erreur du backend:', err.error.error);
        }
        if (err.error && err.error.message) {
          console.error('Message détaillé:', err.error.message);
        }
        
        let errorMessage = 'Erreur de connexion';
        let errorTitle = 'Erreur de connexion';
        
        // Gestion spécifique selon le code HTTP
        if (err.status === 401 || err.status === 403) {
          // Le backend retourne {error: "Nom d'utilisateur ou mot de passe incorrect", message: "..."}
          // Vérifier d'abord error.error, puis error.message
          if (err.error && err.error.error) {
            errorMessage = err.error.error;
            console.log('✅ Utilisation du message error.error:', errorMessage);
          } else if (err.error && err.error.message) {
            errorMessage = err.error.message;
            console.log('✅ Utilisation du message error.message:', errorMessage);
          } else {
            errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect. L\'utilisateur n\'existe pas ou le mot de passe est incorrect.';
            console.log('⚠️ Utilisation du message par défaut');
          }
          errorTitle = 'Identifiants incorrects';
          this.generalError = errorMessage;
          console.log('✅ generalError défini:', this.generalError);
        } else if (err.status === 400) {
          errorMessage = err.error?.error || 
                        err.error?.message || 
                        'Données invalides. Vérifiez vos informations.';
          errorTitle = 'Données invalides';
          this.generalError = errorMessage;
        } else if (err.status === 0 || !err.status) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur le port 9090.';
          errorTitle = 'Erreur de connexion';
          this.generalError = errorMessage;
        } else if (err.status === 500) {
          errorMessage = err.error?.error || 
                        err.error?.message || 
                        'Erreur serveur. Veuillez réessayer plus tard.';
          errorTitle = 'Erreur serveur';
          this.generalError = errorMessage;
        } else {
          errorMessage = err.error?.error || 
                        err.error?.message || 
                        err.message || 
                        'Nom d\'utilisateur ou mot de passe incorrect';
          this.generalError = errorMessage || 'Une erreur est survenue lors de la connexion.';
        }
        
        console.log('✅ Message d\'erreur final:', errorMessage);
        console.log('✅ generalError avant affichage:', this.generalError);
        console.log('✅ isLoading après erreur:', this.isLoading);
        
        // Forcer la détection de changement AVANT d'afficher l'alerte
        this.cdr.detectChanges();
        
        // Afficher l'erreur dans l'alerte ET dans le formulaire
        this.alertService.error(errorMessage, errorTitle);
        console.log('✅ AlertService.error appelé avec:', errorMessage);
        
        // Forcer à nouveau la détection de changement après l'alerte
        setTimeout(() => {
          this.cdr.detectChanges();
          console.log('✅ ChangeDetectorRef.detectChanges() appelé après timeout');
          console.log('✅ État final - generalError:', this.generalError);
          console.log('✅ État final - isLoading:', this.isLoading);
        }, 50);
      },
      complete: () => {
        clearTimeout(timeoutId);
        // Protection supplémentaire
        if (this.isLoading) {
          console.log('Complete appelé, réinitialisation de isLoading');
          this.isLoading = false;
        }
      }
    });
  }
}
