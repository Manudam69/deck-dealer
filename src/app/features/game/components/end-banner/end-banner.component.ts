import { Component, effect, inject, signal } from '@angular/core';
import { GameService } from '../../../../core/services/game.service';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';

@Component({
  selector: 'app-end-banner',
  imports: [IconButtonComponent],
  templateUrl: './end-banner.component.html',
  host: {
    class: 'contents',
  },
})
export class EndBannerComponent {
  protected readonly game = inject(GameService);
  readonly dismissed = signal(false);

  constructor() {
    effect(() => {
      if (!this.game.isFinished()) {
        this.dismissed.set(false);
      }
    });
  }

  readonly showBanner = () => this.game.isFinished() && !this.dismissed();

  reshuffle(): void {
    this.game.reshuffle();
  }

  hide(): void {
    this.dismissed.set(true);
  }
}
