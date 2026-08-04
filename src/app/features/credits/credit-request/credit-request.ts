import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CreditService } from '../../../core/services/credit.service';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/services/auth.service';

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
  private readonly authService = inject(AuthService);
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

  constructor() {
    if (!this.isClient()) {
      this.clientService.loadAll();
    }
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);

    const { clientId, montant, tauxAnnuel, dureeMois } = this.form.getRawValue();
    this.creditService.demander(clientId, montant, tauxAnnuel, dureeMois).subscribe({
      next: (credit) => this.router.navigate(['/credits', credit.id]),
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Une erreur est survenue lors de la demande.');
      },
    });
  }
}