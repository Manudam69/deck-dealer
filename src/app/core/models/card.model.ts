export interface Card {
  id: string;
  number: number;
  name: string;
  image: string;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  cards: readonly Card[];
}
