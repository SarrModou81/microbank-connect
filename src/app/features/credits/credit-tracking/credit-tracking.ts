import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CreditService } from '../../../core/services/credit.service';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Credit } from '../../../core/models/credit.model';
import { Client } from '../../../core/models/client.model';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-credit-tracking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './credit-tracking.html',
  styleUrl: './credit-tracking.css',
})
export class CreditTrackingComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly creditService = inject(CreditService);
  private readonly clientService = inject(ClientService);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly alertService = inject(AlertService);

  private readonly creditId = this.route.snapshot.paramMap.get('id')!;

  credit = signal<Credit | null>(null);
  client = signal<Client | null>(null);
  loading = signal(true);
  processing = signal(false);

  canManage = computed(() => ['agent', 'gestionnaire'].includes(this.authService.role() ?? ''));
  echeances = computed(() => this.creditService.echeances().filter((e) => e.creditId === this.creditId));
  totalPaye = computed(() => this.echeances().filter((e) => e.payee).length);

  constructor() {
    this.creditService.getById(this.creditId).subscribe({
      next: (credit) => {
        this.credit.set(credit);
        this.loading.set(false);
        this.clientService.getById(credit.clientId).subscribe((client) => this.client.set(client));
      },
      error: () => this.loading.set(false),
    });
    this.creditService.loadEcheances();
  }

  approuver(): void {
    this.changerStatut('approuve');
  }

  rejeter(): void {
    this.changerStatut('rejete');
  }

  private changerStatut(statut: 'approuve' | 'rejete'): void {
  this.processing.set(true);
  this.creditService.changerStatut(this.creditId, statut).subscribe({
    next: (credit) => {
      this.credit.set(credit);
      this.processing.set(false);
      this.notifications.success(statut === 'approuve' ? 'Crédit approuvé, échéancier généré.' : 'Crédit rejeté.');
      this.alertService.notifierClient(
        credit.clientId,
        statut === 'approuve' ? 'Crédit approuvé' : 'Crédit rejeté',
        `Votre demande de crédit de ${credit.montant.toLocaleString()} FCFA a été ${statut === 'approuve' ? 'approuvée' : 'rejetée'}.`,
        statut === 'approuve' ? 'succes' : 'danger',
        `/credits/${credit.id}`
      );
    },
    error: () => this.processing.set(false),
  });
}

  payerEcheance(echeanceId: string): void {
    this.creditService.payerEcheance(echeanceId).subscribe();
  }
}