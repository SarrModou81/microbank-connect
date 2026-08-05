import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user.model';

const MOT_DE_PASSE_PAR_DEFAUT = 'client123';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  creerCompteClient(clientId: string, nom: string, prenom: string, email: string): Observable<User> {
    const user = {
      nom,
      prenom,
      email,
      role: 'client' as UserRole,
      clientId,
      password: MOT_DE_PASSE_PAR_DEFAUT,
      mustChangePassword: true,
    };
    return this.http.post<User>(this.baseUrl, user);
  }
}