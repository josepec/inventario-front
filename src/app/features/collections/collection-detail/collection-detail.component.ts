import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  imports: [RouterLink],
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
                <p class="text-[#8b5cf6] text-xs font-semibold uppercase tracking-wider mb-1">{{ collection()!.publisher }}</p>
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
                <button (click)="toggleTracking()" type="button"
                  class="text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer
                         hover:opacity-80 active:scale-95 transition-all"
                  [class]="collection()!.tracking
                    ? 'bg-[#7c3aed1a] text-[#7c3aed]'
                    : 'bg-[#ffffff0d] text-[#606060]'">
                  {{ collection()!.tracking ? 'Coleccionando' : 'No completar' }}
                </button>
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
                      <span class="text-sm text-white">{{ author.name }}@if (author.role) {
                        <span class="text-[#606060]"> ({{ author.role }})</span>
                      }</span>@if (!$last) {
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
              <!-- Not owned, published — show add button -->
              <button type="button" (click)="addIssue(issue)" [disabled]="addingIssue() === issue.whakoomId"
                class="group text-left">
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
                  <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    @if (addingIssue() === issue.whakoomId) {
                      <div class="w-5 h-5 border-2 border-[#2a2a2a] border-t-[#7c3aed] rounded-full animate-spin"></div>
                    } @else {
                      <span class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#7c3aed] flex items-center justify-center shadow-lg">
                        <svg class="w-3.5 h-3.5 md:w-4 md:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </span>
                    }
                  </div>
                </div>
                <p class="mt-1 text-[9px] md:text-[10px] text-[#404040] truncate">{{ issue.subtitle || issue.title }}</p>
              </button>
            }
          }
        </div>
      }
    </div>
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

  toggleTracking() {
    const col = this.collection();
    if (!col) return;
    const newVal = !col.tracking;
    this.collection.update(c => c ? { ...c, tracking: newVal } : c);
    this.api.put<Collection>(`/collections/${col.id}`, {
      title: col.title, publisher: col.publisher, cover_url: col.cover_url,
      total_issues: col.total_issues, description: col.description, url: col.url,
      tracking: newVal,
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
            writer: detail.authors?.[0] || '',
            artist: detail.authors?.[1] || '',
            language: detail.language || '',
            pages: detail.pages ?? wk?.pages ?? null,
            binding: detail.binding ?? wk?.binding ?? col.format ?? null,
            price: detail.price ?? wk?.price ?? null,
            collection_id: col.id,
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
}
