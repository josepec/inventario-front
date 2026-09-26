import { AfterViewInit, Component, ElementRef, ViewChild, computed, input, output, signal } from '@angular/core';

interface Pt { x: number; y: number; }

/** Lado mayor de la foto con la que se trabaja: más no aporta y ralentiza el enderezado. */
const MAX_SOURCE = 2400;
/** Lado mayor de la portada resultante (las de Amazon rondan los 1500 px). */
const MAX_OUTPUT = 1500;
/** Margen inicial de las esquinas respecto al borde de la foto. */
const INSET = 0.08;
const LOUPE_PX = 120;
const LOUPE_ZOOM = 3;

/**
 * Recorte con corrección de perspectiva para fotos de portadas: se arrastran
 * las 4 esquinas hasta las del libro y se endereza a un rectángulo. Una foto
 * con el móvil casi nunca está de frente, así que un recorte rectangular no
 * bastaría.
 *
 * Todo ocurre en el navegador con un canvas; emite un JPEG listo para subir.
 */
@Component({
  selector: 'app-cover-cropper',
  standalone: true,
  template: `
    <div class="fixed inset-0 z-[70] bg-[#0a0a0a] flex flex-col">
      <div class="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
        <h2 class="text-sm font-bold text-white">Ajusta las esquinas a la portada</h2>
        <button type="button" (click)="cancel.emit()" class="text-[#606060] hover:text-white transition-colors p-1">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 min-h-0 flex items-center justify-center p-4">
        @if (!ready()) {
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        }
        <div #stage class="relative touch-none select-none" [class.hidden]="!ready()">
          <canvas #source class="block max-w-full max-h-[calc(100vh-11rem)]"></canvas>

          <!-- Zona fuera del recorte oscurecida y contorno -->
          <svg class="absolute inset-0 w-full h-full pointer-events-none"
            [attr.viewBox]="'0 0 ' + imgW() + ' ' + imgH()" preserveAspectRatio="none">
            <path [attr.d]="shadePath()" fill="rgba(0,0,0,0.55)" fill-rule="evenodd" />
            <polygon [attr.points]="polygon()" fill="none" stroke="#7c3aed" stroke-width="2"
              vector-effect="non-scaling-stroke" />
          </svg>

          @for (c of corners(); track $index) {
            <div class="absolute w-11 h-11 -ml-[22px] -mt-[22px] flex items-center justify-center cursor-grab touch-none"
              [style.left.%]="c.x / imgW() * 100" [style.top.%]="c.y / imgH() * 100"
              (pointerdown)="startDrag($index, $event)" (pointermove)="drag($event)"
              (pointerup)="endDrag($event)" (pointercancel)="endDrag($event)">
              <div class="w-5 h-5 rounded-full border-2 border-white bg-[#7c3aed] shadow-lg"
                [class.scale-125]="dragging() === $index"></div>
            </div>
          }

          <!-- Lupa: en la esquina contraria al dedo para que no la tape -->
          <canvas #loupe [width]="LOUPE_PX" [height]="LOUPE_PX"
            class="absolute top-2 rounded-full border-2 border-white shadow-xl pointer-events-none"
            [class.hidden]="dragging() === null"
            [class.left-2]="loupeLeft()" [class.right-2]="!loupeLeft()"
            [style.width.px]="LOUPE_PX" [style.height.px]="LOUPE_PX"></canvas>
        </div>
      </div>

      <div class="px-4 py-3 border-t border-[#1e1e1e] flex flex-wrap items-center gap-2">
        <button type="button" (click)="rotate()" [disabled]="busy()" class="tool-btn">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Girar
        </button>
        <button type="button" (click)="resetCorners()" [disabled]="busy()" class="tool-btn">Reiniciar</button>
        <button type="button" (click)="apply(true)" [disabled]="busy()" class="tool-btn">Usar sin recortar</button>
        <button type="button" (click)="apply(false)" [disabled]="busy() || !ready()"
          class="ml-auto px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9]
                 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {{ busy() ? 'Procesando...' : 'Recortar' }}
        </button>
      </div>
      @if (error()) { <p class="px-4 pb-3 text-xs text-[#ef4444]">{{ error() }}</p> }
    </div>
  `,
  styles: [`
    .tool-btn {
      @apply flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-[#a0a0a0] hover:text-white
             bg-[#161616] border border-[#2a2a2a] hover:bg-[#1f1f1f] disabled:opacity-40 transition-colors;
    }
  `],
})
export class CoverCropperComponent implements AfterViewInit {
  @ViewChild('source') private sourceRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('stage') private stageRef!: ElementRef<HTMLDivElement>;
  @ViewChild('loupe') private loupeRef!: ElementRef<HTMLCanvasElement>;

  readonly LOUPE_PX = LOUPE_PX;

  file = input.required<File>();
  done = output<File>();
  cancel = output<void>();

  ready = signal(false);
  busy = signal(false);
  error = signal('');
  imgW = signal(1);
  imgH = signal(1);
  /** Esquinas en píxeles de la imagen: sup-izq, sup-der, inf-der, inf-izq. */
  corners = signal<Pt[]>([]);
  dragging = signal<number | null>(null);
  loupeLeft = signal(true);

  polygon = computed(() => this.corners().map(c => `${c.x},${c.y}`).join(' '));
  shadePath = computed(() => {
    const [a, b, c, d] = this.corners();
    if (!d) return '';
    return `M0 0H${this.imgW()}V${this.imgH()}H0Z M${a.x} ${a.y}L${b.x} ${b.y}L${c.x} ${c.y}L${d.x} ${d.y}Z`;
  });

  async ngAfterViewInit() {
    try {
      // createImageBitmap aplica la orientación EXIF: sin ella, las fotos del
      // móvil en vertical aparecerían tumbadas
      const bmp = await createImageBitmap(this.file(), { imageOrientation: 'from-image' });
      const scale = Math.min(1, MAX_SOURCE / Math.max(bmp.width, bmp.height));
      const canvas = this.sourceRef.nativeElement;
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      bmp.close();
      this.imgW.set(canvas.width);
      this.imgH.set(canvas.height);
      this.resetCorners();
      this.ready.set(true);
    } catch {
      this.error.set('No se pudo abrir la imagen');
    }
  }

  resetCorners() {
    const w = this.imgW(), h = this.imgH();
    const dx = w * INSET, dy = h * INSET;
    this.corners.set([
      { x: dx, y: dy }, { x: w - dx, y: dy }, { x: w - dx, y: h - dy }, { x: dx, y: h - dy },
    ]);
  }

  rotate() {
    const src = this.sourceRef.nativeElement;
    const copy = document.createElement('canvas');
    copy.width = src.width; copy.height = src.height;
    copy.getContext('2d')!.drawImage(src, 0, 0);

    src.width = copy.height; src.height = copy.width;
    const ctx = src.getContext('2d')!;
    ctx.translate(src.width, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(copy, 0, 0);
    this.imgW.set(src.width);
    this.imgH.set(src.height);
    this.resetCorners();
  }

  // ── Arrastre de esquinas ─────────────────────────────────────────────────

  startDrag(i: number, e: PointerEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.dragging.set(i);
    this.drag(e);
  }

  drag(e: PointerEvent) {
    const i = this.dragging();
    if (i === null) return;
    const rect = this.stageRef.nativeElement.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1) * this.imgW();
    const y = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1) * this.imgH();
    this.corners.update(cs => cs.map((c, j) => j === i ? { x, y } : c));
    this.loupeLeft.set(x > this.imgW() / 2);
    this.drawLoupe({ x, y }, rect.width);
  }

  endDrag(e: PointerEvent) {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    this.dragging.set(null);
  }

  private drawLoupe(p: Pt, displayWidth: number) {
    const ctx = this.loupeRef.nativeElement.getContext('2d')!;
    // Trozo de imagen que equivale a LOUPE_PX / LOUPE_ZOOM píxeles de pantalla
    const side = (LOUPE_PX / LOUPE_ZOOM) * (this.imgW() / displayWidth);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LOUPE_PX, LOUPE_PX);
    ctx.drawImage(this.sourceRef.nativeElement, p.x - side / 2, p.y - side / 2, side, side, 0, 0, LOUPE_PX, LOUPE_PX);
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(LOUPE_PX / 2, 0); ctx.lineTo(LOUPE_PX / 2, LOUPE_PX);
    ctx.moveTo(0, LOUPE_PX / 2); ctx.lineTo(LOUPE_PX, LOUPE_PX / 2);
    ctx.stroke();
  }

  // ── Enderezado ───────────────────────────────────────────────────────────

  apply(whole: boolean) {
    this.busy.set(true);
    this.error.set('');
    // Deja pintar el "Procesando..." antes del cálculo, que bloquea el hilo
    setTimeout(() => {
      try {
        const w = this.imgW(), h = this.imgH();
        const quad = whole
          ? [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }]
          : this.corners();
        const out = warp(this.sourceRef.nativeElement, quad);
        out.toBlob(blob => {
          this.busy.set(false);
          if (!blob) { this.error.set('No se pudo generar la imagen'); return; }
          const name = this.file().name.replace(/\.[^.]+$/, '') + '.jpg';
          this.done.emit(new File([blob], name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
      } catch {
        this.busy.set(false);
        this.error.set('No se pudo recortar la imagen');
      }
    }, 20);
  }
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Proyecta el cuadrilátero `q` (sup-izq, sup-der, inf-der, inf-izq) de la
 * imagen a un rectángulo. El tamaño sale de la media de lados opuestos.
 * Para cada píxel de destino se calcula su punto en el origen con la
 * transformación cuadrado→cuadrilátero de Heckbert y se interpola bilinealmente.
 */
function warp(src: HTMLCanvasElement, q: Pt[]): HTMLCanvasElement {
  let outW = (dist(q[0], q[1]) + dist(q[3], q[2])) / 2;
  let outH = (dist(q[0], q[3]) + dist(q[1], q[2])) / 2;
  const scale = Math.min(1, MAX_OUTPUT / Math.max(outW, outH));
  outW = Math.max(1, Math.round(outW * scale));
  outH = Math.max(1, Math.round(outH * scale));

  const sw = src.width, sh = src.height;
  const s = src.getContext('2d')!.getImageData(0, 0, sw, sh).data;
  const dst = document.createElement('canvas');
  dst.width = outW; dst.height = outH;
  const dctx = dst.getContext('2d')!;
  const outImg = dctx.createImageData(outW, outH);
  const d = outImg.data;

  const [p0, p1, p2, p3] = q;
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y, dy3 = p0.y - p1.y + p2.y - p3.y;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = den ? (dx3 * dy2 - dx2 * dy3) / den : 0;
  const hh = den ? (dx1 * dy3 - dx3 * dy1) / den : 0;
  const a = p1.x - p0.x + g * p1.x, b = p3.x - p0.x + hh * p3.x, c = p0.x;
  const e = p1.y - p0.y + g * p1.y, f = p3.y - p0.y + hh * p3.y, k = p0.y;

  for (let y = 0; y < outH; y++) {
    const v = (y + 0.5) / outH;
    for (let x = 0; x < outW; x++) {
      const u = (x + 0.5) / outW;
      const w = g * u + hh * v + 1;
      let sx = (a * u + b * v + c) / w - 0.5;
      let sy = (e * u + f * v + k) / w - 0.5;
      sx = Math.min(Math.max(sx, 0), sw - 1.001);
      sy = Math.min(Math.max(sy, 0), sh - 1.001);
      const x0 = sx | 0, y0 = sy | 0;
      const fx = sx - x0, fy = sy - y0;
      const i00 = (y0 * sw + x0) * 4, i10 = i00 + 4, i01 = i00 + sw * 4, i11 = i01 + 4;
      const o = (y * outW + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        const top = s[i00 + ch] + (s[i10 + ch] - s[i00 + ch]) * fx;
        const bot = s[i01 + ch] + (s[i11 + ch] - s[i01 + ch]) * fx;
        d[o + ch] = top + (bot - top) * fy;
      }
      d[o + 3] = 255;
    }
  }
  dctx.putImageData(outImg, 0, 0);
  return dst;
}
