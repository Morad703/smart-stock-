import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { StockService } from '../../../shared/services/stock.service';
import { ProduitService } from '../../../shared/services/produit.service';
import { AlertService } from '../../../shared/services/alert.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.css']
})
export class StockDetailsComponent implements OnInit {

  stock: any = null;
  sorties: any[] = [];
  produitNom: string = "";
  editMode: boolean = false;
  produits: any[] = [];
  originalProduitId: number = 0;
  formErrors: any = {};

  constructor(
    private route: ActivatedRoute,
    private stockService: StockService,
    private produitService: ProduitService,
    public router: Router,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProduits();
    this.loadStock(id);
    this.loadSorties(id);
  }

  loadProduits() {
    this.produitService.getAll().subscribe({
      next: (data) => {
        this.produits = data;
        this.cdr.detectChanges();
      }
    });
  }

  loadStock(id: number) {
    this.stockService.getStockById(id).subscribe({
      next: (data) => {
        this.stock = data;
        this.originalProduitId = data.produitId;

        this.produitService.getById(this.stock.produitId).subscribe({
          next: (produit) => {
            this.produitNom = produit.designation;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  loadSorties(id: number) {
    this.stockService.getSorties(id).subscribe({
      next: (data) => {
        this.sorties = data.reverse();
        this.cdr.detectChanges();
      }
    });
  }


  activerModification() {
    this.editMode = true;
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (this.stock.quantite === null || this.stock.quantite === undefined || this.stock.quantite < 0) {
      this.formErrors.quantite = 'La quantité doit être un nombre positif';
    }

    if (this.stock.seuilCritique === null || this.stock.seuilCritique === undefined || this.stock.seuilCritique < 0) {
      this.formErrors.seuilCritique = 'Le seuil critique doit être un nombre positif';
    }

    if (this.stock.seuilCritique > this.stock.quantite) {
      this.formErrors.seuilCritique = 'Le seuil critique ne peut pas être supérieur à la quantité';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  enregistrer(form?: NgForm) {
    if (!this.validateForm()) {
      const firstError = Object.values(this.formErrors)[0];
      this.alertService.warning(firstError as string, 'Formulaire invalide');
      return;
    }

    this.stock.produitId = this.originalProduitId;

    this.stockService.updateStock(this.stock.id, this.stock).subscribe({
      next: () => {
        this.alertService.success('Modifications enregistrées avec succès !');
        this.editMode = false;
        setTimeout(() => {
          this.router.navigate(['/stocks']);
        }, 1000);
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour:', err);
        const errorMessage = err.error?.message || err.message || 'Une erreur est survenue lors de l\'enregistrement';
        this.alertService.error(errorMessage, 'Erreur');
      }
    });
  }

  getProduitNom(id: number): string {
    const produit = this.produits.find(p => p.id === id);
    return produit ? produit.designation : 'Produit introuvable';
  }
}
