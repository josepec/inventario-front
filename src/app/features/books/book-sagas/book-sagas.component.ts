import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { Book } from '../../../shared/models/book.model';

interface SagaSummary {
  name: string;
  total: number;
  read: number;
  covers: string[];
}

@Component({
  selector: 'app-book-sagas',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-4 md:p-8 max-w-7xl mx-auto">

      <div class="flex items-start justify-between mb-5 md:mb-8 gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">Sagas</h1>
          <p class="text-[#606060] mt-0.5 text-sm">{{ sagas().length }} sagas en tu coleccion</p>
        </div>
        <a routerLink="/app/books"
          class="flex items-center gap-2 text-sm text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Todos los libros
        </a>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      @if (!loading() && sagas().length === 0) {
        <div class="text-center py-24">
          <div class="w-16 h-16 rounded-2xl bg-[#161616] flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-[#404040]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p class="text-[#606060] text-sm">No hay sagas todavia.</p>
          <p class="text-[#404040] text-xs mt-1">Asigna una saga a tus libros para verlos agrupados aqui.</p>
        </div>
      }

      @if (!loading() && sagas().length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (saga of sagas(); track saga.name) {
            <div class="relative bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e] hover:border-[#2a2a2a]
                        rounded-2xl transition-all duration-200 group">
              <button (click)="openSaga(saga.name)" class="w-full p-4 text-left">
                <!-- Cover strip -->
                <div class="flex gap-1.5 mb-3 h-20 overflow-hidden rounded-lg">
                  @for (cover of saga.covers; track cover) {
                    <div class="flex-1 min-w-0 bg-[#0d0d0d] rounded overflow-hidden">
                      <img [src]="cover" [alt]="saga.name" class="w-full h-full object-cover" />
                    </div>
                  }
                  @if (saga.covers.length === 0) {
                    <div class="flex-1 bg-[#0d0d0d] rounded flex items-center justify-center">
                      <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                  }
                </div>

                <h3 class="text-white font-semibold text-sm group-hover:text-[#8b5cf6] transition-colors truncate">
                  {{ saga.name }}
                </h3>

                <div class="flex items-center justify-between mt-2">
                  <span class="text-xs text-[#606060]">{{ saga.total }} {{ saga.total === 1 ? 'libro' : 'libros' }}</span>
                  <div class="flex items-center gap-2">
                    <!-- Progress -->
                    <div class="w-16 h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                      <div class="h-full bg-[#22c55e] rounded-full transition-all"
                        [style.width.%]="saga.total > 0 ? (saga.read / saga.total * 100) : 0"></div>
                    </div>
                    <span class="text-[10px] text-[#606060]">{{ saga.read }}/{{ saga.total }}</span>
                  </div>
                </div>
              </button>

              <button type="button" (click)="startEdit(saga.name)" title="Editar saga"
                class="absolute top-6 right-6 p-1.5 rounded-lg bg-black/70 text-[#a0a0a0] hover:text-white hover:bg-[#7c3aed] transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              </button>
            </div>
          }
        </div>
      }
    </div>

    <!-- Editor de saga -->
    @if (editing()) {
      <div class="fixed inset-0 z-50 flex items-end md:items-center justify-center">
        <div class="absolute inset-0 bg-black/70" (click)="editing.set(null)"></div>
        <div class="relative w-full md:max-w-lg bg-[#111111] border border-[#1e1e1e]
                    rounded-t-2xl md:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
          <div class="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 class="text-base font-bold text-white">Editar saga</h2>
            <button type="button" (click)="editing.set(null)" class="text-[#606060] hover:text-white transition-colors p-1">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
            <div>
              <label class="block text-xs text-[#606060] mb-1">Nombre</label>
              <div class="flex gap-2">
                <input [(ngModel)]="newName" type="text" list="allSagas"
                  class="flex-1 min-w-0 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white
                         focus:outline-none focus:border-[#7c3aed]" />
                <datalist id="allSagas">
                  @for (s of sagas(); track s.name) { @if (s.name !== editing()) { <option [value]="s.name"></option> } }
                </datalist>
                <button type="button" (click)="rename()" [disabled]="busy() || !newName.trim() || newName.trim() === editing()"
                  class="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9]
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Guardar</button>
              </div>
              @if (mergeTarget()) {
                <p class="text-[11px] text-[#f59e0b] mt-1">Ya existe: se fusionara con "{{ mergeTarget() }}".</p>
              } @else {
                <p class="text-[11px] text-[#505050] mt-1">Escribe el nombre de otra saga para fusionarlas.</p>
              }
            </div>

            <div>
              <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-2">Libros</h3>
              @if (booksLoading()) {
                <div class="flex justify-center py-6">
                  <div class="w-6 h-6 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
                </div>
              } @else {
                <ul class="space-y-2">
                  @for (b of sagaBooks(); track b.id) {
                    <li class="flex items-center gap-3 bg-[#161616] border border-[#1e1e1e] rounded-xl p-2">
                      <div class="w-9 h-[54px] shrink-0 rounded overflow-hidden bg-[#0d0d0d]">
                        @if (b.cover_url) { <img [src]="b.cover_url" [alt]="b.title" class="w-full h-full object-cover" /> }
                      </div>
                      <p class="flex-1 min-w-0 text-xs text-white line-clamp-2">{{ b.title }}</p>
                      <label class="flex items-center gap-1 text-[11px] text-[#606060]">
                        #
                        <input type="number" min="0" [ngModel]="b.saga_number"
                          (change)="setNumber(b, $any($event.target).value)"
                          class="w-14 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2 py-1 text-xs text-white
                                 focus:outline-none focus:border-[#7c3aed]" />
                      </label>
                      <button type="button" (click)="removeFromSaga(b)" title="Quitar de la saga"
                        class="p-1.5 rounded-lg text-[#606060] hover:text-[#ef4444] hover:bg-[#ef444411] transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  }
                </ul>
                <p class="text-[11px] text-[#505050] mt-2">Para meter otro libro en la saga, editalo y escribe el nombre en su campo Saga.</p>
              }
            </div>

            <button type="button" (click)="dissolve()" [disabled]="busy()"
              class="w-full py-2.5 rounded-xl text-sm text-[#ef4444] bg-[#ef444411] border border-[#ef444433]
                     hover:bg-[#ef444422] disabled:opacity-40 transition-colors">
              Quitar esta saga de todos sus libros
            </button>
            @if (error()) { <p class="text-xs text-[#ef4444]">{{ error() }}</p> }
          </div>
        </div>
      </div>
    }
  `
})
export class BookSagasComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = environment.apiUrl;

  sagas = signal<SagaSummary[]>([]);
  loading = signal(false);

  /** Saga abierta en el editor (su nombre actual), o null. */
  editing = signal<string | null>(null);
  sagaBooks = signal<Book[]>([]);
  booksLoading = signal(false);
  busy = signal(false);
  error = signal('');
  newName = '';

  ngOnInit() {
    this.loadSagas();
  }

  private loadSagas() {
    this.loading.set(true);
    this.http.get<SagaSummary[]>(`${this.base}/books/sagas`).subscribe({
      next: data => { this.sagas.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openSaga(name: string) {
    this.router.navigate(['/app/books'], { queryParams: { saga: name } });
  }

  /** Saga existente con la que se fusionaría el nombre escrito (ignora mayúsculas y tildes). */
  mergeTarget(): string | null {
    const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    const name = fold(this.newName);
    if (!name) return null;
    return this.sagas().find(s => s.name !== this.editing() && fold(s.name) === name)?.name ?? null;
  }

  startEdit(name: string) {
    this.editing.set(name);
    this.newName = name;
    this.error.set('');
    this.loadBooks(name);
  }

  private loadBooks(name: string) {
    this.booksLoading.set(true);
    this.http.get<{ data: Book[] }>(`${this.base}/books`, {
      params: { saga: name, limit: '100', sort: 'saga_number', order: 'asc' },
    }).subscribe({
      next: res => { this.sagaBooks.set(res.data); this.booksLoading.set(false); },
      error: () => this.booksLoading.set(false),
    });
  }

  rename() {
    const from = this.editing();
    const to = this.newName.trim();
    if (!from || !to) return;
    this.busy.set(true);
    this.http.patch<{ saga: string }>(`${this.base}/books/sagas`, { from, to }).subscribe({
      next: res => {
        this.busy.set(false);
        this.editing.set(res.saga);
        this.newName = res.saga;
        this.loadBooks(res.saga);
        this.loadSagas();
      },
      error: () => { this.busy.set(false); this.error.set('No se pudo renombrar'); },
    });
  }

  dissolve() {
    const from = this.editing();
    if (!from || !confirm(`Quitar la saga "${from}" de sus ${this.sagaBooks().length} libros? Los libros no se borran.`)) return;
    this.busy.set(true);
    this.http.patch(`${this.base}/books/sagas`, { from, to: null }).subscribe({
      next: () => { this.busy.set(false); this.editing.set(null); this.loadSagas(); },
      error: () => { this.busy.set(false); this.error.set('No se pudo quitar la saga'); },
    });
  }

  setNumber(book: Book, raw: string) {
    const n = raw === '' ? null : Number(raw);
    this.saveBook({ ...book, saga_number: n });
  }

  removeFromSaga(book: Book) {
    this.saveBook({ ...book, saga: null, saga_number: null }, true);
  }

  private saveBook(book: Book, removed = false) {
    this.http.put<Book>(`${this.base}/books/${book.id}`, book).subscribe({
      next: updated => {
        if (removed) {
          this.sagaBooks.update(list => list.filter(b => b.id !== book.id));
          this.loadSagas();
        } else {
          this.sagaBooks.update(list => list.map(b => b.id === updated.id ? updated : b)
            .sort((a, b) => (a.saga_number ?? -1) - (b.saga_number ?? -1)));
        }
      },
      error: () => this.error.set('No se pudo guardar el libro'),
    });
  }
}
