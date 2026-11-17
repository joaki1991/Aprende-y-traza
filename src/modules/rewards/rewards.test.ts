import { describe, expect, it } from 'vitest';
import { REWARD_STICKERS, isStickerUnlocked } from './rewards';

describe('recompensas', () => {
  it('desbloquea la primera pegatina desde el inicio', () => {
    const first = REWARD_STICKERS[0];
    expect(first).toBeDefined();
    expect(isStickerUnlocked(first!, 0)).toBe(true);
  });

  it('bloquea las pegatinas hasta alcanzar su hito', () => {
    const rainbow = REWARD_STICKERS.find((sticker) => sticker.id === 'rainbow');
    expect(rainbow).toBeDefined();
    expect(isStickerUnlocked(rainbow!, 0)).toBe(false);
    expect(isStickerUnlocked(rainbow!, 1)).toBe(true);
  });

  it('mantiene hitos ordenados y sin duplicados', () => {
    const thresholds = REWARD_STICKERS.map((sticker) => sticker.starsRequired);
    expect(new Set(REWARD_STICKERS.map((sticker) => sticker.id)).size).toBe(
      REWARD_STICKERS.length,
    );
    expect([...thresholds].sort((a, b) => a - b)).toEqual(thresholds);
  });

  it('desbloquea todo el catálogo con doce estrellas', () => {
    expect(REWARD_STICKERS.every((sticker) => isStickerUnlocked(sticker, 12))).toBe(true);
  });
});
