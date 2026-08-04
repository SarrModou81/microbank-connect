import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { CompteService } from '../../../core/services/compte.service';
import { Client } from '../../../core/models/client.model';

@Component({
  selector: 'app-client-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './client-detail.html',
  styleUrl: './client-detail.css',
})
export class ClientDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly clientService = inject(ClientService);
  private readonly compteService = inject(CompteService);

  private readonly clientId = this.route.snapshot.paramMap.get('id')!;

  client = signal<Client | null>(null);
  loading = signal(true);

  comptes = computed(() => this.compteService.comptes().filter((c) => c.clientId === this.clientId));

  constructor() {
    this.clientService.getById(this.clientId).subscribe({
      next: (client) => {
        this.client.set(client);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.compteService.loadAll();
  }
}