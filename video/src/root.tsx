import "./styles.css";
import { Composition } from "remotion";
import { PROOF_FRAMES, Proof } from "./film/proof";
import { patchClock } from "./lib/clock";
import { loadFonts } from "./lib/fonts";

patchClock();
loadFonts();

export function Root() {
  return (
    <>
      <Composition
        id="KuraProof"
        component={Proof}
        durationInFrames={PROOF_FRAMES}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ audio: true }}
      />
      <Composition
        id="KuraProofSilent"
        component={Proof}
        durationInFrames={PROOF_FRAMES}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ audio: false }}
      />
    </>
  );
}
