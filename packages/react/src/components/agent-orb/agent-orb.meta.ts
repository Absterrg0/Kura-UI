import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "agent-orb",
  name: "AgentOrb",
  category: "voice",
  status: "beta",
  description:
    "Calm, softly glassy voice-agent sphere drawn in a shader: slow colour clouds that breathe when idle, swell with audio and turn while thinking.",
  whenToUse: [
    "The central visual of a voice agent or call screen: idle, listening, thinking, speaking, error.",
    "Showing that an assistant is hearing the user (mic level) or talking back (TTS level).",
    "A 'talk to the agent' entry point inside a button or a card.",
    "An ambient, branded presence for an AI assistant in an empty state.",
  ],
  whenNotToUse: [
    "Precise audio feedback such as a recording meter or waveform — use audio-waveform or voice-dictation.",
    "Text chat 'thinking' feedback inside a message list — use thinking-indicator or shimmer-text.",
    "More than one per view: the orb is the accent element; repeat it and it stops meaning anything.",
  ],
  props: [
    {
      name: "state",
      type: '"idle" | "listening" | "thinking" | "speaking" | "error"',
      default: '"idle"',
      description:
        "What the agent is doing. idle breathes slowly, listening swells with the input level, thinking turns and twists the clouds, speaking lifts with the output level, error shifts to the danger colour and calms down.",
    },
    {
      name: "colors",
      type: '"signal" | "pearl" | "graphite" | "ocean" | "amber" | readonly [string, string, string, string]',
      default: '"signal"',
      description:
        "A palette preset, or four CSS colours `[deep, mid, bright, glint]` = densest clouds, body, light between clouds, rim/sheen (OKLCH, hex, `var(--token)`, `color-mix()`…). `signal` follows the theme: pearl with blue clouds on light pages, graphite with blue clouds on dark. `pearl` and `graphite` are neutral, `ocean` is a deeper blue, `amber` a soft warm option.",
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
        "The WebGL sphere (aria-hidden). The sphere fills ~84% of the box; the rest holds a soft contact shadow on light pages and a faint halo on dark ones.",
    },
    {
      name: "Fallback",
      dataSlot: "agent-orb-fallback",
      description:
        "CSS gradient sphere in the same palette, used when WebGL2 is unavailable; its clouds turn slowly while thinking.",
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
      "No breathing, swirl, flow or audio reaction: a still frame per state. State changes cross-fade colour and brightness over ~0.4s, then rendering stops.",
  },
  dependencies: { npm: [], kura: ["shader-canvas"] },
  related: ["voice-dictation", "audio-waveform", "thinking-indicator", "shader-canvas"],
  tags: ["voice", "orb", "agent", "audio", "webgl", "shader", "assistant", "speaking", "listening"],
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
      title: "States, palettes and audio",
      description: "Every state and preset, driven by a simulated speech analyser.",
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
      description:
        "A scripted call with captions, ShimmerText while thinking and IconButton controls.",
    },
  ],
  agentNotes: [
    'Give it a width (`className="size-48"` or `w-full max-w-64`); it is square. The sphere fills ~84% so the shadow/halo has room — do not clip it with overflow-hidden.',
    "Keep the default `signal` palette when the orb stands for your AI: it is the only blue on a neutral page. Use `pearl` or `graphite` for a quieter, brand-neutral orb.",
    'For real audio: `const mic = useAudioAnalyser({ source: micStream })` for listening and a second analyser on the TTS <audio> element for speaking; switch `analyser` with the state. For demos use `useAudioAnalyser({ simulate: "speech" })`.',
    "`inputLevel`/`outputLevel` are fine for levels you already have (e.g. from a WebRTC SDK) at ≤ 30 updates/s; the shader smooths them.",
    "Changing `state` never restarts the animation: uniforms ease toward the new state, so you can flip states as fast as your agent emits events.",
    "Only one orb per view should be animated; for lists of agents use a static avatar.",
  ],
});
