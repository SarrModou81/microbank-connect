export type TypeTransaction = 'depot' | 'retrait' | 'virement';
export type StatutTransaction = 'reussie' | 'echouee' | 'en_attente';

export interface Transaction {
  id: string;
  compteId: string;
  compteDestinataireId?: string;
  type: TypeTransaction;
  montant: number;
  date: string;
  statut: StatutTransaction;
  description?: string;
}