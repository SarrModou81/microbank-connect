import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role-guard';
import { guestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/shell/shell').then((m) => m.ShellComponent),
    canActivate: [roleGuard()],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
        data: { title: 'Tableau de bord' },
      },
      {
        path: 'clients',
        canActivate: [roleGuard(['agent', 'gestionnaire'])],
        loadComponent: () =>
          import('./shared/components/feature-placeholder/feature-placeholder').then((m) => m.FeaturePlaceholderComponent),
        data: { title: 'Clients' },
      },
      {
        path: 'comptes',
        loadComponent: () =>
          import('./shared/components/feature-placeholder/feature-placeholder').then((m) => m.FeaturePlaceholderComponent),
        data: { title: 'Comptes' },
      },
      {
        path: 'operations',
        loadComponent: () =>
          import('./shared/components/feature-placeholder/feature-placeholder').then((m) => m.FeaturePlaceholderComponent),
        data: { title: 'Opérations' },
      },
      {
        path: 'credits',
        loadComponent: () =>
          import('./shared/components/feature-placeholder/feature-placeholder').then((m) => m.FeaturePlaceholderComponent),
        data: { title: 'Crédits' },
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./shared/components/feature-placeholder/feature-placeholder').then((m) => m.FeaturePlaceholderComponent),
        data: { title: 'Notifications' },
      },
      {
        path: 'rapports',
        canActivate: [roleGuard(['gestionnaire'])],
        loadComponent: () =>
          import('./shared/components/feature-placeholder/feature-placeholder').then((m) => m.FeaturePlaceholderComponent),
        data: { title: 'Rapports' },
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];