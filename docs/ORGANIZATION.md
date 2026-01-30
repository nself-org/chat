# Documentation Organization Guide

This document explains how the nself-chat documentation is organized.

## Overview

The documentation has been reorganized into 10 logical categories, making it easy to find what you need based on your role and task.

## Root Files

The following files remain in the `docs/` root:

- **README.md** - Main documentation index (start here!)
- **Home.md** - Wiki home page
- **_Sidebar.md** - Wiki sidebar navigation
- **_Footer.md** - Wiki footer

## Directory Structure

### 📚 [getting-started/](getting-started/) - Start Here
**For**: New users and administrators
**Content**: Installation guides, quick start, first steps

**Key Files**:
- `QUICK-START.md` - 5-minute quick start guide
- `INSTALLATION.md` - Detailed installation instructions
- `Getting-Started.md` - First steps after installation

---

### ✨ [features/](features/) - Feature Documentation
**For**: Users, administrators, product managers
**Content**: Feature descriptions, capabilities, and summaries

**Categories**:
- **Core Features**: Features.md, Features-Complete.md, Features-Messaging.md
- **Communication**: VOICE-CALLING-COMPLETE.md, LIVE_STREAMING_IMPLEMENTATION_SUMMARY.md
- **Interactive**: GIF-Sticker-Implementation.md, Polls-Implementation.md
- **Integration**: Social-Media-Integration.md, Bots.md
- **Customization**: White-Label-Guide.md, Plugins.md

---

### 📖 [guides/](guides/) - Implementation Guides
**For**: Developers, system integrators
**Content**: Step-by-step implementation guides and how-tos

**Categories**:
- **Communication Setup**: Call-Management-Guide.md, Voice-Calling-Implementation.md
- **Security Implementation**: E2EE-Implementation.md
- **Feature Setup**: Search-Implementation.md, advanced-messaging-implementation-summary.md
- **User Documentation**: USER-GUIDE.md, Settings-Quick-Start.md
- **Development**: testing-guide.md, integration-examples.md

---

### 📚 [reference/](reference/) - Technical Reference
**For**: Developers, architects
**Content**: Quick references, diagrams, API specs, architecture

**Categories**:
- **Architecture**: Architecture.md, ARCHITECTURE-DIAGRAMS.md
- **Database**: Database-Schema.md
- **Code**: Project-Structure.md, Types.md, SPORT.md
- **Quick References**: All *-Quick-Reference.md and *-Quick-Start.md files
- **Diagrams**: Call-State-Machine-Diagram.md

---

### ⚙️ [configuration/](configuration/) - Configuration
**For**: Administrators, DevOps
**Content**: Configuration options and setup

**Key Files**:
- `Configuration.md` - Complete configuration reference
- `Authentication.md` - Auth provider setup
- `Environment-Variables.md` - All environment variables

---

### 📡 [api/](api/) - API Documentation
**For**: Developers, bot developers
**Content**: API documentation, examples, bot integration

**Key Files**:
- `API.md` - API overview
- `API-DOCUMENTATION.md` - Complete API reference
- `API-EXAMPLES.md` - Code examples
- `BOT_API_IMPLEMENTATION.md` - Bot API guide

---

### 🚀 [deployment/](deployment/) - Production Deployment
**For**: DevOps, system administrators
**Content**: Production deployment guides and checklists

**Key Files**:
- `DEPLOYMENT.md` - Deployment overview
- `Deployment-Docker.md` - Docker deployment
- `Deployment-Kubernetes.md` - Kubernetes deployment
- `Deployment-Helm.md` - Helm charts
- `Production-Deployment-Checklist.md` - Pre-deployment checklist
- `Production-Validation.md` - Post-deployment validation

---

### 🔐 [security/](security/) - Security
**For**: Security engineers, administrators
**Content**: Security features, audits, and implementation

**Categories**:
- **Security Overview**: SECURITY.md, SECURITY-AUDIT.md
- **Authentication**: 2FA-Implementation-Summary.md, PIN-LOCK-SYSTEM.md
- **Encryption**: E2EE-Implementation-Summary.md, E2EE-Security-Audit.md
- **Performance**: PERFORMANCE-OPTIMIZATION.md

---

### 🆘 [troubleshooting/](troubleshooting/) - Help & Support
**For**: All users
**Content**: Common issues, FAQs, operations guide

**Key Files**:
- `FAQ.md` - Frequently asked questions
- `TROUBLESHOOTING.md` - Common issues and solutions
- `RUNBOOK.md` - Operations guide

---

### ℹ️ [about/](about/) - Project Information
**For**: Contributors, project managers
**Content**: Project history, planning, releases, documentation

**Categories**:
- **Releases**: RELEASE-NOTES-v0.3.0.md, RELEASE-CHECKLIST-v0.3.0.md
- **Planning**: Roadmap.md, Roadmap-v0.2.md, UPGRADE-GUIDE.md
- **History**: Changelog.md, IMPLEMENTATION_COMPLETE.md
- **Contributing**: Contributing.md
- **Documentation**: DOCUMENTATION-AUDIT.md, DOCUMENTATION-MAP.md

---

## How to Find What You Need

### I want to...

#### Get started quickly
→ [getting-started/QUICK-START.md](getting-started/QUICK-START.md)

#### Install nself-chat
→ [getting-started/INSTALLATION.md](getting-started/INSTALLATION.md)

#### Learn about a feature
→ [features/](features/) directory

#### Implement a feature
→ [guides/](guides/) directory

#### Configure the application
→ [configuration/](configuration/) directory

#### Use the API
→ [api/](api/) directory

#### Deploy to production
→ [deployment/](deployment/) directory

#### Understand the architecture
→ [reference/Architecture.md](reference/Architecture.md)

#### Find quick reference
→ [reference/](reference/) directory (look for *-Quick-Reference.md files)

#### Troubleshoot an issue
→ [troubleshooting/](troubleshooting/) directory

#### Contribute to the project
→ [about/Contributing.md](about/Contributing.md)

#### See what's new
→ [about/Changelog.md](about/Changelog.md)

#### Plan an upgrade
→ [about/UPGRADE-GUIDE.md](about/UPGRADE-GUIDE.md)

---

## Documentation by Role

### End Users
1. [Quick Start](getting-started/QUICK-START.md)
2. [User Guide](guides/USER-GUIDE.md)
3. [Settings Guide](guides/Settings-Quick-Start.md)
4. [FAQ](troubleshooting/FAQ.md)

### Administrators
1. [Installation](getting-started/INSTALLATION.md)
2. [Configuration](configuration/Configuration.md)
3. [Deployment](deployment/DEPLOYMENT.md)
4. [Security](security/SECURITY.md)
5. [Troubleshooting](troubleshooting/TROUBLESHOOTING.md)
6. [Runbook](troubleshooting/RUNBOOK.md)

### Developers
1. [Architecture](reference/Architecture.md)
2. [Project Structure](reference/Project-Structure.md)
3. [API Documentation](api/API-DOCUMENTATION.md)
4. [API Examples](api/API-EXAMPLES.md)
5. [Testing Guide](guides/testing-guide.md)
6. [Contributing](about/Contributing.md)

### DevOps Engineers
1. [Deployment Overview](deployment/DEPLOYMENT.md)
2. [Docker Deployment](deployment/Deployment-Docker.md)
3. [Kubernetes Deployment](deployment/Deployment-Kubernetes.md)
4. [Production Checklist](deployment/Production-Deployment-Checklist.md)
5. [Production Validation](deployment/Production-Validation.md)
6. [Runbook](troubleshooting/RUNBOOK.md)

### Bot Developers
1. [Bot API](api/BOT_API_IMPLEMENTATION.md)
2. [Bots Guide](features/Bots.md)
3. [API Examples](api/API-EXAMPLES.md)
4. [Integration Examples](guides/integration-examples.md)

---

## File Naming Conventions

The documentation uses the following naming conventions:

- **UPPERCASE.md** - High-level guides and important documents
- **Title-Case.md** - Feature documentation and guides
- **lowercase-with-dashes.md** - Implementation details and technical docs
- **Feature-Implementation.md** - Detailed implementation guides
- **Feature-Quick-Reference.md** - Quick reference cards
- **Feature-Quick-Start.md** - Quick start guides

---

## Navigation

Use the following for navigation:

1. **README.md** - Complete documentation index
2. **_Sidebar.md** - Wiki sidebar (when using GitHub wiki mode)
3. **This File (ORGANIZATION.md)** - Understanding the structure

---

## Statistics

- **Total documentation files**: 96 markdown files
- **Subdirectories**: 10 organized categories
- **Files in root**: 4 (README, Home, _Sidebar, _Footer)
- **Average files per directory**: 9.2 files

---

## Maintenance

When adding new documentation:

1. **Determine the category** - Which directory does it belong in?
2. **Follow naming conventions** - Use appropriate naming pattern
3. **Update README.md** - Add link to main documentation index
4. **Update _Sidebar.md** - Add to wiki sidebar if applicable
5. **Cross-reference** - Link from related documents

---

<div align="center">

**Version 0.3.0** • **January 2026**

[Main Documentation](README.md) • [Quick Start](getting-started/QUICK-START.md) • [Contributing](about/Contributing.md)

</div>
