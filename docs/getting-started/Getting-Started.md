# Getting Started

Get nchat up and running in under 5 minutes with this quick start guide.

## Prerequisites

Before you begin, ensure you have:

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | LTS recommended |
| Docker | 20+ | Docker Desktop or Docker Engine |
| Docker Compose | 2.0+ | Usually included with Docker |
| nself CLI | 0.4.2+ | Backend infrastructure |

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/nself/nself-chat.git
cd nself-chat
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Set Up the Backend

The backend uses the nself CLI to provide PostgreSQL, Hasura, and authentication services.

```bash
# Install nself CLI (if not already installed)
curl -fsSL https://nself.io/install.sh | bash

# Initialize the backend
cd .backend
nself init --demo
nself build
nself start

# Return to project root
cd ..
```

### 4. Configure Environment

Create your local environment file:

```bash
cp .env.example .env.local
```

The default configuration enables development mode with test users:

```env
# Backend URLs (via nself CLI)
NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql
NEXT_PUBLIC_AUTH_URL=http://auth.localhost/v1/auth
NEXT_PUBLIC_STORAGE_URL=http://storage.localhost/v1/storage

# Development Mode
NEXT_PUBLIC_USE_DEV_AUTH=true
NEXT_PUBLIC_ENV=development

# App Configuration
NEXT_PUBLIC_APP_NAME=nchat
NEXT_PUBLIC_PRIMARY_COLOR=#6366f1
```

### 5. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see nchat running.

## Development Mode Features

When `NEXT_PUBLIC_USE_DEV_AUTH=true`, you get:

### Test Users

Eight pre-configured users are available for testing:

| Email | Password | Role |
|-------|----------|------|
| owner@nself.org | password123 | Owner |
| admin@nself.org | password123 | Admin |
| moderator@nself.org | password123 | Moderator |
| member@nself.org | password123 | Member |
| guest@nself.org | password123 | Guest |
| alice@nself.org | password123 | Member |
| bob@nself.org | password123 | Member |
| charlie@nself.org | password123 | Member |

### Auto-Login

Development mode automatically logs in as `owner@nself.org` for faster iteration.

### Switch Users

Test different roles by switching users:

```typescript
import { useAuth } from '@/contexts/auth-context'

function MyComponent() {
  const { switchUser } = useAuth()

  // Switch to admin role
  await switchUser('admin@nself.org')

  // Switch to guest role
  await switchUser('guest@nself.org')
}
```

## Setup Wizard

On first launch, nchat presents a 9-step setup wizard:

1. **Welcome** - Introduction to nchat
2. **Owner Info** - Your name, email, company
3. **Auth Methods** - Choose authentication providers
4. **Access Permissions** - Set access control mode
5. **Features** - Enable/disable features
6. **Landing Page** - Configure landing page
7. **Branding** - App name, logo, colors
8. **Theme** - Choose from 8+ theme presets
9. **Review** - Confirm and save settings

## Project Structure

```
nself-chat/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   ├── config/           # Configuration
│   ├── graphql/          # GraphQL queries
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities
│   └── services/         # Service classes
├── .backend/             # nself CLI backend (gitignored)
├── public/               # Static assets
├── docs/                 # Documentation
└── package.json
```

## Next Steps

- [Installation Guide](Installation) - Detailed installation options
- [Configuration](Configuration) - All configuration options
- [Features Overview](Features/README) - Explore all features
- [Authentication](Authentication/README) - Set up auth providers
- [White Labeling](White-Label/README) - Customize branding

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## Backend Commands

```bash
# Navigate to backend
cd .backend

# Start services
nself start

# Stop services
nself stop

# View logs
nself logs

# Check status
nself status

# View service URLs
nself urls
```

## Troubleshooting

### Backend not running

```bash
cd .backend && nself start
```

### Port 3000 already in use

```bash
# Find process using port 3000
lsof -i :3000

# Or start on different port
PORT=3001 npm run dev
```

### Docker not running

Ensure Docker Desktop is running, then:

```bash
docker ps
```

### Database connection failed

Check PostgreSQL is running:

```bash
cd .backend && nself status
```

See the full [Installation Guide](Installation) for detailed troubleshooting.
