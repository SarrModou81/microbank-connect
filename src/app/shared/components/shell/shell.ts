import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { UserRole } from '../../../core/models/user.model';
import { Alerte } from '../../../core/models/alert.model';
import { RoleLabelPipe } from '../../pipes/role-label-pipe';
import { interval, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', path: '/dashboard', icon: 'fa-solid fa-gauge-high', roles: ['client', 'agent', 'gestionnaire'] },
  { label: 'Clients', path: '/clients', icon: 'fa-solid fa-users', roles: ['agent', 'gestionnaire'] },
  { label: 'Comptes', path: '/comptes', icon: 'fa-solid fa-wallet', roles: ['client', 'agent', 'gestionnaire'] },
  { label: 'Opérations', path: '/operations', icon: 'fa-solid fa-right-left', roles: ['client', 'agent', 'gestionnaire'] },
  { label: 'Crédits', path: '/credits', icon: 'fa-solid fa-hand-holding-dollar', roles: ['client', 'agent', 'gestionnaire'] },
  { label: 'Notifications', path: '/notifications', icon: 'fa-solid fa-bell', roles: ['client', 'agent', 'gestionnaire'] },
  { label: 'Rapports', path: '/rapports', icon: 'fa-solid fa-chart-line', roles: ['gestionnaire'] },
];

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, RoleLabelPipe],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class ShellComponent {
  private readonly authService = inject(AuthService);
  private readonly alertService = inject(AlertService);

  sidebarOpen = signal(false);
  profileMenuOpen = signal(false);
  notifMenuOpen = signal(false);
  showLogoutConfirm = signal(false);

  currentUser = this.authService.currentUser;
  role = this.authService.role;

  notifBadgeCount = this.alertService.nonLues;
  recentAlertes = computed(() => this.alertService.alertes().slice(0, 6));

  visibleNavItems = computed(() => {
    const role = this.role();
    if (!role) return [];
    return NAV_ITEMS.filter((item) => item.roles.includes(role));
  });

 constructor() {
  interval(10000)
    .pipe(startWith(0), takeUntilDestroyed())
    .subscribe(() => this.alertService.loadMine());
}

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen.update((open) => !open);
    this.notifMenuOpen.set(false);
  }

  closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  toggleNotifMenu(): void {
    this.notifMenuOpen.update((open) => !open);
    this.profileMenuOpen.set(false);
  }

  closeNotifMenu(): void {
    this.notifMenuOpen.set(false);
  }

  openAlerte(alerte: Alerte): void {
    if (!alerte.lue) {
      this.alertService.marquerLue(alerte.id);
    }
    this.closeNotifMenu();
  }

  marquerToutesLues(): void {
    this.alertService.marquerToutesLues();
  }

  requestLogout(): void {
    this.closeProfileMenu();
    this.showLogoutConfirm.set(true);
  }

  cancelLogout(): void {
    this.showLogoutConfirm.set(false);
  }

  confirmLogout(): void {
    this.showLogoutConfirm.set(false);
    this.authService.logout();
  }
}