import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="hidden md:flex flex-col h-full w-60 bg-[#111111] border-r border-[#1e1e1e]">

      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 h-16 border-b border-[#1e1e1e] shrink-0">
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-[#7c3aed]">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <span class="font-bold text-white text-base tracking-tight">Inventario</span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

        <p class="px-3 text-[10px] font-semibold text-[#404040] uppercase tracking-widest mb-2">General</p>

        <a routerLink="/app/dashboard" routerLinkActive="bg-[#7c3aed1a] text-white"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#a0a0a0]
                 hover:bg-[#1f1f1f] hover:text-white transition-colors duration-150 group">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Dashboard</span>
        </a>

        <p class="px-3 text-[10px] font-semibold text-[#404040] uppercase tracking-widest mb-2 mt-5">Colección</p>

        <a routerLink="/app/comics" routerLinkActive="bg-[#7c3aed1a] text-[#8b5cf6]"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#a0a0a0]
                 hover:bg-[#1f1f1f] hover:text-white transition-colors duration-150">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          <span>Cómics</span>
        </a>

        <a routerLink="/app/books" routerLinkActive="bg-[#7c3aed1a] text-[#8b5cf6]"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#a0a0a0]
                 hover:bg-[#1f1f1f] hover:text-white transition-colors duration-150">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <span>Libros</span>
        </a>

      </nav>

      <!-- User -->
      <div class="px-3 py-4 border-t border-[#1e1e1e] shrink-0">
        <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1f1f1f] cursor-pointer group"
          (click)="auth.logout()">
          <div class="w-7 h-7 rounded-full bg-[#7c3aed] flex items-center justify-center text-xs font-bold text-white shrink-0">
            {{ userInitial() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-white font-medium truncate">{{ auth.currentUser()?.username }}</p>
          </div>
          <svg class="w-4 h-4 text-[#404040] group-hover:text-[#a0a0a0] shrink-0 transition-colors"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </div>
      </div>

    </aside>
  `
})
export class SidebarComponent {
  auth = inject(AuthService);

  userInitial = () => {
    const u = this.auth.currentUser()?.username;
    return u ? u.charAt(0).toUpperCase() : '?';
  };
}
