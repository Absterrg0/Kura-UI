import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "audio-waveform",
  name: "AudioWaveform",
  category: "voice",
  status: "beta",
  description:
    "Canvas audio visualiser — live bars, mirrored history or oscilloscope line from a mic or media element, or recorded peaks with a seek scrubber.",
  whenToUse: [
    "Show that the mic is live while dictating or talking to a voice agent (mirrored history).",
    "Visualise playback of a model's spoken reply or an <audio> element (spectrum bars or line).",
    "A recorded voice note / audio attachment with a played/unplayed split and drag-to-seek.",
  ],
  whenNotToUse: [
    "A complete dictation control with permissions, transcript and states — use voice-dictation (it renders this).",
    "An ambient “the agent is speaking” blob — use agent-orb.",
    "A non-audio progress indicator — use a progress bar or context-meter.",
  ],
  props: [
    {
      name: "analyser",
      type: "AudioAnalyser",
      description: "Live analyser from useAudioAnalyser. Share one between several visuals.",
    },
    {
      name: "source",
      type: "MediaStream | HTMLMediaElement | null",
      description: "Mic stream or media element to analyse internally when no analyser is passed.",
    },
    {
      name: "simulate",
      type: 'boolean | "speech" | "music" | "silence"',
      description: "Synthetic data for docs, previews and pre-permission states.",
    },
    {
      name: "peaks",
      type: "readonly number[]",
      description:
        "Static mode: amplitudes 0..1 of any length (resampled to the bar count). Build them with peaksFromSamples().",
    },
    {
      name: "progress",
      type: "number",
      description: "Playback position 0..1 in static mode; bars after it are faded.",
    },
    {
      name: "onSeek",
      type: "(progress: number) => void",
      description:
        "Turns the waveform into a seek slider (drag, click, arrow keys). Receives 0..1.",
    },
    {
      name: "duration",
      type: "number",
      description: "Duration in seconds for the slider's spoken value (“0:12 of 1:04”).",
    },
    {
      name: "variant",
      type: '"bars" | "mirrored" | "line"',
      default: '"mirrored"',
      description:
        "bars = bottom-aligned, mirrored = symmetric around the centre line, line = oscilloscope (live) or filled envelope (static).",
    },
    {
      name: "display",
      type: '"history" | "spectrum"',
      description:
        "Live data for bars/mirrored: history scrolls recent loudness right→left, spectrum shows frequency bands. Default: history for mirrored, spectrum for bars.",
    },
    { name: "barWidth", type: "number", default: "3", description: "Bar width in CSS px." },
    { name: "barGap", type: "number", default: "2", description: "Gap between bars in CSS px." },
    {
      name: "minBarHeight",
      type: "number",
      default: "2",
      description: "Minimum bar height so silence reads as a dotted baseline.",
    },
    {
      name: "tone",
      type: '"default" | "muted" | "accent"',
      default: '"default"',
      description:
        "Colour from tokens: ink, subtle ink, or the blue accent (only for live AI listening — once per view).",
    },
    {
      name: "active",
      type: "boolean",
      default: "true",
      description: "Pause the live animation; the last frame stays on screen.",
    },
    {
      name: "label",
      type: "string",
      description: 'Accessible name. Default "Audio waveform", or "Seek" when onSeek is set.',
    },
  ],
  parts: [
    {
      name: "AudioWaveform",
      dataSlot: "audio-waveform",
      description:
        "Root sized by CSS (default h-10 w-full). data-mode = live | static, data-variant, data-status (analyser status), data-scrubbing.",
    },
  ],
  a11y: {
    role: "img (display) or slider (with onSeek)",
    notes: [
      "Display-only waveforms are role=img with a label; the canvas itself is aria-hidden.",
      "With onSeek it is a focusable slider with aria-valuenow (0–100) and aria-valuetext (“0:12 of 1:04” when duration is set).",
      "Colours come from tokens via currentColor, so contrast follows light/dark themes automatically.",
      "Pair live waveforms with a text status (“Listening”, “Muted”) — the visual alone is not an accessible state.",
    ],
    keyboard: [
      { keys: "ArrowRight / ArrowUp", action: "Seek forward 5% (Shift: 10%)" },
      { keys: "ArrowLeft / ArrowDown", action: "Seek back 5% (Shift: 10%)" },
      { keys: "Home / End", action: "Start / end" },
    ],
    reducedMotion:
      "Live data becomes a calm level meter redrawn ~6×/s without sub-frame scrolling; static waveforms are unaffected.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["voice-dictation", "agent-orb", "attachment"],
  tags: ["audio", "waveform", "visualizer", "canvas", "voice", "microphone", "spectrum", "player"],
  examples: [
    { name: "AudioWaveformMinimal", kind: "minimal", title: "Simulated live input" },
    {
      name: "AudioWaveformFull",
      kind: "full",
      title: "Player with scrub, and every variant",
      description:
        "Recorded peaks with play/pause, drag-to-seek and a timer; below, bars/spectrum, mirrored/history and line.",
    },
    {
      name: "AudioWaveformVoiceNote",
      kind: "composition",
      title: "Voice note in a chat bubble",
      description: "A compact muted waveform with an icon-button play control.",
    },
  ],
  agentNotes: [
    'Size it with CSS (className="h-8 w-48"); the canvas tracks the element size and device pixel ratio automatically.',
    "For a mic: const rec = useMediaRecorder(); <AudioWaveform source={rec.stream} />. For playback pass the <audio> element as source.",
    "Pass one `analyser` to several visuals instead of creating an analyser per component.",
    "peaksFromSamples(audioBuffer.getChannelData(0), 200) turns decoded audio into peaks.",
    'Use tone="accent" only while the AI is actively listening, and only once per view.',
  ],
});
