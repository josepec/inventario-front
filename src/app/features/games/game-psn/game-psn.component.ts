import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { PsnCandidate, PsnDlc, PsnImportResult, PsnKind } from '../../../shared/models/game.model';

interface Outcome { title: string; result?: PsnImportResult; error?: string }

/**
 * Compras de la PSN Store → copias digitales de la colección.
 *
 * Se leen todas las compras (juegos, DLC, apps, demos), se revisan aquí y se
 * importan las marcadas, de una en una: cada juego busca su ficha en IGDB y
 * guarda la portada, y una petición por juego no se pasa de los límites del
 * Worker. Al final se guardan los DLC, que se enlazan solos con su juego.
 * Volver a importar no duplica: solo añade las copias que falten.
 */
@Component({
  selector: 'app-game-psn',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="p-4 md:p-8 max-w-4xl mx-auto pb-28">

      <div class="flex items-start justify-between gap-3 mb-6">
        <div class="flex items-center gap-4 min-w-0">
          <a routerLink="/app/games"
            class="p-2 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors shrink-0">
            <svg class="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </a>
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-white tracking-tight">Compras de PSN</h1>
            @if (!loading() && !loadError()) {
              <p class="text-[#606060] text-xs mt-0.5">
                {{ candidates().length }} títulos · {{ dlcs().length }} DLC · {{ pendingCount() }} sin importar
              </p>
            }
          </div>
        </div>
        <button type="button" (click)="load()" [disabled]="loading() || importing()"
          class="p-2.5 rounded-xl bg-[#161616] border border-[#2a2a2a] text-[#a0a0a0] hover:text-white hover:bg-[#1f1f1f] transition-colors disabled:opacity-40 shrink-0"
          title="Volver a leer de PSN">
          <svg class="w-4 h-4" [class.animate-spin]="loading()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      @if (loadError(); as e) {
        <p class="text-sm text-[#ef4444] mb-4">{{ e }}</p>
      }

      <!-- Resultado de la última importación -->
      @if (outcomes().length) {
        <div class="bg-[#161616] border border-[#1e1e1e] rounded-2xl p-4 mb-5">
          <div class="flex items-center justify-between gap-3 mb-2">
            <p class="text-sm text-white font-semibold">
              @if (importing()) { Importando {{ outcomes().length }} de {{ total() }}... } @else { Importación terminada }
            </p>
            @if (!importing()) {
              <button type="button" (click)="outcomes.set([])" class="text-xs text-[#606060] hover:text-white">Cerrar</button>
            }
          </div>
          <div class="h-1.5 rounded-full bg-[#0d0d0d] overflow-hidden mb-3">
            <div class="h-full bg-[#7c3aed] transition-all" [style.width.%]="total() ? outcomes().length / total() * 100 : 0"></div>
          </div>
          <p class="text-xs text-[#a0a0a0]">
            {{ summary().created }} juegos nuevos · {{ summary().joined }} sumados a juegos que ya tenías
            @if (summary().failed) { · <span class="text-[#ef4444]">{{ summary().failed }} con error</span> }
            @if (dlcResult(); as d) { · {{ d.saved }} DLC ({{ d.linked }} con su juego) }
          </p>
          @if (!importing() && (noIgdb().length || failed().length)) {
            <div class="mt-3 pt-3 border-t border-[#1e1e1e] space-y-1">
              @if (noIgdb().length) {
                <p class="text-[11px] text-[#f59e0b]">Sin ficha de IGDB (entra y usa «Rellenar desde IGDB» al editar):</p>
                <div class="flex flex-wrap gap-1.5">
                  @for (o of noIgdb(); track o.result!.game_id) {
                    <a [routerLink]="['/app/games', o.result!.game_id]"
                      class="px-2 py-1 rounded-lg text-[11px] bg-[#0d0d0d] border border-[#2a2a2a] text-[#d0d0d0] hover:border-[#7c3aed]">
                      {{ o.result!.title }}
                    </a>
                  }
                </div>
              }
              @for (o of failed(); track o.title) {
                <p class="text-[11px] text-[#ef4444]">{{ o.title }}: {{ o.error }}</p>
              }
            </div>
          }
        </div>
      }

      @if (loading()) {
        <div class="flex flex-col items-center gap-3 py-16">
          <div class="w-7 h-7 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs text-[#606060]">Leyendo tus compras de PSN...</p>
        </div>
      } @else if (candidates().length) {
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-0.5">
            @for (k of kinds; track k.value) {
              <button (click)="kind.set(k.value)"
                class="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
                [class]="kind() === k.value ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
                {{ k.label }} <span class="opacity-60">{{ countOf(k.value) }}</span>
              </button>
            }
          </div>
          <button type="button" (click)="hideImported.set(!hideImported())"
            class="px-3 py-2 rounded-xl text-xs border transition-colors"
            [class]="hideImported() ? 'border-[#7c3aed] text-white bg-[#7c3aed22]' : 'border-[#2a2a2a] text-[#606060] hover:text-[#a0a0a0]'">
            Ocultar ya importados
          </button>
          <div class="ml-auto flex items-center gap-3 text-xs">
            <button type="button" (click)="selectVisible(true)" class="text-[#8b5cf6] hover:text-[#a78bfa]">Marcar todos</button>
            <button type="button" (click)="selectVisible(false)" class="text-[#606060] hover:text-[#a0a0a0]">Ninguno</button>
          </div>
        </div>

        @if (kind() !== 'game') {
          <p class="text-[11px] text-[#606060] mb-3">
            @switch (kind()) {
              @case ('app') { Aplicaciones (vídeo, música, herramientas): normalmente no son juegos de la colección. }
              @case ('demo') { Demos, betas y pruebas. }
              @default { Bandas sonoras, libros de arte, temas y otros extras. }
            }
          </p>
        }

        <ul class="space-y-1.5">
          @for (c of visible(); track c.key) {
            <li>
              <label class="flex items-center gap-3 bg-[#161616] border border-[#1e1e1e] rounded-2xl px-3 py-2.5 cursor-pointer
                            hover:border-[#2a2a2a] transition-colors"
                [class.opacity-50]="c.imported && !selected().has(c.key)">
                <input type="checkbox" [checked]="selected().has(c.key)" (change)="toggle(c.key)" [disabled]="importing()"
                  class="w-4 h-4 accent-[#7c3aed] shrink-0" />
                <div class="w-10 h-10 rounded-lg overflow-hidden bg-[#0d0d0d] shrink-0">
                  @if (icon(c); as src) { <img [src]="src" alt="" class="w-full h-full object-cover" loading="lazy" /> }
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm text-[#d0d0d0] truncate" [title]="c.title">{{ c.title }}</p>
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[#606060] mt-0.5">
                    @for (p of platformsOf(c); track p.platform) {
                      <span class="px-1.5 py-px rounded bg-[#0d0d0d] border border-[#2a2a2a] text-[#a0a0a0]">
                        {{ p.platform }}@if (p.free) { <span class="text-[#22c55e]"> gratis</span> }
                      </span>
                    }
                    @if (firstDate(c); as d) { <span>{{ d | date:'d/M/yyyy' }}</span> }
                    @if (c.dlc_count) { <span>{{ c.dlc_count }} DLC</span> }
                  </div>
                </div>
                <span class="text-[10px] text-right shrink-0 max-w-[40%] truncate">
                  @if (c.imported) {
                    <a [routerLink]="['/app/games', c.game_id]" (click)="$event.stopPropagation()" class="text-[#22c55e] hover:underline">En la colección</a>
                  } @else if (c.game_id) {
                    <span class="text-[#38bdf8]" [title]="'Se sumará a ' + c.game_title">→ {{ c.game_title }}</span>
                  }
                </span>
              </label>
            </li>
          } @empty {
            <li class="text-center text-sm text-[#606060] py-12">
              @if (hideImported()) { Todo lo de aquí ya está importado. } @else { No hay ninguno. }
            </li>
          }
        </ul>
      } @else if (!loadError()) {
        <p class="text-center text-sm text-[#606060] py-16">No hay compras en tu cuenta de PSN.</p>
      }

      <!-- Barra de importar -->
      @if (selected().size && !loading()) {
        <div class="fixed bottom-16 md:bottom-0 inset-x-0 md:left-60 z-30 p-4 pointer-events-none">
          <div class="max-w-4xl mx-auto flex items-center justify-between gap-3 bg-[#161616] border border-[#2a2a2a]
                      rounded-2xl px-4 py-3 shadow-2xl pointer-events-auto">
            <p class="text-sm text-[#a0a0a0]">
              {{ selected().size }} {{ selected().size === 1 ? 'título marcado' : 'títulos marcados' }}
              @if (dlcs().length) { <span class="text-[#606060]"> + los DLC</span> }
            </p>
            <button type="button" (click)="importSelected()" [disabled]="importing()"
              class="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40 transition-colors">
              @if (importing()) { Importando... } @else { Importar }
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class GamePsnComponent implements OnInit {
  private api = inject(ApiService);

  readonly kinds: { value: PsnKind; label: string }[] = [
    { value: 'game', label: 'Juegos' },
    { value: 'app', label: 'Apps' },
    { value: 'demo', label: 'Demos' },
    { value: 'extra', label: 'Extras' },
  ];

  candidates = signal<PsnCandidate[]>([]);
  dlcs = signal<PsnDlc[]>([]);
  loading = signal(true);
  loadError = signal<string | null>(null);
  kind = signal<PsnKind>('game');
  hideImported = signal(false);
  selected = signal<Set<string>>(new Set());

  importing = signal(false);
  total = signal(0);
  outcomes = signal<Outcome[]>([]);
  dlcResult = signal<{ saved: number; linked: number } | null>(null);

  visible = computed(() => this.candidates().filter(c =>
    c.kind === this.kind() && (!this.hideImported() || !c.imported)));
  pendingCount = computed(() => this.candidates().filter(c => c.kind === 'game' && !c.imported).length);
  summary = computed(() => {
    const done = this.outcomes();
    return {
      created: done.filter(o => o.result?.created).length,
      joined: done.filter(o => o.result && !o.result.created && o.result.copies_added).length,
      failed: done.filter(o => o.error).length,
    };
  });
  noIgdb = computed(() => this.outcomes().filter(o => o.result?.created && !o.result.igdb));
  failed = computed(() => this.outcomes().filter(o => o.error));

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.get<{ candidates: PsnCandidate[]; dlcs: PsnDlc[] }>('/games/psn/library').subscribe({
      next: r => {
        this.candidates.set(r.candidates);
        this.dlcs.set(r.dlcs);
        // Por defecto, los juegos que aún no están.
        this.selected.set(new Set(r.candidates.filter(c => c.kind === 'game' && !c.imported).map(c => c.key)));
        this.loading.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.loading.set(false);
        this.loadError.set(e.error?.error ?? 'No se pudieron leer las compras de PSN');
      },
    });
  }

  countOf(k: PsnKind) {
    return this.candidates().filter(c => c.kind === k).length;
  }

  toggle(key: string) {
    const s = new Set(this.selected());
    if (s.has(key)) s.delete(key); else s.add(key);
    this.selected.set(s);
  }

  selectVisible(on: boolean) {
    const s = new Set(this.selected());
    for (const c of this.visible()) {
      if (on) s.add(c.key); else s.delete(c.key);
    }
    this.selected.set(s);
  }

  /** Una entrada por plataforma ("gratis" si todas sus copias lo son). */
  platformsOf(c: PsnCandidate) {
    const map = new Map<string, boolean>();
    for (const x of c.copies) map.set(x.platform, (map.get(x.platform) ?? true) && x.is_free);
    return [...map].map(([platform, free]) => ({ platform, free }))
      .sort((a, b) => a.platform.localeCompare(b.platform));
  }

  firstDate(c: PsnCandidate) {
    return c.copies.map(x => x.acquired_at).filter((d): d is string => !!d).sort()[0] ?? null;
  }

  icon(c: PsnCandidate) {
    return c.copies.find(x => x.icon_url)?.icon_url ?? null;
  }

  async importSelected() {
    const todo = this.candidates().filter(c => this.selected().has(c.key));
    if (!todo.length) return;
    this.importing.set(true);
    this.total.set(todo.length);
    this.outcomes.set([]);
    this.dlcResult.set(null);

    for (const c of todo) {
      let outcome: Outcome;
      try {
        const result = await firstValueFrom(this.api.post<PsnImportResult>('/games/psn/import',
          { title: c.title, copies: c.copies, game_id: c.game_id }));
        outcome = { title: c.title, result };
      } catch (e) {
        outcome = { title: c.title, error: (e as HttpErrorResponse).error?.error ?? 'Error' };
      }
      this.outcomes.update(list => [...list, outcome]);
    }

    // Los DLC al final: así ya existen los juegos con los que se enlazan.
    if (this.dlcs().length) {
      try {
        this.dlcResult.set(await firstValueFrom(
          this.api.post<{ saved: number; linked: number }>('/games/psn/dlcs', { dlcs: this.dlcs() })));
      } catch { /* se reintenta en la próxima importación */ }
    }

    this.importing.set(false);
    this.load();
  }
}
