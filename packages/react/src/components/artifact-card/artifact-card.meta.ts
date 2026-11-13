import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "artifact-card",
  name: "ArtifactCard",
  category: "conversation",
  status: "beta",
  description:
    "Card for something an agent made — document, code, web page, image, sheet or diagram — with generating/updating progress, versions and open-in-panel.",
  whenToUse: [
    "An assistant message produced a standalone deliverable (a document, a code file, a web page, an image, a CSV, a diagram) that the user opens in a side panel or another page.",
    'Show an artifact while the agent is still writing it: status="generating" with a live statusText and optional progress, then flip to "ready".',
    'An artifact the user asked to change: status="updating" plus a ‹ v2/3 › version switcher (versions/version/onVersionChange).',
    "A list of everything the agent made in a session, e.g. a files/outputs sidebar (compact variant, selected marks the one that is open).",
    'A visual card with a thumbnail of the artifact under the title (variant="preview" with a `preview` node: a text excerpt, an <img>, a headerless CodeBlock).',
  ],
  whenNotToUse: [
    "Code the user should read inline in the answer — use code-block directly.",
    "A file the user uploaded or attached to the prompt — use attachment.",
    "One tool invocation with arguments and a result (read_file, run_command) — use tool-call.",
    "A link to an external web source the answer relies on — use citation.",
    "A multi-step plan of work — use agent-timeline.",
  ],
  props: [
    {
      name: "title",
      type: "string",
      required: true,
      description: 'The artifact\'s name, e.g. "Q3 launch plan" or "pricing-table.tsx". Truncates.',
    },
    {
      name: "kind",
      type: '"document" | "code" | "web" | "image" | "data" | "diagram" | "file"',
      default: '"document"',
      description:
        "What the agent made. Picks the icon, the spoken label (Document, Code, Web page, Image, Spreadsheet, Diagram, File) and the preview placeholder.",
    },
    {
      name: "status",
      type: '"generating" | "updating" | "ready" | "error"',
      default: '"ready"',
      description:
        "Lifecycle. generating = first write and updating = an edit (both: the chasing glyph in the icon tile, statusText, a dot rail when progress is known, aria-busy); error = the failed glyph and message.",
    },
    {
      name: "meta",
      type: "React.ReactNode",
      description:
        'Secondary line when ready, e.g. "Markdown · 1,240 words" or "TypeScript · 94 lines". Default: the kind label.',
    },
    {
      name: "statusText",
      type: "React.ReactNode",
      description:
        'Live line while busy, e.g. "Writing section 3 of 5…". Default "Generating…" / "Updating…". Not announced on every change.',
    },
    {
      name: "error",
      type: "React.ReactNode",
      description: 'Message for status="error". Default "Couldn\'t finish".',
    },
    {
      name: "progress",
      type: "number",
      description:
        "Completion 0–1 while busy: a dot rail plus a mono percentage. Omit when it is unknown: the icon tile shows the running glyph and no rail is drawn.",
    },
    { name: "icon", type: "React.ReactNode", description: "Replaces the kind icon (lucide)." },
    {
      name: "variant",
      type: '"compact" | "preview"',
      default: '"compact"',
      description:
        "compact = one-row chip sized to its content, for message text and lists; preview = full-width card whose top 112px is a flush thumbnail of the artifact, above the title.",
    },
    {
      name: "preview",
      type: "React.ReactNode",
      description:
        'Thumbnail content for variant="preview": a text excerpt, an <img className="size-full object-cover">, a headerless CodeBlock. It fills the top of the card edge to edge on the sunken fill, clipped at the bottom, and is aria-hidden/inert. Default: the kind sketched in rows of dots.',
    },
    {
      name: "versions",
      type: "number",
      default: "1",
      description: "Number of versions. Above 1 shows a ‹ v2/3 › switcher (disabled while busy).",
    },
    { name: "version", type: "number", description: "Shown version, 1-based (controlled)." },
    {
      name: "defaultVersion",
      type: "number",
      description: "Initial version when uncontrolled. Default: the latest (`versions`).",
    },
    {
      name: "onVersionChange",
      type: "(version: number) => void",
      description: "Called with the new 1-based version from the switcher.",
    },
    {
      name: "onOpen",
      type: "() => void",
      description:
        "Open the artifact, e.g. into a side panel. The title becomes a button stretched over the whole card.",
    },
    {
      name: "href",
      type: "string",
      description: "Open by navigating instead: the title becomes a link stretched over the card.",
    },
    {
      name: "selected",
      type: "boolean",
      default: "false",
      description:
        "This artifact is the one currently open (e.g. in the side panel): a stronger ring and aria-current on the open control.",
    },
    {
      name: "onRetry",
      type: "() => void",
      description: 'Shows a Retry icon button when status="error".',
    },
    {
      name: "actions",
      type: "React.ReactNode",
      description:
        'Extra controls at the end of the row, e.g. Copy / Download IconButtons with size="sm". They sit above the stretched open target.',
    },
  ],
  parts: [
    {
      name: "ArtifactCard",
      dataSlot: "artifact-card",
      description:
        "Root. `data-kind`, `data-status`, `data-variant`, `data-selected`; `aria-busy` while generating/updating.",
    },
    {
      name: "Preview",
      dataSlot: "artifact-card-preview",
      description: 'Thumbnail area (variant="preview" only), aria-hidden and inert.',
    },
    {
      name: "Header",
      dataSlot: "artifact-card-header",
      description: "Row with icon, title, meta, versions and actions.",
    },
    {
      name: "Icon",
      dataSlot: "artifact-card-icon",
      description: "36px kind tile; jade while busy, danger on error.",
    },
    {
      name: "Open",
      dataSlot: "artifact-card-open",
      description:
        "The title as a button (onOpen) or link (href) whose ::after covers the card. Without either, the title renders as `artifact-card-title`.",
    },
    {
      name: "Meta",
      dataSlot: "artifact-card-meta",
      description: "Second line: meta, statusText + percentage, or the error.",
    },
    {
      name: "Versions",
      dataSlot: "artifact-card-versions",
      description: "‹ v2/3 › switcher, read as “Version 2 of 3”.",
    },
    {
      name: "Actions",
      dataSlot: "artifact-card-actions",
      description: "Retry (on error) and your `actions`.",
    },
    {
      name: "Progress",
      dataSlot: "artifact-card-progress",
      description:
        "role=progressbar while busy: a dot rail under the header when `progress` is known; with unknown progress it is announced only, and nothing is drawn.",
    },
  ],
  a11y: {
    notes: [
      "The open control is a real button or link named “<title>, <kind>[, generating | , updating | , failed]”; its ::after stretches over the card so the whole card is clickable while Versions and Actions stay separate tab stops.",
      "`selected` sets aria-current on the open control.",
      "The preview thumbnail is decorative (aria-hidden + inert): put anything a screen-reader user needs into title/meta.",
      "A polite status region announces lifecycle changes (“Generating Pricing page”, “Pricing page ready”, “… failed”); statusText and progress ticks are not announced.",
      "While busy the root has aria-busy and the bar is a named role=progressbar (with aria-valuenow when `progress` is given).",
    ],
    keyboard: [
      { keys: "Tab", action: "Open control, then the version arrows, Retry and your actions" },
      { keys: "Enter / Space", action: "Open the artifact (Enter follows the link for href)" },
    ],
    reducedMotion:
      "The running glyph and the rail's leading dot hold still, and the placeholder dots stop pulsing; the press travel is removed. Colour and opacity changes stay.",
  },
  dependencies: { npm: ["lucide-react"], kura: ["dot-rail", "icon-button", "status-glyph"] },
  related: ["message", "code-block", "attachment", "tool-call", "streaming-text"],
  tags: ["artifact", "canvas", "document", "file", "output", "generation", "versions", "preview"],
  examples: [
    {
      name: "ArtifactCardMinimal",
      kind: "minimal",
      title: "Compact card",
      description: "Title, meta and an open action that toggles `selected`.",
    },
    {
      name: "ArtifactCardFull",
      kind: "full",
      title: "Written live, then edited",
      description:
        "Preview variant generating with progress and statusText, then ready with versions and Edit/Copy actions; an edit writes v2 in place.",
    },
    {
      name: "ArtifactCardStates",
      kind: "state",
      title: "Every status",
      description:
        "Generating (indeterminate), updating with progress and versions, ready, failed with Retry.",
    },
    {
      name: "ArtifactCardKinds",
      kind: "variant",
      title: "Every kind",
      description: "Document, code, web page, image, spreadsheet and diagram.",
    },
    {
      name: "ArtifactCardComposition",
      kind: "composition",
      title: "In a message, opening a side panel",
      description:
        "An assistant Message with a code artifact whose preview is a headerless CodeBlock; the card toggles a side panel with the full file.",
    },
  ],
  agentNotes: [
    "Keep the same card mounted from generating → ready so the transition (and the single announcement) is smooth; switch `status`, don't swap components.",
    "Drive `selected` from the id of the artifact open in your panel, so the card the user is looking at is marked.",
    'Use variant="compact" inside message text and lists (it sizes to content — give it a width like w-full or max-w-sm when stacking); use "preview" when there is room for a thumbnail.',
    'For images pass preview={<img src={url} alt="" className="size-full object-cover" />} — the thumbnail is decorative, the title carries the name.',
    "Pass `progress` only when you really know it (e.g. sections written / planned); otherwise leave it out: the icon tile shows the running glyph and no rail is drawn.",
    "The thumbnail is 112px tall and clips. Give a text excerpt whole lines (a fixed line-height and `line-clamp-*` per paragraph) so nothing is cut through its letters, and do not repeat the title inside it: the header already says it.",
    "Map Anthropic/OpenAI canvas or artifact tool calls (create → generating, update/rewrite → updating with versions + 1) onto one card per artifact id.",
  ],
});
