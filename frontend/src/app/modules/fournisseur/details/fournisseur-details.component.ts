import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { FournisseurService } from '../../../shared/services/fournisseur.service';
import { AlertService } from '../../../shared/services/alert.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fournisseur-details.component.html',
  styleUrls: ['./fournisseur-details.component.css']
})
export class FournisseurDetailsComponent implements OnInit {

  fournisseur: any = null;
  editMode: boolean = false;
  formErrors: any = {};

  constructor(
    private route: ActivatedRoute,
    private fs: FournisseurService,
    public router: Router,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.fs.getFournisseurById(id).subscribe({
      next: (data) => {
        this.fournisseur = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement du fournisseur:', error);
        this.alertService.error('Impossible de charger les informations du fournisseur', 'Erreur');
      }
    });
  }

  activerModification() {
    this.editMode = true;
  }

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

  enregistrer(form?: NgForm) {
    if (!this.validateForm()) {
      const firstError = Object.values(this.formErrors)[0];
      this.alertService.warning(firstError as string, 'Formulaire invalide');
      return;
    }

    this.fs.updateFournisseur(this.fournisseur.id, this.fournisseur).subscribe({
      next: () => {
        this.alertService.success('Modifications enregistrées avec succès !');
        this.editMode = false;
        setTimeout(() => {
          this.router.navigate(['/fournisseurs']);
        }, 1000);
      },
      error: (err) => {
        console.error("Erreur lors de l'enregistrement:", err);
        const errorMessage = err.error?.message || err.message || 'Une erreur est survenue lors de l\'enregistrement';
        this.alertService.error(errorMessage, 'Erreur');
      }
    });
  }
}
