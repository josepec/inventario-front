import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService, PaginatedResponse } from '../../../shared/services/api.service';
import { Comic } from '../../../shared/models/comic.model';
import { environment } from '../../../../environments/environment';

interface CollectionItem {
  id: number;
  title: string;
  publisher: string | null;
  cover_url: string | null;
  total_issues: number | null;
  whakoom_id: string | null;
}

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
          <p class="text-[#606060] mt-1">{{ total() }} {{ tab() === 'comics' ? 'títulos' : 'colecciones' }}</p>
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

        <!-- Tab toggle: Cómics / Colecciones -->
        <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-0.5">
          <button (click)="switchTab('comics')"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            [class]="tab() === 'comics'
              ? 'bg-[#7c3aed] text-white'
              : 'text-[#606060] hover:text-[#a0a0a0]'">
            Cómics
          </button>
          <button (click)="switchTab('collections')"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            [class]="tab() === 'collections'
              ? 'bg-[#7c3aed] text-white'
              : 'text-[#606060] hover:text-[#a0a0a0]'">
            Colecciones
          </button>
        </div>

        <!-- Search -->
        <div class="relative flex-1 min-w-64">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#404040]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input [(ngModel)]="search" (ngModelChange)="onSearch()"
            type="text" [placeholder]="tab() === 'comics' ? 'Buscar por título, serie, autor...' : 'Buscar colección...'"
            class="w-full bg-[#161616] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-sm
                   text-white placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed]
                   transition-colors" />
        </div>

        <!-- Status filter (only for comics) -->
        @if (tab() === 'comics') {
          <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-0.5">
            <button (click)="filterStatus = ''; load()"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              [class]="filterStatus === '' ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Todos
            </button>
            <button (click)="filterStatus = 'unread'; load()"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              [class]="filterStatus === 'unread' ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Sin leer
            </button>
            <button (click)="filterStatus = 'read'; load()"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              [class]="filterStatus === 'read' ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Leído
            </button>
          </div>
        }

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

      <!-- ═══ COMICS TAB ═══ -->
      @if (!loading() && tab() === 'comics') {

        <!-- Grid view -->
        @if (viewMode() === 'grid') {
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
                  <p class="text-xs font-medium text-[#e0e0e0] truncate leading-tight">{{ comic.title }}</p>
                  @if (comic.series) {
                    <p class="text-[10px] text-[#606060] truncate">{{ comic.series }}</p>
                  }
                </a>
              }
            </div>
          }
        }

        <!-- List view -->
        @if (viewMode() === 'list') {
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
                    <p class="text-xs text-[#606060]">{{ comic.series }}</p>
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
      }

      <!-- ═══ COLLECTIONS TAB ═══ -->
      @if (!loading() && tab() === 'collections') {

        @if (viewMode() === 'grid') {
          @if (collections().length === 0) {
            <div class="text-center py-24">
              <p class="text-[#606060] text-sm">No hay colecciones todavía.</p>
              <p class="text-[#404040] text-xs mt-2">Se crean automáticamente al añadir cómics desde Whakoom</p>
            </div>
          } @else {
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
              @for (col of collections(); track col.id) {
                <a [routerLink]="['/app/collections', col.id]" class="group cursor-pointer">
                  <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] mb-2">
                    @if (col.cover_url) {
                      <img [src]="col.cover_url" [alt]="col.title"
                        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    } @else {
                      <div class="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                        <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-1.244 1.007-2.25 2.25-2.25h13.5" />
                        </svg>
                        <p class="text-[10px] text-[#404040] leading-tight">{{ col.title }}</p>
                      </div>
                    }
                    <!-- Issue count badge -->
                    @if (col.total_issues) {
                      <span class="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-bold
                                   px-2 py-1 rounded-lg leading-none backdrop-blur-sm">{{ col.total_issues }}</span>
                    }
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                  </div>
                  <p class="text-xs font-medium text-[#e0e0e0] truncate leading-tight">{{ col.title }}</p>
                  @if (col.publisher) {
                    <p class="text-[10px] text-[#606060] truncate">{{ col.publisher }}</p>
                  }
                </a>
              }
            </div>
          }
        }

        @if (viewMode() === 'list') {
          <div class="space-y-2">
            @for (col of collections(); track col.id) {
              <a [routerLink]="['/app/collections', col.id]"
                class="flex items-center gap-4 bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e]
                       rounded-xl px-4 py-3 transition-colors duration-150">
                <div class="w-10 h-14 rounded-lg overflow-hidden bg-[#222] shrink-0">
                  @if (col.cover_url) {
                    <img [src]="col.cover_url" [alt]="col.title" class="w-full h-full object-cover" />
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-white truncate">{{ col.title }}</p>
                  @if (col.publisher) {
                    <p class="text-xs text-[#606060]">{{ col.publisher }}</p>
                  }
                </div>
                @if (col.total_issues) {
                  <div class="shrink-0 text-xs text-[#606060]">{{ col.total_issues }} cómics</div>
                }
              </a>
            }
          </div>
        }
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
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  comics = signal<Comic[]>([]);
  collections = signal<CollectionItem[]>([]);
  total = signal(0);
  loading = signal(false);
  page = signal(1);
  viewMode = signal<'grid' | 'list'>('grid');
  tab = signal<'comics' | 'collections'>('comics');

  search = '';
  filterStatus = '';

  readonly limit = 42;
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit)));

  private searchTimer: any;

  ngOnInit() { this.load(); }

  switchTab(t: 'comics' | 'collections') {
    this.tab.set(t);
    this.page.set(1);
    this.search = '';
    this.filterStatus = '';
    this.load();
  }

  load() {
    this.loading.set(true);

    if (this.tab() === 'collections') {
      this.http.get<PaginatedResponse<CollectionItem>>(
        `${this.base}/collections`,
        { params: {
          page: this.page().toString(),
          limit: this.limit.toString(),
          ...(this.search ? { search: this.search } : {}),
        }}
      ).subscribe({
        next: res => {
          this.collections.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.api.get<PaginatedResponse<Comic>>('/comics', {
        page: this.page(),
        limit: this.limit,
        search: this.search || undefined,
        read_status: this.filterStatus || undefined,
      }).subscribe({
        next: res => {
          this.comics.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 400);
  }

  goTo(p: number) { this.page.set(p); this.load(); }

  statusLabel(s: string) {
    return s === 'read' ? 'Leído' : 'Sin leer';
  }

  statusClass(s: string) {
    if (s === 'read') return 'bg-[#22c55e1a] text-[#22c55e]';
    return 'bg-[#ffffff0d] text-[#606060]';
  }
}
