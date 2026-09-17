import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import type { Card } from '../../../../core/models/card.model';

@Component({
  selector: 'app-playing-card',
  imports: [NgOptimizedImage],
  templateUrl: './playing-card.component.html',
  host: {
    class: 'block',
  },
})
export class PlayingCardComponent {
  readonly card = input.required<Card>();
  readonly size = input<'sm' | 'lg'>('lg');

  readonly imageError = signal(false);

  readonly imgWidth = computed(() => (this.size() === 'sm' ? 48 : 288));
  readonly imgHeight = computed(() => (this.size() === 'sm' ? 64 : 384));
  readonly imageSrc = computed(() => this.card().image.replace(/^\//, ''));
}
