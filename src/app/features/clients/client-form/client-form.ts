import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-client-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './client-form.html',
  styleUrl: './client-form.css',
})
export class ClientFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clientService = inject(ClientService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly clientId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = !!this.clientId;

  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', [Validators.required, Validators.pattern(/^[0-9+ ]{9,15}$/)]],
    adresse: ['', Validators.required],
    dateNaissance: ['', Validators.required],
    numeroPiece: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
  });

  constructor() {
    if (this.clientId) {
      this.clientService.getById(this.clientId).subscribe((client) => this.form.patchValue(client));
    }
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();
    const request$ = this.isEdit
      ? this.clientService.update(this.clientId!, value)
      : this.clientService.create({ ...value, agentId: this.authService.currentUser()?.id ?? '' });

    request$.subscribe({
      next: () => this.router.navigateByUrl('/clients'),
      error: () => {
        this.errorMessage.set("Une erreur est survenue lors de l'enregistrement.");
        this.submitting.set(false);
      },
    });
  }
}