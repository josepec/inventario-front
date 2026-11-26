import { Component, inject, OnInit, signal } from '@angular/core';
import { Location, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { CoversService } from '../../../shared/services/covers.service';
import {
  Game, GameCopy, GameCopyDraft, GamePlatform, GameStatus, GAME_FORMAT_LABEL, GAME_PLATFORMS, GAME_STATUS_LABEL, TrophyList,
  IgdbGameDetail, IgdbSearchResult,
  GAME_STATUS_STYLE, emptyCopy,
} from '../../../shared/models/game.model';
import { GameCopyEditorComponent } from '../game-copy-editor/game-copy-editor.component';
import { TrophyListRowComponent } from '../trophy-list-row/trophy-list-row.component';
import { CoverPickerComponent } from '../../../shared/components/cover-picker/cover-picker.component';
import { GameIconComponent } from '../game-icon/game-icon.component';

type GameEdit = Pick<Game, 'igdb_id' | 'igdb_url' | 'title' | 'cover_url' | 'summary' | 'genres' | 'developer' | 'publisher' | 'franchise' | 'first_release_date'>;

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [FormsModule, DatePipe, GameCopyEditorComponent, TrophyListRowComponent, CoverPickerComponent, GameIconComponent],
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
                <button type="button" (click)="pickerOpen.set(true)" [disabled]="savingCover()"
                  class="w-full mt-2 py-1.5 rounded-xl text-xs text-[#a0a0a0] hover:text-white bg-[#161616]
                         border border-[#2a2a2a] hover:bg-[#1f1f1f] disabled:opacity-40 transition-colors">
                  {{ savingCover() ? 'Guardando portada...' : 'Cambiar portada' }}
                </button>
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
                <div class="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                  @if (!g.igdb_id) {
                    <span class="text-xs text-[#f59e0b]">Sin ficha de IGDB</span>
                  }
                  <button type="button" (click)="startEditing(true)"
                    class="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                    [class]="g.igdb_id ? 'border-[#2a2a2a] text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f]'
                                       : 'border-[#7c3aed] text-white bg-[#7c3aed22] hover:bg-[#7c3aed44]'">
                    Rellenar desde IGDB
                  </button>
                  @if (g.igdb_url) {
                    <a [href]="g.igdb_url" target="_blank" rel="noopener" class="ml-auto text-xs text-[#8b5cf6] hover:text-[#a78bfa]">Ver en IGDB →</a>
                  }
                </div>
              </div>
            } @else {
              <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5 grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="field-label">Rellenar desde IGDB</label>
                  <input id="igdb-search" [(ngModel)]="igdbQuery" (ngModelChange)="searchIgdb()" type="text"
                    placeholder="Busca la ficha correcta..." class="field-input" />
                  @if (igdbResults().length) {
                    <ul class="mt-2 max-h-72 overflow-y-auto space-y-0.5">
                      @for (r of igdbResults(); track r.igdb_id) {
                        <li>
                          <button type="button" (click)="pickIgdb(r)" [disabled]="!!r.local_id && r.local_id !== g.id"
                            class="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left hover:bg-[#1f1f1f] disabled:opacity-40 disabled:hover:bg-transparent"
                            [style.background]="edit.igdb_id === r.igdb_id ? '#7c3aed22' : null">
                            <div class="w-7 h-9 rounded overflow-hidden bg-[#0d0d0d] shrink-0">
                              @if (r.cover_url) { <img [src]="r.cover_url" alt="" class="w-full h-full object-cover" loading="lazy" /> }
                            </div>
                            <div class="min-w-0 flex-1">
                              <p class="text-sm text-[#d0d0d0] truncate">{{ r.title }}</p>
                              <p class="text-[10px] text-[#606060] truncate">
                                {{ r.year ?? '¿?' }} · {{ r.platforms.join(' · ') }}@if (r.kind) { · {{ r.kind }} }
                                @if (r.local_id && r.local_id !== g.id) { · ya es otro juego de tu colección }
                              </p>
                            </div>
                          </button>
                        </li>
                      }
                    </ul>
                  }
                  @if (igdbLoading()) { <p class="text-[11px] text-[#606060] mt-2">Cargando ficha...</p> }
                  @if (edit.igdb_id !== g.igdb_id && edit.igdb_id) {
                    <p class="text-[11px] text-[#22c55e] mt-2">Datos rellenados desde IGDB: revisa y guarda.</p>
                  }
                </div>
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
                @if (!copyDraft() && !moving()) {
                  <div class="flex items-center gap-4">
                    @if (g.copies?.length) {
                      <button type="button" (click)="openMoving()" class="text-xs text-[#606060] hover:text-white">Mover a otro juego</button>
                    }
                    <button type="button" (click)="newCopy()" class="text-xs text-[#8b5cf6] hover:text-[#a78bfa]">+ Añadir copia</button>
                  </div>
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
                        <p class="text-sm text-[#d0d0d0] truncate flex items-center gap-1.5">
                          <app-game-icon [name]="c.format" size="w-3.5 h-3.5" class="text-[#a0a0a0] shrink-0" />
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

              @if (moving()) {
                <!-- Mover copias a otro juego (p. ej. la digital de PSN a la ficha de la Deluxe física) -->
                <div class="mt-3 pt-3 border-t border-[#1e1e1e]">
                  <p class="text-xs text-[#a0a0a0] mb-2">Qué copias</p>
                  <div class="space-y-1 mb-3">
                    @for (c of g.copies ?? []; track c.id) {
                      <label class="flex items-center gap-2 text-sm text-[#d0d0d0] cursor-pointer">
                        <input type="checkbox" [checked]="moveIds().has(c.id)" (change)="toggleMove(c.id)" class="accent-[#7c3aed]" />
                        <span class="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#1f1f1f] text-white">{{ c.platform }}</span>
                        <app-game-icon [name]="c.format" size="w-3.5 h-3.5" class="text-[#a0a0a0]" />
                        {{ formatLabel[c.format] }} · {{ c.edition || 'Estándar' }}
                      </label>
                    }
                  </div>
                  <p class="text-xs text-[#a0a0a0] mb-2">A qué juego</p>
                  <div class="flex items-center gap-2 mb-3">
                    <input [(ngModel)]="moveQuery" (ngModelChange)="searchMoveTargets()" type="text" autofocus
                      placeholder="Buscar en tus juegos..." class="field-input" />
                    <button type="button" (click)="moving.set(false)" class="px-3 py-2 text-xs text-[#a0a0a0] hover:text-white shrink-0">Cerrar</button>
                  </div>
                  @if (moveTargets().length) {
                    <ul class="space-y-1 max-h-80 overflow-y-auto">
                      @for (t of moveTargets(); track t.id) {
                        <li>
                          <button type="button" (click)="moveCopies(t)" [disabled]="!moveIds().size || saving()"
                            class="w-full flex items-center gap-3 text-left px-2 py-2 -mx-2 rounded-xl hover:bg-[#1f1f1f] transition-colors disabled:opacity-40">
                            <div class="w-8 h-11 rounded-md overflow-hidden bg-[#0d0d0d] shrink-0">
                              @if (t.cover_url) { <img [src]="t.cover_url" alt="" class="w-full h-full object-cover" loading="lazy" /> }
                            </div>
                            <div class="min-w-0">
                              <p class="text-sm text-[#d0d0d0] truncate">{{ t.title }}</p>
                              <p class="text-[11px] text-[#606060] truncate">{{ t.platforms.join(' · ') }}</p>
                            </div>
                          </button>
                        </li>
                      }
                    </ul>
                  } @else if (moveQuery.trim()) {
                    <p class="text-xs text-[#606060]">No hay otros juegos con ese nombre.</p>
                  }
                </div>
              }
            </section>

            <!-- Trofeos de PSN -->
            <section class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xs text-[#606060] uppercase tracking-wider font-semibold">Trofeos</h2>
                @if (!linking()) {
                  <button type="button" (click)="openLinking()" class="text-xs text-[#8b5cf6] hover:text-[#a78bfa]">+ Vincular lista</button>
                }
              </div>

              @if (!g.trophy_lists?.length && !linking()) {
                @if (suggestions().length) {
                  <p class="text-xs text-[#a0a0a0] mb-2">¿Es alguna de estas listas de tus trofeos?</p>
                  <ul class="space-y-1">
                    @for (l of suggestions(); track l.id) {
                      <li>
                        <button type="button" (click)="linkList(l)"
                          class="w-full text-left px-2 py-2 -mx-2 rounded-xl hover:bg-[#1f1f1f] transition-colors">
                          <app-trophy-list-row [list]="l" />
                        </button>
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="text-xs text-[#606060]">Sin listas de trofeos. Se vinculan solas si el título coincide con el de PSN; si no, vincúlala a mano.</p>
                }
              }
              <div class="space-y-4">
                @for (l of g.trophy_lists ?? []; track l.id) {
                  <div class="group">
                    <app-trophy-list-row [list]="l" [showTitle]="l.title !== g.title" />
                    <div class="flex justify-end mt-1">
                      <button type="button" (click)="unlinkList(l)"
                        class="text-[10px] text-[#404040] hover:text-[#ef4444] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                        Desvincular
                      </button>
                    </div>
                  </div>
                }
              </div>

              @if (linking()) {
                <div class="mt-3 pt-3 border-t border-[#1e1e1e]">
                  <div class="flex items-center gap-2 mb-3">
                    <input [(ngModel)]="linkQuery" (ngModelChange)="searchLists()" type="text" autofocus
                      placeholder="Buscar en tus listas de trofeos sin vincular..." class="field-input" />
                    <button type="button" (click)="linking.set(false)" class="px-3 py-2 text-xs text-[#a0a0a0] hover:text-white shrink-0">Cerrar</button>
                  </div>
                  @if (candidates().length) {
                    <ul class="space-y-1 max-h-80 overflow-y-auto">
                      @for (l of candidates(); track l.id) {
                        <li>
                          <button type="button" (click)="linkList(l)"
                            class="w-full text-left px-2 py-2 -mx-2 rounded-xl hover:bg-[#1f1f1f] transition-colors">
                            <app-trophy-list-row [list]="l" />
                          </button>
                        </li>
                      }
                    </ul>
                  } @else {
                    <p class="text-xs text-[#606060]">No hay listas sin vincular con ese nombre.</p>
                  }
                </div>
              }
            </section>

            @if (g.dlcs?.length) {
              <!-- DLC (de las compras de PSN) -->
              <section class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5">
                <h2 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-4">
                  Contenido descargable <span class="text-[#404040]">{{ g.dlcs!.length }}</span>
                </h2>
                <ul class="space-y-2">
                  @for (d of g.dlcs; track d.id) {
                    <li class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg overflow-hidden bg-[#0d0d0d] shrink-0">
                        @if (d.icon_url) { <img [src]="d.icon_url" alt="" class="w-full h-full object-cover" loading="lazy" /> }
                      </div>
                      <p class="text-sm text-[#d0d0d0] flex-1 min-w-0 truncate" [title]="d.name">{{ d.name }}</p>
                      <span class="text-[10px] text-[#606060] shrink-0">
                        {{ d.platform ?? '' }}@if (d.acquired_at) { · {{ d.acquired_at | date:'d/M/yyyy' }} }
                      </span>
                    </li>
                  }
                </ul>
              </section>
            }
          </div>
        </div>
      }
    </div>
    @if (pickerOpen() && game()) {
      <app-cover-picker
        [gameId]="game()!.id"
        [title]="game()!.title"
        [current]="editing() ? edit.cover_url : game()!.cover_url"
        (picked)="onCoverPicked($event)"
        (closed)="pickerOpen.set(false)" />
    }
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
  edit: GameEdit = { igdb_id: null, igdb_url: null, title: '', cover_url: null, summary: null, genres: null, developer: null, publisher: null, franchise: null, first_release_date: null };
  notes = '';

  copyDraft = signal<GameCopyDraft | null>(null);
  editingCopyId = signal<number | null>(null);

  private id = 0;

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    const qp = this.route.snapshot.queryParamMap;
    this.load(() => {
      if (!qp.get('addCopy')) return;
      this.newCopy();
      // Viene del escáner del alta: la copia ya trae su código y lo que se sacó de él.
      const d = this.copyDraft();
      const ean = qp.get('ean');
      if (d && ean) {
        const platform = qp.get('platform') as GamePlatform | null;
        this.copyDraft.set({
          ...d, ean, source: 'scanner', format: 'physical',
          platform: platform && GAME_PLATFORMS.includes(platform) ? platform : d.platform,
          edition: qp.get('edition') || null,
        });
      }
    });
  }

  private load(after?: () => void) {
    this.api.get<Game>(`/games/${this.id}`).subscribe({
      next: g => {
        this.game.set(g);
        this.loadSuggestions(g);
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
    if (c.acquired_at) {
      const d = new Date(c.acquired_at).toLocaleDateString('es-ES');
      // Estimada con el primer trofeo: aproximada hasta que se ponga a mano.
      parts.push(c.acquired_estimated ? `≈ ${d} (primer trofeo)` : d);
    }
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
    const {
      copies: _c, platforms: _p, formats: _f, copies_count: _n,
      trophy_lists: _t, dlcs: _d, has_platinum: _hp, trophy_progress: _tp, ...base
    } = g;
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

  /** Con `searchIgdb`, abre ya buscando en IGDB por el título. */
  startEditing(searchIgdb = false) {
    const g = this.game()!;
    this.edit = {
      igdb_id: g.igdb_id, igdb_url: g.igdb_url, title: g.title, cover_url: g.cover_url, summary: g.summary, genres: g.genres, developer: g.developer,
      publisher: g.publisher, franchise: g.franchise, first_release_date: g.first_release_date,
    };
    this.igdbQuery = g.title;
    this.igdbResults.set([]);
    this.editing.set(true);
    if (searchIgdb) {
      this.searchIgdb();
      setTimeout(() => {
        const input = document.getElementById('igdb-search') as HTMLInputElement | null;
        input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input?.focus({ preventScroll: true });
        input?.select();
      });
    }
  }

  // ── Rehacer la ficha desde IGDB (importaciones que no la encontraron o cogieron otra) ──

  igdbQuery = '';
  igdbResults = signal<IgdbSearchResult[]>([]);
  igdbLoading = signal(false);
  private igdbTimer: ReturnType<typeof setTimeout> | undefined;

  searchIgdb() {
    clearTimeout(this.igdbTimer);
    const q = this.igdbQuery.trim();
    if (q.length < 2) { this.igdbResults.set([]); return; }
    this.igdbTimer = setTimeout(() => {
      this.api.get<{ data: IgdbSearchResult[] }>('/games/igdb/search', { q })
        .subscribe({ next: r => this.igdbResults.set(r.data) });
    }, 350);
  }

  pickIgdb(r: IgdbSearchResult) {
    this.igdbLoading.set(true);
    this.api.get<IgdbGameDetail>(`/games/igdb/${r.igdb_id}`).subscribe({
      next: d => {
        this.igdbLoading.set(false);
        this.edit = {
          igdb_id: d.igdb_id, igdb_url: d.igdb_url, title: d.title,
          cover_url: d.cover_url ?? this.edit.cover_url, summary: d.summary, genres: d.genres,
          developer: d.developer, publisher: d.publisher, franchise: d.franchise,
          first_release_date: d.first_release_date,
        };
      },
      error: () => this.igdbLoading.set(false),
    });
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

  // ── Portada (el mismo selector que libros) ──

  pickerOpen = signal(false);
  savingCover = signal(false);

  onCoverPicked(url: string) {
    this.pickerOpen.set(false);
    this.savingCover.set(true);
    this.covers.persist(url).subscribe({
      next: stored => {
        this.savingCover.set(false);
        if (this.editing()) { this.edit.cover_url = stored; return; }
        this.update({ cover_url: stored });
      },
      error: err => {
        this.savingCover.set(false);
        this.error.set('No se pudo guardar esa imagen' + (err?.error?.error ? `: ${err.error.error}` : ''));
      },
    });
  }

  confirmDelete() {
    const g = this.game();
    if (!g || !confirm(`¿Eliminar "${g.title}" y sus copias?`)) return;
    this.api.delete(`/games/${g.id}`).subscribe({ next: () => this.router.navigate(['/app/games']) });
  }

  // ── Trofeos ──

  linking = signal(false);
  linkQuery = '';
  candidates = signal<TrophyList[]>([]);
  private linkTimer: ReturnType<typeof setTimeout> | undefined;

  openLinking() {
    this.linking.set(true);
    this.linkQuery = this.game()?.title ?? '';
    // Con el título entero rara vez coincide (si no, ya estaría vinculada): se
    // empieza por la primera palabra significativa.
    this.linkQuery = this.linkQuery.split(/[\s:]+/).find(w => w.length > 3) ?? this.linkQuery;
    this.fetchCandidates();
  }

  searchLists() {
    clearTimeout(this.linkTimer);
    this.linkTimer = setTimeout(() => this.fetchCandidates(), 300);
  }

  private fetchCandidates() {
    this.api.get<{ data: TrophyList[] }>('/games/trophies/lists', { state: 'pending', q: this.linkQuery.trim() })
      .subscribe({ next: r => this.candidates.set(r.data) });
  }

  /**
   * Sin listas vinculadas: las pendientes que comparten palabras con el título
   * (las de PSN van a menudo en castellano o abreviadas y no casan solas).
   */
  suggestions = signal<TrophyList[]>([]);

  private loadSuggestions(g: Game) {
    this.suggestions.set([]);
    if (g.trophy_lists?.length) return;
    const stop = new Set(['the', 'and', 'edition', 'remastered', 'remaster', 'collection', 'definitive', 'complete',
      'deluxe', 'game', 'year', 'part', 'with', 'from', 'edicion', 'para']);
    const words = [...new Set(g.title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .split(/[^a-z0-9]+/).filter(w => w.length > 3 && !stop.has(w)))].slice(0, 3);
    if (!words.length) return;
    forkJoin(words.map(q => this.api.get<{ data: TrophyList[] }>('/games/trophies/lists', { state: 'pending', q })))
      .subscribe({
        next: results => {
          const score = new Map<number, { list: TrophyList; hits: number }>();
          for (const r of results) for (const l of r.data) {
            const e = score.get(l.id) ?? { list: l, hits: 0 };
            e.hits++;
            score.set(l.id, e);
          }
          this.suggestions.set([...score.values()].sort((a, b) => b.hits - a.hits).slice(0, 5).map(e => e.list));
        },
      });
  }

  linkList(l: TrophyList) {
    this.api.put(`/games/trophies/lists/${l.id}`, { game_id: this.id }).subscribe({
      next: () => { this.linking.set(false); this.load(); },
    });
  }

  unlinkList(l: TrophyList) {
    if (!confirm(`¿Desvincular la lista de trofeos "${l.title}" (${l.platforms})?`)) return;
    this.api.put(`/games/trophies/lists/${l.id}`, { game_id: null }).subscribe({ next: () => this.load() });
  }

  // ── Mover copias a otro juego ──

  moving = signal(false);
  moveIds = signal<Set<number>>(new Set());
  moveQuery = '';
  moveTargets = signal<Game[]>([]);
  private moveTimer: ReturnType<typeof setTimeout> | undefined;

  openMoving() {
    const g = this.game();
    if (!g) return;
    this.cancelCopy();
    this.moveIds.set(new Set((g.copies ?? []).map(c => c.id)));
    // Lo normal es que el otro tenga un título parecido: se empieza por la primera palabra.
    this.moveQuery = g.title.split(/[\s:]+/).find(w => w.length > 3) ?? g.title;
    this.moving.set(true);
    this.fetchMoveTargets();
  }

  toggleMove(id: number) {
    const s = new Set(this.moveIds());
    if (!s.delete(id)) s.add(id);
    this.moveIds.set(s);
  }

  searchMoveTargets() {
    clearTimeout(this.moveTimer);
    this.moveTimer = setTimeout(() => this.fetchMoveTargets(), 300);
  }

  private fetchMoveTargets() {
    const q = this.moveQuery.trim();
    if (!q) { this.moveTargets.set([]); return; }
    this.api.get<{ data: Game[] }>('/games', { search: q, sort: 'title', order: 'asc', limit: 20 })
      .subscribe({ next: r => this.moveTargets.set(r.data.filter(x => x.id !== this.id)) });
  }

  moveCopies(target: Game) {
    const g = this.game();
    const ids = [...this.moveIds()];
    if (!g || !ids.length) return;
    const n = ids.length === 1 ? 'la copia' : `las ${ids.length} copias`;
    if (!confirm(`¿Mover ${n} a "${target.title}"?`)) return;
    // Sin copias la ficha no pinta nada: se ofrece borrarla (sus DLC y trofeos pasan también).
    const deleteEmpty = ids.length === (g.copies?.length ?? 0)
      && confirm(`"${g.title}" se queda sin copias. ¿La borro? Sus DLC y listas de trofeos pasarán a "${target.title}".`);
    this.saving.set(true);
    this.api.post<{ moved: number; deleted: boolean }>(`/games/${g.id}/copies/move`, { copy_ids: ids, to: target.id, delete_empty: deleteEmpty })
      .subscribe({
        next: r => {
          this.saving.set(false);
          this.moving.set(false);
          if (!r.deleted) { this.load(); return; }
          // A la ficha del otro (misma ruta: el componente se reutiliza, así que se recarga a mano).
          this.id = target.id;
          this.router.navigate(['/app/games', target.id], { replaceUrl: true });
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(err.error?.error ?? 'No se pudieron mover las copias');
        },
      });
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
