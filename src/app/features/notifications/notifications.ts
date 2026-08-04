import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CompteService } from '../../core/services/compte.service';
import { CreditService } from '../../core/services/credit.service';
import { TransactionService } from '../../core/services/transaction.service';
import { AuthService } from '../../core/services/auth.service';

type AlerteType = 'solde_bas' | 'echeance' | 'operation';

interface Alerte {
  id: string;
  type: AlerteType;
  titre: string;
  message: string;
  date: string;
}

const SOLDE_BAS_SEUIL = 20000;
const ECHEANCE_JOURS = 7;

@Component({
  selector: 'app-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class NotificationsComponent {
  private readonly compteService = inject(CompteService);
  private readonly creditService = inject(CreditService);
  private readonly transactionService = inject(TransactionService);
  private readonly authService = inject(AuthService);

  private isClient = computed(() => this.authService.role() === 'client');

  private ownComptesIds = computed(() => {
    const user = this.authService.currentUser();
    return this.compteService.comptes().filter((c) => c.clientId === user?.clientId).map((c) => c.id);
  });

  private scopedComptes = computed(() => {
    const all = this.compteService.comptes();
    return this.isClient() ? all.filter((c) => this.ownComptesIds().includes(c.id)) : all;
  });

  alertes = computed<Alerte[]>(() => {
    const alertes: Alerte[] = [];
    const now = new Date();

    for (const compte of this.scopedComptes()) {
      if (compte.solde < SOLDE_BAS_SEUIL) {
        alertes.push({
          id: `solde-${compte.id}`,
          type: 'solde_bas',
          titre: 'Solde bas',
          message: `Le compte ${compte.numero} a un solde inférieur à ${SOLDE_BAS_SEUIL.toLocaleString()} FCFA.`,
          date: now.toISOString(),
        });
      }
    }

    const echeanceLimite = new Date(now);
    echeanceLimite.setDate(echeanceLimite.getDate() + ECHEANCE_JOURS);

    for (const echeance of this.creditService.echeances()) {
      if (echeance.payee) continue;
      const credit = this.creditService.credits().find((c) => c.id === echeance.creditId);
      if (!credit) continue;
      if (this.isClient() && credit.clientId !== this.authService.currentUser()?.clientId) continue;

      const dateEcheance = new Date(echeance.dateEcheance);
      if (dateEcheance <= echeanceLimite && dateEcheance >= now) {
        alertes.push({
          id: `echeance-${echeance.id}`,
          type: 'echeance',
          titre: 'Échéance de crédit proche',
          message: `L'échéance n°${echeance.numero} (${echeance.montant.toLocaleString()} FCFA) arrive le ${dateEcheance.toLocaleDateString('fr-FR')}.`,
          date: echeance.dateEcheance,
        });
      }
    }

    const comptesIds = this.scopedComptes().map((c) => c.id);
    const recentes = this.transactionService.transactions().filter((t) => comptesIds.includes(t.compteId)).slice(0, 5);

    for (const t of recentes) {
      alertes.push({
        id: `operation-${t.id}`,
        type: 'operation',
        titre: 'Opération réussie',
        message: `${t.type === 'depot' ? 'Dépôt' : t.type === 'retrait' ? 'Retrait' : 'Virement'} de ${t.montant.toLocaleString()} FCFA effectué avec succès.`,
        date: t.date,
      });
    }

    return alertes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  constructor() {
    this.compteService.loadAll();
    this.creditService.loadAll();
    this.creditService.loadEcheances();
    this.transactionService.loadAll();
  }
}