import { agentSigilPattern } from "@kura/components/agent-sigil/agent-sigil";

/**
 * An AgentSigil's face as the library lays it out (agent-sigil.tsx): 5×5 cells on a 3-unit pitch
 * in a 15-unit face, dots of r 1.1, centred vertically on what is lit; the face is half the tile.
 * Returned in tile units: the tile spans −0.5..0.5.
 */
export function face(name: string) {
  const cells = agentSigilPattern(name);
  const rows = cells.flatMap((on, i) => (on ? [Math.floor(i / 5)] : []));
  const dy = ((4 - Math.max(...rows) - Math.min(...rows)) / 2) * 3;
  const unit = 1 / 30;
  return cells.map((on, i) => ({
    on,
    row: Math.floor(i / 5),
    col: i % 5,
    x: (1.5 + (i % 5) * 3 - 7.5) * unit,
    y: (1.5 + Math.floor(i / 5) * 3 + dy - 7.5) * unit,
    r: 1.1 * unit,
  }));
}

/** Corner radius of the lg tile (11 px on 40 px), as a fraction of the tile. */
export const TILE_RX = 11 / 40;
