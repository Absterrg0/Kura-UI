/** Upload lifecycle of one attachment. */
export type AttachmentStatus = "ready" | "uploading" | "error";

/** Broad file family, used to pick an icon and a label. */
export type AttachmentKind =
  | "image"
  | "pdf"
  | "code"
  | "text"
  | "sheet"
  | "audio"
  | "video"
  | "archive"
  | "file";

/** Plain-data description of an attachment, as stored in app or composer state. */
export interface AttachmentItem {
  /** Stable id, unique within the list. */
  id: string;
  /** File name shown on the chip, e.g. "q3-report.pdf". */
  name: string;
  /** Size in bytes. */
  size?: number;
  /** MIME type, e.g. "image/png". Used for the icon and the thumbnail decision. */
  type?: string;
  /** Preview URL (object URL or remote) for images. */
  url?: string;
  /** Default "ready". */
  status?: AttachmentStatus;
  /** Upload progress 0..1 while `status` is "uploading". Omit for indeterminate. */
  progress?: number;
  /** Error message shown when `status` is "error". */
  error?: string;
  /** The original File, when the attachment came from a picker, paste or drop. */
  file?: File;
}

const CODE_EXT =
  /\.(m?[jt]sx?|py|rb|go|rs|java|kt|swift|c|cc|cpp|h|hpp|cs|php|sh|zsh|sql|html?|css|scss|vue|svelte|json|ya?ml|toml|xml)$/i;

/** Classify a file by MIME type, falling back to its extension. */
export function attachmentKind(name: string, type = ""): AttachmentKind {
  const t = type.toLowerCase();
  const n = name.toLowerCase();
  if (t.startsWith("image/") || /\.(png|jpe?g|gif|webp|avif|svg|heic)$/.test(n)) return "image";
  if (t === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (t.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|flac|webm)$/.test(n)) return "audio";
  if (t.startsWith("video/") || /\.(mp4|mov|mkv|avi)$/.test(n)) return "video";
  if (/zip|tar|gzip|rar|7z/.test(t) || /\.(zip|tar|gz|tgz|rar|7z)$/.test(n)) return "archive";
  if (/spreadsheet|excel|csv/.test(t) || /\.(csv|tsv|xlsx?|numbers)$/.test(n)) return "sheet";
  if (CODE_EXT.test(n)) return "code";
  if (t.startsWith("text/") || /\.(md|mdx|txt|rtf|docx?)$/.test(n)) return "text";
  return "file";
}

/** Short uppercase extension ("PDF", "TSX") or the kind when there is none. */
export function attachmentExtension(name: string): string {
  const match = /\.([a-z0-9]{1,5})$/i.exec(name);
  return match?.[1] ? match[1].toUpperCase() : "";
}

/** 1536 → "1.5 KB". Uses binary units and at most one decimal, like Finder. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10} ${units[unit]}`;
}

/**
 * Does `file` match an `accept` string like "image/*,.pdf,text/csv"? An empty or missing accept
 * string accepts everything (same semantics as `<input type="file" accept>`).
 */
export function acceptsFile(file: Pick<File, "name" | "type">, accept?: string): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith(".")) return name.endsWith(rule);
      if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
      return type === rule;
    });
}

let counter = 0;

/**
 * Turn a File into an AttachmentItem. Images get an object URL preview — call
 * `URL.revokeObjectURL(item.url)` when you discard the item.
 */
export function createAttachment(
  file: File,
  overrides: Partial<AttachmentItem> = {},
): AttachmentItem {
  counter += 1;
  const isImage = attachmentKind(file.name, file.type) === "image";
  const url =
    isImage && typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
      ? URL.createObjectURL(file)
      : undefined;
  return {
    id: `att-${Date.now().toString(36)}-${counter}`,
    name: file.name,
    size: file.size,
    type: file.type,
    url,
    status: "ready",
    file,
    ...overrides,
  };
}

/** Files from a DataTransfer (drop or paste). Ignores non-file items such as dragged text. */
export function filesFromDataTransfer(data: DataTransfer | null): File[] {
  if (!data) return [];
  if (data.files && data.files.length > 0) return Array.from(data.files);
  const out: File[] = [];
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind === "file") {
      const f = item.getAsFile();
      if (f) out.push(f);
    }
  }
  return out;
}

/** True when a drag carries files (not text or links). Safe to call during dragenter/dragover. */
export function dragHasFiles(data: DataTransfer | null): boolean {
  if (!data) return false;
  return Array.from(data.types ?? []).includes("Files");
}
