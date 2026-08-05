export type AlerteType = 'info' | 'succes' | 'avertissement' | 'danger';

export interface Alerte {
  id: string;
  userId: string;
  titre: string;
  message: string;
  type: AlerteType;
  date: string;
  lue: boolean;
  lien?: string;
}