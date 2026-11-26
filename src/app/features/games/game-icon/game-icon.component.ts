import { Component, input } from '@angular/core';

export type GameIconName = 'physical' | 'digital' | 'platinum';

const TITLE: Record<GameIconName, string> = { physical: 'Físico', digital: 'Digital', platinum: 'Platino conseguido' };

/**
 * Iconos de videojuegos: disco (físico), nube con descarga (digital) y trofeo
 * (platino). Toman el color del texto (currentColor) y el tamaño de la clase.
 */
@Component({
  selector: 'app-game-icon',
  standalone: true,
  host: { '[attr.title]': 'title()', class: 'inline-flex' },
  template: `
    @switch (name()) {
      @case ('physical') {
        <svg [class]="size()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="2.5" />
          <path stroke-linecap="round" d="M7.5 9.2a5.3 5.3 0 012.2-2.1" />
        </svg>
      }
      @case ('digital') {
        <svg [class]="size()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
        </svg>
      }
      @case ('platinum') {
        <svg [class]="size()" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 3h12v2h3v3a4 4 0 01-4 4h-.3A6 6 0 0113 15.9V18h3v3H8v-3h3v-2.1A6 6 0 017.3 12H7a4 4 0 01-4-4V5h3V3zm0 4H5v1a2 2 0 001.3 1.9A6 6 0 016 9V7zm12 0v2a6 6 0 01-.3 1.9A2 2 0 0019 8V7h-1z" />
        </svg>
      }
    }
  `,
})
export class GameIconComponent {
  name = input.required<GameIconName>();
  /** Clases de tamaño del svg. */
  size = input('w-3 h-3');
  title = () => TITLE[this.name()];
}
