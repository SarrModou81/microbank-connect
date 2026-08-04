import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Compte, TypeCompte } from '../models/compte.model';

@Injectable({ providedIn: 'root' })
export class CompteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/comptes`;

  readonly comptes = signal<Compte[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  loadAll(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.http.get<Compte[]>(this.baseUrl).subscribe({
      next: (comptes) => {
        this.comptes.set(comptes);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Impossible de charger les comptes.');
        this.loading.set(false);
      },
    });
  }

  getById(id: string): Observable<Compte> {
    return this.http.get<Compte>(`${this.baseUrl}/${id}`);
  }

  create(compte: Omit<Compte, 'id'>): Observable<Compte> {
    return this.http
      .post<Compte>(this.baseUrl, compte)
      .pipe(tap((created) => this.comptes.update((list) => [...list, created])));
  }

  updateSolde(id: string, nouveauSolde: number): Observable<Compte> {
    return this.http
      .patch<Compte>(`${this.baseUrl}/${id}`, { solde: nouveauSolde })
      .pipe(tap((updated) => this.comptes.update((list) => list.map((c) => (c.id === id ? updated : c)))));
  }

  generateNumero(type: TypeCompte): string {
    const suffix = type === 'courant' ? 'CT' : 'EP';
    const random = Math.floor(1000 + Math.random() * 9000);
    return `MBC-${random}-${suffix}`;
  }
}