import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FournisseurService } from '../../../shared/services/fournisseur.service';
import { ProduitService } from '../../../shared/services/produit.service';
import { StockService } from '../../../shared/services/stock.service';
import { CommandeService } from '../../../shared/services/commande.service';
import { AlertService } from '../../../shared/services/alert.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-fournisseur-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fournisseur-list.component.html',
  styleUrls: ['./fournisseur-list.component.css']
})
export class FournisseurListComponent implements OnInit {
  fournisseurs: any[] = [];
  filteredFournisseurs: any[] = [];
  searchTerm: string = '';

  // 🔥 MODAL DATA
  showModal = false;
  fournisseurToDelete: any = null;

  constructor(
    private fournisseurService: FournisseurService,
    private produitService: ProduitService,
    private stockService: StockService,
    private commandeService: CommandeService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadFournisseurs();
  }

  loadFournisseurs() {
    this.fournisseurService.getAllFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs = data;
        this.filteredFournisseurs = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des fournisseurs:', error);
      }
    });
  }

  refresh() {
    this.loadFournisseurs();
  }

  filterFournisseurs() {
    const term = this.searchTerm.toLowerCase();
    this.filteredFournisseurs = this.fournisseurs.filter(f =>
      f.nom.toLowerCase().includes(term) ||
      (f.email && f.email.toLowerCase().includes(term)) ||
      (f.telephone && f.telephone.toLowerCase().includes(term))
    );
  }

  goToAdd() {
    this.router.navigate(['/fournisseurs/nouveau']);
  }

  showDetails(id: number) {
    this.router.navigate(['/fournisseurs/details', id]);
  }

  openDeleteModal(f: any) {
    this.fournisseurToDelete = f;
    this.showModal = true;
  }

  cancelDelete() {
    this.showModal = false;
    this.fournisseurToDelete = null;
  }

  // ✔ SUPPRESSION CONFIRMÉE AVEC CASCADE
  confirmDelete() {
    if (!this.fournisseurToDelete) return;

    const fournisseurId = this.fournisseurToDelete.id;

    // Étape 1 : Récupérer tous les produits
    this.produitService.getAll().subscribe({
      next: (produits) => {
        // Étape 2 : Filtrer les produits associés à ce fournisseur
        const produitsAssocies = produits.filter(p => p.fournisseur_id === fournisseurId);

        if (produitsAssocies.length === 0) {
          // Aucun produit associé, supprimer directement le fournisseur
          this.fournisseurService.deleteFournisseur(fournisseurId).subscribe({
            next: () => {
              this.refresh();
              this.showModal = false;
              this.fournisseurToDelete = null;
              this.alertService.success('Fournisseur supprimé avec succès !');
            },
            error: (err) => {
              console.error('Erreur lors de la suppression du fournisseur:', err);
              const errorMessage = err.error?.message || err.message || 'Une erreur est survenue lors de la suppression du fournisseur';
              this.alertService.error(errorMessage, 'Erreur de suppression');
            }
          });
        } else {
          // Étape 3 : Récupérer tous les stocks pour identifier ceux à supprimer
          // NOTE: On garde les commandes (historique) mais on supprime les stocks
          this.stockService.getAllStocks().pipe(
            catchError(() => of([]))
          ).subscribe({
            next: (stocks) => {
              const produitIds = produitsAssocies.map(p => p.id);
              
              // Identifier les stocks à supprimer (stocks associés aux produits)
              const stocksASupprimer = stocks.filter((s: any) => produitIds.includes(s.produitId));

              // Étape 4 : Supprimer les stocks associés (les commandes sont conservées pour l'historique)
              const suppressionsStocks = stocksASupprimer.length > 0 
                ? stocksASupprimer.map((stock: any) =>
                    this.stockService.deleteStock(stock.id).pipe(
                      catchError(() => of(null))
                    )
                  )
                : [of(null)];

              // Étape 5 : Supprimer tous les produits associés
              const suppressionsProduits = produitsAssocies.map(produit =>
                this.produitService.delete(produit.id).pipe(
                  catchError(() => of(null))
                )
              );

              // Exécuter toutes les suppressions en parallèle
              forkJoin([
                ...suppressionsStocks,
                ...suppressionsProduits
              ]).subscribe({
                next: () => {
                  // Étape 6 : Une fois tout supprimé, supprimer le fournisseur
                  this.fournisseurService.deleteFournisseur(fournisseurId).subscribe({
                    next: () => {
                      this.refresh();
                      this.showModal = false;
                      this.fournisseurToDelete = null;
                      
                      let message = `Fournisseur supprimé avec succès !\n`;
                      message += `- ${produitsAssocies.length} produit(s) supprimé(s)\n`;
                      if (stocksASupprimer.length > 0) {
                        message += `- ${stocksASupprimer.length} stock(s) supprimé(s)\n`;
                      }
                      message += `- Les commandes sont conservées pour l'historique`;
                      
                      this.alertService.success(message.trim());
                    },
                    error: (err) => {
                      console.error('Erreur lors de la suppression du fournisseur:', err);
                      const errorMessage = err.error?.message || err.message || 'Les éléments associés ont été supprimés mais une erreur est survenue lors de la suppression du fournisseur';
                      this.alertService.warning(errorMessage, 'Attention');
                    }
                  });
                },
                error: (err) => {
                  console.error('Erreur lors de la suppression des éléments associés:', err);
                  this.alertService.error('Une erreur est survenue lors de la suppression des éléments associés', 'Erreur');
                }
              });
            },
            error: (err) => {
              console.error('Erreur lors de la récupération des stocks:', err);
              // Continuer quand même avec la suppression des produits
              const suppressionsProduits = produitsAssocies.map(produit =>
                this.produitService.delete(produit.id)
              );

              forkJoin(suppressionsProduits).subscribe({
                next: () => {
                  this.fournisseurService.deleteFournisseur(fournisseurId).subscribe({
                    next: () => {
                      this.refresh();
                      this.showModal = false;
                      this.fournisseurToDelete = null;
                      this.alertService.success(`Fournisseur et ${produitsAssocies.length} produit(s) supprimés avec succès ! Les commandes sont conservées pour l'historique.`);
                    },
                    error: (err) => {
                      console.error('Erreur lors de la suppression du fournisseur:', err);
                      this.alertService.error('Erreur lors de la suppression', 'Erreur');
                    }
                  });
                },
                error: (err) => {
                  console.error('Erreur lors de la suppression des produits:', err);
                  this.alertService.error('Erreur lors de la suppression des produits', 'Erreur');
                }
              });
            }
          });
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des produits:', err);
        this.alertService.error(
          'Impossible de récupérer les produits. La suppression en cascade ne peut pas être effectuée.',
          'Erreur de connexion'
        );
      }
    });
  }
}
