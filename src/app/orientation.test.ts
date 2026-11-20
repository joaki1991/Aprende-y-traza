import androidManifest from '../../android/app/src/main/AndroidManifest.xml?raw';
import indexHtml from '../../index.html?raw';
import viteConfig from '../../vite.config.ts?raw';
import { describe, expect, it } from 'vitest';

/**
 * Guardas de regresión de orientación.
 *
 * La app debe poder girarse en Android y en la PWA. Estos ajustes viven en
 * archivos de configuración que ninguna prueba de componentes leería, así que
 * se comprueban directamente para que un cambio accidental no vuelva a
 * bloquear la orientación.
 *
 * Los archivos se cargan como texto con `?raw` de Vite: la prueba se ejecuta
 * tanto en jsdom como en el bundle sin depender de APIs de Node.
 */

describe('configuración de orientación', () => {
  it('Android no bloquea la actividad en vertical', () => {
    expect(androidManifest).not.toMatch(/android:screenOrientation\s*=\s*"portrait"/);
    expect(androidManifest).not.toMatch(/android:screenOrientation\s*=\s*"landscape"/);
    expect(androidManifest).toContain('android:configChanges="orientation');
    expect(androidManifest).toContain('screenSize');
  });

  it('la PWA declara orientación libre', () => {
    expect(viteConfig).toMatch(/orientation:\s*'any'/);
    expect(viteConfig).not.toMatch(/orientation:\s*'portrait'/);
  });

  it('el viewport cubre las safe areas de Android', () => {
    expect(indexHtml).toContain('viewport-fit=cover');
  });
});
