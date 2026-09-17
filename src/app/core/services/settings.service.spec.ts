import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import {
  DEFAULT_SETTINGS,
  MAX_SPEED_MS,
  MIN_SPEED_MS,
} from '../models/settings.model';
import { SettingsService } from '../services/settings.service';

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

describe('SettingsService', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMemoryStorage();
    vi.stubGlobal('localStorage', storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function configureService() {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    return TestBed.inject(SettingsService);
  }

  it('starts with default settings', () => {
    const service = configureService();
    expect(service.settings()).toEqual(DEFAULT_SETTINGS);
  });

  it('updates settings and clamps speed to the allowed range', () => {
    const service = configureService();
    service.update({ speedMs: 500 });
    expect(service.settings().speedMs).toBe(MIN_SPEED_MS);

    service.update({ speedMs: 50000 });
    expect(service.settings().speedMs).toBe(MAX_SPEED_MS);
  });

  it('loads persisted settings from localStorage', () => {
    storage.setItem(
      'loteria-settings-v1',
      JSON.stringify({
        deckId: 'loteria-mexicana',
        speedMs: 2500,
        voiceEnabled: false,
      })
    );

    const service = configureService();
    expect(service.settings().speedMs).toBe(2500);
    expect(service.settings().voiceEnabled).toBe(false);
  });

  it('persists updates to localStorage', async () => {
    const service = configureService();
    service.update({ voiceEnabled: false });

    await vi.waitFor(() => {
      const raw = storage.getItem('loteria-settings-v1');
      expect(raw).toBeTruthy();
    });

    const raw = storage.getItem('loteria-settings-v1');
    const parsed = JSON.parse(raw!);
    expect(parsed.voiceEnabled).toBe(false);
  });
});
