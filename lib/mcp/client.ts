import { PipedreamClient } from "@pipedream/sdk";
import { loadAndValidateConfig } from "./config";
import { z } from "zod";

export const mcpConfig = loadAndValidateConfig(
  z.object({
    OPENAI_API_KEY: z.string(),
    
    PIPEDREAM_CLIENT_ID: z.string(),
    PIPEDREAM_CLIENT_SECRET: z.string(),
    PIPEDREAM_PROJECT_ID: z.string(),
    PIPEDREAM_PROJECT_ENVIRONMENT: z
      .enum(["development", "production"])
      .default("development"),

    MCP_HOST: z.string().default("https://remote.mcp.pipedream.net"),
  })
);

export const pd = mcpConfig ? new PipedreamClient({
  projectId: mcpConfig.PIPEDREAM_PROJECT_ID,
  projectEnvironment: mcpConfig.PIPEDREAM_PROJECT_ENVIRONMENT,
  clientId: mcpConfig.PIPEDREAM_CLIENT_ID,
  clientSecret: mcpConfig.PIPEDREAM_CLIENT_SECRET,
}) : null;

export const pdHeaders = async (exuid: string) => {
  if (!pd || !mcpConfig) {
    throw new Error('MCP not configured');
  }

  const accessToken = await pd.rawAccessToken;

  return {
    Authorization: `Bearer ${accessToken}`,
    "x-pd-project-id": mcpConfig.PIPEDREAM_PROJECT_ID,
    "x-pd-environment": mcpConfig.PIPEDREAM_PROJECT_ENVIRONMENT,
    "x-pd-external-user-id": exuid,
  };
};