import { Component, inject, OnInit, signal } from '@angular/core';
import { Location, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../../shared/services/api.service';
import { CoversService } from '../../../shared/services/covers.service';
import {
  Game, GameCopy, GameCopyDraft, GameStatus, GAME_FORMAT_LABEL, GAME_STATUS_LABEL, GAME_STATUS_STYLE, emptyCopy,
} from '../../../shared/models/game.model';
import { GameCopyEditorComponent } from '../game-copy-editor/game-copy-editor.component';

type GameEdit = Pick<Game, 'title' | 'cover_url' | 'summary' | 'genres' | 'developer' | 'publisher' | 'franchise' | 'first_release_date'>;

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [FormsModule, DatePipe, GameCopyEditorComponent],
  template: `
    <div class="p-4 md:p-8 max-w-5xl mx-auto">

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      @if (!loading() && game(); as g) {
        <!-- Volver + acciones -->
        <div class="flex items-center justify-between mb-5 md:mb-8">
          <button (click)="goBack()" class="flex items-center gap-2 text-sm text-[#606060] hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver
          </button>
          <div class="flex items-center gap-2">
            @if (!editing()) {
              <button (click)="startEditing()" type="button"
                class="px-3 md:px-4 py-2 rounded-xl text-sm bg-[#161616] border border-[#2a2a2a] text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f] transition-colors">
                Editar
              </button>
              <button (click)="confirmDelete()" type="button"
                class="px-3 md:px-4 py-2 rounded-xl text-sm bg-[#ef444411] border border-[#ef444433] text-[#ef4444] hover:bg-[#ef444422] transition-colors">
                Eliminar
              </button>
            } @else {
              <button (click)="editing.set(false)" type="button"
                class="px-4 py-2 rounded-xl text-sm bg-[#161616] border border-[#2a2a2a] text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f] transition-colors">
                Cancelar
              </button>
              <button (click)="saveEdit()" [disabled]="saving() || !edit.title.trim()" type="button"
                class="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40 transition-colors">
                @if (saving()) { Guardando... } @else { Guardar }
              </button>
            }
          </div>
        </div>

        @if (error()) {
          <p class="text-sm text-[#ef4444] mb-4">{{ error() }}</p>
        }

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">

          <!-- Portada + estado -->
          <div class="md:col-span-1 space-y-4">
            <div class="flex gap-4 md:block md:space-y-4">
              <div class="w-28 shrink-0 md:w-full">
                <div class="aspect-[3/4] rounded-2xl overflow-hidden bg-[#161616] border border-[#1e1e1e] flex items-center justify-center">
                  @if (editing() ? edit.cover_url : g.cover_url) {
                    <img [src]="(editing() ? edit.cover_url : g.cover_url)!" [alt]="g.title" class="w-full h-full object-cover" />
                  } @else {
                    <span class="text-xs text-[#404040]">Sin portada</span>
                  }
                </div>
              </div>

              <div class="flex-1 min-w-0 space-y-4">
                <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
                  <p class="text-[10px] text-[#606060] uppercase tracking-wider font-semibold mb-2">Estado</p>
                  <div class="grid grid-cols-2 gap-1.5">
                    @for (s of statuses; track s) {
                      <button type="button" (click)="setStatus(s)" [disabled]="saving()"
                        class="px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                        [class]="g.status === s ? statusStyle[s] : 'text-[#606060] border-transparent hover:text-[#a0a0a0] hover:bg-[#1f1f1f]'">
                        {{ statusLabel[s] }}
                      </button>
                    }
                  </div>
                  @if (g.status === 'completed') {
                    <div class="mt-3 pt-3 border-t border-[#1e1e1e]">
                      <label class="block text-[10px] text-[#606060] mb-1">
                        Pasado el{{ g.completed_source === 'platinum' ? ' (por el platino)' : '' }}
                      </label>
                      <input type="date" [ngModel]="g.completed_at?.slice(0, 10)" (ngModelChange)="setCompletedAt($event)"
                        class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#7c3aed]" />
                    </div>
                  }
                </div>

                <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
                  <p class="text-[10px] text-[#606060] uppercase tracking-wider font-semibold mb-1.5">Valoración</p>
                  <div class="flex gap-1">
                    @for (star of [1,2,3,4,5]; track star) {
                      <button type="button" (click)="setRating(star)"
                        class="text-xl transition-colors"
                        [class]="(g.rating ?? 0) >= star ? 'text-[#f59e0b]' : 'text-[#2a2a2a] hover:text-[#4a4a4a]'">★</button>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
              <p class="text-[10px] text-[#606060] uppercase tracking-wider font-semibold mb-1.5">Notas</p>
              <textarea [(ngModel)]="notes" (blur)="saveNotes()" rows="3" placeholder="Apuntes, opinión..."
                class="w-full bg-transparent text-sm text-[#d0d0d0] placeholder:text-[#404040] resize-none focus:outline-none"></textarea>
            </div>
          </div>

          <!-- Ficha + copias -->
          <div class="md:col-span-2 space-y-5">
            @if (!editing()) {
              <div>
                <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">{{ g.title }}</h1>
                <p class="text-sm text-[#606060] mt-1">
                  {{ g.platforms.join(' · ') || 'Sin copias' }}
                  @if (g.franchise) { · {{ g.franchise }} }
                </p>
              </div>

              <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5 grid grid-cols-2 gap-4 text-sm">
                <div><p class="info-label">Desarrolladora</p><p class="info-value">{{ g.developer || '—' }}</p></div>
                <div><p class="info-label">Distribuidora</p><p class="info-value">{{ g.publisher || '—' }}</p></div>
                <div><p class="info-label">Salida</p><p class="info-value">{{ g.first_release_date ? (g.first_release_date | date:'d MMM y') : '—' }}</p></div>
                <div><p class="info-label">Géneros</p><p class="info-value">{{ g.genres || '—' }}</p></div>
                @if (g.summary) {
                  <div class="col-span-2">
                    <p class="info-label">Resumen</p>
                    <p class="text-[#a0a0a0] leading-relaxed whitespace-pre-line">{{ g.summary }}</p>
                  </div>
                }
                @if (g.igdb_url) {
                  <div class="col-span-2">
                    <a [href]="g.igdb_url" target="_blank" rel="noopener" class="text-xs text-[#8b5cf6] hover:text-[#a78bfa]">Ver en IGDB →</a>
                  </div>
                }
              </div>
            } @else {
              <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5 grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="field-label">Título</label>
                  <input [(ngModel)]="edit.title" type="text" class="field-input" />
                </div>
                <div class="col-span-2">
                  <label class="field-label">URL de portada</label>
                  <input [(ngModel)]="edit.cover_url" type="url" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Saga</label>
                  <input [(ngModel)]="edit.franchise" type="text" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Salida</label>
                  <input [(ngModel)]="edit.first_release_date" type="date" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Desarrolladora</label>
                  <input [(ngModel)]="edit.developer" type="text" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Distribuidora</label>
                  <input [(ngModel)]="edit.publisher" type="text" class="field-input" />
                </div>
                <div class="col-span-2">
                  <label class="field-label">Géneros</label>
                  <input [(ngModel)]="edit.genres" type="text" class="field-input" />
                </div>
                <div class="col-span-2">
                  <label class="field-label">Resumen</label>
                  <textarea [(ngModel)]="edit.summary" rows="5" class="field-input resize-none"></textarea>
                </div>
              </div>
            }

            <!-- Copias -->
            <section class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xs text-[#606060] uppercase tracking-wider font-semibold">Lo que tengo</h2>
                @if (!copyDraft()) {
                  <button type="button" (click)="newCopy()" class="text-xs text-[#8b5cf6] hover:text-[#a78bfa]">+ Añadir copia</button>
                }
              </div>

              @if (!g.copies?.length && !copyDraft()) {
                <p class="text-xs text-[#606060]">No hay copias. Añade la plataforma y el formato en que lo tienes.</p>
              }

              <div class="space-y-2">
                @for (c of g.copies ?? []; track c.id) {
                  @if (editingCopyId() === c.id && copyDraft(); as d) {
                    <div class="border border-[#7c3aed]/40 rounded-xl p-4">
                      <app-game-copy-editor [copy]="d" [suggested]="g.platforms" />
                      <div class="flex justify-end gap-2 mt-4">
                        <button type="button" (click)="cancelCopy()" class="px-3 py-1.5 rounded-lg text-xs text-[#a0a0a0] hover:text-white">Cancelar</button>
                        <button type="button" (click)="saveCopy()" [disabled]="saving()"
                          class="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40">Guardar</button>
                      </div>
                    </div>
                  } @else {
                    <div class="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-[#0d0d0d] border border-[#1e1e1e]">
                      <span class="text-[11px] font-bold px-2 py-1 rounded-md bg-[#1f1f1f] text-white shrink-0 w-11 text-center">{{ c.platform }}</span>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-[#d0d0d0] truncate">
                          {{ formatLabel[c.format] }} · {{ c.edition || 'Estándar' }}
                          @if (c.is_free) { <span class="text-[10px] font-semibold text-[#22c55e] ml-1">GRATIS</span> }
                        </p>
                        <p class="text-[11px] text-[#606060] truncate">
                          {{ copySummary(c) }}
                        </p>
                      </div>
                      <button type="button" (click)="editCopy(c)" class="p-1.5 text-[#606060] hover:text-white" title="Editar copia">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button type="button" (click)="deleteCopy(c)" class="p-1.5 text-[#606060] hover:text-[#ef4444]" title="Quitar copia">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  }
                }

                @if (editingCopyId() === null && copyDraft(); as d) {
                  <div class="border border-[#7c3aed]/40 rounded-xl p-4">
                    <app-game-copy-editor [copy]="d" [suggested]="g.platforms" />
                    <div class="flex justify-end gap-2 mt-4">
                      <button type="button" (click)="cancelCopy()" class="px-3 py-1.5 rounded-lg text-xs text-[#a0a0a0] hover:text-white">Cancelar</button>
                      <button type="button" (click)="saveCopy()" [disabled]="saving()"
                        class="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40">Añadir</button>
                    </div>
                  </div>
                }
              </div>
            </section>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .info-label { @apply text-[10px] text-[#606060] uppercase tracking-wider mb-0.5; }
    .info-value { @apply text-[#d0d0d0]; }
    .field-label { @apply block text-xs font-medium text-[#606060] mb-1.5; }
    .field-input {
      @apply w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-sm text-white
             placeholder:text-[#303030] focus:outline-none focus:border-[#7c3aed] transition-colors duration-200;
    }
  `],
})
export class GameDetailComponent implements OnInit {
  private api = inject(ApiService);
  private covers = inject(CoversService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  readonly statuses: GameStatus[] = ['pending', 'playing', 'completed', 'abandoned'];
  readonly statusLabel = GAME_STATUS_LABEL;
  readonly statusStyle = GAME_STATUS_STYLE;
  readonly formatLabel = GAME_FORMAT_LABEL;

  game = signal<Game | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  editing = signal(false);
  edit: GameEdit = { title: '', cover_url: null, summary: null, genres: null, developer: null, publisher: null, franchise: null, first_release_date: null };
  notes = '';

  copyDraft = signal<GameCopyDraft | null>(null);
  editingCopyId = signal<number | null>(null);

  private id = 0;

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    const addCopy = this.route.snapshot.queryParamMap.get('addCopy');
    this.load(() => { if (addCopy) this.newCopy(); });
  }

  private load(after?: () => void) {
    this.api.get<Game>(`/games/${this.id}`).subscribe({
      next: g => {
        this.game.set(g);
        this.notes = g.notes ?? '';
        this.loading.set(false);
        after?.();
      },
      error: () => { this.loading.set(false); this.router.navigate(['/app/games']); },
    });
  }

  goBack() {
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/app/games']);
  }

  copySummary(c: GameCopy) {
    const parts: string[] = [];
    if (c.acquired_at) parts.push(new Date(c.acquired_at).toLocaleDateString('es-ES'));
    if (c.price != null && !c.is_free) parts.push(`${c.price.toFixed(2).replace('.', ',')} €`);
    if (c.store) parts.push(c.store);
    if (c.ean) parts.push(`EAN ${c.ean}`);
    if (c.source === 'psn') parts.push('importado de PSN');
    return parts.join(' · ') || 'Sin datos de compra';
  }

  /** PUT de la ficha completa con los cambios indicados. */
  private update(changes: Partial<Game>, done?: () => void) {
    const g = this.game();
    if (!g) return;
    this.saving.set(true);
    this.error.set(null);
    const { copies: _c, platforms: _p, formats: _f, copies_count: _n, ...base } = g;
    this.api.put(`/games/${g.id}`, { ...base, ...changes }).subscribe({
      next: () => { this.saving.set(false); done?.(); this.load(); },
      error: (e: HttpErrorResponse) => { this.saving.set(false); this.error.set(e.error?.error ?? 'No se pudo guardar'); },
    });
  }

  setStatus(s: GameStatus) {
    if (this.game()?.status === s) return;
    // Al pasar a "Pasado" la fecha la pone el servidor (hoy); al salir, se borra.
    this.update({ status: s, completed_at: null, completed_source: null });
  }

  setCompletedAt(date: string) {
    if (!date) return;
    this.update({ completed_at: date });
  }

  setRating(n: number) {
    this.update({ rating: this.game()?.rating === n ? null : n });
  }

  saveNotes() {
    const g = this.game();
    if (!g || (g.notes ?? '') === this.notes) return;
    this.update({ notes: this.notes || null });
  }

  startEditing() {
    const g = this.game()!;
    this.edit = {
      title: g.title, cover_url: g.cover_url, summary: g.summary, genres: g.genres, developer: g.developer,
      publisher: g.publisher, franchise: g.franchise, first_release_date: g.first_release_date,
    };
    this.editing.set(true);
  }

  saveEdit() {
    const cover = this.edit.cover_url;
    const send = (url: string | null) => this.update({ ...this.edit, cover_url: url }, () => this.editing.set(false));
    if (cover && !this.covers.isStored(cover)) {
      this.covers.persist(cover).subscribe({ next: send, error: () => send(cover) });
    } else {
      send(cover);
    }
  }

  confirmDelete() {
    const g = this.game();
    if (!g || !confirm(`¿Eliminar "${g.title}" y sus copias?`)) return;
    this.api.delete(`/games/${g.id}`).subscribe({ next: () => this.router.navigate(['/app/games']) });
  }

  // ── Copias ──

  newCopy() {
    const g = this.game();
    const last = g?.copies?.at(-1);
    this.editingCopyId.set(null);
    this.copyDraft.set(emptyCopy(last?.platform ?? g?.platforms.at(-1) ?? 'PS5'));
  }

  editCopy(c: GameCopy) {
    const { id: _id, game_id: _g, ...draft } = c;
    this.editingCopyId.set(c.id);
    this.copyDraft.set({ ...draft });
  }

  cancelCopy() {
    this.copyDraft.set(null);
    this.editingCopyId.set(null);
  }

  saveCopy() {
    const d = this.copyDraft();
    if (!d) return;
    const body = { ...d, price: d.is_free ? null : d.price };
    const id = this.editingCopyId();
    const req = id === null
      ? this.api.post(`/games/${this.id}/copies`, body)
      : this.api.put(`/games/copies/${id}`, body);
    this.saving.set(true);
    req.subscribe({
      next: () => { this.saving.set(false); this.cancelCopy(); this.load(); },
      error: (e: HttpErrorResponse) => { this.saving.set(false); this.error.set(e.error?.error ?? 'No se pudo guardar la copia'); },
    });
  }

  deleteCopy(c: GameCopy) {
    if (!confirm(`¿Quitar la copia de ${c.platform} (${this.formatLabel[c.format].toLowerCase()})?`)) return;
    this.api.delete(`/games/copies/${c.id}`).subscribe({ next: () => this.load() });
  }
}
