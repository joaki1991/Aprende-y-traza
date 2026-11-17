import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressProvider } from '@/modules/progress/ProgressProvider';
import { App } from './App';

function renderAt(hash: string) {
  window.location.hash = hash;
  return render(
    <ProgressProvider>
      <App />
    </ProgressProvider>,
  );
}

describe('App', () => {
  it('muestra la portada con las actividades principales', () => {
    renderAt('#/');

    expect(screen.getByRole('heading', { name: /jugamos a trazar/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /aprender/i })).toHaveAttribute('href', '#/aprender');
    expect(screen.getByRole('link', { name: /pizarra/i })).toHaveAttribute('href', '#/pizarra');
    expect(screen.getByRole('link', { name: /^estrellas/i })).toHaveAttribute(
      'href',
      '#/progreso',
    );
    expect(screen.getByRole('link', { name: /sorpresas/i })).toHaveAttribute(
      'href',
      '#/recompensas',
    );
  });

  it('navega a la selección de contenidos mediante el hash', async () => {
    renderAt('#/');

    window.location.hash = '#/aprender';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(window.location.hash).toBe('#/aprender');
    expect(await screen.findByRole('heading', { name: 'Aprender' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /mayúsculas/i })).toBeInTheDocument();
  });

  it('muestra la vista previa de un paquete de lecciones', () => {
    renderAt('#/aprender/mayusculas');

    expect(screen.getByRole('heading', { level: 1, name: 'Mayúsculas' })).toBeInTheDocument();
    expect(screen.getByText(/27 letras para descubrir/i)).toBeInTheDocument();
    expect(screen.getByText('Abeja')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /probar la pizarra/i })).toHaveAttribute(
      'href',
      '#/pizarra',
    );
  });

  it('muestra una pantalla amable para rutas desconocidas', () => {
    renderAt('#/no-existe');

    expect(screen.getByText(/mochi no encuentra esta página/i)).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('link', { name: /volver al inicio/i })
        .every((link) => link.getAttribute('href') === '#/'),
    ).toBe(true);
  });
});
