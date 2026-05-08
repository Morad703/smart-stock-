import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ProduitService } from '../../../shared/services/produit.service';
import { FournisseurService } from '../../../shared/services/fournisseur.service';
import { StockService } from '../../../shared/services/stock.service';
import { AlertService } from '../../../shared/services/alert.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './produit-details.component.html',
  styleUrls: ['./produit-details.component.css']
})
export class ProduitDetailsComponent implements OnInit {

  produit: any = null;
  fournisseurNom: string = "";
  stock: any = null;
  editMode: boolean = false;
  originalReference: string = ""; // Sauvegarder la référence originale
  formErrors: any = {};

  constructor(
    private route: ActivatedRoute,
    private produitService: ProduitService,
    private fournisseurService: FournisseurService,
    private stockService: StockService,
    public router: Router,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.produitService.getById(id).subscribe({
      next: (data) => {
        this.produit = data;
        this.originalReference = data.reference; // Sauvegarder la référence originale
        this.cdr.detectChanges();

        // 🔥 Charger nom du fournisseur
        if (this.produit.fournisseur_id) {
          this.fournisseurService.getFournisseurById(this.produit.fournisseur_id).subscribe({
            next: (f) => {
              this.fournisseurNom = f.nom;
              this.cdr.detectChanges(); // Forcer la détection après chargement du fournisseur
            },
            error: () => {
              this.fournisseurNom = "Non trouvé";
              this.cdr.detectChanges(); // Forcer la détection même en cas d'erreur
            }
          });
        }

        // 🔥 Charger le stock associé au produit
        this.loadStock(this.produit.id);
      },
      error: (error) => console.error("Erreur chargement produit :", error)
    });
  }

  activerModification() {
    this.editMode = true;
  }

  loadStock(produitId: number) {
    // Récupérer tous les stocks et trouver celui associé au produit
    this.stockService.getAllStocks().subscribe({
      next: (stocks) => {
        const stockAssocie = stocks.find(s => s.produitId === produitId);
        if (stockAssocie) {
          this.stock = stockAssocie;
          this.cdr.detectChanges();
        } else {
          this.stock = null;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error("Erreur lors du chargement du stock:", err);
        this.stock = null;
        this.cdr.detectChanges();
      }
    });
  }

  isStockCritique(): boolean {
    return this.stock && this.stock.quantite <= this.stock.seuilCritique;
  }

  goToStockDetails() {
    if (this.stock && this.stock.id) {
      this.router.navigate(['/stocks/details', this.stock.id]);
    }
  }

  goToCreateStock() {
    // Passer l'ID du produit en paramètre de requête
    this.router.navigate(['/stocks/nouveau'], { queryParams: { produitId: this.produit.id } });
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

    return Object.keys(this.formErrors).length === 0;
  }

  enregistrer(form?: NgForm) {
    if (!this.validateForm()) {
      const firstError = Object.values(this.formErrors)[0];
      this.alertService.warning(firstError as string, 'Formulaire invalide');
      return;
    }

    // Protection : restaurer la référence originale pour empêcher toute modification
    this.produit.reference = this.originalReference;
    
    this.produitService.update(this.produit.id, this.produit).subscribe({
      next: () => {
        this.alertService.success('Modifications enregistrées avec succès !');
        this.editMode = false;
        setTimeout(() => {
          this.router.navigate(['/produits']);
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
