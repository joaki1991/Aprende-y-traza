export type StickerKind = 'mochi' | 'rainbow' | 'star' | 'flower' | 'cupcake' | 'crown';

export interface RewardSticker {
  id: StickerKind;
  name: string;
  description: string;
  /** Estrellas necesarias para desbloquearla. */
  starsRequired: number;
}

/**
 * Catálogo central de recompensas. Las pegatinas se desbloquean por hitos de
 * estrellas; no hay compras, anuncios ni canjes externos.
 */
export const REWARD_STICKERS: readonly RewardSticker[] = [
  {
    id: 'mochi',
    name: 'Mochi',
    description: 'Tu amiga gatita',
    starsRequired: 0,
  },
  {
    id: 'rainbow',
    name: 'Arcoíris',
    description: 'Un cielo de colores',
    starsRequired: 1,
  },
  {
    id: 'star',
    name: 'Estrella',
    description: 'Brilla muy fuerte',
    starsRequired: 3,
  },
  {
    id: 'flower',
    name: 'Flor',
    description: 'Huele a primavera',
    starsRequired: 5,
  },
  {
    id: 'cupcake',
    name: 'Cupcake',
    description: 'Dulce y esponjoso',
    starsRequired: 8,
  },
  {
    id: 'crown',
    name: 'Corona',
    description: 'Para una campeona',
    starsRequired: 12,
  },
];

export function isStickerUnlocked(sticker: RewardSticker, stars: number): boolean {
  return stars >= sticker.starsRequired;
}
