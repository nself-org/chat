# Troubleshooting & Support

Help documentation for resolving common issues, operational runbooks, and frequently asked questions.

## Contents

### Main Documentation

- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Comprehensive troubleshooting guide for common issues
- **[FAQ](FAQ.md)** - Frequently asked questions and answers
- **[Runbook](RUNBOOK.md)** - Operational procedures and incident response

## Quick Help

### Common Issues

#### Installation & Setup

- **Problem**: Backend services won't start
  - See [TROUBLESHOOTING.md - Backend Issues](TROUBLESHOOTING.md#backend-issues)

- **Problem**: Environment variables not loading
  - See [TROUBLESHOOTING.md - Configuration](TROUBLESHOOTING.md#configuration-issues)

- **Problem**: Database migrations failing
  - See [RUNBOOK.md - Database Operations](RUNBOOK.md#database-operations)

#### Authentication

- **Problem**: Can't log in
  - See [TROUBLESHOOTING.md - Authentication](TROUBLESHOOTING.md#authentication-issues)

- **Problem**: OAuth providers not working
  - See [FAQ.md - Authentication](FAQ.md#authentication)

#### Performance

- **Problem**: Slow page loads
  - See [TROUBLESHOOTING.md - Performance](TROUBLESHOOTING.md#performance-issues)

- **Problem**: High memory usage
  - See [RUNBOOK.md - Performance Monitoring](RUNBOOK.md#performance-monitoring)

#### Real-Time Features

- **Problem**: Messages not appearing in real-time
  - See [TROUBLESHOOTING.md - WebSocket Issues](TROUBLESHOOTING.md#websocket-issues)

- **Problem**: Voice/video calls not connecting
  - See [TROUBLESHOOTING.md - WebRTC Issues](TROUBLESHOOTING.md#webrtc-issues)

## How to Use This Section

### For End Users

1. Start with [FAQ.md](FAQ.md) for quick answers to common questions
2. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for step-by-step problem resolution
3. Contact support if issue persists (see Support section below)

### For Developers

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for development environment issues
2. Review [RUNBOOK.md](RUNBOOK.md) for operational procedures
3. Use [FAQ.md](FAQ.md) for architecture and implementation questions

### For DevOps/SRE

1. Use [RUNBOOK.md](RUNBOOK.md) as primary operational reference
2. Follow incident response procedures in [RUNBOOK.md](RUNBOOK.md#incident-response)
3. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for production issue diagnosis

### For Support Teams

1. Start with [FAQ.md](FAQ.md) for common user questions
2. Escalate to [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for technical issues
3. Use [RUNBOOK.md](RUNBOOK.md) for system-level investigations

## Issue Categories

### By Severity

**Critical (P0):**

- System down or unavailable
- Data loss or corruption
- Security breaches
  → Follow [RUNBOOK.md - Incident Response](RUNBOOK.md#incident-response)

**High (P1):**

- Major feature not working
- Significant performance degradation
- Authentication failures
  → Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) + [RUNBOOK.md](RUNBOOK.md)

**Medium (P2):**

- Minor feature issues
- Cosmetic bugs
- Configuration questions
  → Check [FAQ.md](FAQ.md) + [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**Low (P3):**

- Feature requests
- General questions
- Documentation clarifications
  → Check [FAQ.md](FAQ.md)

### By Component

**Frontend:**

- UI not rendering correctly
- Client-side errors
- Browser compatibility
  → [TROUBLESHOOTING.md - Frontend Issues](TROUBLESHOOTING.md#frontend-issues)

**Backend:**

- API errors
- Database connection issues
- Server crashes
  → [TROUBLESHOOTING.md - Backend Issues](TROUBLESHOOTING.md#backend-issues) + [RUNBOOK.md](RUNBOOK.md)

**Infrastructure:**

- Docker/Kubernetes issues
- Networking problems
- Storage issues
  → [RUNBOOK.md - Infrastructure](RUNBOOK.md#infrastructure)

**Third-Party:**

- OAuth provider issues
- Integration failures
- External service errors
  → [TROUBLESHOOTING.md - Integrations](TROUBLESHOOTING.md#integration-issues)

## Diagnostic Tools

### Health Checks

```bash
# Check backend services
pnpm backend:status

# Check frontend build
pnpm build

# Run diagnostics
pnpm validate
```

### Logs

```bash
# View backend logs
cd .backend && nself logs

# View specific service logs
cd .backend && nself logs hasura

# Follow logs in real-time
cd .backend && nself logs -f
```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=*
export NEXT_PUBLIC_DEBUG=true

# Enable Sentry in development
export SENTRY_ENABLE_DEV=true
```

## Getting Help

### Self-Service

1. **Search the docs**: Use search or browse by category
2. **Check FAQ**: [FAQ.md](FAQ.md) has 50+ common Q&A
3. **Try troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) has step-by-step guides
4. **Review runbook**: [RUNBOOK.md](RUNBOOK.md) for operational procedures

### Community Support

- **GitHub Discussions**: [nself-chat/discussions](https://github.com/nself/nself-chat/discussions)
- **Discord**: [nself Community](https://discord.gg/nself)
- **Stack Overflow**: Tag questions with `nself-chat`

### Commercial Support

- **Email**: support@nself.org
- **Enterprise Support**: enterprise@nself.org
- **GitHub Issues**: [Report a bug](https://github.com/nself/nself-chat/issues/new?template=bug_report.md)

### Emergency Support

For critical production issues:

- **Severity 1 (P0)**: Email emergency@nself.org
- **Security Issues**: Email security@nself.org (PGP key available)

## Documentation Structure

```
troubleshooting/
├── README.md              # This file - Help overview
├── TROUBLESHOOTING.md    # Comprehensive troubleshooting guide
├── FAQ.md                # Frequently asked questions
└── RUNBOOK.md           # Operational procedures
```

### TROUBLESHOOTING.md

- 100+ common issues organized by category
- Step-by-step resolution procedures
- Code examples and configuration fixes
- Cross-references to related documentation

### FAQ.md

- 50+ frequently asked questions
- Organized by topic (features, deployment, config, etc.)
- Quick answers with links to detailed docs
- Updated based on community questions

### RUNBOOK.md

- Operational procedures for production systems
- Incident response workflows
- Monitoring and alerting setup
- Backup and recovery procedures
- Performance optimization guides

## Related Documentation

- [Getting Started](../getting-started/Getting-Started.md) - Installation guide
- [Configuration](../configuration/Configuration.md) - System configuration
- [Deployment](../deployment/DEPLOYMENT.md) - Production deployment
- [Architecture](../reference/Architecture.md) - System architecture
- [API Documentation](../api/API.md) - API reference

## Contributing

Help improve troubleshooting docs:

1. Found a solution to a new issue? Add it to [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Have a common question? Add it to [FAQ.md](FAQ.md)
3. Discovered an operational procedure? Document it in [RUNBOOK.md](RUNBOOK.md)

See [Contributing Guidelines](../about/Contributing.md) for how to submit improvements.

## Version Information

**Documentation Version:** 0.5.0
**Last Updated:** January 31, 2026
**Coverage:** 3 comprehensive guides

---

[← Back to Documentation Home](../Home.md)
