import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { Book } from '../../../shared/models/book.model';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-8 max-w-4xl mx-auto">

      <div class="flex items-center gap-4 mb-8">
        <a routerLink="/app/books"
          class="p-2 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors">
          <svg class="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </a>
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">
            {{ isEdit() ? 'Editar libro' : 'Añadir libro' }}
          </h1>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <!-- Portada + estado -->
          <div class="lg:col-span-1">
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-5 sticky top-8">
              <h2 class="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider mb-4">Portada</h2>
              <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#0d0d0d] border border-[#2a2a2a] mb-4 flex items-center justify-center">
                @if (coverPreview()) {
                  <img [src]="coverPreview()" alt="Portada" class="w-full h-full object-cover" />
                } @else {
                  <div class="text-center p-4">
                    <svg class="w-10 h-10 text-[#2a2a2a] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
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
                        [class]="(form.value.rating ?? 0) >= star ? 'text-[#f59e0b]' : 'text-[#2a2a2a]'">★</button>
                    }
                  </div>
                </div>
                <div>
                  <label class="field-label">Notas personales</label>
                  <textarea formControlName="notes" rows="3" placeholder="Apuntes, opinión..."
                    class="field-input resize-none"></textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- Datos -->
          <div class="lg:col-span-2 space-y-6">

            <section class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-6">
              <h2 class="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider mb-5">Identificación</h2>
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="field-label">Título <span class="text-[#ef4444]">*</span></label>
                  <input formControlName="title" type="text" placeholder="Título del libro" class="field-input" />
                </div>
                <div>
                  <label class="field-label">ISBN-13</label>
                  <input formControlName="isbn13" type="text" placeholder="978..." class="field-input" />
                </div>
                <div>
                  <label class="field-label">ISBN-10</label>
                  <input formControlName="isbn" type="text" placeholder="ISBN-10" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Saga</label>
                  <input formControlName="saga" type="text" placeholder="Ej: Juego de Tronos" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Nº en la saga</label>
                  <input formControlName="saga_number" type="number" placeholder="Ej: 1" class="field-input" />
                </div>
              </div>
            </section>

            <section class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-6">
              <h2 class="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider mb-5">Autores</h2>
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="field-label">Autor</label>
                  <input formControlName="author" type="text" placeholder="Nombre del autor" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Traductor</label>
                  <input formControlName="translator" type="text" placeholder="Nombre del traductor" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Ilustrador</label>
                  <input formControlName="illustrator" type="text" placeholder="Nombre del ilustrador" class="field-input" />
                </div>
              </div>
            </section>

            <section class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-6">
              <h2 class="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider mb-5">Editorial</h2>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="field-label">Editorial</label>
                  <input formControlName="publisher" type="text" placeholder="Ej: Alianza, Planeta..." class="field-input" />
                </div>
                <div>
                  <label class="field-label">Edición</label>
                  <input formControlName="edition" type="text" placeholder="Ej: 1ª edición" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Fecha de publicación</label>
                  <input formControlName="publish_date" type="date" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Páginas</label>
                  <input formControlName="pages" type="number" placeholder="Ej: 350" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Título original</label>
                  <input formControlName="original_title" type="text" placeholder="Título original" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Idioma original</label>
                  <input formControlName="original_language" type="text" placeholder="Ej: Inglés" class="field-input" />
                </div>
              </div>
            </section>

            <section class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-6">
              <h2 class="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider mb-5">Descripción</h2>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="field-label">Género</label>
                  <input formControlName="genre" type="text" placeholder="Ej: Fantasía, Terror..." class="field-input" />
                </div>
                <div>
                  <label class="field-label">Subgénero</label>
                  <input formControlName="subgenre" type="text" placeholder="Ej: Epic Fantasy" class="field-input" />
                </div>
                <div>
                  <label class="field-label">Idioma</label>
                  <input formControlName="language" type="text" placeholder="Ej: Español" class="field-input" />
                </div>
                <div class="col-span-2">
                  <label class="field-label">Sinopsis</label>
                  <textarea formControlName="synopsis" rows="5" placeholder="Descripción del argumento..."
                    class="field-input resize-none"></textarea>
                </div>
              </div>
            </section>

            <div class="flex items-center justify-end gap-3 pb-8">
              <a routerLink="/app/books"
                class="px-6 py-2.5 rounded-xl text-sm text-[#a0a0a0] hover:text-white bg-[#161616]
                       border border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors">Cancelar</a>
              <button type="submit" [disabled]="saving() || form.invalid"
                class="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7c3aed]
                       hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                @if (saving()) { Guardando... } @else { {{ isEdit() ? 'Guardar cambios' : 'Añadir libro' }} }
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .field-label { @apply block text-xs font-medium text-[#606060] mb-1.5; }
    .field-input {
      @apply w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-sm text-white
             placeholder:text-[#303030] focus:outline-none focus:border-[#7c3aed] transition-colors duration-200;
    }
    select.field-input option { background: #161616; }
  `]
})
export class BookFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = signal(false);
  saving = signal(false);
  coverPreview = signal('');
  private editId: number | null = null;

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    isbn: [''], isbn13: [''], ean: [''],
    author: [''], translator: [''], illustrator: [''],
    publisher: [''], publish_date: [''], edition: [''],
    original_title: [''], original_language: [''],
    synopsis: [''], genre: [''], subgenre: [''],
    pages: [null as number | null], language: [''],
    saga: [''], saga_number: [null as number | null],
    cover_url: [''],
    read_status: ['unread' as const],
    owned: [false], rating: [null as number | null], notes: [''],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.editId = +id;
      this.api.get<Book>(`/books/${id}`).subscribe(book => {
        this.form.patchValue(book as any);
        this.coverPreview.set(book.cover_url ?? '');
      });
    }
  }

  toggleOwned() { this.form.patchValue({ owned: !this.form.value.owned }); }
  setRating(n: number) { this.form.patchValue({ rating: this.form.value.rating === n ? null : n }); }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const data = this.form.getRawValue();
    const req = this.isEdit()
      ? this.api.put<Book>(`/books/${this.editId}`, data)
      : this.api.post<Book>('/books', data);
    req.subscribe({
      next: book => this.router.navigate(['/app/books', book.id]),
      error: () => this.saving.set(false)
    });
  }
}
