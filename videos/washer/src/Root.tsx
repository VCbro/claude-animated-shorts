import React from "react";
import { Composition } from "remotion";
import { Film, FILM_FRAMES } from "./washer/Film";
export const Root: React.FC = () => <Composition id="WasherShort" component={Film} durationInFrames={FILM_FRAMES} fps={30} width={1080} height={1920} />;
