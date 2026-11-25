import { Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameCopyDraft, GAME_PLATFORMS } from '../../../shared/models/game.model';
import { BarcodeScannerComponent } from '../../../shared/components/barcode-scanner/barcode-scanner.component';

/**
 * Campos de una copia (plataforma, formato, edición, compra). Edita el objeto
 * que recibe en el sitio: quien lo usa decide cuándo guardarlo.
 */
@Component({
  selector: 'app-game-copy-editor',
  standalone: true,
  imports: [FormsModule, BarcodeScannerComponent],
  template: `
    @let c = copy();
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div>
        <label class="field-label">Plataforma</label>
        <select [(ngModel)]="c.platform" class="field-input">
          @for (p of platforms; track p) {
            <option [value]="p">{{ p }}{{ suggested().includes(p) ? '' : ' *' }}</option>
          }
        </select>
      </div>
      <div>
        <label class="field-label">Formato</label>
        <div class="flex bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-1 gap-1">
          <button type="button" (click)="c.format = 'physical'"
            class="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
            [class]="c.format === 'physical' ? 'bg-[#7c3aed] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">Físico</button>
          <button type="button" (click)="c.format = 'digital'"
            class="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
            [class]="c.format === 'digital' ? 'bg-[#7c3aed] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">Digital</button>
        </div>
      </div>
      <div class="col-span-2">
        <label class="field-label">Edición</label>
        <input [(ngModel)]="c.edition" type="text" placeholder="Estándar" class="field-input" />
      </div>
      <div>
        <label class="field-label">Fecha de compra</label>
        <input [(ngModel)]="c.acquired_at" type="date" class="field-input" />
      </div>
      <div>
        <label class="field-label">Precio (€)</label>
        <input [(ngModel)]="c.price" type="number" step="0.01" min="0" placeholder="Ej: 69.99"
          [disabled]="c.is_free" class="field-input disabled:opacity-40" />
      </div>
      <div>
        <label class="field-label">Tienda</label>
        <input [(ngModel)]="c.store" type="text" [placeholder]="c.format === 'digital' ? 'PlayStation Store' : 'Ej: GAME, Amazon'" class="field-input" />
      </div>
      @if (c.format === 'physical') {
        <div>
          <label class="field-label">EAN</label>
          <div class="flex gap-1.5">
            <input [(ngModel)]="c.ean" type="text" inputmode="numeric" placeholder="Código de barras" class="field-input font-mono min-w-0" />
            <button type="button" (click)="scanning.set(!scanning())" title="Escanear código de barras"
              class="px-2.5 rounded-xl border transition-colors shrink-0"
              [class]="scanning()
                ? 'bg-[#7c3aed22] border-[#7c3aed] text-[#8b5cf6]'
                : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#606060] hover:text-[#8b5cf6] hover:border-[#7c3aed44]'">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.5v15m3-15v15m4.5-15v15m3-15v15m3.75-15v15" />
              </svg>
            </button>
          </div>
        </div>
      } @else {
        <div class="flex items-end pb-2.5">
          <label class="flex items-center gap-2 text-xs text-[#a0a0a0] cursor-pointer select-none">
            <input type="checkbox" [(ngModel)]="c.is_free" class="accent-[#7c3aed]" />
            Regalado (gratis)
          </label>
        </div>
      }
    </div>
    @if (scanning() && c.format === 'physical') {
      <div class="mt-3">
        <app-barcode-scanner [height]="160"
          (scanned)="c.ean = $event; scanning.set(false); scanError.set(null)"
          (failed)="scanning.set(false); scanError.set($event)" />
      </div>
    }
    @if (scanError()) {
      <p class="text-[11px] text-[#ef4444] mt-2">{{ scanError() }}</p>
    }
    @if (!suggested().includes(c.platform) && suggested().length) {
      <p class="text-[10px] text-[#606060] mt-2">* IGDB no lo da para esa plataforma: revisa que sea la correcta.</p>
    }
  `,
  styles: [`
    .field-label { @apply block text-xs font-medium text-[#606060] mb-1.5; }
    .field-input {
      @apply w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-sm text-white
             placeholder:text-[#303030] focus:outline-none focus:border-[#7c3aed] transition-colors duration-200;
    }
    select.field-input option { background: #161616; }
  `],
})
export class GameCopyEditorComponent {
  copy = input.required<GameCopyDraft>();
  /** Plataformas en las que IGDB dice que salió: las demás se marcan con *. */
  suggested = input<string[]>([]);
  readonly platforms = GAME_PLATFORMS;
  scanning = signal(false);
  scanError = signal<string | null>(null);
}
