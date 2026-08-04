import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';

@Component({
  selector: 'app-client-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  templateUrl: './client-list.html',
  styleUrl: './client-list.css',
})
export class ClientListComponent {
  private readonly clientService = inject(ClientService);

  clients = this.clientService.clients;
  loading = this.clientService.loading;
  loadError = this.clientService.loadError;
  searchTerm = signal('');

  filteredClients = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.clients();
    if (!term) return list;
    return list.filter((c) => `${c.prenom} ${c.nom} ${c.email} ${c.telephone}`.toLowerCase().includes(term));
  });

  constructor() {
    this.clientService.loadAll();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }
}