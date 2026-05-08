import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { StockService } from '../../../shared/services/stock.service';
import { ProduitService } from '../../../shared/services/produit.service';
import { AlertService } from '../../../shared/services/alert.service';
import { StockChangeTrackerService } from '../../../shared/services/stock-change-tracker.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.css']
})
export class StockListComponent implements OnInit, OnDestroy {
  stocks: any[] = [];
  filteredStocks: any[] = [];
  produits: any[] = [];
  searchTerm: string = '';

  // 🔥 MODAL DATA
  showModal = false;
  stockToDelete: any = null;

  // 📊 Suivi des changements de quantité pour animations
  stockChanges: Map<number, { value: number; type: 'increase' | 'decrease' }> = new Map();
  private destroy$ = new Subject<void>();

  constructor(
    private stockService: StockService,
    private produitService: ProduitService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService,
    private stockChangeTracker: StockChangeTrackerService
  ) {}

  ngOnInit(): void {
    // Récupérer les changements persistants du service
    this.stockChanges = this.stockChangeTracker.getAllChanges();
    
    this.loadProduits();
    this.loadStocks();
    
    // Écouter les événements de navigation pour recharger les stocks quand on revient sur /stocks
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      filter((event: NavigationEnd) => event.url === '/stocks' || event.urlAfterRedirects === '/stocks'),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // Récupérer les changements persistants avant de recharger
      this.stockChanges = this.stockChangeTracker.getAllChanges();
      // Recharger les stocks à chaque fois qu'on revient sur la page
      this.loadStocks();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProduits() {
    this.produitService.getAll().subscribe({
      next: (data) => {
        this.produits = data;
      },
      error: (err) => console.error("Erreur chargement produits:", err)
    });
  }

  loadStocks() {
    this.stockService.getAllStocks().subscribe({
      next: (data) => {
        // Initialiser les quantités si c'est la première fois
        this.stockChangeTracker.initializeQuantities(data);
        
        // Détecter les changements de quantité (le service les stocke de manière persistante)
        const newChanges = this.stockChangeTracker.detectChanges(data);
        
        // Mettre à jour les changements locaux avec tous les changements persistants
        this.stockChanges = this.stockChangeTracker.getAllChanges();
        
        this.stocks = data;
        this.filteredStocks = data;
        
        // Forcer la détection de changement
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des stocks:', error);
      }
    });
  }

  getStockChange(stockId: number): { value: number; type: 'increase' | 'decrease' } | null {
    return this.stockChanges.get(stockId) || null;
  }

  refresh() {
    this.loadStocks();
  }

  filterStocks() {
    const term = this.searchTerm.toLowerCase();
    this.filteredStocks = this.stocks.filter(s => {
      const produit = this.getProduitById(s.produitId);
      return (
        (produit && produit.designation && produit.designation.toLowerCase().includes(term)) ||
        (s.emplacement && s.emplacement.toLowerCase().includes(term)) ||
        s.quantite.toString().includes(term)
      );
    });
  }

  getProduitById(id: number): any {
    return this.produits.find(p => p.id === id);
  }

  getProduitNom(id: number): string {
    const produit = this.getProduitById(id);
    return produit ? produit.designation : 'Produit introuvable';
  }

  getProduitReference(id: number): string {
    const produit = this.getProduitById(id);
    return produit ? produit.reference : 'N/A';
  }

  goToAdd() {
    this.router.navigate(['/stocks/nouveau']);
  }

  goToSortie() {
    this.router.navigate(['/stocks/sortie']);
  }

  showDetails(id: number) {
    this.router.navigate(['/stocks/details', id]);
  }

  openDeleteModal(s: any) {
    this.stockToDelete = s;
    this.showModal = true;
  }

  cancelDelete() {
    this.showModal = false;
    this.stockToDelete = null;
  }

  confirmDelete() {
    if (!this.stockToDelete) return;

    this.stockService.deleteStock(this.stockToDelete.id).subscribe({
      next: () => {
        this.refresh();
        this.showModal = false;
        this.stockToDelete = null;
        this.alertService.success('Stock supprimé avec succès !');
      },
      error: (err) => {
        console.error('Erreur lors de la suppression du stock:', err);
        const errorMessage = err.error?.message || err.message || 'Une erreur est survenue lors de la suppression du stock';
        this.alertService.error(errorMessage, 'Erreur de suppression');
      }
    });
  }
}

