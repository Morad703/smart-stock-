import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { CommandeService } from '../../../shared/services/commande.service';
import { FournisseurService } from '../../../shared/services/fournisseur.service';
import { ProduitService } from '../../../shared/services/produit.service';
import { StockService } from '../../../shared/services/stock.service';
import { AlertService } from '../../../shared/services/alert.service';
import { Commande, CommandeStatus } from '../../../shared/models/commande.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-commande-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './commande-details.component.html',
  styleUrls: ['./commande-details.component.css']
})
export class CommandeDetailsComponent implements OnInit {
  commande: Commande | null = null;
  commandeOriginale: Commande | null = null; // Sauvegarder l'état original pour détecter le changement de statut
  fournisseurs: any[] = [];
  produits: any[] = [];
  editMode: boolean = false;
  CommandeStatus = CommandeStatus; // Exposer pour le template
  private isUpdatingStocks = false; // Protection contre les appels multiples

  constructor(
    private route: ActivatedRoute,
    private commandeService: CommandeService,
    private fournisseurService: FournisseurService,
    private produitService: ProduitService,
    private stockService: StockService,
    public router: Router,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCommandes(id);
    this.loadFournisseurs();
    this.loadProduits();
  }

  loadCommandes(id: number) {
    this.commandeService.getById(id).subscribe({
      next: (data) => {
        this.commande = data;
        // Sauvegarder l'état original pour détecter le changement de statut
        this.commandeOriginale = JSON.parse(JSON.stringify(data));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement:', err);
        this.alertService.error('Impossible de charger la commande', 'Erreur');
      }
    });
  }

  loadFournisseurs() {
    this.fournisseurService.getAllFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs = data;
        this.cdr.detectChanges();
      }
    });
  }

  loadProduits() {
    this.produitService.getAll().subscribe({
      next: (data) => {
        this.produits = data;
        this.cdr.detectChanges();
      }
    });
  }

  activerModification() {
    this.editMode = true;
  }

  getFournisseurNom(fournisseurId: number | undefined): string {
    // Si fournisseurId est directement disponible sur la commande, l'utiliser
    if (fournisseurId !== undefined && fournisseurId !== null) {
      const fournisseur = this.fournisseurs.find(f => Number(f.id) === Number(fournisseurId));
      if (fournisseur) return fournisseur.nom;
    }

    // Sinon, récupérer via les produits de la commande
    // La commande contient des items avec produitId, et chaque produit a un fournisseur_id
    if (this.commande && this.commande.items && this.commande.items.length > 0 && this.produits.length > 0) {
      // Prendre le premier item pour récupérer le produit
      const firstItem = this.commande.items[0];
      if (firstItem && firstItem.produitId) {
        const produitId = Number(firstItem.produitId);
        
        // Trouver le produit correspondant
        const produit = this.produits.find(p => Number(p.id) === produitId);
        
        if (produit) {
          // Récupérer le fournisseur_id du produit (peut être fournisseur_id ou fournisseurId)
          const fournisseurIdFromProduit = produit.fournisseur_id || produit.fournisseurId;
          
          if (fournisseurIdFromProduit !== undefined && fournisseurIdFromProduit !== null) {
            // Trouver le fournisseur correspondant
            const fournisseur = this.fournisseurs.find(f => Number(f.id) === Number(fournisseurIdFromProduit));
            if (fournisseur) {
              return fournisseur.nom;
            }
          }
        }
      }
    }

    return 'N/A';
  }

  getProduitNom(produitId: number): string {
    const produit = this.produits.find(p => p.id === produitId);
    return produit ? `${produit.designation} (${produit.reference || 'N/A'})` : `Produit ID: ${produitId}`;
  }

  getProduitPrix(produitId: number): number {
    const produit = this.produits.find(p => p.id === produitId);
    return produit ? produit.prix : 0;
  }

  getTotalCommande(): number {
    if (!this.commande || !this.commande.items) return 0;
    return this.commande.items.reduce((total, item) => {
      const prix = this.getProduitPrix(item.produitId);
      return total + (prix * item.quantite);
    }, 0);
  }

  getTotalQuantite(): number {
    if (!this.commande || !this.commande.items) return 0;
    return this.commande.items.reduce((sum, item) => sum + item.quantite, 0);
  }

  getStatusLabel(status: CommandeStatus): string {
    switch (status) {
      case CommandeStatus.EN_ATTENTE:
        return 'En attente';
      case CommandeStatus.ANNULÉE:
        return 'Annulée';
      case CommandeStatus.REÇUE:
        return 'Reçue';
      default:
        return status;
    }
  }

  getStatusClass(status: CommandeStatus): string {
    switch (status) {
      case CommandeStatus.EN_ATTENTE:
        return 'status-waiting';
      case CommandeStatus.ANNULÉE:
        return 'status-cancelled';
      case CommandeStatus.REÇUE:
        return 'status-received';
      default:
        return '';
    }
  }

  enregistrer(form?: NgForm) {
    if (!this.commande || !this.commande.id) return;

    // Vérifier si le statut a changé de non-REÇUE à REÇUE
    const statutChangeEnRecue = this.commandeOriginale && 
      this.commandeOriginale.status !== CommandeStatus.REÇUE && 
      this.commande.status === CommandeStatus.REÇUE;

    this.commandeService.update(this.commande.id, this.commande).subscribe({
      next: () => {
        // Le backend met déjà à jour les stocks automatiquement quand le statut passe à REÇUE
        // Pas besoin de mettre à jour les stocks côté frontend
        if (statutChangeEnRecue) {
          this.alertService.success('Commande reçue et stocks mis à jour avec succès !');
        } else {
          this.alertService.success('Modifications enregistrées avec succès !');
        }
        this.editMode = false;
        setTimeout(() => {
          this.router.navigate(['/commandes']);
        }, 1000);
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour:', err);
        const errorMessage = err.error?.message || err.message || 'Une erreur est survenue lors de l\'enregistrement';
        this.alertService.error(errorMessage, 'Erreur');
      }
    });
  }

  updateStocksFromCommande() {
    if (!this.commande || !this.commande.items) return;

    // Protection contre les appels multiples
    if (this.isUpdatingStocks) {
      console.warn('⚠️ Mise à jour des stocks déjà en cours, appel ignoré');
      return;
    }

    // Vérifier si la commande était déjà en statut REÇUE avant la modification
    // Si c'est le cas, le stock a peut-être déjà été mis à jour, on ne fait rien
    if (this.commandeOriginale && this.commandeOriginale.status === CommandeStatus.REÇUE) {
      console.log('ℹ️ Commande déjà en statut REÇUE, les stocks ont peut-être déjà été mis à jour');
      this.alertService.success('Modifications enregistrées avec succès !');
      this.editMode = false;
      setTimeout(() => {
        this.router.navigate(['/commandes']);
      }, 1000);
      return;
    }

    this.isUpdatingStocks = true;

    // Récupérer tous les stocks
    this.stockService.getAllStocks().subscribe({
      next: (stocks) => {
        const updates: any[] = [];

        // Pour chaque item de la commande, trouver ou créer le stock correspondant
        this.commande!.items.forEach(item => {
          // Trouver le stock existant pour ce produit
          let stock = stocks.find(s => s.produitId === item.produitId);

          if (stock) {
            // Mettre à jour le stock existant
            stock.quantite = stock.quantite + item.quantite;
            updates.push(this.stockService.updateStock(stock.id!, stock));
          } else {
            // Créer un nouveau stock si il n'existe pas
            const newStock = {
              produitId: item.produitId,
              quantite: item.quantite,
              seuilCritique: 10, // Valeur par défaut
              emplacement: undefined
            };
            updates.push(this.stockService.createStock(newStock));
          }
        });

        // Exécuter toutes les mises à jour en parallèle
        if (updates.length > 0) {
          forkJoin(updates).subscribe({
            next: () => {
              this.isUpdatingStocks = false;
              this.alertService.success('Commande reçue et stocks mis à jour avec succès !');
              this.editMode = false;
              setTimeout(() => {
                this.router.navigate(['/commandes']);
              }, 1000);
            },
            error: (err) => {
              this.isUpdatingStocks = false;
              console.error('Erreur lors de la mise à jour des stocks:', err);
              this.alertService.warning('Commande mise à jour mais erreur lors de la mise à jour des stocks', 'Attention');
              this.editMode = false;
            }
          });
        } else {
          this.isUpdatingStocks = false;
          this.alertService.success('Modifications enregistrées avec succès !');
          this.editMode = false;
          setTimeout(() => {
            this.router.navigate(['/commandes']);
          }, 1000);
        }
      },
      error: (err) => {
        this.isUpdatingStocks = false;
        console.error('Erreur lors de la récupération des stocks:', err);
        this.alertService.warning('Commande mise à jour mais impossible de mettre à jour les stocks', 'Attention');
        this.editMode = false;
      }
    });
  }

  // Constantes pour les valeurs d'enum dans le template (évite les problèmes avec les caractères spéciaux)
  readonly STATUS_EN_ATTENTE = CommandeStatus.EN_ATTENTE;
  readonly STATUS_ANNULÉE = CommandeStatus.ANNULÉE;
  readonly STATUS_REÇUE = CommandeStatus.REÇUE;
}
