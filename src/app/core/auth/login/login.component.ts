import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
      <div class="w-full max-w-sm">

        <!-- Logo / Brand -->
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#7c3aed] mb-4">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Inventario</h1>
          <p class="text-sm text-[#606060] mt-1">Tu colección, siempre ordenada</p>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="submit()"
          class="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-8 space-y-5">

          <div>
            <label class="block text-xs font-medium text-[#a0a0a0] mb-2 uppercase tracking-wider">
              Usuario
            </label>
            <input formControlName="username" type="text" autocomplete="username"
              placeholder="tu usuario"
              class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white
                     placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed]
                     transition-colors duration-200" />
          </div>

          <div>
            <label class="block text-xs font-medium text-[#a0a0a0] mb-2 uppercase tracking-wider">
              Contraseña
            </label>
            <input formControlName="password" type="password" autocomplete="current-password"
              placeholder="••••••••"
              class="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white
                     placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed]
                     transition-colors duration-200" />
          </div>

          @if (error()) {
            <p class="text-xs text-[#ef4444] bg-[#ef444411] border border-[#ef444433] rounded-lg px-3 py-2">
              {{ error() }}
            </p>
          }

          <button type="submit" [disabled]="loading() || form.invalid"
            class="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed
                   text-white font-semibold rounded-xl py-3 text-sm transition-colors duration-200 mt-2">
            @if (loading()) {
              <span>Entrando...</span>
            } @else {
              <span>Entrar</span>
            }
          </button>

        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/app/dashboard']),
      error: () => {
        this.error.set('Usuario o contraseña incorrectos');
        this.loading.set(false);
      }
    });
  }
}
