import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, PaginatedResponse } from '../../../shared/services/api.service';
import { Book } from '../../../shared/models/book.model';

@Component({
  selector: 'app-books-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto">

      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-white tracking-tight">Libros</h1>
          <p class="text-[#606060] mt-1">{{ total() }} libros en tu colección</p>
        </div>
        <a routerLink="/app/books/new"
          class="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white
                 font-semibold text-sm rounded-xl px-5 py-2.5 transition-colors duration-200">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Añadir libro
        </a>
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-8">
        <div class="relative flex-1 min-w-64">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#404040]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input [(ngModel)]="search" (ngModelChange)="onSearch()"
            type="text" placeholder="Buscar por título, autor, editorial..."
            class="w-full bg-[#161616] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-sm
                   text-white placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
        </div>

        <select [(ngModel)]="filterStatus" (ngModelChange)="load()"
          class="bg-[#161616] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white
                 focus:outline-none focus:border-[#7c3aed] transition-colors">
          <option value="">Todos</option>
          <option value="unread">Sin leer</option>
          <option value="read">Leído</option>
        </select>

        <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-1">
          <button (click)="viewMode.set('grid')" [class.bg-[#2a2a2a]]="viewMode() === 'grid'"
            class="p-2 rounded-lg transition-colors hover:bg-[#222]">
            <svg class="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </button>
          <button (click)="viewMode.set('list')" [class.bg-[#2a2a2a]]="viewMode() === 'list'"
            class="p-2 rounded-lg transition-colors hover:bg-[#222]">
            <svg class="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      @if (!loading() && viewMode() === 'grid') {
        @if (books().length === 0) {
          <div class="text-center py-24">
            <div class="w-16 h-16 rounded-2xl bg-[#161616] flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-[#404040]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p class="text-[#606060] text-sm">No hay libros todavía.</p>
            <a routerLink="/app/books/new" class="inline-block mt-4 text-sm text-[#8b5cf6] hover:underline">Añade el primero</a>
          </div>
        } @else {
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
            @for (book of books(); track book.id) {
              <a [routerLink]="['/app/books', book.id]" class="group cursor-pointer">
                <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] mb-2">
                  @if (book.cover_url) {
                    <img [src]="book.cover_url" [alt]="book.title"
                      class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  } @else {
                    <div class="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                      <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                      <p class="text-[10px] text-[#404040] leading-tight">{{ book.title }}</p>
                    </div>
                  }
                  <div class="absolute top-2 right-2">
                    @if (book.read_status === 'read') {
                      <span class="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center">
                        <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                    }
                  </div>
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                </div>
                <p class="text-xs font-medium text-[#e0e0e0] truncate leading-tight">{{ book.title }}</p>
                @if (book.author) {
                  <p class="text-[10px] text-[#606060] truncate">{{ book.author }}</p>
                }
              </a>
            }
          </div>
        }
      }

      @if (!loading() && viewMode() === 'list') {
        <div class="space-y-2">
          @for (book of books(); track book.id) {
            <a [routerLink]="['/app/books', book.id]"
              class="flex items-center gap-4 bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e]
                     rounded-xl px-4 py-3 transition-colors duration-150">
              <div class="w-10 h-14 rounded-lg overflow-hidden bg-[#222] shrink-0">
                @if (book.cover_url) {
                  <img [src]="book.cover_url" [alt]="book.title" class="w-full h-full object-cover" />
                }
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-white truncate">{{ book.title }}</p>
                <p class="text-xs text-[#606060]">{{ book.author }}</p>
              </div>
              <div class="shrink-0 text-xs text-[#606060]">{{ book.publisher }}</div>
              <div class="shrink-0">
                <span class="text-xs px-2 py-1 rounded-lg" [class]="statusClass(book.read_status)">
                  {{ statusLabel(book.read_status) }}
                </span>
              </div>
            </a>
          }
        </div>
      }

      @if (totalPages() > 1) {
        <div class="flex justify-center items-center gap-2 mt-10">
          <button (click)="goTo(page() - 1)" [disabled]="page() === 1"
            class="px-3 py-2 rounded-lg bg-[#161616] border border-[#2a2a2a] text-sm text-[#a0a0a0]
                   disabled:opacity-30 hover:bg-[#1f1f1f] transition-colors">← Anterior</button>
          <span class="text-sm text-[#606060]">Página {{ page() }} de {{ totalPages() }}</span>
          <button (click)="goTo(page() + 1)" [disabled]="page() === totalPages()"
            class="px-3 py-2 rounded-lg bg-[#161616] border border-[#2a2a2a] text-sm text-[#a0a0a0]
                   disabled:opacity-30 hover:bg-[#1f1f1f] transition-colors">Siguiente →</button>
        </div>
      }

    </div>
  `
})
export class BooksListComponent implements OnInit {
  private api = inject(ApiService);

  books = signal<Book[]>([]);
  total = signal(0);
  loading = signal(false);
  page = signal(1);
  viewMode = signal<'grid' | 'list'>('grid');

  search = '';
  filterStatus = '';
  readonly limit = 42;
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit)));
  private searchTimer: any;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<PaginatedResponse<Book>>('/books', {
      page: this.page(), limit: this.limit,
      search: this.search || undefined,
      read_status: this.filterStatus || undefined,
    }).subscribe({
      next: res => { this.books.set(res.data); this.total.set(res.total); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 400);
  }

  goTo(p: number) { this.page.set(p); this.load(); }

  statusLabel(s: string) { return s === 'read' ? 'Leído' : 'Sin leer'; }
  statusClass(s: string) {
    if (s === 'read') return 'bg-[#22c55e1a] text-[#22c55e]';
    return 'bg-[#ffffff0d] text-[#606060]';
  }
}
