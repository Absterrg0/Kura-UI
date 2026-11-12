import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "attachment",
  name: "Attachment",
  category: "input",
  status: "beta",
  description:
    "File and image attachment chips with thumbnails, a dial of dots for upload progress, error/retry, remove, a “+N” overflow key and a dotted dropzone.",
  whenToUse: [
    "Show files the user attached to a prompt before sending (inside or above a composer).",
    "Display upload progress, failures and a retry action for files sent to a model.",
    "Render the files that belong to a sent message or an agent artifact list.",
    "A standalone drop area for documents to index, e.g. “Add files to this project”.",
  ],
  whenNotToUse: [
    "A complete prompt input with paste and drag-drop built in — use composer (it renders attachment for you).",
    "Rich previews of generated documents or code — use artifact-card or code-block.",
    "Audio recordings with playback — use audio-waveform with `peaks`.",
  ],
  props: [
    {
      name: "name",
      type: "string",
      required: true,
      description: "File name shown on the chip; long names truncate with an ellipsis.",
    },
    { name: "size", type: "number", description: "Size in bytes, rendered as “2.4 MB”." },
    {
      name: "type",
      type: "string",
      description:
        "MIME type. Chooses the file-type icon (image, pdf, code, text, sheet, audio, video, archive) and whether a preview renders as a thumbnail.",
    },
    {
      name: "previewUrl",
      type: "string",
      description:
        "Image URL (object URL or remote). With an image type the attachment renders as a 44px square thumbnail.",
    },
    {
      name: "status",
      type: '"ready" | "uploading" | "error"',
      default: '"ready"',
      description: "Upload state. Uploading shows a progress ring; error shows a danger tint.",
    },
    {
      name: "progress",
      type: "number",
      description: "Upload progress 0..1 while uploading. Omit for an indeterminate chasing ring.",
    },
    {
      name: "error",
      type: "string",
      description:
        "Error message for status=error; shown as the title and announced via role=alert.",
    },
    {
      name: "variant",
      type: '"auto" | "chip" | "tile"',
      default: '"auto"',
      description:
        "auto = thumbnail tile for images that have a previewUrl, a chip (icon + name + size) otherwise.",
    },
    {
      name: "onRemove",
      type: "() => void",
      description: "Render a × button (revealed on hover/focus, always visible on touch).",
    },
    {
      name: "onRetry",
      type: "() => void",
      description: "Render a Retry action while status is error.",
    },
  ],
  parts: [
    {
      name: "Attachment",
      dataSlot: "attachment",
      description:
        "One file. Exposes data-variant (chip|tile), data-kind and data-status (ready|uploading|error).",
    },
    {
      name: "AttachmentRemove",
      dataSlot: "attachment-remove",
      description: "The × button, labelled “Remove <name>”. Rendered when onRemove is set.",
    },
    {
      name: "AttachmentList",
      dataSlot: "attachment-list",
      description:
        "Wrapping <ul> of attachments with pop-in/out and gap-closing layout motion, plus the “+N” stack.",
      props: [
        {
          name: "items",
          type: "readonly AttachmentItem[]",
          required: true,
          description:
            "Items: { id, name, size?, type?, url?, status?, progress?, error?, file? }.",
        },
        { name: "onRemove", type: "(id: string) => void", description: "Remove handler." },
        { name: "onRetry", type: "(id: string) => void", description: "Retry handler." },
        {
          name: "max",
          type: "number",
          description:
            "Show at most this many items, then a “+N” stack button that reveals the rest.",
        },
        {
          name: "variant",
          type: '"auto" | "chip" | "tile"',
          default: '"auto"',
          description: "Forwarded to every item.",
        },
        {
          name: "label",
          type: "string",
          default: '"Attachments"',
          description: "Accessible name of the list.",
        },
      ],
    },
    {
      name: "AttachmentOverflow",
      dataSlot: "attachment-overflow",
      description: "The “+N” stack button (a counter with two offset cards behind it).",
    },
    {
      name: "AttachmentDropzone",
      dataSlot: "attachment-dropzone",
      description:
        "Click-to-browse + drop target with a dashed hairline. data-dragging is set only while a drag carries files.",
      props: [
        {
          name: "onFiles",
          type: "(files: File[], rejected: File[]) => void",
          required: true,
          description: "Accepted files, and those rejected by accept/maxSize.",
        },
        {
          name: "accept",
          type: "string",
          description: 'Like <input accept>, e.g. "image/*,.pdf".',
        },
        { name: "multiple", type: "boolean", default: "true", description: "Allow several files." },
        { name: "maxSize", type: "number", description: "Reject files larger than this (bytes)." },
        { name: "disabled", type: "boolean", description: "Disable browsing and dropping." },
        {
          name: "title",
          type: "React.ReactNode",
          default: '"Drop files or browse"',
          description: "Headline.",
        },
        { name: "description", type: "React.ReactNode", description: "Hint under the headline." },
      ],
    },
    {
      name: "AttachmentProgressRing",
      dataSlot: "attachment-progress",
      description: "Standalone circular progress (currentColor) used by uploading attachments.",
    },
  ],
  a11y: {
    notes: [
      "Image tiles render <img alt={name}>; chips render the name as text, so every file has a readable name.",
      "The remove button is a real <button> labelled “Remove <file name>” with a 28px hit area; it is revealed on hover and on keyboard focus within the item.",
      "Upload failures are announced once with role=alert; progress is not announced on every tick.",
      'The list is a <ul aria-label="Attachments">; the overflow button is labelled “Show N more attachments”.',
      "The dropzone is a native <button> that opens the file picker; the drop target never steals focus.",
    ],
    keyboard: [
      { keys: "Tab", action: "Moves through each attachment's Retry and Remove buttons" },
      { keys: "Enter / Space", action: "Activates Remove, Retry, the +N stack or the dropzone" },
    ],
    reducedMotion:
      "Items fade in and out without scale or layout travel; the indeterminate ring holds still.",
  },
  dependencies: { npm: ["lucide-react", "motion"], kura: ["status-glyph"] },
  related: ["composer", "artifact-card", "audio-waveform"],
  tags: [
    "file",
    "upload",
    "attachment",
    "image",
    "thumbnail",
    "dropzone",
    "progress",
    "drag-and-drop",
  ],
  examples: [
    { name: "AttachmentMinimal", kind: "minimal", title: "A single file" },
    {
      name: "AttachmentFull",
      kind: "full",
      title: "Mixed states with overflow",
      description:
        "Thumbnails, a live upload, a failed upload with retry, remove buttons and a +N stack.",
    },
    {
      name: "AttachmentWithDropzone",
      kind: "composition",
      title: "Dropzone feeding a list",
      description: "Browse or drop files; accepted ones upload, rejected ones are reported.",
    },
  ],
  agentNotes: [
    "Keep attachments in state as AttachmentItem[] and render <AttachmentList items={…} />; use createAttachment(file) to build items (it creates an object URL for images — revoke it with URL.revokeObjectURL when removing).",
    "Helpers exported alongside: formatBytes, attachmentKind, acceptsFile, filesFromDataTransfer, dragHasFiles.",
    "Progress is 0..1, not a percentage. Omit progress for an indeterminate ring.",
    "Inside a composer, prefer composer's built-in ComposerAttachments, which wires paste, drop and removal.",
  ],
});
