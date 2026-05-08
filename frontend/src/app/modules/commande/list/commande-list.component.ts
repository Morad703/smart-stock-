import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandeService } from '../../../shared/services/commande.service';
import { FournisseurService } from '../../../shared/services/fournisseur.service';
import { AlertService } from '../../../shared/services/alert.service';
import { Commande, CommandeStatus } from '../../../shared/models/commande.model';
import {ProduitService} from '../../../shared/services/produit.service';

@Component({
  selector: 'app-commande-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './commande-list.component.html',
  styleUrls: ['./commande-list.component.css']
})
export class CommandeListComponent implements OnInit {

  commandes: Commande[] = [];
  filteredCommandes: Commande[] = [];
  searchTerm: string = '';

  showModal = false;
  commandeToDelete: Commande | null = null;

  fournisseurs: any[] = [];
  produits: any[] = [];


  constructor(
    private commandeService: CommandeService,
    private fournisseurService: FournisseurService,
    private produitService: ProduitService,   // ✅ AJOUTER
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
        this.loadProduits(); // 🔥 Charger ensuite les produits
      }
    });
  }

  loadProduits() {
    this.produitService.getAll().subscribe({
      next: (data) => {
        this.produits = data;
        this.loadCommandes(); // 🔥 Ne charger les commandes qu’après produits + fournisseurs
      }
    });
  }


  loadCommandes() {
    this.commandeService.getAll().subscribe({
      next: (data) => {
        this.commandes = data;
        this.filteredCommandes = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.alertService.error('Impossible de charger les commandes', 'Erreur');
      }
    });
  }

  refresh() {
    this.loadCommandes();
  }

  filterCommandes() {
    const term = this.searchTerm.toLowerCase();

    this.filteredCommandes = this.commandes.filter(c =>
      (c.reference && c.reference.toLowerCase().includes(term)) ||
      (c.id && c.id.toString().includes(term)) ||
      this.getStatusLabel(c.status).toLowerCase().includes(term) ||
      this.getFournisseurNomFromCommande(c).toLowerCase().includes(term)
    );
  }



  goToAdd() {
    this.router.navigate(['/commandes/nouveau']);
  }

  showDetails(id: number) {
    this.router.navigate(['/commandes/details', id]);
  }

  openDeleteModal(commande: Commande) {
    this.commandeToDelete = commande;
    this.showModal = true;
  }

  cancelDelete() {
    this.showModal = false;
    this.commandeToDelete = null;
  }

  confirmDelete() {
    if (!this.commandeToDelete?.id) return;

    this.commandeService.delete(this.commandeToDelete.id).subscribe({
      next: () => {
        this.alertService.success('Commande supprimée avec succès !');
        this.refresh();
        this.showModal = false;
        this.commandeToDelete = null;
      },
      error: (err) => {
        const message = err.error?.message || 'Erreur lors de la suppression';
        this.alertService.error(message, 'Erreur');
      }
    });
  }

  getStatusLabel(status: CommandeStatus): string {
    switch (status) {
      case CommandeStatus.EN_ATTENTE: return 'En attente';
      case CommandeStatus.ANNULÉE: return 'Annulée';
      case CommandeStatus.REÇUE: return 'Reçue';
      default: return status;
    }
  }

  getStatusClass(status: CommandeStatus): string {
    switch (status) {
      case CommandeStatus.EN_ATTENTE: return 'status-waiting';
      case CommandeStatus.ANNULÉE: return 'status-cancelled';
      case CommandeStatus.REÇUE: return 'status-received';
      default: return '';
    }
  }

  getFournisseurNomFromCommande(c: Commande): string {
    if (!c.items || c.items.length === 0) return "Aucun produit";

    // Prendre le premier item
    const firstItem = c.items[0];
    const produitId = Number(firstItem.produitId);

    // Trouver le produit
    const produit = this.produits.find(p => Number(p.id) === produitId);
    if (!produit) {
      console.warn("Produit introuvable pour produitId =", produitId);
      return "Produit inconnu";
    }

    // Vérifier fournisseur_id (snake_case comme dans le modèle)
    const fournisseurId = produit.fournisseur_id || produit.fournisseurId;
    if (!fournisseurId) {
      console.warn("⚠ produit.fournisseur_id manquant ! Produit:", produit);
      return "Fournisseur non défini";
    }

    // Trouver le fournisseur
    const fournisseur = this.fournisseurs.find(f => Number(f.id) === Number(fournisseurId));
    if (!fournisseur) {
      console.warn("⚠ Fournisseur introuvable pour ID:", fournisseurId);
      return `Fournisseur ID: ${fournisseurId}`;
    }

    return fournisseur.nom;
  }




  getTotalItems(commande: Commande): number {
    return commande.items?.length || 0;
  }

  getTotalQuantite(commande: Commande): number {
    if (!commande.items) return 0;
    return commande.items.reduce((sum, item) => sum + item.quantite, 0);
  }
}
