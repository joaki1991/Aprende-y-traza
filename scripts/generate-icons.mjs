import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(root, 'public', 'icons');
const androidProject = path.join(root, 'android');
const androidRes = path.join(androidProject, 'app', 'src', 'main', 'res');

const outline = '#6b5568';

function catArt() {
  return `
    <ellipse cx="256" cy="421" rx="108" ry="16" fill="#e6cfe8" opacity="0.5" />
    <g transform="translate(256 286) scale(1.66) translate(-130 -95)">
      <path d="M73 58c-8-24-8-37 1-39 8-2 23 11 34 23Z" fill="url(#fur)" stroke="${outline}" stroke-width="4.5" stroke-linejoin="round" />
      <path d="M79 49c-4-13-4-21 0-22 4-1 12 6 18 13Z" fill="#ffc3d8" />
      <path d="M187 58c8-24 8-37-1-39-8-2-23 11-34 23Z" fill="url(#fur)" stroke="${outline}" stroke-width="4.5" stroke-linejoin="round" />
      <path d="M181 49c4-13 4-21 0-22-4-1-12 6-18 13Z" fill="#ffc3d8" />
      <path d="M130 40c48 0 74 26 74 57 0 32-30 52-74 52S56 129 56 97c0-31 26-57 74-57Z" fill="url(#fur)" stroke="${outline}" stroke-width="4.5" stroke-linejoin="round" />
      <ellipse cx="103" cy="91" rx="9.5" ry="12.5" fill="#5a4657" />
      <ellipse cx="157" cy="91" rx="9.5" ry="12.5" fill="#5a4657" />
      <circle cx="100" cy="86" r="3.4" fill="#ffffff" />
      <circle cx="154" cy="86" r="3.4" fill="#ffffff" />
      <circle cx="106" cy="96" r="1.7" fill="#ffffff" opacity="0.85" />
      <circle cx="160" cy="96" r="1.7" fill="#ffffff" opacity="0.85" />
      <ellipse cx="82" cy="107" rx="11" ry="6" fill="#ff9fbe" opacity="0.6" />
      <ellipse cx="178" cy="107" rx="11" ry="6" fill="#ff9fbe" opacity="0.6" />
      <path d="M125 98c2.2-2.4 7.8-2.4 10 0 0 4-2.4 6.4-5 6.4s-5-2.4-5-6.4Z" fill="#f08ca8" />
      <path d="M120 108c3 4.4 7 4.4 10 0 3 4.4 7 4.4 10 0" fill="none" stroke="${outline}" stroke-width="2.8" stroke-linecap="round" />
      <path d="M67 102 45 96M67 110l-24 3M193 102l22-6M193 110l24 3" stroke="#c9b3c6" stroke-width="2.5" stroke-linecap="round" />
      <g transform="translate(180 56) rotate(14)">
        <ellipse cx="-10" cy="0" rx="10" ry="7" fill="url(#bow)" stroke="${outline}" stroke-width="3.2" transform="rotate(-18 -10 0)" />
        <ellipse cx="10" cy="0" rx="10" ry="7" fill="url(#bow)" stroke="${outline}" stroke-width="3.2" transform="rotate(18 10 0)" />
        <circle cx="0" cy="0" r="4.2" fill="#ffe08a" stroke="${outline}" stroke-width="3" />
      </g>
    </g>
    <path d="M402 132 418 168 456 173 428 199 436 237 402 217 368 237 376 199 348 173 386 168Z" fill="#ffdf7a" stroke="${outline}" stroke-width="7" stroke-linejoin="round" />
    <path d="M112 130c1.2 7.4 4.2 10.4 11.6 11.6-7.4 1.2-10.4 4.2-11.6 11.6-1.2-7.4-4.2-10.4-11.6-11.6 7.4-1.2 10.4-4.2 11.6-11.6Z" fill="#ffffff" opacity="0.9" />
    <circle cx="420" cy="332" r="8" fill="#ffffff" opacity="0.65" />
    <circle cx="108" cy="346" r="5" fill="#ffffff" opacity="0.6" />
  `;
}

function iconSvg({ shape = 'rounded', artScale }) {
  const clip = shape === 'circle' ? ' clip-path="url(#circle)"' : '';
  const rectRadius = shape === 'rounded' ? ' rx="112"' : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffd6e7" />
        <stop offset="0.52" stop-color="#efe0ff" />
        <stop offset="1" stop-color="#c9f2e3" />
      </linearGradient>
      <linearGradient id="fur" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" />
        <stop offset="1" stop-color="#fff0f8" />
      </linearGradient>
      <linearGradient id="bow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#a5efd7" />
        <stop offset="1" stop-color="#6ed9b5" />
      </linearGradient>
      <clipPath id="circle"><circle cx="256" cy="256" r="256" /></clipPath>
    </defs>
    <rect width="512" height="512"${rectRadius} fill="url(#bg)"${clip} />
    <g${clip}>
      <circle cx="86" cy="74" r="130" fill="#ffffff" opacity="0.22" />
      <circle cx="456" cy="462" r="170" fill="#ffffff" opacity="0.18" />
      <g transform="translate(256 256) scale(${artScale}) translate(-256 -256)">
        ${catArt()}
      </g>
    </g>
  </svg>`;
}

/** Primer plano para el icono adaptativo de Android: sin fondo, dentro de la zona segura. */
function adaptiveForegroundSvg(artScale = 0.64) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="fur" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" />
        <stop offset="1" stop-color="#fff0f8" />
      </linearGradient>
      <linearGradient id="bow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#a5efd7" />
        <stop offset="1" stop-color="#6ed9b5" />
      </linearGradient>
    </defs>
    <g transform="translate(256 256) scale(${artScale}) translate(-256 -256)">
      ${catArt()}
    </g>
  </svg>`;
}

function splashSvg(width, height) {
  const artScale = (Math.min(width, height) / 512) * 0.78;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="splash-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffe9f2" />
        <stop offset="0.5" stop-color="#f6efff" />
        <stop offset="1" stop-color="#e6fbf4" />
      </linearGradient>
      <linearGradient id="fur" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" />
        <stop offset="1" stop-color="#fff0f8" />
      </linearGradient>
      <linearGradient id="bow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#a5efd7" />
        <stop offset="1" stop-color="#6ed9b5" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#splash-bg)" />
    <circle cx="${width * 0.12}" cy="${height * 0.14}" r="${Math.min(width, height) * 0.22}" fill="#ffffff" opacity="0.4" />
    <circle cx="${width * 0.88}" cy="${height * 0.86}" r="${Math.min(width, height) * 0.26}" fill="#ffffff" opacity="0.32" />
    <g transform="translate(${width / 2} ${height / 2}) scale(${artScale}) translate(-256 -256)">
      ${catArt()}
    </g>
  </svg>`;
}

async function generateAndroidAssets() {
  try {
    await access(androidProject);
  } catch {
    console.log('Proyecto Android no encontrado: se omiten iconos y pantallas de inicio.');
    return;
  }

  const launcherSvg = iconSvg({ shape: 'rounded', artScale: 0.9 });
  const roundSvg = iconSvg({ shape: 'circle', artScale: 0.88 });
  const foregroundSvg = adaptiveForegroundSvg(0.64);

  const launcherDensities = [
    ['mdpi', 48, 108],
    ['hdpi', 72, 162],
    ['xhdpi', 96, 216],
    ['xxhdpi', 144, 324],
    ['xxxhdpi', 192, 432],
  ];

  const splashDensities = [
    ['mdpi', 320, 480],
    ['hdpi', 480, 800],
    ['xhdpi', 720, 1280],
    ['xxhdpi', 960, 1600],
    ['xxxhdpi', 1280, 1920],
  ];

  for (const [density, iconSize, foregroundSize] of launcherDensities) {
    const directory = path.join(androidRes, `mipmap-${density}`);
    await mkdir(directory, { recursive: true });

    await Promise.all([
      sharp(Buffer.from(launcherSvg)).resize(iconSize, iconSize).png().toFile(path.join(directory, 'ic_launcher.png')),
      sharp(Buffer.from(roundSvg)).resize(iconSize, iconSize).png().toFile(path.join(directory, 'ic_launcher_round.png')),
      sharp(Buffer.from(foregroundSvg)).resize(foregroundSize, foregroundSize).png().toFile(path.join(directory, 'ic_launcher_foreground.png')),
    ]);
  }

  for (const [density, portraitWidth, portraitHeight] of splashDensities) {
    const portraitDirectory = path.join(androidRes, `drawable-port-${density}`);
    const landscapeDirectory = path.join(androidRes, `drawable-land-${density}`);
    await Promise.all([
      mkdir(portraitDirectory, { recursive: true }),
      mkdir(landscapeDirectory, { recursive: true }),
    ]);

    const portraitSvg = splashSvg(portraitWidth, portraitHeight);
    const landscapeSvg = splashSvg(portraitHeight, portraitWidth);

    await Promise.all([
      sharp(Buffer.from(portraitSvg))
        .png()
        .toFile(path.join(portraitDirectory, 'splash.png')),
      sharp(Buffer.from(landscapeSvg))
        .png()
        .toFile(path.join(landscapeDirectory, 'splash.png')),
    ]);
  }

  const fallbackSvg = splashSvg(480, 320);
  await sharp(Buffer.from(fallbackSvg))
    .png()
    .toFile(path.join(androidRes, 'drawable', 'splash.png'));

  console.log(`Iconos y pantallas de inicio de Android generados en ${path.relative(root, androidRes)}`);
}

async function generate() {
  await mkdir(outputDirectory, { recursive: true });

  const normalSvg = iconSvg({ shape: 'rounded', artScale: 0.94 });
  const maskableSvg = iconSvg({ shape: 'square', artScale: 0.72 });
  const appleSvg = iconSvg({ shape: 'square', artScale: 0.84 });

  await writeFile(path.join(outputDirectory, 'favicon.svg'), normalSvg, 'utf8');

  const pngJobs = [
    ['pwa-192x192.png', normalSvg, 192],
    ['pwa-512x512.png', normalSvg, 512],
    ['maskable-192x192.png', maskableSvg, 192],
    ['maskable-512x512.png', maskableSvg, 512],
    ['apple-touch-icon.png', appleSvg, 180],
    ['favicon-32x32.png', normalSvg, 32],
  ];

  await Promise.all(
    pngJobs.map(([filename, svg, size]) =>
      sharp(Buffer.from(svg))
        .resize(size, size, { fit: 'contain' })
        .png({ compressionLevel: 9 })
        .toFile(path.join(outputDirectory, filename)),
    ),
  );

  await generateAndroidAssets();

  console.log(`Iconos generados en ${path.relative(root, outputDirectory)}`);
}

generate().catch((error) => {
  console.error('No se pudieron generar los iconos:', error);
  process.exitCode = 1;
});
