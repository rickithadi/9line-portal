import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { mcpConfig, pdHeaders } from "./client";

export async function createMCPTransport(externalUserId: string): Promise<Transport> {
  const headers = await pdHeaders(externalUserId);
  
  // For now, return a simple mock transport
  // This will be properly implemented when the MCP server is fully configured
  return {
    start: async () => {},
    close: async () => {},
    send: async (message: any) => {},
    onmessage: undefined,
    onerror: undefined,
    onclose: undefined,
  } as unknown as Transport;
}