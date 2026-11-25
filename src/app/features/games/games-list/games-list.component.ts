import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, PaginatedResponse } from '../../../shared/services/api.service';
import {
  Game, GamePlatform, GameStatus, GAME_FORMAT_LABEL, GAME_PLATFORMS, GAME_STATUS_LABEL, GAME_STATUS_STYLE,
} from '../../../shared/models/game.model';

interface Facets {
  platforms: { platform: GamePlatform; count: number }[];
  genres: string[];
  franchises: string[];
}

const PAGE_SIZE = 42;

@Component({
  selector: 'app-games-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-4 md:p-8 max-w-7xl mx-auto">

      <div class="flex items-start justify-between mb-5 md:mb-8 gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">Videojuegos</h1>
          <p class="text-[#606060] mt-0.5 text-sm">{{ total() }} {{ total() === 1 ? 'juego' : 'juegos' }} en tu colección</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a routerLink="/app/games/trophies"
            class="flex items-center gap-2 bg-[#161616] hover:bg-[#1a1a1a] border border-[#2a2a2a]
                   text-[#a0a0a0] hover:text-white font-semibold text-sm rounded-xl px-4 py-2.5 transition-colors duration-200">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
            <span class="hidden sm:inline">Trofeos</span>
          </a>
          <a routerLink="/app/games/new"
            class="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white
                   font-semibold text-sm rounded-xl px-4 py-2.5 md:px-5 transition-colors duration-200">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span class="hidden sm:inline">Añadir juego</span>
            <span class="sm:hidden">Añadir</span>
          </a>
        </div>
      </div>

      <!-- Búsqueda, estado, orden y filtros (mismo patrón que libros) -->
      <div class="flex flex-col gap-2 mb-5 md:mb-8">
        <div class="relative">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#404040]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input [(ngModel)]="search" (ngModelChange)="onSearch()"
            type="text" placeholder="Buscar por título, saga, desarrolladora, EAN..."
            class="w-full bg-[#161616] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-sm
                   text-white placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-0.5 overflow-x-auto max-w-full">
            @for (s of statusFilters; track s.value) {
              <button (click)="status = s.value; reload()"
                class="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
                [class]="status === s.value ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
                {{ s.label }}
              </button>
            }
          </div>

          <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-0.5 overflow-x-auto max-w-full">
            @for (opt of sortOptions; track opt.value) {
              <button (click)="toggleSort(opt.value)"
                class="px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1"
                [class]="sortField === opt.value ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
                {{ opt.label }}
                @if (sortField === opt.value) {
                  <span class="text-[10px]">{{ sortOrder === 'desc' ? '↓' : '↑' }}</span>
                }
              </button>
            }
          </div>

          <button (click)="filtersExpanded.set(!filtersExpanded())" type="button"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors"
            [class]="filtersExpanded() || activeFilterCount() > 0
              ? 'bg-[#7c3aed1a] border-[#7c3aed33] text-[#8b5cf6]'
              : 'bg-[#161616] border-[#2a2a2a] text-[#606060] hover:text-[#a0a0a0]'">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            Filtros
            @if (activeFilterCount() > 0) {
              <span class="w-4 h-4 bg-[#7c3aed] text-white text-[10px] rounded-full flex items-center justify-center font-bold">{{ activeFilterCount() }}</span>
            }
          </button>
        </div>

        <!-- Filtros activos -->
        @if (activeFilterCount() > 0 && !filtersExpanded()) {
          <div class="flex flex-wrap gap-1.5">
            @if (platform) {
              <span class="filter-tag">{{ platform }}
                <button (click)="platform = ''; reload()" class="hover:text-white text-base leading-none">&times;</button></span>
            }
            @if (format) {
              <span class="filter-tag">{{ formatLabel[format] }}
                <button (click)="format = ''; reload()" class="hover:text-white text-base leading-none">&times;</button></span>
            }
            @if (genre) {
              <span class="filter-tag">{{ genre }}
                <button (click)="genre = ''; reload()" class="hover:text-white text-base leading-none">&times;</button></span>
            }
            @if (franchise) {
              <span class="filter-tag">{{ franchise }}
                <button (click)="franchise = ''; reload()" class="hover:text-white text-base leading-none">&times;</button></span>
            }
            <button (click)="clearAllFilters()" class="text-xs text-[#606060] hover:text-white transition-colors ml-1">
              Limpiar todo
            </button>
          </div>
        }

        <!-- Panel de filtros -->
        @if (filtersExpanded()) {
          <div class="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-4 space-y-4">
            <div class="flex flex-wrap gap-x-6 gap-y-3">
              <div>
                <label class="panel-label">Plataforma</label>
                <div class="flex flex-wrap gap-1">
                  <button (click)="platform = ''; reload()" class="chip" [class.chip-on]="!platform">Todas</button>
                  @for (p of platforms; track p) {
                    <button (click)="platform = platform === p ? '' : p; reload()" class="chip" [class.chip-on]="platform === p">
                      {{ p }}@if (platformCount(p); as n) { <span class="opacity-60"> {{ n }}</span> }
                    </button>
                  }
                </div>
              </div>
              <div>
                <label class="panel-label">Formato</label>
                <div class="flex gap-1">
                  <button (click)="format = ''; reload()" class="chip" [class.chip-on]="!format">Todos</button>
                  <button (click)="format = format === 'physical' ? '' : 'physical'; reload()" class="chip" [class.chip-on]="format === 'physical'">Físico</button>
                  <button (click)="format = format === 'digital' ? '' : 'digital'; reload()" class="chip" [class.chip-on]="format === 'digital'">Digital</button>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="panel-label">Género</label>
                <input type="text" list="gameGenresList" [value]="genre"
                  (change)="genre = $any($event.target).value; reload()"
                  placeholder="Todos" class="panel-input" />
                <datalist id="gameGenresList">
                  @for (g of facets()?.genres ?? []; track g) { <option [value]="g"></option> }
                </datalist>
              </div>
              <div>
                <label class="panel-label">Saga</label>
                <input type="text" list="gameFranchisesList" [value]="franchise"
                  (change)="franchise = $any($event.target).value; reload()"
                  placeholder="Todas" class="panel-input" />
                <datalist id="gameFranchisesList">
                  @for (f of facets()?.franchises ?? []; track f) { <option [value]="f"></option> }
                </datalist>
              </div>
            </div>
            @if (activeFilterCount() > 0) {
              <div class="flex justify-end">
                <button (click)="clearAllFilters()" class="text-xs text-[#606060] hover:text-white transition-colors">
                  Limpiar filtros
                </button>
              </div>
            }
          </div>
        }
      </div>

      @if (loading() && games().length === 0) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (games().length === 0) {
        <div class="text-center py-20">
          <svg class="w-14 h-14 text-[#2a2a2a] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
          </svg>
          @if (hasFilters()) {
            <p class="text-[#606060] text-sm">Ningún juego coincide con los filtros.</p>
          } @else {
            <p class="text-[#a0a0a0] text-sm mb-1">Todavía no hay juegos.</p>
            <p class="text-[#606060] text-xs mb-5">Búscalos en IGDB y añade las copias que tienes.</p>
            <a routerLink="/app/games/new"
              class="inline-flex px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors">
              Añadir el primero
            </a>
          }
        </div>
      } @else {
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          @for (g of games(); track g.id) {
            <a [routerLink]="['/app/games', g.id]" class="group">
              <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#161616] border border-[#1e1e1e]
                          group-hover:border-[#7c3aed]/50 transition-colors">
                @if (g.cover_url) {
                  <img [src]="g.cover_url" [alt]="g.title" loading="lazy"
                    class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                } @else {
                  <div class="w-full h-full flex items-center justify-center p-2">
                    <span class="text-[11px] text-[#505050] text-center leading-tight">{{ g.title }}</span>
                  </div>
                }
                @if (g.status !== 'pending') {
                  <span class="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded border backdrop-blur-sm"
                    [class]="statusStyle[g.status]">{{ statusLabel[g.status] }}</span>
                }
                @if (g.has_platinum) {
                  <span class="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/75 text-[#a5b4fc]"
                    title="Platino conseguido">PLATINO</span>
                } @else if (g.trophy_progress != null && g.trophy_progress > 0) {
                  <div class="absolute inset-x-0 bottom-0 h-1 bg-black/60" [title]="'Trofeos: ' + g.trophy_progress + '%'">
                    <div class="h-full bg-[#7c3aed]" [style.width.%]="g.trophy_progress"></div>
                  </div>
                }
                @if (g.formats.includes('digital')) {
                  <span class="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-[#a0a0a0]"
                    [title]="g.formats.length > 1 ? 'Físico y digital' : 'Digital'">{{ g.formats.length > 1 ? 'F+D' : 'DIG' }}</span>
                }
              </div>
              <p class="mt-1.5 text-xs text-[#d0d0d0] group-hover:text-white truncate transition-colors">{{ g.title }}</p>
              <p class="text-[10px] text-[#606060] truncate">{{ g.platforms.join(' · ') || 'Sin copias' }}</p>
            </a>
          }
        </div>

        @if (games().length < total()) {
          <div class="flex justify-center mt-8">
            <button (click)="loadMore()" [disabled]="loading()"
              class="px-6 py-2.5 rounded-xl bg-[#161616] hover:bg-[#1f1f1f] border border-[#2a2a2a] text-sm text-[#a0a0a0]
                     font-medium disabled:opacity-50 transition-colors">
              @if (loading()) { Cargando... } @else { Cargar más ({{ total() - games().length }}) }
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .filter-tag { @apply inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#7c3aed1a] text-[#8b5cf6]; }
    .panel-label { @apply block text-[10px] text-[#606060] mb-1 uppercase tracking-wider; }
    .panel-input {
      @apply w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs text-white
             placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors;
    }
    .chip {
      @apply px-2.5 py-1 rounded-lg text-xs font-medium border border-[#2a2a2a] bg-[#0d0d0d] text-[#606060]
             hover:text-[#a0a0a0] transition-colors;
    }
    .chip-on { @apply bg-[#7c3aed1a] border-[#7c3aed33] text-[#8b5cf6] hover:text-[#8b5cf6]; }
  `],
})
export class GamesListComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  readonly platforms = GAME_PLATFORMS;
  readonly statusLabel = GAME_STATUS_LABEL;
  readonly statusStyle = GAME_STATUS_STYLE;
  readonly formatLabel: Record<string, string> = GAME_FORMAT_LABEL;
  readonly statusFilters: { value: '' | GameStatus; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'pending', label: 'Sin empezar' },
    { value: 'playing', label: 'Jugando' },
    { value: 'completed', label: 'Pasados' },
    { value: 'abandoned', label: 'Abandonados' },
  ];
  readonly sortOptions = [
    { value: 'created_at', label: 'Recientes' },
    { value: 'title', label: 'Título' },
    { value: 'first_release_date', label: 'Salida' },
    { value: 'completed_at', label: 'Pasado' },
    { value: 'rating', label: 'Nota' },
  ];

  games = signal<Game[]>([]);
  total = signal(0);
  loading = signal(false);
  facets = signal<Facets | null>(null);
  filtersExpanded = signal(false);

  search = '';
  status: '' | GameStatus = '';
  platform = '';
  format = '';
  genre = '';
  franchise = '';
  sortField = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';
  private page = 1;
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  ngOnInit() {
    const qp = this.route.snapshot.queryParamMap;
    this.platform = qp.get('platform') ?? '';
    this.status = (qp.get('status') as GameStatus | null) ?? '';
    this.genre = qp.get('genre') ?? '';
    this.format = qp.get('format') ?? '';
    this.franchise = qp.get('franchise') ?? '';
    this.api.get<Facets>('/games/facets').subscribe({ next: f => this.facets.set(f) });
    this.reload();
  }

  /** Los del panel; estado, orden y búsqueda van aparte, como en libros. */
  activeFilterCount() {
    return [this.platform, this.format, this.genre, this.franchise].filter(Boolean).length;
  }

  hasFilters() {
    return !!(this.search || this.status || this.activeFilterCount());
  }

  clearAllFilters() {
    this.platform = ''; this.format = ''; this.genre = ''; this.franchise = '';
    this.reload();
  }

  toggleSort(field: string) {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
    } else {
      this.sortField = field;
      this.sortOrder = field === 'title' ? 'asc' : 'desc';
    }
    this.reload();
  }

  platformCount(p: GamePlatform): number | null {
    return this.facets()?.platforms.find(x => x.platform === p)?.count ?? null;
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.reload(), 300);
  }

  reload() {
    this.page = 1;
    this.fetch(false);
  }

  loadMore() {
    this.page++;
    this.fetch(true);
  }

  private fetch(append: boolean) {
    const params: Record<string, string | number> = { page: this.page, limit: PAGE_SIZE, sort: this.sortField, order: this.sortOrder };
    if (this.search) params['search'] = this.search;
    if (this.status) params['status'] = this.status;
    if (this.platform) params['platform'] = this.platform;
    if (this.format) params['format'] = this.format;
    if (this.genre) params['genre'] = this.genre;
    if (this.franchise) params['franchise'] = this.franchise;

    this.loading.set(true);
    this.api.get<PaginatedResponse<Game>>('/games', params).subscribe({
      next: res => {
        this.games.set(append ? [...this.games(), ...res.data] : res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
