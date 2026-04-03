import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from '../../../shared/services/api.service';
import { Comic } from '../../../shared/models/comic.model';
import { environment } from '../../../../environments/environment';

interface WhakoomResult {
  id: string;
  title: string;
  cover: string | null;
  publisher: string;
  type: string;
}

interface WhakoomComic {
  id: string;
  title: string;
  cover: string;
  description: string;
  authors: string[];
  structuredAuthors?: { name: string; role: string }[];
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
}

interface CollectionResponse {
  id: number;
  whakoom_id?: string;
  existed?: boolean;
}

@Component({
  selector: 'app-comic-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="p-8 max-w-4xl mx-auto">

      <!-- Header -->
      <div class="flex items-center gap-4 mb-8">
        <a routerLink="/app/comics"
          class="p-2 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors">
          <svg class="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </a>
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">
            {{ isEdit() ? 'Editar cómic' : 'Añadir cómic' }}
          </h1>
          <p class="text-[#606060] text-sm mt-0.5">{{ isEdit() ? 'Actualiza los datos del cómic' : 'Rellena los datos del nuevo cómic' }}</p>
        </div>

        <!-- Botón buscar en Whakoom -->
        @if (!isEdit()) {
          <button type="button" (click)="openWhakoom()"
            class="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                   bg-[#161616] border border-[#2a2a2a] text-[#a0a0a0]
                   hover:bg-[#1f1f1f] hover:text-white hover:border-[#7c3aed] transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Buscar en Whakoom
          </button>
        }
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <!-- Columna izquierda: portada -->
          <div class="lg:col-span-1">
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5 sticky top-8">
              <h2 class="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider mb-4">Portada</h2>

              <!-- Preview -->
              <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#0d0d0d] border border-[#2a2a2a] mb-4 flex items-center justify-center">
                @if (coverPreview()) {
                  <img [src]="coverPreview()" alt="Portada" class="w-full h-full object-cover" />
                } @else {
                  <div class="text-center p-4">
                    <svg class="w-10 h-10 text-[#2a2a2a] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <p class="text-xs text-[#404040]">Sin portada</p>
                  </div>
                }
              </div>

              <div>
                <label class="field-label">URL de portada</label>
                <input formControlName="cover_url" type="url" placeholder="https://..."
                  (input)="coverPreview.set(form.value.cover_url || '')"
                  class="field-input" />
              </div>

              <!-- Estado personal -->
              <div class="mt-5 space-y-4 pt-5 border-t border-[#1e1e1e]">
                <h2 class="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider">Mi colección</h2>

                <div>
                  <label class="field-label">Estado de lectura</label>
                  <select formControlName="read_status" class="field-input">
                    <option value="unread">Sin leer</option>
                    <option value="read">Leído</option>
                  </select>
                </div>

                <div class="flex items-center justify-between">
                  <label class="text-sm text-[#a0a0a0]">Lo tengo en colección</label>
                  <button type="button" (click)="toggleOwned()"
                    class="relative w-11 h-6 rounded-full transition-colors duration-200"
                    [class]="form.value.owned ? 'bg-[#7c3aed]' : 'bg-[#2a2a2a]'">
                    <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                      [class.translate-x-5]="form.value.owned"></span>
                  </button>
                </div>

                <div>
                  <label class="field-label">Valoración</label>
                  <div class="flex gap-1 mt-1">
                    @for (star of [1,2,3,4,5]; track star) {
                      <button type="button" (click)="setRating(star)"
                        class="text-xl transition-colors"
                        [class]="(form.value.rating ?? 0) >= star ? 'text-[#f59e0b]' : 'text-[#2a2a2a]'">
                        ★
                      </button>
                    }
                  </div>
                </div>

                @if (isEdit()) {
                  <div>
                    <label class="field-label">Notas personales</label>
                    <textarea formControlName="notes" rows="3" placeholder="Apuntes, opinión..."
                      class="field-input resize-none"></textarea>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Columna derecha: datos -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Identificación -->
            <section class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-6">
              <h2 class="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider mb-5">Identificación</h2>
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="field-label">Título <span class="text-[#ef4444]">*</span></label>
                  <input formControlName="title" type="text" placeholder="Título del número"
                    class="field-input" />
                </div>
                <div>
                  <label class="field-label">Serie / Colección</label>
                  <input formControlName="series" type="text" placeholder="Ej: Batman"
                    class="field-input" />
                </div>
                <div>
                  <label class="field-label">Número</label>
                  <input formControlName="number" type="number" placeholder="Ej: 42"
                    class="field-input" />
                </div>
                <div>
                  <label class="field-label">ISBN / EAN</label>
                  <input formControlName="isbn" type="text" placeholder="978..."
                    class="field-input" />
                </div>
                <div>
                  <label class="field-label">Formato</label>
                  <select formControlName="format" class="field-input">
                    <option value="">Selecciona...</option>
                    <option value="grapa">Grapa</option>
                    <option value="tomo">Tomo</option>
                    <option value="integral">Integral</option>
                    <option value="omnibus">Omnibus</option>
                    <option value="manga">Manga</option>
                    <option value="novela_grafica">Novela gráfica</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
            </section>

            <!-- Autores -->
            <section class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-6">
              <h2 class="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider mb-5">Autores</h2>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="field-label">Guionista</label>
                  <input formControlName="writer" type="text" placeholder="Nombre del guionista"
                    class="field-input" />
                </div>
                <div>
                  <label class="field-label">Dibujante</label>
                  <input formControlName="artist" type="text" placeholder="Nombre del dibujante"
                    class="field-input" />
                </div>
                <div>
                  <label class="field-label">Colorista</label>
                  <input formControlName="colorist" type="text" placeholder="Nombre del colorista"
                    class="field-input" />
                </div>
                <div>
                  <label class="field-label">Portadista</label>
                  <input formControlName="cover_artist" type="text" placeholder="Nombre del portadista"
                    class="field-input" />
                </div>
              </div>
            </section>

            <!-- Editorial -->
            <section class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-6">
              <h2 class="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider mb-5">Editorial</h2>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="field-label">Editorial</label>
                  <input formControlName="publisher" type="text" placeholder="Ej: Planeta, ECC..."
                    class="field-input" />
                </div>
                <div>
                  <label class="field-label">Colección editorial</label>
                  <input formControlName="collection" type="text" placeholder="Ej: Marvel Héroes"
                    class="field-input" />
                </div>
                <div>
                  <label class="field-label">Fecha de publicación</label>
                  <input formControlName="publish_date" type="date"
                    class="field-input" />
                </div>
                <div>
                  <label class="field-label">Páginas</label>
                  <input formControlName="pages" type="number" placeholder="Ej: 120"
                    class="field-input" />
                </div>
                <div>
                  <label class="field-label">Encuadernación</label>
                  <input formControlName="binding" type="text" placeholder="Ej: Cartoné, Grapa, Rústica..."
                    class="field-input" />
                </div>
                <div>
                  <label class="field-label">Precio (€)</label>
                  <input formControlName="price" type="number" step="0.01" placeholder="Ej: 19.95"
                    class="field-input" />
                </div>
                <div>
                  <label class="field-label">Editorial original</label>
                  <input formControlName="original_publisher" type="text" placeholder="Ej: Marvel, DC..."
                    class="field-input" />
                </div>
                <div>
                  <label class="field-label">Título original</label>
                  <input formControlName="original_title" type="text" placeholder="Título en inglés"
                    class="field-input" />
                </div>
              </div>
            </section>

            <!-- Descripción -->
            <section class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-6">
              <h2 class="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider mb-5">Descripción</h2>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="field-label">Género</label>
                  <input formControlName="genre" type="text" placeholder="Ej: Superhéroes, Terror..."
                    class="field-input" />
                </div>
                <div>
                  <label class="field-label">Idioma</label>
                  <input formControlName="language" type="text" placeholder="Ej: Español"
                    class="field-input" />
                </div>
                <div class="col-span-2">
                  <label class="field-label">Sinopsis</label>
                  <textarea formControlName="synopsis" rows="5" placeholder="Descripción del argumento..."
                    class="field-input resize-none"></textarea>
                </div>
              </div>
            </section>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pb-8">
              <a routerLink="/app/comics"
                class="px-6 py-2.5 rounded-xl text-sm text-[#a0a0a0] hover:text-white bg-[#161616]
                       border border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors">
                Cancelar
              </a>
              <button type="submit" [disabled]="saving() || form.invalid"
                class="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7c3aed]
                       hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                @if (saving()) { Guardando... } @else { {{ isEdit() ? 'Guardar cambios' : 'Añadir cómic' }} }
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>

    <!-- ── Modal Whakoom ──────────────────────────────────────────────────── -->
    @if (whakoomOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
           (click)="closeWhakoom()">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

        <div class="relative bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl
                    max-h-[85vh] flex flex-col shadow-2xl"
             (click)="$event.stopPropagation()">

          <!-- Cabecera modal -->
          <div class="flex items-center gap-3 p-5 border-b border-[#1e1e1e]">
            <svg class="w-5 h-5 text-[#7c3aed] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <h2 class="text-white font-semibold">Buscar en Whakoom</h2>
            <button type="button" (click)="closeWhakoom()"
              class="ml-auto p-1 text-[#606060] hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Buscador -->
          <div class="p-4 border-b border-[#1e1e1e]">
            <div class="flex gap-2">
              <input #searchInput
                type="text"
                [(ngModel)]="whakoomQuery"
                [ngModelOptions]="{standalone: true}"
                placeholder="Título del cómic..."
                (keydown.enter)="searchWhakoom()"
                class="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white
                       placeholder:text-[#303030] focus:outline-none focus:border-[#7c3aed] transition-colors" />
              <button type="button" (click)="searchWhakoom()"
                [disabled]="whakoomLoading()"
                class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7c3aed]
                       hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                @if (whakoomLoading()) { Buscando... } @else { Buscar }
              </button>
            </div>
            @if (whakoomError()) {
              <p class="text-[#ef4444] text-xs mt-2">{{ whakoomError() }}</p>
            }
          </div>

          <!-- Resultados / Detail -->
          <div class="flex-1 overflow-y-auto p-4">

            @if (whakoomDetail()) {
              <!-- Vista detalle del cómic seleccionado -->
              <div>
                <button type="button" (click)="whakoomDetail.set(null)"
                  class="flex items-center gap-1.5 text-xs text-[#606060] hover:text-white mb-4 transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Volver a resultados
                </button>

                <div class="flex gap-5">
                  @if (whakoomDetail()!.cover) {
                    <img [src]="whakoomDetail()!.cover" alt="Portada"
                      class="w-28 shrink-0 rounded-lg border border-[#2a2a2a] object-cover aspect-[2/3]" />
                  }
                  <div class="flex-1 min-w-0">
                    <h3 class="text-white font-semibold text-base leading-tight">{{ whakoomDetail()!.title }}</h3>
                    @if (whakoomDetail()!.series) {
                      <p class="text-[#7c3aed] text-xs mt-1 uppercase tracking-wider">{{ whakoomDetail()!.series }}</p>
                    }
                    <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      @if (whakoomDetail()!.publisher) {
                        <div><span class="text-[#505050]">Editorial</span><br><span class="text-[#a0a0a0]">{{ whakoomDetail()!.publisher }}</span></div>
                      }
                      @if (whakoomDetail()!.date) {
                        <div><span class="text-[#505050]">Fecha</span><br><span class="text-[#a0a0a0]">{{ whakoomDetail()!.date }}</span></div>
                      }
                      @if (whakoomDetail()!.number) {
                        <div><span class="text-[#505050]">Número</span><br><span class="text-[#a0a0a0]">#{{ whakoomDetail()!.number }}</span></div>
                      }
                      @if (whakoomDetail()!.isbn) {
                        <div><span class="text-[#505050]">ISBN</span><br><span class="text-[#a0a0a0]">{{ whakoomDetail()!.isbn }}</span></div>
                      }
                    </div>
                    @if (whakoomDetail()!.authors?.length) {
                      <p class="mt-2 text-xs text-[#505050]">Autores: <span class="text-[#a0a0a0]">{{ whakoomDetail()!.authors.join(' · ') }}</span></p>
                    }
                    @if (whakoomDetail()!.description) {
                      <p class="mt-3 text-xs text-[#606060] line-clamp-4 leading-relaxed">{{ whakoomDetail()!.description }}</p>
                    }
                  </div>
                </div>

                <button type="button" (click)="applyWhakoom()"
                  class="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7c3aed]
                         hover:bg-[#6d28d9] transition-colors">
                  Usar estos datos
                </button>
              </div>
            } @else {
              <!-- Lista de resultados -->
              @if (whakoomResults().length > 0) {
                @if (whakoomTotal() > 0) {
                  <p class="text-xs text-[#505050] mb-3">{{ whakoomTotal() }} resultados</p>
                }
                <div class="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
                  @for (result of whakoomResults(); track result.id) {
                    <button type="button" (click)="loadWhakoomDetail(result.id, result.type)"
                      [disabled]="whakoomLoading()"
                      class="group text-left disabled:opacity-50">
                      <div class="aspect-[2/3] rounded-lg overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a]
                                  group-hover:border-[#7c3aed] transition-colors">
                        @if (result.cover) {
                          <img [src]="result.cover" [alt]="result.title" class="w-full h-full object-cover" loading="lazy" />
                        } @else {
                          <div class="w-full h-full flex items-center justify-center text-[#303030]">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                          </div>
                        }
                      </div>
                      <p class="mt-1.5 text-xs text-[#a0a0a0] group-hover:text-white line-clamp-2 leading-tight transition-colors">{{ result.title }}</p>
                    </button>
                  }
                </div>
                @if (whakoomHasMore() && !whakoomLoading()) {
                  <button type="button" (click)="loadMoreWhakoom()"
                    class="mt-4 w-full py-2 rounded-xl text-xs text-[#a0a0a0] bg-[#1a1a1a] border border-[#2a2a2a]
                           hover:bg-[#222] hover:text-white transition-colors">
                    Cargar más resultados
                  </button>
                }
              } @else if (!whakoomLoading() && whakoomSearched()) {
                <div class="text-center py-12 text-[#404040]">
                  <svg class="w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  <p class="text-sm">Sin resultados para esa búsqueda</p>
                </div>
              } @else if (!whakoomLoading()) {
                <div class="text-center py-12 text-[#404040]">
                  <p class="text-sm">Escribe el título del cómic y pulsa Buscar</p>
                </div>
              }

              @if (whakoomLoading()) {
                <div class="text-center py-12">
                  <div class="inline-block w-6 h-6 border-2 border-[#2a2a2a] border-t-[#7c3aed] rounded-full animate-spin"></div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .field-label {
      @apply block text-xs font-medium text-[#606060] mb-1.5;
    }
    .field-input {
      @apply w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-sm text-white
             placeholder:text-[#303030] focus:outline-none focus:border-[#7c3aed] transition-colors duration-200;
    }
    select.field-input option { background: #161616; }
  `]
})
export class ComicFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private base = environment.apiUrl;

  isEdit = signal(false);
  saving = signal(false);
  coverPreview = signal('');
  private editId: number | null = null;
  _pendingAuthors: { name: string; role: string }[] | null = null;

  // Whakoom modal state
  whakoomOpen = signal(false);
  whakoomQuery = '';
  whakoomLoading = signal(false);
  whakoomError = signal('');
  whakoomResults = signal<WhakoomResult[]>([]);
  whakoomDetail = signal<WhakoomComic | null>(null);
  whakoomSearched = signal(false);
  whakoomPage = signal(1);
  whakoomHasMore = signal(false);
  whakoomTotal = signal(0);
  private whakoomSelectedResult: WhakoomResult | null = null;

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    series: [''],
    number: [null as number | null],
    volume: [null as number | null],
    isbn: [''],
    ean: [''],
    writer: [''],
    artist: [''],
    colorist: [''],
    cover_artist: [''],
    publisher: [''],
    collection: [''],
    publish_date: [''],
    original_publisher: [''],
    original_title: [''],
    synopsis: [''],
    genre: [''],
    format: [''],
    pages: [null as number | null],
    binding: [''],
    price: [null as number | null],
    language: [''],
    cover_url: [''],
    read_status: ['unread' as const],
    owned: [false],
    rating: [null as number | null],
    notes: [''],
    collection_id: [null as number | null],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.editId = +id;
      this.api.get<Comic>(`/comics/${id}`).subscribe(comic => {
        this.form.patchValue(comic as any);
        this.coverPreview.set(comic.cover_url ?? '');
        this._pendingAuthors = comic.authors ?? null;
      });
    }
  }

  toggleOwned() {
    this.form.patchValue({ owned: !this.form.value.owned });
  }

  setRating(n: number) {
    this.form.patchValue({ rating: this.form.value.rating === n ? null : n });
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const data = { ...this.form.getRawValue(), authors: this._pendingAuthors };

    const req = this.isEdit()
      ? this.api.put<Comic>(`/comics/${this.editId}`, data)
      : this.api.post<Comic>('/comics', data);

    req.subscribe({
      next: comic => this.router.navigate(['/app/comics', comic.id]),
      error: () => this.saving.set(false)
    });
  }

  // ── Whakoom ────────────────────────────────────────────────────────────────

  openWhakoom() {
    this.whakoomOpen.set(true);
    this.whakoomQuery = '';
    this.whakoomResults.set([]);
    this.whakoomDetail.set(null);
    this.whakoomError.set('');
    this.whakoomSearched.set(false);
    this.whakoomPage.set(1);
    this.whakoomHasMore.set(false);
    this.whakoomTotal.set(0);
  }

  closeWhakoom() {
    this.whakoomOpen.set(false);
  }

  searchWhakoom(loadMore = false) {
    if (!this.whakoomQuery.trim()) return;
    this.whakoomLoading.set(true);
    this.whakoomError.set('');
    this.whakoomDetail.set(null);

    if (!loadMore) {
      this.whakoomResults.set([]);
      this.whakoomPage.set(1);
      this.whakoomSearched.set(false);
    }

    const params = new HttpParams()
      .set('q', this.whakoomQuery.trim())
      .set('page', this.whakoomPage().toString());

    this.http.get<{ data: WhakoomResult[]; total: number; page: number; hasMore: boolean } | { error: string }>(
      `${this.base}/whakoom/search`, { params }
    ).subscribe({
      next: (res) => {
        if ('error' in res) {
          this.whakoomError.set(res.error);
        } else {
          this.whakoomResults.update(prev => loadMore ? [...prev, ...res.data] : res.data);
          this.whakoomTotal.set(res.total);
          this.whakoomHasMore.set(res.hasMore);
        }
        this.whakoomSearched.set(true);
        this.whakoomLoading.set(false);
      },
      error: () => {
        this.whakoomError.set('Error al conectar con el servidor');
        this.whakoomLoading.set(false);
      }
    });
  }

  loadMoreWhakoom() {
    this.whakoomPage.update(p => p + 1);
    this.searchWhakoom(true);
  }

  loadWhakoomDetail(id: string, type: string = 'comic') {
    this.whakoomSelectedResult = this.whakoomResults().find(r => r.id === id) ?? null;
    this.whakoomLoading.set(true);
    this.whakoomError.set('');

    const params = new HttpParams().set('type', type);
    this.http.get<WhakoomComic | { error: string }>(`${this.base}/whakoom/comic/${id}`, { params }).subscribe({
      next: (res) => {
        if ('error' in res) {
          this.whakoomError.set((res as { error: string }).error);
        } else {
          this.whakoomDetail.set(res as WhakoomComic);
        }
        this.whakoomLoading.set(false);
      },
      error: () => {
        this.whakoomError.set('Error al cargar el cómic');
        this.whakoomLoading.set(false);
      }
    });
  }

  applyWhakoom() {
    const d = this.whakoomDetail();
    if (!d) return;

    const patch: Partial<typeof this.form.value> = {};

    if (d.title)       patch.title        = d.title;
    if (d.series)      patch.series       = d.series;
    if (d.publisher)   patch.publisher    = d.publisher;
    if (d.isbn)        patch.isbn         = d.isbn;
    if (d.number)      patch.number       = Number(d.number) || null;
    if (d.description) patch.synopsis     = d.description;
    if (d.date)        patch.publish_date = d.date;
    if (d.language)    patch.language     = d.language;
    if (d.pages)       patch.pages        = d.pages;
    if (d.binding)     patch.binding      = d.binding;
    if (d.price)       patch.price        = d.price;

    // Autores con roles estructurados
    const sa = d.structuredAuthors ?? [];
    if (sa.length) {
      const guionista = sa.find(a => a.role.toLowerCase().includes('guion'));
      const dibujante = sa.find(a => a.role.toLowerCase().includes('dibujo'));
      if (guionista) patch.writer = guionista.name;
      else if (d.authors?.[0]) patch.writer = d.authors[0];
      if (dibujante) patch.artist = dibujante.name;
      else if (d.authors?.[1]) patch.artist = d.authors[1];
    } else {
      if (d.authors?.length >= 1) patch.writer = d.authors[0];
      if (d.authors?.length >= 2) patch.artist = d.authors[1];
    }
    // Store structured authors for saving
    this._pendingAuthors = sa.length ? sa : null;

    // Temporalmente poner la cover de Whakoom, luego subir a R2
    if (d.cover) {
      patch.cover_url = d.cover;
      this.coverPreview.set(d.cover);
    }

    this.form.patchValue(patch as any);
    this.closeWhakoom();

    // Subir portada a R2 en background
    if (d.cover) {
      this.uploadCoverToR2(d.cover);
    }

    // Si viene de una edición (colección), crear/vincular la colección
    const src = this.whakoomSelectedResult;
    if (src && src.type === 'edition') {
      this.createCollection(src);
    }
  }

  private uploadCoverToR2(imageUrl: string) {
    this.http.post<{ key: string; url: string }>(
      `${this.base}/covers/upload`, { url: imageUrl }
    ).subscribe({
      next: (res) => {
        const r2Url = `${this.base}/covers/${res.key}`;
        this.form.patchValue({ cover_url: r2Url });
        this.coverPreview.set(r2Url);
      }
    });
  }

  private createCollection(src: WhakoomResult) {
    const d = this.whakoomDetail();
    this.http.post<CollectionResponse>(`${this.base}/collections`, {
      whakoom_id: src.id,
      whakoom_type: src.type,
      title: d?.series || src.title,
      publisher: d?.publisher || src.publisher,
      cover_url: src.cover,
      url: `https://www.whakoom.com/ediciones/${src.id}`,
    }).subscribe({
      next: (col) => {
        this.form.patchValue({ collection_id: col.id } as any);
      }
    });
  }
}
