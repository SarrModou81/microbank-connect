export type UserRole = 'client' | 'agent' | 'gestionnaire';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  clientId?: string;
  mustChangePassword?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}