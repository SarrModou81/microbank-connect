import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class NotificationsComponent {
  private readonly alertService = inject(AlertService);

  alertes = this.alertService.alertes;
  nonLues = this.alertService.nonLues;

  constructor() {
    this.alertService.loadMine();
  }

  marquerLue(id: string): void {
    this.alertService.marquerLue(id);
  }

  marquerToutesLues(): void {
    this.alertService.marquerToutesLues();
  }
}