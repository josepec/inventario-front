import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { CoversService } from '../../../shared/services/covers.service';
import {
  GameCopyDraft, GamePlatform, GameStatus, GAME_STATUS_LABEL, IgdbGameDetail, IgdbSearchResult, emptyCopy,
} from '../../../shared/models/game.model';
import { GameCopyEditorComponent } from '../game-copy-editor/game-copy-editor.component';

interface Draft {
  igdb_id: number | null;
  title: string;
  cover_url: string | null;
  summary: string | null;
  genres: string | null;
  developer: string | null;
  publisher: string | null;
  franchise: string | null;
  first_release_date: string | null;
  igdb_url: string | null;
  status: GameStatus;
  rating: number | null;
  notes: string | null;
}

const emptyDraft = (): Draft => ({
  igdb_id: null, title: '', cover_url: null, summary: null, genres: null, developer: null, publisher: null,
  franchise: null, first_release_date: null, igdb_url: null, status: 'pending', rating: null, notes: null,
});

/** La copia por defecto: la consola más nueva en la que salió (PSP solo si no hay otra). */
function defaultPlatform(platforms: GamePlatform[]): GamePlatform {
  const home = platforms.filter(p => p !== 'PSP');
  return home.at(-1) ?? platforms[0] ?? 'PS5';
}

@Component({
  selector: 'app-game-form',
  standalone: true,
  imports: [RouterLink, FormsModule, GameCopyEditorComponent],
  template: `
    <div class="p-4 md:p-8 max-w-4xl mx-auto">

      <div class="flex items-center gap-4 mb-6 md:mb-8">
        <a routerLink="/app/games"
          class="p-2 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors">
          <svg class="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </a>
        <h1 class="text-2xl font-bold text-white tracking-tight">Añadir juego</h1>
      </div>

      @if (step() === 'search') {
        <!-- Paso 1: buscar en IGDB -->
        <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-6">
          <div class="relative">
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#404040]"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input [(ngModel)]="query" (ngModelChange)="onQuery()" autofocus
              type="text" placeholder="Busca el juego en IGDB (en inglés suele encontrar más)"
              class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-3 text-sm
                     text-white placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
          </div>

          @if (searching()) {
            <div class="flex justify-center py-10">
              <div class="w-6 h-6 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (searchError()) {
            <p class="text-sm text-[#ef4444] mt-4">{{ searchError() }}</p>
          } @else if (results().length) {
            <ul class="mt-4 divide-y divide-[#1e1e1e]">
              @for (r of results(); track r.igdb_id) {
                <li>
                  <button type="button" (click)="pick(r)" [disabled]="loadingDetail() === r.igdb_id"
                    class="w-full flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-xl text-left hover:bg-[#1f1f1f] transition-colors disabled:opacity-60">
                    <div class="w-10 h-[53px] shrink-0 rounded-md overflow-hidden bg-[#0d0d0d] border border-[#2a2a2a]">
                      @if (r.cover_url) { <img [src]="r.cover_url" alt="" class="w-full h-full object-cover" loading="lazy" /> }
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-white truncate">{{ r.title }}</p>
                      <p class="text-[11px] text-[#606060] truncate">
                        {{ r.year ?? 'Sin fecha' }} · {{ r.platforms.join(' · ') }}
                        @if (r.kind) { <span class="text-[#8b5cf6]"> · {{ r.kind }}</span> }
                      </p>
                    </div>
                    @if (r.local_id) {
                      <span class="text-[10px] font-semibold px-2 py-1 rounded-md bg-[#22c55e1a] text-[#22c55e] shrink-0">Ya lo tienes</span>
                    }
                    @if (loadingDetail() === r.igdb_id) {
                      <div class="w-4 h-4 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin shrink-0"></div>
                    }
                  </button>
                </li>
              }
            </ul>
          } @else if (query.trim().length >= 2) {
            <p class="text-sm text-[#606060] mt-4">Sin resultados en IGDB para PlayStation.</p>
          }

          <div class="mt-5 pt-4 border-t border-[#1e1e1e] text-center">
            <button type="button" (click)="manual()" class="text-xs text-[#8b5cf6] hover:text-[#a78bfa]">
              No está en IGDB: añadirlo a mano
            </button>
          </div>
        </div>
      } @else {
        <!-- Paso 2: ficha + copias -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-1">
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5 lg:sticky lg:top-8 space-y-4">
              <div class="aspect-[3/4] rounded-xl overflow-hidden bg-[#0d0d0d] border border-[#2a2a2a] flex items-center justify-center">
                @if (draft.cover_url) {
                  <img [src]="draft.cover_url" alt="Portada" class="w-full h-full object-cover" />
                } @else {
                  <p class="text-xs text-[#404040]">Sin portada</p>
                }
              </div>
              <div>
                <label class="field-label">URL de portada</label>
                <input [(ngModel)]="draft.cover_url" type="url" placeholder="https://..." class="field-input" />
              </div>
              <div>
                <label class="field-label">Estado</label>
                <select [(ngModel)]="draft.status" class="field-input">
                  @for (s of statuses; track s) { <option [value]="s">{{ statusLabel[s] }}</option> }
                </select>
              </div>
              <div>
                <label class="field-label">Valoración</label>
                <div class="flex gap-1">
                  @for (star of [1,2,3,4,5]; track star) {
                    <button type="button" (click)="draft.rating = draft.rating === star ? null : star"
                      class="text-xl transition-colors"
                      [class]="(draft.rating ?? 0) >= star ? 'text-[#f59e0b]' : 'text-[#2a2a2a]'">★</button>
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-2 space-y-6">
            <section class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5 md:p-6">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider">Juego</h2>
                <button type="button" (click)="backToSearch()" class="text-xs text-[#8b5cf6] hover:text-[#a78bfa]">Cambiar</button>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="field-label">Título <span class="text-[#ef4444]">*</span></label>
                  <input [(ngModel)]="draft.title" type="text" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Saga</label>
                  <input [(ngModel)]="draft.franchise" type="text" placeholder="Ej: Final Fantasy" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Salida</label>
                  <input [(ngModel)]="draft.first_release_date" type="date" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Desarrolladora</label>
                  <input [(ngModel)]="draft.developer" type="text" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Distribuidora</label>
                  <input [(ngModel)]="draft.publisher" type="text" class="field-input" />
                </div>
                <div class="col-span-2">
                  <label class="field-label">Géneros</label>
                  <input [(ngModel)]="draft.genres" type="text" placeholder="Ej: Rol, Aventura" class="field-input" />
                </div>
                <div class="col-span-2">
                  <label class="field-label">Resumen</label>
                  <textarea [(ngModel)]="draft.summary" rows="4" class="field-input resize-none"></textarea>
                </div>
              </div>
            </section>

            <section class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5 md:p-6">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider">Lo que tengo</h2>
                <button type="button" (click)="addCopy()" class="text-xs text-[#8b5cf6] hover:text-[#a78bfa]">+ Otra copia</button>
              </div>
              @if (copies().length === 0) {
                <p class="text-xs text-[#606060]">Sin copias: se guardará en la colección sin plataforma.</p>
              }
              <div class="space-y-5">
                @for (c of copies(); track $index; let i = $index) {
                  <div [class]="i > 0 ? 'pt-5 border-t border-[#1e1e1e]' : ''">
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-xs text-[#a0a0a0] font-medium">Copia {{ i + 1 }}</span>
                      <button type="button" (click)="removeCopy(i)" class="text-[11px] text-[#606060] hover:text-[#ef4444]">Quitar</button>
                    </div>
                    <app-game-copy-editor [copy]="c" [suggested]="igdbPlatforms()" />
                  </div>
                }
              </div>
            </section>

            @if (saveError()) {
              <p class="text-sm text-[#ef4444]">{{ saveError() }}</p>
            }

            <div class="flex items-center justify-end gap-3 pb-8">
              <a routerLink="/app/games"
                class="px-6 py-2.5 rounded-xl text-sm text-[#a0a0a0] hover:text-white bg-[#161616]
                       border border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors">Cancelar</a>
              <button type="button" (click)="save()" [disabled]="saving() || !draft.title.trim()"
                class="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7c3aed]
                       hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                @if (saving()) { Guardando... } @else { Añadir juego }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .field-label { @apply block text-xs font-medium text-[#606060] mb-1.5; }
    .field-input {
      @apply w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-sm text-white
             placeholder:text-[#303030] focus:outline-none focus:border-[#7c3aed] transition-colors duration-200;
    }
    select.field-input option { background: #161616; }
  `],
})
export class GameFormComponent {
  private api = inject(ApiService);
  private covers = inject(CoversService);
  private router = inject(Router);

  readonly statuses: GameStatus[] = ['pending', 'playing', 'completed', 'abandoned'];
  readonly statusLabel = GAME_STATUS_LABEL;

  step = signal<'search' | 'form'>('search');
  query = '';
  results = signal<IgdbSearchResult[]>([]);
  searching = signal(false);
  searchError = signal<string | null>(null);
  loadingDetail = signal<number | null>(null);

  draft: Draft = emptyDraft();
  copies = signal<GameCopyDraft[]>([]);
  igdbPlatforms = signal<GamePlatform[]>([]);
  saving = signal(false);
  saveError = signal<string | null>(null);

  private timer: ReturnType<typeof setTimeout> | undefined;
  private searchSeq = 0;

  onQuery() {
    clearTimeout(this.timer);
    const q = this.query.trim();
    if (q.length < 2) { this.results.set([]); this.searching.set(false); return; }
    this.timer = setTimeout(() => this.runSearch(q), 400);
  }

  private runSearch(q: string) {
    const seq = ++this.searchSeq;
    this.searching.set(true);
    this.searchError.set(null);
    this.api.get<{ data: IgdbSearchResult[] }>('/games/igdb/search', { q }).subscribe({
      next: res => { if (seq === this.searchSeq) { this.results.set(res.data); this.searching.set(false); } },
      error: (e: HttpErrorResponse) => {
        if (seq !== this.searchSeq) return;
        this.searching.set(false);
        this.searchError.set(e.error?.error ?? 'No se pudo buscar en IGDB');
      },
    });
  }

  pick(r: IgdbSearchResult) {
    if (r.local_id) {
      // Ya está en la colección: se le añade la copia en su ficha.
      this.router.navigate(['/app/games', r.local_id], { queryParams: { addCopy: 1 } });
      return;
    }
    this.loadingDetail.set(r.igdb_id);
    this.api.get<IgdbGameDetail>(`/games/igdb/${r.igdb_id}`).subscribe({
      next: d => {
        this.loadingDetail.set(null);
        this.draft = {
          ...emptyDraft(),
          igdb_id: d.igdb_id, title: d.title, cover_url: d.cover_url, summary: d.summary, genres: d.genres,
          developer: d.developer, publisher: d.publisher, franchise: d.franchise,
          first_release_date: d.first_release_date, igdb_url: d.igdb_url,
        };
        this.igdbPlatforms.set(d.platforms);
        this.copies.set([emptyCopy(defaultPlatform(d.platforms))]);
        this.step.set('form');
      },
      error: (e: HttpErrorResponse) => {
        this.loadingDetail.set(null);
        this.searchError.set(e.error?.error ?? 'No se pudo leer la ficha de IGDB');
      },
    });
  }

  manual() {
    this.draft = { ...emptyDraft(), title: this.query.trim() };
    this.igdbPlatforms.set([]);
    this.copies.set([emptyCopy()]);
    this.step.set('form');
  }

  backToSearch() {
    this.step.set('search');
    this.saveError.set(null);
  }

  addCopy() {
    const last = this.copies().at(-1);
    this.copies.set([...this.copies(), emptyCopy(last?.platform ?? defaultPlatform(this.igdbPlatforms()))]);
  }

  removeCopy(i: number) {
    this.copies.set(this.copies().filter((_, j) => j !== i));
  }

  async save() {
    if (!this.draft.title.trim()) return;
    this.saving.set(true);
    this.saveError.set(null);
    try {
      // La portada se copia a R2: las URLs de terceros cambian o desaparecen.
      const cover = this.draft.cover_url
        ? await firstValueFrom(this.covers.persist(this.draft.cover_url)).catch(() => this.draft.cover_url)
        : null;
      const copies = this.copies().map(c => ({ ...c, price: c.is_free ? null : c.price }));
      const res = await firstValueFrom(this.api.post<{ id: number }>('/games', { ...this.draft, cover_url: cover, copies }));
      this.router.navigate(['/app/games', res.id]);
    } catch (e) {
      this.saving.set(false);
      const err = e as HttpErrorResponse;
      if (err.status === 409 && err.error?.id) {
        this.router.navigate(['/app/games', err.error.id], { queryParams: { addCopy: 1 } });
        return;
      }
      this.saveError.set(err.error?.error ?? 'No se pudo guardar el juego');
    }
  }
}
