# Audio local

Todo el audio de la aplicación vive en este directorio y se empaqueta con la
app. No hay descargas, servicios de streaming, CDNs ni peticiones de red en
tiempo de ejecución.

```text
public/audio/
├── music/
│   └── background-music.mp3
└── effects/
    └── README.md   (los efectos se sintetizan, no hay muestras)
```

## Música ambiental

La aplicación reproduce en bucle un único archivo local:

```text
public/audio/music/background-music.mp3
```

- Se carga desde `MUSIC_SOURCE` en `src/modules/audio/musicPlayer.ts`.
- Se empaqueta con la app y el service worker la precarga: funciona sin conexión.
- No se descarga nada de Internet ni se usan servicios de streaming.
- El volumen base se controla con `MUSIC_VOLUME` (por defecto `0.24`).

### Cómo sustituir la música

1. Prepara una melodía infantil tranquila, sin voces ni sonidos bruscos.
2. Exporta un MP3 u OGG optimizado (mono o estéreo, 96–128 kbps es suficiente).
3. Sustituye el archivo manteniendo el nombre `background-music.mp3`.
4. Si usas OGG, cambia la extensión en `MUSIC_SOURCE`.
5. Ejecuta `npm run build` y comprueba que el archivo aparece en
   `dist/audio/music/`.
6. Prueba la reproducción en bucle y el botón de silencio en el navegador.

## Efectos de sonido

Los efectos de victoria, estrella y desbloqueo no son archivos: se sintetizan
con Web Audio en `src/modules/audio/soundEffects.ts`. Así son diminutos,
funcionan sin conexión y no requieren licencias de muestras externas.

El directorio `public/audio/effects/` queda reservado por si en el futuro se
quiere sustituir la síntesis por grabaciones locales. Si se añaden archivos,
deben incluirse en `globPatterns` de `vite.config.ts` y documentar su licencia
en este mismo archivo.

## Si un recurso no existe

La app sigue funcionando con normalidad. El reproductor de música registra un
aviso en la consola, el botón de música mantiene la preferencia y los efectos o
la voz se desactivan si el dispositivo no los ofrece. Ninguna pantalla se rompe.

## Licencia

El archivo de música incluido lo aporta el responsable del proyecto. Antes de
distribuir la aplicación hay que confirmar que se cuenta con permiso para usar y
redistribuir la melodía. No se deben añadir canciones comerciales ni material
protegido sin autorización expresa.

Los patrones de efectos son originales y se generan en el dispositivo; no
reproducen muestras de terceros.
