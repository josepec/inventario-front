import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoverOption, CoversService } from '../../services/covers.service';

/** Por debajo de este ancho la portada se ve pixelada en la ficha. */
const LOW_RES_WIDTH = 400;

/**
 * Modal para elegir portada entre todas las fuentes. Una ficha por ISBN puede
 * traer bien los datos y la portada de otra edición, así que se enseñan todas
 * con su resolución real y el usuario elige. También admite pegar una URL o
 * subir una foto propia.
 *
 * Emite la URL elegida tal cual (externa o ya en R2 si se subió un fichero);
 * quien la guarda decide cuándo copiarla a R2 con CoversService.persist.
 */
@Component({
  selector: 'app-cover-picker',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet],
  template: `
    <div class="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div class="absolute inset-0 bg-black/70" (click)="closed.emit()"></div>
      <div class="relative w-full md:max-w-3xl bg-[#111111] border border-[#1e1e1e]
                  rounded-t-2xl md:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

        <div class="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 class="text-base font-bold text-white">Elegir portada</h2>
            @if (isbn()) { <p class="text-xs text-[#606060] mt-0.5">ISBN {{ isbn() }}</p> }
          </div>
          <button type="button" (click)="closed.emit()" class="text-[#606060] hover:text-white transition-colors p-1">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
          @if (loading()) {
            <div class="flex flex-col items-center gap-3 py-12">
              <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
              <p class="text-xs text-[#606060]">Buscando en todas las fuentes...</p>
            </div>
          } @else {
            @if (current()) {
              <section>
                <h3 class="section-title">Actual</h3>
                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  <ng-container *ngTemplateOutlet="card; context: { $implicit: { url: current(), source: 'Portada actual', match: 'isbn' } }"></ng-container>
                </div>
              </section>
            }

            <section>
              <h3 class="section-title">De este ISBN</h3>
              @if (byIsbn().length) {
                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  @for (o of byIsbn(); track o.url) {
                    <ng-container *ngTemplateOutlet="card; context: { $implicit: o }"></ng-container>
                  }
                </div>
              } @else {
                <p class="text-xs text-[#606060]">Ninguna fuente tiene portada para este ISBN.</p>
              }
            </section>

            @if (others().length) {
              <section>
                <h3 class="section-title">Otras ediciones</h3>
                <p class="text-[11px] text-[#505050] -mt-1 mb-2">Encontradas por título: pueden no coincidir con tu edición.</p>
                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  @for (o of others(); track o.url) {
                    <ng-container *ngTemplateOutlet="card; context: { $implicit: o }"></ng-container>
                  }
                </div>
              </section>
            }
          }

          <section class="pt-3 border-t border-[#1e1e1e] space-y-3">
            <div class="flex gap-2">
              <input [(ngModel)]="manualUrl" type="url" placeholder="Pegar URL de una imagen"
                class="flex-1 min-w-0 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white
                       placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed]" />
              <button type="button" (click)="useManual()" [disabled]="!manualUrl.trim()"
                class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9]
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Usar</button>
            </div>
            <label class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs cursor-pointer
                          text-[#a0a0a0] hover:text-white bg-[#161616] border border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors">
              @if (uploading()) {
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Subiendo...
              } @else {
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Subir foto o escaneo
              }
              <input type="file" accept="image/*" class="hidden" (change)="onFile($event)" [disabled]="uploading()" />
            </label>
            @if (error()) { <p class="text-xs text-[#ef4444]">{{ error() }}</p> }
          </section>
        </div>
      </div>
    </div>

    <ng-template #card let-o>
      @if (!broken().has(o.url)) {
        <button type="button" (click)="picked.emit(o.url)"
          class="group text-left rounded-xl overflow-hidden bg-[#161616] border transition-colors"
          [class]="o.url === current() ? 'border-[#7c3aed]' : 'border-[#1e1e1e] hover:border-[#7c3aed]'">
          <div class="aspect-[2/3] bg-[#0d0d0d] flex items-center justify-center">
            <img [src]="o.url" [alt]="o.source" loading="lazy" referrerpolicy="no-referrer"
              class="w-full h-full object-contain"
              (load)="onLoad(o.url, $event)" (error)="onError(o.url)" />
          </div>
          <div class="px-2 py-1.5">
            <p class="text-[11px] text-white truncate">{{ o.source }}</p>
            <p class="text-[10px] truncate"
              [class]="isBest(o.url) ? 'text-[#22c55e]' : isLowRes(o.url) ? 'text-[#f59e0b]' : 'text-[#606060]'">
              {{ sizeLabel(o.url) }}{{ isBest(o.url) ? ' · mayor' : '' }}
            </p>
            @if (o.note) { <p class="text-[10px] text-[#505050] truncate">{{ o.note }}</p> }
          </div>
        </button>
      }
    </ng-template>
  `,
  styles: [`
    .section-title { @apply text-xs font-semibold text-[#606060] uppercase tracking-wider mb-2; }
  `],
})
export class CoverPickerComponent implements OnInit {
  private covers = inject(CoversService);

  isbn = input<string | null>(null);
  title = input<string | null>(null);
  author = input<string | null>(null);
  current = input<string | null>(null);

  picked = output<string>();
  closed = output<void>();

  loading = signal(true);
  uploading = signal(false);
  error = signal('');
  options = signal<CoverOption[]>([]);
  /** Dimensiones reales, medidas al cargar cada imagen en el navegador. */
  sizes = signal<Map<string, { w: number; h: number }>>(new Map());
  broken = signal<Set<string>>(new Set());
  manualUrl = '';

  byIsbn = computed(() => this.options().filter(o => o.match === 'isbn' && o.url !== this.current()));
  others = computed(() => this.options().filter(o => o.match === 'other' && o.url !== this.current()));
  private bestUrl = computed(() => {
    let best: string | null = null;
    let bestArea = 0;
    for (const [url, s] of this.sizes()) {
      if (this.broken().has(url)) continue;
      if (s.w * s.h > bestArea) { bestArea = s.w * s.h; best = url; }
    }
    return best;
  });

  ngOnInit() {
    this.covers.options(this.isbn(), this.title(), this.author()).subscribe({
      next: data => { this.options.set(data); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar las portadas'); this.loading.set(false); },
    });
  }

  onLoad(url: string, e: Event) {
    const img = e.target as HTMLImageElement;
    // Algunos CDN devuelven un pixel o un icono en vez de 404
    if (img.naturalWidth < 50) { this.onError(url); return; }
    this.sizes.update(m => new Map(m).set(url, { w: img.naturalWidth, h: img.naturalHeight }));
  }

  onError(url: string) {
    this.broken.update(s => new Set(s).add(url));
  }

  sizeLabel(url: string): string {
    const s = this.sizes().get(url);
    return s ? `${s.w}×${s.h}` : '...';
  }

  isLowRes(url: string): boolean {
    const s = this.sizes().get(url);
    return !!s && s.w < LOW_RES_WIDTH;
  }

  isBest(url: string): boolean {
    return url === this.bestUrl() && this.sizes().size > 1;
  }

  useManual() {
    const url = this.manualUrl.trim();
    if (url) this.picked.emit(url);
  }

  onFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.error.set('');
    this.covers.uploadFile(file).subscribe({
      next: url => { this.uploading.set(false); this.picked.emit(url); },
      error: err => { this.uploading.set(false); this.error.set(err?.error?.error ?? 'No se pudo subir la imagen'); },
    });
  }
}
