import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject, input, output, signal } from '@angular/core';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BrowserMultiFormatReader } from '@zxing/browser';

/**
 * Visor de cámara que lee un código de barras EAN/UPC y lo emite una vez.
 * Arranca al pintarse y apaga la cámara al leer o al destruirse: quien lo use
 * lo muestra con un @if y lo quita en (scanned) o (failed).
 *
 * Misma técnica que el escáner de libros: BarcodeDetector nativo (Chrome y
 * Android, mucho más fino) y ZXing de reserva; solo formatos EAN/UPC, alta
 * resolución y enfoque continuo, que sin eso los códigos finos no se leen.
 */
@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  template: `
    <div class="relative border border-[#2a2a2a] rounded-xl bg-black overflow-hidden" [style.height.px]="height()">
      <video #video class="w-full h-full object-cover" autoplay muted playsinline></video>
      <div class="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-[#7c3aed] opacity-70
                  animate-pulse rounded-full shadow-[0_0_8px_#7c3aed]"></div>
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="w-56 h-24 border-2 border-[#7c3aed] rounded-lg opacity-50"></div>
      </div>
      <p class="absolute bottom-2 inset-x-0 text-center text-xs text-[#606060]">{{ hint() }}</p>
    </div>
  `,
})
export class BarcodeScannerComponent implements AfterViewInit, OnDestroy {
  private zone = inject(NgZone);

  height = input(200);
  /** Código leído, solo dígitos. */
  scanned = output<string>();
  /** Mensaje para el usuario si no se pudo abrir la cámara. */
  failed = output<string>();

  hint = signal('Apunta el código de barras al centro');

  @ViewChild('video') private videoRef!: ElementRef<HTMLVideoElement>;
  private stream: MediaStream | null = null;
  private controls: { stop(): void } | null = null;
  private raf = 0;
  private done = false;

  private static readonly CONSTRAINTS: MediaStreamConstraints = {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      // @ts-expect-error focusMode aún no está en los tipos de TS
      focusMode: 'continuous',
    },
    audio: false,
  };

  ngAfterViewInit() {
    void this.start();
  }

  ngOnDestroy() {
    this.stop();
  }

  private async start() {
    const video = this.videoRef.nativeElement;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
      const Detector = (window as any).BarcodeDetector;
      if (Detector && (await Detector.getSupportedFormats?.())?.includes('ean_13')) {
        await this.withNativeDetector(video, new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] }));
      } else {
        await this.withZxing(video);
      }
    } catch (err: any) {
      this.stop();
      this.zone.run(() => this.failed.emit(
        err?.name === 'NotAllowedError' ? 'No has dado permiso de cámara'
          : err?.message === 'unsupported' ? 'Este navegador no deja usar la cámara (hace falta HTTPS)'
          : 'No se ha podido abrir la cámara'));
    }
  }

  private async withNativeDetector(video: HTMLVideoElement, detector: any) {
    this.stream = await navigator.mediaDevices.getUserMedia(BarcodeScannerComponent.CONSTRAINTS);
    if (this.done) { this.stop(); return; }
    video.srcObject = this.stream;
    await video.play();

    const tick = async () => {
      if (this.done) return;
      try {
        const codes = await detector.detect(video);
        if (codes?.length) { this.emit(codes[0].rawValue); return; }
      } catch {
        // Un fotograma ilegible (vídeo aún sin dimensiones) no es un error.
      }
      this.raf = requestAnimationFrame(() => { void tick(); });
    };
    this.raf = requestAnimationFrame(() => { void tick(); });
  }

  private async withZxing(video: HTMLVideoElement) {
    const hints = new Map<DecodeHintType, unknown>([
      [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]],
      [DecodeHintType.TRY_HARDER, true],
    ]);
    const reader = new BrowserMultiFormatReader(hints);
    this.stream = await navigator.mediaDevices.getUserMedia(BarcodeScannerComponent.CONSTRAINTS);
    if (this.done) { this.stop(); return; }
    this.controls = await reader.decodeFromStream(this.stream, video, (result) => {
      if (result) this.emit(result.getText());
    });
  }

  private emit(raw: string) {
    const code = raw.replace(/\D/g, '');
    if (!code || this.done) return;
    navigator.vibrate?.(60);
    this.stop();
    this.zone.run(() => this.scanned.emit(code));
  }

  private stop() {
    this.done = true;
    if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; }
    this.controls?.stop();
    this.controls = null;
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }
}
