import { Terminal } from "@kura/components/terminal";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { settle, tween } from "../lib/anim";
import { Headline } from "../lib/type";
import { X0 } from "./tokens";

/**
 * 0:42–0:48. The coding agent installs it: the CLI writes the component and what it needs,
 * and beside it, the four ways an agent reaches the library, as a property list on dotted leaders.
 */

export const INSTALL_FRAMES = 360;

const ESC = "\u001b[";
const c = (code: string, s: string) => `${ESC}${code}m${s}${ESC}0m`;
const COMMAND = "npx @kura-ui/cli add approval-prompt";
const OUT: [number, string][] = [
  [128, `${c("32", "+")} components/kura/approval-prompt/approval-prompt.tsx`],
  [136, `${c("32", "+")} components/kura/status-glyph/status-glyph.tsx`],
  [144, `${c("32", "+")} components/kura/halftone/halftone.tsx`],
  [152, `${c("32", "+")} components/kura/button/button.tsx`],
  [160, `${c("32", "+")} components/kura/kbd/kbd.tsx`],
  [168, ""],
  [176, `${c("2", "tokens:")} app/globals.css`],
  [184, ""],
  [192, `import { ApprovalPrompt } from "@/components/kura/approval-prompt";`],
];

export const SURFACES: [string, string][] = [
  ["shadcn registry", "/r/approval-prompt.json"],
  ["MCP server", "npx -y @kura-ui/mcp"],
  ["CLI", "kura add --json"],
  ["llms.txt", "/llms.txt"],
];
export const SURFACE_AT = 214;

const SCALE = 1.5;

export function Install() {
  const frame = useCurrentFrame();
  const typed = Math.max(0, Math.min(COMMAND.length, Math.floor((frame - 46) / 1.6)));
  const lines = OUT.filter(([at]) => frame >= at).map(([, l]) => l);
  const leave = tween(frame, INSTALL_FRAMES - 26, INSTALL_FRAMES - 8);
  const s = settle(frame, 24, 140);

  return (
    <AbsoluteFill style={{ opacity: 1 - leave }}>
      <Headline
        text="Your agent can install it."
        at={6}
        size={80}
        style={{ position: "absolute", left: X0 - 4, top: 92 }}
      />
      <div
        className="absolute"
        style={{
          left: X0,
          top: 250,
          transform: `translateY(${(1 - s) * 18}px) scale(${SCALE})`,
          transformOrigin: "0 0",
          opacity: tween(frame, 24, 36),
          width: 600,
        }}
      >
        <Terminal
          title="Terminal"
          cwd="~/acme-web"
          command={COMMAND.slice(0, typed)}
          lines={lines}
          status={frame < 120 ? "idle" : frame < 196 ? "running" : "done"}
          exitCode={frame < 196 ? null : 0}
          duration={frame < 196 ? undefined : 1_260}
          copyable={false}
          wrap={false}
        />
      </div>
      <dl
        className="absolute flex flex-col"
        style={{ left: 1110, top: 322, width: 650, fontSize: 25 }}
      >
        {SURFACES.map(([name, value], i) => {
          const at = SURFACE_AT + i * 12;
          const k = settle(frame, at, 150);
          return (
            <div
              key={name}
              className="flex items-baseline gap-4"
              style={{
                height: 76,
                alignItems: "center",
                opacity: tween(frame, at, at + 10),
                transform: `translateY(${(1 - k) * 14}px)`,
              }}
            >
              <dt className="shrink-0 font-medium text-kura-fg">{name}</dt>
              <span
                aria-hidden
                className="min-w-6 flex-1"
                style={{
                  height: 8,
                  backgroundImage:
                    "radial-gradient(circle at center, var(--kura-faint) 1.4px, transparent 2px)",
                  backgroundSize: "8px 8px",
                  backgroundRepeat: "space",
                }}
              />
              <dd
                className="m-0 shrink-0 font-kura-mono text-kura-fg-muted"
                style={{ fontSize: 23 }}
              >
                {value}
              </dd>
            </div>
          );
        })}
      </dl>
    </AbsoluteFill>
  );
}
