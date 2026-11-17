import { PaletteIcon, SparkleIcon } from '@/components/icons/Icons';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { BigActionLink } from '@/components/ui/BigActionLink';
import { ROUTES } from '@/app/router';
import { getLessonPack } from '@/modules/lessons/content';
import { NotFoundScreen } from '@/app/NotFoundScreen';
import styles from './LessonPreviewScreen.module.css';

interface LessonPreviewScreenProps {
  packId: string;
}

export function LessonPreviewScreen({ packId }: LessonPreviewScreenProps) {
  const pack = getLessonPack(packId);

  if (!pack) {
    return <NotFoundScreen />;
  }

  const itemNoun = pack.scriptId === 'digits' ? 'números' : 'letras';

  return (
    <Screen>
      <ScreenHeader
        title={pack.title}
        backHref={ROUTES.learning}
        backLabel="Volver a elegir un mundo"
      />

      <section className={`${styles.hero} ${styles[pack.accent]}`}>
        <span className={styles.badge} aria-hidden="true">
          {pack.badge}
        </span>
        <div className={styles.heroCopy}>
          <h2>{pack.title}</h2>
          <p>
            {pack.characters.length} {itemNoun} para descubrir
          </p>
        </div>
      </section>

      <aside className={styles.comingSoon}>
        <SparkleIcon width="24" height="24" />
        <div>
          <strong>¡Muy pronto!</strong>
          <p>Estamos preparando las fichas mágicas para trazar.</p>
        </div>
      </aside>

      <section className={styles.listSection} aria-labelledby="lesson-list-title">
        <h2 className={styles.listTitle} id="lesson-list-title">
          Lo que vas a aprender
        </h2>
        <ul className={styles.grid}>
          {pack.characters.map((character) => (
            <li
              className={styles.chip}
              key={character.id}
              aria-label={`${character.spokenName}: ${character.exampleWord}`}
            >
              <span className={styles.glyph} aria-hidden="true">
                {character.glyph}
              </span>
              <span className={styles.word} aria-hidden="true">
                {character.exampleWord}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <BigActionLink href={ROUTES.doodle} accent="mint" icon={<PaletteIcon />}>
        Probar la pizarra
      </BigActionLink>
    </Screen>
  );
}
