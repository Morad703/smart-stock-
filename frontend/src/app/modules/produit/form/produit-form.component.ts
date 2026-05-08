import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ProduitService } from '../../../shared/services/produit.service';
import { FournisseurService } from '../../../shared/services/fournisseur.service';
import { AlertService } from '../../../shared/services/alert.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './produit-form.component.html',
  styleUrls: ['./produit-form.component.css']
})
export class ProduitFormComponent implements OnInit {

  produit = {
    designation: '',
    description: '',
    prix: 0,
    categorie: '',
    reference: '',
    fournisseur_id: null as number | null  };

  fournisseurs: any[] = [];

  // 🔥 Modal d’ajout fournisseur
  showFournisseurModal = false;
  newFournisseur = {
    nom: '',
    email: '',
    telephone: '',
    adresse: ''
  };

  formErrors: any = {};

  constructor(
    private produitService: ProduitService,
    private fournisseurService: FournisseurService,
    public router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadFournisseurs();
    this.generateReference();
  }

  generateReference() {
    // Charger tous les produits pour trouver le prochain numéro
    this.produitService.getAll().subscribe({
      next: (produits) => {
        let maxNum = 0;

        // Parcourir tous les produits pour trouver le numéro maximum
        produits.forEach(p => {
          if (p.reference && p.reference.startsWith('PROD')) {
            const numStr = p.reference.replace('PROD', '');
            const num = parseInt(numStr, 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });

        // Générer la prochaine référence (PROD01, PROD02, etc.)
        const nextNum = maxNum + 1;
        this.produit.reference = `PROD${nextNum.toString().padStart(2, '0')}`;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des produits pour générer la référence:", err);
        // En cas d'erreur, commencer par PROD01
        this.produit.reference = 'PROD01';
      }
    });
  }

  loadFournisseurs() {
    this.fournisseurService.getAllFournisseurs().subscribe({
      next: (data) => this.fournisseurs = data,
      error: (err) => console.error("Erreur chargement fournisseurs :", err)
    });
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.produit.designation || !this.produit.designation.trim()) {
      this.formErrors.designation = 'La désignation est requise';
    } else if (this.produit.designation.length < 2) {
      this.formErrors.designation = 'La désignation doit contenir au moins 2 caractères';
    }

    if (this.produit.prix === null || this.produit.prix === undefined || this.produit.prix < 0) {
      this.formErrors.prix = 'Le prix doit être un nombre positif';
    }

    if (!this.produit.fournisseur_id) {
      this.formErrors.fournisseur_id = 'Veuillez sélectionner un fournisseur';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  save(form: NgForm) {
    // S'assurer que la référence est bien au format PRODXX avant l'envoi
    if (!this.produit.reference || !this.produit.reference.match(/^PROD\d{2,}$/)) {
      this.generateReference();
    }

    if (!this.validateForm()) {
      const firstError = Object.values(this.formErrors)[0];
      this.alertService.warning(firstError as string, 'Formulaire invalide');
      return;
    }

    this.produitService.add(this.produit).subscribe({
      next: () => {
        this.alertService.success('Produit ajouté avec succès !');
        setTimeout(() => {
          this.router.navigate(['/produits']);
        }, 1000);
      },
      error: err => {
        console.error("Erreur ajout produit :", err);
        const errorMessage = err.error?.message || err.message || 'Une erreur est survenue lors de l\'ajout du produit';
        this.alertService.error(errorMessage, 'Erreur');
      }
    });
  }

  // ➕ Ouvrir modal
  openFournisseurModal() {
    this.showFournisseurModal = true;
  }

  // ❌ Fermer modal
  closeFournisseurModal() {
    this.showFournisseurModal = false;
    this.newFournisseur = { nom: '', email: '', telephone: '', adresse: '' };
  }

  saveFournisseur() {
    // Validation simple
    if (!this.newFournisseur.nom || !this.newFournisseur.nom.trim()) {
      this.alertService.warning('Le nom du fournisseur est requis', 'Formulaire invalide');
      return;
    }

    if (!this.newFournisseur.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.newFournisseur.email)) {
      this.alertService.warning('Format d\'email invalide', 'Formulaire invalide');
      return;
    }

    this.fournisseurService.createFournisseur(this.newFournisseur).subscribe({
      next: (created) => {
        this.alertService.success('Fournisseur ajouté avec succès !');
        this.closeFournisseurModal();
        this.loadFournisseurs(); // recharge la liste
        this.produit.fournisseur_id = created.id!; // sélection automatique
      },
      error: err => {
        console.error("Erreur ajout fournisseur :", err);
        const errorMessage = err.error?.message || err.message || 'Une erreur est survenue lors de l\'ajout du fournisseur';
        this.alertService.error(errorMessage, 'Erreur');
      }
    });
  }

}
