import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role-guard';

export const OPERATIONS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./operation-history/operation-history').then((m) => m.OperationHistoryComponent), data: { title: 'Opérations' } },
  {
    path: 'nouvelle',
    canActivate: [roleGuard(['agent', 'gestionnaire'])],
    loadComponent: () => import('./operation-form/operation-form').then((m) => m.OperationFormComponent),
    data: { title: 'Nouvelle opération' },
  },
];