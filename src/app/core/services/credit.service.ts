import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, concatMap, from, map, of, switchMap, tap, toArray } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Credit, Echeance, StatutCredit } from '../models/credit.model';

@Injectable({ providedIn: 'root' })
export class CreditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/credits`;
  private readonly echeancesUrl = `${environment.apiUrl}/echeances`;

  readonly credits = signal<Credit[]>([]);
  readonly echeances = signal<Echeance[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  loadAll(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.http.get<Credit[]>(this.baseUrl).subscribe({
      next: (credits) => {
        this.credits.set(credits);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Impossible de charger les crédits.');
        this.loading.set(false);
      },
    });
  }

  loadEcheances(): void {
    this.http.get<Echeance[]>(this.echeancesUrl).subscribe((echeances) => this.echeances.set(echeances));
  }

  getById(id: string): Observable<Credit> {
    return this.http.get<Credit>(`${this.baseUrl}/${id}`);
  }

  simulerMensualite(montant: number, tauxAnnuel: number, dureeMois: number): number {
    const tauxMensuel = tauxAnnuel / 100 / 12;
    if (tauxMensuel === 0) return Math.round(montant / dureeMois);
    const mensualite = (montant * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -dureeMois));
    return Math.round(mensualite);
  }

  demander(clientId: string, montant: number, tauxAnnuel: number, dureeMois: number): Observable<Credit> {
    const credit = {
      clientId,
      montant,
      tauxAnnuel,
      dureeMois,
      mensualite: this.simulerMensualite(montant, tauxAnnuel, dureeMois),
      statut: 'en_attente' as StatutCredit,
      dateCreation: new Date().toISOString(),
    };
    return this.http
      .post<Credit>(this.baseUrl, credit)
      .pipe(tap((created) => this.credits.update((list) => [...list, created])));
  }

  changerStatut(id: string, statut: StatutCredit): Observable<Credit> {
    return this.http.patch<Credit>(`${this.baseUrl}/${id}`, { statut }).pipe(
      switchMap((updated) => {
        this.credits.update((list) => list.map((c) => (c.id === id ? updated : c)));
        return statut === 'approuve' ? this.genererEcheancier(updated).pipe(map(() => updated)) : of(updated);
      })
    );
  }

  private genererEcheancier(credit: Credit): Observable<Echeance[]> {
    const echeances = Array.from({ length: credit.dureeMois }, (_, i) => {
      const date = new Date(credit.dateCreation);
      date.setMonth(date.getMonth() + i + 1);
      return {
        creditId: credit.id,
        numero: i + 1,
        dateEcheance: date.toISOString(),
        montant: credit.mensualite,
        payee: false,
      };
    });

    return from(echeances).pipe(
      concatMap((e) => this.http.post<Echeance>(this.echeancesUrl, e)),
      toArray(),
      tap((created) => this.echeances.update((list) => [...list, ...created]))
    );
  }

  payerEcheance(echeanceId: string): Observable<Echeance> {
    return this.http
      .patch<Echeance>(`${this.echeancesUrl}/${echeanceId}`, { payee: true })
      .pipe(tap((updated) => this.echeances.update((list) => list.map((e) => (e.id === updated.id ? updated : e)))));
  }
}