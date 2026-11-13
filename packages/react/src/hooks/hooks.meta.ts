import { defineHook } from "../lib/define-component";

/** Shared hooks, published as `@kura-ui/react/hooks` and as shadcn registry:hook items. */
export default [
  defineHook({
    name: "useControllableState",
    file: "use-controllable-state",
    description:
      "One state API for components that support controlled (value/onChange) and uncontrolled (defaultValue) usage.",
    signature:
      "useControllableState<T>({ value?: T, defaultValue: T, onChange?: (value: T) => void }): [T, (next: T | ((prev: T) => T)) => void]",
    returns: "[value, setValue] — setValue skips unchanged values and always calls onChange.",
    example:
      "const [open, setOpen] = useControllableState({\n  value: props.open,\n  defaultValue: false,\n  onChange: props.onOpenChange,\n});",
    tags: ["state", "controlled", "uncontrolled"],
  }),
  defineHook({
    name: "useReducedMotion",
    file: "use-reduced-motion",
    description: "Live, SSR-safe prefers-reduced-motion flag (false on the server).",
    signature: "useReducedMotion(): boolean",
    returns: "true when the user prefers reduced motion.",
    example:
      "const reduced = useReducedMotion();\n<motion.div transition={reduced ? { duration: 0 } : springs.smooth} />",
    tags: ["motion", "a11y", "reduced-motion"],
  }),
  defineHook({
    name: "useHotkey",
    file: "use-hotkey",
    description:
      "Bind a keyboard shortcut on document (or a target). `mod` = ⌘ on Apple, Ctrl elsewhere. Exact modifier matching.",
    signature:
      "useHotkey(keys: readonly KeyName[] | null, handler: (e: KeyboardEvent) => void, options?: { enabled?: boolean; preventDefault?: boolean; allowInInputs?: boolean; allowInOverlays?: boolean; target?: EventTarget | null; onKeyUp?: (e: KeyboardEvent) => void }): void",
    returns: "void",
    notes: [
      "Without a modifier, the shortcut is ignored while typing in inputs unless allowInInputs is true.",
      "A key another handler already took (event.defaultPrevented) is ignored, so a menu closing on Esc does not also fire a page shortcut.",
      "allowInOverlays: false keeps a page-level shortcut from firing while focus is inside an open dialog, menu or listbox, and leaves Esc to an open tooltip, menu or dialog.",
    ],
    example: 'useHotkey(["mod", "enter"], () => submit());',
    tags: ["keyboard", "shortcut", "hotkey"],
  }),
  defineHook({
    name: "useIsApplePlatform",
    file: "use-platform",
    description: "Hydration-safe macOS/iOS detection for rendering ⌘ vs Ctrl.",
    signature: "useIsApplePlatform(): boolean",
    returns: "true on Apple platforms (false during SSR and the first client render).",
    example: 'const apple = useIsApplePlatform();\nconst label = apple ? "⌘K" : "Ctrl K";',
    tags: ["platform", "keyboard"],
  }),
  defineHook({
    name: "useAudioAnalyser",
    file: "use-audio-analyser",
    description:
      "Web Audio analysis of a mic MediaStream or <audio>/<video> element → level, log-spaced bands and waveform, with a deterministic simulated mode (speech | music | silence) for demos and tests. SSR-safe.",
    signature:
      "useAudioAnalyser({ source?: MediaStream | HTMLMediaElement | null, simulate?: boolean | 'speech' | 'music' | 'silence', bands?: number = 32, fftSize?: number = 1024, smoothing?: number = 0.8, minDecibels?: number = -90, maxDecibels?: number = -10, enabled?: boolean = true }): { status: 'idle' | 'running' | 'simulated' | 'unsupported' | 'error', error: Error | null, read(): AudioFrame, subscribe(listener: (frame: AudioFrame) => void): () => void }",
    returns:
      "AudioFrame = { level: 0..1, peak: 0..1, bands: Float32Array (0..1), waveform: Float32Array (-1..1), time: ms }",
    notes: [
      "Frames are not React state. Use subscribe() for canvas/WebGL, or useAudioFrame(analyser, { fps }) for throttled React rendering.",
      "Arrays in a frame are reused between frames — copy them if you keep them.",
      "A media element is wired once and kept audible; mic streams are never connected to speakers.",
    ],
    example:
      "const rec = useMediaRecorder();\nconst analyser = useAudioAnalyser({\n  source: rec.stream,\n  simulate: !rec.stream && 'silence',\n  bands: 24,\n});\nconst { bands } = useAudioFrame(analyser, { fps: 30 });",
    tags: ["audio", "voice", "waveform", "visualizer", "microphone", "web-audio"],
  }),
  defineHook({
    name: "useAudioFrame",
    file: "use-audio-analyser",
    description:
      "Throttled React-state snapshot of a useAudioAnalyser for simple DOM visualisations.",
    signature:
      "useAudioFrame(analyser: AudioAnalyser, { fps?: number = 30 }): { level: number; peak: number; bands: number[]; waveform: number[] }",
    returns: "A copied snapshot, updated at most `fps` times per second.",
    example: "const { level } = useAudioFrame(analyser, { fps: 20 });",
    tags: ["audio", "visualizer"],
  }),
  defineHook({
    name: "useMediaRecorder",
    file: "use-media-recorder",
    description:
      "MediaRecorder wrapper with explicit permission/denied/unsupported states, pause/resume, duration and a final Blob.",
    signature:
      "useMediaRecorder({ constraints?: MediaStreamConstraints = { audio: true }, mimeType?: string, timeslice?: number, onDataAvailable?, onStop?, onError? }): { status: 'idle' | 'requesting' | 'recording' | 'paused' | 'stopped' | 'denied' | 'unsupported' | 'error', isSupported, isRecording, stream, blob, mimeType, error, durationMs, start(): Promise<MediaStream | null>, stop(): Promise<Blob | null>, pause(), resume(), reset() }",
    returns: "Controls and state; `stream` is live while recording (feed it to useAudioAnalyser).",
    notes: ["Tracks are stopped on stop/reset/unmount so the mic indicator turns off."],
    example:
      "const rec = useMediaRecorder({ onStop: (blob) => upload(blob) });\n<button onClick={rec.isRecording ? rec.stop : rec.start}>…</button>",
    tags: ["audio", "recording", "microphone", "voice"],
  }),
  defineHook({
    name: "useSpeechRecognition",
    file: "use-speech-recognition",
    description:
      "Web Speech API speech-to-text with interim results; reports unsupported (e.g. Firefox) so you can fall back to recording + server transcription.",
    signature:
      "useSpeechRecognition({ lang?: string, continuous?: boolean = true, interimResults?: boolean = true, onResult?, onEnd?, onError? }): { status: 'idle' | 'listening' | 'denied' | 'unsupported' | 'error', isSupported, isListening, transcript, finalTranscript, interimTranscript, error, start(), stop(), abort(), reset() }",
    returns: "Transcripts and controls. `transcript` = final + interim.",
    example:
      "const speech = useSpeechRecognition({ lang: 'en-US' });\n<textarea value={speech.transcript} readOnly />",
    tags: ["speech", "dictation", "voice", "transcription"],
  }),
  defineHook({
    name: "useElapsed",
    file: "use-elapsed",
    description:
      "Live elapsed time since a start instant while something is running, frozen when it stops. SSR-safe (null until mounted).",
    signature:
      "useElapsed(since: Date | number | null | undefined, running: boolean, interval?: number): number | null",
    returns: "Milliseconds since `since`, or null before mount or without a start time.",
    example:
      'const ms = useElapsed(run.startedAt, run.status === "running");\n<span>{ms == null ? "—" : formatClock(ms)}</span>',
    tags: ["timer", "elapsed", "agent"],
  }),
  defineHook({
    name: "useFocusFallback",
    file: "use-focus-fallback",
    description:
      "Keeps keyboard focus inside a widget when the control that held it is removed (a Remove key whose row is gone, a Stop key that unmounts), instead of letting it fall to <body>.",
    signature:
      "useFocusFallback<T extends HTMLElement>(ref: React.RefObject<T | null>, fallback?: (gap: { next: Element | null; previous: Element | null }) => HTMLElement | null | undefined): void",
    returns: "void",
    notes: [
      "Give the root tabIndex={-1} and a visible focus ring: it receives focus unless `fallback` returns a better place. `fallback` is told what sat on either side of the removed element (`gap.next`, `gap.previous`), so a list can focus the row that took its place.",
      "Focus only moves when it was really lost (document.activeElement is <body>); a person who already moved elsewhere is left alone.",
    ],
    example:
      "const root = React.useRef<HTMLUListElement>(null);\nuseFocusFallback(root, (gap) =>\n  (gap.next ?? gap.previous)?.querySelector<HTMLElement>('button'),\n);\nreturn <ul ref={root} tabIndex={-1}>…</ul>;",
    tags: ["focus", "a11y", "keyboard"],
  }),
];
