import { NextRequest, NextResponse } from 'next/server';
import { PipedreamClient } from '@pipedream/sdk';

// Only initialize client if environment variables are provided
let client: PipedreamClient | null = null;

try {
  if (process.env.PIPEDREAM_PROJECT_ID && process.env.PIPEDREAM_CLIENT_ID && process.env.PIPEDREAM_CLIENT_SECRET) {
    client = new PipedreamClient({
      projectId: process.env.PIPEDREAM_PROJECT_ID,
      projectEnvironment: (process.env.PIPEDREAM_PROJECT_ENVIRONMENT as 'development' | 'production') || 'development',
      clientId: process.env.PIPEDREAM_CLIENT_ID,
      clientSecret: process.env.PIPEDREAM_CLIENT_SECRET,
    });
  }
} catch (error) {
  console.warn('Pipedream client initialization failed:', error);
}

export async function POST(request: NextRequest) {
  try {
    if (!client) {
      return NextResponse.json(
        { error: 'Pipedream client not configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { externalUserId } = body;

    if (!externalUserId) {
      return NextResponse.json(
        { error: 'External user ID is required' },
        { status: 400 }
      );
    }

    const response = await client.tokens.create({
      externalUserId,
    });

    return NextResponse.json({
      token: response.token,
      connectLinkUrl: response.connectLinkUrl,
      expiresAt: response.expiresAt,
    });
  } catch (error) {
    console.error('Error creating Pipedream token:', error);
    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    );
  }
}