# Efectos de sonido

Este directorio está reservado para futuras grabaciones locales de efectos.

Ahora mismo los efectos se sintetizan con Web Audio en
`src/modules/audio/soundEffects.ts`: no hay archivos de audio que precargar ni
licencias de muestras que revisar. Si algún día se sustituyen por archivos:

1. Usa formatos ligeros y compatibles con Android WebView (MP3 u OGG).
2. Mantén los sonidos por debajo de dos segundos y sin voces.
3. Añade la extensión a `globPatterns` de `vite.config.ts` si no está incluida.
4. Documenta aquí la procedencia y la licencia de cada archivo.
5. Actualiza las pruebas para comprobar que la app sigue funcionando si falta
   un recurso.
