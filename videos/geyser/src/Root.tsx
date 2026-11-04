import React from "react";
import { Composition } from "remotion";
import { Film, FILM_FRAMES } from "./geyser/Film";
export const Root: React.FC = () => <Composition id="GeyserShort" component={Film} durationInFrames={FILM_FRAMES} fps={30} width={1080} height={1920} />;
