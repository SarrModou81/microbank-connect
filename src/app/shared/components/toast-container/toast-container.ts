import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mbc-toast-container">
      @for (toast of notifications.toasts(); track toast.id) {
        <div class="mbc-toast" [class]="'mbc-toast-' + toast.type">
          <span>{{ toast.message }}</span>
          <button type="button" (click)="notifications.dismiss(toast.id)" aria-label="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .mbc-toast-container { position: fixed; top: 1rem; right: 1rem; z-index: 1000; display: flex; flex-direction: column; gap: 0.5rem; max-width: 320px; }
    .mbc-toast { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: var(--mbc-radius-sm); box-shadow: var(--mbc-shadow-md); font-size: 0.85rem; font-weight: 600; color: #fff; }
    .mbc-toast-success { background: var(--mbc-success); }
    .mbc-toast-error { background: var(--mbc-danger); }
    .mbc-toast-info { background: var(--mbc-info); }
    .mbc-toast button { background: none; border: none; color: #fff; opacity: 0.8; }
  `],
})
export class ToastContainerComponent {
  notifications = inject(NotificationService);
}