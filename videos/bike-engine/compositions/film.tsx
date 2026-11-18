import { Composition, registerRoot } from "raea";
import { EngineFilm } from "./engine/Engine";
import { FPS, totalFrames } from "./engine/kin";

registerRoot(() => (
  <>
    <Composition id="engine-en" component={() => <EngineFilm lang="en" />} width={1080} height={1920} fps={FPS} durationInFrames={totalFrames("en")} />
    <Composition id="engine-hi" component={() => <EngineFilm lang="hi" />} width={1080} height={1920} fps={FPS} durationInFrames={totalFrames("hi")} />
  </>
));
