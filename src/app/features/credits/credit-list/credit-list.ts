import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CreditService } from '../../../core/services/credit.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-credit-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './credit-list.html',
  styleUrl: './credit-list.css',
})
export class CreditListComponent {
  private readonly creditService = inject(CreditService);
  private readonly authService = inject(AuthService);

  loading = this.creditService.loading;
  loadError = this.creditService.loadError;
  isClient = computed(() => this.authService.role() === 'client');

  credits = computed(() => {
    const all = this.creditService.credits();
    const user = this.authService.currentUser();
    return this.isClient() ? all.filter((c) => c.clientId === user?.clientId) : all;
  });

  constructor() {
    this.creditService.loadAll();
  }
}