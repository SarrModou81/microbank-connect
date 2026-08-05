import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alerte, AlerteType } from '../models/alert.model';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly baseUrl = `${environment.apiUrl}/alertes`;

  readonly alertes = signal<Alerte[]>([]);
  readonly nonLues = computed(() => this.alertes().filter((a) => !a.lue).length);

  loadMine(): void {
    const user = this.authService.currentUser();
    if (!user) return;
    this.http.get<Alerte[]>(this.baseUrl, { params: { userId: user.id } }).subscribe((alertes) => {
      this.alertes.set([...alertes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
  }

  notifierUtilisateur(userId: string, titre: string, message: string, type: AlerteType = 'info', lien?: string): Observable<Alerte> {
    const alerte = { userId, titre, message, type, date: new Date().toISOString(), lue: false, lien };
    return this.http.post<Alerte>(this.baseUrl, alerte).pipe(
      tap((created) => {
        console.log('[AlertService] alerte creee:', created);
        if (created.userId === this.authService.currentUser()?.id) {
          this.alertes.update((list) => [created, ...list]);
        }
      })
    );
  }

  notifierClient(clientId: string, titre: string, message: string, type: AlerteType = 'info', lien?: string): void {
    this.userService.getByClientId(clientId).subscribe({
      next: (users) => {
        const user = users[0];
        if (!user) {
          console.warn(`[AlertService] Aucun compte utilisateur trouve pour le client "${clientId}" - notification non envoyee.`);
          return;
        }
        this.notifierUtilisateur(user.id, titre, message, type, lien).subscribe();
      },
      error: (err) => console.error('[AlertService] Erreur recherche utilisateur client:', err),
    });
  }

  notifierGestionnaires(titre: string, message: string, type: AlerteType = 'info', lien?: string): void {
    this.userService.getByRole('gestionnaire').subscribe({
      next: (gestionnaires) => {
        if (gestionnaires.length === 0) {
          console.warn('[AlertService] Aucun gestionnaire trouve - notification non envoyee.');
        }
        gestionnaires.forEach((g) => this.notifierUtilisateur(g.id, titre, message, type, lien).subscribe());
      },
      error: (err) => console.error('[AlertService] Erreur recherche gestionnaires:', err),
    });
  }

  marquerLue(id: string): void {
    this.http.patch<Alerte>(`${this.baseUrl}/${id}`, { lue: true }).subscribe((updated) => {
      this.alertes.update((list) => list.map((a) => (a.id === id ? updated : a)));
    });
  }

  marquerToutesLues(): void {
    const nonLues = this.alertes().filter((a) => !a.lue);
    if (nonLues.length === 0) return;
    forkJoin(nonLues.map((a) => this.http.patch<Alerte>(`${this.baseUrl}/${a.id}`, { lue: true }))).subscribe((updated) => {
      this.alertes.update((list) => list.map((a) => updated.find((u) => u.id === a.id) ?? a));
    });
  }
}