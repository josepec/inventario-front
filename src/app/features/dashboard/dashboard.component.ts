import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../core/auth/auth.service';

interface Stats {
  comics_total: number;
  comics_read: number;
  comics_owned: number;
  books_total: number;
  books_read: number;
  books_owned: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="p-4 md:p-8 max-w-6xl mx-auto">

      <!-- Header -->
      <div class="mb-6 md:mb-10">
        <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Bienvenido, {{ auth.currentUser()?.username }}
        </h1>
        <p class="text-[#606060] mt-1">Tu colección de un vistazo</p>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-10">

        <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-6">
          <div class="flex items-start justify-between mb-3 md:mb-4">
            <div class="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#7c3aed1a] flex items-center justify-center">
              <svg class="w-4 h-4 md:w-5 md:h-5 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
          </div>
          <p class="text-3xl md:text-4xl font-bold text-white">{{ stats()?.comics_total ?? '—' }}</p>
          <p class="text-xs md:text-sm text-[#606060] mt-1">Cómics en total</p>
        </div>

        <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-6">
          <div class="flex items-start justify-between mb-3 md:mb-4">
            <div class="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#22c55e1a] flex items-center justify-center">
              <svg class="w-4 h-4 md:w-5 md:h-5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="text-3xl md:text-4xl font-bold text-white">{{ stats()?.comics_read ?? '—' }}</p>
          <p class="text-xs md:text-sm text-[#606060] mt-1">Cómics leídos</p>
        </div>

        <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-6">
          <div class="flex items-start justify-between mb-3 md:mb-4">
            <div class="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#f59e0b1a] flex items-center justify-center">
              <svg class="w-4 h-4 md:w-5 md:h-5 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
          </div>
          <p class="text-3xl md:text-4xl font-bold text-white">{{ stats()?.books_total ?? '—' }}</p>
          <p class="text-xs md:text-sm text-[#606060] mt-1">Libros en total</p>
        </div>

        <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-6">
          <div class="flex items-start justify-between mb-3 md:mb-4">
            <div class="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#22c55e1a] flex items-center justify-center">
              <svg class="w-4 h-4 md:w-5 md:h-5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="text-3xl md:text-4xl font-bold text-white">{{ stats()?.books_read ?? '—' }}</p>
          <p class="text-xs md:text-sm text-[#606060] mt-1">Libros leídos</p>
        </div>

        <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 md:p-6 col-span-2 lg:col-span-1">
          <div class="flex items-start justify-between mb-3 md:mb-4">
            <div class="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#7c3aed1a] flex items-center justify-center">
              <svg class="w-4 h-4 md:w-5 md:h-5 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
          </div>
          <p class="text-3xl md:text-4xl font-bold text-white">
            {{ ((stats()?.comics_owned ?? 0) + (stats()?.books_owned ?? 0)) || '—' }}
          </p>
          <p class="text-xs md:text-sm text-[#606060] mt-1">Items en colección</p>
        </div>

      </div>

      <!-- Quick actions -->
      <div class="mb-8">
        <h2 class="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Acceso rápido</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <a routerLink="/app/comics"
            class="flex items-center gap-4 bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e]
                   hover:border-[#7c3aed44] rounded-2xl p-4 md:p-5 transition-all duration-200 group">
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
                   hover:border-[#7c3aed44] rounded-2xl p-4 md:p-5 transition-all duration-200 group">
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
      </div>

    </div>
  `
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);

  stats = signal<Stats | null>(null);

  ngOnInit() {
    this.api.get<Stats>('/stats').subscribe({
      next: s => this.stats.set(s),
      error: () => {}
    });
  }
}
