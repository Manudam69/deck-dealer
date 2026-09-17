import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { DECKS } from '../../../../core/data/deck-registry';
import { MAX_SPEED_MS, MIN_SPEED_MS, SPEED_STEP_MS } from '../../../../core/models/settings.model';
import { SettingsService } from '../../../../core/services/settings.service';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';

@Component({
  selector: 'app-settings-sheet',
  imports: [IconButtonComponent],
  templateUrl: './settings-sheet.component.html',
  host: {
    class: 'contents',
  },
})
export class SettingsSheetComponent {
  protected readonly settings = inject(SettingsService);
  private readonly document = inject(DOCUMENT);
  readonly isOpen = input.required<boolean>();
  readonly close = output<void>();

  readonly decks = computed(() => [...DECKS]);
  readonly speedSeconds = computed(() => this.settings.settings().speedMs / 1000);

  readonly minSpeedMs = MIN_SPEED_MS;
  readonly maxSpeedMs = MAX_SPEED_MS;
  readonly stepMs = SPEED_STEP_MS;

  private readonly sheet = viewChild<ElementRef>('sheet');
  private readonly focusedBeforeOpen = signal<Element | null>(null);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.focusedBeforeOpen.set(this.document.activeElement);
        this.sheet()?.nativeElement.focus();
      } else {
        const previous = this.focusedBeforeOpen();
        if (previous instanceof HTMLElement) {
          previous.focus();
        }
      }
    });
  }

  selectDeck(deckId: string): void {
    this.settings.update({ deckId });
  }

  updateSpeed(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.settings.update({ speedMs: value });
  }

  toggleVoice(): void {
    this.settings.update({ voiceEnabled: !this.settings.settings().voiceEnabled });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    }
  }
}
