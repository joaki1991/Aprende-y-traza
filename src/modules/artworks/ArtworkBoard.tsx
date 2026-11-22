import { useState, type CSSProperties } from 'react';
import {
  BucketIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  StickerIcon,
  TrashIcon,
  UndoIcon,
} from '@/components/icons/Icons';
import { useProgress } from '@/modules/progress/progressContext';
import { InkCanvas } from '@/modules/tracing/InkCanvas';
import {
  DEFAULT_DOODLE_BRUSH,
  DEFAULT_DOODLE_COLOR,
  DOODLE_BRUSH_SIZES,
  DOODLE_COLORS,
  type DoodleStroke,
} from '@/modules/tracing/drawing';
import type { StickerKind } from '@/modules/rewards/rewards';
import { DRAWING_VIEW_BOX, type DrawingTemplate } from './drawings';
import { DrawingFillLayer, DrawingOutlineLayer } from './DrawingLayers';
import {
  MAX_ARTWORK_STICKERS,
  MAX_ARTWORK_STROKES,
  type PlacedSticker,
} from './artwork.types';
import { StickerLayer } from './StickerLayer';
import { StickerTray } from './StickerTray';
import { useStoredArtwork } from './useStoredArtwork';
import styles from './ArtworkBoard.module.css';

type BoardTool = 'brush' | 'fill';

interface ArtworkBoardProps {
  artworkId: string;
  /** Si falta, la pizarra funciona en modo dibujo libre. */
  template?: DrawingTemplate;
}

let stickerSequence = 0;

function nextStickerId(): string {
  stickerSequence += 1;
  return `sticker-${Date.now().toString(36)}-${stickerSequence}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Pizarra única para dibujo libre y para colorear láminas.
 *
 * Capas de abajo a arriba: rellenos SVG, tinta libre, contornos SVG y
 * pegatinas. Así los contornos nunca se tapan y las pegatinas quedan siempre
 * encima. Toda la composición se guarda como datos vectoriales.
 */
export function ArtworkBoard({ artworkId, template }: ArtworkBoardProps) {
  const { summary } = useProgress();
  const { artwork, update, checkpoint, undo, canUndo, pendingSave } =
    useStoredArtwork(artworkId);

  const [color, setColor] = useState<string>(DEFAULT_DOODLE_COLOR);
  const [brush, setBrush] = useState<number>(DEFAULT_DOODLE_BRUSH);
  const [tool, setTool] = useState<BoardTool>('brush');
  const [stickerTrayOpen, setStickerTrayOpen] = useState(false);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const selectedSticker =
    artwork.stickers.find((sticker) => sticker.id === selectedStickerId) ?? null;
  const hasContent =
    artwork.strokes.length > 0 ||
    artwork.stickers.length > 0 ||
    Object.keys(artwork.fills).length > 0;

  const handleRegionTap = (regionId: string) => {
    if (tool !== 'fill' || artwork.fills[regionId] === color) {
      return;
    }

    checkpoint();
    update((current) => ({
      ...current,
      fills: { ...current.fills, [regionId]: color },
    }));
  };

  const handleStrokesChange = (strokes: DoodleStroke[]) => {
    checkpoint();
    update((current) => ({
      ...current,
      strokes: strokes.slice(-MAX_ARTWORK_STROKES),
    }));
  };

  const handleAddSticker = (kind: StickerKind) => {
    const index = artwork.stickers.length;
    const offset = ((index % 4) - 1.5) * 0.05;
    const sticker: PlacedSticker = {
      id: nextStickerId(),
      kind,
      x: 0.5 + offset,
      y: 0.55 + offset,
      scale: 0.22,
    };

    checkpoint();
    update((current) => ({
      ...current,
      stickers: [...current.stickers, sticker].slice(0, MAX_ARTWORK_STICKERS),
    }));
    setSelectedStickerId(sticker.id);
    setStatusMessage('Pegatina añadida. Arrástrala con el dedo.');
  };

  const handleMoveSticker = (id: string, x: number, y: number) => {
    update((current) => ({
      ...current,
      stickers: current.stickers.map((sticker) =>
        sticker.id === id ? { ...sticker, x, y } : sticker,
      ),
    }));
  };

  const handleResizeSticker = (delta: number) => {
    if (!selectedSticker) {
      return;
    }

    checkpoint();
    update((current) => ({
      ...current,
      stickers: current.stickers.map((sticker) =>
        sticker.id === selectedSticker.id
          ? { ...sticker, scale: clamp(sticker.scale + delta, 0.1, 0.45) }
          : sticker,
      ),
    }));
  };

  const handleRemoveSticker = () => {
    if (!selectedSticker) {
      return;
    }

    checkpoint();
    update((current) => ({
      ...current,
      stickers: current.stickers.filter((sticker) => sticker.id !== selectedSticker.id),
    }));
    setSelectedStickerId(null);
    setStatusMessage('Pegatina quitada.');
  };

  const handleClear = () => {
    checkpoint();
    update((current) => ({
      ...current,
      fills: {},
      strokes: [],
      stickers: [],
    }));
    setSelectedStickerId(null);
    setConfirmingClear(false);
    setStatusMessage('Todo borrado. Puedes deshacerlo.');
  };

  const handleUndo = () => {
    undo();
    setSelectedStickerId(null);
    setStatusMessage('Acción deshecha.');
  };

  return (
    <div className={styles.wrapper} data-mode={template ? 'coloring' : 'free'}>
      <div className={styles.stageWrap}>
        <div
          className={styles.stage}
          role="group"
          aria-label={
            template
              ? `Lámina para colorear: ${template.name}`
              : 'Pizarra libre para dibujar'
          }
        >
          {template ? (
            <svg
              className={`${styles.layerSvg} ${styles.fillSvg}`}
              viewBox={DRAWING_VIEW_BOX}
              aria-hidden="true"
              focusable="false"
            >
              <DrawingFillLayer
                template={template}
                fills={artwork.fills}
                interactive={tool === 'fill'}
                onRegionTap={handleRegionTap}
              />
            </svg>
          ) : null}

          <InkCanvas
            strokes={artwork.strokes}
            color={color}
            brushWidth={brush}
            enabled={!template || tool === 'brush'}
            ariaLabel={
              template
                ? `Zona para colorear y dibujar en ${template.name}`
                : 'Pizarra para dibujar con el dedo'
            }
            onChange={handleStrokesChange}
          />

          {template ? (
            <svg
              className={`${styles.layerSvg} ${styles.outlineSvg}`}
              viewBox={DRAWING_VIEW_BOX}
              aria-hidden="true"
              focusable="false"
            >
              <DrawingOutlineLayer template={template} />
            </svg>
          ) : null}

          <StickerLayer
            stickers={artwork.stickers}
            selectedId={selectedStickerId}
            onSelect={setSelectedStickerId}
            onMove={handleMoveSticker}
            onDragStart={checkpoint}
          />

          {!hasContent ? (
            <div className={styles.hint} aria-hidden="true">
              <PencilIcon width="22" height="22" />
              <span>
                {template ? 'Toca una zona o dibuja' : 'Dibuja con el dedo'}
              </span>
            </div>
          ) : null}

          {confirmingClear ? (
            <div
              className={styles.confirm}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="clear-board-title"
            >
              <p id="clear-board-title">¿Borrar todo el dibujo?</p>
              <div className={styles.confirmActions}>
                <button type="button" className={styles.confirmYes} onClick={handleClear}>
                  Sí, borrar
                </button>
                <button
                  type="button"
                  className={styles.confirmNo}
                  onClick={() => setConfirmingClear(false)}
                >
                  No, seguir
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.controls}>
          {template ? (
            <div className={styles.toolGroup} role="group" aria-label="Herramienta">
              <button
                type="button"
                className={styles.toolButton}
                aria-pressed={tool === 'brush'}
                onClick={() => setTool('brush')}
              >
                <PencilIcon width="20" height="20" />
                <span>Pincel</span>
              </button>
              <button
                type="button"
                className={styles.toolButton}
                aria-pressed={tool === 'fill'}
                onClick={() => setTool('fill')}
              >
                <BucketIcon width="20" height="20" />
                <span>Pintar</span>
              </button>
            </div>
          ) : null}

          <div className={styles.toolGroup} role="group" aria-label="Grosor del pincel">
            {DOODLE_BRUSH_SIZES.map((size) => (
              <button
                key={size.id}
                type="button"
                className={styles.brushButton}
                style={{ '--dot': `${size.value * 0.7}px` } as CSSProperties}
                aria-label={`Grosor ${size.name}`}
                aria-pressed={brush === size.value}
                onClick={() => {
                  setBrush(size.value);
                  setTool('brush');
                }}
              >
                <span className={styles.brushDot} aria-hidden="true" />
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.actionButton}
            aria-expanded={stickerTrayOpen}
            onClick={() => setStickerTrayOpen((open) => !open)}
          >
            <StickerIcon width="20" height="20" />
            <span>Pegatinas</span>
          </button>

          <button
            type="button"
            className={styles.iconButton}
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="Deshacer"
          >
            <UndoIcon width="22" height="22" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setConfirmingClear(true)}
            disabled={!hasContent}
            aria-label="Limpiar el dibujo"
          >
            <TrashIcon width="22" height="22" />
          </button>
        </div>

        {selectedSticker ? (
          <div className={styles.stickerControls} role="group" aria-label="Pegatina elegida">
            <span className={styles.stickerLabel}>Pegatina</span>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => handleResizeSticker(-0.05)}
              aria-label="Hacer la pegatina más pequeña"
            >
              <MinusIcon width="20" height="20" />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => handleResizeSticker(0.05)}
              aria-label="Hacer la pegatina más grande"
            >
              <PlusIcon width="20" height="20" />
            </button>
            <button
              type="button"
              className={styles.removeButton}
              onClick={handleRemoveSticker}
            >
              <TrashIcon width="18" height="18" />
              Quitar
            </button>
          </div>
        ) : null}

        <div className={styles.paletteScroller}>
          <div className={styles.palette} role="group" aria-label="Elige un color">
            {DOODLE_COLORS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={[
                  styles.color,
                  color === option.value ? styles.colorSelected : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ '--swatch': option.value } as CSSProperties}
                aria-label={`Color ${option.name}`}
                aria-pressed={color === option.value}
                onClick={() => setColor(option.value)}
              />
            ))}
          </div>
        </div>

        {stickerTrayOpen ? (
          <StickerTray
            stars={summary.totalStars}
            onAdd={handleAddSticker}
            onClose={() => setStickerTrayOpen(false)}
          />
        ) : null}

        <p className={styles.saveState} role="status" aria-live="polite">
          {hasContent ? (pendingSave ? 'Guardando…' : 'Guardado') : ''}
        </p>
      </div>

      <p className="visually-hidden" role="status" aria-live="polite">
        {statusMessage}
      </p>
    </div>
  );
}
