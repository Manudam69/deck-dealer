import type { Deck } from '../models/card.model';
import { LOTERIA_MEXICANA } from './loteria-mexicana';

export const DECKS: readonly Deck[] = [LOTERIA_MEXICANA];

export function getDeckById(id: string): Deck | undefined {
  return DECKS.find((deck) => deck.id === id);
}
