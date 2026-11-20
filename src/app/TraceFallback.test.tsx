import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProgressProvider } from '@/modules/progress/ProgressProvider';
import { App } from './App';

/**
 * El catálogo ya está completo, así que este estado solo puede reproducirse
 * con un doble: una ficha declarada en contenidos pero sin trazos. Se comprueba
 * que la app avisa con cariño en lugar de romperse.
 */
vi.mock('@/modules/lessons/traces', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/lessons/traces')>();
  return {
    ...actual,
    getCharacterTrace: (characterId: string) =>
      characterId === 'upper-b' ? undefined : actual.getCharacterTrace(characterId),
  };
});

describe('ficha sin trazos registrados', () => {
  it('muestra un aviso amable en lugar de romperse', () => {
    window.location.hash = '#/aprender/mayusculas/upper-b';
    render(
      <ProgressProvider>
        <App />
      </ProgressProvider>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'B' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /muy pronto/i })).toBeInTheDocument();
    expect(screen.getByText(/la ficha de la b todavía se está preparando/i)).toBeInTheDocument();
  });
});
