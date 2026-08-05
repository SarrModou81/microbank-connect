import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, throwError } from 'rxjs';
import { TransactionService } from './transaction.service';
import { CompteService } from './compte.service';
import { Compte } from '../models/compte.model';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class OperationService {
  private readonly compteService = inject(CompteService);
  private readonly transactionService = inject(TransactionService);

  deposer(compte: Compte, montant: number, description?: string): Observable<Transaction> {
    if (compte.statut !== 'actif') {
      return throwError(() => new Error('Ce compte est bloqué, aucune opération n\'est possible.'));
    }
    return this.compteService.updateSolde(compte.id, compte.solde + montant).pipe(
      switchMap(() =>
        this.transactionService.create({
          compteId: compte.id,
          type: 'depot',
          montant,
          date: new Date().toISOString(),
          statut: 'reussie',
          description,
        })
      )
    );
  }

  retirer(compte: Compte, montant: number, description?: string): Observable<Transaction> {
    if (compte.statut !== 'actif') {
      return throwError(() => new Error('Ce compte est bloqué, aucune opération n\'est possible.'));
    }
    if (montant > compte.solde) {
      return throwError(() => new Error('Solde insuffisant.'));
    }
    if (montant > compte.plafondRetrait) {
      return throwError(() => new Error(`Le montant dépasse le plafond de retrait (${compte.plafondRetrait} FCFA).`));
    }
    return this.compteService.updateSolde(compte.id, compte.solde - montant).pipe(
      switchMap(() =>
        this.transactionService.create({
          compteId: compte.id,
          type: 'retrait',
          montant,
          date: new Date().toISOString(),
          statut: 'reussie',
          description,
        })
      )
    );
  }

  virer(source: Compte, destination: Compte, montant: number, description?: string): Observable<Transaction> {
    if (source.statut !== 'actif') {
      return throwError(() => new Error('Le compte source est bloqué, aucune opération n\'est possible.'));
    }
    if (destination.statut !== 'actif') {
      return throwError(() => new Error('Le compte destinataire est bloqué, aucune opération n\'est possible.'));
    }
    if (source.id === destination.id) {
      return throwError(() => new Error('Le compte source et destinataire doivent être différents.'));
    }
    if (montant > source.solde) {
      return throwError(() => new Error('Solde insuffisant.'));
    }
    if (montant > source.plafondRetrait) {
      return throwError(() => new Error(`Le montant dépasse le plafond de retrait (${source.plafondRetrait} FCFA).`));
    }
    return this.compteService.updateSolde(source.id, source.solde - montant).pipe(
      switchMap(() => this.compteService.updateSolde(destination.id, destination.solde + montant)),
      switchMap(() =>
        this.transactionService.create({
          compteId: source.id,
          compteDestinataireId: destination.id,
          type: 'virement',
          montant,
          date: new Date().toISOString(),
          statut: 'reussie',
          description,
        })
      )
    );
  }
}