import React from "react";
import { Composition } from "remotion";
import { Film, FILM_FRAMES } from "./ac/Film";
export const Root: React.FC = () => <Composition id="AcCoolerShort" component={Film} durationInFrames={FILM_FRAMES} fps={30} width={1080} height={1920} />;
