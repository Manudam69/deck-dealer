import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { vi } from 'vitest';
import { GameService } from './game.service';
import { SettingsService } from './settings.service';
import { SpeechService } from './speech.service';

@Component({
  selector: 'app-game-test',
  template: '',
  standalone: true,
})
class GameTestComponent {
  readonly game = inject(GameService);
}

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe('GameService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function configureGame() {
    TestBed.configureTestingModule({
      imports: [GameTestComponent],
      providers: [
        SettingsService,
        SpeechService,
        GameService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const fixture = TestBed.createComponent(GameTestComponent);
    fixture.detectChanges();
    return fixture.componentInstance.game;
  }

  it('loads the selected deck on start', () => {
    const game = configureGame();
    expect(game.deck()).toBeTruthy();
    expect(game.totalCount()).toBe(54);
    expect(game.history()).toHaveLength(0);
  });

  it('draws the next card and adds it to history', () => {
    const game = configureGame();
    game.drawNext();

    expect(game.drawnCount()).toBe(1);
    expect(game.currentCard()).toBeTruthy();
    expect(game.history()).toHaveLength(1);
  });

  it('reshuffle resets history and deck', () => {
    const game = configureGame();
    game.drawNext();
    game.drawNext();
    expect(game.drawnCount()).toBe(2);

    game.reshuffle();
    expect(game.drawnCount()).toBe(0);
    expect(game.history()).toHaveLength(0);
    expect(game.queue()).toHaveLength(54);
  });

  it('finishes after all cards are drawn', () => {
    const game = configureGame();
    const total = game.totalCount();

    for (let i = 0; i < total; i++) {
      game.drawNext();
    }

    expect(game.isFinished()).toBe(true);
    expect(game.status()).toBe('finished');
  });

  it('announces the last card and the end-of-deck message as a queue', () => {
    const game = configureGame();
    const speechService = TestBed.inject(SpeechService);
    const announceQueueSpy = vi.spyOn(speechService, 'announceQueue');
    const total = game.totalCount();

    for (let i = 0; i < total; i++) {
      game.drawNext();
    }

    const lastCard = game.currentCard()?.name;
    expect(lastCard).toBeTruthy();
    expect(announceQueueSpy).toHaveBeenCalledWith([lastCard, 'Se acabó la baraja']);
  });

  it('does not draw beyond the deck size', () => {
    const game = configureGame();
    const total = game.totalCount();

    for (let i = 0; i < total + 5; i++) {
      game.drawNext();
    }

    expect(game.drawnCount()).toBe(total);
  });
});
