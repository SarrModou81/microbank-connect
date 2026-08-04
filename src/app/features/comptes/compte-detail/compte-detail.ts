import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CompteService } from '../../../core/services/compte.service';
import { ClientService } from '../../../core/services/client.service';
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

  private readonly compteId = this.route.snapshot.paramMap.get('id')!;

  compte = signal<Compte | null>(null);
  client = signal<Client | null>(null);
  loading = signal(true);

  constructor() {
    this.compteService.getById(this.compteId).subscribe({
      next: (compte) => {
        this.compte.set(compte);
        this.loading.set(false);
        this.clientService.getById(compte.clientId).subscribe((client) => this.client.set(client));
      },
      error: () => this.loading.set(false),
    });
  }
}