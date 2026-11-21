// Fonts ship inside public/fonts so renders never depend on the network or system fonts.
import { continueRender, delayRender, staticFile } from 'remotion';

const faces: [string, string, string][] = [
  ['Inter', 'fonts/Inter-Regular.otf', '400'],
  ['Inter', 'fonts/Inter-Medium.otf', '500'],
  ['Inter', 'fonts/Inter-SemiBold.otf', '600'],
  ['Inter Display', 'fonts/InterDisplay-Medium.otf', '500'],
  ['Inter Display', 'fonts/InterDisplay-SemiBold.otf', '600'],
  ['JetBrains Mono', 'fonts/JetBrainsMono-Medium.ttf', '500'],
];

let loaded = false;
export function loadFonts() {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('Loading fonts');
  Promise.all(
    faces.map(([family, file, weight]) => {
      const f = new FontFace(family, `url(${staticFile(file)})`, { weight });
      document.fonts.add(f);
      return f.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
}
