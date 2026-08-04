import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Client } from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/clients`;

  readonly clients = signal<Client[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  loadAll(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.http.get<Client[]>(this.baseUrl).subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Impossible de charger la liste des clients.');
        this.loading.set(false);
      },
    });
  }

  getById(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.baseUrl}/${id}`);
  }

  create(client: Omit<Client, 'id' | 'dateCreation'>): Observable<Client> {
    const payload = { ...client, dateCreation: new Date().toISOString() };
    return this.http
      .post<Client>(this.baseUrl, payload)
      .pipe(tap((created) => this.clients.update((list) => [...list, created])));
  }

  update(id: string, changes: Partial<Client>): Observable<Client> {
    return this.http
      .patch<Client>(`${this.baseUrl}/${id}`, changes)
      .pipe(tap((updated) => this.clients.update((list) => list.map((c) => (c.id === id ? updated : c)))));
  }
}