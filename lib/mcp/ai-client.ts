import { openai } from "@ai-sdk/openai";
import {
  ModelMessage,
  generateText,
  stepCountIs,
} from "ai";
import { Client } from "@modelcontextprotocol/sdk/client";
import { createMCPTransport } from "./transport";
import { mcpConfig } from "./client";

export interface MCPConversationConfig {
  externalUserId: string;
  model?: string;
  maxSteps?: number;
  systemPrompt?: string;
}

export interface MCPResponse {
  text: string;
  finishReason: string;
  toolCalls?: Array<{
    toolName: string;
    input: any;
  }>;
  toolResults?: Array<{
    output: any;
  }>;
}

export interface MCPConversationStep {
  type: 'user' | 'assistant' | 'tool_call' | 'tool_result';
  content: string;
  toolName?: string;
  toolInput?: any;
  toolOutput?: any;
  timestamp: Date;
}

const DEFAULT_SYSTEM_PROMPT = `You are an intelligent AI assistant that can use Pipedream tools to help users.

Use the available tools to fulfill the user's request effectively.

If you encounter any errors or need clarification, explain what happened and suggest next steps.`;

export class MCPClient {
  private mcpClient: Client | null = null;
  private config: MCPConversationConfig;

  constructor(config: MCPConversationConfig) {
    this.config = {
      model: 'gpt-4o',
      maxSteps: 10,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    if (this.mcpClient) {
      return;
    }

    try {
      const transport = await createMCPTransport(this.config.externalUserId);
      
      this.mcpClient = new Client({
        name: "nine-line-portal",
        version: "1.0.0",
      }, {
        capabilities: {},
      });
      
      await this.mcpClient.connect(transport);
    } catch (error) {
      console.error('Failed to initialize MCP client:', error);
      throw new Error('MCP client initialization failed');
    }
  }

  async getAvailableTools(): Promise<string[]> {
    if (!this.mcpClient) {
      throw new Error('MCP client not initialized');
    }

    try {
      const result = await this.mcpClient.listTools();
      return result.tools?.map(tool => tool.name) || [];
    } catch (error) {
      console.error('Failed to get tools:', error);
      return [];
    }
  }

  async processMessage(
    message: string,
    conversationHistory: ModelMessage[] = []
  ): Promise<MCPResponse> {
    if (!this.mcpClient) {
      throw new Error('MCP client not initialized');
    }

    const messages: ModelMessage[] = [
      {
        role: "system",
        content: this.config.systemPrompt!,
      },
      ...conversationHistory,
      {
        role: "user",
        content: [
          {
            type: "text",
            text: message,
          },
        ],
      },
    ];

    // For now, return a simple response without tools integration
    // This will be enhanced once the MCP client is properly configured
    const response = await generateText({
      model: openai(this.config.model as any),
      messages,
    });

    return {
      text: response.text,
      finishReason: response.finishReason,
      toolCalls: [],
      toolResults: [],
    };
  }

  async processConversation(
    initialMessage: string,
    onStep?: (step: MCPConversationStep) => void
  ): Promise<MCPConversationStep[]> {
    // Simplified version - just process the initial message
    const response = await this.processMessage(initialMessage);
    
    const steps: MCPConversationStep[] = [
      {
        type: 'user',
        content: initialMessage,
        timestamp: new Date(),
      },
      {
        type: 'assistant',
        content: response.text,
        timestamp: new Date(),
      }
    ];

    steps.forEach(step => onStep?.(step));
    return steps;
  }

  async close(): Promise<void> {
    if (this.mcpClient) {
      await this.mcpClient.close();
      this.mcpClient = null;
    }
  }
}