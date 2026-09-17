import { afterRenderEffect, Component, ElementRef, input, viewChild } from '@angular/core';
import type { Card } from '../../../../core/models/card.model';
import { PlayingCardComponent } from '../playing-card/playing-card.component';

@Component({
  selector: 'app-card-history',
  imports: [PlayingCardComponent],
  templateUrl: './card-history.component.html',
  host: {
    class: 'block w-full',
  },
})
export class CardHistoryComponent {
  readonly cards = input.required<Card[]>();
  readonly container = viewChild.required<ElementRef>('container');

  constructor() {
    afterRenderEffect(() => {
      const drawn = this.cards();
      if (drawn.length === 0) return;

      const el = this.container().nativeElement as HTMLElement;
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    });
  }
}
