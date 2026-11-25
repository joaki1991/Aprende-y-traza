import { useEffect } from 'react';
import { getDrawing } from '@/modules/artworks/drawings';
import { getLessonCharacter, getLessonPack } from '@/modules/lessons/content';
import { AppShell } from '@/components/layout/AppShell';
import { AmbientMusicProvider } from '@/modules/audio/AmbientMusicProvider';
import { AudioProvider } from '@/modules/audio/AudioProvider';
import { AudioSettings } from '@/modules/audio/AudioSettings';
import { MusicToggle } from '@/modules/audio/MusicToggle';
import { HomeScreen } from '@/modules/home/HomeScreen';
import { LearningScreen } from '@/modules/learning/LearningScreen';
import { LessonPreviewScreen } from '@/modules/learning/LessonPreviewScreen';
import { TraceScreen } from '@/modules/tracing/TraceScreen';
import { TraceCompleteScreen } from '@/modules/tracing/TraceCompleteScreen';
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
    case 'traceComplete':
      return `¡Bravo! · ${APP_NAME}`;
    case 'doodle':
      return `Pizarra mágica · ${APP_NAME}`;
    case 'coloring': {
      const drawing = getDrawing(route.drawingId);
      return drawing ? `Colorear ${drawing.name} · ${APP_NAME}` : `Colorear · ${APP_NAME}`;
    }
    case 'progress':
      return `Mis estrellas · ${APP_NAME}`;
    case 'rewards':
      return `Recompensas · ${APP_NAME}`;
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
    case 'traceComplete':
      return <TraceCompleteScreen packId={route.packId} characterId={route.characterId} />;
    case 'doodle':
      return <DoodleScreen />;
    case 'coloring':
      return (
        <DoodleScreen
          drawingId={route.drawingId}
          returnToTrace={route.returnTrace}
        />
      );
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
    <AmbientMusicProvider>
      <AudioProvider>
        <AppShell>
          <MusicToggle />
          <AudioSettings />
          <div className={styles.route} key={currentKey}>
            {screenForRoute(route)}
          </div>
        </AppShell>
      </AudioProvider>
    </AmbientMusicProvider>
  );
}
