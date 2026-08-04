import { Pipe, PipeTransform } from '@angular/core';
import { UserRole } from '../../core/models/user.model';

const LABELS: Record<UserRole, string> = {
  client: 'Client',
  agent: 'Agent',
  gestionnaire: 'Gestionnaire',
};

@Pipe({ name: 'roleLabel' })
export class RoleLabelPipe implements PipeTransform {
  transform(role: UserRole | null | undefined): string {
    return role ? LABELS[role] : '';
  }
}