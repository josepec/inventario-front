import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  owned: boolean;
  wanted: boolean;
  source?: 'wanted' | 'tracked';
}

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-[#0a0a0a] text-white px-6 py-8">
      <div class="max-w-[1600px] mx-auto">

        <header class="mb-8">
          <h1 class="text-2xl font-bold tracking-tight">Novedades</h1>
          <p class="text-sm text-[#888] mt-1">Cómics que salen este mes y toda la agenda de Whakoom.</p>
        </header>

        <!-- Mis novedades -->
        <section class="mb-10">
          <div class="flex items-baseline justify-between mb-4">
            <h2 class="text-lg font-semibold">Mis novedades — {{ currentMonthLabel() }}</h2>
            @if (mineLoading()) {
              <span class="text-xs text-[#666]">Cargando…</span>
            }
          </div>

          @if (!mineLoading() && mine().length === 0) {
            <div class="rounded-xl border border-dashed border-[#1f1f1f] py-10 text-center text-sm text-[#666]">
              No hay novedades tuyas este mes. Marca cómics como "los quiero" o activa tracking en colecciones.
            </div>
          } @else {
            <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
              @for (item of mine(); track item.whakoom_comic_id) {
                <article class="group relative">
                  <div class="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#141414] border border-[#1f1f1f]">
                    @if (item.cover_url) {
                      <img [src]="item.cover_url" [alt]="item.title" class="w-full h-full object-cover" loading="lazy" />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center text-[#333]">
                        <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </div>
                    }
                    <div class="absolute top-1.5 right-1.5 flex flex-col gap-1">
                      @if (item.source === 'wanted' || item.wanted) {
                        <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#7c3aed] text-white">LO QUIERO</span>
                      } @else if (item.source === 'tracked') {
                        <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#1f2937] text-[#60a5fa]">SIGO</span>
                      }
                    </div>
                  </div>
                  <p class="mt-2 text-xs text-white line-clamp-2" [title]="item.series">{{ item.series }}</p>
                  <p class="text-[11px] text-[#888]">#{{ item.number }}</p>
                </article>
              }
            </div>
          }
        </section>

        <!-- Todas las novedades -->
        <section>
          <div class="flex items-baseline justify-between mb-4">
            <h2 class="text-lg font-semibold">Todas las novedades</h2>
            <div class="flex items-center gap-2">
              <button
                class="px-2 py-1 rounded bg-[#141414] border border-[#1f1f1f] text-[#a0a0a0] hover:text-white text-sm"
                (click)="shiftMonth(-1)">←</button>
              <span class="text-sm text-white min-w-[120px] text-center">{{ allMonthLabel() }}</span>
              <button
                class="px-2 py-1 rounded bg-[#141414] border border-[#1f1f1f] text-[#a0a0a0] hover:text-white text-sm"
                (click)="shiftMonth(1)">→</button>
            </div>
          </div>

          @if (allLoading()) {
            <p class="text-sm text-[#666]">Cargando novedades de Whakoom…</p>
          } @else if (allError()) {
            <p class="text-sm text-red-400">{{ allError() }}</p>
          } @else if (all().length === 0) {
            <p class="text-sm text-[#666]">No hay novedades publicadas para este mes.</p>
          } @else {
            <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
              @for (item of all(); track item.whakoom_comic_id) {
                <article class="group relative">
                  <div class="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#141414] border border-[#1f1f1f]">
                    @if (item.cover_url) {
                      <img [src]="item.cover_url" [alt]="item.title" class="w-full h-full object-cover" loading="lazy" />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center text-[#333]">
                        <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </div>
                    }

                    <div class="absolute top-1.5 right-1.5 flex flex-col gap-1">
                      @if (item.owned) {
                        <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-green-600 text-white">YA TENGO</span>
                      } @else if (item.wanted) {
                        <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#7c3aed] text-white">LO QUIERO</span>
                      }
                    </div>

                    <!-- Overlay con acciones -->
                    @if (!item.owned) {
                      <div class="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        @if (!item.wanted) {
                          <button
                            class="w-full text-xs font-semibold px-3 py-1.5 rounded bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
                            [disabled]="busyId() === item.whakoom_comic_id"
                            (click)="markWanted(item)">
                            Lo quiero
                          </button>
                        } @else {
                          <button
                            class="w-full text-xs font-semibold px-3 py-1.5 rounded bg-[#1f1f1f] hover:bg-[#2a2a2a] text-[#a0a0a0]"
                            [disabled]="busyId() === item.whakoom_comic_id"
                            (click)="unmarkWanted(item)">
                            Quitar
                          </button>
                        }
                      </div>
                    }
                  </div>
                  <p class="mt-2 text-xs text-white line-clamp-2" [title]="item.series">{{ item.series }}</p>
                  <p class="text-[11px] text-[#888]">#{{ item.number }}</p>
                </article>
              }
            </div>
          }
        </section>
      </div>
    </div>
  `,
})
export class NovedadesComponent implements OnInit {
  private api = inject(ApiService);

  currentMonth = this.thisMonth();
  viewMonth = signal(this.thisMonth());

  mine = signal<NewTitleItem[]>([]);
  mineLoading = signal(false);

  all = signal<NewTitleItem[]>([]);
  allLoading = signal(false);
  allError = signal<string | null>(null);

  busyId = signal<string | null>(null);

  ngOnInit() {
    this.loadMine();
    this.loadAll();
  }

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
    this.api.get<{ month: string; items: NewTitleItem[] }>(`/whakoom/newtitles/${yyyymm}`).subscribe({
      next: (res) => { this.all.set(res.items ?? []); this.allLoading.set(false); },
      error: (err) => {
        this.all.set([]);
        this.allError.set(err?.error?.error ?? 'Error al cargar novedades de Whakoom');
        this.allLoading.set(false);
      },
    });
  }

  markWanted(item: NewTitleItem) {
    this.busyId.set(item.whakoom_comic_id);
    this.api.post<NewTitleItem>('/wanted', {
      whakoom_comic_id: item.whakoom_comic_id,
      title: item.title,
      series: item.series,
      number: item.number,
      cover_url: item.cover_url,
      publisher: item.publisher,
      collection_whakoom_id: item.collection_whakoom_id,
      release_month: item.release_month,
    }).subscribe({
      next: () => {
        this.all.update(list => list.map(i =>
          i.whakoom_comic_id === item.whakoom_comic_id ? { ...i, wanted: true } : i));
        this.busyId.set(null);
        // Si pertenece al mes actual, refrescar mis novedades
        if (item.release_month === `${this.currentMonth.year}-${String(this.currentMonth.month).padStart(2,'0')}`) {
          this.loadMine();
        }
      },
      error: () => this.busyId.set(null),
    });
  }

  unmarkWanted(item: NewTitleItem) {
    this.busyId.set(item.whakoom_comic_id);
    this.api.delete<{ ok: boolean }>(`/wanted/${item.whakoom_comic_id}`).subscribe({
      next: () => {
        this.all.update(list => list.map(i =>
          i.whakoom_comic_id === item.whakoom_comic_id ? { ...i, wanted: false } : i));
        this.busyId.set(null);
        this.loadMine();
      },
      error: () => this.busyId.set(null),
    });
  }
}
