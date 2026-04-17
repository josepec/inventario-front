import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

interface NovedadItem {
  whakoom_comic_id: string;
  title: string;
  series: string;
  number: string;
  cover_url: string;
  source?: 'wanted' | 'tracked';
  wanted: boolean;
  tracking_mode?: number;
}

interface ComicsDashboard {
  totals: { comics: number; read: number; unread: number; reading: number; collections: number };
  monthly: { added: { month: string; count: number }[]; read: { month: string; count: number }[] };
  byPublisher: { publisher: string; count: number }[];
  byRating: { rating: number; count: number }[];
  collections: { id: number; title: string; total_issues: number; cover_url: string | null; rating: number | null; owned: number }[];
  recentComics: { id: number; title: string; cover_url: string | null; rating: number | null; created_at: string }[];
  spending: {
    total: number;
    avg: number;
    estimatedTotal: number;
    estimatedAvg: number;
    missingCount: number;
    missingPct: number;
  };
  thisYear: { added: number; read: number; spent: number };
  prevYear: { added: number; read: number; spent: number };
  monthlySpending: { thisMonth: number; prevMonth: number };
  statsStartDate: string | null;
}

interface BooksDashboard {
  totals: { books: number; read: number; unread: number; sagas: number };
  monthly: { added: { month: string; count: number }[]; read: { month: string; count: number }[] };
  byPublisher: { publisher: string; count: number }[];
  byGenre: { genre: string; count: number }[];
  byRating: { rating: number; count: number }[];
  bySaga: { saga: string; count: number }[];
  recentBooks: { id: number; title: string; cover_url: string | null; rating: number | null; created_at: string }[];
  spending: { total: number; avg: number };
  thisYear: { added: number; read: number; spent: number };
  prevYear: { added: number; read: number; spent: number };
  monthlySpending: { thisMonth: number; prevMonth: number };
  statsStartDate: string | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="p-4 md:p-8 max-w-6xl mx-auto">

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      @if (!loading()) {
        <!-- Header -->
        <div class="flex items-start justify-between mb-6 md:mb-8">
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Bienvenido
            </h1>
            <p class="text-[#606060] mt-1">Tu coleccion de un vistazo</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex items-center gap-1 bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 mb-6 w-fit">
          <button (click)="activeTab.set('comics')"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            [class]="activeTab() === 'comics' ? 'bg-[#7c3aed] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
            Comics
          </button>
          <button (click)="switchToBooks()"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            [class]="activeTab() === 'books' ? 'bg-[#7c3aed] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
            Libros
          </button>
        </div>

        <!-- ═══════════ COMICS TAB ═══════════ -->
        @if (activeTab() === 'comics' && comicsData()) {
          <!-- KPI Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
              <p class="text-2xl md:text-3xl font-bold text-white">{{ comicsData()!.totals.comics }}</p>
              <p class="text-[10px] md:text-xs text-[#606060] mt-1 uppercase tracking-wider">Comics</p>
            </div>
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
              <p class="text-2xl md:text-3xl font-bold text-[#22c55e]">{{ comicsData()!.totals.read }}</p>
              <p class="text-[10px] md:text-xs text-[#606060] mt-1 uppercase tracking-wider">Leidos</p>
            </div>
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
              <p class="text-2xl md:text-3xl font-bold text-[#f59e0b]">{{ comicsData()!.totals.unread }}</p>
              <p class="text-[10px] md:text-xs text-[#606060] mt-1 uppercase tracking-wider">Pendientes</p>
            </div>
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
              <p class="text-2xl md:text-3xl font-bold text-[#8b5cf6]">{{ comicsData()!.totals.collections }}</p>
              <p class="text-[10px] md:text-xs text-[#606060] mt-1 uppercase tracking-wider">Colecciones</p>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5 mb-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-[#606060] uppercase tracking-wider font-semibold">Progreso de lectura</span>
              <span class="text-sm text-white font-bold">{{ comicReadPct() }}%</span>
            </div>
            <div class="h-2.5 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div class="h-full bg-[#22c55e] transition-all duration-700" [style.width.%]="comicReadPct()"></div>
            </div>
            <div class="flex gap-4 mt-2 text-[10px] text-[#606060]">
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#22c55e] inline-block"></span> Leidos ({{ comicsData()!.totals.read }})</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#2a2a2a] inline-block"></span> Pendientes ({{ comicsData()!.totals.unread }})</span>
            </div>
          </div>

          <!-- Charts row -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <!-- Monthly evolution -->
            <div class="lg:col-span-2 bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5 flex flex-col">
              <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-4">Evolucion mensual</h3>
              @if (!comicsData()!.statsStartDate) {
                <div class="flex-1 flex flex-col items-center justify-center text-center">
                  <p class="text-sm text-[#606060] mb-3">Activa el seguimiento cuando termines de inventariar</p>
                  <button (click)="activateStats()" [disabled]="activatingStats()"
                    class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40 transition-colors">
                    @if (activatingStats()) { Activando... } @else { Activar seguimiento mensual }
                  </button>
                </div>
              } @else {
                <div class="mt-auto">
                <div class="h-48 flex gap-1.5">
                  @for (bar of comicMonthlyBars(); track bar.month) {
                    <div class="flex-1 flex flex-col items-center">
                      <div class="w-full flex-1 flex flex-col justify-end gap-px">
                        @if (bar.read > 0) {
                          <div class="w-full bg-[#22c55e] rounded-t-sm min-h-[2px] transition-all duration-500" [style.height.%]="bar.readPct"></div>
                        }
                        @if (bar.added > 0) {
                          <div class="w-full bg-[#7c3aed] rounded-t-sm min-h-[2px] transition-all duration-500" [style.height.%]="bar.addedPct"></div>
                        }
                      </div>
                      <span class="text-[8px] md:text-[9px] text-[#404040] mt-1 leading-none">{{ bar.label }}</span>
                    </div>
                  }
                </div>
                <div class="flex gap-4 mt-3 text-[10px] text-[#606060]">
                  <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#7c3aed] inline-block"></span> Anadidos</span>
                  <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#22c55e] inline-block"></span> Leidos</span>
                </div>
                </div>
              }
            </div>
            <!-- By publisher donut -->
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
              <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-4">Por editorial</h3>
              <div class="flex items-center justify-center mb-4">
                <svg viewBox="0 0 36 36" class="w-32 h-32 md:w-36 md:h-36">
                  @for (seg of comicPublisherSegs(); track seg.publisher) {
                    <circle cx="18" cy="18" r="14" fill="none" stroke-width="5"
                      [attr.stroke]="seg.color" [attr.stroke-dasharray]="seg.dash" [attr.stroke-dashoffset]="seg.offset"
                      class="transition-all duration-500" transform="rotate(-90 18 18)" />
                  }
                  <text x="18" y="18.5" text-anchor="middle" dominant-baseline="middle" class="fill-white text-[6px] font-bold">{{ comicsData()!.totals.comics }}</text>
                </svg>
              </div>
              <div class="space-y-1.5">
                @for (seg of comicPublisherSegs(); track seg.publisher) {
                  <div class="flex items-center justify-between text-[10px]">
                    <span class="flex items-center gap-1.5 truncate">
                      <span class="w-2 h-2 rounded-full shrink-0" [style.background]="seg.color"></span>
                      <span class="text-[#a0a0a0] truncate">{{ seg.publisher }}</span>
                    </span>
                    <span class="text-[#606060] ml-2 shrink-0">{{ seg.count }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Spending + Ratings + Year -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <!-- Spending -->
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5 flex flex-col gap-3">
              <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold">Inversión</h3>

              <!-- Total real -->
              <div>
                <p class="text-3xl font-bold text-white leading-none">{{ comicsData()!.spending.total | number:'1.0-0' }}<span class="text-lg text-[#606060] font-normal ml-1">€</span></p>
                <p class="text-[11px] text-[#505050] mt-1">{{ comicsData()!.spending.avg | number:'1.2-2' }} € / cómic</p>
              </div>

              @if (comicsData()!.spending.missingCount > 0) {
                <div class="pt-3 border-t border-[#222]">
                  <p class="text-[10px] text-[#505050] mb-1 uppercase tracking-wide">Estimado · {{ comicsData()!.spending.missingPct | number:'1.0-0' }}% sin precio</p>
                  <p class="text-xl font-semibold text-[#a78bfa] leading-none">~{{ comicsData()!.spending.estimatedTotal | number:'1.0-0' }}<span class="text-sm font-normal ml-1">€</span></p>
                  <p class="text-[11px] text-[#505050] mt-0.5">~{{ comicsData()!.spending.estimatedAvg | number:'1.2-2' }} € / cómic</p>
                </div>
              }

              @if (comicsData()!.statsStartDate) {
                <div class="pt-3 border-t border-[#222] flex gap-4">
                  <div class="flex-1">
                    <p class="text-[10px] text-[#505050] uppercase tracking-wide mb-0.5">Este mes</p>
                    <div class="flex items-baseline gap-1.5">
                      <p class="text-base font-bold text-white">{{ comicsData()!.monthlySpending.thisMonth | number:'1.0-0' }}<span class="text-xs font-normal text-[#606060] ml-0.5">€</span></p>
                      @if (comicsData()!.monthlySpending.prevMonth > 0) {
                        <span class="text-[10px] font-semibold"
                          [class]="comicsData()!.monthlySpending.thisMonth <= comicsData()!.monthlySpending.prevMonth ? 'text-[#22c55e]' : 'text-[#ef4444]'">
                          {{ comicsData()!.monthlySpending.thisMonth <= comicsData()!.monthlySpending.prevMonth ? '▼' : '▲' }}{{ comicSpendDiffPct() }}%
                        </span>
                      }
                    </div>
                  </div>
                  @if (comicsData()!.thisYear.spent > 0) {
                    <div class="flex-1">
                      <p class="text-[10px] text-[#505050] uppercase tracking-wide mb-0.5">Este año</p>
                      <p class="text-base font-bold text-white">{{ comicsData()!.thisYear.spent | number:'1.0-0' }}<span class="text-xs font-normal text-[#606060] ml-0.5">€</span></p>
                    </div>
                  }
                </div>
              }
            </div>
            <!-- Ratings -->
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
              <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-3">Valoraciones</h3>
              <div class="space-y-2">
                @for (r of comicRatingBars(); track r.rating) {
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-[#f59e0b] w-6 text-right shrink-0">{{ r.rating }}★</span>
                    <div class="flex-1 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div class="h-full bg-[#f59e0b] rounded-full transition-all duration-500" [style.width.%]="r.pct"></div>
                    </div>
                    <span class="text-[10px] text-[#606060] w-5 text-right shrink-0">{{ r.count }}</span>
                  </div>
                }
              </div>
              @if (comicAvgRating() > 0) {
                <div class="mt-3 pt-3 border-t border-[#1e1e1e] text-center">
                  <span class="text-lg font-bold text-[#f59e0b]">{{ comicAvgRating() | number:'1.1-1' }}</span>
                  <span class="text-xs text-[#606060] ml-1">media</span>
                </div>
              }
            </div>
            <!-- Year -->
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
              @if (!comicsData()!.statsStartDate) {
                <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-3">{{ currentYear }}</h3>
                <div class="h-32 flex items-center justify-center">
                  <p class="text-xs text-[#404040] text-center">Activa el seguimiento para ver datos anuales</p>
                </div>
              } @else {
                <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-3">{{ currentYear }}</h3>
                <div class="space-y-3">
                  <div>
                    <div class="flex justify-between text-xs mb-0.5">
                      <span class="text-[#a0a0a0]">Anadidos</span>
                      <span class="text-white font-semibold">{{ comicsData()!.thisYear.added }}</span>
                    </div>
                    @if (comicsData()!.prevYear.added > 0) {
                      <p class="text-[10px]" [class]="comicsData()!.thisYear.added >= comicsData()!.prevYear.added ? 'text-[#22c55e]' : 'text-[#ef4444]'">
                        {{ comicsData()!.thisYear.added >= comicsData()!.prevYear.added ? '↑' : '↓' }} vs {{ comicsData()!.prevYear.added }} en {{ currentYear - 1 }}
                      </p>
                    }
                  </div>
                  <div>
                    <div class="flex justify-between text-xs mb-0.5">
                      <span class="text-[#a0a0a0]">Leidos</span>
                      <span class="text-white font-semibold">{{ comicsData()!.thisYear.read }}</span>
                    </div>
                  </div>
                  <div class="pt-2 border-t border-[#1e1e1e]">
                    <div class="flex justify-between text-xs">
                      <span class="text-[#a0a0a0]">Ratio lectura</span>
                      <span class="font-semibold" [class]="comicYearRatio() >= 100 ? 'text-[#22c55e]' : 'text-[#f59e0b]'">
                        {{ comicYearRatio() | number:'1.0-0' }}%
                      </span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Mis novedades -->
          @if (novedades().length > 0) {
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5 mb-6">
              <div class="flex items-baseline justify-between mb-4">
                <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold">Mis novedades — {{ novedadesMonthLabel }}</h3>
                <a routerLink="/app/comics/novedades" class="text-[11px] text-[#8b5cf6] hover:text-[#a78bfa]">Ver todas →</a>
              </div>
              <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 md:gap-3">
                @for (n of novedades().slice(0, 8); track n.whakoom_comic_id) {
                  <a routerLink="/app/comics/novedades" class="group">
                    <div class="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#0d0d0d] border border-[#1f1f1f] group-hover:border-[#7c3aed]/60 transition-colors">
                      @if (n.cover_url) {
                        <img [src]="n.cover_url" [alt]="n.title" class="w-full h-full object-cover" loading="lazy" />
                      }
                      @if (n.source === 'wanted' || n.wanted) {
                        <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#7c3aed] text-white tracking-wide flex items-center gap-0.5"><svg class="w-2.5 h-2.5 fill-current flex-shrink-0" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>LO QUIERO</span>
                      } @else if (n.source === 'tracked' && (n.tracking_mode ?? 1) === 2) {
                        <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0c4a6e] text-[#38bdf8] tracking-wide">SIGUIENDO</span>
                      } @else if (n.source === 'tracked') {
                        <span class="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#1f2937] text-[#60a5fa] tracking-wide">COLECCIONANDO</span>
                      }
                    </div>
                    <p class="mt-1 text-[9px] md:text-[10px] text-[#606060] group-hover:text-[#a0a0a0] truncate transition-colors">{{ n.series }} #{{ n.number }}</p>
                  </a>
                }
              </div>
            </div>
          }

          <!-- Collection progress -->
          @if (comicsData()!.collections.length > 0) {
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5 mb-6">
              <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-4">Progreso de colecciones</h3>
              <div class="space-y-3">
                @for (col of comicsData()!.collections; track col.id) {
                  <a [routerLink]="['/app/collections', col.id]" class="flex items-center gap-3 group">
                    <div class="w-8 h-11 rounded-md overflow-hidden bg-[#0d0d0d] shrink-0 border border-[#2a2a2a]">
                      @if (col.cover_url) { <img [src]="col.cover_url" [alt]="col.title" class="w-full h-full object-cover" loading="lazy" /> }
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-xs text-[#a0a0a0] group-hover:text-white truncate transition-colors">{{ col.title }}</span>
                        <span class="text-[10px] text-[#606060] shrink-0 ml-2">{{ col.owned }}/{{ col.total_issues }}</span>
                      </div>
                      <div class="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500"
                          [class]="col.owned >= col.total_issues ? 'bg-[#22c55e]' : 'bg-[#7c3aed]'"
                          [style.width.%]="(col.owned / col.total_issues) * 100"></div>
                      </div>
                    </div>
                  </a>
                }
              </div>
            </div>
          }

          <!-- Recent comics -->
          @if (comicsData()!.recentComics.length > 0) {
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5 mb-6">
              <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-3">Últimos añadidos</h3>
              <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 md:gap-3">
                @for (comic of comicsData()!.recentComics; track comic.id) {
                  <a [routerLink]="['/app/comics', comic.id]" class="group">
                    <div class="aspect-[2/3] rounded-lg overflow-hidden bg-[#0d0d0d] border border-[#1f1f1f] group-hover:border-[#7c3aed]/60 transition-colors">
                      @if (comic.cover_url) { <img [src]="comic.cover_url" [alt]="comic.title" class="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" /> }
                    </div>
                    <p class="mt-1 text-[9px] md:text-[10px] text-[#606060] group-hover:text-[#a0a0a0] truncate transition-colors">{{ comic.title }}</p>
                  </a>
                }
              </div>
            </div>
          }
        }

        <!-- ═══════════ BOOKS TAB ═══════════ -->
        @if (activeTab() === 'books' && booksData()) {
          <!-- KPI Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
              <p class="text-2xl md:text-3xl font-bold text-white">{{ booksData()!.totals.books }}</p>
              <p class="text-[10px] md:text-xs text-[#606060] mt-1 uppercase tracking-wider">Libros</p>
            </div>
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
              <p class="text-2xl md:text-3xl font-bold text-[#22c55e]">{{ booksData()!.totals.read }}</p>
              <p class="text-[10px] md:text-xs text-[#606060] mt-1 uppercase tracking-wider">Leidos</p>
            </div>
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
              <p class="text-2xl md:text-3xl font-bold text-[#f59e0b]">{{ booksData()!.totals.unread }}</p>
              <p class="text-[10px] md:text-xs text-[#606060] mt-1 uppercase tracking-wider">Pendientes</p>
            </div>
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
              <p class="text-2xl md:text-3xl font-bold text-[#8b5cf6]">{{ booksData()!.totals.sagas }}</p>
              <p class="text-[10px] md:text-xs text-[#606060] mt-1 uppercase tracking-wider">Sagas</p>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5 mb-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-[#606060] uppercase tracking-wider font-semibold">Progreso de lectura</span>
              <span class="text-sm text-white font-bold">{{ bookReadPct() }}%</span>
            </div>
            <div class="h-2.5 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div class="h-full bg-[#22c55e] transition-all duration-700" [style.width.%]="bookReadPct()"></div>
            </div>
            <div class="flex gap-4 mt-2 text-[10px] text-[#606060]">
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#22c55e] inline-block"></span> Leidos ({{ booksData()!.totals.read }})</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#2a2a2a] inline-block"></span> Pendientes ({{ booksData()!.totals.unread }})</span>
            </div>
          </div>

          <!-- Charts row -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <!-- Monthly evolution -->
            <div class="lg:col-span-2 bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5 flex flex-col">
              <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-4">Evolucion mensual</h3>
              @if (!booksData()!.statsStartDate) {
                <div class="flex-1 flex flex-col items-center justify-center text-center">
                  <p class="text-sm text-[#606060] mb-3">Activa el seguimiento cuando termines de inventariar</p>
                  <button (click)="activateStats()" [disabled]="activatingStats()"
                    class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40 transition-colors">
                    @if (activatingStats()) { Activando... } @else { Activar seguimiento mensual }
                  </button>
                </div>
              } @else {
                <div class="mt-auto">
                <div class="h-48 flex gap-1.5">
                  @for (bar of bookMonthlyBars(); track bar.month) {
                    <div class="flex-1 flex flex-col items-center">
                      <div class="w-full flex-1 flex flex-col justify-end gap-px">
                        @if (bar.read > 0) {
                          <div class="w-full bg-[#22c55e] rounded-t-sm min-h-[2px] transition-all duration-500" [style.height.%]="bar.readPct"></div>
                        }
                        @if (bar.added > 0) {
                          <div class="w-full bg-[#7c3aed] rounded-t-sm min-h-[2px] transition-all duration-500" [style.height.%]="bar.addedPct"></div>
                        }
                      </div>
                      <span class="text-[8px] md:text-[9px] text-[#404040] mt-1 leading-none">{{ bar.label }}</span>
                    </div>
                  }
                </div>
                <div class="flex gap-4 mt-3 text-[10px] text-[#606060]">
                  <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#7c3aed] inline-block"></span> Anadidos</span>
                  <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#22c55e] inline-block"></span> Leidos</span>
                </div>
                </div>
              }
            </div>
            <!-- By genre -->
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
              <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-4">Por genero</h3>
              <div class="flex items-center justify-center mb-4">
                <svg viewBox="0 0 36 36" class="w-32 h-32 md:w-36 md:h-36">
                  @for (seg of bookGenreSegs(); track seg.label) {
                    <circle cx="18" cy="18" r="14" fill="none" stroke-width="5"
                      [attr.stroke]="seg.color" [attr.stroke-dasharray]="seg.dash" [attr.stroke-dashoffset]="seg.offset"
                      class="transition-all duration-500" transform="rotate(-90 18 18)" />
                  }
                  <text x="18" y="18.5" text-anchor="middle" dominant-baseline="middle" class="fill-white text-[6px] font-bold">{{ booksData()!.totals.books }}</text>
                </svg>
              </div>
              <div class="space-y-1.5">
                @for (seg of bookGenreSegs(); track seg.label) {
                  <div class="flex items-center justify-between text-[10px]">
                    <span class="flex items-center gap-1.5 truncate">
                      <span class="w-2 h-2 rounded-full shrink-0" [style.background]="seg.color"></span>
                      <span class="text-[#a0a0a0] truncate">{{ seg.label }}</span>
                    </span>
                    <span class="text-[#606060] ml-2 shrink-0">{{ seg.count }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Spending + Ratings + Year -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
              <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-3">Inversion</h3>
              <p class="text-2xl font-bold text-white">{{ booksData()!.spending.total | number:'1.0-0' }} EUR</p>
              <p class="text-[10px] text-[#606060] mt-1">Media: {{ booksData()!.spending.avg | number:'1.2-2' }} EUR / libro</p>
              @if (booksData()!.statsStartDate) {
                <div class="mt-3 pt-3 border-t border-[#1e1e1e] space-y-2">
                  <div>
                    <p class="text-sm font-semibold text-[#8b5cf6]">{{ booksData()!.monthlySpending.thisMonth | number:'1.0-0' }} EUR</p>
                    <p class="text-[10px] text-[#606060]">Este mes</p>
                  </div>
                </div>
              }
            </div>
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
              <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-3">Valoraciones</h3>
              <div class="space-y-2">
                @for (r of bookRatingBars(); track r.rating) {
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-[#f59e0b] w-6 text-right shrink-0">{{ r.rating }}★</span>
                    <div class="flex-1 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div class="h-full bg-[#f59e0b] rounded-full transition-all duration-500" [style.width.%]="r.pct"></div>
                    </div>
                    <span class="text-[10px] text-[#606060] w-5 text-right shrink-0">{{ r.count }}</span>
                  </div>
                }
              </div>
              @if (bookAvgRating() > 0) {
                <div class="mt-3 pt-3 border-t border-[#1e1e1e] text-center">
                  <span class="text-lg font-bold text-[#f59e0b]">{{ bookAvgRating() | number:'1.1-1' }}</span>
                  <span class="text-xs text-[#606060] ml-1">media</span>
                </div>
              }
            </div>
            <!-- Top sagas -->
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
              <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-3">Top sagas</h3>
              @if (booksData()!.bySaga.length > 0) {
                <div class="space-y-2.5">
                  @for (s of booksData()!.bySaga; track s.saga) {
                    <a [routerLink]="['/app/books']" [queryParams]="{saga: s.saga}" class="flex items-center justify-between group">
                      <span class="text-xs text-[#a0a0a0] group-hover:text-white truncate transition-colors">{{ s.saga }}</span>
                      <span class="text-xs text-[#606060] shrink-0 ml-2">{{ s.count }}</span>
                    </a>
                  }
                </div>
              } @else {
                <p class="text-xs text-[#404040] text-center py-8">No hay sagas registradas</p>
              }
            </div>
          </div>

          <!-- Recent books -->
          @if (booksData()!.recentBooks.length > 0) {
            <div class="mb-6">
              <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-3">Ultimos anadidos</h3>
              <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-3">
                @for (book of booksData()!.recentBooks; track book.id) {
                  <a [routerLink]="['/app/books', book.id]" class="group">
                    <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] border border-[#1e1e1e] group-hover:border-[#7c3aed]/50 transition-colors">
                      @if (book.cover_url) { <img [src]="book.cover_url" [alt]="book.title" class="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" /> }
                    </div>
                    <p class="mt-1 text-[9px] md:text-[10px] text-[#606060] group-hover:text-[#a0a0a0] truncate transition-colors">{{ book.title }}</p>
                  </a>
                }
              </div>
            </div>
          }
        }

        @if (activeTab() === 'books' && !booksData() && !loading()) {
          <div class="flex justify-center py-20">
            <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
          </div>
        }

        <!-- Quick actions -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a routerLink="/app/comics"
            class="flex items-center gap-4 bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e] hover:border-[#7c3aed44] rounded-2xl p-4 transition-all group">
            <div class="w-10 h-10 rounded-xl bg-[#7c3aed] flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-white">Anadir comic</p>
              <p class="text-xs text-[#606060]">Busca en Whakoom o entrada manual</p>
            </div>
          </a>
          <a routerLink="/app/books"
            class="flex items-center gap-4 bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e] hover:border-[#7c3aed44] rounded-2xl p-4 transition-all group">
            <div class="w-10 h-10 rounded-xl bg-[#7c3aed] flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-white">Anadir libro</p>
              <p class="text-xs text-[#606060]">Busca en Google Books o entrada manual</p>
            </div>
          </a>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  comicsData = signal<ComicsDashboard | null>(null);
  booksData = signal<BooksDashboard | null>(null);
  loading = signal(true);
  activatingStats = signal(false);
  activeTab = signal<'comics' | 'books'>('comics');
  currentYear = new Date().getFullYear();

  novedades = signal<NovedadItem[]>([]);
  novedadesMonthLabel = (() => {
    const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const d = new Date();
    return `${names[d.getMonth()]} ${d.getFullYear()}`;
  })();

  private booksLoaded = false;

  // ── Comics computed ──
  comicReadPct = computed(() => {
    const d = this.comicsData();
    return d && d.totals.comics > 0 ? Math.round((d.totals.read / d.totals.comics) * 100) : 0;
  });

  comicYearRatio = computed(() => {
    const d = this.comicsData();
    if (!d || d.thisYear.added === 0) return 0;
    return Math.round((d.thisYear.read / d.thisYear.added) * 100);
  });

  comicSpendDiffPct = computed(() => {
    const d = this.comicsData();
    if (!d || d.monthlySpending.prevMonth === 0) return 0;
    return Math.abs(Math.round(((d.monthlySpending.thisMonth - d.monthlySpending.prevMonth) / d.monthlySpending.prevMonth) * 100));
  });

  comicAvgRating = computed(() => {
    const d = this.comicsData();
    if (!d || d.byRating.length === 0) return 0;
    const total = d.byRating.reduce((s, r) => s + r.rating * r.count, 0);
    const count = d.byRating.reduce((s, r) => s + r.count, 0);
    return count > 0 ? total / count : 0;
  });

  comicMonthlyBars = computed(() => this.buildMonthlyBars(this.comicsData()?.monthly));
  comicPublisherSegs = computed(() => this.buildDonutSegs(this.comicsData()?.byPublisher ?? [], 'publisher'));
  comicRatingBars = computed(() => this.buildRatingBars(this.comicsData()?.byRating ?? []));

  // ── Books computed ──
  bookReadPct = computed(() => {
    const d = this.booksData();
    return d && d.totals.books > 0 ? Math.round((d.totals.read / d.totals.books) * 100) : 0;
  });

  bookAvgRating = computed(() => {
    const d = this.booksData();
    if (!d || d.byRating.length === 0) return 0;
    const total = d.byRating.reduce((s, r) => s + r.rating * r.count, 0);
    const count = d.byRating.reduce((s, r) => s + r.count, 0);
    return count > 0 ? total / count : 0;
  });

  bookMonthlyBars = computed(() => this.buildMonthlyBars(this.booksData()?.monthly));
  bookGenreSegs = computed(() => this.buildDonutSegs(this.booksData()?.byGenre ?? [], 'genre'));
  bookRatingBars = computed(() => this.buildRatingBars(this.booksData()?.byRating ?? []));

  ngOnInit() {
    this.api.get<ComicsDashboard>('/stats/dashboard').subscribe({
      next: d => { this.comicsData.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.get<{ month: string; items: NovedadItem[] }>('/comics/upcoming-mine').subscribe({
      next: res => {
        const items = res.items ?? [];
        items.sort((a, b) => {
          const order = (i: NovedadItem) => i.source === 'wanted' ? 0 : (i.tracking_mode ?? 1) === 1 ? 1 : 2;
          return order(a) - order(b);
        });
        this.novedades.set(items);
      },
      error: () => this.novedades.set([]),
    });
  }

  switchToBooks() {
    this.activeTab.set('books');
    if (!this.booksLoaded) {
      this.booksLoaded = true;
      this.api.get<BooksDashboard>('/stats/dashboard/books').subscribe({
        next: d => this.booksData.set(d),
      });
    }
  }

  activateStats() {
    this.activatingStats.set(true);
    this.http.post<{ date: string }>(`${this.base}/stats/settings/stats-start`, {}).subscribe({
      next: res => {
        const c = this.comicsData();
        if (c) this.comicsData.set({ ...c, statsStartDate: res.date });
        const b = this.booksData();
        if (b) this.booksData.set({ ...b, statsStartDate: res.date });
        this.activatingStats.set(false);
      },
      error: () => this.activatingStats.set(false),
    });
  }

  // ── Shared helpers ──

  private buildMonthlyBars(monthly?: { added: { month: string; count: number }[]; read: { month: string; count: number }[] }) {
    if (!monthly) return [];
    const months: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      months.push(`${y}-${m}`);
    }
    const addedMap = new Map(monthly.added.map(m => [m.month, m.count]));
    const readMap = new Map(monthly.read.map(m => [m.month, m.count]));
    const maxVal = Math.max(...months.map(m => (addedMap.get(m) ?? 0) + (readMap.get(m) ?? 0)), 1);
    const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months.map(m => {
      const added = addedMap.get(m) ?? 0;
      const read = readMap.get(m) ?? 0;
      return {
        month: m, label: names[parseInt(m.slice(5, 7)) - 1],
        added, read,
        addedPct: (added / maxVal) * 100, readPct: (read / maxVal) * 100,
      };
    });
  }

  private buildDonutSegs(items: { count: number; [k: string]: any }[], labelKey: string) {
    if (!items.length) return [];
    const colors = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6', '#14b8a6', '#f97316'];
    const total = items.reduce((s, p) => s + p.count, 0);
    const circ = 2 * Math.PI * 14;
    let offset = 0;
    return items.map((p, i) => {
      const pct = p.count / total;
      const dash = `${pct * circ} ${circ}`;
      const seg = { label: p[labelKey], publisher: p[labelKey], count: p.count, color: colors[i % colors.length], dash, offset: -offset };
      offset += pct * circ;
      return seg;
    });
  }

  private buildRatingBars(ratings: { rating: number; count: number }[]) {
    const maxCount = Math.max(...ratings.map(r => r.count), 1);
    const ratingMap = new Map(ratings.map(r => [r.rating, r.count]));
    return [5, 4, 3, 2, 1].map(r => ({
      rating: r, count: ratingMap.get(r) ?? 0, pct: ((ratingMap.get(r) ?? 0) / maxCount) * 100,
    }));
  }
}
