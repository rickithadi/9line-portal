# Pipedream Connect Integration Setup

This document outlines how to set up and use the Pipedream Connect integration in the Nine-Line Portal.

## Overview

The Nine-Line Portal now includes Pipedream Connect integration, allowing users to connect their accounts to 2,900+ external services. This enables automated workflows and data synchronization between the portal and various third-party applications.

## Setup Requirements

### 1. Pipedream Account Setup

1. Sign up for a Pipedream account at [pipedream.com](https://pipedream.com)
2. Create a new project in your Pipedream dashboard
3. Navigate to your project's Connect settings
4. Generate your API credentials (Client ID and Client Secret)

### 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Pipedream Connect Configuration
PIPEDREAM_PROJECT_ID=your_pipedream_project_id
PIPEDREAM_PROJECT_ENVIRONMENT=development  # or production
PIPEDREAM_CLIENT_ID=your_pipedream_client_id
PIPEDREAM_CLIENT_SECRET=your_pipedream_client_secret
NEXT_PUBLIC_PIPEDREAM_PROJECT_ID=your_pipedream_project_id
NEXT_PUBLIC_PIPEDREAM_FRONTEND_HOST=pipedream.com
NEXT_PUBLIC_PIPEDREAM_API_HOST=api.pipedream.com
```

### 3. Dependencies

The integration uses the following dependencies (already installed):
- `@pipedream/sdk`: Official Pipedream SDK for TypeScript/JavaScript

## Architecture

### API Routes

- **`/api/pipedream/token`** - Creates and refreshes Pipedream Connect tokens
- **`/api/pipedream/accounts/[accountId]`** - Retrieves account details for connected services

### Components

- **`PipedreamConnect`** - Main UI component for service connection
  - Service search and selection
  - Account connection flow
  - Connection status display

### Integration Points

The Pipedream Connect component is integrated into the main Nine-Line Portal interface and appears after login for authenticated users.

## Usage

### For Users

1. **Login** to the Nine-Line Portal
2. **Navigate** to the main dashboard
3. **Find** the "Connect External Services" section
4. **Search** for the service you want to connect (e.g., "slack", "google sheets")
5. **Select** the service from the dropdown
6. **Click** "Connect [Service Name]" to initiate the connection
7. **Follow** the OAuth flow in the popup window
8. **Verify** successful connection status

### For Developers

#### Using the PipedreamConnect Component

```tsx
import PipedreamConnect from './components/PipedreamConnect';

<PipedreamConnect
  externalUserId={user.id}
  onAccountConnected={(accountId, accountName, appSlug) => {
    // Handle successful connection
    console.log('Connected:', { accountId, accountName, appSlug });
  }}
  onError={(error) => {
    // Handle connection errors
    console.error('Connection error:', error);
  }}
  className="mb-6"
/>
```

#### Token Management

The integration automatically handles token creation and refresh. Tokens are short-lived and automatically renewed when needed.

#### Server-side API Usage

```typescript
import { PipedreamClient } from '@pipedream/sdk';

const client = new PipedreamClient({
  projectId: process.env.PIPEDREAM_PROJECT_ID,
  projectEnvironment: process.env.PIPEDREAM_PROJECT_ENVIRONMENT,
  clientId: process.env.PIPEDREAM_CLIENT_ID,
  clientSecret: process.env.PIPEDREAM_CLIENT_SECRET,
});

// Create a token for a user
const token = await client.tokens.create({
  externalUserId: 'user123'
});

// Get account details
const account = await client.accounts.get({
  id: 'account_id'
});
```

## Available Services

Pipedream Connect supports 2,900+ services including:
- Slack
- Google Workspace (Sheets, Drive, Gmail)
- Microsoft 365
- Salesforce
- HubSpot
- Stripe
- GitHub
- And many more...

## Security Considerations

- All API credentials are stored as environment variables
- Tokens are short-lived and automatically refreshed
- OAuth flows are handled securely through Pipedream's infrastructure
- No sensitive data is stored in the client-side code

## Troubleshooting

### Common Issues

1. **"Failed to initialize Pipedream client"**
   - Check that all environment variables are set correctly
   - Verify your Pipedream project credentials

2. **"No services found" in search**
   - Check network connectivity
   - Verify API endpoints are accessible

3. **Connection fails during OAuth**
   - Check that your Pipedream project has the correct redirect URLs configured
   - Verify that the service supports OAuth authentication

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will provide additional console output for debugging connection issues.

## API Reference

### PipedreamConnect Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `externalUserId` | string | Yes | Unique identifier for the user in your system |
| `onAccountConnected` | function | No | Callback when account is successfully connected |
| `onError` | function | No | Callback when an error occurs |
| `className` | string | No | Additional CSS classes for styling |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PIPEDREAM_PROJECT_ID` | Yes | Your Pipedream project ID |
| `PIPEDREAM_CLIENT_ID` | Yes | Your Pipedream client ID |
| `PIPEDREAM_CLIENT_SECRET` | Yes | Your Pipedream client secret |
| `PIPEDREAM_PROJECT_ENVIRONMENT` | No | Project environment (default: development) |
| `NEXT_PUBLIC_PIPEDREAM_PROJECT_ID` | Yes | Public project ID for client-side usage |
| `NEXT_PUBLIC_PIPEDREAM_FRONTEND_HOST` | No | Pipedream frontend host (default: pipedream.com) |
| `NEXT_PUBLIC_PIPEDREAM_API_HOST` | No | Pipedream API host (default: api.pipedream.com) |

## Support

For issues related to:
- **Nine-Line Portal integration**: Check the project's GitHub issues
- **Pipedream Connect**: Visit [Pipedream documentation](https://pipedream.com/docs/connect)
- **Specific service connections**: Refer to the service's OAuth documentation