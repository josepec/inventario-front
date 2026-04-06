import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService, PaginatedResponse } from '../../../shared/services/api.service';
import { Book } from '../../../shared/models/book.model';
import { environment } from '../../../../environments/environment';

interface GBResult {
  googleId: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
  isbn: string | null;
  isbn13: string | null;
  pages: number | null;
  categories: string[];
  language: string | null;
  cover: string | null;
  price: number | null;
  currency: string | null;
}

@Component({
  selector: 'app-books-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-4 md:p-8 max-w-7xl mx-auto">

      <div class="flex items-start justify-between mb-5 md:mb-8 gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">Libros</h1>
          <p class="text-[#606060] mt-0.5 text-sm">{{ total() }} libros en tu colección</p>
        </div>
        <button (click)="openModal()"
          class="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white
                 font-semibold text-sm rounded-xl px-4 py-2.5 md:px-5 transition-colors duration-200 shrink-0">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span class="hidden sm:inline">Añadir libro</span>
          <span class="sm:hidden">Añadir</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-col gap-2 mb-5 md:mb-8">
        <div class="flex items-center gap-2">
          <div class="relative flex-1 min-w-0">
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#404040]"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input [(ngModel)]="search" (ngModelChange)="onSearch()"
              type="text" placeholder="Buscar por título, autor, editorial..."
              class="w-full bg-[#161616] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-sm
                     text-white placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
          </div>

          <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-1 shrink-0">
            <button (click)="viewMode.set('grid')" [class.bg-[#2a2a2a]]="viewMode() === 'grid'"
              class="p-2 rounded-lg transition-colors hover:bg-[#222]">
              <svg class="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
            <button (click)="viewMode.set('list')" [class.bg-[#2a2a2a]]="viewMode() === 'list'"
              class="p-2 rounded-lg transition-colors hover:bg-[#222]">
              <svg class="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-0.5">
            <button (click)="filterStatus = ''; load()"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              [class]="filterStatus === '' ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Todos
            </button>
            <button (click)="filterStatus = 'unread'; load()"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              [class]="filterStatus === 'unread' ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Sin leer
            </button>
            <button (click)="filterStatus = 'read'; load()"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              [class]="filterStatus === 'read' ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Leído
            </button>
          </div>

          @if (filterRatingMin()) {
            <button (click)="setFilterRatingMin(0)"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#f59e0b1a] text-[#f59e0b]
                     hover:bg-[#f59e0b33] transition-colors">
              ≥ {{ filterRatingMin() }}★
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          }

          <div class="flex items-center gap-0.5 ml-1">
            @for (n of [1,2,3,4,5]; track n) {
              <button (click)="setFilterRatingMin(n)"
                class="text-sm transition-colors"
                [class]="n <= filterRatingMin() ? 'text-[#f59e0b]' : 'text-[#2a2a2a] hover:text-[#404040]'">★</button>
            }
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      @if (!loading() && viewMode() === 'grid') {
        @if (books().length === 0) {
          <div class="text-center py-24">
            <div class="w-16 h-16 rounded-2xl bg-[#161616] flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-[#404040]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p class="text-[#606060] text-sm">No hay libros todavía.</p>
            <button (click)="openModal()" class="inline-block mt-4 text-sm text-[#8b5cf6] hover:underline">Añade el primero</button>
          </div>
        } @else {
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
            @for (book of books(); track book.id) {
              <a [routerLink]="['/app/books', book.id]" class="group cursor-pointer">
                <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] mb-1.5">
                  @if (book.cover_url) {
                    <img [src]="book.cover_url" [alt]="book.title"
                      class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  } @else {
                    <div class="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                      <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                      <p class="text-[10px] text-[#404040] leading-tight">{{ book.title }}</p>
                    </div>
                  }
                  <div class="absolute top-2 right-2">
                    @if (book.read_status === 'read') {
                      <span class="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center">
                        <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                    }
                  </div>
                  @if (book.rating) {
                    <div class="absolute bottom-1.5 left-1.5 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-[#f59e0b] font-semibold">
                      {{ book.rating }}★
                    </div>
                  }
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                </div>
                <p class="text-xs font-medium text-[#e0e0e0] truncate leading-tight">{{ book.title }}</p>
                @if (book.author) {
                  <p class="text-[10px] text-[#606060] truncate">{{ book.author }}</p>
                }
              </a>
            }
          </div>
        }
      }

      @if (!loading() && viewMode() === 'list') {
        <div class="space-y-2">
          @for (book of books(); track book.id) {
            <a [routerLink]="['/app/books', book.id]"
              class="flex items-center gap-3 md:gap-4 bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e]
                     rounded-xl px-3 md:px-4 py-3 transition-colors duration-150">
              <div class="w-9 h-12 md:w-10 md:h-14 rounded-lg overflow-hidden bg-[#222] shrink-0">
                @if (book.cover_url) {
                  <img [src]="book.cover_url" [alt]="book.title" class="w-full h-full object-cover" />
                }
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-white truncate">{{ book.title }}</p>
                <p class="text-xs text-[#606060] truncate">{{ book.author }}</p>
              </div>
              @if (book.rating) {
                <span class="text-xs text-[#f59e0b] shrink-0">{{ book.rating }}★</span>
              }
              <div class="hidden sm:block shrink-0 text-xs text-[#606060]">{{ book.publisher }}</div>
              <div class="shrink-0">
                <span class="text-xs px-2 py-1 rounded-lg" [class]="statusClass(book.read_status)">
                  {{ statusLabel(book.read_status) }}
                </span>
              </div>
            </a>
          }
        </div>
      }

      @if (totalPages() > 1) {
        <div class="flex justify-center items-center gap-2 mt-8 md:mt-10">
          <button (click)="goTo(page() - 1)" [disabled]="page() === 1"
            class="px-3 py-2 rounded-lg bg-[#161616] border border-[#2a2a2a] text-sm text-[#a0a0a0]
                   disabled:opacity-30 hover:bg-[#1f1f1f] transition-colors">← Anterior</button>
          <span class="text-sm text-[#606060]">{{ page() }} / {{ totalPages() }}</span>
          <button (click)="goTo(page() + 1)" [disabled]="page() === totalPages()"
            class="px-3 py-2 rounded-lg bg-[#161616] border border-[#2a2a2a] text-sm text-[#a0a0a0]
                   disabled:opacity-30 hover:bg-[#1f1f1f] transition-colors">Siguiente →</button>
        </div>
      }
    </div>

    <!-- ═══════════ Google Books Search Modal ═══════════ -->
    @if (modalOpen()) {
      <div class="fixed inset-0 z-50 flex items-end md:items-center justify-center">
        <div class="absolute inset-0 bg-black/60" (click)="closeModal()"></div>

        <div class="relative w-full md:max-w-lg bg-[#111111] border border-[#1e1e1e]
                    rounded-t-2xl md:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">

          <!-- Header -->
          <div class="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 class="text-base font-bold text-white">
              @if (gbDetail()) { Detalle del libro } @else { Buscar en Google Books }
            </h2>
            <button (click)="closeModal()" class="text-[#606060] hover:text-white transition-colors p-1">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-5 pb-5">
            @if (gbDetail()) {
              <!-- ── Detail view ── -->
              <div class="space-y-4">
                <button type="button" (click)="gbDetail.set(null); gbExistingId.set(null)"
                  class="text-xs text-[#7c3aed] hover:underline flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Volver a resultados
                </button>

                <div class="flex gap-4 md:gap-5">
                  @if (gbDetail()!.cover) {
                    <img [src]="gbDetail()!.cover" alt="Portada"
                      class="w-24 md:w-28 shrink-0 rounded-lg border border-[#2a2a2a] object-cover aspect-[2/3]" />
                  }
                  <div class="flex-1 min-w-0">
                    <h3 class="text-white font-semibold text-sm md:text-base leading-tight">{{ gbDetail()!.title }}</h3>
                    @if (gbDetail()!.subtitle) {
                      <p class="text-[#a0a0a0] text-xs mt-0.5">{{ gbDetail()!.subtitle }}</p>
                    }
                    @if (gbDetail()!.authors.length) {
                      <p class="text-[#7c3aed] text-xs mt-1 uppercase tracking-wider">{{ gbDetail()!.authors.join(' · ') }}</p>
                    }
                    <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      @if (gbDetail()!.publisher) {
                        <div><span class="text-[#505050]">Editorial</span><br><span class="text-[#a0a0a0]">{{ gbDetail()!.publisher }}</span></div>
                      }
                      @if (gbDetail()!.publishedDate) {
                        <div><span class="text-[#505050]">Fecha</span><br><span class="text-[#a0a0a0]">{{ gbDetail()!.publishedDate }}</span></div>
                      }
                      @if (gbDetail()!.pages) {
                        <div><span class="text-[#505050]">Páginas</span><br><span class="text-[#a0a0a0]">{{ gbDetail()!.pages }}</span></div>
                      }
                      @if (gbDetail()!.isbn13 || gbDetail()!.isbn) {
                        <div><span class="text-[#505050]">ISBN</span><br><span class="text-[#a0a0a0]">{{ gbDetail()!.isbn13 || gbDetail()!.isbn }}</span></div>
                      }
                      @if (gbDetail()!.price) {
                        <div><span class="text-[#505050]">Precio</span><br><span class="text-[#a0a0a0]">{{ gbDetail()!.price }} {{ gbDetail()!.currency }}</span></div>
                      }
                      @if (gbDetail()!.categories.length) {
                        <div><span class="text-[#505050]">Género</span><br><span class="text-[#a0a0a0]">{{ gbDetail()!.categories[0] }}</span></div>
                      }
                    </div>
                  </div>
                </div>

                @if (gbDetail()!.description) {
                  <p class="text-xs text-[#606060] line-clamp-4 leading-relaxed">{{ gbDetail()!.description }}</p>
                }

                <div class="flex gap-3 mt-5">
                  @if (gbExistingId()) {
                    <a [routerLink]="['/app/books', gbExistingId()]" (click)="closeModal()"
                      class="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#22c55e] text-center">
                      Ya añadido — ver libro
                    </a>
                  } @else {
                    <button type="button" (click)="addBook()" [disabled]="gbSaving()"
                      class="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#7c3aed]
                             hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      @if (gbSaving()) { Añadiendo... } @else { Añadir }
                    </button>
                    <a routerLink="/app/books/new" (click)="closeModal()"
                      class="px-5 py-3 rounded-xl text-sm text-[#a0a0a0] hover:text-white bg-[#1a1a1a]
                             border border-[#2a2a2a] hover:bg-[#222] transition-colors">
                      Editar antes
                    </a>
                  }
                </div>
              </div>

            } @else {
              <!-- ── Search ── -->
              <div class="relative mb-4">
                <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#404040]"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input [(ngModel)]="gbQuery" (keyup.enter)="searchGB()"
                  type="text" placeholder="Título, autor o ISBN..."
                  class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-3 text-sm
                         text-white placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
              </div>

              @if (gbError()) {
                <p class="text-[#ef4444] text-xs mt-2">{{ gbError() }}</p>
              }

              @if (gbLoading()) {
                <div class="flex justify-center py-10">
                  <div class="w-6 h-6 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
                </div>
              }

              <!-- Results list -->
              @if (gbResults().length > 0) {
                @if (gbTotal() > 0) {
                  <p class="text-[10px] text-[#505050] mb-2">{{ gbTotal() }} resultados</p>
                }
                <div class="space-y-2">
                  @for (result of gbResults(); track result.googleId) {
                    <button type="button" (click)="selectResult(result)"
                      class="w-full flex items-center gap-3 bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e]
                             rounded-xl px-3 py-2.5 transition-colors text-left">
                      <div class="w-10 h-14 rounded-md overflow-hidden bg-[#0d0d0d] shrink-0 border border-[#2a2a2a]">
                        @if (result.cover) {
                          <img [src]="result.cover" [alt]="result.title" class="w-full h-full object-cover" />
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-white font-medium truncate">{{ result.title }}</p>
                        @if (result.authors.length) {
                          <p class="text-xs text-[#606060] truncate">{{ result.authors.join(', ') }}</p>
                        }
                        <div class="flex items-center gap-2 mt-0.5">
                          @if (result.publisher) {
                            <span class="text-[10px] text-[#505050]">{{ result.publisher }}</span>
                          }
                          @if (result.publishedDate) {
                            <span class="text-[10px] text-[#404040]">{{ result.publishedDate }}</span>
                          }
                        </div>
                      </div>
                    </button>
                  }
                </div>
              } @else if (gbSearched() && !gbLoading()) {
                <p class="text-center text-[#606060] text-sm py-8">No se encontraron resultados</p>
              }
            }
          </div>
        </div>
      </div>
    }
  `
})
export class BooksListComponent implements OnInit {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = environment.apiUrl;

  books = signal<Book[]>([]);
  total = signal(0);
  loading = signal(false);
  page = signal(1);
  viewMode = signal<'grid' | 'list'>('grid');
  filterRatingMin = signal(0);

  search = '';
  filterStatus = '';
  readonly limit = 42;
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit)));
  private searchTimer: any;

  // Google Books modal
  modalOpen = signal(false);
  gbQuery = '';
  gbResults = signal<GBResult[]>([]);
  gbTotal = signal(0);
  gbDetail = signal<GBResult | null>(null);
  gbLoading = signal(false);
  gbSearched = signal(false);
  gbError = signal('');
  gbSaving = signal(false);
  gbExistingId = signal<number | null>(null);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: any = {
      page: this.page(), limit: this.limit,
      search: this.search || undefined,
      read_status: this.filterStatus || undefined,
    };
    if (this.filterRatingMin()) params.rating_min = this.filterRatingMin();
    this.api.get<PaginatedResponse<Book>>('/books', params).subscribe({
      next: res => { this.books.set(res.data); this.total.set(res.total); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 400);
  }

  setFilterRatingMin(n: number) {
    this.filterRatingMin.set(this.filterRatingMin() === n ? 0 : n);
    this.page.set(1);
    this.load();
  }

  goTo(p: number) { this.page.set(p); this.load(); }

  statusLabel(s: string) { return s === 'read' ? 'Leído' : 'Sin leer'; }
  statusClass(s: string) {
    if (s === 'read') return 'bg-[#22c55e1a] text-[#22c55e]';
    return 'bg-[#ffffff0d] text-[#606060]';
  }

  // ── Modal ──────────────────────────────────────────────────────────────

  openModal() {
    this.modalOpen.set(true);
    this.gbQuery = ''; this.gbResults.set([]); this.gbDetail.set(null);
    this.gbError.set(''); this.gbSearched.set(false); this.gbExistingId.set(null);
  }

  closeModal() {
    this.modalOpen.set(false);
    this.gbSaving.set(false);
    this.load();
  }

  searchGB() {
    if (!this.gbQuery.trim()) return;
    this.gbLoading.set(true); this.gbError.set(''); this.gbDetail.set(null);
    this.http.get<{ data: GBResult[]; total: number }>(`${this.base}/google-books/search`, {
      params: { q: this.gbQuery.trim() },
    }).subscribe({
      next: res => {
        this.gbResults.set(res.data); this.gbTotal.set(res.total);
        this.gbSearched.set(true); this.gbLoading.set(false);
      },
      error: () => { this.gbError.set('Error al buscar'); this.gbLoading.set(false); }
    });
  }

  selectResult(result: GBResult) {
    this.gbDetail.set(result);
    this.gbExistingId.set(null);
    this.checkIfExists(result);
  }

  private checkIfExists(d: GBResult) {
    const q = d.isbn13 || d.isbn || d.title;
    if (!q) return;
    this.api.get<{ data: any[] }>('/books', { search: q, limit: 1 }).subscribe({
      next: res => {
        const match = res.data?.find((b: any) =>
          (d.isbn13 && (b.isbn13 === d.isbn13 || b.isbn === d.isbn13)) ||
          (d.isbn && (b.isbn === d.isbn || b.isbn13 === d.isbn)) ||
          b.title === d.title
        );
        if (match) this.gbExistingId.set(match.id);
      },
    });
  }

  addBook() {
    const d = this.gbDetail();
    if (!d || this.gbSaving()) return;
    this.gbSaving.set(true);

    const save = (coverUrl: string) => {
      this.api.post<any>('/books', {
        title: d.title,
        author: d.authors.join(', ') || null,
        publisher: d.publisher,
        publish_date: d.publishedDate,
        isbn: d.isbn,
        isbn13: d.isbn13,
        synopsis: d.description,
        genre: d.categories[0] || null,
        pages: d.pages,
        language: d.language,
        cover_url: coverUrl,
        read_status: 'unread',
        owned: false,
      }).subscribe({
        next: book => { this.closeModal(); this.router.navigate(['/app/books', book.id]); },
        error: () => {
          this.gbSaving.set(false);
          this.gbError.set('Error al guardar el libro');
        },
      });
    };

    if (d.cover) {
      this.http.post<{ key: string }>(`${this.base}/covers/upload`, { url: d.cover }).subscribe({
        next: r => save(`${this.base}/covers/${r.key}`),
        error: () => save(d.cover!),
      });
    } else {
      save('');
    }
  }
}
