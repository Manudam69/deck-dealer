import { Component, computed, inject } from '@angular/core';
import { GameService } from '../../../../core/services/game.service';
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
}
