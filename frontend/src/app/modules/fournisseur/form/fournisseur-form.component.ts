import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { FournisseurService } from '../../../shared/services/fournisseur.service';
import { AlertService } from '../../../shared/services/alert.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fournisseur-form.component.html',
  styleUrls: ['./fournisseur-form.component.css']
})
export class FournisseurFormComponent {

  fournisseur = {
    nom: '',
    email: '',
    telephone: '',
    adresse: ''
  };

  formErrors: any = {};

  constructor(
    private fs: FournisseurService,
    public router: Router,
    private alertService: AlertService
  ) {}

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.fournisseur.nom || !this.fournisseur.nom.trim()) {
      this.formErrors.nom = 'Le nom est requis';
    } else if (this.fournisseur.nom.length < 2) {
      this.formErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!this.fournisseur.email || !this.fournisseur.email.trim()) {
      this.formErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.fournisseur.email)) {
      this.formErrors.email = 'Format d\'email invalide';
    }

    if (this.fournisseur.telephone && this.fournisseur.telephone.trim()) {
      // Extraire uniquement les chiffres
      const digitsOnly = this.fournisseur.telephone.replace(/\D/g, '');
      
      if (digitsOnly.length !== 10) {
        this.formErrors.telephone = 'Le numéro de téléphone doit contenir exactement 10 chiffres';
      }
    }

    return Object.keys(this.formErrors).length === 0;
  }

  save(form: NgForm) {
    if (!this.validateForm()) {
      const firstError = Object.values(this.formErrors)[0];
      this.alertService.warning(firstError as string, 'Formulaire invalide');
      return;
    }

    this.fs.createFournisseur(this.fournisseur).subscribe({
      next: () => {
        this.alertService.success('Fournisseur ajouté avec succès !');
        setTimeout(() => {
          this.router.navigate(['/fournisseurs']);
        }, 1000);
      },
      error: (err) => {
        console.error("Erreur lors de l'ajout :", err);
        const errorMessage = err.error?.message || err.message || 'Une erreur est survenue lors de l\'ajout du fournisseur';
        this.alertService.error(errorMessage, 'Erreur');
      }
    });
  }


}
