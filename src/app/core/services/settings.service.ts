import { Service, effect, inject, PLATFORM_ID, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  DEFAULT_SETTINGS,
  GameSettings,
  MAX_SPEED_MS,
  MIN_SPEED_MS,
  SPEED_STEP_MS,
} from '../models/settings.model';

const STORAGE_KEY = 'loteria-settings-v1';

@Service()
export class SettingsService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly settings = signal<GameSettings>({ ...DEFAULT_SETTINGS });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.load();
      effect(() => {
        const value = this.settings();
        untracked(() => this.save(value));
      });
    }
  }

  update(partial: Partial<GameSettings>): void {
    this.settings.update((current) => ({
      ...current,
      ...partial,
      speedMs: this.clampSpeed(partial.speedMs ?? current.speedMs),
    }));
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<GameSettings>;
      this.settings.update((current) => ({
        ...current,
        deckId: parsed.deckId ?? current.deckId,
        speedMs: this.clampSpeed(parsed.speedMs ?? current.speedMs),
        voiceEnabled:
          typeof parsed.voiceEnabled === 'boolean'
            ? parsed.voiceEnabled
            : current.voiceEnabled,
      }));
    } catch {
      // Ignore corrupted storage
    }
  }

  private save(value: GameSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Ignore private mode / storage errors
    }
  }

  private clampSpeed(value: number): number {
    const rounded = Math.round(value / SPEED_STEP_MS) * SPEED_STEP_MS;
    return Math.max(MIN_SPEED_MS, Math.min(MAX_SPEED_MS, rounded));
  }
}
