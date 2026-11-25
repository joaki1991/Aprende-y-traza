# Música ambiental

La aplicación reproduce en bucle un único archivo local:

```text
public/audio/background-music.mp3
```

- Se carga desde `MUSIC_SOURCE` en `src/modules/audio/musicPlayer.ts`.
- Se empaqueta con la app y el service worker la precarga: funciona sin conexión.
- No se descarga nada de Internet ni se usan servicios de streaming.

## Cómo sustituir la música

1. Prepara una melodía infantil tranquila, sin voces ni sonidos bruscos.
2. Exporta un MP3 u OGG optimizado (mono o estéreo, 96–128 kbps es suficiente).
3. Sustituye el archivo manteniendo el nombre `background-music.mp3`.
4. Si usas OGG, cambia la extensión en `MUSIC_SOURCE`.
5. Ejecuta `npm run build` y comprueba que el archivo aparece en `dist/audio/`.
6. Prueba la reproducción en bucle y el botón de silencio en el navegador.

El volumen base se controla con `MUSIC_VOLUME` (por defecto `0.24`).

## Si el archivo no existe

La app sigue funcionando con normalidad. El reproductor registra un aviso en la
consola, el botón de música sigue mostrando la preferencia y el resto de la
aplicación no se ve afectado.

## Licencia

El archivo incluido lo aporta el responsable del proyecto. Antes de distribuir
la aplicación hay que confirmar que se cuenta con permiso para usar y
redistribuir la melodía. No se deben añadir canciones comerciales ni material
protegido sin autorización expresa.
