import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { CompteService } from '../../../core/services/compte.service';
import { OperationService } from '../../../core/services/operation.service';
import { TypeTransaction, Transaction } from '../../../core/models/transaction.model';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-operation-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './operation-form.html',
  styleUrl: './operation-form.css',
})
export class OperationFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly compteService = inject(CompteService);
  private readonly operationService = inject(OperationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alertService = inject(AlertService);

  comptes = this.compteService.comptes;
  confirming = signal(false);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    type: ['depot' as TypeTransaction, Validators.required],
    compteId: [this.route.snapshot.queryParamMap.get('compteId') ?? '', Validators.required],
    compteDestinataireId: [''],
    montant: [0, [Validators.required, Validators.min(1)]],
    description: [''],
  });

  selectedCompte = computed(() => this.comptes().find((c) => c.id === this.form.controls.compteId.value));
  destinationCompte = computed(() => this.comptes().find((c) => c.id === this.form.controls.compteDestinataireId.value));

  reviewLabel = computed(() => {
    switch (this.form.controls.type.value) {
      case 'depot': return 'Dépôt';
      case 'retrait': return 'Retrait';
      case 'virement': return 'Virement';
      default: return '';
    }
  });

  constructor() {
    this.compteService.loadAll();

    this.form.controls.type.valueChanges.subscribe((type) => {
      const destCtrl = this.form.controls.compteDestinataireId;
      if (type === 'virement') {
        destCtrl.setValidators([Validators.required]);
      } else {
        destCtrl.clearValidators();
        destCtrl.setValue('');
      }
      destCtrl.updateValueAndValidity();
    });
  }

  proceedToConfirmation(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage.set(null);
    this.confirming.set(true);
  }

  cancelConfirmation(): void {
    this.confirming.set(false);
  }

  confirm(): void {
  const value = this.form.getRawValue();
  const compte = this.comptes().find((c) => c.id === value.compteId);
  if (!compte) return;

  this.submitting.set(true);
  this.errorMessage.set(null);

  let request$: Observable<Transaction>;
  let destination = undefined as ReturnType<typeof this.comptes> extends (infer T)[] ? T | undefined : never;

  if (value.type === 'depot') {
    request$ = this.operationService.deposer(compte, value.montant, value.description);
  } else if (value.type === 'retrait') {
    request$ = this.operationService.retirer(compte, value.montant, value.description);
  } else {
    destination = this.comptes().find((c) => c.id === value.compteDestinataireId);
    if (!destination) {
      this.submitting.set(false);
      this.errorMessage.set('Compte destinataire introuvable.');
      return;
    }
    request$ = this.operationService.virer(compte, destination, value.montant, value.description);
  }

  request$.subscribe({
    next: () => {
      if (value.type === 'depot' || value.type === 'retrait') {
        this.alertService.notifierClient(
          compte.clientId,
          value.type === 'depot' ? 'Dépôt effectué' : 'Retrait effectué',
          `Un ${value.type === 'depot' ? 'dépôt' : 'retrait'} de ${value.montant.toLocaleString()} FCFA a été effectué sur votre compte ${compte.numero}.`,
          'succes',
          `/comptes/${compte.id}`
        );
      } else if (destination) {
        this.alertService.notifierClient(
          compte.clientId,
          'Virement effectué',
          `Un virement de ${value.montant.toLocaleString()} FCFA a été effectué depuis votre compte ${compte.numero}.`,
          'succes',
          `/comptes/${compte.id}`
        );
        if (destination.clientId !== compte.clientId) {
          this.alertService.notifierClient(
            destination.clientId,
            'Virement reçu',
            `Vous avez reçu un virement de ${value.montant.toLocaleString()} FCFA sur votre compte ${destination.numero}.`,
            'succes',
            `/comptes/${destination.id}`
          );
        }
      }
      this.router.navigateByUrl('/operations');
    },
    error: (err: Error) => {
      this.submitting.set(false);
      this.errorMessage.set(err.message ?? "Une erreur est survenue lors de l'opération.");
    },
  });
}
}