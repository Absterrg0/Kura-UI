/**
 * One-line, human summaries for the components index cards. The manifest descriptions are written
 * for agents (complete, dense); a card needs a sentence a person reads at a glance. Components not
 * listed fall back to the first clause of their description.
 */
const SUMMARIES: Record<string, string> = {
  "agent-fleet": "Parallel subagents at a glance: status, activity, progress and cost.",
  "agent-orb": "A calm shader sphere that breathes with a voice agent.",
  "agent-timeline": "A vertical plan tracker for multi-step agent work.",
  "approval-prompt": "Ask before risky actions. Approve with ⌘↵, deny with Esc.",
  "artifact-card": "A card for something the agent made: a doc, code, a page or an image.",
  attachment: "File and image chips with upload progress, errors and retry.",
  "audio-waveform": "Live bars or an oscilloscope line from a mic or media element.",
  "browser-session": "Computer use made legible: the page, the cursor and each step.",
  button: "Six variants, four sizes, a loading state and a tactile press.",
  checkpoints: "Restore points across a run. Roll back to any of them.",
  citation: "Numbered source pills with a hover preview of the page.",
  "code-block": "Highlighted code with a filename, copy, line numbers and diffs.",
  "command-palette": "A ⌘K palette for agent actions, with groups and async search.",
  composer: "The prompt box: auto-growing, attachments, send that turns into stop.",
  "context-meter": "How full the context window is, as a ring or a bar.",
  "diff-view": "Review the agent's edits and accept or reject each hunk.",
  "file-changes": "The files the agent touched, as a tree with +/− counts.",
  "icon-button": "Square icon button with a required label and a tooltip.",
  kbd: "Keys and shortcuts, ⌘ on Apple and Ctrl elsewhere.",
  "kbd-shortcut": "A labelled shortcut hint that can bind the shortcut too.",
  message: "A chat message with actions, branches and streaming states.",
  "model-picker": "Choose a model, grouped by provider, with capabilities.",
  popover: "A floating panel anchored to a trigger.",
  "prompt-queue": "Follow-ups queued while the agent works. Reorder or send now.",
  "prompt-suggestions": "Starter prompts for an empty chat.",
  reasoning: "A collapsible thinking trace that settles into “Thought for 12s”.",
  "run-header": "One run at a glance: status, clock, tokens, cost and stop.",
  "shader-canvas": "A small WebGL2 fragment-shader runner.",
  "shimmer-text": "The “Thinking…” label: a gradient sweep across text.",
  "slash-command-menu": "An inline “/” menu anchored to the caret.",
  spinner: "A quiet ring spinner for indeterminate loading.",
  "status-glyph": "The shared status icon: queued, running, waiting, done, failed.",
  "streaming-text": "Token-by-token output with an even, calm reveal.",
  "task-list": "The agent's plan as a todo list, updating as it works.",
  terminal: "Streamed command output with real ANSI colours and exit codes.",
  "thinking-indicator": "Compact thinking indicators: dots, pulse, orbit or wave.",
  "tool-call": "One tool call: its status, arguments and result.",
  tooltip: "A short label on hover or focus, with an optional shortcut.",
  "trace-waterfall": "Every span of a run on one time axis.",
  "voice-dictation": "A mic button that becomes a live waveform and transcript.",
};

export function summaryFor(slug: string, description: string): string {
  if (SUMMARIES[slug]) return SUMMARIES[slug];
  const first = description.split(/[:.](\s|$)/)[0] ?? description;
  return first.endsWith(".") ? first : `${first}.`;
}
