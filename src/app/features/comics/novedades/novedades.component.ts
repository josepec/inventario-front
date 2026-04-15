import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';

interface NewTitleItem {
  whakoom_comic_id: string;
  title: string;
  series: string;
  number: string;
  cover_url: string;
  publisher: string | null;
  collection_whakoom_id: string | null;
  collection_slug: string | null;
  release_month: string;
  release_week: string | null;
  release_week_start: string | null;
  owned: boolean;
  wanted: boolean;
  source?: 'wanted' | 'tracked';
}

interface NewTitleGroup {
  week_label: string;
  week_start: string | null;
  items: NewTitleItem[];
}

interface WkSearchResult {
  id: string;
  title: string;
  cover: string | null;
  publisher: string;
  type: string;
}

interface WkComicDetail {
  id: string;
  title: string;
  cover: string;
  description: string;
  authors: string[];
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

interface WantedRow {
  whakoom_comic_id: string;
  title: string;
  series: string | null;
  number: string | null;
  cover_url: string | null;
  publisher: string | null;
  collection_whakoom_id: string | null;
  release_month: string | null;
  added_at: string;
}

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="p-3 md:p-8 max-w-7xl mx-auto">
      <div>

        <header class="flex items-center justify-between mb-4 md:mb-6 gap-2">
          <div class="min-w-0">
            <h1 class="text-xl md:text-3xl font-bold tracking-tight">Novedades</h1>
            <p class="text-xs md:text-sm text-[#888] mt-0.5 hidden sm:block">Agenda de Whakoom + lo que sigo y lo que quiero.</p>
          </div>
          <button (click)="back()"
            class="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-[#a0a0a0] hover:text-white border border-[#1f1f1f] hover:border-[#2a2a2a] transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span class="hidden sm:inline">Cómics</span>
          </button>
        </header>

        <!-- Tabs — scrollable on mobile -->
        <div class="w-full overflow-x-auto pb-1 mb-4 md:mb-6 scrollbar-none">
          <div class="flex items-center gap-1 bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 w-max min-w-full">
            <button (click)="tab.set('mine')"
              class="flex-1 whitespace-nowrap px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
              [class]="tab() === 'mine' ? 'bg-[#7c3aed] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Mis novedades
            </button>
            <button (click)="tab.set('all')"
              class="flex-1 whitespace-nowrap px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
              [class]="tab() === 'all' ? 'bg-[#7c3aed] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Todas
            </button>
            <button (click)="tab.set('wanted'); loadWanted()"
              class="flex-1 whitespace-nowrap px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
              [class]="tab() === 'wanted' ? 'bg-[#7c3aed] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Lo quiero @if (wanted().length > 0) { <span class="text-[10px] opacity-70">({{ wanted().length }})</span> }
            </button>
            <button (click)="tab.set('search')"
              class="flex-1 whitespace-nowrap px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
              [class]="tab() === 'search' ? 'bg-[#7c3aed] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Buscar
            </button>
          </div>
        </div>

        <!-- TAB: Mis novedades -->
        @if (tab() === 'mine') {
          <section>
            <div class="flex items-center justify-between mb-3 md:mb-4">
              <h2 class="text-base md:text-lg font-semibold">{{ currentMonthLabel() }}</h2>
              @if (mineLoading()) { <span class="text-xs text-[#666]">Cargando…</span> }
            </div>

            @if (!mineLoading() && mine().length === 0) {
              <div class="rounded-xl border border-dashed border-[#1f1f1f] py-12 text-center text-sm text-[#666]">
                No hay novedades tuyas este mes. Marca cómics como "los quiero" o activa tracking en colecciones.
              </div>
            } @else {
              <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
                @for (item of mine(); track item.whakoom_comic_id) {
                  <div class="group cursor-pointer" (click)="openDetail(item.whakoom_comic_id)">
                    <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] mb-1.5">
                      @if (item.cover_url) {
                        <img [src]="item.cover_url" [alt]="item.title"
                          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy" draggable="false" />
                      } @else {
                        <div class="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                          <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                          </svg>
                          <p class="text-[10px] text-[#404040] leading-tight">{{ item.title }}</p>
                        </div>
                      }
                      @if (item.source === 'wanted' || item.wanted) {
                        <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#7c3aed] text-white tracking-wide">LO QUIERO</span>
                      } @else if (item.source === 'tracked') {
                        <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#1f2937] text-[#60a5fa] tracking-wide">COLECCIONANDO</span>
                      }
                      @if (item.number) {
                        <span class="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-lg leading-none backdrop-blur-sm">#{{ item.number }}</span>
                      }
                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                    </div>
                    <p class="text-xs font-medium text-[#e0e0e0] truncate leading-tight">{{ item.series || item.title }}</p>
                    @if (item.publisher) {
                      <p class="text-[10px] text-[#606060] truncate">{{ item.publisher }}</p>
                    }
                  </div>
                }
              </div>
            }
          </section>
        }

        <!-- TAB: Todas las novedades -->
        @if (tab() === 'all') {
          <section>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 md:mb-4">
              <h2 class="text-base md:text-lg font-semibold">Todas las novedades</h2>
              <div class="flex items-center gap-2">
                <button class="px-3 py-1.5 rounded-lg bg-[#141414] border border-[#1f1f1f] text-[#a0a0a0] hover:text-white text-sm transition-colors active:scale-95"
                  (click)="shiftMonth(-1)">←</button>
                <span class="text-sm text-white min-w-[110px] text-center font-medium">{{ allMonthLabel() }}</span>
                <button class="px-3 py-1.5 rounded-lg bg-[#141414] border border-[#1f1f1f] text-[#a0a0a0] hover:text-white text-sm transition-colors active:scale-95"
                  (click)="shiftMonth(1)">→</button>
              </div>
            </div>

            @if (allLoading()) {
              <p class="text-sm text-[#666]">Cargando novedades de Whakoom…</p>
            } @else if (allError()) {
              <p class="text-sm text-red-400">{{ allError() }}</p>
            } @else if (groups().length === 0) {
              <p class="text-sm text-[#666]">No hay novedades publicadas para este mes.</p>
            } @else {
              @for (group of groups(); track group.week_label) {
                <div class="mb-6 md:mb-8">
                  <div class="flex items-baseline gap-2 mb-2 md:mb-3">
                    <h3 class="text-xs md:text-sm font-semibold text-[#a0a0a0] capitalize">{{ group.week_label }}</h3>
                    <span class="text-[10px] text-[#444]">{{ group.items.length }}</span>
                  </div>
                  <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
                    @for (item of group.items; track item.whakoom_comic_id) {
                      <div class="group cursor-pointer" (click)="openDetail(item.whakoom_comic_id)">
                        <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] mb-1.5">
                          @if (item.cover_url) {
                            <img [src]="item.cover_url" [alt]="item.title"
                              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy" draggable="false" />
                          } @else {
                            <div class="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                              <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                              </svg>
                              <p class="text-[10px] text-[#404040] leading-tight">{{ item.title }}</p>
                            </div>
                          }
                          @if (item.owned) {
                            <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-600 text-white tracking-wide">YA TENGO</span>
                          } @else if (item.wanted) {
                            <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#7c3aed] text-white tracking-wide">LO QUIERO</span>
                          }
                          @if (item.number) {
                            <span class="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-lg leading-none backdrop-blur-sm">#{{ item.number }}</span>
                          }
                          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                        </div>
                        <p class="text-xs font-medium text-[#e0e0e0] truncate leading-tight">{{ item.series || item.title }}</p>
                        @if (item.publisher) {
                          <p class="text-[10px] text-[#606060] truncate">{{ item.publisher }}</p>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </section>
        }

        <!-- TAB: Lo quiero -->
        @if (tab() === 'wanted') {
          <section>
            <div class="flex items-center justify-between mb-3 md:mb-4">
              <h2 class="text-base md:text-lg font-semibold">Lo quiero</h2>
              @if (wantedLoading()) { <span class="text-xs text-[#666]">Cargando…</span> }
            </div>

            @if (!wantedLoading() && wanted().length === 0) {
              <div class="rounded-xl border border-dashed border-[#1f1f1f] py-12 text-center text-sm text-[#666]">
                Aún no has marcado ningún cómic como "lo quiero".
              </div>
            } @else {
              <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
                @for (w of wanted(); track w.whakoom_comic_id) {
                  <div class="group">
                    <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] mb-1.5 cursor-pointer"
                      (click)="openDetail(w.whakoom_comic_id)">
                      @if (w.cover_url) {
                        <img [src]="w.cover_url" [alt]="w.title"
                          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy" draggable="false" />
                      } @else {
                        <div class="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                          <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                          </svg>
                          <p class="text-[10px] text-[#404040] leading-tight">{{ w.title }}</p>
                        </div>
                      }
                      <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#7c3aed] text-white tracking-wide">LO QUIERO</span>
                      @if (w.number) {
                        <span class="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-lg leading-none backdrop-blur-sm">#{{ w.number }}</span>
                      }
                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                    </div>
                    <p class="text-xs font-medium text-[#e0e0e0] truncate leading-tight">{{ w.series || w.title }}</p>
                    <div class="flex items-center justify-between">
                      <p class="text-[10px] text-[#606060] truncate">{{ w.release_month ?? '' }}</p>
                      <button class="text-[10px] text-red-400 hover:text-red-300 shrink-0"
                        [disabled]="busyId() === w.whakoom_comic_id"
                        (click)="removeWanted(w.whakoom_comic_id)">Quitar</button>
                    </div>
                  </div>
                }
              </div>
            }
          </section>
        }

        <!-- TAB: Buscar -->
        @if (tab() === 'search') {
          <section>
            <div class="flex items-center gap-2 mb-4 md:mb-6 md:max-w-xl">
              <input [(ngModel)]="searchQuery" (keyup.enter)="runSearch()"
                placeholder="Buscar en Whakoom…"
                class="flex-1 min-w-0 bg-[#141414] border border-[#1f1f1f] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]" />
              <button (click)="runSearch()"
                class="shrink-0 px-4 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                [disabled]="searchLoading()">
                Buscar
              </button>
            </div>

            @if (searchLoading()) {
              <p class="text-sm text-[#666]">Buscando…</p>
            } @else if (searchError()) {
              <p class="text-sm text-red-400">{{ searchError() }}</p>
            } @else if (searchResults().length > 0) {
              <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
                @for (r of searchResults(); track r.id) {
                  <div class="group cursor-pointer" (click)="openDetail(r.id, r.type)">
                    <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] mb-1.5">
                      @if (r.cover) {
                        <img [src]="r.cover" [alt]="r.title"
                          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy" draggable="false" />
                      } @else {
                        <div class="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                          <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                          </svg>
                          <p class="text-[10px] text-[#404040] leading-tight">{{ r.title }}</p>
                        </div>
                      }
                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                    </div>
                    <p class="text-xs font-medium text-[#e0e0e0] truncate leading-tight">{{ r.title }}</p>
                    <p class="text-[10px] text-[#606060] truncate">{{ r.publisher }}</p>
                  </div>
                }
              </div>
            } @else if (searchDirty()) {
              <p class="text-sm text-[#666]">Sin resultados.</p>
            }
          </section>
        }
      </div>
    </div>

    <!-- DETAIL MODAL — bottom sheet on mobile, centered on md+ -->
    @if (detailOpen()) {
      <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end md:items-center md:justify-center md:p-4"
        (click)="closeDetail()">
        <div class="bg-[#0f0f0f] border-t md:border border-[#2a2a2a] rounded-t-2xl md:rounded-2xl max-w-3xl w-full shadow-2xl max-h-[92dvh] md:max-h-[85vh] flex flex-col"
          (click)="$event.stopPropagation()">

          <!-- drag handle — mobile only -->
          <div class="md:hidden flex justify-center pt-3 pb-1 shrink-0">
            <div class="w-10 h-1 rounded-full bg-[#333]"></div>
          </div>

          @if (detailLoading()) {
            <div class="p-10 text-center text-[#666] text-sm">Cargando detalle…</div>
          } @else if (detail()) {
            <div class="flex-1 overflow-y-auto">
              <!-- Mobile: portada + info en horizontal compacto arriba -->
              <div class="flex gap-4 p-4 md:hidden">
                <div class="w-24 shrink-0">
                  <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#141414]">
                    @if (detail()!.cover) {
                      <img [src]="detail()!.cover" [alt]="detail()!.title" class="w-full h-full object-cover" />
                    }
                  </div>
                </div>
                <div class="flex-1 min-w-0 pt-1">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="text-[10px] text-[#888] uppercase tracking-wider">{{ detail()!.publisher }}</p>
                      <h3 class="text-base font-bold text-white leading-tight">{{ detail()!.series || detail()!.title }}</h3>
                      @if (detail()!.number) { <p class="text-sm text-[#a0a0a0]">#{{ detail()!.number }}</p> }
                    </div>
                    <button (click)="closeDetail()" class="text-[#555] hover:text-white text-xl leading-none shrink-0 mt-0.5">✕</button>
                  </div>
                  <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#666] mt-2">
                    @if (detail()!.date) { <span>📅 {{ detail()!.date }}</span> }
                    @if (detail()!.pages) { <span>{{ detail()!.pages }} pp</span> }
                    @if (detail()!.binding) { <span>{{ detail()!.binding }}</span> }
                    @if (detail()!.price) { <span class="font-semibold text-[#a0a0a0]">{{ detail()!.price }} €</span> }
                  </div>
                  @if (detail()!.authors.length > 0) {
                    <p class="text-[10px] text-[#666] mt-1 truncate">{{ detail()!.authors.join(', ') }}</p>
                  }
                </div>
              </div>

              <!-- Mobile: descripción -->
              @if (detail()!.description) {
                <p class="md:hidden text-xs text-[#888] leading-relaxed px-4 pb-3 line-clamp-4">{{ detail()!.description }}</p>
              }

              <!-- Desktop: layout original -->
              <div class="hidden md:flex">
                <div class="w-56 p-5 shrink-0">
                  <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#141414] border border-[#1f1f1f]">
                    @if (detail()!.cover) {
                      <img [src]="detail()!.cover" [alt]="detail()!.title" class="w-full h-full object-cover" />
                    }
                  </div>
                </div>
                <div class="flex-1 p-5 pl-0">
                  <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="min-w-0">
                      <p class="text-[11px] text-[#888] uppercase tracking-wider">{{ detail()!.publisher }}</p>
                      <h3 class="text-xl font-bold text-white">{{ detail()!.series || detail()!.title }}</h3>
                      @if (detail()!.number) { <p class="text-sm text-[#a0a0a0]">#{{ detail()!.number }}</p> }
                    </div>
                    <button (click)="closeDetail()" class="text-[#666] hover:text-white text-xl leading-none">✕</button>
                  </div>
                  <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#888] mb-4">
                    @if (detail()!.date) { <span>📅 {{ detail()!.date }}</span> }
                    @if (detail()!.pages) { <span>{{ detail()!.pages }} págs</span> }
                    @if (detail()!.binding) { <span>{{ detail()!.binding }}</span> }
                    @if (detail()!.price) { <span>{{ detail()!.price }} €</span> }
                    @if (detail()!.language) { <span>{{ detail()!.language }}</span> }
                  </div>
                  @if (detail()!.authors.length > 0) {
                    <p class="text-xs text-[#a0a0a0] mb-3">{{ detail()!.authors.join(', ') }}</p>
                  }
                  @if (detail()!.description) {
                    <p class="text-xs text-[#a0a0a0] leading-relaxed mb-4 line-clamp-6">{{ detail()!.description }}</p>
                  }
                </div>
              </div>
            </div>

            <!-- Botones de acción — siempre al fondo -->
            <div class="shrink-0 flex flex-col sm:flex-row gap-2 p-4 border-t border-[#1a1a1a]">
              <button (click)="importFromDetail()"
                class="flex-1 px-4 py-3 md:py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold text-center transition-colors">
                Ya lo tengo → Añadir a colección
              </button>
              @if (!detailIsWanted()) {
                <button (click)="markWantedFromDetail()"
                  [disabled]="busyId() === detail()!.id"
                  class="flex-1 px-4 py-3 md:py-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                  Lo quiero
                </button>
              } @else {
                <button (click)="removeWanted(detail()!.id)"
                  [disabled]="busyId() === detail()!.id"
                  class="flex-1 px-4 py-3 md:py-2 rounded-xl bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#a0a0a0] text-sm font-semibold disabled:opacity-50 transition-colors">
                  Quitar de "lo quiero"
                </button>
              }
            </div>
          } @else if (detailError()) {
            <div class="p-10 text-center text-red-400 text-sm">{{ detailError() }}</div>
          }
        </div>
      </div>
    }
  `,
})
export class NovedadesComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  tab = signal<'mine' | 'all' | 'wanted' | 'search'>('mine');

  currentMonth = this.thisMonth();
  viewMonth = signal(this.thisMonth());

  mine = signal<NewTitleItem[]>([]);
  mineLoading = signal(false);

  groups = signal<NewTitleGroup[]>([]);
  allLoading = signal(false);
  allError = signal<string | null>(null);

  wanted = signal<WantedRow[]>([]);
  wantedLoading = signal(false);
  private wantedLoaded = false;

  searchQuery = '';
  searchResults = signal<WkSearchResult[]>([]);
  searchLoading = signal(false);
  searchError = signal<string | null>(null);
  searchDirty = signal(false);

  busyId = signal<string | null>(null);

  detailOpen = signal(false);
  detailLoading = signal(false);
  detail = signal<WkComicDetail | null>(null);
  detailError = signal<string | null>(null);

  detailIsWanted = computed(() => {
    const d = this.detail();
    if (!d) return false;
    return this.wanted().some(w => w.whakoom_comic_id === d.id);
  });

  ngOnInit() {
    this.loadMine();
    this.loadAll();
  }

  back() { this.router.navigate(['/app/comics']); }

  private thisMonth(): { year: number; month: number } {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }

  private toYyyymm({ year, month }: { year: number; month: number }): string {
    return `${year}${String(month).padStart(2, '0')}`;
  }

  private monthLabel({ year, month }: { year: number; month: number }): string {
    const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${names[month - 1]} ${year}`;
  }

  currentMonthLabel = () => this.monthLabel(this.currentMonth);
  allMonthLabel = () => this.monthLabel(this.viewMonth());

  shiftMonth(delta: number) {
    const { year, month } = this.viewMonth();
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    this.viewMonth.set({ year: y, month: m });
    this.loadAll();
  }

  loadMine() {
    this.mineLoading.set(true);
    this.api.get<{ month: string; items: NewTitleItem[] }>('/comics/upcoming-mine').subscribe({
      next: (res) => { this.mine.set(res.items ?? []); this.mineLoading.set(false); },
      error: () => { this.mine.set([]); this.mineLoading.set(false); },
    });
  }

  loadAll() {
    this.allLoading.set(true);
    this.allError.set(null);
    const yyyymm = this.toYyyymm(this.viewMonth());
    this.api.get<{ month: string; groups: NewTitleGroup[] }>(`/whakoom/newtitles/${yyyymm}`).subscribe({
      next: (res) => { this.groups.set(res.groups ?? []); this.allLoading.set(false); },
      error: (err) => {
        this.groups.set([]);
        this.allError.set(err?.error?.error ?? 'Error al cargar novedades de Whakoom');
        this.allLoading.set(false);
      },
    });
  }

  loadWanted(force = false) {
    if (this.wantedLoaded && !force) return;
    this.wantedLoading.set(true);
    this.api.get<{ data: WantedRow[] }>('/wanted').subscribe({
      next: (res) => {
        this.wanted.set(res.data ?? []);
        this.wantedLoading.set(false);
        this.wantedLoaded = true;
      },
      error: () => { this.wanted.set([]); this.wantedLoading.set(false); },
    });
  }

  runSearch() {
    const q = this.searchQuery.trim();
    if (!q) return;
    this.searchLoading.set(true);
    this.searchError.set(null);
    this.searchDirty.set(true);
    this.api.get<{ data: WkSearchResult[] }>(`/whakoom/search?q=${encodeURIComponent(q)}`).subscribe({
      next: (res) => { this.searchResults.set(res.data ?? []); this.searchLoading.set(false); },
      error: (err) => {
        this.searchResults.set([]);
        this.searchError.set(err?.error?.error ?? 'Error buscando en Whakoom');
        this.searchLoading.set(false);
      },
    });
  }

  openDetail(id: string, type: string = 'comic') {
    this.detailOpen.set(true);
    this.detailLoading.set(true);
    this.detail.set(null);
    this.detailError.set(null);
    this.loadWanted();
    this.api.get<WkComicDetail>(`/whakoom/comic/${id}?type=${type}`).subscribe({
      next: (d) => { this.detail.set(d); this.detailLoading.set(false); },
      error: (err) => {
        this.detailError.set(err?.error?.error ?? 'Error al cargar detalle');
        this.detailLoading.set(false);
      },
    });
  }

  closeDetail() {
    this.detailOpen.set(false);
    this.detail.set(null);
  }

  markWantedFromDetail() {
    const d = this.detail();
    if (!d) return;
    this.busyId.set(d.id);
    const releaseMonth = d.date && /^\d{4}-\d{2}/.test(d.date) ? d.date.slice(0, 7) : null;
    this.api.post<WantedRow>('/wanted', {
      whakoom_comic_id: d.id,
      title: d.title,
      series: d.series,
      number: d.number,
      cover_url: d.cover,
      publisher: d.publisher,
      release_month: releaseMonth,
    }).subscribe({
      next: (row) => {
        this.busyId.set(null);
        this.wanted.update(list => [row, ...list.filter(w => w.whakoom_comic_id !== row.whakoom_comic_id)]);
        this.groups.update(gs => gs.map(g => ({
          ...g,
          items: g.items.map(i => i.whakoom_comic_id === d.id ? { ...i, wanted: true } : i),
        })));
        this.loadMine();
      },
      error: () => this.busyId.set(null),
    });
  }

  removeWanted(id: string) {
    this.busyId.set(id);
    this.api.delete<{ ok: boolean }>(`/wanted/${id}`).subscribe({
      next: () => {
        this.busyId.set(null);
        this.wanted.update(list => list.filter(w => w.whakoom_comic_id !== id));
        this.groups.update(gs => gs.map(g => ({
          ...g,
          items: g.items.map(i => i.whakoom_comic_id === id ? { ...i, wanted: false } : i),
        })));
        this.mine.update(list => list.filter(i => i.whakoom_comic_id !== id));
      },
      error: () => this.busyId.set(null),
    });
  }

  importFromDetail() {
    const d = this.detail();
    if (!d) return;
    this.closeDetail();
    this.router.navigate(['/app/comics/new'], { queryParams: { whakoom_id: d.id } });
  }
}
