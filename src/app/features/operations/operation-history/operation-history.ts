import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';
import { CompteService } from '../../../core/services/compte.service';
import { AuthService } from '../../../core/services/auth.service';
import { TypeTransaction } from '../../../core/models/transaction.model';

@Component({
  selector: 'app-operation-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './operation-history.html',
  styleUrl: './operation-history.css',
})
export class OperationHistoryComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly compteService = inject(CompteService);
  private readonly authService = inject(AuthService);

  loading = this.transactionService.loading;
  loadError = this.transactionService.loadError;
  typeFilter = signal<TypeTransaction | 'tous'>('tous');

  isClient = computed(() => this.authService.role() === 'client');

  private ownComptesIds = computed(() => {
    const user = this.authService.currentUser();
    return this.compteService.comptes().filter((c) => c.clientId === user?.clientId).map((c) => c.id);
  });

  transactions = computed(() => {
    const all = this.transactionService.transactions();
    const scoped = this.isClient()
      ? all.filter(
          (t) =>
            this.ownComptesIds().includes(t.compteId) ||
            (!!t.compteDestinataireId && this.ownComptesIds().includes(t.compteDestinataireId))
        )
      : all;

    const type = this.typeFilter();
    const filtered = type === 'tous' ? scoped : scoped.filter((t) => t.type === type);
    return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  constructor() {
    this.transactionService.loadAll();
    this.compteService.loadAll();
  }

  setTypeFilter(type: TypeTransaction | 'tous'): void {
    this.typeFilter.set(type);
  }

  compteNumero(compteId: string): string {
    return this.compteService.comptes().find((c) => c.id === compteId)?.numero ?? compteId;
  }

  exportCsv(): void {
    const rows = this.transactions().map((t) => [
      t.date,
      t.type,
      this.compteNumero(t.compteId),
      t.compteDestinataireId ? this.compteNumero(t.compteDestinataireId) : '',
      t.montant.toString(),
      t.statut,
      t.description ?? '',
    ]);
    const header = ['Date', 'Type', 'Compte', 'Compte destinataire', 'Montant', 'Statut', 'Description'];
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(';')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `releve-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}