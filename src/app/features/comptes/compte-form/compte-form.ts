import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CompteService } from '../../../core/services/compte.service';
import { ClientService } from '../../../core/services/client.service';
import { plafondValidator } from '../../../shared/validators/plafond.validator';
import { TypeCompte } from '../../../core/models/compte.model';
import { AlertService } from '../../../core/services/alert.service'

const PLAFONDS: Record<TypeCompte, { min: number; max: number; defaut: number }> = {
  courant: { min: 10000, max: 500000, defaut: 200000 },
  epargne: { min: 5000, max: 200000, defaut: 100000 },
};

@Component({
  selector: 'app-compte-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './compte-form.html',
  styleUrl: './compte-form.css',
})
export class CompteFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly compteService = inject(CompteService);
  private readonly clientService = inject(ClientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alertService = inject(AlertService);

  clients = this.clientService.clients;
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    clientId: [this.route.snapshot.queryParamMap.get('clientId') ?? '', Validators.required],
    type: ['courant' as TypeCompte, Validators.required],
    soldeInitial: [0, [Validators.required, Validators.min(0)]],
    plafondRetrait: [PLAFONDS.courant.defaut, [Validators.required, plafondValidator(PLAFONDS.courant.min, PLAFONDS.courant.max)]],
  });

  plafondBounds = computed(() => PLAFONDS[this.form.controls.type.value as TypeCompte]);

  constructor() {
    this.clientService.loadAll();

    this.form.controls.type.valueChanges.subscribe((type) => {
      const bounds = PLAFONDS[type as TypeCompte];
      this.form.controls.plafondRetrait.setValidators([Validators.required, plafondValidator(bounds.min, bounds.max)]);
      this.form.controls.plafondRetrait.setValue(bounds.defaut);
      this.form.controls.plafondRetrait.updateValueAndValidity();
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();
    this.compteService
      .create({
        numero: this.compteService.generateNumero(value.type),
        clientId: value.clientId,
        type: value.type,
        solde: value.soldeInitial,
        plafondRetrait: value.plafondRetrait,
        statut: 'actif',
        dateOuverture: new Date().toISOString(),
      })
      .subscribe({
        next: (compte) => {
          this.alertService.notifierClient(
            compte.clientId,
            'Nouveau compte ouvert',
            `Un compte ${compte.type === 'courant' ? 'courant' : 'épargne'} (n° ${compte.numero}) a été ouvert pour vous.`,
            'succes',
            `/comptes/${compte.id}`
          );
          this.router.navigate(['/comptes', compte.id]);
        },
        error: () => {
          this.errorMessage.set("Une erreur est survenue lors de l'ouverture du compte.");
          this.submitting.set(false);
        },
      });
  }
}