# nChat CLI

Command-line interface for nChat development, deployment, and management.

## Installation

```bash
# Install globally
npm install -g @nchat/cli

# Or use via npx
npx @nchat/cli [command]

# Or use pnpm in the project
pnpm nchat-cli [command]
```

## Commands

### Development

```bash
# Start development server
nchat-cli dev start

# Start with Turbopack
nchat-cli dev start --turbo

# Start backend services
nchat-cli dev backend

# Build for production
nchat-cli dev build

# Run tests
nchat-cli dev test
nchat-cli dev test --watch
nchat-cli dev test --coverage
```

### Database

```bash
# Run migrations
nchat-cli db migrate

# Migrate down
nchat-cli db migrate --down

# Seed database
nchat-cli db seed --users 100 --channels 10

# Reset database (WARNING: destroys data)
nchat-cli db reset --force

# Check database status
nchat-cli db status

# Backup database
nchat-cli db backup

# Restore from backup
nchat-cli db restore backup-file.sql
```

### User Management

```bash
# Create user
nchat-cli user create --email user@example.com --name "John Doe" --role member

# List users
nchat-cli user list

# Update user
nchat-cli user update <userId> --role admin

# Delete user
nchat-cli user delete <userId> --force

# Suspend user
nchat-cli user suspend <userId> --reason "Violation"

# Unsuspend user
nchat-cli user unsuspend <userId>
```

### Channel Management

```bash
# Create channel
nchat-cli channel create --name general --type public

# List channels
nchat-cli channel list

# Delete channel
nchat-cli channel delete <channelId> --force

# Archive channel
nchat-cli channel archive <channelId>
```

### Deployment

```bash
# Deploy to Vercel
nchat-cli deploy vercel --prod

# Build and push Docker image
nchat-cli deploy docker --tag latest --push

# Deploy to Kubernetes
nchat-cli deploy k8s --namespace production
```

### Configuration

```bash
# Get configuration
nchat-cli config get

# Get specific key
nchat-cli config get branding.appName

# Set configuration value
nchat-cli config set branding.appName "My Chat App"

# Export configuration
nchat-cli config export --output config.json --format json

# Import configuration
nchat-cli config import config.json --merge
```

### Backup & Restore

```bash
# Create full backup
nchat-cli backup create --include-media

# List backups
nchat-cli backup list

# Restore from backup
nchat-cli backup restore backup-file.tar.gz --force

# Delete backup
nchat-cli backup delete backup-file.tar.gz
```

## Global Options

```bash
-v, --verbose     # Enable verbose output
--no-color        # Disable colored output
-h, --help        # Show help
-V, --version     # Show version
```

## Examples

### Full Development Setup

```bash
# Start backend services
nchat-cli dev backend

# Run migrations
nchat-cli db migrate

# Seed sample data
nchat-cli db seed --users 50 --channels 5 --messages 100

# Start dev server
nchat-cli dev start
```

### Production Deployment

```bash
# Build application
nchat-cli dev build

# Create backup before deploy
nchat-cli backup create --include-media

# Deploy to production
nchat-cli deploy vercel --prod
```

### User Administration

```bash
# Create admin user
nchat-cli user create \
  --email admin@example.com \
  --name "Admin User" \
  --password "secure123" \
  --role admin

# List all users
nchat-cli user list --limit 100

# Promote user to moderator
nchat-cli user update user-123 --role moderator
```

## Configuration File

Create `.nchatrc.json` in project root for default options:

```json
{
  "apiUrl": "https://api.nchat.example.com",
  "apiKey": "your-api-key",
  "database": {
    "backupDir": "./backups"
  },
  "deploy": {
    "vercel": {
      "project": "my-nchat-app"
    }
  }
}
```

## Environment Variables

```bash
NCHAT_API_URL           # API base URL
NCHAT_API_KEY           # API key for authentication
NCHAT_DB_URL            # Database connection URL
NCHAT_DEBUG             # Enable debug mode
```

## Troubleshooting

### Backend won't start

```bash
# Check status
nchat-cli dev backend

# View logs
cd .backend && nself logs
```

### Migration fails

```bash
# Check database connection
nchat-cli db status

# Try resetting (WARNING: loses data)
nchat-cli db reset --force
```

### Build errors

```bash
# Clean and rebuild
pnpm clean
nchat-cli dev build
```

## Support

- Documentation: https://docs.nchat.example.com
- Issues: https://github.com/nself-chat/nself-chat/issues
- Discord: https://discord.gg/nchat

## License

MIT License - see LICENSE for details
