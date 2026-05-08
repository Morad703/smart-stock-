import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FournisseurService } from '../../shared/services/fournisseur.service';
import { ProduitService } from '../../shared/services/produit.service';
import { StockService } from '../../shared/services/stock.service';
import { CommandeService } from '../../shared/services/commande.service';
import { forkJoin, of, timeout } from 'rxjs';
import { catchError, filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  // Statistiques principales
  stats = {
    fournisseurs: 0,
    produits: 0,
    commandes: 0,
    stocks: 0
  };

  // Analyses avancées
  analyses = {
    stockBas: 0,
    stockCritique: 0,
    stockTotal: 0,
    commandesEnAttente: 0,
    produitsParCategorie: {} as { [key: string]: number }
  };

  // Données brutes
  stocks: any[] = [];
  produits: any[] = [];
  commandes: any[] = [];
  fournisseurs: any[] = [];

  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private fournisseurService: FournisseurService,
    private produitService: ProduitService,
    private stockService: StockService,
    private commandeService: CommandeService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
    
    // Écouter les événements de navigation pour recharger les données quand on revient sur /home
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      filter((event: NavigationEnd) => event.url === '/home' || event.urlAfterRedirects === '/home'),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // Recharger les statistiques à chaque fois qu'on revient sur la page Home
      this.loadStatistics();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatistics(): void {
    console.log('🔄 Début du chargement des statistiques');
    this.isLoading = true;

    // Réinitialiser les données
    this.fournisseurs = [];
    this.produits = [];
    this.stocks = [];
    this.commandes = [];

    let completedRequests = 0;
    const totalRequests = 4;
    let safetyTimeout: any = null;

    const checkCompletion = () => {
      completedRequests++;
      console.log(`📊 Requêtes terminées: ${completedRequests}/${totalRequests}`);
      
      if (completedRequests >= totalRequests) {
        console.log('✅ Toutes les requêtes sont terminées');
        // Nettoyer le timeout de sécurité
        if (safetyTimeout) {
          clearTimeout(safetyTimeout);
          safetyTimeout = null;
        }
        this.calculateStats();
        this.calculateAnalyses();
        this.isLoading = false;
        // Forcer la détection de changement
        this.cdr.detectChanges();
        console.log('✅ Chargement terminé, isLoading:', this.isLoading);
      }
    };

    // Timeout de sécurité global
    safetyTimeout = setTimeout(() => {
      console.warn('⏰ Timeout de sécurité global déclenché après 5 secondes');
      if (this.isLoading) {
        console.warn('⚠️ Réinitialisation forcée du chargement');
        this.isLoading = false;
        this.calculateStats();
        this.calculateAnalyses();
        // Forcer la détection de changement
        this.cdr.detectChanges();
      }
      safetyTimeout = null;
    }, 5000);

    console.log('📡 Démarrage des requêtes API...');

    // Charger fournisseurs
    this.fournisseurService.getAllFournisseurs().pipe(
      timeout(4000),
      catchError((err) => {
        console.warn('❌ Erreur chargement fournisseurs:', err);
        return of([]);
      })
    ).subscribe({
      next: (data) => {
        console.log('✅ Fournisseurs chargés:', data?.length || 0);
        this.fournisseurs = data || [];
        checkCompletion();
      },
      error: () => {
        this.fournisseurs = [];
        checkCompletion();
      }
    });

    // Charger produits
    this.produitService.getAll().pipe(
      timeout(4000),
      catchError((err) => {
        console.warn('❌ Erreur chargement produits:', err);
        return of([]);
      })
    ).subscribe({
      next: (data) => {
        console.log('✅ Produits chargés:', data?.length || 0);
        this.produits = data || [];
        checkCompletion();
      },
      error: () => {
        this.produits = [];
        checkCompletion();
      }
    });

    // Charger stocks
    this.stockService.getAllStocks().pipe(
      timeout(4000),
      catchError((err) => {
        console.warn('❌ Erreur chargement stocks:', err);
        return of([]);
      })
    ).subscribe({
      next: (data) => {
        console.log('✅ Stocks chargés:', data?.length || 0);
        this.stocks = data || [];
        checkCompletion();
      },
      error: () => {
        this.stocks = [];
        checkCompletion();
      }
    });

    // Charger commandes
    this.commandeService.getAll().pipe(
      timeout(4000),
      catchError((err) => {
        console.warn('❌ Erreur chargement commandes:', err);
        return of([]);
      })
    ).subscribe({
      next: (data) => {
        console.log('✅ Commandes chargées:', data?.length || 0);
        this.commandes = data || [];
        checkCompletion();
      },
      error: () => {
        this.commandes = [];
        checkCompletion();
      }
    });
  }

  calculateStats(): void {
    this.stats.fournisseurs = this.fournisseurs.length;
    this.stats.produits = this.produits.length;
    this.stats.commandes = this.commandes.length;
    this.stats.stocks = this.stocks.length;
  }

  calculateAnalyses(): void {
    // Calcul des stocks bas et critiques
    this.analyses.stockBas = 0;
    this.analyses.stockCritique = 0;
    this.analyses.stockTotal = 0;

    if (this.stocks && this.stocks.length > 0) {
      this.stocks.forEach((stock: any) => {
        const quantite = stock.quantite || 0;
        const seuilCritique = stock.seuilCritique || 0;
        this.analyses.stockTotal += quantite;

        if (quantite === 0) {
          this.analyses.stockCritique++;
        } else if (quantite <= seuilCritique && quantite > 0) {
          this.analyses.stockBas++;
        }
      });
    }

    // Calcul des commandes en attente
    if (this.commandes && this.commandes.length > 0) {
      this.analyses.commandesEnAttente = this.commandes.filter(
        (cmd: any) => cmd.statut === 'EN_ATTENTE' || cmd.statut === 'En attente' || cmd.statut === 'EN_ATTENTE'
      ).length;
    } else {
      this.analyses.commandesEnAttente = 0;
    }

    // Calcul des produits par catégorie
    this.analyses.produitsParCategorie = {};
    if (this.produits && this.produits.length > 0) {
      this.produits.forEach((produit: any) => {
        const categorie = produit.categorie || 'Non catégorisé';
        this.analyses.produitsParCategorie[categorie] = 
          (this.analyses.produitsParCategorie[categorie] || 0) + 1;
      });
    }
  }

  getCategoriesArray(): { name: string; count: number }[] {
    return Object.entries(this.analyses.produitsParCategorie).map(([name, count]) => ({
      name,
      count: count as number
    }));
  }
}


