import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
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

function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
}

afterEach(() => {
  setViewport(1024, 768);
});

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
    expect(screen.getByRole('link', { name: /recompensas/i })).toHaveAttribute(
      'href',
      '#/recompensas',
    );
  });

  it('mantiene el control de música y su preferencia al cambiar de pantalla', async () => {
    renderAt('#/');

    const toggle = screen.getByRole('button', { name: 'Silenciar música' });
    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: 'Activar música' })).toBe(toggle);
    expect(window.localStorage.getItem('aprende-y-traza.music.muted')).toBe('true');

    window.location.hash = '#/aprender';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await screen.findByRole('heading', { name: 'Aprender' });

    expect(screen.getByRole('button', { name: 'Activar música' })).toBe(toggle);
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

  it('marca todas las fichas del catálogo como disponibles', () => {
    renderAt('#/aprender/numeros');
    expect(screen.getByRole('heading', { level: 1, name: 'Números' })).toBeInTheDocument();
    expect(screen.getByText(/todas las fichas están listas/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /trazar número cero: cero/i })).toHaveAttribute(
      'href',
      '#/aprender/numeros/digit-0',
    );
    expect(screen.getByRole('link', { name: /trazar número nueve: nueve/i })).toHaveAttribute(
      'href',
      '#/aprender/numeros/digit-9',
    );
  });

  it('usa el artículo correcto en el título de los números', () => {
    renderAt('#/aprender/numeros/digit-8');

    expect(screen.getByRole('heading', { level: 1, name: 'El 8' })).toBeInTheDocument();
    expect(document.title).toBe('Trazar el 8 · Aprende y Traza');
  });

  it('abre la pizarra libre sin plantilla', async () => {
    renderAt('#/pizarra');

    expect(screen.getByRole('heading', { level: 1, name: 'Pizarra mágica' })).toBeInTheDocument();
    expect(
      await screen.findByRole('group', { name: /pizarra libre para dibujar/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /elige un color/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^deshacer$/i })).toBeDisabled();
  });

  it('avisa cuando una lámina todavía está bloqueada', async () => {
    renderAt('#/pizarra/dibujo/letter-a');

    expect(
      await screen.findByRole('heading', { name: /este dibujo todavía está guardado/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver mis recompensas/i })).toHaveAttribute(
      'href',
      '#/recompensas',
    );
    expect(document.title).toBe('Colorear Avión · Aprende y Traza');
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

  it('mantiene la portada y sus accesos en viewport horizontal', () => {
    setViewport(844, 390);
    renderAt('#/');

    expect(screen.getByRole('heading', { name: /jugamos a trazar/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /aprender/i })).toHaveAttribute('href', '#/aprender');
    expect(screen.getByRole('link', { name: /pizarra/i })).toHaveAttribute('href', '#/pizarra');
    expect(screen.getByRole('link', { name: /^estrellas/i })).toHaveAttribute(
      'href',
      '#/progreso',
    );
    expect(screen.getByRole('link', { name: /recompensas/i })).toHaveAttribute(
      'href',
      '#/recompensas',
    );
  });

  it('mantiene el menú y la selección de letras en viewport horizontal', async () => {
    setViewport(844, 390);
    renderAt('#/aprender');

    expect(await screen.findByRole('heading', { name: 'Aprender' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /mayúsculas/i })).toHaveAttribute(
      'href',
      '#/aprender/mayusculas',
    );
    expect(screen.getByRole('link', { name: /minúsculas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /números/i })).toBeInTheDocument();

    window.location.hash = '#/aprender/mayusculas';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(await screen.findByRole('heading', { level: 1, name: 'Mayúsculas' })).toBeInTheDocument();
    expect(screen.getByText(/27 letras para descubrir/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Trazar la A' })).toHaveAttribute(
      'href',
      '#/aprender/mayusculas/upper-a',
    );
  });

  it('cambia entre dibujos y pegatinas en Recompensas', async () => {
    renderAt('#/recompensas');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Recompensas' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/completa una letra o un número/i)).toBeInTheDocument();

    const drawingsTab = screen.getByRole('tab', { name: /dibujos/i });
    const stickersTab = screen.getByRole('tab', { name: /pegatinas/i });
    expect(drawingsTab).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(stickersTab);
    expect(stickersTab).toHaveAttribute('aria-selected', 'true');
    expect(drawingsTab).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText(/las estrellas se consiguen al completar/i)).toBeInTheDocument();
  });

  it('mantiene el progreso y las recompensas en viewport horizontal', async () => {
    setViewport(640, 360);
    renderAt('#/progreso');

    expect(await screen.findByRole('heading', { name: 'Mis estrellas' })).toBeInTheDocument();
    expect(screen.getByText('Tu camino')).toBeInTheDocument();

    window.location.hash = '#/recompensas';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(await screen.findByRole('heading', { name: 'Recompensas' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /dibujos/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });
});
