import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CreditService } from '../../../core/services/credit.service';
import { ClientService } from '../../../core/services/client.service';
import { CompteService } from '../../../core/services/compte.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-credit-request',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DecimalPipe, RouterLink],
  templateUrl: './credit-request.html',
  styleUrl: './credit-request.css',
})
export class CreditRequestComponent {
  private readonly fb = inject(FormBuilder);
  private readonly creditService = inject(CreditService);
  private readonly clientService = inject(ClientService);
  private readonly compteService = inject(CompteService);
  private readonly authService = inject(AuthService);
  private readonly alertService = inject(AlertService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isClient = computed(() => this.authService.role() === 'client');
  clients = this.clientService.clients;
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  private readonly qp = this.route.snapshot.queryParamMap;

  readonly form = this.fb.nonNullable.group({
    clientId: [this.authService.currentUser()?.clientId ?? '', Validators.required],
    montant: [Number(this.qp.get('montant')) || 500000, [Validators.required, Validators.min(10000)]],
    tauxAnnuel: [Number(this.qp.get('tauxAnnuel')) || 12, [Validators.required, Validators.min(0)]],
    dureeMois: [Number(this.qp.get('dureeMois')) || 12, [Validators.required, Validators.min(1), Validators.max(60)]],
  });

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  mensualite = computed(() => {
    const { montant, tauxAnnuel, dureeMois } = this.formValue();
    if (!montant || !dureeMois) return 0;
    return this.creditService.simulerMensualite(montant, tauxAnnuel ?? 0, dureeMois);
  });

  clientABloque = computed(() => {
    const clientId = this.formValue().clientId;
    if (!clientId) return false;
    return this.compteService.comptes().some((c) => c.clientId === clientId && c.statut === 'suspendu');
  });

  constructor() {
    if (!this.isClient()) {
      this.clientService.loadAll();
    }
    this.compteService.loadAll();
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { clientId, montant, tauxAnnuel, dureeMois } = this.form.getRawValue();

    if (this.clientABloque()) {
      this.errorMessage.set('Ce client a un compte bloqué : aucune nouvelle demande de crédit ne peut être soumise.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.creditService.demander(clientId, montant, tauxAnnuel, dureeMois).subscribe({
      next: (credit) => {
        if (this.isClient()) {
          this.clientService.getById(clientId).subscribe((client) => {
            this.alertService
              .notifierUtilisateur(
                client.agentId,
                'Nouvelle demande de crédit',
                `${client.prenom} ${client.nom} a demandé un crédit de ${montant.toLocaleString()} FCFA.`,
                'info',
                `/credits/${credit.id}`
              )
              .subscribe();
            this.alertService.notifierGestionnaires(
              'Nouvelle demande de crédit',
              `${client.prenom} ${client.nom} a demandé un crédit de ${montant.toLocaleString()} FCFA.`,
              'info',
              `/credits/${credit.id}`
            );
          });
        }
        this.router.navigate(['/credits', credit.id]);
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Une erreur est survenue lors de la demande.');
      },
    });
  }
}