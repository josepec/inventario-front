import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-[#0d0d0d] overflow-hidden">
      <app-sidebar />
      <main class="flex-1 overflow-y-auto pb-16 md:pb-0">
        <router-outlet />
      </main>

      <!-- Bottom navigation — mobile only -->
      <nav class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#111111] border-t border-[#1e1e1e]
                  flex items-stretch" style="padding-bottom: env(safe-area-inset-bottom)">

        <a routerLink="/app/dashboard" routerLinkActive #rla1="routerLinkActive"
          class="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors"
          [class]="rla1.isActive ? 'text-[#8b5cf6]' : 'text-[#404040] hover:text-[#a0a0a0]'">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span class="text-[10px] font-medium">Inicio</span>
        </a>

        <a routerLink="/app/comics" routerLinkActive #rla2="routerLinkActive"
          class="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors"
          [class]="rla2.isActive ? 'text-[#8b5cf6]' : 'text-[#404040] hover:text-[#a0a0a0]'">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          <span class="text-[10px] font-medium">Cómics</span>
        </a>

        <a routerLink="/app/books" routerLinkActive #rla3="routerLinkActive"
          class="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors"
          [class]="rla3.isActive ? 'text-[#8b5cf6]' : 'text-[#404040] hover:text-[#a0a0a0]'">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <span class="text-[10px] font-medium">Libros</span>
        </a>

        <button type="button" (click)="auth.logout()"
          class="flex-1 flex flex-col items-center justify-center gap-1 py-2
                 text-[#404040] hover:text-[#a0a0a0] transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          <span class="text-[10px] font-medium">Salir</span>
        </button>

      </nav>
    </div>
  `
})
export class ShellComponent {
  auth = inject(AuthService);
}
