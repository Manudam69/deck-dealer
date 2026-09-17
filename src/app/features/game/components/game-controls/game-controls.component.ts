import { Component, inject, output } from '@angular/core';
import { GameService } from '../../../../core/services/game.service';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';

@Component({
  selector: 'app-game-controls',
  imports: [IconButtonComponent],
  templateUrl: './game-controls.component.html',
  host: {
    class: 'block w-full',
  },
})
export class GameControlsComponent {
  protected readonly game = inject(GameService);
  readonly openSettings = output<void>();

  readonly primaryLabel = () => {
    switch (this.game.status()) {
      case 'running':
        return 'Pausar';
      case 'countdown':
        return 'Preparados…';
      case 'paused':
      case 'finished':
        return 'Continuar';
      default:
        return 'Iniciar';
    }
  };

  toggleAuto(): void {
    if (this.game.status() === 'running') {
      this.game.pause();
    } else {
      this.game.startAuto();
    }
  }

  drawNext(): void {
    this.game.pause();
    this.game.drawNext();
  }

  reshuffle(): void {
    this.game.reshuffle();
  }
}
