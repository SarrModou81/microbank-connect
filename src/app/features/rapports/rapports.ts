import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ClientService } from '../../core/services/client.service';
import { CompteService } from '../../core/services/compte.service';
import { CreditService } from '../../core/services/credit.service';
import { TransactionService } from '../../core/services/transaction.service';
import { BarChartComponent, BarChartItem } from '../../shared/components/bar-chart/bar-chart';
import { DonutChartComponent, DonutChartItem } from '../../shared/components/donut-chart/donut-chart';

@Component({
  selector: 'app-rapports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, BarChartComponent, DonutChartComponent],
  templateUrl: './rapports.html',
  styleUrl: './rapports.css',
})
export class RapportsComponent {
  private readonly clientService = inject(ClientService);
  private readonly compteService = inject(CompteService);
  private readonly creditService = inject(CreditService);
  private readonly transactionService = inject(TransactionService);

  constructor() {
    this.clientService.loadAll();
    this.compteService.loadAll();
    this.creditService.loadAll();
    this.transactionService.loadAll();
  }

  nombreClients = computed(() => this.clientService.clients().length);
  nombreComptes = computed(() => this.compteService.comptes().length);
  nombreComptesBloques = computed(() => this.compteService.comptes().filter((c) => c.statut === 'suspendu').length);
  encoursTotal = computed(() => this.compteService.comptes().reduce((sum, c) => sum + c.solde, 0));
  encoursCreditsApprouves = computed(() =>
    this.creditService.credits().filter((c) => c.statut === 'approuve').reduce((sum, c) => sum + c.montant, 0)
  );

  repartitionComptes = computed<DonutChartItem[]>(() => {
    const comptes = this.compteService.comptes();
    return [
      { label: 'Comptes courants', value: comptes.filter((c) => c.type === 'courant').length, color: 'var(--mbc-primary)' },
      { label: 'Comptes épargne', value: comptes.filter((c) => c.type === 'epargne').length, color: 'var(--mbc-accent)' },
    ];
  });

  repartitionStatutsComptes = computed<DonutChartItem[]>(() => {
    const comptes = this.compteService.comptes();
    return [
      { label: 'Actifs', value: comptes.filter((c) => c.statut === 'actif').length, color: 'var(--mbc-success)' },
      { label: 'Bloqués', value: comptes.filter((c) => c.statut === 'suspendu').length, color: 'var(--mbc-danger)' },
      { label: 'Fermés', value: comptes.filter((c) => c.statut === 'ferme').length, color: 'var(--mbc-text-muted)' },
    ].filter((item) => item.value > 0);
  });

  volumeParTypeTransaction = computed<BarChartItem[]>(() => {
    const transactions = this.transactionService.transactions();
    const parType = (type: string) => transactions.filter((t) => t.type === type).reduce((sum, t) => sum + t.montant, 0);
    return [
      { label: 'Dépôts', value: parType('depot'), color: 'var(--mbc-success)' },
      { label: 'Retraits', value: parType('retrait'), color: 'var(--mbc-warning)' },
      { label: 'Virements', value: parType('virement'), color: 'var(--mbc-info)' },
    ];
  });

  creditsParStatut = computed<BarChartItem[]>(() => {
    const credits = this.creditService.credits();
    const parStatut = (statut: string) => credits.filter((c) => c.statut === statut).length;
    return [
      { label: 'En attente', value: parStatut('en_attente'), color: 'var(--mbc-warning)' },
      { label: 'Approuvés', value: parStatut('approuve'), color: 'var(--mbc-success)' },
      { label: 'Rejetés', value: parStatut('rejete'), color: 'var(--mbc-danger)' },
      { label: 'Soldés', value: parStatut('solde'), color: 'var(--mbc-gold)' },
    ];
  });

  topClients = computed(() => {
    const comptes = this.compteService.comptes();
    return this.clientService
      .clients()
      .map((client) => ({
        client,
        soldeTotal: comptes.filter((c) => c.clientId === client.id).reduce((sum, c) => sum + c.solde, 0),
        nombreComptes: comptes.filter((c) => c.clientId === client.id).length,
      }))
      .filter((entry) => entry.nombreComptes > 0)
      .sort((a, b) => b.soldeTotal - a.soldeTotal)
      .slice(0, 5);
  });
}