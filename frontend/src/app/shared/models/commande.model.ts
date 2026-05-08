export interface CommandeItem {
  id?: number;
  produitId: number;
  quantite: number;
}

export enum CommandeStatus {
  EN_ATTENTE = 'EN_ATTENTE',
  ANNULÉE = 'ANNULÉE',
  REÇUE = 'REÇUE'
}

export interface Commande {
  id?: number;
  reference?: string;
  dateCommande?: string;
  status: CommandeStatus;
  items: CommandeItem[];
  fournisseurId?: number;
}
