import { Component, computed, inject } from '@angular/core';
import { GameService, type GameStatus } from '../../../../core/services/game.service';
import { PlayingCardComponent } from '../playing-card/playing-card.component';

@Component({
  selector: 'app-current-card',
  imports: [PlayingCardComponent],
  templateUrl: './current-card.component.html',
  host: {
    class: 'flex flex-col items-center justify-center grow min-h-0 w-full p-4',
  },
})
export class CurrentCardComponent {
  protected readonly game = inject(GameService);
  readonly currentCard = computed(() => this.game.currentCard());

  readonly toggleLabel = computed(() => {
    switch (this.game.status()) {
      case 'running':
        return 'Pausar';
      case 'countdown':
        return 'Preparados…';
      case 'paused':
        return 'Continuar';
      case 'finished':
        return 'Juego terminado';
      default:
        return 'Iniciar';
    }
  });

  toggle(): void {
    if (this.game.status() === 'running') {
      this.game.pause();
      return;
    }

    if (this.game.status() === 'finished') {
      return;
    }

    this.game.startAuto();
  }
}
