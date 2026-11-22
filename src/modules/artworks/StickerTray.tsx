import { LockIcon, StarIcon } from '@/components/icons/Icons';
import { StickerArt } from '@/modules/rewards/StickerArt';
import { REWARD_STICKERS, isStickerUnlocked, type StickerKind } from '@/modules/rewards/rewards';
import styles from './StickerTray.module.css';

interface StickerTrayProps {
  stars: number;
  onAdd: (kind: StickerKind) => void;
  onClose: () => void;
}

/** Bandeja de pegatinas desbloqueadas, pensada para tocar con dedos pequeños. */
export function StickerTray({ stars, onAdd, onClose }: StickerTrayProps) {
  return (
    <section className={styles.tray} aria-label="Pegatinas para la pizarra">
      <header className={styles.header}>
        <h2>Pega una pegatina</h2>
        <button type="button" className={styles.close} onClick={onClose}>
          Cerrar
        </button>
      </header>

      <ul className={styles.list}>
        {REWARD_STICKERS.map((sticker) => {
          const unlocked = isStickerUnlocked(sticker, stars);
          return (
            <li key={sticker.id}>
              <button
                type="button"
                className={`${styles.item} ${unlocked ? styles.unlocked : styles.locked}`}
                onClick={() => onAdd(sticker.id)}
                disabled={!unlocked}
                aria-label={
                  unlocked
                    ? `Añadir pegatina ${sticker.name}`
                    : `${sticker.name}, necesitas ${sticker.starsRequired} estrellas`
                }
              >
                <span className={styles.art}>
                  <StickerArt kind={sticker.id} />
                </span>
                <span className={styles.name}>{sticker.name}</span>
                {!unlocked ? (
                  <span className={styles.lock} aria-hidden="true">
                    <LockIcon width="12" height="12" />
                    <StarIcon width="11" height="11" />
                    {sticker.starsRequired}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
