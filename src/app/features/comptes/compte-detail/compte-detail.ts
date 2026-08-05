import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CompteService } from '../../../core/services/compte.service';
import { ClientService } from '../../../core/services/client.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AlertService } from '../../../core/services/alert.service';
import { Compte, StatutCompte } from '../../../core/models/compte.model';
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
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly alertService = inject(AlertService);

  private readonly compteId = this.route.snapshot.paramMap.get('id')!;

  compte = signal<Compte | null>(null);
  client = signal<Client | null>(null);
  loading = signal(true);
  blocking = signal(false);

  canManage = computed(() => ['agent', 'gestionnaire'].includes(this.authService.role() ?? ''));

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

  toggleBlocage(): void {
    const cpt = this.compte();
    if (!cpt) return;

    const nouveauStatut: StatutCompte = cpt.statut === 'suspendu' ? 'actif' : 'suspendu';
    console.log('[compte-detail] bascule statut vers', nouveauStatut, 'pour le client', cpt.clientId);

    this.blocking.set(true);
    this.compteService.updateStatut(cpt.id, nouveauStatut).subscribe({
      next: (updated) => {
        this.compte.set(updated);
        this.blocking.set(false);
        const action = nouveauStatut === 'suspendu' ? 'bloqué' : 'débloqué';
        this.notifications.success(`Compte ${action}.`);

        this.alertService.notifierClient(
          updated.clientId,
          `Compte ${action}`,
          `Votre compte ${updated.numero} a été ${action} par un agent.`,
          nouveauStatut === 'suspendu' ? 'avertissement' : 'succes',
          `/comptes/${updated.id}`
        );
        this.alertService.notifierGestionnaires(
          `Compte ${action}`,
          `Le compte ${updated.numero} a été ${action}.`,
          'info',
          `/comptes/${updated.id}`
        );
      },
      error: (err) => {
        this.blocking.set(false);
        console.error('[compte-detail] echec de la mise a jour du statut:', err);
      },
    });
  }
}