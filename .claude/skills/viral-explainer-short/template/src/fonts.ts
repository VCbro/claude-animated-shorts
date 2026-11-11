import "@fontsource/anton/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import { continueRender, delayRender } from "remotion";
// Make every frame wait until the webfonts are ready (also needed for canvas textures that draw text).
const h = delayRender("fonts");
Promise.all(["400 20px Anton", "500 20px Inter", "800 20px Inter", "900 20px Inter", "500 20px 'JetBrains Mono'", "700 20px 'JetBrains Mono'"].map((f) => document.fonts.load(f)))
  .then(() => document.fonts.ready).then(() => continueRender(h));
