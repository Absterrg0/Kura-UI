import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "voice-dictation",
  name: "VoiceDictation",
  category: "voice",
  status: "experimental",
  description:
    "Mic button that expands into a live waveform pill with a timer and live transcript; speech-to-text with recording fallback, toggle or hold-to-talk.",
  whenToUse: [
    "Let users dictate a prompt instead of typing — standalone or in a composer toolbar.",
    'Push-to-talk input (mode="hold") for voice notes or quick commands.',
    "Browsers without the Web Speech API: record audio and transcribe on your server via `transcribe`.",
  ],
  whenNotToUse: [
    "A full-duplex conversation with a voice agent (barge-in, spoken replies) — use agent-orb with your realtime session.",
    "Only visualising audio you already have — use audio-waveform.",
    "Typing prompts — use composer.",
  ],
  props: [
    {
      name: "onTranscript",
      type: "(text: string) => void",
      description:
        "Called once per dictation with the final trimmed text. Not called when cancelled (× or Escape) or when nothing was heard.",
    },
    {
      name: "onInterim",
      type: "(text: string) => void",
      description: "Live text (final + interim) while listening, e.g. to preview in a placeholder.",
    },
    {
      name: "onStatusChange",
      type: "(status: VoiceDictationStatus) => void",
      description: "idle | requesting | listening | processing | denied | unsupported | error.",
    },
    {
      name: "mode",
      type: '"toggle" | "hold"',
      default: '"toggle"',
      description:
        "toggle = click to start/stop; hold = dictate while the pointer, Space/Enter or the hotkey is held.",
    },
    {
      name: "hotkey",
      type: "readonly KeyName[] | null",
      default: '["mod", "shift", "d"]',
      description: "Global shortcut (works while typing). null disables it.",
    },
    {
      name: "lang",
      type: "string",
      description: 'BCP-47 language for recognition, e.g. "en-US". Defaults to the page language.',
    },
    {
      name: "transcribe",
      type: "(audio: Blob) => Promise<string>",
      description:
        "Fallback transcription when the Web Speech API is missing (Firefox): receives the recording; status is “processing” until it resolves.",
    },
    {
      name: "simulate",
      type: "boolean | string",
      description:
        "Demo mode: fake permission, simulated waveform and a scripted transcript (a string is typed out word by word). For docs and tests.",
    },
    {
      name: "showTranscript",
      type: "boolean",
      default: "true",
      description: "Show the live transcript card under the control. Turn off inside a composer.",
    },
    {
      name: "transcriptPlaceholder",
      type: "string",
      default: '"Listening…"',
      description: "Text in the transcript card before words arrive.",
    },
    { name: "disabled", type: "boolean", default: "false", description: "Disable the control." },
  ],
  parts: [
    {
      name: "VoiceDictation",
      dataSlot: "voice-dictation",
      description: "Root column. data-status (see onStatusChange) and data-mode.",
    },
    {
      name: "VoiceDictationControl",
      dataSlot: "voice-dictation-control",
      description:
        "The mic button; while live it grows (layout spring) into a signal-tinted pill with waveform, timer and cancel.",
    },
    {
      name: "VoiceDictationButton",
      dataSlot: "voice-dictation-button",
      description:
        "Mic / stop / mic-off button with aria-pressed and a tooltip showing the hotkey.",
    },
    {
      name: "VoiceDictationCancel",
      dataSlot: "voice-dictation-cancel",
      description: "× button that discards the dictation.",
    },
    {
      name: "VoiceDictationTranscript",
      dataSlot: "voice-dictation-transcript",
      description:
        "Live transcript: final words in ink, interim words subtle, a signal caret while listening.",
    },
    {
      name: "VoiceDictationMessage",
      dataSlot: "voice-dictation-message",
      description: "Recovery text for denied / unsupported / error.",
    },
  ],
  a11y: {
    notes: [
      "The button is labelled “Dictate” (or “Hold to dictate”) with aria-pressed reflecting listening; the stop/mic icon swap is visual only.",
      "A visually hidden role=status announces state changes once (“Listening”, “Transcribing”, “Microphone access is blocked”) — never per word.",
      "Denied and unsupported states keep a visible text explanation and the button stays reachable to retry.",
      "The waveform is decorative (aria-hidden); the timer is plain text with tabular numbers.",
    ],
    keyboard: [
      { keys: "Enter / Space", action: "Toggle dictation (hold them in hold mode)" },
      { keys: "Mod+Shift+D", action: "Global toggle / hold (configurable via hotkey)" },
      { keys: "Escape", action: "Cancel and discard while listening" },
    ],
    reducedMotion:
      "The pill appears without the layout spring, icon swaps fade without scale or blur, the waveform becomes a slow level meter and the caret stops blinking.",
  },
  dependencies: {
    npm: ["lucide-react", "motion"],
    kura: ["audio-waveform", "shimmer-text", "spinner", "tooltip"],
  },
  related: ["composer", "audio-waveform", "agent-orb"],
  tags: [
    "voice",
    "dictation",
    "speech-to-text",
    "microphone",
    "push-to-talk",
    "transcription",
    "waveform",
  ],
  examples: [
    { name: "VoiceDictationMinimal", kind: "minimal", title: "Toggle with live transcript" },
    {
      name: "VoiceDictationFull",
      kind: "full",
      title: "Toggle or hold, hotkey and collected notes",
      description: "Switch modes, use ⌘⇧D, and watch final transcripts collect below.",
    },
    {
      name: "VoiceDictationInComposer",
      kind: "composition",
      title: "Dictating into a composer",
      description:
        "Interim words preview in the placeholder; the final transcript is appended to the composer value.",
    },
  ],
  agentNotes: [
    "In docs, demos and tests pass `simulate` — real recognition needs a user gesture, mic permission and (for Chrome) a network connection.",
    "Feed a Composer by controlling its value: onTranscript={(t) => setValue((v) => (v ? v + ' ' + t : t))}; pass showTranscript={false}.",
    "Provide `transcribe` for Firefox/other browsers without SpeechRecognition; without it those browsers record but emit nothing.",
    "Only one mounted instance should own a given hotkey; pass hotkey={null} on the others.",
    "The listening pill uses the jade signal — avoid another accent-filled element in the same view while dictating.",
  ],
});
