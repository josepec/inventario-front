import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from '../../../shared/services/api.service';
import { Comic } from '../../../shared/models/comic.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-comic-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="p-4 md:p-8 max-w-5xl mx-auto">

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      @if (!loading() && comic()) {
        <!-- Back + actions -->
        <div class="flex items-center justify-between mb-5 md:mb-8">
          <a routerLink="/app/comics"
            class="flex items-center gap-2 text-sm text-[#606060] hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver
          </a>
          <div class="flex gap-2">
            <button (click)="refreshFromWhakoom()" [disabled]="syncing()" type="button"
              class="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm bg-[#161616] border border-[#2a2a2a]
                     text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f] transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed">
              <svg class="w-4 h-4" [class.animate-spin]="syncing()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
              </svg>
            </button>
            <button (click)="toggleReadStatus()" type="button"
              class="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm transition-all"
              [class]="comic()!.read_status === 'read'
                ? 'bg-[#22c55e1a] border border-[#22c55e33] text-[#22c55e] hover:bg-[#22c55e22]'
                : 'bg-[#161616] border border-[#2a2a2a] text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f]'">
              @if (comic()!.read_status === 'read') {
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              } @else {
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              }
              <span class="hidden sm:inline">{{ comic()!.read_status === 'read' ? 'Leído' : 'Sin leer' }}</span>
            </button>
            <a [routerLink]="['/app/comics', comic()!.id, 'edit']"
              class="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm bg-[#161616] border border-[#2a2a2a]
                     text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f] transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span class="hidden sm:inline">Editar</span>
            </a>
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

        <!-- Content -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">

          <!-- Cover column -->
          <div class="md:col-span-1">
            <div class="w-36 md:w-full">
              <div class="aspect-[2/3] rounded-2xl overflow-hidden bg-[#161616] border border-[#1e1e1e]">
                @if (comic()!.cover_url) {
                  <img [src]="comic()!.cover_url!" [alt]="comic()!.title" class="w-full h-full object-cover" />
                } @else {
                  <div class="w-full h-full flex items-center justify-center">
                    <svg class="w-10 h-10 md:w-16 md:h-16 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Info column -->
          <div class="md:col-span-2 space-y-3 md:space-y-4">

            <div class="mb-4 md:mb-6">
              @if (comic()!.collection_id && comic()!.number != null) {
                <a [routerLink]="['/app/collections', comic()!.collection_id]"
                  class="text-[#8b5cf6] hover:text-[#a78bfa] text-sm font-medium mb-1 inline-block transition-colors">
                  {{ comic()!.collection_name || comic()!.series }}
                </a>
              }
              <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">{{ comic()!.title }}</h1>
              @if (mainWriter()) {
                <p class="text-[#a0a0a0] mt-2 text-sm">Por <span class="text-white">{{ mainWriter() }}</span></p>
              }
            </div>

            @if (comic()!.synopsis) {
              <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
                <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-3">Sinopsis</h3>
                <p class="text-sm text-[#c0c0c0] leading-relaxed whitespace-pre-line">{{ comic()!.synopsis }}</p>
              </div>
            }

            <!-- Details grid -->
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
              <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-4">Detalles</h3>
              <dl class="grid grid-cols-2 gap-x-6 md:gap-x-8 gap-y-3 md:gap-y-4">
                @if (parsedAuthors().length) {
                  <div class="col-span-2">
                    <dt class="text-xs text-[#606060] mb-2">Autores</dt>
                    <dd class="flex flex-wrap gap-x-3 gap-y-1">
                      @for (author of parsedAuthors(); track author.name) {
                        <a [routerLink]="['/app/comics']" [queryParams]="{author: author.name}"
                          class="text-sm text-[#8b5cf6] hover:text-[#a78bfa] transition-colors cursor-pointer">
                          {{ author.name }}@if (author.role) {
                            <span class="text-[#606060]"> ({{ author.role }})</span>
                          }
                        </a>
                      }
                    </dd>
                  </div>
                }
                @if (comic()!.publisher) {
                  <div>
                    <dt class="text-xs text-[#606060] mb-0.5">Editorial</dt>
                    <dd class="text-sm">
                      <a [routerLink]="['/app/comics']" [queryParams]="{publisher: comic()!.publisher}"
                        class="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">{{ comic()!.publisher }}</a>
                    </dd>
                  </div>
                }
                @if (comic()!.original_publisher) {
                  <div>
                    <dt class="text-xs text-[#606060] mb-0.5">Editorial original</dt>
                    <dd class="text-sm text-white">{{ comic()!.original_publisher }}</dd>
                  </div>
                }
                @if (comic()!.publish_date) {
                  <div>
                    <dt class="text-xs text-[#606060] mb-0.5">Publicación</dt>
                    <dd class="text-sm text-white">{{ comic()!.publish_date }}</dd>
                  </div>
                }
                @if (comic()!.format) {
                  <div>
                    <dt class="text-xs text-[#606060] mb-0.5">Formato</dt>
                    <dd class="text-sm text-white capitalize">{{ comic()!.format }}</dd>
                  </div>
                }
                @if (comic()!.pages) {
                  <div>
                    <dt class="text-xs text-[#606060] mb-0.5">Páginas</dt>
                    <dd class="text-sm text-white">{{ comic()!.pages }}</dd>
                  </div>
                }
                @if (comic()!.binding) {
                  <div>
                    <dt class="text-xs text-[#606060] mb-0.5">Encuadernación</dt>
                    <dd class="text-sm text-white">{{ comic()!.binding }}</dd>
                  </div>
                }
                @if (comic()!.price) {
                  <div>
                    <dt class="text-xs text-[#606060] mb-0.5">Precio</dt>
                    <dd class="text-sm text-white">{{ comic()!.price }} €</dd>
                  </div>
                }
                @if (comic()!.genre) {
                  <div>
                    <dt class="text-xs text-[#606060] mb-0.5">Género</dt>
                    <dd class="text-sm text-white">{{ comic()!.genre }}</dd>
                  </div>
                }
                @if (comic()!.isbn) {
                  <div>
                    <dt class="text-xs text-[#606060] mb-0.5">ISBN</dt>
                    <dd class="text-sm text-white font-mono">{{ comic()!.isbn }}</dd>
                  </div>
                }
                @if (comic()!.language) {
                  <div>
                    <dt class="text-xs text-[#606060] mb-0.5">Idioma</dt>
                    <dd class="text-sm text-white">{{ comic()!.language }}</dd>
                  </div>
                }
                @if (comic()!.rating) {
                  <div>
                    <dt class="text-xs text-[#606060] mb-0.5">Valoración</dt>
                    <dd class="flex">
                      @for (s of [1,2,3,4,5]; track s) {
                        <span class="text-sm" [class]="s <= comic()!.rating! ? 'text-[#f59e0b]' : 'text-[#2a2a2a]'">★</span>
                      }
                    </dd>
                  </div>
                }
              </dl>
            </div>

            @if (comic()!.notes) {
              <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
                <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-3">Mis notas</h3>
                <p class="text-sm text-[#c0c0c0] leading-relaxed">{{ comic()!.notes }}</p>
              </div>
            }

          </div>
        </div>
      }

    </div>
  `
})
export class ComicDetailComponent implements OnInit {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private base = environment.apiUrl;

  comic = signal<Comic | null>(null);
  loading = signal(true);
  syncing = signal(false);

  parsedAuthors = computed(() => {
    const c = this.comic();
    if (!c) return [];
    if (c.authors && c.authors.length > 0) return c.authors;
    // Fallback a campos legacy writer/artist/colorist
    const result: { name: string; role: string }[] = [];
    if (c.writer) result.push({ name: c.writer, role: 'Guion' });
    if (c.artist) result.push({ name: c.artist, role: 'Dibujo' });
    if (c.colorist) result.push({ name: c.colorist, role: 'Color' });
    return result;
  });

  mainWriter = computed(() => {
    const authors = this.parsedAuthors();
    const guionista = authors.find(a => a.role.toLowerCase().includes('guion'));
    return guionista?.name || authors[0]?.name || this.comic()?.writer || '';
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<Comic>(`/comics/${id}`).subscribe({
      next: c => { this.comic.set(c); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/app/comics']); }
    });
  }

  confirmDelete() {
    if (!confirm('¿Eliminar este cómic? Esta acción no se puede deshacer.')) return;
    this.api.delete(`/comics/${this.comic()!.id}`).subscribe({
      next: () => this.router.navigate(['/app/comics'])
    });
  }

  toggleReadStatus() {
    const c = this.comic();
    if (!c) return;
    this.setReadStatus(c.read_status === 'read' ? 'unread' : 'read');
  }

  refreshFromWhakoom() {
    const c = this.comic();
    if (!c || this.syncing()) return;
    this.syncing.set(true);

    const query = c.isbn || c.ean || c.title;
    this.http.get<any>(`${this.base}/whakoom/search`, {
      params: new HttpParams().set('q', query),
    }).subscribe({
      next: (res) => {
        const match = res.data?.[0];
        if (!match) { this.syncing.set(false); return; }

        this.http.get<any>(`${this.base}/whakoom/comic/${match.id}`, {
          params: new HttpParams().set('type', match.type),
        }).subscribe({
          next: (detail) => {
            const patch: any = {};
            if (detail.title) patch.title = detail.title;
            if (detail.series) patch.series = detail.series;
            if (detail.number) patch.number = Number(detail.number) || c.number;
            if (detail.publisher) patch.publisher = detail.publisher;
            if (detail.isbn) patch.isbn = detail.isbn;
            if (detail.description) patch.synopsis = detail.description;
            if (detail.date) patch.publish_date = detail.date;
            if (detail.language) patch.language = detail.language;
            if (detail.pages) patch.pages = detail.pages;
            if (detail.binding) patch.binding = detail.binding;
            if (detail.price) patch.price = detail.price;

            const sa = detail.structuredAuthors ?? [];
            if (sa.length) {
              patch.authors = sa;
              patch.writer = sa.find((a: any) => a.role?.toLowerCase().includes('guion'))?.name || sa[0]?.name || '';
              patch.artist = sa.find((a: any) => a.role?.toLowerCase().includes('dibujo'))?.name || '';
            } else {
              if (detail.authors?.[0]) patch.writer = detail.authors[0];
              if (detail.authors?.[1]) patch.artist = detail.authors[1];
            }

            const uploadAndSave = (coverUrl?: string) => {
              if (coverUrl) patch.cover_url = coverUrl;
              this.api.put<Comic>(`/comics/${c.id}`, { ...c, ...patch }).subscribe({
                next: (updated) => {
                  this.comic.set({ ...updated, collection_name: c.collection_name, collection_id: c.collection_id });
                  this.syncing.set(false);
                },
                error: () => this.syncing.set(false),
              });
            };

            if (detail.cover && detail.cover !== c.cover_url) {
              this.http.post<{ key: string }>(`${this.base}/covers/upload`, { url: detail.cover }).subscribe({
                next: (r) => uploadAndSave(`${this.base}/covers/${r.key}`),
                error: () => uploadAndSave(detail.cover),
              });
            } else {
              uploadAndSave();
            }
          },
          error: () => this.syncing.set(false),
        });
      },
      error: () => this.syncing.set(false),
    });
  }

  setReadStatus(status: string) {
    const c = this.comic();
    if (!c || c.read_status === status) return;
    this.api.put<Comic>(`/comics/${c.id}`, { ...c, read_status: status }).subscribe({
      next: (updated) => this.comic.set({ ...updated, collection_name: c.collection_name, collection_id: c.collection_id }),
    });
  }

}
