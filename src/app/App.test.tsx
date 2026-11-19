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
    expect(screen.getByRole('link', { name: 'Trazar la A' })).toHaveAttribute(
      'href',
      '#/aprender/mayusculas/upper-a',
    );
    expect(screen.getByRole('link', { name: /probar la pizarra/i })).toHaveAttribute(
      'href',
      '#/pizarra',
    );
  });

  it('abre la ficha de trazado de la A', () => {
    renderAt('#/aprender/mayusculas/upper-a');

    expect(screen.getByRole('heading', { level: 1, name: 'La A' })).toBeInTheDocument();
    expect(screen.getByText(/baja desde la punta hacia la izquierda/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver a las letras/i })).toHaveAttribute(
      'href',
      '#/aprender/mayusculas',
    );
    expect(document.title).toBe('Trazar la A · Aprende y Traza');
  });

  it('avisa con cariño cuando una ficha aún no tiene trazos', () => {
    renderAt('#/aprender/mayusculas/upper-b');

    expect(screen.getByRole('heading', { level: 1, name: 'B' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /muy pronto/i })).toBeInTheDocument();
    expect(screen.getByText(/la ficha de la b todavía se está preparando/i)).toBeInTheDocument();
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
