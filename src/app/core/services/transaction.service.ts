import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/transactions`;

  readonly transactions = signal<Transaction[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  loadAll(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.http.get<Transaction[]>(this.baseUrl).subscribe({
      next: (transactions) => {
        this.transactions.set(transactions);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Impossible de charger les transactions.');
        this.loading.set(false);
      },
    });
  }

  create(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    return this.http
      .post<Transaction>(this.baseUrl, transaction)
      .pipe(tap((created) => this.transactions.update((list) => [created, ...list])));
  }
}