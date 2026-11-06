import React from "react";
import { Composition } from "remotion";
import "./fonts";
import { Short } from "./Short";
import { DURATION } from "./story";
import { W, H, FPS } from "./kit/theme";

export const Root: React.FC = () => (
  <Composition id="Short" component={Short} durationInFrames={DURATION} fps={FPS} width={W} height={H} defaultProps={{ audio: true }} />
);
