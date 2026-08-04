import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CompteService } from '../../../core/services/compte.service';
import { ClientService } from '../../../core/services/client.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { Compte } from '../../../core/models/compte.model';
import { Client } from '../../../core/models/client.model';

@Component({
  selector: 'app-compte-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, DatePipe, RouterLink],
  templateUrl: './compte-detail.html',
  styleUrl: './compte-detail.css',
})
export class CompteDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly compteService = inject(CompteService);
  private readonly clientService = inject(ClientService);
  private readonly transactionService = inject(TransactionService);

  private readonly compteId = this.route.snapshot.paramMap.get('id')!;

  compte = signal<Compte | null>(null);
  client = signal<Client | null>(null);
  loading = signal(true);

  transactions = computed(() =>
    this.transactionService
      .transactions()
      .filter((t) => t.compteId === this.compteId || t.compteDestinataireId === this.compteId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  );

  constructor() {
    this.compteService.getById(this.compteId).subscribe({
      next: (compte) => {
        this.compte.set(compte);
        this.loading.set(false);
        this.clientService.getById(compte.clientId).subscribe((client) => this.client.set(client));
      },
      error: () => this.loading.set(false),
    });
    this.transactionService.loadAll();
  }
}