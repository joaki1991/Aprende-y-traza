/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import indexHtml from '../../index.html?raw';
import viteConfig from '../../vite.config.ts?raw';
import { describe, expect, it } from 'vitest';

/**
 * Guardas de la experiencia instalada.
 *
 * El manifest, el viewport y los estilos globales viven fuera de los
 * componentes, así que una prueba de UI no los cubriría. Estas comprobaciones
 * evitan que un cambio accidental vuelva a mostrar la interfaz del navegador,
 * rompa las áreas seguras o deje la música fuera del precache offline.
 *
 * Los CSS se leen del disco porque Vitest no procesa los imports de CSS por
 * defecto (`css: false`) y devolverían una cadena vacía.
 */

function readCss(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
}

const baseCss = readCss('../styles/base.css');
const shellCss = readCss('../components/layout/AppShell.module.css');
const toggleCss = readCss('../modules/audio/MusicToggle.module.css');

describe('manifest de la PWA', () => {
  it('abre en modo independiente sin forzar la orientación', () => {
    expect(viteConfig).toMatch(/display:\s*'standalone'/);
    expect(viteConfig).toMatch(/display_override:\s*\[[^\]]*'standalone'/);
    expect(viteConfig).toMatch(/orientation:\s*'any'/);
  });

  it('conserva nombre, colores e iconos de instalación', () => {
    expect(viteConfig).toMatch(/name:\s*'Aprende y Traza'/);
    expect(viteConfig).toMatch(/short_name:\s*'Aprende'/);
    expect(viteConfig).toMatch(/theme_color:\s*'#ffd6e7'/);
    expect(viteConfig).toMatch(/background_color:\s*'#fff6fb'/);
    expect(viteConfig).toMatch(/purpose:\s*'maskable'/);
    expect(viteConfig).toMatch(/pwa-512x512\.png/);
  });

  it('precarga la música para que siga sonando sin conexión', () => {
    expect(viteConfig).toMatch(/globPatterns/);
    expect(viteConfig).toMatch(/\bmp3\b/);
    expect(viteConfig).toMatch(/\bogg\b/);
    expect(viteConfig).toMatch(/maximumFileSizeToCacheInBytes:\s*5\s*\*\s*1024\s*\*\s*1024/);
    expect(viteConfig).toMatch(/navigateFallback:\s*'index\.html'/);
  });
});

describe('experiencia a pantalla completa', () => {
  it('declara el viewport con cobertura de áreas seguras', () => {
    expect(indexHtml).toContain('name="viewport"');
    expect(indexHtml).toContain('viewport-fit=cover');
    expect(indexHtml).toContain('width=device-width');
  });

  it('usa alturas dinámicas con respaldo y evita el scroll lateral', () => {
    expect(baseCss).toMatch(/min-height:\s*100vh/);
    expect(baseCss).toMatch(/min-height:\s*100dvh/);
    expect(baseCss).toMatch(/overflow-x:\s*clip/);
    expect(baseCss).toMatch(/overscroll-behavior-y:\s*none/);
    expect(shellCss).toMatch(/min-height:\s*100dvh/);
  });

  it('respeta notch, esquinas y barras del sistema', () => {
    expect(shellCss).toContain('var(--safe-top)');
    expect(shellCss).toContain('var(--safe-bottom)');
    expect(shellCss).toContain('var(--safe-left)');
    expect(shellCss).toContain('var(--safe-right)');
    expect(toggleCss).toMatch(/var\(--safe-top\)/);
    expect(toggleCss).toMatch(/var\(--safe-right\)/);
  });

  it('mantiene el botón de música dentro del área táctil recomendada', () => {
    expect(toggleCss).toMatch(/width:\s*46px/);
    expect(toggleCss).toMatch(/height:\s*46px/);
  });
});
