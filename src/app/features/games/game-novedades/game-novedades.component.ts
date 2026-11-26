import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgTemplateOutlet, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../../shared/services/api.service';
import { GameRelease, GameWish, IgdbSearchResult, monthLabel, releaseLabel } from '../../../shared/models/game.model';

type Tab = 'mine' | 'calendar' | 'wanted' | 'search';

/** Lo que pinta una tarjeta, venga del calendario, de "Lo quiero" o del buscador. */
interface Card {
  igdb_id: number;
  title: string;
  cover_url: string | null;
  platforms: string[];
  date: string | null;
  precision: number;
  kind: string | null;
  owned_id: number | null;
  wanted: boolean;
  my_saga: string | null;
}

interface Group { key: string; label: string; items: Card[] }

/** Por debajo, en el calendario solo salen si son tuyos, los quieres o son de tus sagas. */
const HYPE_MIN = 5;
const TBD = 'tbd';

/**
 * Novedades de videojuegos (fase 5), como las de cómics: lo que quiero y lo que
 * sale de mis sagas, el calendario de PS4/PS5 por meses (IGDB), "Lo quiero" y un
 * buscador para añadir a "Lo quiero".
 */
@Component({
  selector: 'app-game-novedades',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet],
  template: `
    <div class="p-3 md:p-8 max-w-7xl mx-auto">
      <header class="flex items-center justify-between mb-4 md:mb-6 gap-2">
        <div class="min-w-0">
          <h1 class="text-xl md:text-3xl font-bold tracking-tight">Novedades</h1>
          <p class="text-xs md:text-sm text-[#888] mt-0.5 hidden sm:block">Lo que sale en PS4 y PS5, lo que quiero y lo nuevo de mis sagas.</p>
        </div>
        <button (click)="back()" class="shrink-0 flex items-center gap-2 text-sm text-[#606060] hover:text-white transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver
        </button>
      </header>

      <!-- Pestañas (como en Novedades de cómics) -->
      <div class="w-full overflow-x-auto pb-1 mb-4 md:mb-6 scrollbar-none">
        <div class="flex items-center gap-1 bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 w-max min-w-full">
          @for (t of tabs; track t.value) {
            <button (click)="setTab(t.value)"
              class="flex-1 whitespace-nowrap px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
              [class]="tab() === t.value ? 'bg-[#7c3aed] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              @if (t.value === 'wanted') {
                <svg class="inline w-3.5 h-3.5 mr-1 -mt-0.5 fill-current" viewBox="0 0 24 24"><path [attr.d]="heart"/></svg>
              }
              {{ t.label }}
              @if (t.value === 'wanted' && wishlist().length) {
                <span class="ml-1 inline-flex items-center justify-center text-xs font-bold min-w-[1.25rem] h-5 px-1 rounded-full"
                  [class]="tab() === 'wanted' ? 'bg-white/25 text-white' : 'bg-[#7c3aed] text-white'">{{ wishlist().length }}</span>
              }
            </button>
          }
        </div>
      </div>

      @if (error()) {
        <div class="mb-4 rounded-xl border border-[#ef444455] bg-[#ef444411] px-4 py-3 text-sm text-[#fca5a5]">{{ error() }}</div>
      }

      <!-- Mis novedades -->
      @if (tab() === 'mine') {
        @if (loading()) {
          <p class="text-sm text-[#606060]">Cargando…</p>
        } @else if (!mineGroups().length && !mineOut().length) {
          <div class="rounded-xl border border-dashed border-[#1f1f1f] py-12 text-center text-sm text-[#666]">
            No hay nada tuyo a la vista. Marca juegos como "Lo quiero" desde el calendario o el buscador;
            lo nuevo de tus sagas sale aquí solo.
          </div>
        } @else {
          @for (g of mineGroups(); track g.key) {
            <section class="mb-6">
              <h2 class="text-base md:text-lg font-semibold mb-3">{{ g.label }}</h2>
              <ng-container [ngTemplateOutlet]="grid" [ngTemplateOutletContext]="{ $implicit: g.items }" />
            </section>
          }
          @if (mineOut().length) {
            <section class="mb-6">
              <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
                Ya a la venta
                <span class="inline-flex items-center justify-center text-[10px] font-bold min-w-[1.25rem] h-4 px-1 rounded-full bg-[#7c3aed33] text-[#a78bfa]">{{ mineOut().length }}</span>
              </h3>
              <ng-container [ngTemplateOutlet]="grid" [ngTemplateOutletContext]="{ $implicit: mineOut() }" />
            </section>
          }
        }
      }

      <!-- Calendario por meses -->
      @if (tab() === 'calendar') {
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 md:mb-4">
          <label class="flex items-center gap-2 text-xs text-[#a0a0a0] cursor-pointer select-none">
            <input type="checkbox" [ngModel]="onlyHighlighted()" (ngModelChange)="onlyHighlighted.set($event)" class="accent-[#7c3aed]" />
            Solo destacados
            <span class="text-[#404040]">(lo que más gente sigue en IGDB)</span>
          </label>
          <div class="flex items-center gap-2">
            <button class="px-3 py-1.5 rounded-lg bg-[#141414] border border-[#1f1f1f] text-[#a0a0a0] hover:text-white text-sm transition-colors active:scale-95 disabled:opacity-30"
              [disabled]="monthIndex() === 0" (click)="shiftMonth(-1)">←</button>
            <span class="text-sm text-white min-w-[130px] text-center font-medium">{{ months()[monthIndex()]?.label }}</span>
            <button class="px-3 py-1.5 rounded-lg bg-[#141414] border border-[#1f1f1f] text-[#a0a0a0] hover:text-white text-sm transition-colors active:scale-95 disabled:opacity-30"
              [disabled]="monthIndex() >= months().length - 1" (click)="shiftMonth(1)">→</button>
          </div>
        </div>
        @if (loading()) {
          <p class="text-sm text-[#606060]">Cargando…</p>
        } @else if (!monthItems().length) {
          <div class="rounded-xl border border-dashed border-[#1f1f1f] py-12 text-center text-sm text-[#666]">
            {{ onlyHighlighted() ? 'Nada destacado este mes. Quita "Solo destacados" para verlo todo.' : 'No sale nada este mes.' }}
          </div>
        } @else {
          <ng-container [ngTemplateOutlet]="grid" [ngTemplateOutletContext]="{ $implicit: monthItems() }" />
        }
      }

      <!-- Lo quiero -->
      @if (tab() === 'wanted') {
        @if (!wishCards().length) {
          <div class="rounded-xl border border-dashed border-[#1f1f1f] py-12 text-center text-sm text-[#666]">
            Aún no quieres nada. Pulsa el corazón en el calendario o búscalo en "Buscar".
          </div>
        } @else {
          <ng-container [ngTemplateOutlet]="grid" [ngTemplateOutletContext]="{ $implicit: wishCards() }" />
        }
      }

      <!-- Buscar en IGDB -->
      @if (tab() === 'search') {
        <input [(ngModel)]="query" (ngModelChange)="search()" type="text" autofocus
          placeholder="Buscar un juego en IGDB…"
          class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-[#303030] focus:outline-none focus:border-[#7c3aed] transition-colors mb-4" />
        @if (searching()) {
          <p class="text-sm text-[#606060]">Buscando…</p>
        } @else if (query.trim() && !searchCards().length) {
          <p class="text-sm text-[#606060]">No hay resultados.</p>
        } @else {
          <ng-container [ngTemplateOutlet]="grid" [ngTemplateOutletContext]="{ $implicit: searchCards() }" />
        }
      }
    </div>

    <!-- Rejilla de tarjetas -->
    <ng-template #grid let-items>
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
        @for (c of items; track c.igdb_id) {
          <div class="group cursor-pointer" (click)="selected.set(c)">
            <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#161616] mb-1.5">
              @if (c.cover_url) {
                <img [src]="c.cover_url" [alt]="c.title" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" draggable="false" />
              } @else {
                <div class="w-full h-full flex items-center justify-center p-3 text-center">
                  <p class="text-[10px] text-[#404040] leading-tight">{{ c.title }}</p>
                </div>
              }
              @if (c.owned_id) {
                <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#14532d] text-[#4ade80] tracking-wide">LO TIENES</span>
              } @else if (c.wanted) {
                <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#7c3aed] text-white tracking-wide flex items-center gap-0.5">
                  <svg class="w-2.5 h-2.5 fill-current shrink-0" viewBox="0 0 24 24"><path [attr.d]="heart"/></svg>LO QUIERO
                </span>
              } @else if (c.my_saga) {
                <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0c4a6e] text-[#38bdf8] tracking-wide">TU SAGA</span>
              }
              @if (!c.owned_id) {
                <button type="button" (click)="toggleWanted(c); $event.stopPropagation()" [disabled]="busy() === c.igdb_id"
                  class="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity disabled:opacity-50"
                  [class]="c.wanted ? 'text-[#a78bfa] opacity-100' : 'text-white opacity-0 group-hover:opacity-100 focus:opacity-100'"
                  [title]="c.wanted ? 'Ya no lo quiero' : 'Lo quiero'">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" [attr.fill]="c.wanted ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path [attr.d]="heart"/></svg>
                </button>
              }
              <span class="absolute bottom-1.5 left-1.5 bg-black/80 text-white text-[10px] font-semibold px-1.5 py-1 rounded-md leading-none backdrop-blur-sm">
                {{ label(c) }}
              </span>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl pointer-events-none"></div>
            </div>
            <p class="text-xs font-medium text-[#e0e0e0] group-hover:text-[#8b5cf6] truncate leading-tight transition-colors">{{ c.title }}</p>
            <p class="text-[10px] text-[#606060] truncate">{{ c.platforms.join(' · ') }}@if (c.kind) { · {{ c.kind }} }</p>
          </div>
        }
      </div>
    </ng-template>

    <!-- Ficha rápida de un lanzamiento -->
    @if (selected(); as c) {
      <div class="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" (click)="selected.set(null)">
        <div class="w-full sm:max-w-md bg-[#161616] border border-[#2a2a2a] rounded-t-2xl sm:rounded-2xl p-5" (click)="$event.stopPropagation()">
          <div class="flex gap-4">
            <div class="w-24 shrink-0 aspect-[3/4] rounded-xl overflow-hidden bg-[#0d0d0d]">
              @if (c.cover_url) { <img [src]="c.cover_url" [alt]="c.title" class="w-full h-full object-cover" /> }
            </div>
            <div class="min-w-0">
              <h3 class="text-base font-semibold text-white leading-snug">{{ c.title }}</h3>
              <p class="text-sm text-[#a0a0a0] mt-1">{{ label(c) }}</p>
              <p class="text-xs text-[#606060] mt-1">{{ c.platforms.join(' · ') }}@if (c.kind) { · {{ c.kind }} }</p>
              @if (c.my_saga) { <p class="text-xs text-[#38bdf8] mt-1">De tu saga: {{ c.my_saga }}</p> }
            </div>
          </div>
          <div class="flex flex-col gap-2 mt-5">
            @if (c.owned_id) {
              <button type="button" (click)="goOwned(c)"
                class="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors">Ver en tu colección</button>
            } @else {
              <button type="button" (click)="toggleWanted(c)" [disabled]="busy() === c.igdb_id"
                class="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                [class]="c.wanted ? 'bg-[#1f1f1f] text-[#a0a0a0] hover:text-white' : 'bg-[#7c3aed] text-white hover:bg-[#6d28d9]'">
                {{ c.wanted ? 'Ya no lo quiero' : 'Lo quiero' }}
              </button>
              <button type="button" (click)="haveIt(c)"
                class="w-full py-2.5 rounded-xl text-sm font-semibold text-[#d0d0d0] bg-[#0d0d0d] border border-[#2a2a2a] hover:border-[#7c3aed] transition-colors">
                Ya lo tengo: añadirlo a la colección
              </button>
            }
            <button type="button" (click)="selected.set(null)" class="w-full py-2 text-xs text-[#606060] hover:text-white">Cerrar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class GameNovedadesComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private location = inject(Location);

  readonly heart = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
  readonly tabs: { value: Tab; label: string }[] = [
    { value: 'mine', label: 'Mis novedades' },
    { value: 'calendar', label: 'Calendario' },
    { value: 'wanted', label: 'Lo quiero' },
    { value: 'search', label: 'Buscar' },
  ];

  tab = signal<Tab>('mine');
  releases = signal<GameRelease[]>([]);
  wishlist = signal<GameWish[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  busy = signal<number | null>(null);
  selected = signal<Card | null>(null);
  onlyHighlighted = signal(true);
  monthIndex = signal(0);

  query = '';
  searchResults = signal<IgdbSearchResult[]>([]);
  searching = signal(false);
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly today = new Date().toISOString().slice(0, 10);

  ngOnInit() {
    const t = this.route.snapshot.queryParamMap.get('tab') as Tab | null;
    if (t && this.tabs.some(x => x.value === t)) this.tab.set(t);
    this.api.get<{ data: GameWish[] }>('/games/wishlist').subscribe({ next: r => this.wishlist.set(r.data) });
    this.api.get<{ data: GameRelease[] }>('/games/releases').subscribe({
      next: r => {
        this.releases.set(r.data);
        this.loading.set(false);
        // El calendario empieza en el mes en curso.
        const i = this.months().findIndex(m => m.key === this.today.slice(0, 7));
        this.monthIndex.set(Math.max(0, i));
      },
      error: (e: HttpErrorResponse) => { this.loading.set(false); this.error.set(e.error?.error ?? 'No se pudo cargar el calendario'); },
    });
  }

  setTab(t: Tab) {
    this.tab.set(t);
    this.router.navigate([], { queryParams: { tab: t === 'mine' ? null : t }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  back() {
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/app/games']);
  }

  label = (c: Card) => releaseLabel(c.date, c.precision);

  // ── Tarjetas ──

  private wantedIds = computed(() => new Set(this.wishlist().map(w => w.igdb_id)));

  private fromRelease = (r: GameRelease): Card => ({
    igdb_id: r.igdb_id, title: r.title, cover_url: r.cover_url, platforms: r.platforms, date: r.date,
    precision: r.precision, kind: r.kind, owned_id: r.owned_id, wanted: this.wantedIds().has(r.igdb_id), my_saga: r.my_saga,
  });

  private fromWish = (w: GameWish): Card => ({
    igdb_id: w.igdb_id, title: w.title, cover_url: w.cover_url, platforms: w.platforms ? w.platforms.split(',') : [],
    date: w.release_date, precision: w.release_precision ?? 7, kind: null, owned_id: null, wanted: true, my_saga: null,
  });

  /** Mes al que va una tarjeta en el calendario: con día o mes, el suyo; si no, "sin fecha exacta". */
  private monthKey = (c: Card) => (c.date && c.precision <= 1 ? c.date.slice(0, 7) : TBD);

  private byDate = (a: Card, b: Card) => (a.date ?? '9999').localeCompare(b.date ?? '9999') || a.title.localeCompare(b.title);

  private group(cards: Card[]): Group[] {
    const groups = new Map<string, Card[]>();
    for (const c of [...cards].sort(this.byDate)) groups.set(this.monthKey(c), [...(groups.get(this.monthKey(c)) ?? []), c]);
    return [...groups.entries()]
      .sort(([a], [b]) => (a === TBD ? 1 : b === TBD ? -1 : a.localeCompare(b)))
      .map(([key, items]) => ({ key, label: key === TBD ? 'Sin fecha exacta' : monthLabel(key), items }));
  }

  /** Lo que quiero y aún no ha salido, más lo nuevo de mis sagas que no tengo. */
  mineGroups = computed(() => {
    const cards = new Map<number, Card>();
    for (const w of this.wishlist()) {
      const c = this.fromWish(w);
      if (!this.isOut(c)) cards.set(c.igdb_id, c);
    }
    for (const r of this.releases()) {
      if (!r.my_saga || r.owned_id || cards.has(r.igdb_id)) continue;
      const c = this.fromRelease(r);
      if (!this.isOut(c) || c.wanted) cards.set(c.igdb_id, c);
    }
    return this.group([...cards.values()].filter(c => !this.isOut(c)));
  });

  /** Lo que quiero y ya está a la venta. */
  mineOut = computed(() => this.wishlist().map(this.fromWish).filter(c => this.isOut(c)).sort(this.byDate).reverse());

  private isOut(c: Card) {
    return c.precision === 0 && !!c.date && c.date < this.today;
  }

  months = computed(() => {
    const keys = new Set(this.releases().map(r => this.monthKey(this.fromRelease(r))));
    keys.add(this.today.slice(0, 7));
    return [...keys].sort((a, b) => (a === TBD ? 1 : b === TBD ? -1 : a.localeCompare(b)))
      .map(key => ({ key, label: key === TBD ? 'Sin fecha exacta' : monthLabel(key) }));
  });

  monthItems = computed(() => {
    const key = this.months()[this.monthIndex()]?.key;
    return this.releases().map(this.fromRelease)
      .filter(c => this.monthKey(c) === key)
      .filter(c => !this.onlyHighlighted() || c.owned_id || c.wanted || c.my_saga
        || (this.releases().find(r => r.igdb_id === c.igdb_id)?.hypes ?? 0) > HYPE_MIN)
      .sort(this.byDate);
  });

  shiftMonth(d: number) {
    this.monthIndex.set(Math.min(this.months().length - 1, Math.max(0, this.monthIndex() + d)));
  }

  wishCards = computed(() => this.wishlist().map(this.fromWish).sort(this.byDate));

  searchCards = computed(() => this.searchResults().map((r): Card => ({
    igdb_id: r.igdb_id, title: r.title, cover_url: r.cover_url, platforms: r.platforms,
    date: r.year ? `${r.year}-12-31` : null, precision: r.year ? 2 : 7, kind: r.kind,
    owned_id: r.local_id, wanted: this.wantedIds().has(r.igdb_id), my_saga: null,
  })));

  search() {
    clearTimeout(this.searchTimer);
    const q = this.query.trim();
    if (!q) { this.searchResults.set([]); return; }
    this.searchTimer = setTimeout(() => {
      this.searching.set(true);
      this.api.get<{ data: IgdbSearchResult[] }>('/games/igdb/search', { q }).subscribe({
        next: r => { this.searchResults.set(r.data); this.searching.set(false); },
        error: () => { this.searchResults.set([]); this.searching.set(false); },
      });
    }, 400);
  }

  // ── Acciones ──

  toggleWanted(c: Card) {
    if (c.owned_id || this.busy()) return;
    this.busy.set(c.igdb_id);
    this.error.set(null);
    const done = () => {
      this.busy.set(null);
      const s = this.selected();
      if (s?.igdb_id === c.igdb_id) this.selected.set({ ...s, wanted: this.wantedIds().has(c.igdb_id) });
    };
    if (c.wanted) {
      this.api.delete(`/games/wishlist/${c.igdb_id}`).subscribe({
        next: () => { this.wishlist.set(this.wishlist().filter(w => w.igdb_id !== c.igdb_id)); done(); },
        error: () => { this.error.set('No se pudo quitar'); done(); },
      });
    } else {
      this.api.post<GameWish>('/games/wishlist', { igdb_id: c.igdb_id }).subscribe({
        next: w => { this.wishlist.set([...this.wishlist().filter(x => x.igdb_id !== w.igdb_id), w]); done(); },
        error: (e: HttpErrorResponse) => { this.error.set(e.error?.error ?? 'No se pudo añadir'); done(); },
      });
    }
  }

  haveIt(c: Card) {
    this.router.navigate(['/app/games/new'], { queryParams: { igdb: c.igdb_id } });
  }

  goOwned(c: Card) {
    if (c.owned_id) this.router.navigate(['/app/games', c.owned_id]);
  }
}
