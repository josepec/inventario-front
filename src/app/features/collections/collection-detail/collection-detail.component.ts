import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../shared/services/api.service';
import { environment } from '../../../../environments/environment';

interface CollectionComic {
  id: number;
  title: string;
  number: number | null;
  cover_url: string | null;
  read_status: string;
  owned: boolean;
}

interface Collection {
  id: number;
  whakoom_id: string | null;
  whakoom_type: string | null;
  title: string;
  publisher: string | null;
  cover_url: string | null;
  total_issues: number | null;
  description: string | null;
  url: string | null;
  format: string | null;
  status: string | null;
  edition_details: string | null;
  synopsis: string | null;
  authors: WhakoomAuthor[];
  issues: WhakoomIssue[];
  whakoom_synced_at: string | null;
  tracking: boolean;
  tracking_mode: 0 | 1 | 2;
  rating: number | null;
  notes: string | null;
  comics: CollectionComic[];
}

interface WhakoomIssue {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  cover: string;
  published: boolean;
  releaseDate: string | null;
}

interface WhakoomAuthor {
  name: string;
  role: string;
}

interface PreviewReview { user: string; score: number | null; text: string; date?: string | null; }

interface ComicPreview {
  id: string;
  title: string;
  cover: string;
  description: string;
  authors: string[];
  publisher: string;
  date: string;
  series: string;
  number: string;
  isbn: string;
  language: string;
  url: string;
  pages?: number | null;
  binding?: string | null;
  price?: number | null;
  ratingValue?: number | null;
  ratingCount?: number | null;
  reviews?: PreviewReview[];
}

interface WhakoomEdition {
  id: string;
  title: string;
  publisher: string;
  totalIssues: number;
  format: string;
  status: string;
  cover: string;
  description: string;
  editionDetails: string;
  synopsis: string;
  authors: WhakoomAuthor[];
  issues: WhakoomIssue[];
  url: string;
  pages?: number | null;
  binding?: string | null;
  price?: number | null;
}

@Component({
  selector: 'app-collection-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-4 md:p-8 max-w-5xl mx-auto">

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      @if (!loading() && collection()) {
        <!-- Back + actions -->
        <div class="flex items-center justify-between mb-5 md:mb-6">
          <a routerLink="/app/comics"
            class="flex items-center gap-2 text-sm text-[#606060] hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver
          </a>
          <div class="flex gap-2">
            @if (collection()!.whakoom_id) {
              <button (click)="refreshFromWhakoom()" [disabled]="syncing()"
                class="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm bg-[#161616] border border-[#2a2a2a]
                       text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f] transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed">
                <svg class="w-4 h-4" [class.animate-spin]="syncing()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
                </svg>
              </button>
            }
            <button (click)="confirmDelete()"
              class="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm bg-[#ef444411] border border-[#ef444433]
                     text-[#ef4444] hover:bg-[#ef444422] transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              <span class="hidden sm:inline">Eliminar</span>
            </button>
          </div>
        </div>

        <!-- Header card -->
        <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-6 mb-5 md:mb-6">
          <div class="flex gap-4 md:gap-6">
            <!-- Cover -->
            <div class="w-20 md:w-28 shrink-0">
              <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#0d0d0d] border border-[#2a2a2a]">
                @if (collection()!.cover_url) {
                  <img [src]="collection()!.cover_url!" [alt]="collection()!.title"
                    class="w-full h-full object-cover" />
                }
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              @if (collection()!.publisher) {
                <a [routerLink]="['/app/comics']" [queryParams]="{publisher: collection()!.publisher}"
                  class="text-[#8b5cf6] hover:text-[#a78bfa] text-xs font-semibold uppercase tracking-wider mb-1 inline-block transition-colors">
                  {{ collection()!.publisher }}
                </a>
              }
              <h1 class="text-lg md:text-2xl font-bold text-white tracking-tight leading-tight">{{ collection()!.title }}</h1>

              <!-- Badges — wrapping flex -->
              <div class="flex flex-wrap items-center gap-2 mt-3">
                @if (collection()!.total_issues) {
                  <span class="text-xs text-[#a0a0a0]">
                    {{ collection()!.total_issues }} cómics
                  </span>
                }
                @if (collection()!.format) {
                  <span class="text-xs text-[#606060]">{{ collection()!.format }}</span>
                }
                @if (collection()!.status) {
                  <span class="text-xs px-2.5 py-1 rounded-full font-medium"
                    [class]="collection()!.status === 'En curso'
                      ? 'bg-[#22c55e1a] text-[#22c55e]'
                      : 'bg-[#3b82f61a] text-[#3b82f6]'">
                    {{ collection()!.status }}
                  </span>
                }
                @if (isCompleted()) {
                  <span class="text-xs px-2.5 py-1 rounded-full font-medium bg-[#f59e0b1a] text-[#f59e0b]">
                    Completada
                  </span>
                }
                @if (isRead()) {
                  <span class="text-xs px-2.5 py-1 rounded-full font-medium bg-[#22c55e1a] text-[#22c55e]">
                    Leída
                  </span>
                }
                @if (!isCompleted()) {
                  <button (click)="cycleTracking()" type="button"
                    class="text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer
                           hover:opacity-80 active:scale-95 transition-all"
                    [class]="collection()!.tracking_mode === 1
                      ? 'bg-[#7c3aed1a] text-[#7c3aed]'
                      : collection()!.tracking_mode === 2
                        ? 'bg-[#3b82f61a] text-[#3b82f6]'
                        : 'bg-[#ffffff0d] text-[#606060]'">
                    {{ collection()!.tracking_mode === 1 ? 'Coleccionando' : collection()!.tracking_mode === 2 ? 'Siguiendo' : 'Sin seguimiento' }}
                  </button>
                }
              </div>

              <!-- Progress -->
              <div class="mt-4">
                <div class="flex items-center justify-between text-xs mb-1.5">
                  <span class="text-[#606060]">Tienes {{ ownedCount() }} de {{ totalCount() }}</span>
                  <span class="text-[#a0a0a0] font-medium">{{ progressPercent() }}%</span>
                </div>
                <div class="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div class="h-full bg-[#7c3aed] rounded-full transition-all duration-500"
                    [style.width.%]="progressPercent()"></div>
                </div>
              </div>

              <!-- Rating & Notes -->
              <div class="mt-4 pt-4 border-t border-[#1e1e1e]">
                <div class="flex items-center gap-4">
                  <span class="text-xs text-[#606060] uppercase tracking-wider font-semibold shrink-0">Valoración</span>
                  <div class="flex gap-0.5">
                    @for (s of [1,2,3,4,5]; track s) {
                      <button type="button" (click)="setRating(s)"
                        class="text-lg transition-colors hover:scale-110"
                        [class]="s <= (collection()!.rating ?? 0) ? 'text-[#f59e0b]' : 'text-[#2a2a2a] hover:text-[#f59e0b44]'">
                        ★
                      </button>
                    }
                  </div>
                </div>
                <div class="mt-3">
                  @if (!notesOpen() && collection()!.notes) {
                    <button (click)="notesOpen.set(true)" type="button" class="w-full text-left">
                      <p class="text-xs text-[#a0a0a0] line-clamp-3 leading-relaxed">{{ collection()!.notes }}</p>
                    </button>
                  } @else if (notesOpen()) {
                    <textarea [(ngModel)]="notesText" rows="3" placeholder="Escribe tus notas..."
                      class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-xs text-white
                             placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors resize-none mb-2">
                    </textarea>
                    <div class="flex justify-end gap-2">
                      <button (click)="notesOpen.set(false)" type="button"
                        class="text-xs text-[#606060] hover:text-white transition-colors">Cancelar</button>
                      <button (click)="saveNotes()" [disabled]="savingNotes()" type="button"
                        class="text-xs text-[#7c3aed] hover:text-[#a78bfa] font-medium transition-colors disabled:opacity-40">
                        {{ savingNotes() ? 'Guardando...' : 'Guardar' }}
                      </button>
                    </div>
                  } @else {
                    <button (click)="notesOpen.set(true)" type="button"
                      class="text-xs text-[#606060] hover:text-[#a0a0a0] transition-colors">
                      + Añadir notas
                    </button>
                  }
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Edition info -->
        @if (collection()!.edition_details || collection()!.synopsis || collection()!.authors.length) {
          <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-6 mb-5 md:mb-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
              <!-- Left: Edition + Synopsis -->
              <div class="space-y-5">
                @if (collection()!.edition_details) {
                  <div>
                    <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-2">Edición</h3>
                    <p class="text-sm text-[#c0c0c0]">{{ collection()!.edition_details }}</p>
                  </div>
                }
                @if (collection()!.synopsis) {
                  <div>
                    <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-2">Argumento</h3>
                    <p class="text-sm text-[#c0c0c0] leading-relaxed whitespace-pre-line">{{ collection()!.synopsis }}</p>
                  </div>
                }
              </div>
              <!-- Right: Authors -->
              @if (collection()!.authors.length) {
                <div>
                  <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-2">Autores</h3>
                  <div class="flex flex-wrap gap-2">
                    @for (author of collection()!.authors; track author.name) {
                      <a [routerLink]="['/app/comics']" [queryParams]="{author: author.name}"
                        class="text-sm text-[#8b5cf6] hover:text-[#a78bfa] transition-colors cursor-pointer">
                        {{ author.name }}@if (author.role) {
                          <span class="text-[#606060]"> ({{ author.role }})</span>
                        }
                      </a>@if (!$last) {
                        <span class="text-[#2a2a2a]">·</span>
                      }
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Issues grid -->
        <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 md:gap-3">
          @for (issue of mergedIssues(); track issue.whakoomId || issue.comicId) {
            @if (issue.comicId) {
              <!-- Owned issue — link to comic detail -->
              <a [routerLink]="['/app/comics', issue.comicId]" class="group cursor-pointer">
                <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] border-2 border-[#7c3aed]/40">
                  @if (issue.cover) {
                    <img [src]="issue.cover" [alt]="issue.title" class="w-full h-full object-cover
                         transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <svg class="w-6 h-6 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                  }
                  @if (issue.number) {
                    <span class="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] md:text-[10px] font-bold
                                 px-1 md:px-1.5 py-0.5 rounded-md leading-none backdrop-blur-sm">#{{ issue.number }}</span>
                  }
                  <span class="absolute top-1 left-1 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-[#7c3aed] flex items-center justify-center">
                    <svg class="w-2 h-2 md:w-2.5 md:h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl"></div>
                </div>
                <p class="mt-1 text-[9px] md:text-[10px] text-[#a0a0a0] truncate">{{ issue.subtitle || issue.title }}</p>
              </a>
            } @else if (!issue.published) {
              <!-- Not published yet -->
              <div class="group">
                <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#0d0d0d] border border-dashed border-[#2a2a2a]">
                  @if (issue.cover) {
                    <img [src]="issue.cover" [alt]="issue.title" class="w-full h-full object-cover opacity-30 grayscale" loading="lazy" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <svg class="w-6 h-6 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                  }
                  @if (issue.number) {
                    <span class="absolute bottom-1 right-1 bg-black/70 text-white/30 text-[9px] md:text-[10px] font-bold
                                 px-1 md:px-1.5 py-0.5 rounded-md leading-none">#{{ issue.number }}</span>
                  }
                  <span class="absolute top-1 left-1 bg-[#f59e0b]/20 text-[#f59e0b] text-[8px] md:text-[9px] font-semibold
                               px-1 md:px-1.5 py-0.5 rounded-md leading-none backdrop-blur-sm">
                    @if (issue.releaseDate) {
                      {{ issue.releaseDate }}
                    } @else {
                      Próx.
                    }
                  </span>
                </div>
                <p class="mt-1 text-[9px] md:text-[10px] text-[#303030] truncate">{{ issue.subtitle || issue.title }}</p>
              </div>
            } @else {
              <!-- Not owned, published — add or preview -->
              <div class="group">
                <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#0d0d0d] border border-[#2a2a2a]
                            group-hover:border-[#7c3aed]/50 transition-colors">
                  @if (issue.cover) {
                    <img [src]="issue.cover" [alt]="issue.title" class="w-full h-full object-cover opacity-50
                         group-hover:opacity-80 transition-opacity" loading="lazy" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <svg class="w-6 h-6 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                  }
                  @if (issue.number) {
                    <span class="absolute bottom-1 right-1 bg-black/70 text-white/50 text-[9px] md:text-[10px] font-bold
                                 px-1 md:px-1.5 py-0.5 rounded-md leading-none">#{{ issue.number }}</span>
                  }
                  <div class="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    @if (addingIssue() === issue.whakoomId) {
                      <div class="w-5 h-5 border-2 border-[#2a2a2a] border-t-[#7c3aed] rounded-full animate-spin"></div>
                    } @else {
                      <button (click)="openPreview(issue.whakoomId!)" class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#333] hover:bg-[#444] flex items-center justify-center shadow-lg transition-colors" title="Ver info">
                        <svg class="w-3.5 h-3.5 md:w-4 md:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button (click)="addIssue(issue)" class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] flex items-center justify-center shadow-lg transition-colors" title="Añadir">
                        <svg class="w-3.5 h-3.5 md:w-4 md:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    }
                  </div>
                </div>
                <p class="mt-1 text-[9px] md:text-[10px] text-[#404040] truncate">{{ issue.subtitle || issue.title }}</p>
              </div>
            }
          }
        </div>
      }
    </div>

    <!-- Preview modal -->
    @if (previewOpen()) {
      <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end md:items-center md:justify-center md:p-4"
        (click)="closePreview()">
        <div class="bg-[#0f0f0f] border-t md:border border-[#2a2a2a] rounded-t-2xl md:rounded-2xl max-w-3xl w-full shadow-2xl max-h-[92dvh] md:max-h-[85vh] flex flex-col"
          (click)="$event.stopPropagation()">
          <div class="md:hidden flex justify-center pt-3 pb-1 shrink-0">
            <div class="w-10 h-1 rounded-full bg-[#333]"></div>
          </div>
          @if (previewLoading()) {
            <div class="p-10 text-center text-[#666] text-sm">Cargando detalle…</div>
          } @else if (preview()) {
            <div class="flex-1 overflow-y-auto">
              <!-- Mobile -->
              <div class="flex gap-4 p-4 md:hidden">
                <div class="w-24 shrink-0">
                  <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#141414]">
                    @if (preview()!.cover) {
                      <img [src]="preview()!.cover" [alt]="preview()!.title" class="w-full h-full object-cover" />
                    }
                  </div>
                </div>
                <div class="flex-1 min-w-0 pt-1">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="text-[10px] text-[#888] uppercase tracking-wider">{{ preview()!.publisher }}</p>
                      <h3 class="text-base font-bold text-white leading-tight">{{ preview()!.series || preview()!.title }}</h3>
                      @if (preview()!.number) { <p class="text-sm text-[#a0a0a0]">#{{ preview()!.number }}</p> }
                    </div>
                    <button (click)="closePreview()" class="text-[#555] hover:text-white text-xl leading-none shrink-0 mt-0.5">✕</button>
                  </div>
                  <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#666] mt-2">
                    @if (preview()!.date) { <span>📅 {{ preview()!.date }}</span> }
                    @if (preview()!.pages) { <span>{{ preview()!.pages }} pp</span> }
                    @if (preview()!.binding) { <span>{{ preview()!.binding }}</span> }
                    @if (preview()!.price) { <span class="font-semibold text-[#a0a0a0]">{{ preview()!.price }} €</span> }
                  </div>
                  @if (preview()!.authors?.length) {
                    <p class="text-[10px] text-[#666] mt-1 truncate">{{ preview()!.authors.join(', ') }}</p>
                  }
                  @if (preview()!.ratingValue) {
                    <button (click)="previewShowReviews.set(!previewShowReviews())" class="flex items-center gap-1.5 mt-2 hover:opacity-80 transition-opacity">
                      <span class="text-yellow-400 text-xs">★</span>
                      <span class="text-sm font-bold text-white">{{ preview()!.ratingValue!.toFixed(1) }}</span>
                      @if (preview()!.ratingCount) { <span class="text-[10px] text-[#888] hover:text-white transition-colors">({{ preview()!.ratingCount }} opiniones)</span> }
                    </button>
                  }
                </div>
              </div>
              @if (preview()!.description) {
                <p class="md:hidden text-xs text-[#888] leading-relaxed px-4 pb-2">{{ preview()!.description }}</p>
              }
              @if (previewShowReviews()) {
                <div class="md:hidden px-4 pb-3 space-y-2">
                  <p class="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Opiniones</p>
                  @if (preview()!.reviews && preview()!.reviews!.length > 0) {
                    @for (r of preview()!.reviews!.slice(0, previewReviewsLimit()); track r.user + r.text) {
                      <div class="bg-[#161616] rounded-lg p-2.5">
                        <div class="flex items-center gap-1.5 mb-1">
                          @if (r.score) { <span class="text-yellow-400 text-[10px]">★ {{ r.score.toFixed(1) }}</span> }
                          @if (r.user) { <span class="text-[10px] text-[#666]">{{ r.user }}</span> }
                          @if (r.date) { <span class="text-[10px] text-[#444]">· {{ r.date }}</span> }
                        </div>
                        @if (r.text) { <p class="text-[11px] text-[#aaa] leading-snug">{{ r.text }}</p> }
                      </div>
                    }
                    @if (preview()!.reviews!.length > previewReviewsLimit()) {
                      <button (click)="previewReviewsLimit.update(v => v + 5)" class="text-[11px] text-[#7c3aed] hover:text-[#a78bfa] font-medium">
                        Mostrar más ({{ preview()!.reviews!.length - previewReviewsLimit() }} más)
                      </button>
                    }
                  }
                  <a [href]="preview()!.url" target="_blank" rel="noopener"
                    class="inline-flex items-center gap-1 text-[11px] text-[#7c3aed] hover:text-[#a78bfa] font-medium transition-colors">
                    Ver todas en Whakoom ↗
                  </a>
                </div>
              }
              <!-- Desktop -->
              <div class="hidden md:flex">
                <div class="w-56 p-5 shrink-0">
                  <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#141414] border border-[#1f1f1f]">
                    @if (preview()!.cover) {
                      <img [src]="preview()!.cover" [alt]="preview()!.title" class="w-full h-full object-cover" />
                    }
                  </div>
                </div>
                <div class="flex-1 p-5 pl-0 min-w-0">
                  <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="min-w-0">
                      <p class="text-[11px] text-[#888] uppercase tracking-wider">{{ preview()!.publisher }}</p>
                      <h3 class="text-xl font-bold text-white">{{ preview()!.series || preview()!.title }}</h3>
                      @if (preview()!.number) { <p class="text-sm text-[#a0a0a0]">#{{ preview()!.number }}</p> }
                    </div>
                    <button (click)="closePreview()" class="text-[#666] hover:text-white text-xl leading-none">✕</button>
                  </div>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#888] mb-3">
                    @if (preview()!.date) { <span>📅 {{ preview()!.date }}</span> }
                    @if (preview()!.pages) { <span>{{ preview()!.pages }} págs</span> }
                    @if (preview()!.binding) { <span>{{ preview()!.binding }}</span> }
                    @if (preview()!.price) { <span>{{ preview()!.price }} €</span> }
                    @if (preview()!.language) { <span>{{ preview()!.language }}</span> }
                    @if (preview()!.ratingValue) {
                      <button (click)="previewShowReviews.set(!previewShowReviews())" class="flex items-center gap-1 text-yellow-400 font-semibold hover:opacity-80 transition-opacity cursor-pointer">
                        ★ {{ preview()!.ratingValue!.toFixed(1) }}
                        @if (preview()!.ratingCount) { <span class="text-[#888] font-normal hover:text-white transition-colors">({{ preview()!.ratingCount }} opiniones)</span> }
                      </button>
                    }
                  </div>
                  @if (preview()!.authors?.length) {
                    <p class="text-xs text-[#a0a0a0] mb-3">{{ preview()!.authors.join(', ') }}</p>
                  }
                  @if (preview()!.description) {
                    <p class="text-xs text-[#a0a0a0] leading-relaxed mb-3">{{ preview()!.description }}</p>
                  }
                  @if (previewShowReviews()) {
                    <div class="space-y-2">
                      <p class="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Opiniones</p>
                      @if (preview()!.reviews && preview()!.reviews!.length > 0) {
                        @for (r of preview()!.reviews!.slice(0, previewReviewsLimit()); track r.user + r.text) {
                          <div class="bg-[#161616] rounded-lg p-2.5">
                            <div class="flex items-center gap-2 mb-0.5">
                              @if (r.score) { <span class="text-yellow-400 text-[10px] font-bold">★ {{ r.score.toFixed(1) }}</span> }
                              @if (r.user) { <span class="text-[10px] text-[#666]">{{ r.user }}</span> }
                              @if (r.date) { <span class="text-[10px] text-[#444]">· {{ r.date }}</span> }
                            </div>
                            @if (r.text) { <p class="text-[11px] text-[#aaa] leading-snug">{{ r.text }}</p> }
                          </div>
                        }
                        @if (preview()!.reviews!.length > previewReviewsLimit()) {
                          <button (click)="previewReviewsLimit.update(v => v + 5)" class="text-[11px] text-[#7c3aed] hover:text-[#a78bfa] font-medium">
                            Mostrar más ({{ preview()!.reviews!.length - previewReviewsLimit() }} más)
                          </button>
                        }
                      }
                      <a [href]="preview()!.url" target="_blank" rel="noopener"
                        class="inline-flex items-center gap-1 text-[11px] text-[#7c3aed] hover:text-[#a78bfa] font-medium transition-colors">
                        Ver todas en Whakoom ↗
                      </a>
                    </div>
                  }
                </div>
              </div>
            </div>
            <div class="shrink-0 p-4 border-t border-[#1a1a1a]">
              <button (click)="addIssueFromPreview()" [disabled]="addingIssue() === previewId()"
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                Añadir a mi colección
              </button>
            </div>
          } @else if (previewError()) {
            <div class="p-10 text-center text-red-400 text-sm">{{ previewError() }}</div>
          }
        </div>
      </div>
    }
  `
})
export class CollectionDetailComponent implements OnInit {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private base = environment.apiUrl;

  collection = signal<Collection | null>(null);
  whakoomEdition = signal<WhakoomEdition | null>(null);
  loading = signal(true);
  syncing = signal(false);
  addingIssue = signal<string | null>(null);
  notesOpen = signal(false);
  notesText = '';
  savingNotes = signal(false);

  previewOpen = signal(false);
  previewLoading = signal(false);
  preview = signal<ComicPreview | null>(null);
  previewError = signal<string | null>(null);
  previewId = signal<string | null>(null);
  previewShowReviews = signal(false);
  previewReviewsLimit = signal(3);

  mergedIssues = computed(() => {
    const col = this.collection();
    if (!col) return [];

    const ownedByNumber = new Map<number, CollectionComic>();
    for (const c of col.comics) {
      if (c.number != null) ownedByNumber.set(c.number, c);
    }

    const catalogIssues = this.whakoomEdition()?.issues ?? col.issues ?? [];

    if (catalogIssues.length > 0) {
      return catalogIssues.map(issue => {
        const owned = ownedByNumber.get(issue.number);
        return {
          whakoomId: issue.id,
          comicId: owned?.id ?? null,
          number: issue.number,
          title: issue.title,
          subtitle: issue.subtitle,
          cover: owned?.cover_url || issue.cover,
          readStatus: owned?.read_status ?? null,
          owned: !!owned,
          published: issue.published,
          releaseDate: issue.releaseDate,
        };
      });
    }

    return col.comics.map(c => ({
      whakoomId: null as string | null,
      comicId: c.id,
      number: c.number,
      title: c.title,
      subtitle: '',
      cover: c.cover_url,
      readStatus: c.read_status,
      owned: true,
      published: true,
      releaseDate: null as string | null,
    }));
  });

  ownedCount = computed(() => this.mergedIssues().filter(i => i.owned).length);
  totalCount = computed(() => {
    return this.collection()?.total_issues || this.mergedIssues().length;
  });
  progressPercent = computed(() => {
    const total = this.totalCount();
    return total > 0 ? Math.round((this.ownedCount() / total) * 100) : 0;
  });
  isCompleted = computed(() => {
    const col = this.collection();
    if (col?.status === 'En curso') return false;
    const total = this.totalCount();
    return total > 0 && this.ownedCount() >= total;
  });
  isRead = computed(() => {
    const owned = this.mergedIssues().filter(i => i.owned);
    return owned.length > 0 && owned.every(i => i.readStatus === 'read');
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<Collection>(`/collections/${id}`).subscribe({
      next: col => {
        this.collection.set(col);
        this.notesText = col.notes ?? '';
        this.loading.set(false);

        if (col.whakoom_id && this.needsSync(col.whakoom_synced_at)) {
          this.http.get<WhakoomEdition>(
            `${this.base}/whakoom/edition/${col.whakoom_id}`
          ).subscribe({
            next: ed => {
              this.whakoomEdition.set(ed);
              this.syncEdition(col, ed);
            },
          });
        }
      },
      error: () => { this.loading.set(false); this.router.navigate(['/app/comics']); }
    });
  }

  setRating(n: number) {
    const col = this.collection();
    if (!col) return;
    const rating = col.rating === n ? null : n;
    this.collection.update(c => c ? { ...c, rating } : c);
    this.api.put<Collection>(`/collections/${col.id}`, {
      title: col.title, publisher: col.publisher, cover_url: col.cover_url,
      total_issues: col.total_issues, description: col.description, url: col.url,
      rating,
    }).subscribe();
  }

  saveNotes() {
    const col = this.collection();
    if (!col) return;
    this.savingNotes.set(true);
    const notes = this.notesText.trim() || null;
    this.api.put<Collection>(`/collections/${col.id}`, {
      title: col.title, publisher: col.publisher, cover_url: col.cover_url,
      total_issues: col.total_issues, description: col.description, url: col.url,
      notes,
    }).subscribe({
      next: () => {
        this.collection.update(c => c ? { ...c, notes } : c);
        this.notesOpen.set(false);
        this.savingNotes.set(false);
      },
      error: () => this.savingNotes.set(false),
    });
  }

  cycleTracking() {
    const col = this.collection();
    if (!col) return;
    const next = ((col.tracking_mode + 1) % 3) as 0 | 1 | 2;
    this.collection.update(c => c ? { ...c, tracking_mode: next, tracking: next >= 1 } : c);
    this.api.put<Collection>(`/collections/${col.id}`, {
      title: col.title, publisher: col.publisher, cover_url: col.cover_url,
      total_issues: col.total_issues, description: col.description, url: col.url,
      tracking_mode: next,
    }).subscribe();
  }

  confirmDelete() {
    if (!confirm('¿Eliminar esta colección y todos sus cómics? Esta acción no se puede deshacer.')) return;
    this.api.delete(`/collections/${this.collection()!.id}`).subscribe({
      next: () => this.router.navigate(['/app/comics'])
    });
  }

  private needsSync(syncedAt: string | null): boolean {
    if (!syncedAt) return true;
    const last = new Date(syncedAt).getTime();
    return Date.now() - last > 24 * 60 * 60 * 1000;
  }

  private syncEdition(col: Collection, ed: WhakoomEdition, done?: () => void) {
    this.api.put<Collection>(`/collections/${col.id}`, {
      title: ed.title || col.title,
      publisher: ed.publisher || col.publisher,
      cover_url: col.cover_url,
      total_issues: ed.totalIssues || col.total_issues,
      description: ed.description || col.description,
      url: ed.url || col.url,
      format: ed.format || null,
      status: ed.status || null,
      edition_details: ed.editionDetails || null,
      synopsis: ed.synopsis || null,
      authors: ed.authors || [],
      issues: ed.issues || [],
      whakoom_synced_at: new Date().toISOString(),
    }).subscribe({
      next: updated => {
        this.collection.update(c => c ? { ...c, ...updated, comics: c.comics } : c);
        done?.();
      },
      error: () => done?.(),
    });
  }

  refreshFromWhakoom() {
    const col = this.collection();
    if (!col?.whakoom_id || this.syncing()) return;
    this.syncing.set(true);
    this.http.get<WhakoomEdition>(`${this.base}/whakoom/edition/${col.whakoom_id}`).subscribe({
      next: (ed) => {
        this.whakoomEdition.set(ed);
        this.syncEdition(col, ed, () => this.syncing.set(false));
      },
      error: () => this.syncing.set(false),
    });
  }

  addIssue(issue: { whakoomId: string | null; number: number | null; title: string; cover: string | null }) {
    if (!issue.whakoomId || this.addingIssue()) return;

    this.addingIssue.set(issue.whakoomId);
    const col = this.collection()!;
    const wk = this.whakoomEdition();

    this.http.get<any>(`${this.base}/whakoom/comic/${issue.whakoomId}?type=comic`).subscribe({
      next: (detail) => {
        const coverUrl = detail.cover || issue.cover;
        const createComic = (finalCoverUrl: string) => {
          this.api.post<any>('/comics', {
            title: detail.title || issue.title,
            series: detail.series || col.title,
            number: issue.number,
            publisher: detail.publisher || wk?.publisher || col.publisher,
            cover_url: finalCoverUrl,
            isbn: detail.isbn || '',
            synopsis: detail.description || '',
            publish_date: detail.date || '',
            writer: (detail.structuredAuthors ?? []).find((a: any) => a.role?.toLowerCase().includes('guion'))?.name || detail.authors?.[0] || '',
            artist: (detail.structuredAuthors ?? []).find((a: any) => a.role?.toLowerCase().includes('dibujo'))?.name || detail.authors?.[1] || '',
            authors: detail.structuredAuthors?.length ? detail.structuredAuthors : null,
            language: detail.language || '',
            pages: detail.pages ?? null,
            binding: detail.binding ?? col.format ?? null,
            price: detail.price ?? null,
            collection_id: col.id,
            whakoom_id: issue.whakoomId || null,
            read_status: 'unread',
            owned: false,
          }).subscribe({
            next: (comic) => {
              this.collection.update(c => c ? {
                ...c,
                comics: [...c.comics, {
                  id: comic.id,
                  title: comic.title,
                  number: issue.number,
                  cover_url: comic.cover_url,
                  read_status: 'unread',
                  owned: false,
                }]
              } : c);
              this.addingIssue.set(null);
            },
            error: () => this.addingIssue.set(null),
          });
        };

        if (coverUrl) {
          this.http.post<{ key: string }>(`${this.base}/covers/upload`, { url: coverUrl }).subscribe({
            next: (r) => createComic(`${this.base}/covers/${r.key}`),
            error: () => createComic(coverUrl),
          });
        } else {
          createComic('');
        }
      },
      error: () => this.addingIssue.set(null),
    });
  }

  openPreview(whakoomId: string) {
    this.previewOpen.set(true);
    this.previewLoading.set(true);
    this.preview.set(null);
    this.previewError.set(null);
    this.previewId.set(whakoomId);
    this.previewShowReviews.set(false);
    this.previewReviewsLimit.set(3);
    this.http.get<ComicPreview>(`${this.base}/whakoom/comic/${whakoomId}?type=comic`).subscribe({
      next: (d) => { this.preview.set(d); this.previewLoading.set(false); },
      error: (err) => {
        this.previewError.set(err?.error?.error ?? 'Error al cargar detalle');
        this.previewLoading.set(false);
      },
    });
  }

  closePreview() {
    this.previewOpen.set(false);
    this.preview.set(null);
    this.previewId.set(null);
  }

  addIssueFromPreview() {
    const id = this.previewId();
    if (!id) return;
    const merged = this.mergedIssues().find(i => i.whakoomId === id);
    if (merged) {
      this.closePreview();
      this.addIssue(merged);
    }
  }
}
