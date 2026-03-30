#!/usr/bin/env node
/**
 * eBird MCP Server - Access eBird API 2.0 through Model Context Protocol
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tools } from "./tools.js";

const API_KEY = process.env.EBIRD_API_KEY;

if (!API_KEY) {
  console.error("Error: EBIRD_API_KEY environment variable is not set");
  console.error("Get your API key at: https://ebird.org/api/keygen");
  process.exit(1);
}

const server = new McpServer({
  name: "ebird",
  version: "1.0.0",
});

for (const tool of tools) {
  server.tool(tool.name, tool.description, tool.schema, async (args) => {
    const result = await tool.handler(args, API_KEY!);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
