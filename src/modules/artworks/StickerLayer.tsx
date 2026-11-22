import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { PlacedSticker } from './artwork.types';
import { StickerArt } from '@/modules/rewards/StickerArt';
import { REWARD_STICKERS } from '@/modules/rewards/rewards';
import styles from './StickerLayer.module.css';

interface StickerLayerProps {
  stickers: readonly PlacedSticker[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  /** Se llama una sola vez, al empezar a mover, para guardar el punto de retorno. */
  onDragStart?: () => void;
}

interface DragState {
  id: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  width: number;
  height: number;
  moved: boolean;
}

function stickerName(kind: PlacedSticker['kind']): string {
  return REWARD_STICKERS.find((sticker) => sticker.id === kind)?.name ?? 'Pegatina';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Capa de pegatinas colocadas sobre la composición.
 *
 * Queda por encima del dibujo, de la tinta y de los contornos. Cada pegatina
 * se arrastra con el dedo y su posición se guarda normalizada (0–1).
 */
export function StickerLayer({
  stickers,
  selectedId,
  onSelect,
  onMove,
  onDragStart,
}: StickerLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    sticker: PlacedSticker,
  ) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onSelect(sticker.id);

    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      return;
    }

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Algunos WebViews antiguos no permiten capturar el puntero.
    }

    dragRef.current = {
      id: sticker.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: sticker.x,
      originY: sticker.y,
      width: rect.width,
      height: rect.height,
      moved: false,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startClientX;
    const deltaY = event.clientY - drag.startClientY;

    if (!drag.moved && Math.hypot(deltaX, deltaY) < 4) {
      return;
    }

    if (!drag.moved) {
      drag.moved = true;
      onDragStart?.();
    }

    onMove(
      drag.id,
      clamp(drag.originX + deltaX / drag.width, 0.04, 0.96),
      clamp(drag.originY + deltaY / drag.height, 0.04, 0.96),
    );
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // La captura ya se había liberado.
    }
  };

  return (
    <div className={styles.layer} ref={layerRef} data-layer="stickers">
      {stickers.map((sticker) => {
        const selected = sticker.id === selectedId;
        return (
          <button
            key={sticker.id}
            type="button"
            className={[styles.sticker, selected ? styles.selected : ''].filter(Boolean).join(' ')}
            style={{
              left: `${sticker.x * 100}%`,
              top: `${sticker.y * 100}%`,
              width: `${sticker.scale * 100}%`,
            }}
            aria-label={`Pegatina ${stickerName(sticker.kind)}${selected ? ', seleccionada' : ''}`}
            aria-pressed={selected}
            onPointerDown={(event) => handlePointerDown(event, sticker)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onLostPointerCapture={handlePointerUp}
            onContextMenu={(event) => event.preventDefault()}
          >
            <StickerArt kind={sticker.kind} />
          </button>
        );
      })}
    </div>
  );
}
