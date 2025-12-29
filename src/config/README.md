# Configuration

This directory contains application configuration files.

## Usage

Place configuration files here such as:
- API endpoints
- Feature flags
- Environment-specific settings
- Constants

Example:
```typescript
// config/api.ts
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 30000,
}
```

