import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { Book } from '../../../shared/models/book.model';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="p-8 max-w-5xl mx-auto">

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      @if (!loading() && book()) {
        <div class="flex items-center justify-between mb-8">
          <a routerLink="/app/books"
            class="flex items-center gap-2 text-sm text-[#606060] hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver a Libros
          </a>
          <div class="flex gap-2">
            <a [routerLink]="['/app/books', book()!.id, 'edit']"
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-[#161616] border border-[#2a2a2a]
                     text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f] transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Editar
            </a>
            <button (click)="confirmDelete()"
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-[#ef444411] border border-[#ef444433]
                     text-[#ef4444] hover:bg-[#ef444422] transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Eliminar
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-1">
            <div class="aspect-[2/3] rounded-2xl overflow-hidden bg-[#161616] border border-[#1e1e1e] mb-5">
              @if (book()!.cover_url) {
                <img [src]="book()!.cover_url!" [alt]="book()!.title" class="w-full h-full object-cover" />
              } @else {
                <div class="w-full h-full flex items-center justify-center">
                  <svg class="w-16 h-16 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
              }
            </div>
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5 space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs text-[#606060] uppercase tracking-wider">Estado</span>
                <span class="text-sm px-3 py-1 rounded-full font-medium" [class]="statusClass(book()!.read_status)">
                  {{ statusLabel(book()!.read_status) }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-[#606060] uppercase tracking-wider">En colección</span>
                @if (book()!.owned) {
                  <span class="text-[#22c55e] text-sm font-medium">Sí</span>
                } @else {
                  <span class="text-[#606060] text-sm">No</span>
                }
              </div>
              @if (book()!.rating) {
                <div class="flex items-center justify-between">
                  <span class="text-xs text-[#606060] uppercase tracking-wider">Valoración</span>
                  <div class="flex">
                    @for (s of [1,2,3,4,5]; track s) {
                      <span [class]="s <= book()!.rating! ? 'text-[#f59e0b]' : 'text-[#2a2a2a]'">★</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="lg:col-span-2 space-y-4">
            <div class="mb-6">
              @if (book()!.saga) {
                <p class="text-[#8b5cf6] text-sm font-medium mb-1">
                  {{ book()!.saga }}{{ book()!.saga_number ? ' #' + book()!.saga_number : '' }}
                </p>
              }
              <h1 class="text-3xl font-bold text-white tracking-tight">{{ book()!.title }}</h1>
              @if (book()!.author) {
                <p class="text-[#a0a0a0] mt-2">Por <span class="text-white">{{ book()!.author }}</span></p>
              }
            </div>

            @if (book()!.synopsis) {
              <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5">
                <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-3">Sinopsis</h3>
                <p class="text-sm text-[#c0c0c0] leading-relaxed">{{ book()!.synopsis }}</p>
              </div>
            }

            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5">
              <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-4">Detalles</h3>
              <dl class="grid grid-cols-2 gap-x-8 gap-y-4">
                @if (book()!.publisher) {
                  <div><dt class="text-xs text-[#606060] mb-0.5">Editorial</dt><dd class="text-sm text-white">{{ book()!.publisher }}</dd></div>
                }
                @if (book()!.publish_date) {
                  <div><dt class="text-xs text-[#606060] mb-0.5">Publicación</dt><dd class="text-sm text-white">{{ book()!.publish_date }}</dd></div>
                }
                @if (book()!.pages) {
                  <div><dt class="text-xs text-[#606060] mb-0.5">Páginas</dt><dd class="text-sm text-white">{{ book()!.pages }}</dd></div>
                }
                @if (book()!.genre) {
                  <div><dt class="text-xs text-[#606060] mb-0.5">Género</dt><dd class="text-sm text-white">{{ book()!.genre }}</dd></div>
                }
                @if (book()!.language) {
                  <div><dt class="text-xs text-[#606060] mb-0.5">Idioma</dt><dd class="text-sm text-white">{{ book()!.language }}</dd></div>
                }
                @if (book()!.isbn13 || book()!.isbn) {
                  <div><dt class="text-xs text-[#606060] mb-0.5">ISBN</dt><dd class="text-sm text-white font-mono">{{ book()!.isbn13 ?? book()!.isbn }}</dd></div>
                }
                @if (book()!.original_title) {
                  <div><dt class="text-xs text-[#606060] mb-0.5">Título original</dt><dd class="text-sm text-white">{{ book()!.original_title }}</dd></div>
                }
                @if (book()!.translator) {
                  <div><dt class="text-xs text-[#606060] mb-0.5">Traductor</dt><dd class="text-sm text-white">{{ book()!.translator }}</dd></div>
                }
              </dl>
            </div>

            @if (book()!.notes) {
              <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5">
                <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-3">Mis notas</h3>
                <p class="text-sm text-[#c0c0c0] leading-relaxed">{{ book()!.notes }}</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class BookDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  book = signal<Book | null>(null);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<Book>(`/books/${id}`).subscribe({
      next: b => { this.book.set(b); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/app/books']); }
    });
  }

  confirmDelete() {
    if (!confirm('¿Eliminar este libro? Esta acción no se puede deshacer.')) return;
    this.api.delete(`/books/${this.book()!.id}`).subscribe({
      next: () => this.router.navigate(['/app/books'])
    });
  }

  statusLabel(s: string) { return s === 'read' ? 'Leído' : s === 'reading' ? 'Leyendo' : 'Sin leer'; }
  statusClass(s: string) {
    if (s === 'read') return 'bg-[#22c55e1a] text-[#22c55e]';
    if (s === 'reading') return 'bg-[#f59e0b1a] text-[#f59e0b]';
    return 'bg-[#ffffff0d] text-[#606060]';
  }
}
