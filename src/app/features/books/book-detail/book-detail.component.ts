import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../shared/services/api.service';
import { Book } from '../../../shared/models/book.model';
import { CoverPickerComponent } from '../../../shared/components/cover-picker/cover-picker.component';
import { CoversService } from '../../../shared/services/covers.service';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, CoverPickerComponent],
  template: `
    <div class="p-4 md:p-8 max-w-5xl mx-auto">

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      @if (!loading() && book()) {
        <!-- Back + actions -->
        <div class="flex items-center justify-between mb-5 md:mb-8">
          <button (click)="goBack()"
            class="flex items-center gap-2 text-sm text-[#606060] hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver
          </button>
          <div class="flex items-center gap-2">
            @if (!editing()) {
              <button (click)="toggleReadStatus()" type="button"
                class="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm transition-all"
                [class]="book()!.read_status === 'read'
                  ? 'bg-[#22c55e1a] border border-[#22c55e33] text-[#22c55e] hover:bg-[#22c55e22]'
                  : 'bg-[#161616] border border-[#2a2a2a] text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f]'">
                @if (book()!.read_status === 'read') {
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                } @else {
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                }
                <span class="hidden sm:inline">{{ book()!.read_status === 'read' ? 'Leido' : 'Sin leer' }}</span>
              </button>
              <button (click)="startEditing()" type="button"
                class="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm bg-[#161616] border border-[#2a2a2a]
                       text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f] transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                <span class="hidden sm:inline">Editar</span>
              </button>
              <button (click)="confirmDelete()"
                class="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm bg-[#ef444411] border border-[#ef444433]
                       text-[#ef4444] hover:bg-[#ef444422] transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <span class="hidden sm:inline">Eliminar</span>
              </button>
            } @else {
              <button (click)="cancelEditing()" type="button"
                class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-[#161616] border border-[#2a2a2a]
                       text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f] transition-colors">
                Cancelar
              </button>
              <button (click)="saveEdit()" [disabled]="saving()" type="button"
                class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#7c3aed]
                       hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                @if (saving()) {
                  <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Guardando...
                } @else {
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Guardar
                }
              </button>
            }
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">

          <!-- Cover + status column -->
          <div class="md:col-span-1 space-y-4">
            <div class="flex gap-4 md:block md:space-y-4">
              <div class="w-28 shrink-0 md:w-full">
                <div class="aspect-[2/3] rounded-2xl overflow-hidden bg-[#161616] border border-[#1e1e1e]">
                  @if (editing() ? draft.cover_url : book()!.cover_url) {
                    <img [src]="(editing() ? draft.cover_url : book()!.cover_url)!" [alt]="book()!.title" class="w-full h-full object-cover" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <svg class="w-10 h-10 md:w-16 md:h-16 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                  }
                </div>
                <button type="button" (click)="pickerOpen.set(true)" [disabled]="savingCover()"
                  class="w-full mt-2 py-1.5 rounded-xl text-xs text-[#a0a0a0] hover:text-white bg-[#161616]
                         border border-[#2a2a2a] hover:bg-[#1f1f1f] disabled:opacity-40 transition-colors">
                  {{ savingCover() ? 'Guardando portada...' : 'Cambiar portada' }}
                </button>
              </div>

              <!-- Rating + status card -->
              <div class="flex-1 md:flex-none bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
                <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-3">Mi valoracion</h3>
                <div class="flex gap-1">
                  @for (s of [1,2,3,4,5]; track s) {
                    <button type="button" (click)="setRating(s)"
                      class="text-xl transition-colors hover:scale-110"
                      [class]="s <= (book()!.rating ?? 0) ? 'text-[#f59e0b]' : 'text-[#2a2a2a] hover:text-[#f59e0b44]'">
                      ★
                    </button>
                  }
                </div>

                <!-- Notes -->
                <div class="mt-4 pt-3 border-t border-[#1e1e1e]">
                  @if (editing()) {
                    <label class="text-xs text-[#606060] mb-1 block">Notas</label>
                    <textarea [(ngModel)]="draft.notes" rows="3" placeholder="Escribe tus notas..."
                      class="edit-input resize-none text-xs"></textarea>
                  } @else if (!notesOpen() && book()!.notes) {
                    <button (click)="notesOpen.set(true)" type="button" class="w-full text-left">
                      <p class="text-xs text-[#a0a0a0] line-clamp-3 leading-relaxed">{{ book()!.notes }}</p>
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
                      + Anadir notas
                    </button>
                  }
                </div>

                @if (editing()) {
                  <div class="mt-4 pt-3 border-t border-[#1e1e1e] space-y-3">
                    <div class="flex items-center justify-between">
                      <label class="text-xs text-[#606060]">Estado</label>
                      <select [(ngModel)]="draft.read_status" class="edit-input !w-auto text-xs">
                        <option value="unread">Sin leer</option>
                        <option value="read">Leido</option>
                      </select>
                    </div>
                    <div class="flex items-center justify-between">
                      <label class="text-xs text-[#606060]">En coleccion</label>
                      <button type="button" (click)="draft.owned = !draft.owned"
                        class="relative w-9 h-5 rounded-full transition-colors duration-200"
                        [class]="draft.owned ? 'bg-[#7c3aed]' : 'bg-[#2a2a2a]'">
                        <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                          [class.translate-x-4]="draft.owned"></span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Info column -->
          <div class="md:col-span-2 space-y-3 md:space-y-4">

            <!-- Title header -->
            <div class="mb-4 md:mb-6">
              @if (!editing()) {
                @if (book()!.saga) {
                  <a [routerLink]="['/app/books']" [queryParams]="{saga: book()!.saga}"
                    class="text-[#8b5cf6] hover:text-[#a78bfa] text-sm font-medium mb-1 inline-block transition-colors">
                    {{ book()!.saga }}{{ book()!.saga_number ? ' #' + book()!.saga_number : '' }}
                  </a>
                }
                <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">{{ book()!.title }}</h1>
                @if (book()!.author) {
                  <p class="text-[#a0a0a0] mt-2 text-sm">Por <span class="text-white">{{ book()!.author }}</span></p>
                }
              } @else {
                <div class="space-y-3">
                  <div>
                    <label class="edit-label">Titulo</label>
                    <input [(ngModel)]="draft.title" type="text" placeholder="Titulo del libro"
                      class="edit-input text-lg font-bold" />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="edit-label flex items-center justify-between">
                        Saga
                        @if (book()!.isbn13 || book()!.isbn) {
                          <button type="button" (click)="detectSaga()" [disabled]="detectingSaga()"
                            class="text-[#7c3aed] hover:text-[#a78bfa] disabled:opacity-40 transition-colors">
                            {{ detectingSaga() ? 'Buscando...' : 'Detectar' }}
                          </button>
                        }
                      </label>
                      <input [(ngModel)]="draft.saga" type="text" list="bookSagas" placeholder="Ej: El Senor de los Anillos" class="edit-input" />
                      <datalist id="bookSagas">
                        @for (s of sagaOptions(); track s) { <option [value]="s"></option> }
                      </datalist>
                      @if (sagaMsg()) { <p class="text-[10px] text-[#606060] mt-1">{{ sagaMsg() }}</p> }
                    </div>
                    <div>
                      <label class="edit-label">Numero en saga</label>
                      <input [(ngModel)]="draft.saga_number" type="number" placeholder="Ej: 1" class="edit-input" />
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Synopsis -->
            @if (editing()) {
              <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
                <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-3">Sinopsis</h3>
                <textarea [(ngModel)]="draft.synopsis" rows="4" placeholder="Descripcion del libro..."
                  class="edit-input resize-none text-sm"></textarea>
              </div>
            } @else if (book()!.synopsis) {
              <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
                <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-3">Sinopsis</h3>
                <p class="text-sm text-[#c0c0c0] leading-relaxed whitespace-pre-line">{{ book()!.synopsis }}</p>
              </div>
            }

            <!-- Details grid -->
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
              <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-4">Detalles</h3>

              @if (editing()) {
                <div class="grid grid-cols-2 gap-x-6 md:gap-x-8 gap-y-4">
                  <div class="col-span-2">
                    <label class="edit-label">Autor</label>
                    <input [(ngModel)]="draft.author" type="text" placeholder="Autor" class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Traductor</label>
                    <input [(ngModel)]="draft.translator" type="text" placeholder="Traductor" class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Ilustrador</label>
                    <input [(ngModel)]="draft.illustrator" type="text" placeholder="Ilustrador" class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Editorial</label>
                    <input [(ngModel)]="draft.publisher" type="text" placeholder="Ej: Planeta, Anagrama..." class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Fecha publicacion</label>
                    <input [(ngModel)]="draft.publish_date" type="date" class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Paginas</label>
                    <input [(ngModel)]="draft.pages" type="number" placeholder="Ej: 350" class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Encuadernacion</label>
                    <input [(ngModel)]="draft.binding" type="text" placeholder="Ej: Tapa dura, Bolsillo..." class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Precio (EUR)</label>
                    <input [(ngModel)]="draft.price" type="number" step="0.01" placeholder="Ej: 19.95" class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Genero</label>
                    <input [(ngModel)]="draft.genre" type="text" placeholder="Ej: Fantasia, Ciencia ficcion..." class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Subgenero</label>
                    <input [(ngModel)]="draft.subgenre" type="text" placeholder="Subgenero" class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">ISBN</label>
                    <input [(ngModel)]="draft.isbn" type="text" placeholder="ISBN-10" class="edit-input font-mono" />
                  </div>
                  <div>
                    <label class="edit-label">ISBN-13</label>
                    <input [(ngModel)]="draft.isbn13" type="text" placeholder="978..." class="edit-input font-mono" />
                  </div>
                  <div>
                    <label class="edit-label">Idioma</label>
                    <input [(ngModel)]="draft.language" type="text" placeholder="Ej: Espanol" class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Edicion</label>
                    <input [(ngModel)]="draft.edition" type="text" placeholder="Ej: 1a edicion" class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Titulo original</label>
                    <input [(ngModel)]="draft.original_title" type="text" placeholder="Titulo en idioma original" class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Idioma original</label>
                    <input [(ngModel)]="draft.original_language" type="text" placeholder="Ej: English" class="edit-input" />
                  </div>
                </div>
              } @else {
                <dl class="grid grid-cols-2 gap-x-6 md:gap-x-8 gap-y-3 md:gap-y-4">
                  @if (book()!.publisher) {
                    <div><dt class="text-xs text-[#606060] mb-0.5">Editorial</dt><dd class="text-sm text-white">{{ book()!.publisher }}</dd></div>
                  }
                  @if (book()!.publish_date) {
                    <div><dt class="text-xs text-[#606060] mb-0.5">Publicacion</dt><dd class="text-sm text-white">{{ book()!.publish_date }}</dd></div>
                  }
                  @if (book()!.pages) {
                    <div><dt class="text-xs text-[#606060] mb-0.5">Paginas</dt><dd class="text-sm text-white">{{ book()!.pages }}</dd></div>
                  }
                  @if (book()!.binding) {
                    <div><dt class="text-xs text-[#606060] mb-0.5">Encuadernacion</dt><dd class="text-sm text-white">{{ book()!.binding }}</dd></div>
                  }
                  @if (book()!.price) {
                    <div><dt class="text-xs text-[#606060] mb-0.5">Precio</dt><dd class="text-sm text-white">{{ book()!.price }} EUR</dd></div>
                  }
                  @if (book()!.genre) {
                    <div><dt class="text-xs text-[#606060] mb-0.5">Genero</dt><dd class="text-sm text-white">{{ book()!.genre }}</dd></div>
                  }
                  @if (book()!.language) {
                    <div><dt class="text-xs text-[#606060] mb-0.5">Idioma</dt><dd class="text-sm text-white">{{ book()!.language }}</dd></div>
                  }
                  @if (book()!.isbn13 || book()!.isbn) {
                    <div><dt class="text-xs text-[#606060] mb-0.5">ISBN</dt><dd class="text-sm text-white font-mono">{{ book()!.isbn13 ?? book()!.isbn }}</dd></div>
                  }
                  @if (book()!.edition) {
                    <div><dt class="text-xs text-[#606060] mb-0.5">Edicion</dt><dd class="text-sm text-white">{{ book()!.edition }}</dd></div>
                  }
                  @if (book()!.original_title) {
                    <div><dt class="text-xs text-[#606060] mb-0.5">Titulo original</dt><dd class="text-sm text-white">{{ book()!.original_title }}</dd></div>
                  }
                  @if (book()!.translator) {
                    <div><dt class="text-xs text-[#606060] mb-0.5">Traductor</dt><dd class="text-sm text-white">{{ book()!.translator }}</dd></div>
                  }
                  @if (book()!.illustrator) {
                    <div><dt class="text-xs text-[#606060] mb-0.5">Ilustrador</dt><dd class="text-sm text-white">{{ book()!.illustrator }}</dd></div>
                  }
                </dl>
              }
            </div>

          </div>
        </div>
      }

    </div>
    @if (pickerOpen() && book()) {
      <app-cover-picker
        [isbn]="book()!.isbn13 || book()!.isbn"
        [title]="book()!.title"
        [author]="book()!.author"
        [current]="editing() ? draft.cover_url : book()!.cover_url"
        (picked)="onCoverPicked($event)"
        (closed)="pickerOpen.set(false)" />
    }
  `,
  styles: [`
    .edit-input {
      @apply w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white
             placeholder:text-[#303030] focus:outline-none focus:border-[#7c3aed] transition-colors duration-200;
    }
    select.edit-input option { background: #161616; }
    .edit-label {
      @apply block text-xs text-[#606060] mb-1;
    }
  `]
})
export class BookDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private covers = inject(CoversService);

  book = signal<Book | null>(null);
  loading = signal(true);
  editing = signal(false);
  saving = signal(false);
  notesOpen = signal(false);
  notesText = '';
  savingNotes = signal(false);
  pickerOpen = signal(false);
  savingCover = signal(false);
  sagaOptions = signal<string[]>([]);
  detectingSaga = signal(false);
  sagaMsg = signal('');

  draft = {
    title: '', author: '', translator: '', illustrator: '',
    publisher: '', publish_date: '', edition: '', original_title: '', original_language: '',
    synopsis: '', genre: '', subgenre: '', pages: null as number | null, language: '',
    saga: '', saga_number: null as number | null, price: null as number | null, binding: '',
    isbn: '', isbn13: '', ean: '',
    cover_url: '', notes: '', read_status: 'unread' as string, owned: false,
  };

  // "Atrás" conserva búsqueda y filtros de la lista (van en la URL); si la ficha se abrió
  // directamente no hay historial dentro de la app y se va a la lista
  goBack() {
    if ((history.state?.navigationId ?? 1) > 1) this.location.back();
    else this.router.navigate(['/app/books']);
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<Book>(`/books/${id}`).subscribe({
      next: b => { this.book.set(b); this.notesText = b.notes ?? ''; this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/app/books']); }
    });
  }

  startEditing() {
    const b = this.book()!;
    this.draft = {
      title: b.title ?? '', author: b.author ?? '', translator: b.translator ?? '',
      illustrator: b.illustrator ?? '', publisher: b.publisher ?? '',
      publish_date: b.publish_date ?? '', edition: b.edition ?? '',
      original_title: b.original_title ?? '', original_language: b.original_language ?? '',
      synopsis: b.synopsis ?? '', genre: b.genre ?? '', subgenre: b.subgenre ?? '',
      pages: b.pages, language: b.language ?? '', saga: b.saga ?? '',
      saga_number: b.saga_number, price: b.price, binding: b.binding ?? '',
      isbn: b.isbn ?? '', isbn13: b.isbn13 ?? '', ean: b.ean ?? '',
      cover_url: b.cover_url ?? '', notes: b.notes ?? '',
      read_status: b.read_status ?? 'unread', owned: b.owned ?? false,
    };
    this.sagaMsg.set('');
    this.editing.set(true);
    if (!this.sagaOptions().length) {
      this.api.get<{ sagas: string[] }>('/books/facets').subscribe({ next: f => this.sagaOptions.set(f.sagas) });
    }
  }

  /** Copia la portada elegida a R2; editando va al borrador, si no se guarda ya. */
  onCoverPicked(url: string) {
    this.pickerOpen.set(false);
    this.savingCover.set(true);
    this.covers.persist(url).subscribe({
      next: stored => {
        if (this.editing()) {
          this.draft.cover_url = stored;
          this.savingCover.set(false);
          return;
        }
        const b = this.book()!;
        this.api.put<Book>(`/books/${b.id}`, { ...b, cover_url: stored }).subscribe({
          next: updated => { this.book.set(updated); this.savingCover.set(false); },
          error: () => this.savingCover.set(false),
        });
      },
      error: () => { this.savingCover.set(false); alert('No se pudo descargar esa imagen'); },
    });
  }

  /** Vuelve a pedir la ficha por ISBN solo para sacar la saga (Amazon la da estructurada). */
  detectSaga() {
    const isbn = this.book()!.isbn13 || this.book()!.isbn;
    if (!isbn) return;
    this.detectingSaga.set(true);
    this.sagaMsg.set('');
    this.api.get<{ data: { saga: string | null; sagaNumber: number | null } | null }>(
      `/google-books/isbn/${encodeURIComponent(isbn)}`
    ).subscribe({
      next: res => {
        this.detectingSaga.set(false);
        if (res.data?.saga) {
          this.draft.saga = res.data.saga;
          this.draft.saga_number = res.data.sagaNumber;
        } else {
          this.sagaMsg.set('Ningun catalogo lo situa en una saga');
        }
      },
      error: () => { this.detectingSaga.set(false); this.sagaMsg.set('Error al buscar'); },
    });
  }

  cancelEditing() { this.editing.set(false); }

  saveEdit() {
    const b = this.book()!;
    if (!this.draft.title?.trim()) return;
    this.saving.set(true);

    const payload: Record<string, any> = { ...b };
    const d = this.draft as Record<string, any>;
    for (const key of Object.keys(d)) {
      const val = d[key];
      payload[key] = (val === '' || val === undefined) ? null : val;
    }
    payload['title'] = this.draft.title.trim();

    this.api.put<Book>(`/books/${b.id}`, payload).subscribe({
      next: (updated) => {
        this.book.set(updated);
        this.notesText = updated.notes ?? '';
        this.editing.set(false);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete() {
    if (!confirm('Eliminar este libro? Esta accion no se puede deshacer.')) return;
    this.api.delete(`/books/${this.book()!.id}`).subscribe({
      next: () => this.router.navigate(['/app/books'])
    });
  }

  toggleReadStatus() {
    const b = this.book();
    if (!b) return;
    const status = b.read_status === 'read' ? 'unread' : 'read';
    this.api.put<Book>(`/books/${b.id}`, { ...b, read_status: status }).subscribe({
      next: (updated) => this.book.set(updated),
    });
  }

  setRating(n: number) {
    const b = this.book();
    if (!b) return;
    const rating = b.rating === n ? null : n;
    this.api.put<Book>(`/books/${b.id}`, { ...b, rating }).subscribe({
      next: (updated) => this.book.set(updated),
    });
  }

  saveNotes() {
    const b = this.book();
    if (!b) return;
    this.savingNotes.set(true);
    this.api.put<Book>(`/books/${b.id}`, { ...b, notes: this.notesText || null }).subscribe({
      next: (updated) => {
        this.book.set(updated);
        this.notesOpen.set(false);
        this.savingNotes.set(false);
      },
      error: () => this.savingNotes.set(false),
    });
  }
}
