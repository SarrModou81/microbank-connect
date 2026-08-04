import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function plafondValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    if (value < min || value > max) {
      return { plafond: { min, max } };
    }
    return null;
  };
}