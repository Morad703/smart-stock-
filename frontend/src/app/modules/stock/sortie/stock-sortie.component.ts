import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StockService } from '../../../shared/services/stock.service';
import { ProduitService } from '../../../shared/services/produit.service';
import { AlertService } from '../../../shared/services/alert.service';

@Component({
  selector: 'app-stock-sortie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-sortie.component.html',
  styleUrls: ['./stock-sortie.component.css']
})
export class StockSortieComponent implements OnInit {
  stocks: any[] = [];
  produits: any[] = [];
  
  sortie = {
    stockId: null as number | null,
    produitId: null as number | null,
    quantite: 0,
    raison: '',
    commentaire: ''
  };

  stockSelectionne: any = null;
  quantiteDisponible: number = 0;
  showConfirmModal: boolean = false;

  raisons = [
    { value: 'vente', label: 'Vente' },
    { value: 'casse', label: 'Casse' },
    { value: 'perte', label: 'Perte' },
    { value: 'retour', label: 'Retour client' },
    { value: 'echantillon', label: 'Échantillon' },
    { value: 'autre', label: 'Autre' }
  ];

  formErrors: any = {};

  constructor(
    private stockService: StockService,
    private produitService: ProduitService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    // Charger les produits d'abord, puis les stocks
    this.loadProduits();
    this.loadStocks();
  }

  loadStocks() {
    this.stockService.getAllStocks().subscribe({
      next: (data) => {
        this.stocks = data;
        console.log('Stocks chargés:', data.length);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur chargement stocks:", err);
        this.alertService.error(
          'Impossible de charger les stocks. Vérifiez que le service est disponible.',
          'Erreur de connexion'
        );
      }
    });
  }

  loadProduits() {
    this.produitService.getAll().subscribe({
      next: (data) => {
        this.produits = data;
        console.log('Produits chargés:', data.length, data);
        if (data.length === 0) {
          console.warn('Aucun produit trouvé');
        }
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

  onStockChange() {
    console.log('onStockChange appelé, stockId:', this.sortie.stockId, 'type:', typeof this.sortie.stockId);
    console.log('Stocks disponibles:', this.stocks.length);
    
    if (this.sortie.stockId) {
      // Convertir en number car le select retourne une string
      const stockIdNum = Number(this.sortie.stockId);
      console.log('Recherche du stock avec ID:', stockIdNum, 'dans', this.stocks.length, 'stocks');
      console.log('IDs des stocks:', this.stocks.map(s => ({ id: s.id, type: typeof s.id })));
      
      // Essayer de trouver avec comparaison stricte et non stricte
      this.stockSelectionne = this.stocks.find(s => {
        const match = s.id === stockIdNum || s.id == stockIdNum || Number(s.id) === stockIdNum;
        if (match) console.log('Match trouvé:', s);
        return match;
      });
      
      if (this.stockSelectionne) {
        console.log('Stock trouvé:', this.stockSelectionne);
        this.quantiteDisponible = this.stockSelectionne.quantite;
        this.sortie.produitId = this.stockSelectionne.produitId;
        // Réinitialiser la quantité si elle dépasse le nouveau stock disponible
        if (this.sortie.quantite > this.quantiteDisponible) {
          this.sortie.quantite = 0;
        }
        // Forcer la détection de changement
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      } else {
        console.error('Stock non trouvé pour ID:', stockIdNum);
        console.log('IDs disponibles:', this.stocks.map(s => s.id));
        this.quantiteDisponible = 0;
        this.stockSelectionne = null;
        this.cdr.detectChanges();
      }
    } else {
      console.log('Aucun stock sélectionné');
      this.stockSelectionne = null;
      this.quantiteDisponible = 0;
      this.sortie.quantite = 0;
      this.cdr.detectChanges();
    }
  }

  getProduitNom(produitId: number): string {
    if (!produitId) return 'Produit non défini';
    if (this.produits.length === 0) return 'Chargement...';
    const produit = this.produits.find(p => p.id === produitId);
    if (produit) {
      return `${produit.designation} (${produit.reference || 'N/A'})`;
    }
    return `Produit ID: ${produitId} (introuvable)`;
  }

  // Méthode helper pour convertir en number dans le template
  toNumber(value: any): number {
    return Number(value);
  }

  // Méthode helper pour vérifier si le formulaire a des erreurs
  hasFormErrors(): boolean {
    return Object.keys(this.formErrors).length > 0;
  }

  goToStocks() {
    this.router.navigate(['/stocks']);
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.sortie.stockId) {
      this.formErrors.stockId = 'Veuillez sélectionner un stock';
    }

    const quantiteNum = Number(this.sortie.quantite);
    if (!quantiteNum || quantiteNum <= 0 || isNaN(quantiteNum)) {
      this.formErrors.quantite = 'Veuillez entrer une quantité valide (supérieure à 0)';
    } else if (quantiteNum > this.quantiteDisponible) {
      this.formErrors.quantite = `La quantité demandée (${quantiteNum}) dépasse le stock disponible (${this.quantiteDisponible})`;
    }

    if (!this.quantiteDisponible || this.quantiteDisponible <= 0) {
      this.formErrors.stockId = 'Aucun stock disponible pour ce produit';
    }

    if (!this.sortie.raison) {
      this.formErrors.raison = 'Veuillez sélectionner une raison';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  validerSortie() {
    if (!this.validateForm()) {
      const firstError = Object.values(this.formErrors)[0];
      this.alertService.warning(firstError as string, 'Formulaire invalide');
      return;
    }

    // Ouvrir le modal de confirmation
    this.showConfirmModal = true;
  }

  cancelConfirm() {
    this.showConfirmModal = false;
  }

  confirmSortie() {
    this.showConfirmModal = false;

    const quantiteNum = Number(this.sortie.quantite);
    
    // Enregistrer la sortie
    if (this.stockSelectionne) {
      this.stockService.sortieStock(
        this.stockSelectionne.id,
        quantiteNum,
        this.sortie.raison,
        this.sortie.commentaire
      ).subscribe({
        next: (updatedStock) => {
          this.alertService.success(`Sortie enregistrée avec succès ! Nouveau stock: ${updatedStock.quantite} unités`);
          
          // Rediriger vers la liste des stocks
          this.router.navigate(['/stocks']);
        },
        error: (err) => {
          console.error("Erreur lors de la sortie:", err);
          const errorMessage = err.error?.message || err.message || 'Une erreur est survenue lors de l\'enregistrement de la sortie';
          this.alertService.error(errorMessage, 'Erreur');
        }
      });
    }
  }

  getRaisonLabel(value: string): string {
    const raison = this.raisons.find(r => r.value === value);
    return raison ? raison.label : value;
  }

  getNouveauStock(): number {
    const quantiteNum = Number(this.sortie.quantite);
    return this.quantiteDisponible - quantiteNum;
  }

  isStockCritiqueAfter(): boolean {
    const nouveauStock = this.getNouveauStock();
    return this.stockSelectionne && nouveauStock <= this.stockSelectionne.seuilCritique;
  }
}

