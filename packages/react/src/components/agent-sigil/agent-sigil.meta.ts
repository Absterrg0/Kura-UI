import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "agent-sigil",
  name: "AgentSigil",
  category: "agent",
  status: "beta",
  description:
    "A face for an agent: a symmetric 5×5 dot sigil generated from its name, in a small raised tile. Same name, same face.",
  whenToUse: [
    "Give an agent or subagent a recognisable mark in a run header, a fleet row, an approval or a message.",
    "Tell several agents apart at a glance without inventing avatars or icons for them.",
  ],
  whenNotToUse: [
    "A person — use your own avatar; the message component takes one.",
    "The state of an agent — use status-glyph next to the sigil.",
  ],
  props: [
    {
      name: "name",
      type: "string",
      required: true,
      description: "The agent's name. The same name always draws the same sigil.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      default: '"md"',
      description: "22, 30 or 40px tile.",
    },
    {
      name: "bare",
      type: "boolean",
      default: "false",
      description: "Draw only the dots, without the raised tile.",
    },
    {
      name: "label",
      type: "string",
      description:
        'Spoken name (role="img"). Leave it out when the name is written next to the sigil; it is then aria-hidden.',
    },
  ],
  parts: [
    {
      name: "AgentSigil",
      dataSlot: "agent-sigil",
      description: "Root span (the tile) with `data-size`; contains one 15-unit SVG of dots.",
    },
  ],
  a11y: {
    notes: [
      "Decorative by default (aria-hidden), because the agent's name is normally written beside it. Pass `label` when the sigil stands alone.",
    ],
    reducedMotion: "Nothing moves.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["status-glyph", "agent-fleet", "run-header", "approval-prompt"],
  tags: ["agent", "avatar", "identity", "dots", "sigil"],
  examples: [
    { name: "AgentSigilMinimal", kind: "minimal", title: "One agent" },
    { name: "AgentSigilFull", kind: "full", title: "Sizes, bare, a team" },
    {
      name: "AgentSigilComposition",
      kind: "composition",
      title: "With a status glyph",
      description: "A subagent line: sigil, name and state.",
    },
  ],
  agentNotes: [
    'The sigil is derived only from `name`: keep names stable ("test-writer", not "test-writer #3") so the face stays the same across runs.',
    "`agentSigilPattern(name)` returns the 25 booleans if you need to draw the same face elsewhere (a canvas, an email).",
  ],
});
