# Pipedream MCP Server Integration

This document outlines the Model Context Protocol (MCP) integration with Pipedream for the Nine-Line Portal project.

## Overview

The Nine-Line Portal now includes Pipedream MCP (Model Context Protocol) integration, providing AI-powered automation and chat-based interactions with connected services. This allows users to interact with their 2,900+ connected services through natural language conversations.

## Architecture

### Core Components

1. **MCP Client** (`lib/mcp/ai-client.ts`)
   - Handles AI model interactions using OpenAI SDK
   - Manages conversation flow and tool execution
   - Simplified implementation for graceful degradation

2. **Transport Layer** (`lib/mcp/transport.ts`)
   - Handles communication with Pipedream MCP server
   - Currently implements mock transport for build compatibility
   - Will be enhanced with proper HTTP transport when fully configured

3. **Configuration** (`lib/mcp/config.ts`)
   - Environment-safe configuration loading
   - Graceful degradation when MCP variables are missing
   - Zod schema validation for type safety

4. **API Routes**
   - `/api/mcp/chat` - Chat message processing
   - `/api/mcp/tools` - Available tools listing

### UI Components

1. **MCPChat** (`components/MCPChat.tsx`)
   - Full-featured chat interface
   - Tool execution visualization
   - Real-time conversation management
   - Integrated into main portal as sliding panel

## Features

### Chat Interface
- **Natural Language Processing** - Powered by OpenAI GPT models
- **Tool Visualization** - Shows tool calls and results
- **Conversation History** - Maintains context across messages
- **Error Handling** - Graceful fallback when MCP is not configured

### Integration Points
- **User Authentication** - Uses existing portal user IDs
- **Service Connections** - Leverages Pipedream Connect integration
- **Responsive UI** - Slide-out panel that doesn't interfere with main interface

## Configuration

### Required Environment Variables

Add these to your `.env.local` file to enable MCP features:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Pipedream MCP Configuration  
PIPEDREAM_PROJECT_ID=your_pipedream_project_id
PIPEDREAM_CLIENT_ID=your_pipedream_client_id
PIPEDREAM_CLIENT_SECRET=your_pipedream_client_secret
PIPEDREAM_PROJECT_ENVIRONMENT=development
MCP_HOST=https://remote.mcp.pipedream.net
```

### Graceful Degradation

The system is designed to work gracefully without MCP configuration:

- **Missing Variables**: Shows warning messages instead of crashing
- **Chat Interface**: Displays configuration hints when MCP is not available
- **Build Process**: Continues successfully even without MCP setup
- **Runtime**: Provides helpful error messages to guide setup

## Usage

### For Users

1. **Access Chat**: Click the "AI Chat" button in the portal header
2. **Natural Interaction**: Type messages like "Send a Slack message to #team"
3. **Tool Execution**: Watch as the AI uses connected services
4. **Conversation Flow**: Continue multi-step conversations naturally

### For Developers

#### Initialize MCP Client

```typescript
import { MCPClient } from '@/lib/mcp/ai-client';

const mcpClient = new MCPClient({
  externalUserId: user.id,
  model: 'gpt-4o',
  maxSteps: 10
});

await mcpClient.initialize();
```

#### Process Messages

```typescript
const response = await mcpClient.processMessage(
  "Send a funny joke to the #random channel in Slack",
  conversationHistory
);
```

#### Get Available Tools

```typescript
const tools = await mcpClient.getAvailableTools();
console.log('Available tools:', tools);
```

## Implementation Status

### ✅ Completed
- MCP client architecture
- Chat interface UI
- API route handlers
- Environment configuration
- Graceful degradation
- Build system integration

### 🚧 In Progress
- Full MCP transport implementation
- Tool execution integration
- Advanced conversation flows

### 📋 Planned
- Tool discovery and documentation
- Custom tool development
- Advanced error recovery
- Performance optimizations

## Development Notes

### Current Limitations

1. **Mock Transport**: Currently using simplified transport for build compatibility
2. **Tool Integration**: Basic framework in place, full tool execution pending
3. **Configuration**: Requires manual environment setup

### Next Steps

1. **Complete Transport**: Implement full HTTP transport for Pipedream MCP server
2. **Tool Integration**: Connect AI model tool calls to actual service execution
3. **Testing**: Add comprehensive test coverage
4. **Documentation**: Expand user and developer guides

## Troubleshooting

### Common Issues

1. **"MCP service not configured"**
   - Add required environment variables to `.env.local`
   - Restart development server after adding variables

2. **Chat interface not responding**
   - Check browser console for API errors
   - Verify OpenAI API key is valid

3. **Tools not loading**
   - Ensure Pipedream Connect services are properly connected
   - Check network connectivity to MCP server

### Debug Mode

Set `NODE_ENV=development` for additional logging:

```bash
NODE_ENV=development npm run dev
```

## Security Considerations

- **API Keys**: Stored as environment variables only
- **User Context**: Each chat session isolated by user ID
- **Transport Security**: All communication over HTTPS
- **Token Management**: Leverages existing Pipedream Connect tokens

## Support

For issues related to:
- **Nine-Line Portal Integration**: Check project GitHub issues
- **Pipedream MCP Server**: Visit [Pipedream MCP Documentation](https://pipedream.com/docs/connect/mcp)
- **OpenAI Integration**: Refer to [OpenAI API Documentation](https://platform.openai.com/docs)

---

*This integration provides a foundation for AI-powered automation within the Nine-Line Portal, enabling users to interact with their connected services through natural language conversations.*