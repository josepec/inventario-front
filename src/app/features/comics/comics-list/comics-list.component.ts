import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, PaginatedResponse } from '../../../shared/services/api.service';
import { Comic } from '../../../shared/models/comic.model';

@Component({
  selector: 'app-comics-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto">

      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-white tracking-tight">Cómics</h1>
          <p class="text-[#606060] mt-1">{{ total() }} títulos en tu colección</p>
        </div>
        <a routerLink="/app/comics/new"
          class="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white
                 font-semibold text-sm rounded-xl px-5 py-2.5 transition-colors duration-200">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Añadir cómic
        </a>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 mb-8">
        <div class="relative flex-1 min-w-64">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#404040]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input [(ngModel)]="search" (ngModelChange)="onSearch()"
            type="text" placeholder="Buscar por título, serie, autor..."
            class="w-full bg-[#161616] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-sm
                   text-white placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed]
                   transition-colors" />
        </div>

        <select [(ngModel)]="filterStatus" (ngModelChange)="load()"
          class="bg-[#161616] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white
                 focus:outline-none focus:border-[#7c3aed] transition-colors">
          <option value="">Todos</option>
          <option value="unread">Sin leer</option>
          <option value="reading">Leyendo</option>
          <option value="read">Leído</option>
        </select>

        <select [(ngModel)]="filterOwned" (ngModelChange)="load()"
          class="bg-[#161616] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white
                 focus:outline-none focus:border-[#7c3aed] transition-colors">
          <option value="">Todos</option>
          <option value="true">En mi colección</option>
          <option value="false">No lo tengo</option>
        </select>

        <!-- View toggle -->
        <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-1">
          <button (click)="viewMode.set('grid')"
            [class.bg-[#2a2a2a]]="viewMode() === 'grid'"
            class="p-2 rounded-lg transition-colors hover:bg-[#222]">
            <svg class="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </button>
          <button (click)="viewMode.set('list')"
            [class.bg-[#2a2a2a]]="viewMode() === 'list'"
            class="p-2 rounded-lg transition-colors hover:bg-[#222]">
            <svg class="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      <!-- Grid view -->
      @if (!loading() && viewMode() === 'grid') {
        @if (comics().length === 0) {
          <div class="text-center py-24">
            <div class="w-16 h-16 rounded-2xl bg-[#161616] flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-[#404040]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <p class="text-[#606060] text-sm">No hay cómics todavía.</p>
            <a routerLink="/app/comics/new"
              class="inline-block mt-4 text-sm text-[#8b5cf6] hover:underline">Añade el primero</a>
          </div>
        } @else {
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
            @for (comic of comics(); track comic.id) {
              <a [routerLink]="['/app/comics', comic.id]" class="group cursor-pointer">
                <!-- Cover -->
                <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] mb-2">
                  @if (comic.cover_url) {
                    <img [src]="comic.cover_url" [alt]="comic.title"
                      class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  } @else {
                    <div class="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                      <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <p class="text-[10px] text-[#404040] leading-tight">{{ comic.title }}</p>
                    </div>
                  }
                  <!-- Status badge -->
                  <div class="absolute top-2 right-2">
                    @if (comic.read_status === 'read') {
                      <span class="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center">
                        <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                    } @else if (comic.read_status === 'reading') {
                      <span class="w-5 h-5 rounded-full bg-[#f59e0b] flex items-center justify-center">
                        <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z" />
                        </svg>
                      </span>
                    }
                  </div>
                  <!-- Number badge -->
                  @if (comic.number) {
                    <span class="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-bold
                                 px-2 py-1 rounded-lg leading-none backdrop-blur-sm">#{{ comic.number }}</span>
                  }
                  <!-- Hover overlay -->
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                </div>
                <!-- Info -->
                <p class="text-xs font-medium text-[#e0e0e0] truncate leading-tight">{{ comic.title }}</p>
                @if (comic.series) {
                  <p class="text-[10px] text-[#8b5cf6] truncate">{{ comic.series }}</p>
                }
              </a>
            }
          </div>
        }
      }

      <!-- List view -->
      @if (!loading() && viewMode() === 'list') {
        <div class="space-y-2">
          @for (comic of comics(); track comic.id) {
            <a [routerLink]="['/app/comics', comic.id]"
              class="flex items-center gap-4 bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e]
                     rounded-xl px-4 py-3 transition-colors duration-150">
              <div class="w-10 h-14 rounded-lg overflow-hidden bg-[#222] shrink-0">
                @if (comic.cover_url) {
                  <img [src]="comic.cover_url" [alt]="comic.title" class="w-full h-full object-cover" />
                }
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-white truncate">{{ comic.title }}</p>
                @if (comic.series) {
                  <p class="text-xs text-[#8b5cf6]">{{ comic.series }}</p>
                }
              </div>
              <div class="shrink-0 text-xs text-[#606060]">{{ comic.publisher }}</div>
              <div class="shrink-0">
                <span class="text-xs px-2 py-1 rounded-lg"
                  [class]="statusClass(comic.read_status)">
                  {{ statusLabel(comic.read_status) }}
                </span>
              </div>
            </a>
          }
        </div>
      }

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="flex justify-center items-center gap-2 mt-10">
          <button (click)="goTo(page() - 1)" [disabled]="page() === 1"
            class="px-3 py-2 rounded-lg bg-[#161616] border border-[#2a2a2a] text-sm text-[#a0a0a0]
                   disabled:opacity-30 hover:bg-[#1f1f1f] transition-colors">
            ← Anterior
          </button>
          <span class="text-sm text-[#606060]">Página {{ page() }} de {{ totalPages() }}</span>
          <button (click)="goTo(page() + 1)" [disabled]="page() === totalPages()"
            class="px-3 py-2 rounded-lg bg-[#161616] border border-[#2a2a2a] text-sm text-[#a0a0a0]
                   disabled:opacity-30 hover:bg-[#1f1f1f] transition-colors">
            Siguiente →
          </button>
        </div>
      }

    </div>
  `
})
export class ComicsListComponent implements OnInit {
  private api = inject(ApiService);

  comics = signal<Comic[]>([]);
  total = signal(0);
  loading = signal(false);
  page = signal(1);
  viewMode = signal<'grid' | 'list'>('grid');

  search = '';
  filterStatus = '';
  filterOwned = '';

  readonly limit = 42;
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit)));

  private searchTimer: any;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<PaginatedResponse<Comic>>('/comics', {
      page: this.page(),
      limit: this.limit,
      search: this.search || undefined,
      read_status: this.filterStatus || undefined,
      owned: this.filterOwned === '' ? undefined : this.filterOwned === 'true',
    }).subscribe({
      next: res => {
        this.comics.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 400);
  }

  goTo(p: number) { this.page.set(p); this.load(); }

  statusLabel(s: string) {
    return s === 'read' ? 'Leído' : s === 'reading' ? 'Leyendo' : 'Sin leer';
  }

  statusClass(s: string) {
    if (s === 'read') return 'bg-[#22c55e1a] text-[#22c55e]';
    if (s === 'reading') return 'bg-[#f59e0b1a] text-[#f59e0b]';
    return 'bg-[#ffffff0d] text-[#606060]';
  }
}
