import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginCredentials, User, UserRole } from '../models/user.model';

const STORAGE_KEY = 'mbc-session';

interface StoredSession {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<StoredSession | null>(this.readStoredSession());

  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly role = computed<UserRole | null>(() => this.session()?.user.role ?? null);

  login(credentials: LoginCredentials): Observable<User> {
    return this.http
      .get<User[]>(`${environment.apiUrl}/users`, { params: { ...credentials } })
      .pipe(
        map((users) => {
          if (!users.length) {
            throw new Error('Identifiants incorrects');
          }
          return users[0];
        }),
        tap((user) => this.startSession(user))
      );
  }

  logout(): void {
    this.session.set(null);
    localStorage.removeItem(STORAGE_KEY);
    this.router.navigateByUrl('/login');
  }

  getToken(): string | null {
    return this.session()?.token ?? null;
  }

  private startSession(user: User): void {
    const stored: StoredSession = {
      token: btoa(`${user.id}:${user.role}:${Date.now()}`),
      user,
    };
    this.session.set(stored);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }

  private readStoredSession(): StoredSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredSession;
    } catch {
      return null;
    }
  }
}