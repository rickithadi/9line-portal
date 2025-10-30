import { NextRequest, NextResponse } from 'next/server';
import { MCPClient } from '@/lib/mcp/ai-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const externalUserId = searchParams.get('externalUserId');

    if (!externalUserId) {
      return NextResponse.json(
        { error: 'External user ID is required' },
        { status: 400 }
      );
    }

    // Initialize MCP client
    const mcpClient = new MCPClient({
      externalUserId,
    });

    try {
      await mcpClient.initialize();
      
      // Get available tools
      const tools = await mcpClient.getAvailableTools();
      
      return NextResponse.json({
        tools,
        count: tools.length,
      });
    } finally {
      await mcpClient.close();
    }
  } catch (error) {
    console.error('MCP tools error:', error);
    
    // Check for MCP configuration errors
    if (error instanceof Error && (error.message.includes('MCP not configured') || error.message.includes('Environment validation failed'))) {
      return NextResponse.json(
        { error: 'MCP service not configured. Please add MCP environment variables to .env.local to enable AI chat features.', tools: [], count: 0 },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch tools', tools: [], count: 0 },
      { status: 500 }
    );
  }
}