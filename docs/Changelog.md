# Changelog

All notable changes to nself-chat will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive CI/CD pipeline with GitHub Actions
- Multi-platform build support (Web, Desktop, Mobile, Docker)
- Deployment workflows for Vercel, Netlify, Docker, and Kubernetes
- Build scripts for automated builds
- Makefile for common development commands
- Dependabot and Renovate configuration for automated dependency updates
- CodeQL security scanning
- PR and issue templates

## [0.2.0] - 2025-01-28

### Added
- Initial project setup with Next.js 15 and React 19
- Complete setup wizard UI (9 steps)
- AppConfig data model and persistence
- Authentication (dev mode with test users)
- Theme system with 8+ presets
- GraphQL client setup
- Database schema with RBAC
- Radix UI component library
- Playwright E2E testing
- Jest unit testing

### Technical
- nself CLI v0.4.2 backend integration
- pnpm package manager with workspace support
- TypeScript strict mode
- ESLint and Prettier configuration
- Tailwind CSS for styling

## [0.1.0] - 2024-09-11

### Added
- Initial project structure
- Basic Next.js configuration
- Tailwind CSS setup
- Basic authentication structure

[Unreleased]: https://github.com/nself/nself-chat/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/nself/nself-chat/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/nself/nself-chat/releases/tag/v0.1.0
