import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService, PaginatedResponse } from '../../../shared/services/api.service';
import { Game, TrophyList, TrophyStatus } from '../../../shared/models/game.model';
import { TrophyListRowComponent } from '../trophy-list-row/trophy-list-row.component';

type Tab = 'pending' | 'linked' | 'ignored';

/**
 * Las listas de trofeos de PSN y su enlace con los juegos de la colección.
 * La sincronización diaria enlaza sola las que coinciden por título; aquí se
 * resuelven las demás: añadir el juego, vincularla a uno que ya está, o
 * ignorarla (demos, juegos prestados...).
 */
@Component({
  selector: 'app-game-trophies',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, TrophyListRowComponent],
  template: `
    <div class="p-4 md:p-8 max-w-4xl mx-auto">

      <div class="flex items-start justify-between gap-3 mb-6">
        <div class="flex items-center gap-4 min-w-0">
          <a routerLink="/app/games"
            class="p-2 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors shrink-0">
            <svg class="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </a>
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-white tracking-tight">Trofeos</h1>
            @if (status(); as s) {
              <p class="text-[#606060] text-xs mt-0.5">
                {{ s.total }} listas · {{ s.platinums }} platinos ·
                @if (s.synced_at) { sincronizado {{ utc(s.synced_at) | date:'d/M/yyyy HH:mm' }} } @else { sin sincronizar }
              </p>
            }
          </div>
        </div>
        <button type="button" (click)="sync()" [disabled]="syncing() || status()?.connected === false"
          class="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-sm rounded-xl
                 px-4 py-2.5 transition-colors disabled:opacity-40 shrink-0">
          <svg class="w-4 h-4" [class.animate-spin]="syncing()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span class="hidden sm:inline">@if (syncing()) { Sincronizando... } @else { Sincronizar }</span>
        </button>
      </div>

      @if (message(); as m) {
        <p class="text-xs mb-4" [class]="m.ok ? 'text-[#22c55e]' : 'text-[#ef4444]'">{{ m.text }}</p>
      }
      @if (status()?.connected === false) {
        <p class="text-xs text-[#f59e0b] mb-4">El Worker no tiene acceso a Trofeos (falta el binding TROFEOS).</p>
      }

      <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-0.5 self-start">
          @for (t of tabs; track t.value) {
            <button (click)="setTab(t.value)"
              class="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
              [class]="tab() === t.value ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              {{ t.label }}@if (count(t.value); as n) { <span class="opacity-60"> {{ n }}</span> }
            </button>
          }
        </div>
        <div class="relative flex-1">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#404040]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input [(ngModel)]="query" (ngModelChange)="onQuery()" type="text" placeholder="Buscar lista..."
            class="w-full bg-[#161616] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2 text-sm text-white
                   placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
        </div>
      </div>

      @if (tab() === 'pending' && lists().length) {
        <p class="text-[11px] text-[#606060] mb-3">
          Juegos con trofeos que no están en tu colección, o cuyo nombre no coincide. Añádelos, vincúlalos a uno que ya tengas, o ignóralos.
        </p>
      }

      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="w-7 h-7 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (!lists().length) {
        <p class="text-center text-sm text-[#606060] py-16">
          @if (query) { Ninguna lista coincide. }
          @else if (tab() === 'pending') { @if (status()?.total) { Todas las listas están resueltas. } @else { Aún no hay listas: pulsa Sincronizar. } }
          @else { No hay ninguna. }
        </p>
      } @else {
        <ul class="space-y-2">
          @for (l of lists(); track l.id) {
            <li class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-3 md:p-4">
              <app-trophy-list-row [list]="l" />

              <div class="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 mt-2 text-xs">
                @if (tab() === 'linked') {
                  <a [routerLink]="['/app/games', l.game_id]" class="mr-auto text-[#a0a0a0] hover:text-white truncate">
                    → {{ l.game_title }}@if (l.link_state === 'auto') { <span class="text-[#404040]"> (automático)</span> }
                  </a>
                  <button type="button" (click)="unlink(l)" class="text-[#606060] hover:text-[#ef4444]">Desvincular</button>
                } @else if (tab() === 'ignored') {
                  <button type="button" (click)="setIgnored(l, false)" class="text-[#8b5cf6] hover:text-[#a78bfa]">Recuperar</button>
                } @else {
                  <button type="button" (click)="setIgnored(l, true)" class="text-[#606060] hover:text-[#a0a0a0]">Ignorar</button>
                  <button type="button" (click)="startLink(l)" class="text-[#8b5cf6] hover:text-[#a78bfa]">Vincular a un juego</button>
                  <a routerLink="/app/games/new" [queryParams]="{ q: cleanTitle(l.title), trophyList: l.id }"
                    class="px-3 py-1.5 rounded-lg font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] transition-colors">
                    Añadir juego
                  </a>
                }
              </div>

              @if (linkingId() === l.id) {
                <div class="mt-3 pt-3 border-t border-[#1e1e1e]">
                  <input [(ngModel)]="gameQuery" (ngModelChange)="searchGames()" type="text" autofocus
                    placeholder="Busca el juego en tu colección..."
                    class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3.5 py-2 text-sm text-white
                           placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed]" />
                  <ul class="mt-2">
                    @for (g of gameResults(); track g.id) {
                      <li>
                        <button type="button" (click)="link(l, g)"
                          class="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-[#1f1f1f] text-left">
                          <div class="w-7 h-9 rounded overflow-hidden bg-[#0d0d0d] shrink-0">
                            @if (g.cover_url) { <img [src]="g.cover_url" alt="" class="w-full h-full object-cover" /> }
                          </div>
                          <span class="text-sm text-[#d0d0d0] truncate">{{ g.title }}</span>
                          <span class="text-[10px] text-[#606060] shrink-0">{{ g.platforms.join(' · ') }}</span>
                        </button>
                      </li>
                    } @empty {
                      <li class="text-xs text-[#606060] px-2 py-2">@if (gameQuery.trim()) { No está en tu colección: usa «Añadir juego». }</li>
                    }
                  </ul>
                </div>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class GameTrophiesComponent implements OnInit {
  private api = inject(ApiService);

  readonly tabs: { value: Tab; label: string }[] = [
    { value: 'pending', label: 'Sin vincular' },
    { value: 'linked', label: 'Vinculadas' },
    { value: 'ignored', label: 'Ignoradas' },
  ];

  status = signal<TrophyStatus | null>(null);
  tab = signal<Tab>('pending');
  lists = signal<TrophyList[]>([]);
  loading = signal(true);
  syncing = signal(false);
  message = signal<{ ok: boolean; text: string } | null>(null);
  query = '';

  linkingId = signal<number | null>(null);
  gameQuery = '';
  gameResults = signal<Game[]>([]);

  private timer: ReturnType<typeof setTimeout> | undefined;
  private gameTimer: ReturnType<typeof setTimeout> | undefined;

  ngOnInit() {
    this.loadStatus();
    this.loadLists();
  }

  count(t: Tab): number {
    const s = this.status();
    if (!s) return 0;
    return t === 'pending' ? s.pending : t === 'linked' ? s.linked : s.ignored;
  }

  setTab(t: Tab) {
    this.tab.set(t);
    this.linkingId.set(null);
    this.loadLists();
  }

  onQuery() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.loadLists(), 300);
  }

  /** "2026-11-25 06:30:00" (UTC de SQLite) → ISO que entiende cualquier navegador. */
  utc(s: string) {
    return s.replace(' ', 'T') + 'Z';
  }

  /** "Gran Turismo™ 7" → "Gran Turismo 7", para buscarlo en IGDB. */
  cleanTitle(t: string) {
    return t.replace(/[™®©]/g, '').replace(/\s+/g, ' ').trim();
  }

  sync() {
    this.syncing.set(true);
    this.message.set(null);
    this.api.post<{ lists: number; linked: number; platinumsApplied: number }>('/games/trophies/sync', {}).subscribe({
      next: r => {
        this.syncing.set(false);
        const parts = [`${r.lists} listas leídas`];
        if (r.linked) parts.push(`${r.linked} vinculadas solas`);
        if (r.platinumsApplied) parts.push(`${r.platinumsApplied} juegos pasados por el platino`);
        this.message.set({ ok: true, text: parts.join(' · ') });
        this.loadStatus();
        this.loadLists();
      },
      error: (e: HttpErrorResponse) => {
        this.syncing.set(false);
        this.message.set({ ok: false, text: e.error?.error ?? 'No se pudo sincronizar' });
      },
    });
  }

  startLink(l: TrophyList) {
    this.linkingId.set(this.linkingId() === l.id ? null : l.id);
    this.gameQuery = this.cleanTitle(l.title).split(/[\s:]+/).find(w => w.length > 3) ?? '';
    this.gameResults.set([]);
    if (this.gameQuery) this.searchGames();
  }

  searchGames() {
    clearTimeout(this.gameTimer);
    const q = this.gameQuery.trim();
    if (!q) { this.gameResults.set([]); return; }
    this.gameTimer = setTimeout(() => {
      this.api.get<PaginatedResponse<Game>>('/games', { search: q, limit: 8, sort: 'title', order: 'asc' })
        .subscribe({ next: r => this.gameResults.set(r.data) });
    }, 250);
  }

  link(l: TrophyList, g: Game) {
    this.api.put(`/games/trophies/lists/${l.id}`, { game_id: g.id }).subscribe({
      next: () => {
        this.linkingId.set(null);
        this.message.set({ ok: true, text: `«${l.title}» vinculada a ${g.title}` });
        this.refresh();
      },
    });
  }

  unlink(l: TrophyList) {
    this.api.put(`/games/trophies/lists/${l.id}`, { game_id: null }).subscribe({ next: () => this.refresh() });
  }

  setIgnored(l: TrophyList, ignored: boolean) {
    this.api.put(`/games/trophies/lists/${l.id}`, { ignored }).subscribe({ next: () => this.refresh() });
  }

  private refresh() {
    this.loadStatus();
    this.loadLists();
  }

  private loadStatus() {
    this.api.get<TrophyStatus>('/games/trophies/status').subscribe({ next: s => this.status.set(s) });
  }

  private loadLists() {
    this.loading.set(true);
    const params: Record<string, string> = { state: this.tab() };
    if (this.query.trim()) params['q'] = this.query.trim();
    this.api.get<{ data: TrophyList[] }>('/games/trophies/lists', params).subscribe({
      next: r => { this.lists.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
