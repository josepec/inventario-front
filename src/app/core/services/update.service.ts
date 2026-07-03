import { Injectable, inject, ApplicationRef } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { concat, interval } from 'rxjs';
import { filter, first } from 'rxjs/operators';

// Cuando hay un deploy nuevo, el Service Worker de Angular descarga la versión
// pero sigue sirviendo la vieja hasta que se cierran todas las pestañas. Esto
// hacía que los cambios (p. ej. el botón "Actualizar") no se vieran sin borrar
// caché a mano. Este servicio activa la versión nueva y recarga automáticamente.
@Injectable({ providedIn: 'root' })
export class UpdateService {
  private swUpdate = inject(SwUpdate);
  private appRef = inject(ApplicationRef);

  init(): void {
    if (!this.swUpdate.isEnabled) return;

    // Cuando una versión nueva está lista, activarla y recargar la página.
    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => {
        this.swUpdate.activateUpdate().then(() => document.location.reload());
      });

    // Comprobar si hay versión nueva: al arrancar (cuando la app se estabiliza)
    // y luego cada 30 min mientras la pestaña siga abierta.
    const appStable$ = this.appRef.isStable.pipe(first((stable) => stable));
    const everyHalfHour$ = interval(30 * 60 * 1000);
    concat(appStable$, everyHalfHour$).subscribe(() => {
      this.swUpdate.checkForUpdate().catch(() => { /* sin conexión, reintenta luego */ });
    });
  }
}
