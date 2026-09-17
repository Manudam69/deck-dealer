import { Component, computed, inject } from '@angular/core';
import { GameService } from '../../../../core/services/game.service';

@Component({
  selector: 'app-countdown-overlay',
  template: `
    @if (countdown(); as step) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-[2px]"
        role="status"
        aria-live="assertive"
        aria-atomic="true"
      >
        @switch (step) {
          @case (3) {
            <span
              class="font-heading text-[clamp(7rem,40vw,16rem)] font-bold leading-none text-white drop-shadow-lg animate-countdown-pop"
              >3</span
            >
          }
          @case (2) {
            <span
              class="font-heading text-[clamp(7rem,40vw,16rem)] font-bold leading-none text-white drop-shadow-lg animate-countdown-pop"
              >2</span
            >
          }
          @case (1) {
            <span
              class="font-heading text-[clamp(7rem,40vw,16rem)] font-bold leading-none text-white drop-shadow-lg animate-countdown-pop"
              >1</span
            >
          }
          @default {
            <span
              class="font-heading text-[clamp(5rem,30vw,12rem)] font-bold leading-none text-mexican-pink drop-shadow-lg animate-countdown-pop"
              >¡Ya!</span
            >
          }
        }
      </div>
    }
  `,
  host: {
    class: 'contents',
  },
})
export class CountdownOverlayComponent {
  protected readonly game = inject(GameService);
  readonly countdown = computed(() => this.game.countdown());
}
