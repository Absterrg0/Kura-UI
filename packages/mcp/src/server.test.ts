import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { loadCatalog } from "./catalog";
import { createServer } from "./server";

async function connect() {
  const server = createServer(await loadCatalog());
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0" });
  await Promise.all([server.connect(a), client.connect(b)]);
  return client;
}

const json = (r: unknown) =>
  JSON.parse((r as { content: Array<{ text: string }> }).content[0]!.text);

describe("kura MCP server", () => {
  it("exposes all tools", async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "get_component",
      "get_component_source",
      "get_design_guidelines",
      "get_design_tokens",
      "get_install_instructions",
      "list_components",
      "search_components",
    ]);
  });

  it("searches with natural language", async () => {
    const client = await connect();
    const r = json(
      await client.callTool({
        name: "search_components",
        arguments: { query: "show that the model is thinking" },
      }),
    );
    expect(r.results[0].slug).toBe("shimmer-text");
  });

  it("gets a component and its source with dependencies", async () => {
    const client = await connect();
    const c = json(
      await client.callTool({ name: "get_component", arguments: { slug: "kbd-shortcut" } }),
    );
    expect(c.whenToUse.length).toBeGreaterThan(0);
    expect(c.examples[0].code).toContain("@kura-ui/react/kbd-shortcut");
    const src = json(
      await client.callTool({
        name: "get_component_source",
        arguments: { slug: "kbd-shortcut", includeDependencies: true },
      }),
    );
    const targets = src.files.map((f: { target: string }) => f.target);
    expect(targets).toContain("components/kura/kbd/kbd.tsx");
    expect(targets).toContain("hooks/kura/use-hotkey.ts");
    expect(targets).toContain("lib/kura/keys.ts");
  });

  it("returns install instructions and errors helpfully", async () => {
    const client = await connect();
    const r = await client.callTool({
      name: "get_install_instructions",
      arguments: { slug: "shimmer-text", method: "npm" },
    });
    expect((r.content as Array<{ text: string }>)[0]!.text).toContain("@kura-ui/react/styles.css");
    const bad = await client.callTool({ name: "get_component", arguments: { slug: "nope" } });
    expect(bad.isError).toBe(true);
  });

  it("serves tokens and guidelines", async () => {
    const client = await connect();
    const tokens = json(await client.callTool({ name: "get_design_tokens", arguments: {} }));
    expect(tokens.light["--kura-accent"]).toMatch(/oklch/);
    const g = await client.callTool({ name: "get_design_guidelines", arguments: {} });
    expect((g.content as Array<{ text: string }>)[0]!.text).toContain("Kura Signal");
  });
});
