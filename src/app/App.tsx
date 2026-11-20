import { useEffect } from 'react';
import { getLessonCharacter, getLessonPack } from '@/modules/lessons/content';
import { AppShell } from '@/components/layout/AppShell';
import { HomeScreen } from '@/modules/home/HomeScreen';
import { LearningScreen } from '@/modules/learning/LearningScreen';
import { LessonPreviewScreen } from '@/modules/learning/LessonPreviewScreen';
import { TraceScreen } from '@/modules/tracing/TraceScreen';
import { DoodleScreen } from '@/modules/tracing/DoodleScreen';
import { ProgressScreen } from '@/modules/progress/ProgressScreen';
import { RewardsScreen } from '@/modules/rewards/RewardsScreen';
import { NotFoundScreen } from './NotFoundScreen';
import { routeKey, type AppRoute } from './router';
import { useAppRoute } from './useAppRoute';
import styles from './App.module.css';

const APP_NAME = 'Aprende y Traza';

function pageTitle(route: AppRoute): string {
  switch (route.name) {
    case 'home':
      return APP_NAME;
    case 'learning':
      return `Aprender · ${APP_NAME}`;
    case 'lesson':
      return `${getLessonPack(route.packId)?.title ?? 'Lección'} · ${APP_NAME}`;
    case 'trace': {
      const pack = getLessonPack(route.packId);
      const glyph = getLessonCharacter(route.packId, route.characterId)?.glyph;
      if (!glyph) {
        return `Trazar · ${APP_NAME}`;
      }
      const article = pack?.scriptId === 'digits' ? 'el' : 'la';
      return `Trazar ${article} ${glyph} · ${APP_NAME}`;
    }
    case 'doodle':
      return `Pizarra mágica · ${APP_NAME}`;
    case 'progress':
      return `Mis estrellas · ${APP_NAME}`;
    case 'rewards':
      return `Sorpresas · ${APP_NAME}`;
    case 'notFound':
      return `¡Ups! · ${APP_NAME}`;
  }
}

function screenForRoute(route: AppRoute) {
  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'learning':
      return <LearningScreen />;
    case 'lesson':
      return <LessonPreviewScreen packId={route.packId} />;
    case 'trace':
      return <TraceScreen packId={route.packId} characterId={route.characterId} />;
    case 'doodle':
      return <DoodleScreen />;
    case 'progress':
      return <ProgressScreen />;
    case 'rewards':
      return <RewardsScreen />;
    case 'notFound':
      return <NotFoundScreen />;
  }
}

export function App() {
  const route = useAppRoute();
  const currentKey = routeKey(route);

  useEffect(() => {
    document.title = pageTitle(route);
    window.scrollTo(0, 0);
  }, [route]);

  return (
    <AppShell>
      <div className={styles.route} key={currentKey}>
        {screenForRoute(route)}
      </div>
    </AppShell>
  );
}
