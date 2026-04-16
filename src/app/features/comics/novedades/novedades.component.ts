import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
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
  local_collection_id?: number | null;
  source?: 'wanted' | 'tracked';
  tracking_mode?: number;
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

interface WkReview { user: string; score: number | null; text: string; date?: string | null; }

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
  ratingValue?: number | null;
  ratingCount?: number | null;
  reviews?: WkReview[];
  local_collection_id?: number | null;
}

interface WkEdition {
  id: string;
  title: string;
  cover: string;
  description: string;
  publisher: string;
  authors: { name: string; role: string }[];
  issues: { id: string; number: number; title: string; cover: string; published: boolean }[];
  total_issues: number;
  url: string;
  ratingValue?: number | null;
  ratingCount?: number | null;
  reviews?: WkReview[];
}

interface AtrasadoCollection {
  collection_id: number;
  collection_title: string;
  collection_cover: string | null;
  collection_whakoom_id: string | null;
  missing_issues: { number: number; title: string; cover: string | null; release_date: string | null }[];
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
              <svg class="inline w-3.5 h-3.5 mr-1 -mt-0.5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>Lo quiero @if (wanted().length > 0) { <span class="ml-1 inline-flex items-center justify-center text-xs font-bold min-w-[1.25rem] h-5 px-1 rounded-full" [class]="tab() === 'wanted' ? 'bg-white/25 text-white' : 'bg-[#7c3aed] text-white'">{{ wanted().length }}</span> }
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
              @if (mineMain().length > 0) {
                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
                  @for (item of mineMain(); track item.whakoom_comic_id) {
                    <div class="group cursor-pointer" (click)="openDetail(item.whakoom_comic_id, 'comic', item.local_collection_id ?? null)">
                      <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] mb-1.5">
                        @if (item.cover_url) {
                          <img [src]="item.cover_url" [alt]="item.title" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" draggable="false" />
                        } @else {
                          <div class="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                            <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/></svg>
                            <p class="text-[10px] text-[#404040] leading-tight">{{ item.title }}</p>
                          </div>
                        }
                        @if (item.source === 'wanted' || item.wanted) {
                          <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#7c3aed] text-white tracking-wide flex items-center gap-0.5"><svg class="w-2.5 h-2.5 fill-current flex-shrink-0" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>LO QUIERO</span>
                        } @else if (item.source === 'tracked') {
                          <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#1f2937] text-[#60a5fa] tracking-wide">COLECCIONANDO</span>
                        }
                        @if (item.number) {
                          <span class="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-lg leading-none backdrop-blur-sm">#{{ item.number }}</span>
                        }
                        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                      </div>
                      <button class="text-xs font-medium text-left text-[#e0e0e0] hover:text-[#8b5cf6] truncate leading-tight w-full transition-colors"
                        (click)="onSeriesClick(item, $event)">{{ item.series || item.title }}</button>
                      @if (item.publisher) { <p class="text-[10px] text-[#606060] truncate">{{ item.publisher }}</p> }
                    </div>
                  }
                </div>
              }
              <!-- Atrasados: publicados sin comprar en colecciones coleccionando -->
              @if (atrasados().length > 0) {
                <div class="mt-6">
                  <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
                    Atrasados
                    <span class="inline-flex items-center justify-center text-[10px] font-bold min-w-[1.25rem] h-4 px-1 rounded-full bg-[#7c3aed33] text-[#a78bfa]">
                      {{ atrasados().reduce(acumulaAtrasados, 0) }}
                    </span>
                  </h3>
                  <div class="flex flex-col gap-2">
                    @for (col of atrasados(); track col.collection_id) {
                      <div class="group flex items-center gap-3 bg-[#111] hover:bg-[#161616] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-xl px-3 py-2.5 cursor-pointer transition-colors"
                        (click)="router.navigate(['/app/collections', col.collection_id])">
                        <!-- Cover miniatura -->
                        <div class="shrink-0 w-9 h-[54px] rounded-lg overflow-hidden bg-[#1a1a1a]">
                          @if (col.collection_cover) {
                            <img [src]="col.collection_cover" [alt]="col.collection_title" class="w-full h-full object-cover" loading="lazy" draggable="false" />
                          } @else {
                            <div class="w-full h-full flex items-center justify-center">
                              <svg class="w-4 h-4 text-[#333]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/></svg>
                            </div>
                          }
                        </div>
                        <!-- Info -->
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-[#e0e0e0] group-hover:text-white truncate transition-colors">{{ col.collection_title }}</p>
                          <p class="text-[11px] text-[#606060] mt-0.5">
                            {{ col.missing_issues.length }} número{{ col.missing_issues.length === 1 ? '' : 's' }} sin comprar
                            <span class="text-[#444] ml-1">#{{ col.missing_issues.map(i => i.number).join(', #') }}</span>
                          </p>
                        </div>
                        <!-- Chevron -->
                        <svg class="shrink-0 w-4 h-4 text-[#333] group-hover:text-[#666] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    }
                  </div>
                </div>
              }

              @if (mineSiguiendo().length > 0) {
                <div class="mt-6">
                  <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-3">Siguiendo</h3>
                  <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
                    @for (item of mineSiguiendo(); track item.whakoom_comic_id) {
                      <div class="group cursor-pointer" (click)="openDetail(item.whakoom_comic_id, 'comic', item.local_collection_id ?? null)">
                        <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] mb-1.5">
                          @if (item.cover_url) {
                            <img [src]="item.cover_url" [alt]="item.title" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" draggable="false" />
                          } @else {
                            <div class="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                              <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/></svg>
                              <p class="text-[10px] text-[#404040] leading-tight">{{ item.title }}</p>
                            </div>
                          }
                          <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0c4a6e] text-[#38bdf8] tracking-wide">SIGUIENDO</span>
                          @if (item.number) {
                            <span class="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-lg leading-none backdrop-blur-sm">#{{ item.number }}</span>
                          }
                          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                        </div>
                        <button class="text-xs font-medium text-left text-[#e0e0e0] hover:text-[#8b5cf6] truncate leading-tight w-full transition-colors"
                          (click)="onSeriesClick(item, $event)">{{ item.series || item.title }}</button>
                        @if (item.publisher) { <p class="text-[10px] text-[#606060] truncate">{{ item.publisher }}</p> }
                      </div>
                    }
                  </div>
                </div>
              }
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
                      <div class="group cursor-pointer" (click)="openDetail(item.whakoom_comic_id, 'comic', item.local_collection_id ?? null)">
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
                            <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#7c3aed] text-white tracking-wide flex items-center gap-0.5"><svg class="w-2.5 h-2.5 fill-current flex-shrink-0" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>LO QUIERO</span>
                          }
                          @if (item.number) {
                            <span class="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-lg leading-none backdrop-blur-sm">#{{ item.number }}</span>
                          }
                          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                        </div>
                        <button class="text-xs font-medium text-left text-[#e0e0e0] hover:text-[#8b5cf6] truncate leading-tight w-full transition-colors"
                          (click)="onSeriesClick(item, $event)">{{ item.series || item.title }}</button>
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
                      <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#7c3aed] text-white tracking-wide flex items-center gap-0.5"><svg class="w-2.5 h-2.5 fill-current flex-shrink-0" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>LO QUIERO</span>
                      @if (w.number) {
                        <span class="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-lg leading-none backdrop-blur-sm">#{{ w.number }}</span>
                      }
                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                    </div>
                    <button class="text-xs font-medium text-left text-[#e0e0e0] hover:text-[#8b5cf6] truncate leading-tight w-full transition-colors"
                      (click)="openDetail(w.whakoom_comic_id)">{{ w.series || w.title }}</button>
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
              @if (searchTotal() > 0) {
                <p class="text-[11px] text-[#555] mb-3">{{ searchResults().length }} de {{ searchTotal() }} resultados</p>
              }
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
              @if (searchHasMore()) {
                <div class="mt-6 flex justify-center">
                  <button (click)="loadMoreSearch()" [disabled]="searchLoadingMore()"
                    class="px-6 py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-sm text-[#a0a0a0] font-medium disabled:opacity-50 transition-colors">
                    @if (searchLoadingMore()) { Cargando… } @else { Cargar más resultados }
                  </button>
                </div>
              }
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
                      <h3 (click)="onDetailSeriesClick()"
                        style="cursor: pointer"
                        class="text-base font-bold text-white leading-tight hover:text-[#a78bfa] transition-colors inline-block"
                        [class.underline]="detail()!.editionId || detail()!.local_collection_id || detailLocalCollId()">{{ detail()!.series || detail()!.title }}</h3>
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
                  @if (detail()!.ratingValue) {
                    <button (click)="detailShowReviews.set(!detailShowReviews())" class="flex items-center gap-1.5 mt-2 hover:opacity-80 transition-opacity">
                      <span class="text-yellow-400 text-xs">★</span>
                      <span class="text-sm font-bold text-white">{{ detail()!.ratingValue!.toFixed(1) }}</span>
                      @if (detail()!.ratingCount) { <span class="text-[10px] text-[#888] hover:text-white transition-colors">({{ detail()!.ratingCount }} opiniones)</span> }
                    </button>
                  }
                </div>
              </div>

              <!-- Mobile: descripción + reseñas -->
              @if (detail()!.description) {
                <p class="md:hidden text-xs text-[#888] leading-relaxed px-4 pb-2">{{ detail()!.description }}</p>
              }
              @if (detailShowReviews()) {
                <div class="md:hidden px-4 pb-3 space-y-2">
                  <p class="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Opiniones</p>
                  @if (detail()!.reviews && detail()!.reviews!.length > 0) {
                    @for (r of detail()!.reviews!.slice(0, detailReviewsLimit()); track r.user + r.text) {
                      <div class="bg-[#161616] rounded-lg p-2.5">
                        <div class="flex items-center gap-1.5 mb-1">
                          @if (r.score) { <span class="text-yellow-400 text-[10px]">★ {{ r.score.toFixed(1) }}</span> }
                          @if (r.user) { <span class="text-[10px] text-[#666]">{{ r.user }}</span> }
                          @if (r.date) { <span class="text-[10px] text-[#444]">· {{ r.date }}</span> }
                        </div>
                        @if (r.text) { <p class="text-[11px] text-[#aaa] leading-snug">{{ r.text }}</p> }
                      </div>
                    }
                    @if (detail()!.reviews!.length > detailReviewsLimit()) {
                      <button (click)="detailReviewsLimit.update(v => v + 5)" class="block w-full text-center text-[11px] text-[#7c3aed] hover:text-[#a78bfa] font-medium transition-colors bg-[#161616] rounded-lg py-1.5 px-2">
                        Mostrar más ({{ detail()!.reviews!.length - detailReviewsLimit() }} más)
                      </button>
                    }
                  }
                  <a [href]="detail()!.url" target="_blank" rel="noopener"
                    class="flex items-center justify-center gap-1 text-[10px] text-[#555] hover:text-[#888] transition-colors pt-0.5">
                    Ver todas en Whakoom ↗
                  </a>
                </div>
              }

              <!-- Desktop: layout con descripción + reseñas -->
              <div class="hidden md:flex">
                <div class="w-56 p-5 shrink-0">
                  <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#141414] border border-[#1f1f1f]">
                    @if (detail()!.cover) {
                      <img [src]="detail()!.cover" [alt]="detail()!.title" class="w-full h-full object-cover" />
                    }
                  </div>
                </div>
                <div class="flex-1 p-5 pl-0 min-w-0">
                  <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="min-w-0">
                      <p class="text-[11px] text-[#888] uppercase tracking-wider">{{ detail()!.publisher }}</p>
                      <h3 (click)="onDetailSeriesClick()"
                        style="cursor: pointer"
                        class="text-xl font-bold text-white hover:text-[#a78bfa] transition-colors inline-block"
                        [class.underline]="detail()!.editionId || detail()!.local_collection_id || detailLocalCollId()">{{ detail()!.series || detail()!.title }}</h3>
                      @if (detail()!.number) { <p class="text-sm text-[#a0a0a0]">#{{ detail()!.number }}</p> }
                    </div>
                    <button (click)="closeDetail()" class="text-[#666] hover:text-white text-xl leading-none">✕</button>
                  </div>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#888] mb-3">
                    @if (detail()!.date) { <span>📅 {{ detail()!.date }}</span> }
                    @if (detail()!.pages) { <span>{{ detail()!.pages }} págs</span> }
                    @if (detail()!.binding) { <span>{{ detail()!.binding }}</span> }
                    @if (detail()!.price) { <span>{{ detail()!.price }} €</span> }
                    @if (detail()!.language) { <span>{{ detail()!.language }}</span> }
                    @if (detail()!.ratingValue) {
                      <button (click)="detailShowReviews.set(!detailShowReviews())" class="flex items-center gap-1 text-yellow-400 font-semibold hover:opacity-80 transition-opacity cursor-pointer">
                        ★ {{ detail()!.ratingValue!.toFixed(1) }}
                        @if (detail()!.ratingCount) { <span class="text-[#888] font-normal hover:text-white transition-colors">({{ detail()!.ratingCount }} opiniones)</span> }
                      </button>
                    }
                  </div>
                  @if (detail()!.authors.length > 0) {
                    <p class="text-xs text-[#a0a0a0] mb-3">{{ detail()!.authors.join(', ') }}</p>
                  }
                  @if (detail()!.description) {
                    <p class="text-xs text-[#a0a0a0] leading-relaxed mb-3">{{ detail()!.description }}</p>
                  }
                  @if (detailShowReviews()) {
                    <div class="space-y-2">
                      <p class="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Opiniones</p>
                      @if (detail()!.reviews && detail()!.reviews!.length > 0) {
                        @for (r of detail()!.reviews!.slice(0, detailReviewsLimit()); track r.user + r.text) {
                          <div class="bg-[#161616] rounded-lg p-2.5">
                            <div class="flex items-center gap-2 mb-0.5">
                              @if (r.score) { <span class="text-yellow-400 text-[10px] font-bold">★ {{ r.score.toFixed(1) }}</span> }
                              @if (r.user) { <span class="text-[10px] text-[#666]">{{ r.user }}</span> }
                              @if (r.date) { <span class="text-[10px] text-[#444]">· {{ r.date }}</span> }
                            </div>
                            @if (r.text) { <p class="text-[11px] text-[#aaa] leading-snug">{{ r.text }}</p> }
                          </div>
                        }
                        @if (detail()!.reviews!.length > detailReviewsLimit()) {
                          <button (click)="detailReviewsLimit.update(v => v + 5)" class="block w-full text-center text-[11px] text-[#7c3aed] hover:text-[#a78bfa] font-medium transition-colors bg-[#161616] rounded-lg py-1.5 px-2">
                            Mostrar más ({{ detail()!.reviews!.length - detailReviewsLimit() }} más)
                          </button>
                        }
                      }
                      <a [href]="detail()!.url" target="_blank" rel="noopener"
                        class="flex items-center justify-center gap-1 text-[10px] text-[#555] hover:text-[#888] transition-colors pt-0.5">
                        Ver todas en Whakoom ↗
                      </a>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="shrink-0 p-4 border-t border-[#1a1a1a]">
              <!-- Fila principal: "Ya lo tengo" + "Lo quiero" -->
              <div class="flex gap-2 mb-2">
                <button (click)="importFromDetail()"
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-600 text-white text-sm font-semibold transition-colors">
                  <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                  Ya lo tengo
                </button>
                @if (!detailIsWanted()) {
                  <button (click)="markWantedFromDetail()"
                    [disabled]="busyId() === detail()!.id"
                    class="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                    <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    Lo quiero
                  </button>
                } @else {
                  <button (click)="removeWanted(detail()!.id)"
                    [disabled]="busyId() === detail()!.id"
                    class="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2a1a3e] hover:bg-[#3a1f58] text-[#c084fc] text-sm font-semibold disabled:opacity-50 transition-colors border border-[#7c3aed]/30">
                    <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    Lo quiero
                  </button>
                }
              </div>
              <!-- Fila secundaria: "Ver serie completa" / "Ver mi colección" -->
              @if (detail()!.editionId || detail()!.local_collection_id || detailLocalCollId()) {
                @let hasLocal = (detail()!.local_collection_id ?? detailLocalCollId()) !== null;
                <button (click)="onDetailSeriesClick()"
                  [class]="hasLocal
                    ? 'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#1a1033] hover:bg-[#241547] text-[#c084fc] hover:text-[#d8b4fe] text-xs font-semibold transition-colors border border-[#7c3aed]/30'
                    : 'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#161616] hover:bg-[#1f1f1f] text-[#888] hover:text-[#a0a0a0] text-xs font-medium transition-colors border border-[#2a2a2a]'">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                  {{ hasLocal ? 'Ver mi colección' : 'Ver serie completa' }}
                </button>
              }
            </div>
          } @else if (detailError()) {
            <div class="p-10 text-center text-red-400 text-sm">{{ detailError() }}</div>
          }
        </div>
      </div>
    }

    <!-- EDITION PANEL — info de colección Whakoom (no tenida localmente) -->
    @if (editionOpen()) {
      <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end md:items-center md:justify-center md:p-4"
        (click)="closeEdition()">
        <div class="bg-[#0f0f0f] border-t md:border border-[#2a2a2a] rounded-t-2xl md:rounded-2xl max-w-3xl w-full shadow-2xl max-h-[92dvh] md:max-h-[85vh] flex flex-col"
          (click)="$event.stopPropagation()">
          <div class="md:hidden flex justify-center pt-3 pb-1 shrink-0">
            <div class="w-10 h-1 rounded-full bg-[#333]"></div>
          </div>
          @if (editionLoading()) {
            <div class="p-10 text-center text-[#666] text-sm">Cargando colección…</div>
          } @else if (edition()) {
            <div class="flex-1 overflow-y-auto">
              <div class="flex gap-4 p-4">
                @if (edition()!.cover) {
                  <div class="w-24 md:w-32 shrink-0">
                    <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#141414]">
                      <img [src]="edition()!.cover" [alt]="edition()!.title" class="w-full h-full object-cover" />
                    </div>
                  </div>
                }
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="text-[10px] text-[#888] uppercase tracking-wider">{{ edition()!.publisher }}</p>
                      <h3 class="text-base md:text-lg font-bold text-white leading-tight">{{ edition()!.title }}</h3>
                      <p class="text-[11px] text-[#666] mt-0.5">{{ edition()!.total_issues }} números</p>
                    </div>
                    <button (click)="closeEdition()" class="text-[#555] hover:text-white text-xl leading-none shrink-0">✕</button>
                  </div>
                  @if (edition()!.authors.length > 0) {
                    <p class="text-[10px] text-[#888] mt-2">{{ edition()!.authors.slice(0,3).map(a => a.name).join(', ') }}</p>
                  }
                  @if (edition()!.ratingValue) {
                    <button (click)="editionShowReviews.set(!editionShowReviews())" class="flex items-center gap-1.5 mt-2 hover:opacity-80 transition-opacity cursor-pointer">
                      <span class="text-yellow-400 text-xs">★</span>
                      <span class="text-sm font-bold text-white">{{ edition()!.ratingValue!.toFixed(1) }}</span>
                      @if (edition()!.ratingCount) { <span class="text-[10px] text-[#888] hover:text-white transition-colors">({{ edition()!.ratingCount }} opiniones)</span> }
                    </button>
                  }
                  @if (edition()!.description) {
                    <p class="text-xs text-[#888] leading-relaxed mt-2">{{ edition()!.description }}</p>
                  }
                </div>
              </div>
              @if (editionShowReviews()) {
                <div class="px-4 pb-3 space-y-2">
                  <p class="text-[10px] text-[#555] uppercase tracking-wider font-semibold">Opiniones</p>
                  @if (edition()!.reviews && edition()!.reviews!.length > 0) {
                    @for (r of edition()!.reviews!.slice(0, editionReviewsLimit()); track r.user + r.text) {
                      <div class="bg-[#161616] rounded-lg p-2.5">
                        <div class="flex items-center gap-2 mb-0.5">
                          @if (r.score) { <span class="text-yellow-400 text-[10px] font-bold">★ {{ r.score.toFixed(1) }}</span> }
                          @if (r.user) { <span class="text-[10px] text-[#666]">{{ r.user }}</span> }
                          @if (r.date) { <span class="text-[10px] text-[#444]">· {{ r.date }}</span> }
                        </div>
                        @if (r.text) { <p class="text-[11px] text-[#aaa] leading-snug">{{ r.text }}</p> }
                      </div>
                    }
                    @if (edition()!.reviews!.length > editionReviewsLimit()) {
                      <button (click)="editionReviewsLimit.update(v => v + 5)" class="block w-full text-center text-[11px] text-[#7c3aed] hover:text-[#a78bfa] font-medium transition-colors bg-[#161616] rounded-lg py-1.5 px-2">
                        Mostrar más ({{ edition()!.reviews!.length - editionReviewsLimit() }} más)
                      </button>
                    }
                  }
                  <a [href]="edition()!.url" target="_blank" rel="noopener"
                    class="flex items-center justify-center gap-1 text-[10px] text-[#555] hover:text-[#888] transition-colors pt-0.5">
                    Ver todas en Whakoom ↗
                  </a>
                </div>
              }
              @if (edition()!.issues.length > 0) {
                <div class="px-4 pb-4">
                  <p class="text-[10px] text-[#555] uppercase tracking-wider font-semibold mb-2">Números publicados</p>
                  <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    @for (iss of edition()!.issues.slice(0, 16); track iss.id) {
                      <div class="cursor-pointer group" (click)="openDetailFromEdition(iss.id)">
                        <div class="aspect-[2/3] rounded-lg overflow-hidden bg-[#141414] group-hover:ring-1 group-hover:ring-[#7c3aed]">
                          @if (iss.cover) {
                            <img [src]="iss.cover" [alt]="iss.title" class="w-full h-full object-cover" loading="lazy" />
                          }
                        </div>
                        <p class="text-[9px] text-[#666] text-center mt-0.5">#{{ iss.number }}</p>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
            <div class="shrink-0 p-4 border-t border-[#1a1a1a]">
              <a [href]="edition()!.url" target="_blank" rel="noopener"
                class="block w-full text-center px-4 py-3 md:py-2 rounded-xl bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#a0a0a0] text-sm font-semibold transition-colors">
                Ver en Whakoom ↗
              </a>
            </div>
          } @else if (editionError()) {
            <div class="p-10 text-center text-red-400 text-sm">{{ editionError() }}</div>
          }
        </div>
      </div>
    }
  `,
})
export class NovedadesComponent implements OnInit {
  private api = inject(ApiService);
  router = inject(Router);
  private location = inject(Location);

  tab = signal<'mine' | 'all' | 'wanted' | 'search'>('mine');

  currentMonth = this.thisMonth();
  viewMonth = signal(this.thisMonth());

  mine = signal<NewTitleItem[]>([]);
  mineLoading = signal(false);
  mineMain = computed(() => this.mine().filter(i => i.source === 'wanted' || (i.tracking_mode ?? 1) === 1));
  mineSiguiendo = computed(() => this.mine().filter(i => i.source === 'tracked' && (i.tracking_mode ?? 1) === 2));

  atrasados = signal<AtrasadoCollection[]>([]);
  atrasadosLoading = signal(false);
  acumulaAtrasados = (acc: number, col: AtrasadoCollection) => acc + col.missing_issues.length;

  groups = signal<NewTitleGroup[]>([]);
  allLoading = signal(false);
  allError = signal<string | null>(null);

  wanted = signal<WantedRow[]>([]);
  wantedLoading = signal(false);
  private wantedLoaded = false;

  searchQuery = '';
  searchResults = signal<WkSearchResult[]>([]);
  searchLoading = signal(false);
  searchLoadingMore = signal(false);
  searchError = signal<string | null>(null);
  searchDirty = signal(false);
  searchPage = signal(1);
  searchHasMore = signal(false);
  searchTotal = signal(0);

  busyId = signal<string | null>(null);

  detailOpen = signal(false);
  detailLoading = signal(false);
  detail = signal<WkComicDetail | null>(null);
  detailError = signal<string | null>(null);
  detailLocalCollId = signal<number | null>(null);

  detailIsWanted = computed(() => {
    const d = this.detail();
    if (!d) return false;
    return this.wanted().some(w => w.whakoom_comic_id === d.id);
  });

  detailShowReviews = signal(false);
  detailReviewsLimit = signal(3);

  editionOpen = signal(false);
  editionLoading = signal(false);
  edition = signal<WkEdition | null>(null);
  editionError = signal<string | null>(null);
  editionShowReviews = signal(false);
  editionReviewsLimit = signal(3);

  ngOnInit() {
    this.loadMine();
    this.loadAll();
    this.loadWanted();
    this.loadAtrasados();
  }

  back() { this.location.back(); }

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

  loadAtrasados() {
    this.atrasadosLoading.set(true);
    this.api.get<{ data: AtrasadoCollection[] }>('/comics/atrasados').subscribe({
      next: (res) => { this.atrasados.set(res.data ?? []); this.atrasadosLoading.set(false); },
      error: () => { this.atrasados.set([]); this.atrasadosLoading.set(false); },
    });
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

  runSearch(page = 1) {
    const q = this.searchQuery.trim();
    if (!q) return;
    if (page === 1) {
      this.searchLoading.set(true);
      this.searchResults.set([]);
    } else {
      this.searchLoadingMore.set(true);
    }
    this.searchError.set(null);
    this.searchDirty.set(true);
    this.searchPage.set(page);
    this.api.get<{ data: WkSearchResult[]; total: number; hasMore: boolean }>(
      `/whakoom/search?q=${encodeURIComponent(q)}&page=${page}`
    ).subscribe({
      next: (res) => {
        const items = res.data ?? [];
        if (page === 1) {
          this.searchResults.set(items);
        } else {
          this.searchResults.update(prev => [...prev, ...items]);
        }
        this.searchTotal.set(res.total ?? 0);
        this.searchHasMore.set(res.hasMore ?? false);
        this.searchLoading.set(false);
        this.searchLoadingMore.set(false);
      },
      error: (err) => {
        if (page === 1) this.searchResults.set([]);
        this.searchError.set(err?.error?.error ?? 'Error buscando en Whakoom');
        this.searchLoading.set(false);
        this.searchLoadingMore.set(false);
      },
    });
  }

  loadMoreSearch() {
    this.runSearch(this.searchPage() + 1);
  }

  openDetail(id: string, type: string = 'comic', localCollId: number | null = null) {
    this.detailOpen.set(true);
    this.detailLoading.set(true);
    this.detail.set(null);
    this.detailError.set(null);
    this.detailLocalCollId.set(localCollId);
    this.detailShowReviews.set(false);
    this.detailReviewsLimit.set(3);
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
    this.detailLocalCollId.set(null);
  }

  onDetailSeriesClick() {
    const d = this.detail();
    if (!d) return;
    const localId = d.local_collection_id ?? this.detailLocalCollId();
    if (localId) {
      this.closeDetail();
      this.router.navigate(['/app/collections', localId]);
    } else if (d.editionId) {
      this.openEdition(d.editionId);
    }
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

  // Tap en el nombre de la serie en una card
  onSeriesClick(item: NewTitleItem, event: Event) {
    event.stopPropagation();
    if (item.local_collection_id) {
      this.router.navigate(['/app/collections', item.local_collection_id]);
    } else {
      // Abre el detail del comic; desde ahí, si hay editionId, se puede abrir la edición
      this.openDetail(item.whakoom_comic_id);
    }
  }

  openEdition(editionId: string) {
    this.closeDetail();
    this.editionOpen.set(true);
    this.editionLoading.set(true);
    this.edition.set(null);
    this.editionError.set(null);
    this.editionShowReviews.set(false);
    this.editionReviewsLimit.set(3);
    this.api.get<WkEdition>(`/whakoom/edition/${editionId}`).subscribe({
      next: (e) => { this.edition.set(e); this.editionLoading.set(false); },
      error: (err) => {
        this.editionError.set(err?.error?.error ?? 'Error al cargar la colección');
        this.editionLoading.set(false);
      },
    });
  }

  closeEdition() {
    this.editionOpen.set(false);
    this.edition.set(null);
  }

  openDetailFromEdition(comicId: string) {
    this.closeEdition();
    this.openDetail(comicId);
  }
}
