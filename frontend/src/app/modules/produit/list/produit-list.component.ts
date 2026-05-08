import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProduitService } from '../../../shared/services/produit.service';

@Component({
  selector: 'app-produit-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './produit-list.component.html',
  styleUrls: ['./produit-list.component.css']
})
export class ProduitListComponent implements OnInit {

  produits: any[] = [];
  filteredProduits: any[] = [];
  searchTerm: string = '';
  selectedCategorie: string = '';

  /** 🔥 MODAL */
  showModal = false;
  produitToDelete: any = null;

  constructor(
    private produitService: ProduitService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProduits();
  }

  loadProduits() {
    this.produitService.getAll().subscribe({
      next: (data) => {
        this.produits = data;
        this.filteredProduits = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Erreur:", err)
    });
  }

  refresh() {
    this.loadProduits();
  }

  filterProduits() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProduits = this.produits.filter(p => {
      // Filtre par recherche textuelle
      const matchesSearch = !term || 
        p.designation.toLowerCase().includes(term) ||
        (p.categorie && p.categorie.toLowerCase().includes(term)) ||
        (p.reference && p.reference.toLowerCase().includes(term));
      
      // Filtre par catégorie
      const matchesCategorie = !this.selectedCategorie || 
        (p.categorie && p.categorie === this.selectedCategorie);
      
      return matchesSearch && matchesCategorie;
    });
  }

  goToAdd() {
    this.router.navigate(['/produits/nouveau']);
  }

  showDetails(id: number) {
    this.router.navigate(['/produits/details', id]);
  }

  /** 🔥 OUVRIR LA MODAL */
  openDeleteModal(p: any) {
    this.produitToDelete = p;
    this.showModal = true;
  }

  /** ❌ ANNULER */
  cancelDelete() {
    this.showModal = false;
    this.produitToDelete = null;
  }

  /** ✔ SUPPRESSION CONFIRMÉE */
  confirmDelete() {
    if (!this.produitToDelete) return;

    this.produitService.delete(this.produitToDelete.id).subscribe(() => {
      this.refresh();
      this.showModal = false;
      this.produitToDelete = null;
    });
  }
}
