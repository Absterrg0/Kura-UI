import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "agent-orb",
  name: "AgentOrb",
  category: "voice",
  status: "beta",
  description:
    "The voice-agent orb: a sphere drawn as a halftone of dots in a shader. The dots breathe when idle, ripple with audio and carry a light round while thinking.",
  whenToUse: [
    "The central visual of a voice agent or call screen: idle, listening, thinking, speaking, error.",
    "Showing that an assistant is hearing the user (mic level) or talking back (TTS level).",
    "A 'talk to the agent' entry point inside a button or a card.",
    "An ambient, branded presence for an AI assistant in an empty state.",
  ],
  whenNotToUse: [
    "Precise audio feedback such as a recording meter or waveform — use audio-waveform or voice-dictation.",
    "Text chat 'thinking' feedback inside a message list — use thinking-indicator or status-glyph.",
    "A face for a named agent in a list — use agent-sigil. The orb is the one large presence on a voice screen.",
  ],
  props: [
    {
      name: "state",
      type: '"idle" | "listening" | "thinking" | "speaking" | "error"',
      default: '"idle"',
      description:
        "What the agent is doing. idle breathes slowly, listening sends rings out from the centre with the input level, thinking carries one bright band round the ball (the running-glyph motion), speaking pulses with the output level, error shifts to the danger colour and calms down.",
    },
    {
      name: "color",
      type: "string",
      default: '"var(--kura-fg)"',
      description:
        "Dot colour: any CSS colour (OKLCH, hex, `var(--token)`, `color-mix()`…). Default the ink, so it follows the theme. `error` always uses the danger colour.",
    },
    {
      name: "dots",
      type: "number",
      default: "19",
      description:
        "Dots across the diameter (5–61). Fewer reads bolder, more reads finer; an odd count puts one dot on the centre.",
    },
    {
      name: "analyser",
      type: "AudioAnalyser",
      description:
        "From `useAudioAnalyser`. Its level drives the orb while listening or speaking. Read every frame on the GPU loop — no React re-renders.",
    },
    {
      name: "inputLevel",
      type: "number",
      description: "Microphone level 0–1 used while `listening`. Overrides `analyser`.",
    },
    {
      name: "outputLevel",
      type: "number",
      description: "Agent voice level 0–1 used while `speaking`. Overrides `analyser`.",
    },
    {
      name: "label",
      type: "string",
      description:
        "Accessible text for the state. Default: Voice agent idle / Listening / Thinking / Speaking / Voice agent error.",
    },
    {
      name: "announce",
      type: "boolean",
      default: "true",
      description:
        "Render the label in a polite live region. Set false when several orbs are on screen or a parent already announces the state.",
    },
    { name: "maxDpr", type: "number", default: "2", description: "Device-pixel-ratio cap." },
  ],
  parts: [
    {
      name: "AgentOrb",
      dataSlot: "agent-orb",
      description:
        "Square root (`aspect-square`); size it with a width class. `data-state` mirrors `state`.",
    },
    {
      name: "ShaderCanvas",
      dataSlot: "agent-orb-canvas",
      description:
        "The WebGL halftone (aria-hidden), transparent between the dots. The ball fills ~94% of the box; there is no glow, shadow or background.",
    },
    {
      name: "Fallback",
      dataSlot: "agent-orb-fallback",
      description:
        "The same ball as two rings of CSS dots (large in the middle, small toward the limb), used when WebGL2 is unavailable; it pulses gently while thinking.",
    },
  ],
  a11y: {
    role: "status",
    notes: [
      "The canvas is decorative (aria-hidden). The state is exposed as visually hidden text in a role=status live region, announced politely when it changes.",
      "Audio levels are never announced. Pass `label` to describe custom situations (e.g. “Muted”).",
      "If the orb is inside a button, give the button its own aria-label and set `announce={false}` to avoid double announcements.",
    ],
    keyboard: [],
    reducedMotion:
      "No breathing, orbit, flow or audio reaction: a still frame per state. State changes ease dot size and colour over ~0.4s, then rendering stops.",
  },
  dependencies: { npm: [], kura: ["shader-canvas"] },
  related: ["voice-dictation", "audio-waveform", "thinking-indicator", "shader-canvas"],
  tags: [
    "voice",
    "orb",
    "agent",
    "audio",
    "webgl",
    "shader",
    "halftone",
    "dots",
    "speaking",
    "listening",
  ],
  examples: [
    {
      name: "AgentOrbMinimal",
      kind: "minimal",
      title: "Idle orb",
      description: "Size it with a class; it breathes slowly.",
    },
    {
      name: "AgentOrbFull",
      kind: "full",
      title: "States, density and audio",
      description: "Every state at three dot densities, driven by a simulated speech analyser.",
    },
    {
      name: "AgentOrbStates",
      kind: "state",
      title: "All five states",
      description: "idle, listening, thinking, speaking and error side by side.",
    },
    {
      name: "AgentOrbVoiceSession",
      kind: "composition",
      title: "Voice session card",
      description: "A scripted call with captions and IconButton controls.",
    },
  ],
  agentNotes: [
    'Give it a width (`className="size-48"` or `w-full max-w-64`); it is square and transparent, so it sits on any surface.',
    "Leave `color` alone: the orb is ink, like every other dot in Kura. Never make it ember; ember means a person is needed.",
    "Pick `dots` for the size: about 13 below 96px, 19 around 200px, 27 above 300px.",
    'For real audio: `const mic = useAudioAnalyser({ source: micStream })` for listening and a second analyser on the TTS <audio> element for speaking; switch `analyser` with the state. For demos use `useAudioAnalyser({ simulate: "speech" })`.',
    "`inputLevel`/`outputLevel` are fine for levels you already have (e.g. from a WebRTC SDK) at ≤ 30 updates/s; the shader smooths them.",
    "Changing `state` never restarts the animation: uniforms ease toward the new state, so you can flip states as fast as your agent emits events.",
    "Only one orb per view should be animated; for lists of agents use a static avatar.",
  ],
});
