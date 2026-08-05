import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const nouveau = control.get('nouveauMotDePasse')?.value;
  const confirmation = control.get('confirmation')?.value;
  return nouveau && confirmation && nouveau !== confirmation ? { mismatch: true } : null;
}

@Component({
  selector: 'app-change-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  submitting = signal(false);
  errorMessage = signal<string | null>(null);
  isFirstConnexion = this.authService.currentUser()?.mustChangePassword ?? false;

  readonly form = this.fb.nonNullable.group(
    {
      ancienMotDePasse: ['', Validators.required],
      nouveauMotDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmation: ['', Validators.required],
    },
    { validators: passwordsMatchValidator }
  );

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);

    const { ancienMotDePasse, nouveauMotDePasse } = this.form.getRawValue();
    this.authService.changePassword(ancienMotDePasse, nouveauMotDePasse).subscribe({
      next: () => {
        this.notifications.success('Mot de passe modifié avec succès.');
        this.router.navigateByUrl('/dashboard');
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.errorMessage.set(err.message ?? 'Une erreur est survenue.');
      },
    });
  }
}