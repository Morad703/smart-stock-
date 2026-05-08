import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandeService } from '../../../shared/services/commande.service';
import { FournisseurService } from '../../../shared/services/fournisseur.service';
import { ProduitService } from '../../../shared/services/produit.service';
import { AlertService } from '../../../shared/services/alert.service';
import { Commande, CommandeItem, CommandeStatus } from '../../../shared/models/commande.model';

@Component({
  selector: 'app-commande-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './commande-form.component.html',
  styleUrls: ['./commande-form.component.css']
})
export class CommandeFormComponent implements OnInit {
  fournisseurs: any[] = [];
  produitsDisponibles: any[] = [];
  produitsSelectionnes: CommandeItem[] = [];
  CommandeStatus = CommandeStatus; // Exposer pour le template
  
  commande: Commande = {
    status: CommandeStatus.EN_ATTENTE,
    items: [],
    fournisseurId: undefined
  };

  formErrors: any = {};

  constructor(
    private commandeService: CommandeService,
    private fournisseurService: FournisseurService,
    private produitService: ProduitService,
    public router: Router,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadFournisseurs();
    // Initialiser avec un item vide pour faciliter l'ajout
    this.produitsSelectionnes = [{ produitId: 0, quantite: 0 }];
  }

  loadFournisseurs() {
    this.fournisseurService.getAllFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des fournisseurs:', err);
        this.alertService.error('Impossible de charger les fournisseurs', 'Erreur');
      }
    });
  }

  onFournisseurChange() {
    // Convertir en number car le select peut retourner une string
    const fournisseurId = this.commande.fournisseurId ? Number(this.commande.fournisseurId) : null;
    
    if (fournisseurId && !isNaN(fournisseurId)) {
      this.commande.fournisseurId = fournisseurId;
      this.loadProduitsByFournisseur(fournisseurId);
      // Réinitialiser les produits sélectionnés
      this.produitsSelectionnes = [{ produitId: 0, quantite: 0 }];
    } else {
      this.produitsDisponibles = [];
      this.produitsSelectionnes = [{ produitId: 0, quantite: 0 }];
      this.commande.fournisseurId = undefined;
    }
    this.cdr.detectChanges();
  }

  loadProduitsByFournisseur(fournisseurId: number) {
    this.produitService.getAll().subscribe({
      next: (produits) => {
        // Filtrer les produits par fournisseur (comparaison avec conversion de type)
        this.produitsDisponibles = produits.filter(p => {
          const pFournisseurId = p.fournisseur_id ? Number(p.fournisseur_id) : null;
          return pFournisseurId === fournisseurId;
        });
        console.log(`Fournisseur sélectionné: ${fournisseurId}`);
        console.log(`Produits trouvés: ${this.produitsDisponibles.length}`);
        if (this.produitsDisponibles.length > 0) {
          console.log('Produits disponibles:', this.produitsDisponibles.map(p => p.designation));
        } else {
          console.log('Aucun produit trouvé. Tous les produits:', produits.map(p => ({ 
            id: p.id, 
            designation: p.designation,
            fournisseur_id: p.fournisseur_id, 
            type: typeof p.fournisseur_id 
          })));
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des produits:', err);
        this.alertService.error('Impossible de charger les produits', 'Erreur');
      }
    });
  }

  addProduit() {
    // Toujours permettre d'ajouter un nouveau produit (même si le dernier n'est pas rempli)
    this.produitsSelectionnes.push({ produitId: 0, quantite: 0 });
    this.cdr.detectChanges();
  }

  removeProduit(index: number) {
    if (this.produitsSelectionnes.length > 1) {
      this.produitsSelectionnes.splice(index, 1);
    } else {
      // Si c'est le dernier, le réinitialiser au lieu de le supprimer
      this.produitsSelectionnes[0] = { produitId: 0, quantite: 0 };
    }
    this.cdr.detectChanges();
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.commande.fournisseurId) {
      this.formErrors.fournisseurId = 'Veuillez sélectionner un fournisseur';
    }

    // Filtrer les items valides (produitId > 0 et quantite > 0)
    const itemsValides = this.produitsSelectionnes.filter(
      item => item.produitId > 0 && item.quantite > 0
    );

    if (itemsValides.length === 0) {
      this.formErrors.items = 'Veuillez ajouter au moins un produit avec une quantité valide';
    }

    // Permettre plusieurs fois le même produit (suppression de la validation de doublons)

    // Vérifier les quantités
    for (let i = 0; i < itemsValides.length; i++) {
      if (itemsValides[i].quantite <= 0) {
        this.formErrors.items = 'Les quantités doivent être supérieures à 0';
        break;
      }
    }

    return Object.keys(this.formErrors).length === 0;
  }


  save(form?: NgForm) {
    if (!this.validateForm()) {
      const firstError = Object.values(this.formErrors)[0];
      this.alertService.warning(firstError as string, 'Formulaire invalide');
      return;
    }

    // Filtrer les items valides
    this.commande.items = this.produitsSelectionnes.filter(
      item => item.produitId > 0 && item.quantite > 0
    );

    // Définir la date actuelle au format YYYY-MM-DD pour le backend
    const today = new Date();
    this.commande.dateCommande = today.toISOString().split('T')[0];

    // Générer la référence si elle n'existe pas
    if (!this.commande.reference) {
      // Récupérer toutes les commandes pour trouver le dernier numéro
      this.commandeService.getAll().subscribe({
        next: (commandes) => {
          let maxNum = 0;
          commandes.forEach(c => {
            if (c.reference && c.reference.startsWith('CMD')) {
              const num = parseInt(c.reference.replace('CMD', ''), 10);
              if (!isNaN(num) && num > maxNum) {
                maxNum = num;
              }
            }
          });
          const nextNum = maxNum + 1;
          this.commande.reference = `CMD${String(nextNum).padStart(2, '0')}`;
          this.createCommande();
        },
        error: () => {
          // En cas d'erreur, utiliser une référence par défaut
          this.commande.reference = 'CMD01';
          this.createCommande();
        }
      });
    } else {
      this.createCommande();
    }
  }

  private createCommande() {
    this.commandeService.create(this.commande).subscribe({
      next: () => {
        this.alertService.success('Commande créée avec succès !');
        setTimeout(() => {
          this.router.navigate(['/commandes']);
        }, 1000);
      },
      error: (err) => {
        console.error('Erreur lors de la création:', err);
        const errorMessage = err.error?.message || err.message || 'Une erreur est survenue lors de la création de la commande';
        this.alertService.error(errorMessage, 'Erreur');
      }
    });
  }

  getProduitNom(produitId: number): string {
    if (!produitId || produitId === 0) return '-- Sélectionner --';
    const produit = this.produitsDisponibles.find(p => p.id === produitId);
    return produit ? `${produit.designation} (${produit.reference || 'N/A'})` : 'Produit introuvable';
  }

  hasFormErrors(): boolean {
    return Object.keys(this.formErrors).length > 0;
  }

  // Constantes pour les valeurs d'enum dans le template (évite les problèmes avec les caractères spéciaux)
  readonly STATUS_EN_ATTENTE = CommandeStatus.EN_ATTENTE;
  readonly STATUS_ANNULÉE = CommandeStatus.ANNULÉE;
  readonly STATUS_REÇUE = CommandeStatus.REÇUE;
}
