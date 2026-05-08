import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AlertService } from '../../../shared/services/alert.service';
import { timeout, catchError, throwError } from 'rxjs';

interface RegisterRequest {
  username: string;
  password: string;
  role?: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private apiUrl = 'http://localhost:9090';
  
  admin: RegisterRequest = {
    username: '',
    password: ''
  };
  
  confirmPassword: string = '';
  isLoading = false;
  formErrors: any = {};

  constructor(
    private http: HttpClient,
    private router: Router,
    private alertService: AlertService
  ) {}

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.admin.username || !this.admin.username.trim()) {
      this.formErrors.username = 'Le nom d\'utilisateur est requis';
    } else if (this.admin.username.length < 3) {
      this.formErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }

    if (!this.admin.password || !this.admin.password.trim()) {
      this.formErrors.password = 'Le mot de passe est requis';
    } else if (this.admin.password.length < 6) {
      this.formErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (this.admin.password !== this.confirmPassword) {
      this.formErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  register(): void {
    if (!this.validateForm()) {
      const firstError = Object.values(this.formErrors)[0];
      this.alertService.warning(firstError as string, 'Formulaire invalide');
      return;
    }

    this.isLoading = true;
    console.log('Début de l\'inscription...');

    // Préparer les données pour l'envoi (sans confirmPassword)
    const registerData = {
      username: this.admin.username.trim(),
      password: this.admin.password
    };

    console.log('Tentative d\'inscription avec:', { username: registerData.username });
    console.log('URL complète:', `${this.apiUrl}/auth/register`);
    console.log('Données envoyées:', registerData);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('Envoi de la requête HTTP...');
    
    this.http.post<any>(`${this.apiUrl}/auth/register`, registerData, { headers })
      .pipe(
        timeout({ first: 10000 }), // Timeout de 10 secondes (syntaxe RxJS 7+)
        catchError((error: any) => {
          console.error('Erreur dans le pipe:', error);
          if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
            return throwError(() => ({ 
              status: 0, 
              name: 'TimeoutError',
              message: 'Timeout: Le serveur ne répond pas. Vérifiez que le backend est démarré sur le port 9090.',
              error: { error: 'Timeout de la requête' }
            }));
          }
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => {
          setTimeout(() => this.isLoading = false);
          console.log('Inscription réussie:', response);
          this.alertService.success('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (err: any) => {
          setTimeout(() => this.isLoading = false);
          console.error('Erreur complète lors de l\'inscription:', err);
          console.error('Status:', err.status);
          console.error('Error body:', err.error);
          console.error('Error name:', err.name);
          
          let errorMessage = 'Erreur lors de la création du compte';
          
          if (err.status === 0 || err.name === 'TimeoutError') {
            errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur le port 9090.';
          } else if (err.status === 400 || err.status === 401) {
            // Le backend retourne {error: "...", message: "..."}
            errorMessage = err.error?.error || err.error?.message || 'Données invalides. Vérifiez vos informations.';
          } else if (err.status === 409 || err.status === 422) {
            errorMessage = err.error?.error || err.error?.message || 'Ce nom d\'utilisateur existe déjà.';
          } else if (err.status === 500) {
            errorMessage = err.error?.error || err.error?.message || 'Erreur serveur. Veuillez réessayer plus tard.';
          } else if (err.error?.error) {
            errorMessage = err.error.error;
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.message) {
            errorMessage = err.message;
          }
          
          this.alertService.error(errorMessage, 'Erreur d\'inscription');
        }
      });
  }
}
