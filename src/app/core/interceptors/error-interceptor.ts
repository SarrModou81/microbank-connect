import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        notifications.error('Session expirée, veuillez vous reconnecter.');
        auth.logout();
      } else if (error.status === 0) {
        notifications.error('Impossible de contacter le serveur.');
      } else {
        notifications.error(error.error?.message ?? 'Une erreur est survenue.');
      }
      return throwError(() => error);
    })
  );
};