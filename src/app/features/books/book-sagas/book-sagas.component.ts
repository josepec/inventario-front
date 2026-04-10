import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface SagaSummary {
  name: string;
  total: number;
  read: number;
  covers: string[];
}

@Component({
  selector: 'app-book-sagas',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="p-4 md:p-8 max-w-7xl mx-auto">

      <div class="flex items-start justify-between mb-5 md:mb-8 gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">Sagas</h1>
          <p class="text-[#606060] mt-0.5 text-sm">{{ sagas().length }} sagas en tu coleccion</p>
        </div>
        <a routerLink="/app/books"
          class="flex items-center gap-2 text-sm text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Todos los libros
        </a>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      @if (!loading() && sagas().length === 0) {
        <div class="text-center py-24">
          <div class="w-16 h-16 rounded-2xl bg-[#161616] flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-[#404040]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p class="text-[#606060] text-sm">No hay sagas todavia.</p>
          <p class="text-[#404040] text-xs mt-1">Asigna una saga a tus libros para verlos agrupados aqui.</p>
        </div>
      }

      @if (!loading() && sagas().length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (saga of sagas(); track saga.name) {
            <button (click)="openSaga(saga.name)"
              class="bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e] hover:border-[#2a2a2a]
                     rounded-2xl p-4 transition-all duration-200 text-left group">
              <!-- Cover strip -->
              <div class="flex gap-1.5 mb-3 h-20 overflow-hidden rounded-lg">
                @for (cover of saga.covers; track cover) {
                  <div class="flex-1 min-w-0 bg-[#0d0d0d] rounded overflow-hidden">
                    <img [src]="cover" [alt]="saga.name" class="w-full h-full object-cover" />
                  </div>
                }
                @if (saga.covers.length === 0) {
                  <div class="flex-1 bg-[#0d0d0d] rounded flex items-center justify-center">
                    <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                }
              </div>

              <h3 class="text-white font-semibold text-sm group-hover:text-[#8b5cf6] transition-colors truncate">
                {{ saga.name }}
              </h3>

              <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-[#606060]">{{ saga.total }} {{ saga.total === 1 ? 'libro' : 'libros' }}</span>
                <div class="flex items-center gap-2">
                  <!-- Progress -->
                  <div class="w-16 h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                    <div class="h-full bg-[#22c55e] rounded-full transition-all"
                      [style.width.%]="saga.total > 0 ? (saga.read / saga.total * 100) : 0"></div>
                  </div>
                  <span class="text-[10px] text-[#606060]">{{ saga.read }}/{{ saga.total }}</span>
                </div>
              </div>
            </button>
          }
        </div>
      }
    </div>
  `
})
export class BookSagasComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = environment.apiUrl;

  sagas = signal<SagaSummary[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loading.set(true);
    this.http.get<SagaSummary[]>(`${this.base}/books/sagas`).subscribe({
      next: data => { this.sagas.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openSaga(name: string) {
    this.router.navigate(['/app/books'], { queryParams: { saga: name } });
  }
}
