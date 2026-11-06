import React from "react";
import { Composition } from "remotion";
import { Film, FILM_FRAMES } from "./mixer/Film";
export const Root: React.FC = () => <Composition id="MixerShort" component={Film} durationInFrames={FILM_FRAMES} fps={30} width={1080} height={1920} />;
