import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateService } from './core/services/update.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class App {
  constructor() {
    inject(UpdateService).init();
  }
}
