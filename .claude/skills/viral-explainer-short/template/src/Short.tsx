import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { C } from "./kit/theme";
import { Captions } from "./kit/Caption";
import { SCENES, CAPTION_HIDE, CAPTION_PLACE, CAPTION_MODE, DURATION } from "./story";

/** Scenes back to back (hard cuts) + kinetic captions on top + the final mix. */
export const Short: React.FC<{ audio?: boolean }> = ({ audio = true }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    {SCENES.map((s, i) => {
      const end = i < SCENES.length - 1 ? SCENES[i + 1].from : DURATION;
      return <Sequence key={i} from={s.from} durationInFrames={end - s.from} name={`S${i + 1}`}><s.C o={s.from} d={end - s.from} /></Sequence>;
    })}
    <Captions place={CAPTION_PLACE} hide={CAPTION_HIDE} mode={CAPTION_MODE} />
    {audio && <Audio src={staticFile("mix.wav")} />}
  </AbsoluteFill>
);
