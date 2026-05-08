import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StockChangeTrackerService {
  private previousQuantities: Map<number, number> = new Map();
  private isInitialized = false;
  // Stocker les changements de manière persistante
  private persistentChanges: Map<number, { value: number; type: 'increase' | 'decrease' }> = new Map();

  initializeQuantities(stocks: any[]): void {
    if (!this.isInitialized) {
      stocks.forEach(stock => {
        this.previousQuantities.set(stock.id, stock.quantite || 0);
      });
      this.isInitialized = true;
    }
  }

  detectChanges(newStocks: any[]): Map<number, { value: number; type: 'increase' | 'decrease' }> {
    const newChanges = new Map<number, { value: number; type: 'increase' | 'decrease' }>();

    newStocks.forEach(stock => {
      const stockId = stock.id;
      const newQuantite = stock.quantite || 0;
      const previousQuantite = this.previousQuantities.get(stockId);

      if (previousQuantite !== undefined && previousQuantite !== newQuantite) {
        const difference = newQuantite - previousQuantite;
        if (difference !== 0) {
          const change = {
            value: Math.abs(difference),
            type: difference > 0 ? 'increase' : 'decrease' as 'increase' | 'decrease'
          };
          
          // Ajouter le changement aux changements persistants
          this.persistentChanges.set(stockId, change);
          newChanges.set(stockId, change);
        }
      }

      // Mettre à jour la quantité précédente
      this.previousQuantities.set(stockId, newQuantite);
    });

    return newChanges;
  }

  // Récupérer tous les changements persistants
  getAllChanges(): Map<number, { value: number; type: 'increase' | 'decrease' }> {
    return new Map(this.persistentChanges);
  }

  // Supprimer un changement spécifique (optionnel, pour nettoyer si nécessaire)
  removeChange(stockId: number): void {
    this.persistentChanges.delete(stockId);
  }

  reset(): void {
    this.previousQuantities.clear();
    this.persistentChanges.clear();
    this.isInitialized = false;
  }
}

