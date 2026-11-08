import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadCatalog } from "./catalog";
import { createServer } from "./server";

const catalog = await loadCatalog();
const server = createServer(catalog);
await server.connect(new StdioServerTransport());
process.stderr.write(`kura-ui MCP ready (${catalog.components.length} components)\n`);
