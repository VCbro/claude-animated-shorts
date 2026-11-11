import React from "react";
import { Composition } from "remotion";
import "./fonts";
import { Short } from "./Short";
import { Samples } from "./Samples";
import { Cine } from "./Cine";
import { DURATION } from "./story";
import { W, H, FPS } from "./kit/theme";

export const Root: React.FC = () => (<>
  <Composition id="Cine" component={Cine} durationInFrames={480} fps={FPS} width={W} height={H} />
  <Composition id="Samples" component={Samples} durationInFrames={6} fps={FPS} width={W} height={H} />
  <Composition id="Short" component={Short} durationInFrames={DURATION} fps={FPS} width={W} height={H} defaultProps={{ audio: true }} />
</>);
