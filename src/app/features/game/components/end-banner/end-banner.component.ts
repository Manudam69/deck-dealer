import { Component, inject } from '@angular/core';
import { GameService } from '../../../../core/services/game.service';

@Component({
  selector: 'app-end-banner',
  templateUrl: './end-banner.component.html',
  host: {
    class: 'contents',
  },
})
export class EndBannerComponent {
  protected readonly game = inject(GameService);

  reshuffle(): void {
    this.game.reshuffle();
  }
}
