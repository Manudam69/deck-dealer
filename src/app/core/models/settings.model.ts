export interface GameSettings {
  deckId: string;
  speedMs: number;
  voiceEnabled: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  deckId: 'loteria-mexicana',
  speedMs: 2000,
  voiceEnabled: true,
};

export const MIN_SPEED_MS = 500;
export const MAX_SPEED_MS = 10000;
export const SPEED_STEP_MS = 250;
