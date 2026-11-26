import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, PaginatedResponse } from '../../../shared/services/api.service';
import {
  Game, GamePlatform, GameStatus, GAME_FORMAT_LABEL, GAME_PLATFORMS, GAME_STATUS_LABEL, GAME_STATUS_STYLE,
} from '../../../shared/models/game.model';

interface Facets {
  platforms: { platform: GamePlatform; count: number }[];
  genres: string[];
  franchises: string[];
}

/** Lista de videojuegos: misma estructura y diseño que la de libros y cómics. */
@Component({
  selector: 'app-games-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-4 md:p-8 max-w-7xl mx-auto">

      <div class="flex items-start justify-between mb-5 md:mb-8 gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">Videojuegos</h1>
          <p class="text-[#606060] mt-0.5 text-sm">{{ total() }} juegos en tu colección</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a routerLink="/app/games/trophies"
            class="flex items-center gap-2 bg-[#161616] hover:bg-[#1a1a1a] border border-[#2a2a2a]
                   text-[#a0a0a0] hover:text-white font-semibold text-sm rounded-xl px-4 py-2.5 transition-colors duration-200">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
            <span class="hidden sm:inline">Trofeos</span>
          </a>
          <a routerLink="/app/games/psn" title="Importar compras de PSN"
            class="flex items-center gap-2 bg-[#161616] hover:bg-[#1a1a1a] border border-[#2a2a2a]
                   text-[#a0a0a0] hover:text-white font-semibold text-sm rounded-xl px-4 py-2.5 transition-colors duration-200">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span class="hidden sm:inline">PSN</span>
          </a>
          <a routerLink="/app/games/new"
            class="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white
                   font-semibold text-sm rounded-xl px-4 py-2.5 md:px-5 transition-colors duration-200">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span class="hidden sm:inline">Añadir juego</span>
            <span class="sm:hidden">Añadir</span>
          </a>
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
              type="text" placeholder="Buscar por título, saga, desarrolladora, EAN..."
              class="w-full bg-[#161616] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-sm
                     text-white placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
          </div>

          <!-- View toggle -->
          <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-1 shrink-0">
            <button (click)="viewMode.set('grid')" [class.bg-[#2a2a2a]]="viewMode() === 'grid'"
              class="p-2 rounded-lg transition-colors hover:bg-[#222]">
              <svg class="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
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

        <!-- Status + sort row -->
        <div class="flex items-center gap-2 flex-wrap">
          <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-0.5">
            @for (s of statusFilters; track s.value) {
              <button (click)="status = s.value; applyFilters()"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                [class]="status === s.value ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
                {{ s.label }}
              </button>
            }
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

        </div>

        <!-- Active filter tags -->
        @if (activeFilterCount() > 0 && !filtersExpanded()) {
          <div class="flex flex-wrap gap-1.5">
            @if (filterPlatform()) {
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#7c3aed1a] text-[#8b5cf6]">
                {{ filterPlatform() }}
                <button (click)="filterPlatform.set(''); applyFilters()" class="hover:text-white text-base leading-none">&times;</button>
              </span>
            }
            @if (filterFormat()) {
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#7c3aed1a] text-[#8b5cf6]">
                {{ formatLabel[filterFormat()] ?? filterFormat() }}
                <button (click)="filterFormat.set(''); applyFilters()" class="hover:text-white text-base leading-none">&times;</button>
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
            @if (filterRatingMin() !== null) {
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#f59e0b1a] text-[#f59e0b]">
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
              <!-- Plataforma -->
              <div>
                <label class="block text-[10px] text-[#606060] mb-1 uppercase tracking-wider">Plataforma</label>
                <input type="text" list="gamePlatformsList" [value]="filterPlatform()"
                  (change)="filterPlatform.set($any($event.target).value); applyFilters()"
                  placeholder="Todas" class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs text-white
                    placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
                <datalist id="gamePlatformsList">
                  @for (p of platformOptions(); track p) { <option [value]="p"></option> }
                </datalist>
              </div>
              <!-- Formato -->
              <div>
                <label class="block text-[10px] text-[#606060] mb-1 uppercase tracking-wider">Formato</label>
                <input type="text" list="gameFormatsList" [value]="formatLabel[filterFormat()] ?? filterFormat()"
                  (change)="setFormat($any($event.target).value)"
                  placeholder="Todos" class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs text-white
                    placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
                <datalist id="gameFormatsList">
                  <option value="Físico"></option>
                  <option value="Digital"></option>
                </datalist>
              </div>
              <!-- Genre -->
              <div>
                <label class="block text-[10px] text-[#606060] mb-1 uppercase tracking-wider">Género</label>
                <input type="text" list="gameGenresList" [value]="filterGenre()"
                  (change)="filterGenre.set($any($event.target).value); applyFilters()"
                  placeholder="Todos" class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs text-white
                    placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
                <datalist id="gameGenresList">
                  @for (g of facets()?.genres ?? []; track g) { <option [value]="g"></option> }
                </datalist>
              </div>
              <!-- Saga -->
              <div>
                <label class="block text-[10px] text-[#606060] mb-1 uppercase tracking-wider">Saga</label>
                <input type="text" list="gameSagasList" [value]="filterSaga()"
                  (change)="filterSaga.set($any($event.target).value); applyFilters()"
                  placeholder="Todas" class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs text-white
                    placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
                <datalist id="gameSagasList">
                  @for (s of facets()?.franchises ?? []; track s) { <option [value]="s"></option> }
                </datalist>
              </div>
            </div>
            <!-- Rating row -->
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 ml-auto">
                <label class="text-[10px] text-[#606060] uppercase tracking-wider whitespace-nowrap">Valoración</label>
                <div class="flex gap-0.5 items-center">
                  @for (s of [1,2,3,4,5]; track s) {
                    <button type="button" (click)="setFilterRatingMin(s)"
                      class="text-base transition-colors"
                      [class]="s <= (filterRatingMin() ?? 0) ? 'text-[#f59e0b]' : 'text-[#2a2a2a] hover:text-[#f59e0b44]'">★</button>
                  }
                </div>
                <span class="text-[10px] text-[#404040]">min.</span>
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
        <div class="sticky top-0 z-30 bg-[#111]/95 backdrop-blur border border-[#2a2a2a] rounded-2xl px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <button (click)="cancelSelection()" class="text-[#606060] hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span class="text-sm text-white font-medium">{{ selectedIds().size }} seleccionados</span>
            <button (click)="selectAll()" class="text-xs text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">
              {{ selectedIds().size === games().length ? 'Deseleccionar todos' : 'Seleccionar todos' }}
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            @for (s of bulkStatuses; track s) {
              <button (click)="bulkSetStatus(s)" [disabled]="bulkUpdating()"
                class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40"
                [class]="statusStyle[s]">
                {{ statusLabel[s] }}
              </button>
            }
          </div>
        </div>
      }

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      @if (!loading() && viewMode() === 'grid') {
        @if (games().length === 0) {
          <div class="text-center py-24">
            <div class="w-16 h-16 rounded-2xl bg-[#161616] flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-[#404040]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
              </svg>
            </div>
            @if (hasFilters()) {
              <p class="text-[#606060] text-sm">Ningún juego coincide con los filtros.</p>
            } @else {
              <p class="text-[#606060] text-sm">No hay juegos todavía.</p>
              <a routerLink="/app/games/new" class="inline-block mt-4 text-sm text-[#8b5cf6] hover:underline">Añade el primero</a>
            }
          </div>
        } @else {
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
            @for (g of games(); track g.id) {
              <div class="group cursor-pointer relative"
                (touchstart)="onPressStart(g.id, $event)" (touchend)="onPressEnd()" (touchmove)="onPressEnd()"
                (mousedown)="onPressStart(g.id, $event)" (mouseup)="onPressEnd()" (mouseleave)="onPressEnd()"
                (click)="onItemClick(g.id)">
                <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#161616] mb-1.5"
                  [class.ring-2]="selectedIds().has(g.id)" [class.ring-[#7c3aed]]="selectedIds().has(g.id)">
                  @if (g.cover_url) {
                    <img [src]="g.cover_url" [alt]="g.title" loading="lazy"
                      class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  } @else {
                    <div class="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                      <p class="text-[10px] text-[#404040] leading-tight">{{ g.title }}</p>
                    </div>
                  }
                  <!-- Selection checkbox (top-left) -->
                  @if (selectionMode()) {
                    <div class="absolute top-2 left-2 z-10">
                      <span class="w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors"
                        [class]="selectedIds().has(g.id) ? 'bg-[#7c3aed] border-[#7c3aed]' : 'border-white/50 bg-black/40'">
                        @if (selectedIds().has(g.id)) {
                          <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        }
                      </span>
                    </div>
                  } @else if (g.formats.includes('digital')) {
                    <!-- Formato (top-left) -->
                    <div class="absolute top-2 left-2 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-bold text-[#a0a0a0]"
                      [title]="g.formats.length > 1 ? 'Físico y digital' : 'Digital'">{{ g.formats.length > 1 ? 'F+D' : 'DIG' }}</div>
                  }
                  <!-- Estado (top-right, como el leído de libros) -->
                  <div class="absolute top-2 right-2">
                    @if (g.status === 'completed') {
                      <span class="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center" title="Pasado">
                        <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                    }
                  </div>
                  @if (g.rating) {
                    <div class="absolute bottom-1.5 left-1.5 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-[#f59e0b] font-semibold">
                      {{ g.rating }}★
                    </div>
                  }
                  @if (g.has_platinum) {
                    <div class="absolute bottom-1.5 right-1.5 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-bold text-[#a5b4fc]"
                      title="Platino conseguido">PLATINO</div>
                  } @else if (g.trophy_progress != null && g.trophy_progress > 0) {
                    <div class="absolute inset-x-0 bottom-0 h-1 bg-black/60" [title]="'Trofeos: ' + g.trophy_progress + '%'">
                      <div class="h-full bg-[#7c3aed]" [style.width.%]="g.trophy_progress"></div>
                    </div>
                  }
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                </div>
                <p class="text-xs font-medium text-[#e0e0e0] truncate leading-tight">{{ g.title }}</p>
                <p class="text-[10px] text-[#606060] truncate">{{ g.platforms.join(' · ') || 'Sin copias' }}</p>
              </div>
            }
          </div>
        }
      }

      @if (!loading() && viewMode() === 'list') {
        <div class="space-y-2">
          @for (g of games(); track g.id) {
            <div class="flex items-center gap-3 md:gap-4 bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e]
                     rounded-xl px-3 md:px-4 py-3 transition-colors duration-150 cursor-pointer"
              [class.ring-2]="selectedIds().has(g.id)" [class.ring-[#7c3aed]]="selectedIds().has(g.id)"
              (touchstart)="onPressStart(g.id, $event)" (touchend)="onPressEnd()" (touchmove)="onPressEnd()"
              (mousedown)="onPressStart(g.id, $event)" (mouseup)="onPressEnd()" (mouseleave)="onPressEnd()"
              (click)="onItemClick(g.id)">
              @if (selectionMode()) {
                <span class="w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors"
                  [class]="selectedIds().has(g.id) ? 'bg-[#7c3aed] border-[#7c3aed]' : 'border-[#2a2a2a]'">
                  @if (selectedIds().has(g.id)) {
                    <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                  }
                </span>
              }
              <div class="w-9 h-12 md:w-10 md:h-14 rounded-lg overflow-hidden bg-[#222] shrink-0">
                @if (g.cover_url) {
                  <img [src]="g.cover_url" [alt]="g.title" class="w-full h-full object-cover" />
                }
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-white truncate">{{ g.title }}</p>
                <p class="text-xs text-[#606060] truncate">{{ g.platforms.join(' · ') || 'Sin copias' }}</p>
              </div>
              @if (g.has_platinum) {
                <span class="text-[10px] font-bold text-[#a5b4fc] shrink-0">PLATINO</span>
              }
              @if (g.rating) {
                <span class="text-xs text-[#f59e0b] shrink-0">{{ g.rating }}★</span>
              }
              <div class="hidden sm:block shrink-0 text-xs text-[#606060]">{{ g.developer }}</div>
              <div class="shrink-0">
                <span class="text-xs px-2 py-1 rounded-lg border" [class]="statusStyle[g.status]">
                  {{ statusLabel[g.status] }}
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
  `,
})
export class GamesListComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly statusLabel = GAME_STATUS_LABEL;
  readonly statusStyle = GAME_STATUS_STYLE;
  readonly formatLabel: Partial<Record<string, string>> = GAME_FORMAT_LABEL;
  readonly statusFilters: { value: '' | GameStatus; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'pending', label: 'Sin empezar' },
    { value: 'playing', label: 'Jugando' },
    { value: 'completed', label: 'Pasados' },
    { value: 'abandoned', label: 'Abandonados' },
  ];
  readonly sortOptions = [
    { value: 'acquired_at', label: 'Recientes' },
    { value: 'title', label: 'Título' },
    { value: 'first_release_date', label: 'Salida' },
    { value: 'completed_at', label: 'Pasado' },
    { value: 'rating', label: 'Nota' },
  ];

  games = signal<Game[]>([]);
  total = signal(0);
  loading = signal(false);
  page = signal(1);
  viewMode = signal<'grid' | 'list'>('grid');

  search = '';
  status: '' | GameStatus = '';
  filterPlatform = signal('');
  filterFormat = signal('');
  filterGenre = signal('');
  filterSaga = signal('');
  filterRatingMin = signal<number | null>(null);
  filtersExpanded = signal(false);

  sortField = signal<string>('acquired_at');
  sortOrder = signal<'desc' | 'asc'>('desc');

  facets = signal<Facets | null>(null);

  readonly limit = 42;
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit)));
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  /** Solo las plataformas de las que hay juegos (si aún no hay facetas, todas). */
  platformOptions = computed(() => this.facets()?.platforms.map(p => p.platform) ?? GAME_PLATFORMS);

  activeFilterCount = computed(() => {
    let n = 0;
    if (this.filterPlatform()) n++;
    if (this.filterFormat()) n++;
    if (this.filterGenre()) n++;
    if (this.filterSaga()) n++;
    if (this.filterRatingMin() !== null) n++;
    return n;
  });

  ngOnInit() {
    // Búsqueda, filtros, orden y página viven en la URL (ver updateUrl), así al volver
    // de la ficha con "atrás" la lista queda como estaba
    const qp = this.route.snapshot.queryParamMap;
    const numOrNull = (k: string) => { const v = qp.get(k); return v == null || v === '' || isNaN(+v) ? null : +v; };
    this.search = qp.get('q') ?? '';
    this.status = (qp.get('status') as GameStatus | null) ?? '';
    if (qp.get('platform')) this.filterPlatform.set(qp.get('platform')!);
    if (qp.get('format')) this.filterFormat.set(qp.get('format')!);
    if (qp.get('genre')) this.filterGenre.set(qp.get('genre')!);
    if (qp.get('saga') || qp.get('franchise')) this.filterSaga.set((qp.get('saga') ?? qp.get('franchise'))!);
    this.filterRatingMin.set(numOrNull('rating'));
    if (qp.get('sort')) this.sortField.set(qp.get('sort')!);
    if (qp.get('order') === 'asc' || qp.get('order') === 'desc') this.sortOrder.set(qp.get('order') as 'asc' | 'desc');
    this.page.set(Math.max(1, numOrNull('page') ?? 1));
    this.api.get<Facets>('/games/facets').subscribe({ next: f => this.facets.set(f) });
    this.load();
  }

  hasFilters() {
    return !!(this.search || this.status || this.activeFilterCount());
  }

  load() {
    this.loading.set(true);
    this.updateUrl();
    const params: Record<string, string | number> = {
      page: this.page(), limit: this.limit, sort: this.sortField(), order: this.sortOrder(),
    };
    if (this.search) params['search'] = this.search;
    if (this.status) params['status'] = this.status;
    if (this.filterPlatform()) params['platform'] = this.filterPlatform();
    if (this.filterFormat()) params['format'] = this.filterFormat();
    if (this.filterGenre()) params['genre'] = this.filterGenre();
    if (this.filterSaga()) params['franchise'] = this.filterSaga();
    if (this.filterRatingMin() !== null) params['rating_min'] = this.filterRatingMin()!;
    this.api.get<PaginatedResponse<Game>>('/games', params).subscribe({
      next: res => { this.games.set(res.data); this.total.set(res.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private updateUrl() {
    const isDefaultSort = this.sortField() === 'acquired_at' && this.sortOrder() === 'desc';
    const qp: Record<string, string | number | null> = {
      q: this.search || null,
      status: this.status || null,
      platform: this.filterPlatform() || null,
      format: this.filterFormat() || null,
      genre: this.filterGenre() || null,
      saga: this.filterSaga() || null,
      franchise: null,
      rating: this.filterRatingMin(),
      sort: isDefaultSort ? null : this.sortField(),
      order: isDefaultSort ? null : this.sortOrder(),
      page: this.page() > 1 ? this.page() : null,
    };
    this.router.navigate([], { queryParams: qp, queryParamsHandling: 'merge', replaceUrl: true });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 400);
  }

  applyFilters() { this.page.set(1); this.load(); }

  clearAllFilters() {
    this.filterPlatform.set(''); this.filterFormat.set('');
    this.filterGenre.set(''); this.filterSaga.set('');
    this.filterRatingMin.set(null); this.status = '';
    this.page.set(1); this.load();
  }

  /** El campo muestra "Físico"/"Digital"; a la API va physical/digital. */
  setFormat(text: string) {
    const t = text.trim().toLowerCase();
    this.filterFormat.set(t.startsWith('f') || t === 'physical' ? 'physical' : t.startsWith('d') ? 'digital' : '');
    this.applyFilters();
  }

  setFilterRatingMin(n: number) {
    this.filterRatingMin.set(this.filterRatingMin() === n ? null : n);
    this.page.set(1); this.load();
  }

  toggleSort(field: string) {
    if (this.sortField() === field) {
      this.sortOrder.set(this.sortOrder() === 'desc' ? 'asc' : 'desc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set(field === 'title' ? 'asc' : 'desc');
    }
    this.page.set(1); this.load();
  }

  goTo(p: number) { this.page.set(p); this.load(); }

  // ── Multi-select ──────────────────────────────────────────────────────

  readonly bulkStatuses: GameStatus[] = ['completed', 'playing', 'pending', 'abandoned'];
  selectionMode = signal(false);
  selectedIds = signal(new Set<number>());
  bulkUpdating = signal(false);
  private pressTimer: ReturnType<typeof setTimeout> | undefined;
  private pressHandled = false;

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
    this.router.navigate(['/app/games', id]);
  }

  selectAll() {
    if (this.selectedIds().size === this.games().length) {
      this.selectedIds.set(new Set());
      this.selectionMode.set(false);
    } else {
      this.selectedIds.set(new Set(this.games().map(g => g.id)));
    }
  }

  cancelSelection() {
    this.selectionMode.set(false);
    this.selectedIds.set(new Set());
  }

  bulkSetStatus(status: GameStatus) {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;
    this.bulkUpdating.set(true);
    this.api.patch('/games/batch', { ids, status }).subscribe({
      next: () => {
        this.bulkUpdating.set(false);
        this.cancelSelection();
        this.load();
      },
      error: () => this.bulkUpdating.set(false),
    });
  }
}
