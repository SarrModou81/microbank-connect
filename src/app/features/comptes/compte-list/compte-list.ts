import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CompteService } from '../../../core/services/compte.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-compte-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './compte-list.html',
  styleUrl: './compte-list.css',
})
export class CompteListComponent {
  private readonly compteService = inject(CompteService);
  private readonly authService = inject(AuthService);

  loading = this.compteService.loading;
  loadError = this.compteService.loadError;
  searchTerm = signal('');

  isClient = computed(() => this.authService.role() === 'client');

  comptes = computed(() => {
    const all = this.compteService.comptes();
    const user = this.authService.currentUser();
    const scoped = this.isClient() && user?.clientId ? all.filter((c) => c.clientId === user.clientId) : all;

    const term = this.searchTerm().trim().toLowerCase();
    return term ? scoped.filter((c) => c.numero.toLowerCase().includes(term)) : scoped;
  });

  constructor() {
    this.compteService.loadAll();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }
}