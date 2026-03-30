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
  comics: CollectionComic[];
}

interface WhakoomIssue {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  cover: string;
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
  issues: WhakoomIssue[];
}

@Component({
  selector: 'app-collection-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="p-8 max-w-5xl mx-auto">

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      @if (!loading() && collection()) {
        <!-- Back -->
        <div class="flex items-center justify-between mb-6">
          <a routerLink="/app/comics"
            class="flex items-center gap-2 text-sm text-[#606060] hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver a Cómics
          </a>
        </div>

        <!-- Header card -->
        <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-6 mb-6">
          <div class="flex gap-6">
            <!-- Cover -->
            <div class="w-28 shrink-0">
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
              <h1 class="text-2xl font-bold text-white tracking-tight">{{ collection()!.title }}</h1>

              <div class="flex items-center gap-4 mt-3">
                @if (whakoomEdition()?.totalIssues || collection()!.total_issues) {
                  <span class="text-sm text-[#a0a0a0]">
                    {{ whakoomEdition()?.totalIssues || collection()!.total_issues }} cómics
                  </span>
                }
                @if (whakoomEdition()?.format) {
                  <span class="text-sm text-[#606060]">{{ whakoomEdition()!.format }}</span>
                }
                @if (whakoomEdition()?.status) {
                  <span class="text-xs px-2.5 py-1 rounded-full font-medium"
                    [class]="whakoomEdition()!.status === 'En curso'
                      ? 'bg-[#22c55e1a] text-[#22c55e]'
                      : 'bg-[#3b82f61a] text-[#3b82f6]'">
                    {{ whakoomEdition()!.status }}
                  </span>
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

              @if (collection()!.description) {
                <p class="mt-4 text-xs text-[#606060] leading-relaxed line-clamp-3">{{ collection()!.description }}</p>
              }
            </div>
          </div>
        </div>

        <!-- Issues grid -->
        <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
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
                    <span class="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] font-bold
                                 px-1.5 py-0.5 rounded-md leading-none backdrop-blur-sm">#{{ issue.number }}</span>
                  }
                  <!-- Owned indicator -->
                  <span class="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-[#7c3aed] flex items-center justify-center">
                    <svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl"></div>
                </div>
                <p class="mt-1 text-[10px] text-[#a0a0a0] truncate">{{ issue.subtitle || issue.title }}</p>
              </a>
            } @else {
              <!-- Not owned — show add button -->
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
                    <span class="absolute bottom-1.5 right-1.5 bg-black/70 text-white/50 text-[10px] font-bold
                                 px-1.5 py-0.5 rounded-md leading-none">#{{ issue.number }}</span>
                  }
                  <!-- Add overlay -->
                  <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    @if (addingIssue() === issue.whakoomId) {
                      <div class="w-5 h-5 border-2 border-[#2a2a2a] border-t-[#7c3aed] rounded-full animate-spin"></div>
                    } @else {
                      <span class="w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center shadow-lg">
                        <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </span>
                    }
                  </div>
                </div>
                <p class="mt-1 text-[10px] text-[#404040] truncate">{{ issue.subtitle || issue.title }}</p>
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
  addingIssue = signal<string | null>(null);

  mergedIssues = computed(() => {
    const wk = this.whakoomEdition();
    const col = this.collection();
    if (!col) return [];

    // Build a map of owned comics by number
    const ownedByNumber = new Map<number, CollectionComic>();
    for (const c of col.comics) {
      if (c.number != null) ownedByNumber.set(c.number, c);
    }

    if (wk && wk.issues.length > 0) {
      // Merge Whakoom issues with owned data
      return wk.issues.map(issue => {
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
        };
      });
    }

    // Fallback: just show owned comics
    return col.comics.map(c => ({
      whakoomId: null as string | null,
      comicId: c.id,
      number: c.number,
      title: c.title,
      subtitle: '',
      cover: c.cover_url,
      readStatus: c.read_status,
      owned: true,
    }));
  });

  ownedCount = computed(() => this.mergedIssues().filter(i => i.owned).length);
  totalCount = computed(() => {
    const wk = this.whakoomEdition();
    return wk?.totalIssues || this.collection()?.total_issues || this.mergedIssues().length;
  });
  progressPercent = computed(() => {
    const total = this.totalCount();
    return total > 0 ? Math.round((this.ownedCount() / total) * 100) : 0;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<Collection>(`/collections/${id}`).subscribe({
      next: col => {
        this.collection.set(col);
        this.loading.set(false);

        // If has Whakoom ID, fetch edition issues
        if (col.whakoom_id) {
          this.http.get<WhakoomEdition>(
            `${this.base}/whakoom/edition/${col.whakoom_id}`
          ).subscribe({
            next: ed => this.whakoomEdition.set(ed),
          });
        }
      },
      error: () => { this.loading.set(false); this.router.navigate(['/app/comics']); }
    });
  }

  addIssue(issue: { whakoomId: string | null; number: number | null; title: string; cover: string | null }) {
    if (!issue.whakoomId || this.addingIssue()) return;

    this.addingIssue.set(issue.whakoomId);
    const col = this.collection()!;
    const wk = this.whakoomEdition();

    // First fetch the comic detail from Whakoom
    this.http.get<any>(`${this.base}/whakoom/comic/${issue.whakoomId}?type=comic`).subscribe({
      next: (detail) => {
        // Upload cover to R2
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
            collection_id: col.id,
            read_status: 'unread',
            owned: false,
          }).subscribe({
            next: (comic) => {
              // Add to local collection
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
            error: () => createComic(coverUrl), // fallback to original URL
          });
        } else {
          createComic('');
        }
      },
      error: () => this.addingIssue.set(null),
    });
  }
}
