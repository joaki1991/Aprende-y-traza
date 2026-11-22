/**
 * Tipos compartidos de las composiciones artísticas.
 *
 * Una composición es pizarra libre o un dibujo del catálogo. Se guarda como
 * datos vectoriales: colores por región, trazos normalizados y pegatinas con
 * posición y tamaño. Nunca se guardan mapas de bits.
 */

import type { StickerKind } from '@/modules/rewards/rewards';

export interface ArtworkPoint {
  x: number;
  y: number;
}

export interface ArtworkStroke {
  color: string;
  /** Grosor relativo al ancho del tablero, para escalar al redimensionar. */
  widthRatio: number;
  points: ArtworkPoint[];
}

export interface PlacedSticker {
  /** Identificador único de esta colocación concreta. */
  id: string;
  kind: StickerKind;
  /** Centro de la pegatina, normalizado 0–1 respecto al tablero. */
  x: number;
  y: number;
  /** Ancho relativo al ancho del tablero, entre 0,1 y 0,45. */
  scale: number;
}

export interface ArtworkState {
  /** `letter-a`, `number-0` o `playground`. */
  artworkId: string;
  /** 0 si la composición es la pizarra libre. */
  unlockedAt: number;
  /** Color aplicado a cada región del dibujo, por id estable. */
  fills: Record<string, string>;
  /** Trazos libres dibujados encima de la plantilla. */
  strokes: ArtworkStroke[];
  stickers: PlacedSticker[];
  updatedAt: number;
}

/** Composición de la pizarra libre; no pertenece al catálogo de dibujos. */
export const PLAYGROUND_ARTWORK_ID = 'playground';

/** Límite defensivo para no guardar composiciones absurdamente grandes. */
export const MAX_ARTWORK_STROKES = 400;
export const MAX_ARTWORK_STICKERS = 60;

export function createEmptyArtwork(artworkId: string, unlockedAt = 0): ArtworkState {
  return {
    artworkId,
    unlockedAt,
    fills: {},
    strokes: [],
    stickers: [],
    updatedAt: 0,
  };
}

/** Un dibujo se considera coloreado si tiene algún relleno o pegatina. */
export function isArtworkColored(artwork: ArtworkState | undefined): boolean {
  if (!artwork) {
    return false;
  }
  return (
    Object.keys(artwork.fills).length > 0 ||
    artwork.strokes.length > 0 ||
    artwork.stickers.length > 0
  );
}
