import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ClientService } from '../../core/services/client.service';
import { CompteService } from '../../core/services/compte.service';
import { CreditService } from '../../core/services/credit.service';
import { TransactionService } from '../../core/services/transaction.service';
import { RoleLabelPipe } from '../../shared/pipes/role-label-pipe';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, DatePipe, RouterLink, RoleLabelPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly clientService = inject(ClientService);
  private readonly compteService = inject(CompteService);
  private readonly creditService = inject(CreditService);
  private readonly transactionService = inject(TransactionService);

  currentUser = this.authService.currentUser;
  role = this.authService.role;
  isClient = computed(() => this.role() === 'client');
  isGestionnaire = computed(() => this.role() === 'gestionnaire');

  private ownComptes = computed(() => {
    const user = this.currentUser();
    return this.compteService.comptes().filter((c) => c.clientId === user?.clientId);
  });

  private ownCredits = computed(() => {
    const user = this.currentUser();
    return this.creditService.credits().filter((c) => c.clientId === user?.clientId);
  });

  // KPIs Client
  soldeTotal = computed(() => this.ownComptes().reduce((sum, c) => sum + c.solde, 0));
  nombreComptes = computed(() => this.ownComptes().length);
  creditsEnCours = computed(() => this.ownCredits().filter((c) => c.statut === 'approuve'));
  encoursCredits = computed(() => this.creditsEnCours().reduce((sum, c) => sum + c.mensualite * c.dureeMois, 0));

  // KPIs Agent / Gestionnaire
  nombreClients = computed(() => this.clientService.clients().length);
  nombreComptesTotal = computed(() => this.compteService.comptes().length);
  soldeGlobal = computed(() => this.compteService.comptes().reduce((sum, c) => sum + c.solde, 0));
  creditsEnAttente = computed(() => this.creditService.credits().filter((c) => c.statut === 'en_attente').length);
  encoursCreditsApprouves = computed(() =>
    this.creditService.credits().filter((c) => c.statut === 'approuve').reduce((sum, c) => sum + c.montant, 0)
  );

  dernieresOperations = computed(() => {
    const all = this.transactionService.transactions();
    const scoped = this.isClient()
      ? all.filter((t) => this.ownComptes().some((c) => c.id === t.compteId || c.id === t.compteDestinataireId))
      : all;
    return [...scoped].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  });

  constructor() {
    this.clientService.loadAll();
    this.compteService.loadAll();
    this.creditService.loadAll();
    this.transactionService.loadAll();
  }

  compteNumero(compteId: string): string {
    return this.compteService.comptes().find((c) => c.id === compteId)?.numero ?? compteId;
  }
}