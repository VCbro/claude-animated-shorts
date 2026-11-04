import React from "react";
import { Composition } from "remotion";
import { Sheet } from "./cast/Sheet";
export const Root: React.FC = () => <Composition id="CastSheet" component={Sheet} durationInFrames={60} fps={30} width={1080} height={1920} />;
