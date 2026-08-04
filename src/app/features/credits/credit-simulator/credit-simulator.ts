import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CreditService } from '../../../core/services/credit.service';

@Component({
  selector: 'app-credit-simulator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './credit-simulator.html',
  styleUrl: './credit-simulator.css',
})
export class CreditSimulatorComponent {
  private readonly fb = inject(FormBuilder);
  private readonly creditService = inject(CreditService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    montant: [500000, [Validators.required, Validators.min(10000)]],
    tauxAnnuel: [12, [Validators.required, Validators.min(0)]],
    dureeMois: [12, [Validators.required, Validators.min(1), Validators.max(60)]],
  });

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  mensualite = computed(() => {
    const { montant, tauxAnnuel, dureeMois } = this.formValue();
    if (!montant || !dureeMois) return 0;
    return this.creditService.simulerMensualite(montant, tauxAnnuel ?? 0, dureeMois);
  });

  coutTotal = computed(() => this.mensualite() * (this.formValue().dureeMois ?? 0));
  coutCredit = computed(() => this.coutTotal() - (this.formValue().montant ?? 0));

  demander(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { montant, tauxAnnuel, dureeMois } = this.form.getRawValue();
    this.router.navigate(['/credits/nouvelle'], { queryParams: { montant, tauxAnnuel, dureeMois } });
  }
}