import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "composer",
  name: "Composer",
  category: "input",
  status: "beta",
  description:
    "Prompt input for chat and agents: auto-growing textarea, attachments, toolbar slot, send→stop button, paste/drop files and a length hint.",
  whenToUse: [
    "The message box of a chat UI or agent console (“Ask anything…”).",
    "Any prompt field that should send on Enter, accept pasted or dropped files, and stop a streaming response.",
    "A prompt input that hosts a model picker, tool toggles, voice input or a slash-command menu in its toolbar.",
  ],
  whenNotToUse: [
    "A single-line search or filter field — use a plain input or command-palette.",
    "Showing attachments outside an input (sent messages, file lists) — use attachment.",
    "Picking a model on its own — use model-picker.",
    "Voice-only input — use voice-dictation (it can also feed a composer).",
  ],
  props: [
    { name: "value", type: "string", description: "Controlled text." },
    {
      name: "defaultValue",
      type: "string",
      default: '""',
      description: "Initial text when uncontrolled.",
    },
    {
      name: "onValueChange",
      type: "(value: string) => void",
      description: "Called on every text change.",
    },
    {
      name: "attachments",
      type: "AttachmentItem[]",
      description:
        "Controlled attachments ({ id, name, size?, type?, url?, status?, progress?, error?, file? }).",
    },
    {
      name: "defaultAttachments",
      type: "AttachmentItem[]",
      description: "Initial attachments when uncontrolled.",
    },
    {
      name: "onAttachmentsChange",
      type: "(attachments: AttachmentItem[]) => void",
      description: "Called when files are added or removed.",
    },
    {
      name: "onFilesAdded",
      type: "(items: AttachmentItem[]) => void",
      description:
        "Called with newly accepted files (paste, drop or picker) — start uploads here and update `attachments` with status/progress.",
    },
    {
      name: "onFilesRejected",
      type: "(files: File[]) => void",
      description: "Called with files rejected by accept, maxFileSize or maxFiles.",
    },
    {
      name: "onSubmit",
      type: "(message: ComposerMessage) => void",
      description:
        "Send handler: receives { text (trimmed), attachments }. Not called while empty, over maxLength, uploading or busy.",
    },
    {
      name: "onStop",
      type: "() => void",
      description:
        "Called by the stop button and by Escape while status is submitted or streaming.",
    },
    {
      name: "status",
      type: '"idle" | "submitted" | "streaming" | "error"',
      default: '"idle"',
      description:
        "Request lifecycle. submitted = waiting for the first token (the chasing ring on the send key), streaming = model writing (stop key).",
    },
    {
      name: "disabled",
      type: "boolean",
      default: "false",
      description: "Disable typing, attaching and sending (60% opacity).",
    },
    {
      name: "maxLength",
      type: "number",
      description:
        "Character limit. The hint turns ink at 90% and red above; sending is blocked when over.",
    },
    {
      name: "submitKey",
      type: '"enter" | "mod+enter"',
      default: '"enter"',
      description:
        "enter = Enter sends and Shift+Enter adds a newline; mod+enter = ⌘/Ctrl+Enter sends and Enter adds a newline.",
    },
    {
      name: "accept",
      type: "string | false",
      default: '""',
      description:
        'Allowed files, like <input accept> ("image/*,.pdf"). "" accepts any file; false disables attachments entirely.',
    },
    { name: "maxFiles", type: "number", description: "Maximum number of attachments." },
    { name: "maxFileSize", type: "number", description: "Maximum size of one file in bytes." },
    {
      name: "clearOnSubmit",
      type: "boolean",
      default: "true",
      description: "Clear text and attachments after a submit.",
    },
    {
      name: "placeholder",
      type: "string",
      description: "Placeholder for the default layout (only used when Composer has no children).",
    },
  ],
  parts: [
    {
      name: "Composer",
      dataSlot: "composer",
      description:
        "Root and drop target. data-status, data-focused, data-dragging, data-disabled; aria-busy while submitted/streaming. With no children it renders the complete default layout.",
    },
    {
      name: "ComposerAttachments",
      dataSlot: "composer-attachments",
      description:
        "The attachment row (renders nothing when empty). Uses attachment's AttachmentList.",
      props: [
        { name: "max", type: "number", description: "Collapse into a +N stack after this many." },
      ],
    },
    {
      name: "ComposerInput",
      dataSlot: "composer-input",
      description:
        "Auto-growing <textarea>. Enter/Shift+Enter, IME-safe, paste files, Escape stops. Accepts all textarea props.",
      props: [
        { name: "minRows", type: "number", default: "1", description: "Rows when empty." },
        {
          name: "maxRows",
          type: "number",
          default: "8",
          description: "Rows before it scrolls instead of growing.",
        },
      ],
    },
    {
      name: "ComposerToolbar",
      dataSlot: "composer-toolbar",
      description: "Bottom row; holds ComposerTools (left) and ComposerActions (right).",
    },
    {
      name: "ComposerTools",
      dataSlot: "composer-tools",
      description: "Left group: attach button, model-picker, tool toggles.",
    },
    {
      name: "ComposerActions",
      dataSlot: "composer-actions",
      description: "Right group: hint, voice-dictation, submit.",
    },
    {
      name: "ComposerAttachButton",
      dataSlot: "composer-attach",
      description: "Paperclip icon button that opens the file picker.",
      props: [
        {
          name: "label",
          type: "string",
          default: '"Attach files"',
          description: "Accessible label and tooltip.",
        },
        { name: "icon", type: "React.ReactNode", description: "Replace the paperclip." },
      ],
    },
    {
      name: "ComposerHint",
      dataSlot: "composer-hint",
      description:
        "Character count with a dial (with maxLength) or a ~token estimate. It takes the room the row has left and measures it: in a tight toolbar the limit (or the unit) goes first, then the whole hint, so it never lands on a tool. Over the limit it always shows (it is why Send is blocked): a toolbar too full for it wraps the actions onto a second row. The field's spoken description is always complete. data-level = ok | near | over.",
      props: [
        {
          name: "mode",
          type: '"characters" | "tokens"',
          description: "Default: characters when maxLength is set, tokens otherwise.",
        },
        {
          name: "showAt",
          type: "number",
          default: "0",
          description: "Only show once text reaches this fraction of maxLength (e.g. 0.8).",
        },
        {
          name: "countTokens",
          type: "(text: string) => number",
          description: "Custom tokenizer for mode=tokens (default ≈ chars/4).",
        },
      ],
    },
    {
      name: "ComposerSubmit",
      dataSlot: "composer-submit",
      description:
        "Send button (ink when ready, quiet when empty) that becomes a stop button while busy; data-mode = send | stop.",
      props: [
        {
          name: "sendLabel",
          type: "string",
          default: '"Send message"',
          description: "Accessible label while idle.",
        },
        {
          name: "stopLabel",
          type: "string",
          default: '"Stop generating"',
          description: "Accessible label while busy.",
        },
        {
          name: "tooltip",
          type: "boolean",
          default: "true",
          description: "Tooltip with shortcut.",
        },
      ],
    },
  ],
  a11y: {
    notes: [
      "The textarea is labelled “Message” by default (override with aria-label or aria-labelledby) and has enterkeyhint=send.",
      "The hint is the field's description: “3,700 of 4,000 characters, close to the limit” (read on focus, not per keystroke). Over the limit the textarea also gets aria-invalid.",
      "The submit button swaps its accessible name between “Send message” and “Stop generating”; the root sets aria-busy while a response is pending.",
      "The focus glow is on the whole composer (focus-within), so the textarea's own outline is replaced, never just removed.",
      "Attachments are a labelled list with “Remove <file>” buttons; removing returns focus to the textarea.",
    ],
    keyboard: [
      { keys: "Enter", action: "Send (submitKey=enter). Ignored while an IME is composing." },
      { keys: "Shift+Enter", action: "Insert a newline" },
      { keys: "Mod+Enter", action: "Send (both submitKey modes)" },
      { keys: "Escape", action: "Stop the response while submitted/streaming" },
      { keys: "Mod+V", action: "Paste text, or attach pasted files/images" },
    ],
    reducedMotion:
      "The send/stop icon swap and attachment enter/exit become plain fades (no scale); the pending ring stops chasing and holds still.",
  },
  dependencies: {
    npm: ["lucide-react", "motion"],
    kura: ["attachment", "icon-button", "spinner", "tooltip"],
  },
  related: [
    "attachment",
    "model-picker",
    "slash-command-menu",
    "voice-dictation",
    "prompt-suggestions",
  ],
  tags: ["prompt", "chat", "input", "textarea", "composer", "send", "attachments", "streaming"],
  examples: [
    {
      name: "ComposerMinimal",
      kind: "minimal",
      title: "Default layout",
      description: "No children: textarea, attach button, hint and send button.",
    },
    {
      name: "ComposerFull",
      kind: "full",
      title: "Controlled, with model picker and tools",
      description:
        "Controlled text, simulated submitted → streaming lifecycle with stop, file limits, a character limit and tool toggles.",
    },
    {
      name: "ComposerStates",
      kind: "state",
      title: "Submitted, streaming near the limit, over the limit and disabled",
    },
    {
      name: "ComposerNewChat",
      kind: "composition",
      title: "New chat home",
      description:
        "An empty-chat start: ModelPicker and VoiceDictation in the toolbar, PromptSuggestions chips that fill and focus the input.",
    },
  ],
  agentNotes: [
    'Drive `status` from your chat hook: set "submitted" when you send, "streaming" on the first token, back to "idle" when done; pass `onStop` to abort.',
    "With the Vercel AI SDK: status maps 1:1 from useChat's status ('ready' → 'idle').",
    "Compose parts in this order: ComposerAttachments, ComposerInput, ComposerToolbar > (ComposerTools, ComposerActions > ComposerHint, ComposerSubmit).",
    "Use `useComposer()` inside custom parts to read value, setValue, attachments, addFiles, submit, status.",
    "Attachment object URLs are revoked when removed, not when sent — the sent message may still display them.",
    "To insert text from voice-dictation or prompt-suggestions, control `value` and append to it.",
  ],
});
