import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

interface DashboardData {
  totals: { comics: number; read: number; unread: number; reading: number; collections: number };
  monthly: { added: { month: string; count: number }[]; read: { month: string; count: number }[] };
  byPublisher: { publisher: string; count: number }[];
  byRating: { rating: number; count: number }[];
  collections: { id: number; title: string; total_issues: number; cover_url: string | null; rating: number | null; owned: number }[];
  recentComics: { id: number; title: string; cover_url: string | null; rating: number | null; created_at: string }[];
  spending: { total: number; avg: number };
  thisYear: { added: number; read: number; spent: number };
  prevYear: { added: number; read: number; spent: number };
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

      @if (!loading() && data()) {
        <!-- Header -->
        <div class="mb-6 md:mb-8">
          <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Bienvenido, {{ auth.currentUser()?.username }}
          </h1>
          <p class="text-[#606060] mt-1">Tu colección de un vistazo</p>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
            <p class="text-2xl md:text-3xl font-bold text-white">{{ data()!.totals.comics }}</p>
            <p class="text-[10px] md:text-xs text-[#606060] mt-1 uppercase tracking-wider">Cómics</p>
          </div>
          <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
            <p class="text-2xl md:text-3xl font-bold text-[#22c55e]">{{ data()!.totals.read }}</p>
            <p class="text-[10px] md:text-xs text-[#606060] mt-1 uppercase tracking-wider">Leídos</p>
          </div>
          <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
            <p class="text-2xl md:text-3xl font-bold text-[#f59e0b]">{{ data()!.totals.unread }}</p>
            <p class="text-[10px] md:text-xs text-[#606060] mt-1 uppercase tracking-wider">Pendientes</p>
          </div>
          <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4">
            <p class="text-2xl md:text-3xl font-bold text-[#8b5cf6]">{{ data()!.totals.collections }}</p>
            <p class="text-[10px] md:text-xs text-[#606060] mt-1 uppercase tracking-wider">Colecciones</p>
          </div>
        </div>

        <!-- Reading progress bar -->
        <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5 mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-[#606060] uppercase tracking-wider font-semibold">Progreso de lectura</span>
            <span class="text-sm text-white font-bold">{{ readPercent() }}%</span>
          </div>
          <div class="h-2.5 bg-[#2a2a2a] rounded-full overflow-hidden flex">
            <div class="h-full bg-[#22c55e] transition-all duration-700" [style.width.%]="readPercent()"></div>
            <div class="h-full bg-[#3b82f6] transition-all duration-700" [style.width.%]="readingPercent()"></div>
          </div>
          <div class="flex gap-4 mt-2 text-[10px] text-[#606060]">
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#22c55e] inline-block"></span> Leídos ({{ data()!.totals.read }})</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#3b82f6] inline-block"></span> Leyendo ({{ data()!.totals.reading }})</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#2a2a2a] inline-block"></span> Pendientes ({{ data()!.totals.unread }})</span>
          </div>
        </div>

        <!-- Charts row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

          <!-- Monthly evolution (2/3 width) -->
          <div class="lg:col-span-2 bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
            <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-4">Evolución mensual</h3>
            @if (!data()!.statsStartDate) {
              <div class="h-48 flex flex-col items-center justify-center text-center">
                <p class="text-sm text-[#606060] mb-3">Activa el seguimiento cuando termines de inventariar tu colección</p>
                <button (click)="activateStats()" [disabled]="activatingStats()"
                  class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7c3aed]
                         hover:bg-[#6d28d9] disabled:opacity-40 transition-colors">
                  @if (activatingStats()) { Activando... } @else { Activar seguimiento mensual }
                </button>
              </div>
            } @else {
              <div class="h-48 flex items-end gap-1.5">
                @for (bar of monthlyBars(); track bar.month) {
                  <div class="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                    <div class="w-full flex flex-col justify-end h-full gap-px">
                      @if (bar.read > 0) {
                        <div class="w-full bg-[#22c55e] rounded-t-sm min-h-[2px] transition-all duration-500"
                          [style.height.%]="bar.readPct"></div>
                      }
                      @if (bar.added > 0) {
                        <div class="w-full bg-[#7c3aed] rounded-t-sm min-h-[2px] transition-all duration-500"
                          [style.height.%]="bar.addedPct"
                          [class.rounded-t-sm]="bar.read === 0"></div>
                      }
                    </div>
                    <span class="text-[8px] md:text-[9px] text-[#404040] mt-1 leading-none">{{ bar.label }}</span>
                  </div>
                }
              </div>
              <div class="flex gap-4 mt-3 text-[10px] text-[#606060]">
                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#7c3aed] inline-block"></span> Añadidos</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#22c55e] inline-block"></span> Leídos</span>
              </div>
            }
          </div>

          <!-- By publisher donut (1/3 width) -->
          <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
            <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-4">Por editorial</h3>
            <div class="flex items-center justify-center mb-4">
              <svg viewBox="0 0 36 36" class="w-32 h-32 md:w-36 md:h-36">
                @for (seg of publisherSegments(); track seg.publisher) {
                  <circle cx="18" cy="18" r="14" fill="none" stroke-width="5"
                    [attr.stroke]="seg.color"
                    [attr.stroke-dasharray]="seg.dash"
                    [attr.stroke-dashoffset]="seg.offset"
                    class="transition-all duration-500"
                    transform="rotate(-90 18 18)" />
                }
                <text x="18" y="18.5" text-anchor="middle" dominant-baseline="middle"
                  class="fill-white text-[6px] font-bold">{{ data()!.totals.comics }}</text>
              </svg>
            </div>
            <div class="space-y-1.5">
              @for (seg of publisherSegments(); track seg.publisher) {
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

        <!-- Second row: Spending + Ratings + Year -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

          <!-- Spending card -->
          <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
            <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-3">Inversión</h3>
            <p class="text-2xl font-bold text-white">{{ data()!.spending.total | number:'1.0-0' }} €</p>
            <p class="text-[10px] text-[#606060] mt-1">Media: {{ data()!.spending.avg | number:'1.2-2' }} € / cómic</p>
            @if (data()!.thisYear.spent > 0) {
              <div class="mt-3 pt-3 border-t border-[#1e1e1e]">
                <p class="text-sm font-semibold text-[#8b5cf6]">{{ data()!.thisYear.spent | number:'1.0-0' }} €</p>
                <p class="text-[10px] text-[#606060]">Este año</p>
              </div>
            }
          </div>

          <!-- Rating distribution -->
          <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
            <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-3">Valoraciones</h3>
            <div class="space-y-2">
              @for (r of ratingBars(); track r.rating) {
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-[#f59e0b] w-6 text-right shrink-0">{{ r.rating }}★</span>
                  <div class="flex-1 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div class="h-full bg-[#f59e0b] rounded-full transition-all duration-500"
                      [style.width.%]="r.pct"></div>
                  </div>
                  <span class="text-[10px] text-[#606060] w-5 text-right shrink-0">{{ r.count }}</span>
                </div>
              }
            </div>
            @if (avgRating() > 0) {
              <div class="mt-3 pt-3 border-t border-[#1e1e1e] text-center">
                <span class="text-lg font-bold text-[#f59e0b]">{{ avgRating() | number:'1.1-1' }}</span>
                <span class="text-xs text-[#606060] ml-1">media</span>
              </div>
            }
          </div>

          <!-- Year comparison -->
          <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5">
            <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-3">{{ currentYear }}</h3>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-xs mb-0.5">
                  <span class="text-[#a0a0a0]">Añadidos</span>
                  <span class="text-white font-semibold">{{ data()!.thisYear.added }}</span>
                </div>
                @if (data()!.prevYear.added > 0) {
                  <p class="text-[10px]" [class]="data()!.thisYear.added >= data()!.prevYear.added ? 'text-[#22c55e]' : 'text-[#ef4444]'">
                    {{ data()!.thisYear.added >= data()!.prevYear.added ? '↑' : '↓' }}
                    vs {{ data()!.prevYear.added }} en {{ currentYear - 1 }}
                  </p>
                }
              </div>
              <div>
                <div class="flex justify-between text-xs mb-0.5">
                  <span class="text-[#a0a0a0]">Leídos</span>
                  <span class="text-white font-semibold">{{ data()!.thisYear.read }}</span>
                </div>
                @if (data()!.prevYear.read > 0) {
                  <p class="text-[10px]" [class]="data()!.thisYear.read >= data()!.prevYear.read ? 'text-[#22c55e]' : 'text-[#ef4444]'">
                    {{ data()!.thisYear.read >= data()!.prevYear.read ? '↑' : '↓' }}
                    vs {{ data()!.prevYear.read }} en {{ currentYear - 1 }}
                  </p>
                }
              </div>
              <div class="pt-2 border-t border-[#1e1e1e]">
                <div class="flex justify-between text-xs">
                  <span class="text-[#a0a0a0]">Ratio lectura</span>
                  <span class="font-semibold" [class]="yearRatio() >= 1 ? 'text-[#22c55e]' : 'text-[#f59e0b]'">
                    {{ yearRatio() | number:'1.0-0' }}%
                  </span>
                </div>
                <p class="text-[10px] text-[#606060] mt-0.5">
                  {{ yearRatio() >= 100 ? 'Lees más de lo que compras' : 'Compras más de lo que lees' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Collection progress -->
        @if (data()!.collections.length > 0) {
          <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-5 mb-6">
            <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-4">Progreso de colecciones</h3>
            <div class="space-y-3">
              @for (col of data()!.collections; track col.id) {
                <a [routerLink]="['/app/collections', col.id]" class="flex items-center gap-3 group">
                  <div class="w-8 h-11 rounded-md overflow-hidden bg-[#0d0d0d] shrink-0 border border-[#2a2a2a]">
                    @if (col.cover_url) {
                      <img [src]="col.cover_url" [alt]="col.title" class="w-full h-full object-cover" loading="lazy" />
                    }
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
        @if (data()!.recentComics.length > 0) {
          <div class="mb-6">
            <h3 class="text-xs text-[#606060] uppercase tracking-wider font-semibold mb-3">Últimos añadidos</h3>
            <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-3">
              @for (comic of data()!.recentComics; track comic.id) {
                <a [routerLink]="['/app/comics', comic.id]" class="group">
                  <div class="aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] border border-[#1e1e1e]
                              group-hover:border-[#7c3aed]/50 transition-colors">
                    @if (comic.cover_url) {
                      <img [src]="comic.cover_url" [alt]="comic.title"
                        class="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                    }
                  </div>
                  <p class="mt-1 text-[9px] md:text-[10px] text-[#606060] group-hover:text-[#a0a0a0] truncate transition-colors">{{ comic.title }}</p>
                </a>
              }
            </div>
          </div>
        }

        <!-- Quick actions -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a routerLink="/app/comics"
            class="flex items-center gap-4 bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e]
                   hover:border-[#7c3aed44] rounded-2xl p-4 transition-all group">
            <div class="w-10 h-10 rounded-xl bg-[#7c3aed] flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-white">Añadir cómic</p>
              <p class="text-xs text-[#606060]">Busca en Whakoom o entrada manual</p>
            </div>
          </a>
          <a routerLink="/app/books/new"
            class="flex items-center gap-4 bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e]
                   hover:border-[#7c3aed44] rounded-2xl p-4 transition-all group">
            <div class="w-10 h-10 rounded-xl bg-[#7c3aed] flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-white">Añadir libro</p>
              <p class="text-xs text-[#606060]">Manualmente o por código de barras</p>
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

  data = signal<DashboardData | null>(null);
  loading = signal(true);
  activatingStats = signal(false);
  currentYear = new Date().getFullYear();

  readPercent = computed(() => {
    const d = this.data();
    return d && d.totals.comics > 0 ? Math.round((d.totals.read / d.totals.comics) * 100) : 0;
  });

  readingPercent = computed(() => {
    const d = this.data();
    return d && d.totals.comics > 0 ? Math.round((d.totals.reading / d.totals.comics) * 100) : 0;
  });

  yearRatio = computed(() => {
    const d = this.data();
    if (!d || d.thisYear.added === 0) return 0;
    return Math.round((d.thisYear.read / d.thisYear.added) * 100);
  });

  avgRating = computed(() => {
    const d = this.data();
    if (!d || d.byRating.length === 0) return 0;
    const total = d.byRating.reduce((s, r) => s + r.rating * r.count, 0);
    const count = d.byRating.reduce((s, r) => s + r.count, 0);
    return count > 0 ? total / count : 0;
  });

  monthlyBars = computed(() => {
    const d = this.data();
    if (!d) return [];

    // Build last 12 months
    const months: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toISOString().slice(0, 7));
    }

    const addedMap = new Map(d.monthly.added.map(m => [m.month, m.count]));
    const readMap = new Map(d.monthly.read.map(m => [m.month, m.count]));

    const maxVal = Math.max(
      ...months.map(m => (addedMap.get(m) ?? 0) + (readMap.get(m) ?? 0)),
      1
    );

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return months.map(m => {
      const added = addedMap.get(m) ?? 0;
      const read = readMap.get(m) ?? 0;
      const total = added + read;
      return {
        month: m,
        label: monthNames[parseInt(m.slice(5, 7)) - 1],
        added,
        read,
        addedPct: maxVal > 0 ? (added / maxVal) * 100 : 0,
        readPct: maxVal > 0 ? (read / maxVal) * 100 : 0,
      };
    });
  });

  publisherSegments = computed(() => {
    const d = this.data();
    if (!d || d.byPublisher.length === 0) return [];

    const colors = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6', '#14b8a6', '#f97316'];
    const total = d.byPublisher.reduce((s, p) => s + p.count, 0);
    const circumference = 2 * Math.PI * 14; // r=14
    let offset = 0;

    return d.byPublisher.map((p, i) => {
      const pct = p.count / total;
      const dash = `${pct * circumference} ${circumference}`;
      const seg = {
        publisher: p.publisher,
        count: p.count,
        color: colors[i % colors.length],
        dash,
        offset: -offset,
      };
      offset += pct * circumference;
      return seg;
    });
  });

  ratingBars = computed(() => {
    const d = this.data();
    if (!d) return [];

    const maxCount = Math.max(...d.byRating.map(r => r.count), 1);
    const allRatings = [5, 4, 3, 2, 1];
    const ratingMap = new Map(d.byRating.map(r => [r.rating, r.count]));

    return allRatings.map(r => ({
      rating: r,
      stars: '★'.repeat(r),
      count: ratingMap.get(r) ?? 0,
      pct: ((ratingMap.get(r) ?? 0) / maxCount) * 100,
    }));
  });

  ngOnInit() {
    this.api.get<DashboardData>('/stats/dashboard').subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  activateStats() {
    this.activatingStats.set(true);
    this.http.post<{ date: string }>(`${this.base}/stats/settings/stats-start`, {}).subscribe({
      next: res => {
        const d = this.data();
        if (d) this.data.set({ ...d, statsStartDate: res.date });
        this.activatingStats.set(false);
      },
      error: () => this.activatingStats.set(false),
    });
  }
}
