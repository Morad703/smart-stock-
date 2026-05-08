import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { StockService } from '../../../shared/services/stock.service';
import { ProduitService } from '../../../shared/services/produit.service';
import { AlertService } from '../../../shared/services/alert.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-form.component.html',
  styleUrls: ['./stock-form.component.css']
})
export class StockFormComponent implements OnInit {
  stock = {
    produitId: null as number | null,
    quantite: 0,
    seuilCritique: 0,
    emplacement: ''
  };

  produits: any[] = [];

  formErrors: any = {};

  constructor(
    private stockService: StockService,
    private produitService: ProduitService,
    public router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadProduits();
    
    // Vérifier si un produitId est passé en paramètre de requête
    this.route.queryParams.subscribe(params => {
      if (params['produitId']) {
        this.stock.produitId = Number(params['produitId']);
        this.cdr.detectChanges();
      }
    });
  }

  loadProduits() {
    this.produitService.getAll().subscribe({
      next: (data) => {
        this.produits = data;
        console.log('Produits chargés:', data.length);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur chargement produits:", err);
        this.alertService.error(
          'Impossible de charger les produits. Vérifiez que le service est disponible.',
          'Erreur de connexion'
        );
      }
    });
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.stock.produitId) {
      this.formErrors.produitId = 'Veuillez sélectionner un produit';
    }

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

  save(form: NgForm) {
    if (!this.validateForm()) {
      const firstError = Object.values(this.formErrors)[0];
      this.alertService.warning(firstError as string, 'Formulaire invalide');
      return;
    }

    // Créer un objet Stock valide avec produitId non null
    const stockToSave = {
      produitId: this.stock.produitId!,
      quantite: this.stock.quantite,
      seuilCritique: this.stock.seuilCritique,
      emplacement: this.stock.emplacement || undefined
    };

    this.stockService.createStock(stockToSave).subscribe({
      next: () => {
        this.alertService.success('Stock ajouté avec succès !');
        setTimeout(() => {
          this.router.navigate(['/stocks']);
        }, 1000);
      },
      error: (err) => {
        console.error("Erreur lors de l'ajout du stock:", err);
        const errorMessage = err.error?.error || err.error?.message || err.message || 'Une erreur est survenue lors de l\'ajout du stock';
        this.alertService.error(errorMessage, 'Erreur');
      }
    });
  }
}

