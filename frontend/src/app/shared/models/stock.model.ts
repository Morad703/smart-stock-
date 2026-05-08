export interface Stock {
  id?: number;
  produitId: number;
  quantite: number;
  seuilCritique: number;
  emplacement?: string;
}

