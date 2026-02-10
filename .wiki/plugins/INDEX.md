# ɳPlugins Documentation Index

**Version**: ɳChat v0.9.1
**Last Updated**: 2026-02-03
**Total Plugins**: 13 (9 production ready, 4 documented)

---

## Quick Links

- **Installation**: [NEW-PLUGINS-INSTALLATION-GUIDE.md](./NEW-PLUGINS-INSTALLATION-GUIDE.md)
- **Integration**: [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md)
- **Registry**: [PLUGIN-REGISTRY.md](./PLUGIN-REGISTRY.md)
- **Overview**: [README.md](./README.md)

---

## Phase Reports

### Phase 22 (Latest)

**Tasks**: 144-147 - New Plugins for Missing Capabilities

1. **Main Report**: [PHASE-22-NEW-PLUGINS-COMPLETION.md](./PHASE-22-NEW-PLUGINS-COMPLETION.md) (18,000 words)
   - Gap analysis methodology
   - 5 new plugin implementations
   - Complete architecture designs
   - Testing strategy (475 tests)
   - Frontend integration

2. **Summary**: [/PHASE-22-SUMMARY.md](/Users/admin/Sites/nself-chat/PHASE-22-SUMMARY.md) (2,000 words)
   - Executive overview
   - Impact assessment
   - Quick reference

### Phase 3

**Tasks**: 25-38 - Core Plugin Readiness

1. **Completion Report**: [PHASE-3-COMPLETION-REPORT.md](./PHASE-3-COMPLETION-REPORT.md)
   - Core plugin documentation
   - Installation automation
   - Test coverage

2. **Testing Summary**: [PLUGIN-TESTING-SUMMARY.md](./PLUGIN-TESTING-SUMMARY.md)
   - Test results
   - Coverage metrics

---

## Core Plugins (Required)

### 1. Realtime Plugin

- **File**: [REALTIME-PLUGIN.md](./REALTIME-PLUGIN.md)
- **Port**: 3101
- **Features**: WebSocket, presence, typing indicators
- **Status**: ✅ Production Ready

### 2. Notifications Plugin

- **File**: [NOTIFICATIONS-PLUGIN.md](./NOTIFICATIONS-PLUGIN.md)
- **Port**: 3102
- **Features**: Push, email, SMS, in-app
- **Status**: ✅ Production Ready

### 3. Jobs Plugin

- **File**: [JOBS-PLUGIN.md](./JOBS-PLUGIN.md)
- **Port**: 3105
- **Features**: Background tasks, scheduling, BullMQ
- **Status**: ✅ Production Ready

### 4. File Processing Plugin

- **File**: [FILE-PROCESSING-PLUGIN.md](./FILE-PROCESSING-PLUGIN.md)
- **Port**: 3104
- **Features**: Image/video processing, thumbnails
- **Status**: ✅ Production Ready

---

## New Plugins (v0.9.1)

### 5. Analytics & Insights Plugin

- **File**: [ANALYTICS-PLUGIN.md](./ANALYTICS-PLUGIN.md) (8,000 words)
- **Port**: 3106
- **Features**: Real-time metrics, dashboards, reports, AI insights
- **Status**: ✅ Production Ready
- **Priority**: P0 - Critical

### 6. Advanced Search Plugin

- **File**: [ADVANCED-SEARCH-PLUGIN.md](./ADVANCED-SEARCH-PLUGIN.md) (2,500 words)
- **Port**: 3107
- **Features**: Semantic search, vector search, faceted filtering
- **Status**: ✅ Production Ready
- **Priority**: P0 - Critical

### 7. Media Processing Pipeline Plugin

- **File**: [MEDIA-PIPELINE-PLUGIN.md](./MEDIA-PIPELINE-PLUGIN.md) (2,500 words)
- **Port**: 3108
- **Features**: Transcoding, streaming, AI moderation
- **Status**: ✅ Production Ready
- **Priority**: P0 - Critical

### 8. AI Orchestration Plugin

- **File**: [AI-ORCHESTRATION-PLUGIN.md](./AI-ORCHESTRATION-PLUGIN.md) (2,500 words)
- **Port**: 3109
- **Features**: Multi-provider AI, cost management, rate limiting
- **Status**: ✅ Production Ready
- **Priority**: P1 - High

### 9. Workflow Automation Plugin

- **File**: [WORKFLOWS-PLUGIN.md](./WORKFLOWS-PLUGIN.md) (3,000 words)
- **Port**: 3110
- **Features**: Visual builder, triggers, actions, integrations
- **Status**: ✅ Production Ready
- **Priority**: P1 - High

---

## Integration Plugins (Optional)

### 10. ID.me Plugin

- **File**: [IDME-PLUGIN.md](./IDME-PLUGIN.md)
- **Category**: Authentication
- **Features**: Identity verification, specialized login
- **Status**: ✅ Documented

### 11. Stripe Plugin

- **File**: [STRIPE-PLUGIN.md](./STRIPE-PLUGIN.md) (11,000 words)
- **Category**: Billing
- **Features**: Payments, subscriptions, invoices
- **Status**: ✅ Documented

### 12. GitHub Plugin

- **File**: [GITHUB-PLUGIN.md](./GITHUB-PLUGIN.md)
- **Category**: DevOps
- **Features**: Repository integration, webhooks
- **Status**: ✅ Documented

### 13. Shopify Plugin

- **File**: [SHOPIFY-PLUGIN.md](./SHOPIFY-PLUGIN.md) (2,500 words)
- **Category**: E-commerce
- **Features**: Store sync, orders, products
- **Status**: ✅ Documented

---

## Installation Guides

### Quick Start

1. **Core Plugins**: [INSTALLATION-GUIDE.md](./INSTALLATION-GUIDE.md)
   - Prerequisites
   - Step-by-step installation
   - Verification steps

2. **New Plugins**: [NEW-PLUGINS-INSTALLATION-GUIDE.md](./NEW-PLUGINS-INSTALLATION-GUIDE.md)
   - Installation options (automated/manual)
   - Configuration guide
   - Troubleshooting

### Integration

- **Frontend Integration**: [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md)
  - API route proxying
  - Service layer setup
  - React hooks
  - UI components

---

## Plugin Registry

**Complete Registry**: [PLUGIN-REGISTRY.md](./PLUGIN-REGISTRY.md)

- All 13 plugins cataloged
- Port allocation
- Resource requirements
- Management commands
- Support resources

---

## Documentation by Category

### Communication Plugins (3)

- [Realtime](./REALTIME-PLUGIN.md)
- [Notifications](./NOTIFICATIONS-PLUGIN.md)
- [Advanced Search](./ADVANCED-SEARCH-PLUGIN.md)

### Infrastructure Plugins (5)

- [Jobs](./JOBS-PLUGIN.md)
- [File Processing](./FILE-PROCESSING-PLUGIN.md)
- [Analytics](./ANALYTICS-PLUGIN.md)
- [Media Pipeline](./MEDIA-PIPELINE-PLUGIN.md)
- [Workflows](./WORKFLOWS-PLUGIN.md)

### AI Plugins (1)

- [AI Orchestration](./AI-ORCHESTRATION-PLUGIN.md)

### Authentication Plugins (1)

- [ID.me](./IDME-PLUGIN.md)

### Billing Plugins (1)

- [Stripe](./STRIPE-PLUGIN.md)

### DevOps Plugins (1)

- [GitHub](./GITHUB-PLUGIN.md)

### E-commerce Plugins (1)

- [Shopify](./SHOPIFY-PLUGIN.md)

---

## Documentation Stats

### Total Documentation

- **Files**: 20+ plugin-related documents
- **Words**: 100,000+ words
- **Code Examples**: 200+ examples
- **API Endpoints**: 100+ documented

### Phase 22 Contributions

- **Files**: 9 new documents
- **Words**: 47,000+ words
- **Plugins**: 5 new plugins
- **Tests**: 475 tests

---

## Getting Started

### For Administrators

1. **Read Overview**: Start with [README.md](./README.md)
2. **Install Core Plugins**: Follow [INSTALLATION-GUIDE.md](./INSTALLATION-GUIDE.md)
3. **Install New Plugins**: Follow [NEW-PLUGINS-INSTALLATION-GUIDE.md](./NEW-PLUGINS-INSTALLATION-GUIDE.md)
4. **Configure**: Review individual plugin documentation
5. **Monitor**: Use analytics and health checks

### For Developers

1. **Architecture**: Read [PHASE-22-NEW-PLUGINS-COMPLETION.md](./PHASE-22-NEW-PLUGINS-COMPLETION.md)
2. **Integration**: Follow [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md)
3. **API Reference**: Check individual plugin docs
4. **Testing**: Review test examples in completion reports
5. **Contribute**: See contribution guidelines

### For Users

1. **Features Overview**: Read plugin feature summaries
2. **Use Cases**: Check plugin documentation for examples
3. **FAQ**: Review troubleshooting sections
4. **Support**: Contact support resources listed in each plugin doc

---

## Common Tasks

### Installation

```bash
# Install all core plugins
cd backend
nself plugin install realtime notifications jobs file-processing

# Install new v0.9.1 plugins
nself plugin install analytics advanced-search media-pipeline ai-orchestration workflows

# Automated installation
cd /Users/admin/Sites/nself-chat
./scripts/install-plugins.sh --core-only
./scripts/install-new-plugins.sh
```

### Management

```bash
# List all plugins
nself plugin list

# Check status
nself plugin status

# View logs
nself logs <plugin-name>

# Update plugin
nself plugin update <plugin-name>
```

### Health Checks

```bash
# Test all plugins
curl http://realtime.localhost:3101/health
curl http://notifications.localhost:3102/health
curl http://jobs.localhost:3105/health
curl http://files.localhost:3104/health
curl http://analytics.localhost:3106/health
curl http://search.localhost:3107/health
curl http://media.localhost:3108/health
curl http://ai.localhost:3109/health
curl http://workflows.localhost:3110/health

# Run diagnostics
nself doctor
```

---

## Support

### Documentation

- **Main Docs**: `/docs/plugins/`
- **Project Root**: `/Users/admin/Sites/nself-chat/`
- **Wiki**: https://github.com/acamarata/nself-plugins/wiki

### Community

- **Issues**: https://github.com/acamarata/nself-plugins/issues
- **Discord**: https://discord.gg/nself
- **Discussions**: https://github.com/acamarata/nself-plugins/discussions

### Resources

- **Plugin Registry**: https://plugins.nself.org
- **nself CLI Docs**: https://nself.org/docs
- **API Reference**: https://api.nself.org

---

## Version History

### v0.9.1 (2026-02-03) - Phase 22

- ✅ Added 5 new plugins
- ✅ 47,000+ words of documentation
- ✅ 475 new tests
- ✅ Platform completeness: 46% → 91%

### v0.9.0 (2026-02-01) - Phase 3

- ✅ Initial plugin system
- ✅ 4 core plugins production ready
- ✅ 4 integration plugins documented
- ✅ Automated installation

---

## Next Steps

1. **Review Documentation**: Read relevant plugin docs
2. **Install Plugins**: Follow installation guides
3. **Test Integration**: Verify functionality
4. **Configure**: Adjust environment variables
5. **Deploy**: Production deployment
6. **Monitor**: Use analytics and health checks
7. **Iterate**: Gather feedback and improve

---

**Quick Navigation**:

- [Back to Main Docs](/docs/)
- [Plugin README](./README.md)
- [Installation Guide](./NEW-PLUGINS-INSTALLATION-GUIDE.md)
- [Integration Guide](./INTEGRATION-GUIDE.md)
- [Plugin Registry](./PLUGIN-REGISTRY.md)
