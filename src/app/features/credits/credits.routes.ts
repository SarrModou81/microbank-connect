import { Routes } from '@angular/router';

export const CREDITS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./credit-list/credit-list').then((m) => m.CreditListComponent), data: { title: 'Crédits' } },
  { path: 'simulateur', loadComponent: () => import('./credit-simulator/credit-simulator').then((m) => m.CreditSimulatorComponent), data: { title: 'Simulation de crédit' } },
  { path: 'nouvelle', loadComponent: () => import('./credit-request/credit-request').then((m) => m.CreditRequestComponent), data: { title: 'Demande de crédit' } },
  { path: ':id', loadComponent: () => import('./credit-tracking/credit-tracking').then((m) => m.CreditTrackingComponent), data: { title: 'Suivi du crédit' } },
];