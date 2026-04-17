import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from '../../../shared/services/api.service';
import { Comic, ComicFormat } from '../../../shared/models/comic.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-comic-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
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
          <button (click)="goBack()"
            class="flex items-center gap-2 text-sm text-[#606060] hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver
          </button>
          <div class="flex items-center gap-2">
            @if (!editing()) {
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
                <span class="hidden sm:inline">{{ comic()!.read_status === 'read' ? 'Leido' : 'Sin leer' }}</span>
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
              <!-- Edit mode actions -->
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

        <!-- Content -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">

          <!-- Cover + rating column -->
          <div class="md:col-span-1 space-y-4">
            <div class="flex gap-4 md:block md:space-y-4">
              <div class="w-28 shrink-0 md:w-full">
                <div class="aspect-[2/3] rounded-2xl overflow-hidden bg-[#161616] border border-[#1e1e1e]">
                  @if (editing() ? draft.cover_url : comic()!.cover_url) {
                    <img [src]="(editing() ? draft.cover_url : comic()!.cover_url)!" [alt]="comic()!.title" class="w-full h-full object-cover" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <svg class="w-10 h-10 md:w-16 md:h-16 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  }
                </div>
                @if (editing()) {
                  <input [(ngModel)]="draft.cover_url" type="url" placeholder="URL de portada"
                    class="edit-input mt-2 text-xs" />
                }
              </div>

              <!-- Mi valoracion -->
              <div class="flex-1 md:flex-none bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
                <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-3">Mi valoracion</h3>
                <div class="flex gap-1">
                  @for (s of [1,2,3,4,5]; track s) {
                    <button type="button" (click)="setRating(s)"
                      class="text-xl transition-colors hover:scale-110"
                      [class]="s <= (comic()!.rating ?? 0) ? 'text-[#f59e0b]' : 'text-[#2a2a2a] hover:text-[#f59e0b44]'">
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
                  } @else if (!notesOpen() && comic()!.notes) {
                    <button (click)="notesOpen.set(true)" type="button" class="w-full text-left">
                      <p class="text-xs text-[#a0a0a0] line-clamp-3 leading-relaxed">{{ comic()!.notes }}</p>
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
                      + Añadir notas
                    </button>
                  }
                </div>

                <!-- Owned + read status in edit mode -->
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
                @if (comic()!.collection_id && comic()!.number != null) {
                  <a [routerLink]="['/app/collections', comic()!.collection_id]"
                    class="text-[#8b5cf6] hover:text-[#a78bfa] text-sm font-medium mb-1 inline-block transition-colors">
                    {{ comic()!.collection_name || comic()!.series }}@if (comic()!.subtitle && comic()!.number != null) { <span class="text-[#7c3aed]/70"> · #{{ comic()!.number }}</span> }
                  </a>
                }
                <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">{{ comic()!.subtitle || comic()!.title }}</h1>
                @if (mainWriter()) {
                  <p class="text-[#a0a0a0] mt-2 text-sm">Por <span class="text-white">{{ mainWriter() }}</span></p>
                }
              } @else {
                <div class="space-y-3">
                  <div>
                    <label class="edit-label">Titulo</label>
                    <input [(ngModel)]="draft.title" type="text" placeholder="Titulo del comic"
                      class="edit-input text-lg font-bold" />
                  </div>
                  <div>
                    <label class="edit-label">Subtitulo <span class="text-[#505050] font-normal">(si pertenece a una coleccion tipo "One-Shot")</span></label>
                    <input [(ngModel)]="draft.subtitle" type="text" placeholder="Ej: Batman: Patrones oscuros 2"
                      class="edit-input" />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="edit-label">Serie</label>
                      <input [(ngModel)]="draft.series" type="text" placeholder="Ej: Batman" class="edit-input" />
                    </div>
                    <div>
                      <label class="edit-label">Numero</label>
                      <input [(ngModel)]="draft.number" type="number" placeholder="Ej: 42" class="edit-input" />
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Synopsis -->
            @if (editing()) {
              <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
                <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-3">Sinopsis</h3>
                <textarea [(ngModel)]="draft.synopsis" rows="4" placeholder="Descripcion del argumento..."
                  class="edit-input resize-none text-sm"></textarea>
              </div>
            } @else if (comic()!.synopsis) {
              <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
                <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-3">Sinopsis</h3>
                <p class="text-sm text-[#c0c0c0] leading-relaxed whitespace-pre-line">{{ comic()!.synopsis }}</p>
              </div>
            }

            <!-- Details grid -->
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
              <h3 class="text-xs font-semibold text-[#606060] uppercase tracking-wider mb-4">Detalles</h3>

              @if (editing()) {
                <!-- Edit mode: all fields visible -->
                <div class="grid grid-cols-2 gap-x-6 md:gap-x-8 gap-y-4">
                  <!-- Autores -->
                  <div class="col-span-2">
                    <label class="edit-label">Autores</label>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="text-[10px] text-[#404040] mb-0.5 block">Guionista</label>
                        <input [(ngModel)]="draft.writer" type="text" placeholder="Guionista" class="edit-input text-sm" />
                      </div>
                      <div>
                        <label class="text-[10px] text-[#404040] mb-0.5 block">Dibujante</label>
                        <input [(ngModel)]="draft.artist" type="text" placeholder="Dibujante" class="edit-input text-sm" />
                      </div>
                      <div>
                        <label class="text-[10px] text-[#404040] mb-0.5 block">Colorista</label>
                        <input [(ngModel)]="draft.colorist" type="text" placeholder="Colorista" class="edit-input text-sm" />
                      </div>
                      <div>
                        <label class="text-[10px] text-[#404040] mb-0.5 block">Portadista</label>
                        <input [(ngModel)]="draft.cover_artist" type="text" placeholder="Portadista" class="edit-input text-sm" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label class="edit-label">Editorial</label>
                    <input [(ngModel)]="draft.publisher" type="text" placeholder="Ej: ECC, Panini..." class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Editorial original</label>
                    <input [(ngModel)]="draft.original_publisher" type="text" placeholder="Ej: Marvel, DC..." class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Fecha publicacion</label>
                    <input [(ngModel)]="draft.publish_date" type="date" class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Formato</label>
                    <select [(ngModel)]="draft.format" class="edit-input">
                      <option [ngValue]="null">Sin especificar</option>
                      <option value="grapa">Grapa</option>
                      <option value="tomo">Tomo</option>
                      <option value="integral">Integral</option>
                      <option value="omnibus">Omnibus</option>
                      <option value="manga">Manga</option>
                      <option value="novela_grafica">Novela grafica</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label class="edit-label">Paginas</label>
                    <input [(ngModel)]="draft.pages" type="number" placeholder="Ej: 120" class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Encuadernacion</label>
                    <input [(ngModel)]="draft.binding" type="text" placeholder="Ej: Cartone, Grapa..." class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Precio (EUR)</label>
                    <input [(ngModel)]="draft.price" type="number" step="0.01" placeholder="Ej: 19.95" class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Genero</label>
                    <input [(ngModel)]="draft.genre" type="text" placeholder="Ej: Superheroes, Terror..." class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">ISBN</label>
                    <input [(ngModel)]="draft.isbn" type="text" placeholder="978..." class="edit-input font-mono" />
                  </div>
                  <div>
                    <label class="edit-label">Idioma</label>
                    <input [(ngModel)]="draft.language" type="text" placeholder="Ej: Español" class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Titulo original</label>
                    <input [(ngModel)]="draft.original_title" type="text" placeholder="Titulo en ingles" class="edit-input" />
                  </div>
                  <div>
                    <label class="edit-label">Coleccion editorial</label>
                    <input [(ngModel)]="draft.collection" type="text" placeholder="Ej: Marvel Heroes" class="edit-input" />
                  </div>
                </div>
              } @else {
                <!-- View mode: only filled fields -->
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
                      <dt class="text-xs text-[#606060] mb-0.5">Publicacion</dt>
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
                      <dt class="text-xs text-[#606060] mb-0.5">Paginas</dt>
                      <dd class="text-sm text-white">{{ comic()!.pages }}</dd>
                    </div>
                  }
                  @if (comic()!.binding) {
                    <div>
                      <dt class="text-xs text-[#606060] mb-0.5">Encuadernacion</dt>
                      <dd class="text-sm text-white">{{ comic()!.binding }}</dd>
                    </div>
                  }
                  @if (comic()!.price) {
                    <div>
                      <dt class="text-xs text-[#606060] mb-0.5">Precio</dt>
                      <dd class="text-sm text-white">{{ comic()!.price }} EUR</dd>
                    </div>
                  }
                  @if (comic()!.genre) {
                    <div>
                      <dt class="text-xs text-[#606060] mb-0.5">Genero</dt>
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
              }
            </div>

          </div>
        </div>
      }

    </div>
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
export class ComicDetailComponent implements OnInit {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private base = environment.apiUrl;

  comic = signal<Comic | null>(null);
  loading = signal(true);
  syncing = signal(false);
  editing = signal(false);
  saving = signal(false);
  notesOpen = signal(false);
  notesText = '';
  savingNotes = signal(false);

  // Draft for inline editing
  draft = {
    title: '', subtitle: '', series: '', number: null as number | null, cover_url: '',
    synopsis: '', writer: '', artist: '', colorist: '', cover_artist: '',
    publisher: '', original_publisher: '', publish_date: '', format: null as ComicFormat | null,
    pages: null as number | null, binding: '', price: null as number | null,
    genre: '', isbn: '', language: '', original_title: '', collection: '',
    notes: '', read_status: 'unread' as string, owned: false, rating: null as number | null,
  };

  parsedAuthors = computed(() => {
    const c = this.comic();
    if (!c) return [];
    if (c.authors && c.authors.length > 0) return c.authors;
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

  goBack() { this.location.back(); }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.get<Comic>(`/comics/${id}`).subscribe({
      next: c => { this.comic.set(c); this.notesText = c.notes ?? ''; this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/app/comics']); }
    });
  }

  startEditing() {
    const c = this.comic()!;
    this.draft = {
      title: c.title ?? '',
      subtitle: c.subtitle ?? '',
      series: c.series ?? '',
      number: c.number,
      cover_url: c.cover_url ?? '',
      synopsis: c.synopsis ?? '',
      writer: c.writer ?? '',
      artist: c.artist ?? '',
      colorist: c.colorist ?? '',
      cover_artist: c.cover_artist ?? '',
      publisher: c.publisher ?? '',
      original_publisher: c.original_publisher ?? '',
      publish_date: c.publish_date ?? '',
      format: c.format,
      pages: c.pages,
      binding: c.binding ?? '',
      price: c.price,
      genre: c.genre ?? '',
      isbn: c.isbn ?? '',
      language: c.language ?? '',
      original_title: c.original_title ?? '',
      collection: c.collection ?? '',
      notes: c.notes ?? '',
      read_status: c.read_status ?? 'unread',
      owned: c.owned ?? false,
      rating: c.rating,
    };
    this.editing.set(true);
  }

  cancelEditing() {
    this.editing.set(false);
  }

  saveEdit() {
    const c = this.comic()!;
    if (!this.draft.title?.trim()) return;
    this.saving.set(true);

    const payload: Record<string, any> = { ...c };
    const d = this.draft as Record<string, any>;
    for (const key of Object.keys(d)) {
      const val = d[key];
      payload[key] = (val === '' || val === undefined) ? null : val;
    }
    // title is required, never null
    payload['title'] = this.draft.title.trim();

    this.api.put<Comic>(`/comics/${c.id}`, payload).subscribe({
      next: (updated) => {
        this.comic.set({ ...updated, collection_name: c.collection_name, collection_id: c.collection_id });
        this.notesText = updated.notes ?? '';
        this.editing.set(false);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete() {
    if (!confirm('Eliminar este comic? Esta accion no se puede deshacer.')) return;
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

            const doSave = (coverUrl?: string) => {
              if (coverUrl) patch.cover_url = coverUrl;
              this.api.put<Comic>(`/comics/${c.id}`, { ...c, ...patch }).subscribe({
                next: (updated) => {
                  this.comic.set({ ...updated, collection_name: c.collection_name, collection_id: c.collection_id });
                  this.syncing.set(false);
                },
                error: () => this.syncing.set(false),
              });
            };

            const enrichAndSave = (coverUrl?: string) => {
              const tryEditorial = (): void => {
                const title = patch.title || c.title;
                const publisher = patch.publisher || c.publisher;
                if (title && publisher) {
                  this.http.get<any>(`${this.base}/google-books/editorial-price`, {
                    params: new HttpParams().set('title', title).set('publisher', publisher),
                  }).subscribe({
                    next: (res) => { if (res.price) { patch.price = res.price; doSave(coverUrl); } else restOfChain(); },
                    error: () => restOfChain(),
                  });
                } else { restOfChain(); }
              };

              const restOfChain = (): void => {
                if (patch.price || c.price) { doSave(coverUrl); return; }
                const tryGoogleBooks = (): void => {
                  const isbn = patch.isbn || c.isbn;
                  if (isbn) {
                    this.http.get<any>(`${this.base}/google-books/isbn/${isbn}`).subscribe({
                      next: (res) => { if (res.data?.price) { patch.price = res.data.price; doSave(coverUrl); } else doSave(coverUrl); },
                      error: () => doSave(coverUrl),
                    });
                  } else { doSave(coverUrl); }
                };
                tryGoogleBooks();
              };

              tryEditorial();
            };

            if (detail.cover && detail.cover !== c.cover_url) {
              this.http.post<{ key: string }>(`${this.base}/covers/upload`, { url: detail.cover }).subscribe({
                next: (r) => enrichAndSave(`${this.base}/covers/${r.key}`),
                error: () => enrichAndSave(detail.cover),
              });
            } else {
              enrichAndSave();
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

  setRating(n: number) {
    const c = this.comic();
    if (!c) return;
    const rating = c.rating === n ? null : n;
    this.api.put<Comic>(`/comics/${c.id}`, { ...c, rating }).subscribe({
      next: (updated) => this.comic.set({ ...updated, collection_name: c.collection_name, collection_id: c.collection_id }),
    });
  }

  saveNotes() {
    const c = this.comic();
    if (!c) return;
    this.savingNotes.set(true);
    this.api.put<Comic>(`/comics/${c.id}`, { ...c, notes: this.notesText || null }).subscribe({
      next: (updated) => {
        this.comic.set({ ...updated, collection_name: c.collection_name, collection_id: c.collection_id });
        this.savingNotes.set(false);
      },
      error: () => this.savingNotes.set(false),
    });
  }

}
