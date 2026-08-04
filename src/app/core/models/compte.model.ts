export type TypeCompte = 'courant' | 'epargne';
export type StatutCompte = 'actif' | 'suspendu' | 'ferme';

export interface Compte {
  id: string;
  numero: string;
  clientId: string;
  type: TypeCompte;
  solde: number;
  plafondRetrait: number;
  statut: StatutCompte;
  dateOuverture: string;
}