import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, switchMap, tap, throwError } from 'rxjs';
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
      .get<(User & { password: string })[]>(`${environment.apiUrl}/users`, { params: { ...credentials } })
      .pipe(
        map((users) => {
          if (!users.length) {
            throw new Error('Identifiants incorrects');
          }
          const { password, ...user } = users[0];
          return user;
        }),
        tap((user) => this.startSession(user))
      );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<User> {
    const user = this.currentUser();
    if (!user) {
      return throwError(() => new Error('Utilisateur non connecté.'));
    }
    return this.http
      .get<(User & { password: string })[]>(`${environment.apiUrl}/users`, {
        params: { id: user.id, password: oldPassword },
      })
      .pipe(
        switchMap((matches) => {
          if (!matches.length) {
            return throwError(() => new Error('Mot de passe actuel incorrect.'));
          }
          return this.http.patch<User & { password: string }>(`${environment.apiUrl}/users/${user.id}`, {
            password: newPassword,
            mustChangePassword: false,
          });
        }),
        map(({ password, ...updated }) => updated),
        tap((updated) => this.startSession(updated))
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