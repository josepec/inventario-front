import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TrophyList, TROPHY_COLORS } from '../../../shared/models/game.model';

/** Una lista de trofeos de PSN: icono, plataformas, progreso y recuento por tipo. */
@Component({
  selector: 'app-trophy-list-row',
  standalone: true,
  imports: [DatePipe],
  template: `
    @let l = list();
    <div class="flex items-center gap-3 min-w-0">
      <div class="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-lg overflow-hidden bg-[#0d0d0d] border border-[#2a2a2a]">
        @if (l.icon_url) { <img [src]="l.icon_url" alt="" class="w-full h-full object-cover" loading="lazy" /> }
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 min-w-0">
          @if (showTitle()) {
            <p class="text-sm text-white truncate">{{ l.title }}</p>
          }
          <span class="text-[10px] font-semibold text-[#8b5cf6] shrink-0">{{ l.platforms.split(',').join(' · ') }}</span>
          @if (l.earned_platinum > 0) {
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 bg-[#a5b4fc1a] text-[#a5b4fc]"
              [title]="l.platinum_at ? 'Platino el ' + (l.platinum_at | date:'d/M/yyyy') : 'Platino'">
              Platino@if (l.platinum_at) { · {{ l.platinum_at | date:'d MMM yyyy' }} }
            </span>
          }
        </div>
        <div class="flex items-center gap-2 mt-1.5">
          <div class="flex-1 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500"
              [style.width.%]="l.progress"
              [style.background]="l.earned_platinum > 0 ? colors.platinum : '#7c3aed'"></div>
          </div>
          <span class="text-[11px] text-[#a0a0a0] w-9 text-right shrink-0">{{ l.progress }}%</span>
        </div>
        <div class="flex items-center gap-3 mt-1 text-[10px] text-[#606060]">
          @if (l.defined_platinum) {
            <span><span class="dot" [style.background]="colors.platinum"></span>{{ l.earned_platinum }}/{{ l.defined_platinum }}</span>
          }
          <span><span class="dot" [style.background]="colors.gold"></span>{{ l.earned_gold }}/{{ l.defined_gold }}</span>
          <span><span class="dot" [style.background]="colors.silver"></span>{{ l.earned_silver }}/{{ l.defined_silver }}</span>
          <span><span class="dot" [style.background]="colors.bronze"></span>{{ l.earned_bronze }}/{{ l.defined_bronze }}</span>
          @if (l.last_played_at) {
            <span class="ml-auto hidden sm:inline">Último trofeo {{ l.last_played_at | date:'d/M/yyyy' }}</span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`.dot { @apply inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle; }`],
})
export class TrophyListRowComponent {
  list = input.required<TrophyList>();
  showTitle = input(true);
  readonly colors = TROPHY_COLORS;
}
