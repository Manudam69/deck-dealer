import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { vi } from 'vitest';
import { GameService } from './game.service';
import { SettingsService } from './settings.service';
import { SpeechService } from './speech.service';
import { WakeLockService } from './wake-lock.service';

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
        {
          provide: WakeLockService,
          useValue: {
            request: vi.fn().mockResolvedValue(undefined),
            release: vi.fn().mockResolvedValue(undefined),
          },
        },
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

  it('starts with a countdown from idle before drawing', () => {
    vi.useFakeTimers();
    const game = configureGame();

    game.startAuto();

    expect(game.status()).toBe('countdown');
    expect(game.countdown()).toBe(3);
    expect(game.drawnCount()).toBe(0);

    vi.advanceTimersByTime(1000);
    expect(game.countdown()).toBe(2);

    vi.advanceTimersByTime(1000);
    expect(game.countdown()).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(game.countdown()).toBe(0);

    vi.advanceTimersByTime(900);
    expect(game.countdown()).toBeNull();
    expect(game.status()).toBe('running');
    expect(game.drawnCount()).toBe(1);

    vi.useRealTimers();
  });

  it('resumes from paused without a countdown', () => {
    vi.useFakeTimers();
    const game = configureGame();

    game.drawNext();
    expect(game.status()).toBe('paused');

    game.startAuto();
    expect(game.countdown()).toBeNull();
    expect(game.status()).toBe('running');
    expect(game.drawnCount()).toBe(2);

    vi.useRealTimers();
  });

  it('keeps the screen awake while automatic drawing is active', () => {
    const game = configureGame();
    const wakeLockService = TestBed.inject(WakeLockService);
    vi.mocked(wakeLockService.request).mockClear();
    vi.mocked(wakeLockService.release).mockClear();

    game.startAuto();
    expect(wakeLockService.request).toHaveBeenCalledOnce();

    game.pause();
    expect(wakeLockService.release).toHaveBeenCalledOnce();
  });

  it('cancels countdown when paused', () => {
    vi.useFakeTimers();
    const game = configureGame();

    game.startAuto();
    expect(game.status()).toBe('countdown');

    game.pause();
    expect(game.countdown()).toBeNull();
    expect(game.status()).toBe('idle');

    vi.advanceTimersByTime(5000);
    expect(game.drawnCount()).toBe(0);

    vi.useRealTimers();
  });

  it('announces each countdown step when voice is enabled', () => {
    vi.useFakeTimers();
    const game = configureGame();
    const speechService = TestBed.inject(SpeechService);
    const announceSpy = vi.spyOn(speechService, 'announce');

    game.startAuto();
    expect(announceSpy).toHaveBeenLastCalledWith('Tres');

    vi.advanceTimersByTime(1000);
    expect(announceSpy).toHaveBeenLastCalledWith('Dos');

    vi.advanceTimersByTime(1000);
    expect(announceSpy).toHaveBeenLastCalledWith('Uno');

    vi.advanceTimersByTime(1000);
    expect(announceSpy).toHaveBeenLastCalledWith('¡Ya!');

    vi.useRealTimers();
  });
});
