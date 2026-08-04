import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role-guard';

export const COMPTES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./compte-list/compte-list').then((m) => m.CompteListComponent), data: { title: 'Comptes' } },
  {
    path: 'nouveau',
    canActivate: [roleGuard(['agent', 'gestionnaire'])],
    loadComponent: () => import('./compte-form/compte-form').then((m) => m.CompteFormComponent),
    data: { title: 'Nouveau compte' },
  },
  { path: ':id', loadComponent: () => import('./compte-detail/compte-detail').then((m) => m.CompteDetailComponent), data: { title: 'Détail du compte' } },
];