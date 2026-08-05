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
        loadChildren: () => import('./features/clients/clients.routes').then((m) => m.CLIENTS_ROUTES),
        },
        {
        path: 'comptes',
        loadChildren: () => import('./features/comptes/comptes.routes').then((m) => m.COMPTES_ROUTES),
        },
        {
        path: 'operations',
        loadChildren: () => import('./features/operations/operations.routes').then((m) => m.OPERATIONS_ROUTES),
        },
        {
        path: 'credits',
        loadChildren: () => import('./features/credits/credits.routes').then((m) => m.CREDITS_ROUTES),
        },
        {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications').then((m) => m.NotificationsComponent),
        data: { title: 'Notifications' },
        },
        {
        path: 'changer-mot-de-passe',
        loadComponent: () => import('./features/auth/change-password/change-password').then((m) => m.ChangePasswordComponent),
        data: { title: 'Changer le mot de passe' },
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