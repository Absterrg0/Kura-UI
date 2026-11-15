import "./styles.css";
import { Composition } from "remotion";
import { FILM_FRAMES, Film } from "./film";
import { patchClock } from "./lib/clock";
import { loadFonts } from "./lib/fonts";

patchClock();
loadFonts();

export function Root() {
  return (
    <>
      <Composition
        id="KuraLaunch"
        component={Film}
        durationInFrames={FILM_FRAMES}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ audio: true }}
      />
      <Composition
        id="KuraLaunchSilent"
        component={Film}
        durationInFrames={FILM_FRAMES}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ audio: false }}
      />
    </>
  );
}
