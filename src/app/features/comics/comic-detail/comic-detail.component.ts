import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { Comic } from '../../../shared/models/comic.model';

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

          <!-- Cover column — on mobile: horizontal card -->
          <div class="md:col-span-1">

            <!-- Mobile: horizontal layout -->
            <div class="flex gap-4 md:block">
              <div class="w-28 shrink-0 md:w-full md:mb-5">
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

              <!-- Personal status card — shown next to cover on mobile -->
              <div class="flex-1 md:hidden bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-[#606060] uppercase tracking-wider">Estado</span>
                  <button (click)="toggleReadStatus()" type="button"
                    class="text-sm px-3 py-1 rounded-full font-medium cursor-pointer
                           hover:opacity-80 active:scale-95 transition-all"
                    [class]="statusClass(comic()!.read_status)">
                    {{ statusLabel(comic()!.read_status) }}
                  </button>
                </div>
                @if (comic()!.collection_name) {
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs text-[#606060] uppercase tracking-wider shrink-0">Colección</span>
                    <a [routerLink]="['/app/collections', comic()!.collection_id]"
                      class="text-xs text-[#8b5cf6] hover:text-[#a78bfa] transition-colors truncate">
                      {{ comic()!.collection_name }}
                    </a>
                  </div>
                }
                @if (comic()!.rating) {
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-[#606060] uppercase tracking-wider">Valoración</span>
                    <div class="flex">
                      @for (s of [1,2,3,4,5]; track s) {
                        <span [class]="s <= comic()!.rating! ? 'text-[#f59e0b]' : 'text-[#2a2a2a]'">★</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Personal status card — desktop only -->
            <div class="hidden md:block bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5 space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs text-[#606060] uppercase tracking-wider">Estado</span>
                <button (click)="toggleReadStatus()" type="button"
                  class="text-sm px-3 py-1 rounded-full font-medium cursor-pointer
                         hover:opacity-80 active:scale-95 transition-all"
                  [class]="statusClass(comic()!.read_status)">
                  {{ statusLabel(comic()!.read_status) }}
                </button>
              </div>
              @if (comic()!.collection_name) {
                <div class="flex items-center justify-between">
                  <span class="text-xs text-[#606060] uppercase tracking-wider">Colección</span>
                  <a [routerLink]="['/app/collections', comic()!.collection_id]"
                    class="text-sm text-[#8b5cf6] hover:text-[#a78bfa] transition-colors truncate max-w-[180px]">
                    {{ comic()!.collection_name }}
                  </a>
                </div>
              }
              @if (comic()!.rating) {
                <div class="flex items-center justify-between">
                  <span class="text-xs text-[#606060] uppercase tracking-wider">Valoración</span>
                  <div class="flex">
                    @for (s of [1,2,3,4,5]; track s) {
                      <span [class]="s <= comic()!.rating! ? 'text-[#f59e0b]' : 'text-[#2a2a2a]'">★</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Info column -->
          <div class="md:col-span-2 space-y-3 md:space-y-4">

            <div class="mb-4 md:mb-6">
              @if (comic()!.series) {
                <p class="text-[#8b5cf6] text-sm font-medium mb-1">
                  {{ comic()!.series }}{{ comic()!.number ? ' #' + comic()!.number : '' }}
                </p>
              }
              <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">{{ comic()!.title }}</h1>
              @if (comic()!.writer) {
                <p class="text-[#a0a0a0] mt-2 text-sm">Por <span class="text-white">{{ comic()!.writer }}</span></p>
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
                @if (comic()!.artist) {
                  <div>
                    <dt class="text-xs text-[#606060] mb-0.5">Dibujante</dt>
                    <dd class="text-sm text-white">{{ comic()!.artist }}</dd>
                  </div>
                }
                @if (comic()!.colorist) {
                  <div>
                    <dt class="text-xs text-[#606060] mb-0.5">Colorista</dt>
                    <dd class="text-sm text-white">{{ comic()!.colorist }}</dd>
                  </div>
                }
                @if (comic()!.publisher) {
                  <div>
                    <dt class="text-xs text-[#606060] mb-0.5">Editorial</dt>
                    <dd class="text-sm text-white">{{ comic()!.publisher }}</dd>
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  comic = signal<Comic | null>(null);
  loading = signal(true);

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
    const newStatus = c.read_status === 'read' ? 'unread' : 'read';
    this.api.put<Comic>(`/comics/${c.id}`, { ...c, read_status: newStatus }).subscribe({
      next: (updated) => this.comic.set({ ...updated, collection_name: c.collection_name, collection_id: c.collection_id }),
    });
  }

  statusLabel(s: string) {
    return s === 'read' ? 'Leído' : 'Sin leer';
  }

  statusClass(s: string) {
    if (s === 'read') return 'bg-[#22c55e1a] text-[#22c55e]';
    return 'bg-[#ffffff0d] text-[#606060]';
  }
}
