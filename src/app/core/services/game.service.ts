import { Service, computed, effect, inject, PLATFORM_ID, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { getDeckById } from '../data/deck-registry';
import type { Card, Deck } from '../models/card.model';
import { shuffle } from '../utils/shuffle';
import { SettingsService } from './settings.service';
import { SpeechService } from './speech.service';

export type GameStatus = 'idle' | 'running' | 'paused' | 'finished';

@Service()
export class GameService {
  private readonly settingsService = inject(SettingsService);
  private readonly speechService = inject(SpeechService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly deck = signal<Deck | undefined>(undefined);
  readonly queue = signal<Card[]>([]);
  readonly history = signal<Card[]>([]);
  readonly isRunning = signal(false);

  readonly status = computed<GameStatus>(() => {
    if (this.isFinished()) return 'finished';
    if (this.isRunning()) return 'running';
    if (this.history().length === 0) return 'idle';
    return 'paused';
  });

  readonly currentCard = computed<Card | undefined>(() => {
    const drawn = this.history();
    return drawn[drawn.length - 1];
  });

  readonly isFinished = computed(() => {
    const currentDeck = this.deck();
    return !!currentDeck && this.history().length >= currentDeck.cards.length;
  });

  readonly drawnCount = computed(() => this.history().length);
  readonly totalCount = computed(() => this.deck()?.cards.length ?? 0);
  readonly remainingCount = computed(() =>
    Math.max(0, this.totalCount() - this.drawnCount())
  );

  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Initialize the active deck synchronously so the UI shows the right
    // total card count from the very first render (including SSR).
    this.resetToDeck(this.settingsService.settings().deckId);

    // Reset the game whenever the selected deck changes.
    effect(() => {
      const deckId = this.settingsService.settings().deckId;
      untracked(() => {
        if (this.deck()?.id !== deckId) {
          this.resetToDeck(deckId);
        }
      });
    });
  }

  reshuffle(): void {
    this.pause();
    this.history.set([]);
    const currentDeck = this.deck();
    const targetId = currentDeck?.id ?? this.settingsService.settings().deckId;
    const selected = getDeckById(targetId) ?? getDeckById('loteria-mexicana');
    if (!selected) return;
    this.deck.set(selected);
    this.queue.set(shuffle(selected.cards));
  }

  startAuto(): void {
    if (this.isFinished()) return;
    this.isRunning.set(true);
    this.drawNext();
  }

  pause(): void {
    this.isRunning.set(false);
    this.clearTimer();
  }

  drawNext(): void {
    if (this.isFinished()) return;

    const pending = this.queue();
    if (pending.length === 0) {
      this.pause();
      return;
    }

    const [next, ...rest] = pending;
    if (!next) return;

    this.history.update((drawn) => [...drawn, next]);
    this.queue.set(rest);

    if (this.settingsService.settings().voiceEnabled) {
      this.speechService.announce(next.name);
    }

    if (this.isFinished()) {
      this.pause();
      if (this.settingsService.settings().voiceEnabled) {
        this.speechService.announceQueue([next.name, 'Se acabó la baraja']);
      }
      return;
    }

    if (this.isRunning()) {
      this.scheduleNext();
    }
  }

  private resetToDeck(deckId: string): void {
    this.pause();
    this.history.set([]);
    const selected = getDeckById(deckId) ?? getDeckById('loteria-mexicana');
    if (!selected) return;
    this.deck.set(selected);
    this.queue.set(shuffle(selected.cards));
  }

  private scheduleNext(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.clearTimer();
    const speed = this.settingsService.settings().speedMs;
    this.timerId = setTimeout(() => {
      this.drawNextWhenReady();
    }, speed);
  }

  private drawNextWhenReady(): void {
    const voiceEnabled = this.settingsService.settings().voiceEnabled;
    if (voiceEnabled && this.speechService.isSpeaking()) {
      this.clearTimer();
      this.timerId = setTimeout(() => {
        this.drawNextWhenReady();
      }, 250);
      return;
    }

    this.drawNext();
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
