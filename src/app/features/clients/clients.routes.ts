import { Routes } from '@angular/router';

export const CLIENTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./client-list/client-list').then((m) => m.ClientListComponent), data: { title: 'Clients' } },
  { path: 'nouveau', loadComponent: () => import('./client-form/client-form').then((m) => m.ClientFormComponent), data: { title: 'Nouveau client' } },
  { path: ':id', loadComponent: () => import('./client-detail/client-detail').then((m) => m.ClientDetailComponent), data: { title: 'Fiche client' } },
  { path: ':id/modifier', loadComponent: () => import('./client-form/client-form').then((m) => m.ClientFormComponent), data: { title: 'Modifier client' } },
];