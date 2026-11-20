import { PaletteIcon, PencilIcon, SparkleIcon } from '@/components/icons/Icons';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { BigActionLink } from '@/components/ui/BigActionLink';
import { ROUTES, characterHref } from '@/app/router';
import { getLessonPack } from '@/modules/lessons/content';
import { hasCharacterTrace } from '@/modules/lessons/traces';
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
  const article = pack.scriptId === 'digits' ? 'el' : 'la';
  const availableCharacters = pack.characters.filter((character) =>
    hasCharacterTrace(character.id),
  );
  const firstAvailable = availableCharacters[0];
  const complete = availableCharacters.length === pack.characters.length;

  return (
    <Screen className={styles.screen}>
      <ScreenHeader
        title={pack.title}
        backHref={ROUTES.learning}
        backLabel="Volver a elegir un mundo"
      />

      <div className={styles.primary}>
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

        {firstAvailable ? (
          <BigActionLink
            href={characterHref(pack.id, firstAvailable.id)}
            accent="pink"
            icon={<PencilIcon />}
          >
            Trazar {article} {firstAvailable.glyph}
          </BigActionLink>
        ) : null}

        <aside className={styles.comingSoon}>
          <SparkleIcon width="24" height="24" />
          <div>
            <strong>
              {complete
                ? '¡Todas las fichas están listas!'
                : firstAvailable
                  ? '¡La primera ficha ya está lista!'
                  : '¡Muy pronto!'}
            </strong>
            <p>
              {complete && firstAvailable
                ? `Toca ${article} ${firstAvailable.glyph} o elige ${
                    article === 'el' ? 'otro número' : 'otra letra'
                  }.`
                : firstAvailable
                  ? `Toca ${article} ${firstAvailable.glyph} para empezar. Las demás fichas llegan pronto.`
                  : 'Estamos preparando las fichas mágicas para trazar.'}
            </p>
          </div>
        </aside>
      </div>

      <div className={styles.secondary}>
        <section className={styles.listSection} aria-labelledby="lesson-list-title">
          <h2 className={styles.listTitle} id="lesson-list-title">
            Lo que vas a aprender
          </h2>
          <ul className={styles.grid}>
            {pack.characters.map((character) => {
              const available = hasCharacterTrace(character.id);
              const inner = (
                <>
                  <span className={styles.glyph} aria-hidden="true">
                    {character.glyph}
                  </span>
                  <span className={styles.word} aria-hidden="true">
                    {character.exampleWord}
                  </span>
                  {available ? (
                    <span className={styles.play} aria-hidden="true">
                      ▶
                    </span>
                  ) : null}
                </>
              );

              return (
                <li key={character.id}>
                  {available ? (
                    <a
                      className={`${styles.chip} ${styles.available}`}
                      href={characterHref(pack.id, character.id)}
                      aria-label={`Trazar ${character.spokenName}: ${character.exampleWord}`}
                    >
                      {inner}
                    </a>
                  ) : (
                    <div
                      className={styles.chip}
                      aria-label={`${character.spokenName}: ${character.exampleWord}`}
                    >
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <BigActionLink href={ROUTES.doodle} accent="mint" icon={<PaletteIcon />}>
          Probar la pizarra
        </BigActionLink>
      </div>
    </Screen>
  );
}
