import { Component, inject, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, NgZone } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BrowserMultiFormatReader } from '@zxing/browser';
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

interface Facets {
  authors: string[];
  publishers: string[];
  genres: string[];
  sagas: string[];
  price: { min: number; max: number };
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
          <p class="text-[#606060] mt-0.5 text-sm">{{ total() }} libros en tu coleccion</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a routerLink="/app/books/sagas"
            class="flex items-center gap-2 bg-[#161616] hover:bg-[#1a1a1a] border border-[#2a2a2a]
                   text-[#a0a0a0] hover:text-white font-semibold text-sm rounded-xl px-4 py-2.5 transition-colors duration-200">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-1.014.671-1.872 1.594-2.153" />
            </svg>
            <span class="hidden sm:inline">Sagas</span>
          </a>
          <button (click)="openModal()"
            class="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white
                   font-semibold text-sm rounded-xl px-4 py-2.5 md:px-5 transition-colors duration-200">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span class="hidden sm:inline">Anadir libro</span>
            <span class="sm:hidden">Anadir</span>
          </button>
        </div>
      </div>

      <!-- Search + sort + filters -->
      <div class="flex flex-col gap-2 mb-5 md:mb-8">
        <div class="flex items-center gap-2">
          <div class="relative flex-1 min-w-0">
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#404040]"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input [(ngModel)]="search" (ngModelChange)="onSearch()"
              type="text" placeholder="Buscar por titulo, autor, editorial, ISBN..."
              class="w-full bg-[#161616] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-sm
                     text-white placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
          </div>

          <!-- View toggle -->
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

        <!-- Status + rating + sort row -->
        <div class="flex items-center gap-2 flex-wrap">
          <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-0.5">
            <button (click)="filterStatus = ''; applyFilters()"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              [class]="filterStatus === '' ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Todos
            </button>
            <button (click)="filterStatus = 'unread'; applyFilters()"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              [class]="filterStatus === 'unread' ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Sin leer
            </button>
            <button (click)="filterStatus = 'read'; applyFilters()"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              [class]="filterStatus === 'read' ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Leido
            </button>
          </div>

          <!-- Sort -->
          <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-0.5">
            @for (opt of sortOptions; track opt.value) {
              <button (click)="toggleSort(opt.value)"
                class="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                [class]="sortField() === opt.value
                  ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
                {{ opt.label }}
                @if (sortField() === opt.value) {
                  <span class="text-[10px]">{{ sortOrder() === 'desc' ? '↓' : '↑' }}</span>
                }
              </button>
            }
          </div>

          <!-- Filter toggle -->
          <button (click)="filtersExpanded.set(!filtersExpanded())" type="button"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors"
            [class]="filtersExpanded() || activeFilterCount() > 0
              ? 'bg-[#7c3aed1a] border-[#7c3aed33] text-[#8b5cf6]'
              : 'bg-[#161616] border-[#2a2a2a] text-[#606060] hover:text-[#a0a0a0]'">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            Filtros
            @if (activeFilterCount() > 0) {
              <span class="w-4 h-4 bg-[#7c3aed] text-white text-[10px] rounded-full flex items-center justify-center font-bold">{{ activeFilterCount() }}</span>
            }
          </button>

          @if (filterRatingMin()) {
            <button (click)="filterRatingMin.set(0); applyFilters()"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#f59e0b1a] text-[#f59e0b]
                     hover:bg-[#f59e0b33] transition-colors">
              ≥ {{ filterRatingMin() }}★
              <span class="hover:text-white text-base leading-none">&times;</span>
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

        <!-- Active filter tags -->
        @if (activeFilterCount() > 0 && !filtersExpanded()) {
          <div class="flex flex-wrap gap-1.5">
            @if (filterAuthor()) {
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#7c3aed1a] text-[#8b5cf6]">
                {{ filterAuthor() }}
                <button (click)="filterAuthor.set(''); applyFilters()" class="hover:text-white text-base leading-none">&times;</button>
              </span>
            }
            @if (filterPublisher()) {
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#7c3aed1a] text-[#8b5cf6]">
                {{ filterPublisher() }}
                <button (click)="filterPublisher.set(''); applyFilters()" class="hover:text-white text-base leading-none">&times;</button>
              </span>
            }
            @if (filterGenre()) {
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#7c3aed1a] text-[#8b5cf6]">
                {{ filterGenre() }}
                <button (click)="filterGenre.set(''); applyFilters()" class="hover:text-white text-base leading-none">&times;</button>
              </span>
            }
            @if (filterSaga()) {
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#7c3aed1a] text-[#8b5cf6]">
                {{ filterSaga() }}
                <button (click)="filterSaga.set(''); applyFilters()" class="hover:text-white text-base leading-none">&times;</button>
              </span>
            }
            @if (filterNoPrice()) {
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#7c3aed1a] text-[#8b5cf6]">
                Sin precio
                <button (click)="filterNoPrice.set(false); applyFilters()" class="hover:text-white text-base leading-none">&times;</button>
              </span>
            }
            <button (click)="clearAllFilters()" class="text-xs text-[#606060] hover:text-white transition-colors ml-1">
              Limpiar todo
            </button>
          </div>
        }

        <!-- Collapsible filter panel -->
        @if (filtersExpanded()) {
          <div class="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-4 space-y-4">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <!-- Author -->
              <div>
                <label class="block text-[10px] text-[#606060] mb-1 uppercase tracking-wider">Autor</label>
                <input type="text" list="authorsList" [value]="filterAuthor()"
                  (change)="filterAuthor.set($any($event.target).value); applyFilters()"
                  placeholder="Todos" class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs text-white
                    placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
                <datalist id="authorsList">
                  @for (a of facets()?.authors ?? []; track a) { <option [value]="a"></option> }
                </datalist>
              </div>
              <!-- Publisher -->
              <div>
                <label class="block text-[10px] text-[#606060] mb-1 uppercase tracking-wider">Editorial</label>
                <input type="text" list="publishersList" [value]="filterPublisher()"
                  (change)="filterPublisher.set($any($event.target).value); applyFilters()"
                  placeholder="Todas" class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs text-white
                    placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
                <datalist id="publishersList">
                  @for (p of facets()?.publishers ?? []; track p) { <option [value]="p"></option> }
                </datalist>
              </div>
              <!-- Genre -->
              <div>
                <label class="block text-[10px] text-[#606060] mb-1 uppercase tracking-wider">Genero</label>
                <input type="text" list="genresList" [value]="filterGenre()"
                  (change)="filterGenre.set($any($event.target).value); applyFilters()"
                  placeholder="Todos" class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs text-white
                    placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
                <datalist id="genresList">
                  @for (g of facets()?.genres ?? []; track g) { <option [value]="g"></option> }
                </datalist>
              </div>
              <!-- Saga -->
              <div>
                <label class="block text-[10px] text-[#606060] mb-1 uppercase tracking-wider">Saga</label>
                <input type="text" list="sagasList" [value]="filterSaga()"
                  (change)="filterSaga.set($any($event.target).value); applyFilters()"
                  placeholder="Todas" class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs text-white
                    placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
                <datalist id="sagasList">
                  @for (s of facets()?.sagas ?? []; track s) { <option [value]="s"></option> }
                </datalist>
              </div>
            </div>
            <!-- Price row -->
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2">
                <label class="text-[10px] text-[#606060] uppercase tracking-wider whitespace-nowrap">Precio</label>
                <input type="number" [value]="filterPriceMin()" [disabled]="filterNoPrice()"
                  (change)="filterPriceMin.set($any($event.target).value ? +$any($event.target).value : null); applyFilters()"
                  placeholder="Min" class="w-20 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs text-white
                    placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] disabled:opacity-30" />
                <span class="text-[#404040] text-xs">-</span>
                <input type="number" [value]="filterPriceMax()" [disabled]="filterNoPrice()"
                  (change)="filterPriceMax.set($any($event.target).value ? +$any($event.target).value : null); applyFilters()"
                  placeholder="Max" class="w-20 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs text-white
                    placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] disabled:opacity-30" />
              </div>
              <label class="group flex items-center gap-1.5 cursor-pointer select-none"
                (click)="filterNoPrice.set(!filterNoPrice()); filterPriceMin.set(null); filterPriceMax.set(null); applyFilters()">
                <span class="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                  [class]="filterNoPrice()
                    ? 'bg-[#7c3aed] border-[#7c3aed]'
                    : 'border-[#2a2a2a] group-hover:border-[#606060]'">
                  @if (filterNoPrice()) {
                    <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  }
                </span>
                <span class="text-xs transition-colors"
                  [class]="filterNoPrice() ? 'text-[#8b5cf6]' : 'text-[#606060] group-hover:text-[#a0a0a0]'">Sin precio</span>
              </label>
            </div>
            @if (activeFilterCount() > 0) {
              <div class="flex justify-end">
                <button (click)="clearAllFilters()" class="text-xs text-[#606060] hover:text-white transition-colors">
                  Limpiar filtros
                </button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Selection bar -->
      @if (selectionMode()) {
        <div class="sticky top-0 z-30 bg-[#111]/95 backdrop-blur border border-[#2a2a2a] rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <button (click)="cancelSelection()" class="text-[#606060] hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span class="text-sm text-white font-medium">{{ selectedIds().size }} seleccionados</span>
            <button (click)="selectAll()" class="text-xs text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">
              {{ selectedIds().size === books().length ? 'Deseleccionar todos' : 'Seleccionar todos' }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="bulkSetRead('read')" [disabled]="bulkUpdating()"
              class="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#22c55e1a] text-[#22c55e] hover:bg-[#22c55e33] transition-colors
                     disabled:opacity-40">
              Leido
            </button>
            <button (click)="bulkSetRead('unread')" [disabled]="bulkUpdating()"
              class="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#ffffff0d] text-[#a0a0a0] hover:bg-[#ffffff1a] transition-colors
                     disabled:opacity-40">
              Sin leer
            </button>
          </div>
        </div>
      }

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
            <p class="text-[#606060] text-sm">No hay libros todavia.</p>
            <button (click)="openModal()" class="inline-block mt-4 text-sm text-[#8b5cf6] hover:underline">Anade el primero</button>
          </div>
        } @else {
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
            @for (book of books(); track book.id) {
              <div class="group cursor-pointer relative"
                (touchstart)="onPressStart(book.id, $event)" (touchend)="onPressEnd()" (touchmove)="onPressEnd()"
                (mousedown)="onPressStart(book.id, $event)" (mouseup)="onPressEnd()" (mouseleave)="onPressEnd()"
                (click)="onItemClick(book.id)">
                <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] mb-1.5"
                  [class.ring-2]="selectedIds().has(book.id)" [class.ring-[#7c3aed]]="selectedIds().has(book.id)">
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
                  <!-- Selection checkbox (top-left) -->
                  @if (selectionMode()) {
                    <div class="absolute top-2 left-2 z-10">
                      <span class="w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors"
                        [class]="selectedIds().has(book.id) ? 'bg-[#7c3aed] border-[#7c3aed]' : 'border-white/50 bg-black/40'">
                        @if (selectedIds().has(book.id)) {
                          <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        }
                      </span>
                    </div>
                  }
                  <!-- Read badge (top-right, always visible) -->
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
              </div>
            }
          </div>
        }
      }

      @if (!loading() && viewMode() === 'list') {
        <div class="space-y-2">
          @for (book of books(); track book.id) {
            <div class="flex items-center gap-3 md:gap-4 bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e]
                     rounded-xl px-3 md:px-4 py-3 transition-colors duration-150 cursor-pointer"
              [class.ring-2]="selectedIds().has(book.id)" [class.ring-[#7c3aed]]="selectedIds().has(book.id)"
              (touchstart)="onPressStart(book.id, $event)" (touchend)="onPressEnd()" (touchmove)="onPressEnd()"
              (mousedown)="onPressStart(book.id, $event)" (mouseup)="onPressEnd()" (mouseleave)="onPressEnd()"
              (click)="onItemClick(book.id)">
              @if (selectionMode()) {
                <span class="w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors"
                  [class]="selectedIds().has(book.id) ? 'bg-[#7c3aed] border-[#7c3aed]' : 'border-[#2a2a2a]'">
                  @if (selectedIds().has(book.id)) {
                    <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  }
                </span>
              }
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
            </div>
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
              <!-- Detail view -->
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
                        <div><span class="text-[#505050]">Paginas</span><br><span class="text-[#a0a0a0]">{{ gbDetail()!.pages }}</span></div>
                      }
                      @if (gbDetail()!.isbn13 || gbDetail()!.isbn) {
                        <div><span class="text-[#505050]">ISBN</span><br><span class="text-[#a0a0a0]">{{ gbDetail()!.isbn13 || gbDetail()!.isbn }}</span></div>
                      }
                      @if (gbDetail()!.price) {
                        <div><span class="text-[#505050]">Precio</span><br><span class="text-[#a0a0a0]">{{ gbDetail()!.price }} {{ gbDetail()!.currency }}</span></div>
                      }
                      @if (gbDetail()!.categories.length) {
                        <div><span class="text-[#505050]">Genero</span><br><span class="text-[#a0a0a0]">{{ gbDetail()!.categories[0] }}</span></div>
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
                      Ya anadido — ver libro
                    </a>
                  } @else {
                    <button type="button" (click)="addBook()" [disabled]="gbSaving()"
                      class="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#7c3aed]
                             hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      @if (gbSaving()) { Anadiendo... } @else { Anadir }
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
              <!-- Search -->
              <div class="flex items-center gap-2 mb-4">
                <div class="relative flex-1 min-w-0">
                  <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#404040]"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input [(ngModel)]="gbQuery" (keyup.enter)="searchGB()"
                    type="text" placeholder="Titulo, autor o ISBN..."
                    class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-3 text-sm
                           text-white placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
                </div>
                <!-- Barcode scan button -->
                <button type="button" (click)="toggleScanner()"
                  title="Escanear codigo de barras"
                  class="px-3 py-3 rounded-xl border transition-colors shrink-0"
                  [class]="scannerActive()
                    ? 'bg-[#7c3aed22] border-[#7c3aed] text-[#8b5cf6]'
                    : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#606060] hover:text-[#8b5cf6] hover:border-[#7c3aed44]'">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                  </svg>
                </button>
                <button type="button" (click)="searchGB()" [disabled]="gbLoading()"
                  class="px-4 py-3 rounded-xl text-sm font-semibold text-white bg-[#7c3aed]
                         hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
                  @if (gbLoading()) { ... } @else { Buscar }
                </button>
              </div>

              <!-- Scanner viewer -->
              @if (scannerActive()) {
                <div class="relative border border-[#2a2a2a] rounded-xl bg-black mb-4 shrink-0 overflow-hidden" style="height: 200px">
                  <video #scannerVideo class="w-full h-full object-cover" autoplay muted playsinline></video>
                  <div class="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-[#7c3aed] opacity-70
                              animate-pulse rounded-full shadow-[0_0_8px_#7c3aed]"></div>
                  <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div class="w-56 h-24 border-2 border-[#7c3aed] rounded-lg opacity-50"></div>
                  </div>
                  <p class="absolute bottom-2 inset-x-0 text-center text-xs text-[#606060]">
                    Apunta el codigo de barras al centro
                  </p>
                </div>
              }

              @if (gbError()) {
                <p class="text-[#ef4444] text-xs mt-2">{{ gbError() }}</p>
              }

              @if (gbLoading()) {
                <div class="flex justify-center py-10">
                  <div class="w-6 h-6 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
                </div>
              }

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
export class BooksListComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private zone = inject(NgZone);
  private base = environment.apiUrl;

  @ViewChild('scannerVideo') private scannerVideoRef?: ElementRef<HTMLVideoElement>;

  books = signal<Book[]>([]);
  total = signal(0);
  loading = signal(false);
  page = signal(1);
  viewMode = signal<'grid' | 'list'>('grid');

  search = '';
  filterStatus = '';
  filterRatingMin = signal(0);
  filterAuthor = signal('');
  filterPublisher = signal('');
  filterGenre = signal('');
  filterSaga = signal('');
  filterPriceMin = signal<number | null>(null);
  filterPriceMax = signal<number | null>(null);
  filterNoPrice = signal(false);
  filtersExpanded = signal(false);

  sortField = signal<string>('created_at');
  sortOrder = signal<'desc' | 'asc'>('desc');

  facets = signal<Facets | null>(null);

  readonly limit = 42;
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit)));
  private searchTimer: any;

  sortOptions = [
    { value: 'created_at', label: 'Recientes' },
    { value: 'title', label: 'Titulo' },
    { value: 'author', label: 'Autor' },
    { value: 'price', label: 'Precio' },
  ];

  activeFilterCount = computed(() => {
    let n = 0;
    if (this.filterAuthor()) n++;
    if (this.filterPublisher()) n++;
    if (this.filterGenre()) n++;
    if (this.filterSaga()) n++;
    if (this.filterNoPrice()) n++;
    if (this.filterPriceMin() != null || this.filterPriceMax() != null) n++;
    return n;
  });

  // Multi-select
  selectionMode = signal(false);
  selectedIds = signal(new Set<number>());
  bulkUpdating = signal(false);
  private pressTimer: any;
  private pressHandled = false;

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

  // Barcode scanner
  scannerActive = signal(false);
  private barcodeReader = new BrowserMultiFormatReader();
  private scannerControls: { stop(): void } | null = null;

  ngOnDestroy() {
    this.stopScanner();
  }

  ngOnInit() {
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('author')) this.filterAuthor.set(qp.get('author')!);
    if (qp.get('publisher')) this.filterPublisher.set(qp.get('publisher')!);
    if (qp.get('saga')) this.filterSaga.set(qp.get('saga')!);
    this.loadFacets();
    this.load();
  }

  loadFacets() {
    this.http.get<Facets>(`${this.base}/books/facets`).subscribe({
      next: f => this.facets.set(f),
    });
  }

  load() {
    this.loading.set(true);
    const params: any = {
      page: this.page(), limit: this.limit,
      search: this.search || undefined,
      read_status: this.filterStatus || undefined,
      sort: this.sortField(),
      order: this.sortOrder(),
      author: this.filterAuthor() || undefined,
      publisher: this.filterPublisher() || undefined,
      genre: this.filterGenre() || undefined,
      saga: this.filterSaga() || undefined,
      price_min: this.filterNoPrice() ? undefined : this.filterPriceMin() ?? undefined,
      price_max: this.filterNoPrice() ? undefined : this.filterPriceMax() ?? undefined,
      no_price: this.filterNoPrice() ? 'true' : undefined,
      rating_min: this.filterRatingMin() || undefined,
    };
    this.api.get<PaginatedResponse<Book>>('/books', params).subscribe({
      next: res => { this.books.set(res.data); this.total.set(res.total); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 400);
  }

  applyFilters() { this.page.set(1); this.load(); }

  clearAllFilters() {
    this.filterAuthor.set(''); this.filterPublisher.set('');
    this.filterGenre.set(''); this.filterSaga.set('');
    this.filterPriceMin.set(null); this.filterPriceMax.set(null);
    this.filterRatingMin.set(0); this.filterStatus = '';
    this.filterNoPrice.set(false);
    this.page.set(1); this.load();
  }

  setFilterRatingMin(n: number) {
    this.filterRatingMin.set(this.filterRatingMin() === n ? 0 : n);
    this.page.set(1); this.load();
  }

  toggleSort(field: string) {
    if (this.sortField() === field) {
      this.sortOrder.set(this.sortOrder() === 'desc' ? 'asc' : 'desc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set(field === 'title' || field === 'author' ? 'asc' : 'desc');
    }
    this.page.set(1); this.load();
  }

  goTo(p: number) { this.page.set(p); this.load(); }

  statusLabel(s: string) { return s === 'read' ? 'Leido' : 'Sin leer'; }
  statusClass(s: string) {
    if (s === 'read') return 'bg-[#22c55e1a] text-[#22c55e]';
    return 'bg-[#ffffff0d] text-[#606060]';
  }

  // ── Multi-select ──────────────────────────────────────────────────────

  onPressStart(id: number, e: Event) {
    this.pressHandled = false;
    if (this.selectionMode()) return;
    this.pressTimer = setTimeout(() => {
      this.pressHandled = true;
      this.selectionMode.set(true);
      this.selectedIds.set(new Set([id]));
    }, 500);
  }

  onPressEnd() { clearTimeout(this.pressTimer); }

  onItemClick(id: number) {
    if (this.pressHandled) { this.pressHandled = false; return; }
    if (this.selectionMode()) {
      const s = new Set(this.selectedIds());
      if (s.has(id)) s.delete(id); else s.add(id);
      this.selectedIds.set(s);
      if (s.size === 0) this.selectionMode.set(false);
      return;
    }
    this.router.navigate(['/app/books', id]);
  }

  selectAll() {
    if (this.selectedIds().size === this.books().length) {
      this.selectedIds.set(new Set());
      this.selectionMode.set(false);
    } else {
      this.selectedIds.set(new Set(this.books().map(b => b.id)));
    }
  }

  cancelSelection() {
    this.selectionMode.set(false);
    this.selectedIds.set(new Set());
  }

  bulkSetRead(status: string) {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;
    this.bulkUpdating.set(true);
    this.http.patch<any>(`${this.base}/books/batch`, { ids, read_status: status }).subscribe({
      next: () => {
        this.bulkUpdating.set(false);
        this.cancelSelection();
        this.load();
      },
      error: () => this.bulkUpdating.set(false),
    });
  }

  // ── Barcode scanner ────────────────────────────────────────────────────

  toggleScanner() {
    if (this.scannerActive()) {
      this.stopScanner();
    } else {
      this.startScanner();
    }
  }

  private stopScanner() {
    this.scannerControls?.stop();
    this.scannerControls = null;
    this.scannerActive.set(false);
  }

  private startScanner() {
    this.scannerActive.set(true);
    setTimeout(() => {
      const video = this.scannerVideoRef?.nativeElement;
      if (!video) { this.scannerActive.set(false); return; }

      this.barcodeReader.decodeFromVideoDevice(undefined, video, (result, _err) => {
        if (result) {
          this.zone.run(() => {
            this.gbQuery = result.getText();
            this.gbError.set('');
            this.stopScanner();
            this.searchGB();
          });
        }
      }).then(controls => { this.scannerControls = controls; });
    }, 100);
  }

  // ── Modal ──────────────────────────────────────────────────────────────

  openModal() {
    this.modalOpen.set(true);
    this.gbQuery = ''; this.gbResults.set([]); this.gbDetail.set(null);
    this.gbError.set(''); this.gbSearched.set(false); this.gbExistingId.set(null);
  }

  closeModal() {
    this.stopScanner();
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
        price: d.price,
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
