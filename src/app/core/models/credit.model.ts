export type StatutCredit = 'simule' | 'en_attente' | 'approuve' | 'rejete' | 'solde';

export interface Credit {
  id: string;
  clientId: string;
  montant: number;
  tauxAnnuel: number;
  dureeMois: number;
  statut: StatutCredit;
  dateCreation: string;
  mensualite: number;
}

export interface Echeance {
  id: string;
  creditId: string;
  numero: number;
  dateEcheance: string;
  montant: number;
  payee: boolean;
}