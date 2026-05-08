export interface Produit {
  id?: number;               // optionnel pour un nouveau produit
  designation: string;
  description: string;
  prix: number;
  categorie: string;
  reference: string;
  fournisseur_id: number | null;
}
