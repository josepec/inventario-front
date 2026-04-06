import { Component, inject, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, NgZone } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService, PaginatedResponse } from '../../../shared/services/api.service';
import { Comic } from '../../../shared/models/comic.model';
import { environment } from '../../../../environments/environment';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface CollectionItem {
  id: number;
  title: string;
  publisher: string | null;
  cover_url: string | null;
  total_issues: number | null;
  whakoom_id: string | null;
}

interface WkResult {
  id: string;
  title: string;
  cover: string | null;
  publisher: string;
  type: string;
}

interface WkComic {
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
  editionId?: string | null;
}

@Component({
  selector: 'app-comics-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-4 md:p-8 max-w-7xl mx-auto">

      <!-- Header -->
      <div class="flex items-start justify-between mb-5 md:mb-8 gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">Cómics</h1>
          <p class="text-[#606060] mt-0.5 text-sm">{{ total() }} {{ tab() === 'comics' ? 'títulos' : 'colecciones' }}</p>
        </div>
        <button (click)="openModal()"
          class="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white
                 font-semibold text-sm rounded-xl px-4 py-2.5 md:px-5 transition-colors duration-200 shrink-0">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span class="hidden sm:inline">Añadir cómic</span>
          <span class="sm:hidden">Añadir</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-col gap-3 mb-5 md:mb-8">

        <!-- Row 1: tabs + view toggle -->
        <div class="flex items-center gap-3">
          <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-0.5">
            <button (click)="switchTab('comics')"
              class="px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
              [class]="tab() === 'comics' ? 'bg-[#7c3aed] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Cómics
            </button>
            <button (click)="switchTab('collections')"
              class="px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
              [class]="tab() === 'collections' ? 'bg-[#7c3aed] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Colecciones
            </button>
          </div>

          <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-1 ml-auto">
            <button (click)="viewMode.set('grid')" [class.bg-[#2a2a2a]]="viewMode() === 'grid'"
              class="p-2 rounded-lg transition-colors hover:bg-[#222]">
              <svg class="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
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

        <!-- Row 2: search -->
        <div class="relative">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#404040]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input [(ngModel)]="search" (ngModelChange)="onSearch()"
            type="text" [placeholder]="tab() === 'comics' ? 'Buscar por título, serie...' : 'Buscar colección...'"
            class="w-full bg-[#161616] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-sm
                   text-white placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
        </div>

        <!-- Row 3: status + sort + filters — scrollable on mobile -->
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          @if (tab() === 'comics') {
            <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-0.5 shrink-0">
              <button (click)="filterStatus = ''; load()"
                class="px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                [class]="filterStatus === '' ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
                Todos
              </button>
              <button (click)="filterStatus = 'unread'; load()"
                class="px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                [class]="filterStatus === 'unread' ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
                Sin leer
              </button>
              <button (click)="filterStatus = 'read'; load()"
                class="px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                [class]="filterStatus === 'read' ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
                Leído
              </button>
            </div>
          }

          <!-- Sort -->
          <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-0.5 shrink-0">
            @for (opt of sortOptions; track opt.value) {
              <button (click)="onSortClick(opt.value)" type="button"
                class="px-2 md:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                [class]="sortField() === opt.value
                  ? 'bg-[#2a2a2a] text-white'
                  : 'text-[#606060] hover:text-[#a0a0a0]'">
                {{ opt.short }}
                @if (sortField() === opt.value) {
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    @if (sortOrder() === 'desc') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                    } @else {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                    }
                  </svg>
                }
              </button>
            }
          </div>

          <!-- Filter toggle -->
          <button (click)="filtersExpanded.set(!filtersExpanded())" type="button"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border transition-colors shrink-0"
            [class]="filtersExpanded() || activeFilterCount() > 0
              ? 'bg-[#7c3aed1a] border-[#7c3aed44] text-[#8b5cf6]'
              : 'bg-[#161616] border-[#2a2a2a] text-[#606060] hover:text-[#a0a0a0]'">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            <span class="whitespace-nowrap">Filtros</span>
            @if (activeFilterCount() > 0) {
              <span class="bg-[#7c3aed] text-white text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center leading-none font-semibold">
                {{ activeFilterCount() }}
              </span>
            }
          </button>
        </div>

        <!-- Active filter chips -->
        @if (activeFilterCount() > 0 && !filtersExpanded()) {
          <div class="flex flex-wrap items-center gap-2">
            @if (filterAuthor()) {
              <span class="inline-flex items-center gap-1.5 bg-[#7c3aed1a] border border-[#7c3aed33] text-[#8b5cf6] text-xs px-2.5 py-1 rounded-full">
                {{ filterAuthor() }}
                <button (click)="filterAuthor.set(''); applyFilters()" class="hover:text-white text-base leading-none">&times;</button>
              </span>
            }
            @if (filterPublisher()) {
              <span class="inline-flex items-center gap-1.5 bg-[#7c3aed1a] border border-[#7c3aed33] text-[#8b5cf6] text-xs px-2.5 py-1 rounded-full">
                {{ filterPublisher() }}
                <button (click)="filterPublisher.set(''); applyFilters()" class="hover:text-white text-base leading-none">&times;</button>
              </span>
            }
            @if (filterNoPrice()) {
              <span class="inline-flex items-center gap-1.5 bg-[#7c3aed1a] border border-[#7c3aed33] text-[#8b5cf6] text-xs px-2.5 py-1 rounded-full">
                Sin precio
                <button (click)="filterNoPrice.set(false); applyFilters()" class="hover:text-white text-base leading-none">&times;</button>
              </span>
            } @else if (filterPriceMin() !== null || filterPriceMax() !== null) {
              <span class="inline-flex items-center gap-1.5 bg-[#7c3aed1a] border border-[#7c3aed33] text-[#8b5cf6] text-xs px-2.5 py-1 rounded-full">
                {{ filterPriceMin() ?? 0 }}€ - {{ filterPriceMax() ?? '...' }}€
                <button (click)="filterPriceMin.set(null); filterPriceMax.set(null); applyFilters()" class="hover:text-white text-base leading-none">&times;</button>
              </span>
            }
            @if (filterRatingMin() !== null) {
              <span class="inline-flex items-center gap-1.5 bg-[#f59e0b1a] border border-[#f59e0b33] text-[#f59e0b] text-xs px-2.5 py-1 rounded-full">
                ≥ {{ filterRatingMin() }}★
                <button (click)="filterRatingMin.set(null); applyFilters()" class="hover:text-white text-base leading-none">&times;</button>
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
                <label class="text-[10px] text-[#606060] uppercase tracking-wider mb-1.5 block font-semibold">Autor</label>
                <input type="text" list="authorsList" [value]="filterAuthor()"
                  (change)="filterAuthor.set($any($event.target).value); applyFilters()"
                  placeholder="Todos"
                  class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white
                         placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
                <datalist id="authorsList">
                  @for (a of availableAuthors(); track a) {
                    <option [value]="a"></option>
                  }
                </datalist>
              </div>
              <!-- Publisher -->
              <div>
                <label class="text-[10px] text-[#606060] uppercase tracking-wider mb-1.5 block font-semibold">Editorial</label>
                <input type="text" list="publishersList" [value]="filterPublisher()"
                  (change)="filterPublisher.set($any($event.target).value); applyFilters()"
                  placeholder="Todas"
                  class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white
                         placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
                <datalist id="publishersList">
                  @for (p of availablePublishers(); track p) {
                    <option [value]="p"></option>
                  }
                </datalist>
              </div>
              <!-- Price range -->
              <div>
                <label class="text-[10px] text-[#606060] uppercase tracking-wider mb-1.5 block font-semibold">Precio</label>
                <button type="button" (click)="filterNoPrice.set(!filterNoPrice()); filterPriceMin.set(null); filterPriceMax.set(null); applyFilters()"
                  class="w-full mb-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors text-left"
                  [class]="filterNoPrice()
                    ? 'bg-[#7c3aed1a] border-[#7c3aed44] text-[#8b5cf6]'
                    : 'bg-[#0d0d0d] border-[#2a2a2a] text-[#606060] hover:text-[#a0a0a0]'">
                  Sin precio
                </button>
                @if (!filterNoPrice()) {
                  <div class="flex gap-2 items-center">
                    <input type="number" [value]="filterPriceMin()" (change)="filterPriceMin.set($any($event.target).value ? +$any($event.target).value : null); applyFilters()"
                      placeholder="Min" step="0.5" min="0"
                      class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white
                             placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
                    <span class="text-[#404040] text-xs">-</span>
                    <input type="number" [value]="filterPriceMax()" (change)="filterPriceMax.set($any($event.target).value ? +$any($event.target).value : null); applyFilters()"
                      placeholder="Max" step="0.5" min="0"
                      class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white
                             placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
                  </div>
                }
              </div>
              <!-- Rating -->
              <div>
                <label class="text-[10px] text-[#606060] uppercase tracking-wider mb-1.5 block font-semibold">Valoración</label>
                <div class="flex gap-2 items-center">
                  <div class="flex gap-0.5 items-center">
                    @for (s of [1,2,3,4,5]; track s) {
                      <button type="button" (click)="setFilterRatingMin(s)"
                        class="text-base transition-colors"
                        [class]="s <= (filterRatingMin() ?? 0) ? 'text-[#f59e0b]' : 'text-[#2a2a2a] hover:text-[#f59e0b44]'">★</button>
                    }
                  </div>
                  <span class="text-[10px] text-[#404040]">mín.</span>
                </div>
              </div>
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
        <div class="sticky top-0 z-30 bg-[#0d0d0d]/95 backdrop-blur-sm border-b border-[#2a2a2a] -mx-4 px-4 md:-mx-8 md:px-8 py-3 mb-4 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <button (click)="exitSelection()" class="text-[#606060] hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span class="text-sm text-white font-medium">{{ selectedIds().size }} seleccionados</span>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="selectAll()" class="text-xs text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">
              {{ selectedIds().size === comics().length ? 'Deseleccionar todo' : 'Seleccionar todo' }}
            </button>
            <button (click)="bulkMarkAs('read')" [disabled]="selectedIds().size === 0 || bulkUpdating()"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#22c55e1a] border border-[#22c55e33] text-[#22c55e]
                     hover:bg-[#22c55e22] transition-colors disabled:opacity-40">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Leído
            </button>
            <button (click)="bulkMarkAs('unread')" [disabled]="selectedIds().size === 0 || bulkUpdating()"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#ffffff0d] border border-[#2a2a2a] text-[#a0a0a0]
                     hover:bg-[#ffffff1a] transition-colors disabled:opacity-40">
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

      <!-- ═══ COMICS TAB ═══ -->
      @if (!loading() && tab() === 'comics') {
        @if (viewMode() === 'grid') {
          @if (comics().length === 0) {
            <div class="text-center py-24">
              <div class="w-16 h-16 rounded-2xl bg-[#161616] flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-[#404040]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <p class="text-[#606060] text-sm">No hay cómics todavía.</p>
              <button (click)="openModal()" class="inline-block mt-4 text-sm text-[#8b5cf6] hover:underline">Añade el primero</button>
            </div>
          } @else {
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
              @for (comic of comics(); track comic.id) {
                <div class="group cursor-pointer"
                  (touchstart)="onPressStart(comic.id, $event)" (touchend)="onPressEnd()" (touchmove)="onPressEnd()"
                  (mousedown)="onPressStart(comic.id, $event)" (mouseup)="onPressEnd()" (mouseleave)="onPressEnd()"
                  (click)="onItemClick(comic.id, $event)">
                  <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] mb-1.5"
                    [class.ring-2]="selectedIds().has(comic.id)" [class.ring-[#7c3aed]]="selectedIds().has(comic.id)">
                    @if (comic.cover_url) {
                      <img [src]="comic.cover_url" [alt]="comic.title"
                        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        draggable="false" />
                    } @else {
                      <div class="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                        <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        <p class="text-[10px] text-[#404040] leading-tight">{{ comic.title }}</p>
                      </div>
                    }
                    <!-- Selection checkbox / read badge -->
                    <div class="absolute top-2 right-2">
                      @if (selectionMode()) {
                        <span class="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                          [class]="selectedIds().has(comic.id) ? 'bg-[#7c3aed]' : 'bg-black/50 border border-white/30'">
                          @if (selectedIds().has(comic.id)) {
                            <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          }
                        </span>
                      } @else if (comic.read_status === 'read') {
                        <span class="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center">
                          <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </span>
                      }
                    </div>
                    @if (comic.number) {
                      <span class="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-bold
                                   px-2 py-1 rounded-lg leading-none backdrop-blur-sm">#{{ comic.number }}</span>
                    }
                    @if (!selectionMode()) {
                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                    }
                  </div>
                  <p class="text-xs font-medium text-[#e0e0e0] truncate leading-tight">{{ comic.title }}</p>
                  @if (comic.series && comic.series !== comic.title) {
                    <p class="text-[10px] text-[#606060] truncate">{{ comic.series }}</p>
                  }
                </div>
              }
            </div>
          }
        }

        @if (viewMode() === 'list') {
          <div class="space-y-2">
            @for (comic of comics(); track comic.id) {
              <div class="flex items-center gap-3 md:gap-4 bg-[#161616] hover:bg-[#1a1a1a] border rounded-xl px-3 md:px-4 py-3 transition-colors duration-150 cursor-pointer"
                [class.border-[#7c3aed]]="selectedIds().has(comic.id)" [class.border-[#1e1e1e]]="!selectedIds().has(comic.id)"
                (touchstart)="onPressStart(comic.id, $event)" (touchend)="onPressEnd()" (touchmove)="onPressEnd()"
                (mousedown)="onPressStart(comic.id, $event)" (mouseup)="onPressEnd()" (mouseleave)="onPressEnd()"
                (click)="onItemClick(comic.id, $event)">
                @if (selectionMode()) {
                  <span class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors"
                    [class]="selectedIds().has(comic.id) ? 'bg-[#7c3aed]' : 'border border-[#404040]'">
                    @if (selectedIds().has(comic.id)) {
                      <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    }
                  </span>
                }
                <div class="w-9 h-12 md:w-10 md:h-14 rounded-lg overflow-hidden bg-[#222] shrink-0">
                  @if (comic.cover_url) {
                    <img [src]="comic.cover_url" [alt]="comic.title" class="w-full h-full object-cover" draggable="false" />
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-white truncate">{{ comic.title }}</p>
                  @if (comic.series && comic.series !== comic.title) { <p class="text-xs text-[#606060] truncate">{{ comic.series }}</p> }
                </div>
                <div class="hidden sm:block shrink-0 text-xs text-[#606060]">{{ comic.publisher }}</div>
                <div class="shrink-0">
                  <span class="text-xs px-2 py-1 rounded-lg" [class]="statusClass(comic.read_status)">
                    {{ statusLabel(comic.read_status) }}
                  </span>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- ═══ COLLECTIONS TAB ═══ -->
      @if (!loading() && tab() === 'collections') {
        @if (viewMode() === 'grid') {
          @if (collections().length === 0) {
            <div class="text-center py-24">
              <p class="text-[#606060] text-sm">No hay colecciones todavía.</p>
              <p class="text-[#404040] text-xs mt-2">Se crean automáticamente al añadir cómics desde Whakoom</p>
            </div>
          } @else {
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
              @for (col of collections(); track col.id) {
                <a [routerLink]="['/app/collections', col.id]" class="group cursor-pointer">
                  <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] mb-1.5">
                    @if (col.cover_url) {
                      <img [src]="col.cover_url" [alt]="col.title"
                        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    } @else {
                      <div class="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                        <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-1.244 1.007-2.25 2.25-2.25h13.5" />
                        </svg>
                        <p class="text-[10px] text-[#404040] leading-tight">{{ col.title }}</p>
                      </div>
                    }
                    @if (col.total_issues) {
                      <span class="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-bold
                                   px-2 py-1 rounded-lg leading-none backdrop-blur-sm">{{ col.total_issues }}</span>
                    }
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                  </div>
                  <p class="text-xs font-medium text-[#e0e0e0] truncate leading-tight">{{ col.title }}</p>
                  @if (col.publisher) { <p class="text-[10px] text-[#606060] truncate">{{ col.publisher }}</p> }
                </a>
              }
            </div>
          }
        }

        @if (viewMode() === 'list') {
          <div class="space-y-2">
            @for (col of collections(); track col.id) {
              <a [routerLink]="['/app/collections', col.id]"
                class="flex items-center gap-3 md:gap-4 bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e]
                       rounded-xl px-3 md:px-4 py-3 transition-colors duration-150">
                <div class="w-9 h-12 md:w-10 md:h-14 rounded-lg overflow-hidden bg-[#222] shrink-0">
                  @if (col.cover_url) { <img [src]="col.cover_url" [alt]="col.title" class="w-full h-full object-cover" /> }
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-white truncate">{{ col.title }}</p>
                  @if (col.publisher) { <p class="text-xs text-[#606060] truncate">{{ col.publisher }}</p> }
                </div>
                @if (col.total_issues) {
                  <div class="shrink-0 text-xs text-[#606060]">{{ col.total_issues }} cómics</div>
                }
              </a>
            }
          </div>
        }
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

    <!-- ── Modal añadir cómic ─────────────────────────────────────────────── -->
    @if (modalOpen()) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
        (click)="closeModal()">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

        <div class="relative bg-[#111111] border border-[#2a2a2a]
                    rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl
                    max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl"
          (click)="$event.stopPropagation()">

          <!-- Cabecera -->
          <div class="flex items-center gap-3 p-4 md:p-5 border-b border-[#1e1e1e] shrink-0">
            <svg class="w-5 h-5 text-[#7c3aed] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <h2 class="text-white font-semibold text-sm md:text-base">Buscar en Whakoom</h2>
            <a routerLink="/app/comics/new" (click)="closeModal()"
              class="ml-auto text-xs text-[#606060] hover:text-[#a0a0a0] transition-colors whitespace-nowrap">
              Entrada manual
            </a>
            <button type="button" (click)="closeModal()" class="p-1 text-[#606060] hover:text-white transition-colors shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Buscador -->
          <div class="p-3 md:p-4 border-b border-[#1e1e1e] shrink-0">
            <div class="flex gap-2">
              <input #wkInput
                type="text"
                [(ngModel)]="wkQuery"
                placeholder="Título o ISBN..."
                (keydown.enter)="searchWk()"
                class="flex-1 min-w-0 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white
                       placeholder:text-[#303030] focus:outline-none focus:border-[#7c3aed] transition-colors" />

              <!-- Barcode scan button -->
              <button type="button" (click)="toggleScanner()"
                title="Escanear código de barras"
                class="px-3 py-2.5 rounded-xl border transition-colors shrink-0"
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

              <button type="button" (click)="searchWk()" [disabled]="wkLoading()"
                class="px-4 md:px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7c3aed]
                       hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
                @if (wkLoading()) { <span class="hidden sm:inline">Buscando...</span><span class="sm:hidden">...</span> }
                @else { Buscar }
              </button>
            </div>
            @if (wkError()) {
              <p class="text-[#ef4444] text-xs mt-2">{{ wkError() }}</p>
            }
          </div>

          <!-- Visor de escáner -->
          @if (scannerActive()) {
            <div class="relative border-b border-[#1e1e1e] bg-black shrink-0" style="height: 220px">
              <video #scannerVideo class="w-full h-full object-cover" autoplay muted playsinline></video>
              <!-- Línea de escaneo animada -->
              <div class="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-[#7c3aed] opacity-70
                          animate-pulse rounded-full shadow-[0_0_8px_#7c3aed]"></div>
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <!-- Marco de escaneo -->
                <div class="w-56 h-28 border-2 border-[#7c3aed] rounded-lg opacity-50"></div>
              </div>
              <p class="absolute bottom-2 inset-x-0 text-center text-xs text-[#606060]">
                Apunta el código de barras al centro
              </p>
            </div>
          }

          <!-- Contenido -->
          <div class="flex-1 overflow-y-auto p-3 md:p-4">

            @if (wkDetail()) {
              <!-- Vista detalle -->
              <div>
                <button type="button" (click)="wkDetail.set(null)"
                  class="flex items-center gap-1.5 text-xs text-[#606060] hover:text-white mb-4 transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Volver a resultados
                </button>

                <div class="flex gap-4 md:gap-5">
                  @if (wkDetail()!.cover) {
                    <img [src]="wkDetail()!.cover" alt="Portada"
                      class="w-24 md:w-28 shrink-0 rounded-lg border border-[#2a2a2a] object-cover aspect-[2/3]" />
                  }
                  <div class="flex-1 min-w-0">
                    <h3 class="text-white font-semibold text-sm md:text-base leading-tight">{{ wkDetail()!.title }}</h3>
                    @if (wkDetail()!.series) {
                      <p class="text-[#7c3aed] text-xs mt-1 uppercase tracking-wider">{{ wkDetail()!.series }}</p>
                    }
                    <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      @if (wkDetail()!.publisher) {
                        <div><span class="text-[#505050]">Editorial</span><br><span class="text-[#a0a0a0]">{{ wkDetail()!.publisher }}</span></div>
                      }
                      @if (wkDetail()!.date) {
                        <div><span class="text-[#505050]">Fecha</span><br><span class="text-[#a0a0a0]">{{ wkDetail()!.date }}</span></div>
                      }
                      @if (wkDetail()!.number) {
                        <div><span class="text-[#505050]">Número</span><br><span class="text-[#a0a0a0]">#{{ wkDetail()!.number }}</span></div>
                      }
                      @if (wkDetail()!.isbn) {
                        <div><span class="text-[#505050]">ISBN</span><br><span class="text-[#a0a0a0]">{{ wkDetail()!.isbn }}</span></div>
                      }
                    </div>
                    @if (wkDetail()!.authors.length) {
                      <p class="mt-2 text-xs text-[#505050]">Autores: <span class="text-[#a0a0a0]">{{ wkDetail()!.authors.join(' · ') }}</span></p>
                    }
                    @if (wkDetail()!.description) {
                      <p class="mt-3 text-xs text-[#606060] line-clamp-4 leading-relaxed">{{ wkDetail()!.description }}</p>
                    }
                  </div>
                </div>

                <div class="flex gap-3 mt-5">
                  @if (wkExistingId()) {
                    <a [routerLink]="['/app/comics', wkExistingId()]" (click)="closeModal()"
                      class="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#22c55e] text-center">
                      Ya añadido — ver cómic
                    </a>
                  } @else {
                    <button type="button" (click)="addDirectly()" [disabled]="wkSaving()"
                      class="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#7c3aed]
                             hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      @if (wkSaving()) { Añadiendo... } @else { Añadir }
                    </button>
                    <a routerLink="/app/comics/new" (click)="closeModal()"
                      class="px-5 py-3 rounded-xl text-sm text-[#a0a0a0] hover:text-white bg-[#1a1a1a]
                             border border-[#2a2a2a] hover:bg-[#222] transition-colors">
                      Editar antes
                    </a>
                  }
                </div>
              </div>

            } @else {
              <!-- Lista de resultados -->
              @if (wkResults().length > 0) {
                @if (wkTotal() > 0) {
                  <p class="text-xs text-[#505050] mb-3">{{ wkTotal() }} resultados</p>
                }
                <div class="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 sm:gap-3">
                  @for (result of wkResults(); track result.id) {
                    <button type="button" (click)="loadWkDetail(result.id, result.type)"
                      [disabled]="wkLoading()" class="group text-left disabled:opacity-50">
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
                      <p class="text-[10px] text-[#404040] truncate">{{ result.type }}</p>
                    </button>
                  }
                </div>
                @if (wkHasMore() && !wkLoading()) {
                  <button type="button" (click)="loadMoreWk()"
                    class="mt-4 w-full py-2 rounded-xl text-xs text-[#a0a0a0] bg-[#1a1a1a] border border-[#2a2a2a]
                           hover:bg-[#222] hover:text-white transition-colors">
                    Cargar más resultados
                  </button>
                }
              } @else if (!wkLoading() && wkSearched()) {
                <div class="text-center py-12 text-[#404040]">
                  <p class="text-sm">Sin resultados para esa búsqueda</p>
                </div>
              } @else if (!wkLoading()) {
                <div class="text-center py-12 text-[#404040]">
                  <svg class="w-10 h-10 mx-auto mb-3 text-[#252525]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <p class="text-sm">Escribe el título o ISBN y pulsa Buscar</p>
                  <p class="text-xs mt-1 text-[#303030]">También puedes escanear el código de barras</p>
                </div>
              }

              @if (wkLoading()) {
                <div class="text-center py-12">
                  <div class="inline-block w-6 h-6 border-2 border-[#2a2a2a] border-t-[#7c3aed] rounded-full animate-spin"></div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    }
  `
})
export class ComicsListComponent implements OnInit, OnDestroy {
  @ViewChild('scannerVideo') private scannerVideoRef?: ElementRef<HTMLVideoElement>;

  private api = inject(ApiService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private zone = inject(NgZone);
  private base = environment.apiUrl;
  private zxingReader = new BrowserMultiFormatReader();

  comics = signal<Comic[]>([]);
  collections = signal<CollectionItem[]>([]);
  total = signal(0);
  loading = signal(false);
  page = signal(1);
  viewMode = signal<'grid' | 'list'>('grid');
  tab = signal<'comics' | 'collections'>('comics');

  search = '';
  filterStatus = '';
  readonly limit = 42;
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit)));
  private searchTimer: any;

  // Filter & sort
  sortField = signal<string>('created_at');
  sortOrder = signal<'asc' | 'desc'>('desc');
  filterAuthor = signal('');
  filterPublisher = signal('');
  filterPriceMin = signal<number | null>(null);
  filterPriceMax = signal<number | null>(null);
  filterRatingMin = signal<number | null>(null);
  filterNoPrice = signal(false);
  filtersExpanded = signal(false);
  availableAuthors = signal<string[]>([]);
  availablePublishers = signal<string[]>([]);
  activeFilterCount = computed(() => {
    let n = 0;
    if (this.filterAuthor()) n++;
    if (this.filterPublisher()) n++;
    if (this.filterNoPrice()) n++;
    else { if (this.filterPriceMin() !== null) n++; if (this.filterPriceMax() !== null) n++; }
    if (this.filterRatingMin() !== null) n++;
    return n;
  });

  setFilterRatingMin(n: number) {
    this.filterRatingMin.set(this.filterRatingMin() === n ? null : n);
    this.applyFilters();
  }

  // ── Modal state ──────────────────────────────────────────────────────────
  modalOpen = signal(false);
  wkQuery = '';
  wkLoading = signal(false);
  wkSaving = signal(false);
  wkError = signal('');
  wkExistingId = signal<number | null>(null);
  wkResults = signal<WkResult[]>([]);
  wkDetail = signal<WkComic | null>(null);
  wkSearched = signal(false);
  wkPage = signal(1);
  wkHasMore = signal(false);
  wkTotal = signal(0);
  private wkSelectedResult: WkResult | null = null;

  // ── Selection state ──────────────────────────────────────────────────────
  selectionMode = signal(false);
  selectedIds = signal<Set<number>>(new Set());
  bulkUpdating = signal(false);
  private pressTimer: any = null;
  private pressHandled = false;

  onPressStart(id: number, e: Event) {
    this.pressHandled = false;
    if (this.selectionMode()) return; // already in selection mode, click handles it
    this.pressTimer = setTimeout(() => {
      this.pressHandled = true;
      e.preventDefault();
      this.selectionMode.set(true);
      this.selectedIds.set(new Set([id]));
    }, 500);
  }

  onPressEnd() {
    clearTimeout(this.pressTimer);
  }

  onItemClick(id: number, e: Event) {
    if (this.pressHandled) { e.preventDefault(); return; }
    if (this.selectionMode()) {
      e.preventDefault();
      const s = new Set(this.selectedIds());
      if (s.has(id)) s.delete(id); else s.add(id);
      this.selectedIds.set(s);
      if (s.size === 0) this.selectionMode.set(false);
    } else {
      this.router.navigate(['/app/comics', id]);
    }
  }

  selectAll() {
    if (this.selectedIds().size === this.comics().length) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.comics().map(c => c.id)));
    }
  }

  exitSelection() {
    this.selectionMode.set(false);
    this.selectedIds.set(new Set());
  }

  bulkMarkAs(status: string) {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;
    this.bulkUpdating.set(true);
    this.http.patch(`${this.base}/comics/batch`, { ids, read_status: status }).subscribe({
      next: () => {
        this.bulkUpdating.set(false);
        this.exitSelection();
        this.load();
      },
      error: () => this.bulkUpdating.set(false),
    });
  }

  // ── Scanner state ────────────────────────────────────────────────────────
  scannerActive = signal(false);
  private reader = new BrowserMultiFormatReader();
  private scannerControls: { stop(): void } | null = null;

  ngOnInit() {
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('author')) this.filterAuthor.set(qp.get('author')!);
    if (qp.get('publisher')) this.filterPublisher.set(qp.get('publisher')!);
    this.loadFacets();
    this.load();
  }

  ngOnDestroy() { this.stopScanner(); }

  switchTab(t: 'comics' | 'collections') {
    this.tab.set(t); this.page.set(1); this.search = ''; this.filterStatus = '';
    this.filterAuthor.set(''); this.filterPublisher.set('');
    this.filterPriceMin.set(null); this.filterPriceMax.set(null);
    this.load();
  }

  load() {
    this.loading.set(true);
    if (this.tab() === 'collections') {
      const p: Record<string, string> = {
        page: this.page().toString(), limit: this.limit.toString(),
      };
      if (this.search) p['search'] = this.search;
      if (this.filterAuthor()) p['author'] = this.filterAuthor();
      if (this.filterPublisher()) p['publisher'] = this.filterPublisher();
      if (this.sortField() !== 'created_at') p['sort'] = this.sortField();
      if (this.sortOrder() !== 'desc') p['order'] = this.sortOrder();
      this.http.get<PaginatedResponse<CollectionItem>>(`${this.base}/collections`, { params: p }).subscribe({
        next: res => { this.collections.set(res.data); this.total.set(res.total); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    } else {
      this.api.get<PaginatedResponse<Comic>>('/comics', {
        page: this.page(), limit: this.limit,
        search: this.search || undefined,
        read_status: this.filterStatus || undefined,
        sort: this.sortField(),
        order: this.sortOrder(),
        author: this.filterAuthor() || undefined,
        publisher: this.filterPublisher() || undefined,
        price_min: this.filterNoPrice() ? undefined : this.filterPriceMin() ?? undefined,
        price_max: this.filterNoPrice() ? undefined : this.filterPriceMax() ?? undefined,
        no_price: this.filterNoPrice() ? 'true' : undefined,
        rating_min: this.filterRatingMin() ?? undefined,
      }).subscribe({
        next: res => { this.comics.set(res.data); this.total.set(res.total); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    }
    this.updateUrl();
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 400);
  }

  goTo(p: number) { this.page.set(p); this.load(); }

  statusLabel(s: string) { return s === 'read' ? 'Leído' : 'Sin leer'; }
  statusClass(s: string) {
    return s === 'read' ? 'bg-[#22c55e1a] text-[#22c55e]' : 'bg-[#ffffff0d] text-[#606060]';
  }

  sortOptions = [
    { value: 'created_at', short: 'Recientes' },
    { value: 'publish_date', short: 'Publicación' },
    { value: 'title', short: 'Título' },
    { value: 'price', short: 'Precio' },
  ];

  loadFacets() {
    this.api.get<{ authors: string[]; publishers: string[]; price: { min: number; max: number } }>('/comics/facets').subscribe({
      next: f => { this.availableAuthors.set(f.authors); this.availablePublishers.set(f.publishers); },
    });
  }

  onSortClick(field: string) {
    if (this.sortField() === field) {
      this.sortOrder.update(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set(field === 'title' ? 'asc' : 'desc');
    }
    this.page.set(1); this.load();
  }

  applyFilters() { this.page.set(1); this.load(); }

  clearAllFilters() {
    this.filterAuthor.set(''); this.filterPublisher.set('');
    this.filterPriceMin.set(null); this.filterPriceMax.set(null);
    this.filterRatingMin.set(null); this.filterStatus = '';
    this.page.set(1); this.load();
  }

  private updateUrl() {
    const qp: Record<string, string | null> = {
      author: this.filterAuthor() || null,
      publisher: this.filterPublisher() || null,
    };
    this.router.navigate([], { queryParams: qp, queryParamsHandling: 'merge', replaceUrl: true });
  }

  // ── Modal ────────────────────────────────────────────────────────────────

  openModal() {
    this.modalOpen.set(true);
    this.wkQuery = ''; this.wkResults.set([]); this.wkDetail.set(null);
    this.wkError.set(''); this.wkSearched.set(false); this.wkPage.set(1);
    this.wkHasMore.set(false); this.wkTotal.set(0); this.wkSelectedResult = null;
  }

  closeModal() { this.modalOpen.set(false); }

  searchWk(loadMore = false) {
    if (!this.wkQuery.trim()) return;
    this.wkLoading.set(true); this.wkError.set(''); this.wkDetail.set(null);
    if (!loadMore) { this.wkResults.set([]); this.wkPage.set(1); this.wkSearched.set(false); }

    const params = new HttpParams()
      .set('q', this.wkQuery.trim())
      .set('page', this.wkPage().toString());

    this.http.get<any>(`${this.base}/whakoom/search`, { params }).subscribe({
      next: res => {
        if (res.error) { this.wkError.set(res.error); }
        else {
          this.wkResults.update(prev => loadMore ? [...prev, ...res.data] : res.data);
          this.wkTotal.set(res.total); this.wkHasMore.set(res.hasMore);
        }
        this.wkSearched.set(true); this.wkLoading.set(false);
      },
      error: () => { this.wkError.set('Error al conectar con el servidor'); this.wkLoading.set(false); }
    });
  }

  loadMoreWk() { this.wkPage.update(p => p + 1); this.searchWk(true); }

  loadWkDetail(id: string, type: string) {
    this.wkSelectedResult = this.wkResults().find(r => r.id === id) ?? null;
    this.wkLoading.set(true); this.wkError.set(''); this.wkExistingId.set(null);
    const params = new HttpParams().set('type', type);
    this.http.get<any>(`${this.base}/whakoom/comic/${id}`, { params }).subscribe({
      next: res => {
        if (res.error) this.wkError.set(res.error);
        else {
          this.wkDetail.set(res);
          this.checkIfExists(res);
        }
        this.wkLoading.set(false);
      },
      error: () => { this.wkError.set('Error al cargar el cómic'); this.wkLoading.set(false); }
    });
  }

  private checkIfExists(d: any) {
    const q = d.isbn || d.title;
    if (!q) return;
    const params: any = { limit: '1' };
    if (d.isbn) params.search = d.isbn;
    else params.search = d.title;
    this.api.get<{ data: any[] }>('/comics', params).subscribe({
      next: res => {
        const match = res.data?.find((c: any) =>
          (d.isbn && c.isbn === d.isbn) ||
          (c.title === d.title && c.number === (d.number ? Number(d.number) : null))
        );
        if (match) this.wkExistingId.set(match.id);
      },
    });
  }

  // ── Barcode scanner ──────────────────────────────────────────────────────

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
    // Give Angular time to render the <video> element
    setTimeout(() => {
      const video = this.scannerVideoRef?.nativeElement;
      if (!video) { this.scannerActive.set(false); return; }

      this.reader.decodeFromVideoDevice(undefined, video, (result, _err) => {
        if (result) {
          this.zone.run(() => {
            this.wkQuery = result.getText();
            this.wkError.set('');
            this.stopScanner();
            this.searchWk();
          });
        }
      }).then(controls => { this.scannerControls = controls; });
    }, 100);
  }

  // ── Add as collection ────────────────────────────────────────────────────

  addAsCollection() {
    const d = this.wkDetail();
    const src = this.wkSelectedResult;
    if (!d || this.wkSaving()) return;
    this.wkSaving.set(true);

    const editionId = src?.type === 'edition' ? src.id : null;

    const createCol = (coverUrl: string, extra: any = {}) => {
      this.http.post<any>(`${this.base}/collections`, {
        whakoom_id: editionId, whakoom_type: editionId ? 'edition' : null,
        title: extra.title || d.series || d.title,
        publisher: extra.publisher || d.publisher || '',
        cover_url: coverUrl,
        total_issues: extra.totalIssues || null,
        description: extra.description || d.description || '',
        synopsis: extra.synopsis || '',
        format: extra.format || '',
        status: extra.status || '',
        edition_details: extra.editionDetails || '',
        authors: extra.authors || d.structuredAuthors || [],
        issues: extra.issues || [],
        url: extra.url || '',
      }).subscribe({
        next: col => { this.closeModal(); this.router.navigate(['/app/collections', col.id]); },
        error: () => { this.wkSaving.set(false); this.wkError.set('Error al crear la colección'); },
      });
    };

    const withCover = (comicCoverUrl: string) => {
      if (editionId) {
        // Tenemos edición de Whakoom → obtener datos ricos
        this.http.get<any>(`${this.base}/whakoom/edition/${editionId}`).subscribe({
          next: (edition) => {
            if (edition.cover) {
              this.http.post<{ key: string }>(`${this.base}/covers/upload`, { url: edition.cover }).subscribe({
                next: r => createCol(`${this.base}/covers/${r.key}`, edition),
                error: () => createCol(edition.cover, edition),
              });
            } else {
              createCol(comicCoverUrl, edition);
            }
          },
          error: () => createCol(comicCoverUrl),
        });
      } else {
        // No hay edición — buscar en Whakoom si hay una edición asociada
        this.http.get<any>(`${this.base}/whakoom/search`, {
          params: new HttpParams().set('q', d.series || d.title),
        }).subscribe({
          next: (res) => {
            const ed = res.data?.find((r: any) => r.type === 'edition');
            if (ed) {
              this.http.get<any>(`${this.base}/whakoom/edition/${ed.id}`).subscribe({
                next: (edition) => {
                  if (edition.cover) {
                    this.http.post<{ key: string }>(`${this.base}/covers/upload`, { url: edition.cover }).subscribe({
                      next: r => createCol(`${this.base}/covers/${r.key}`, edition),
                      error: () => createCol(edition.cover, edition),
                    });
                  } else {
                    createCol(comicCoverUrl, edition);
                  }
                },
                error: () => createCol(comicCoverUrl),
              });
            } else {
              createCol(comicCoverUrl);
            }
          },
          error: () => createCol(comicCoverUrl),
        });
      }
    };

    if (d.cover) {
      this.http.post<{ key: string }>(`${this.base}/covers/upload`, { url: d.cover }).subscribe({
        next: r => withCover(`${this.base}/covers/${r.key}`),
        error: () => withCover(d.cover),
      });
    } else {
      withCover('');
    }
  }

  // ── Add directly ─────────────────────────────────────────────────────────

  addDirectly() {
    const d = this.wkDetail();
    const src = this.wkSelectedResult;
    if (!d || this.wkSaving()) return;
    this.wkSaving.set(true);

    // editionMeta puede aportar binding/price/pages que la página individual del cómic no tiene
    let editionMeta: { binding?: string | null; price?: number | null; pages?: number | null } = {};

    const postComic = (coverUrl: string, collectionId: number | null, extraPrice?: number) => {
      const sa = d.structuredAuthors ?? [];
      const writer = sa.find(a => a.role.toLowerCase().includes('guion'))?.name || d.authors?.[0] || '';
      const artist = sa.find(a => a.role.toLowerCase().includes('dibujo'))?.name || d.authors?.[1] || '';
      this.api.post<any>('/comics', {
        title: d.title,
        series: d.series || '',
        number: d.number ? Number(d.number) : null,
        publisher: d.publisher || '',
        cover_url: coverUrl,
        isbn: d.isbn || '',
        synopsis: d.description || '',
        publish_date: d.date || '',
        writer,
        artist,
        authors: sa.length ? sa : null,
        language: d.language || '',
        pages: d.pages ?? editionMeta.pages ?? null,
        binding: d.binding ?? editionMeta.binding ?? null,
        price: d.price ?? editionMeta.price ?? extraPrice ?? null,
        collection_id: collectionId,
        read_status: 'unread',
        owned: false,
      }).subscribe({
        next: comic => { this.closeModal(); this.router.navigate(['/app/comics', comic.id]); },
        error: () => {
          this.wkSaving.set(false);
          this.wkError.set('Error al guardar el cómic');
        },
      });
    };

    const doSave = (coverUrl: string, collectionId: number | null) => {
      // d.price = precio del cómic individual (fiable)
      // editionMeta.price = precio genérico de la edición (último recurso)
      if (d.price) { postComic(coverUrl, collectionId); return; }

      const isbn = d.isbn;

      // 1. Editorial (ECC = PVP oficial)
      const tryEditorial = (): void => {
        const title = d.title;
        const publisher = d.publisher;
        if (title && publisher) {
          this.http.get<any>(`${this.base}/google-books/editorial-price`, {
            params: new HttpParams().set('title', title).set('publisher', publisher),
          }).subscribe({
            next: res => { if (res.price) postComic(coverUrl, collectionId, res.price); else tryIsbn(); },
            error: () => tryIsbn(),
          });
        } else { tryIsbn(); }
      };

      // 2. Google Books / Amazon / Casa del Libro por ISBN
      const tryIsbn = (): void => {
        if (isbn) {
          this.http.get<any>(`${this.base}/google-books/isbn/${isbn}`).subscribe({
            next: res => { if (res.data?.price) postComic(coverUrl, collectionId, res.data.price); else useEditionFallback(); },
            error: () => useEditionFallback(),
          });
        } else { useEditionFallback(); }
      };

      // 3. Sin precio fiable → guardar sin precio
      const useEditionFallback = (): void => {
        postComic(coverUrl, collectionId);
      };

      tryEditorial();
    };

    const createCollection = (coverUrl: string, payload: object) => {
      this.http.post<any>(`${this.base}/collections`, payload).subscribe({
        next: col => doSave(coverUrl, col.id),
        error: () => doSave(coverUrl, null),
      });
    };

    // Crear colección a partir de datos de edición ya cargados
    const createCollectionFromEdition = (edition: any, comicCoverUrl: string, wkId?: string) => {
      editionMeta = { binding: edition.binding, price: edition.price, pages: edition.pages };
      const finishCreate = (edCoverUrl: string) => {
        createCollection(comicCoverUrl, {
          whakoom_id: wkId || null, whakoom_type: wkId ? 'edition' : null,
          title: edition.title || d.series || d.title,
          publisher: edition.publisher || d.publisher || '',
          cover_url: edCoverUrl,
          total_issues: edition.totalIssues || null,
          description: edition.description || '',
          synopsis: edition.synopsis || '',
          format: edition.format || '',
          status: edition.status || '',
          edition_details: edition.editionDetails || '',
          authors: edition.authors || [],
          issues: edition.issues || [],
          url: edition.url || '',
        });
      };
      if (edition.cover) {
        this.http.post<{ key: string }>(`${this.base}/covers/upload`, { url: edition.cover }).subscribe({
          next: r => finishCreate(`${this.base}/covers/${r.key}`),
          error: () => finishCreate(edition.cover),
        });
      } else {
        finishCreate(comicCoverUrl);
      }
    };

    // Fetch edición y crear colección
    const fetchAndCreateFromEdition = (editionId: string, comicCoverUrl: string, wkId?: string) => {
      this.http.get<any>(`${this.base}/whakoom/edition/${editionId}`).subscribe({
        next: (edition) => createCollectionFromEdition(edition, comicCoverUrl, wkId),
        error: () => {
          createCollection(comicCoverUrl, {
            whakoom_id: wkId || null,
            title: d.series || d.title,
            publisher: d.publisher || '',
            cover_url: comicCoverUrl,
          });
        },
      });
    };

    const withCover = (coverUrl: string) => {
      if (src?.type === 'edition') {
        // Fetch edición para ver si tiene múltiples números
        this.http.get<any>(`${this.base}/whakoom/edition/${src.id}`).subscribe({
          next: (edition) => {
            if (edition.totalIssues > 1 || (edition.issues && edition.issues.length > 1)) {
              // Edición con múltiples números → crear colección (reutiliza datos ya cargados)
              createCollectionFromEdition(edition, coverUrl, src.id);
            } else {
              // Tomo único → guardar como cómic suelto
              editionMeta = { binding: edition.binding, price: edition.price, pages: edition.pages };
              doSave(coverUrl, null);
            }
          },
          error: () => doSave(coverUrl, null),
        });
      } else if (d.series && d.number) {
        // Usar editionId del cómic si lo tiene (referencia directa de Whakoom)
        if (d.editionId) {
          fetchAndCreateFromEdition(d.editionId, coverUrl, d.editionId);
        } else {
          // Fallback: buscar edición en resultados — misma editorial
          const pub = (d.publisher || '').toLowerCase();
          const edInResults = this.wkResults().find(r =>
            r.type === 'edition' && r.publisher.toLowerCase() === pub
          ) ?? this.wkResults().find(r => r.type === 'edition');
          if (edInResults) {
            fetchAndCreateFromEdition(edInResults.id, coverUrl, edInResults.id);
          } else {
            createCollection(coverUrl, {
              title: d.series,
              publisher: d.publisher || '',
              cover_url: coverUrl,
            });
          }
        }
      } else {
        doSave(coverUrl, null);
      }
    };

    if (d.cover) {
      this.http.post<{ key: string }>(`${this.base}/covers/upload`, { url: d.cover }).subscribe({
        next: r => withCover(`${this.base}/covers/${r.key}`),
        error: () => withCover(d.cover),
      });
    } else {
      withCover('');
    }
  }
}
