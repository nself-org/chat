# Deployment Guides

This directory contains comprehensive deployment guides for nchat (nself-chat).

---

## 📚 Complete Guides

### 🌐 Production Deployment (Comprehensive)

**[production-deployment.md](./production-deployment.md)** - **START HERE FOR PRODUCTION**

- Complete production deployment guide (2,740 lines)
- Multiple deployment options (VPS, Kubernetes, Serverless)
- Cloud provider comparisons (AWS, GCP, DigitalOcean, Hetzner, Oracle, etc.)
- nself CLI backend configuration and deployment
- SSL/TLS setup with Let's Encrypt
- Monitoring & observability (Sentry, Prometheus, Grafana)
- Backup & disaster recovery strategies
- Security hardening best practices
- Comprehensive troubleshooting guide
- Cost optimization strategies

**[quick-reference.md](./quick-reference.md)** - **QUICK START COMMANDS**

- Quick reference companion to production guide
- Essential commands and common patterns
- Common issues and fast solutions
- Cost estimates by deployment size
- Performance targets and benchmarks

### ☁️ Platform-Specific Guides

**[vercel-deployment.md](./vercel-deployment.md)** - Serverless deployment

- One-click deployment to Vercel
- Step-by-step guide for beginners
- Environment configuration
- Preview deployments

**[mobile-deployment.md](./mobile-deployment.md)** - Mobile apps

- iOS deployment (Capacitor)
- Android deployment (Capacitor)
- React Native setup
- App store submission

**[desktop-deployment.md](./desktop-deployment.md)** - Desktop apps

- Electron deployment (Windows, macOS, Linux)
- Tauri deployment (lightweight alternative)
- Code signing and auto-updates

---

## Quick Links

- **[Production Deployment Guide](./production-deployment.md)** - Complete guide for production deployments
- **[Quick Reference](./quick-reference.md)** - Fast commands and troubleshooting
- **[Vercel Deployment](./vercel-deployment.md)** - Serverless deployment guide
- [Docker Deployment](../../deployment/Deployment-Docker.md) - Deploy using Docker containers
- [Kubernetes Deployment](../../deployment/Deployment-Kubernetes.md) - Deploy to Kubernetes clusters
- [General Deployment Guide](../../deployment/DEPLOYMENT.md) - Overview of all deployment options

## 🚀 Recommended Deployment Paths

### For Production (Self-Hosted)

**[Production Deployment Guide](./production-deployment.md)** - Complete guide covering:

- **Budget Option** (~$6-10/month): Hetzner VPS or Oracle Free Tier
- **Standard Option** (~$100-200/month): DigitalOcean Kubernetes
- **Enterprise Option** ($500+/month): Multi-region Kubernetes

**Quick start**: See [quick-reference.md](./quick-reference.md) for copy-paste commands.

### For Quick Testing/Serverless

**[Vercel Deployment](./vercel-deployment.md)** - Easiest deployment:

1. **Zero Configuration**: Works out-of-the-box with Next.js
2. **Free Tier**: Generous free tier for hobby projects
3. **Automatic SSL**: Free HTTPS certificates
4. **Global CDN**: Fast page loads worldwide
5. **Preview Deployments**: Every git push gets a preview URL

### For Mobile Apps

**[Mobile Deployment Guide](./mobile-deployment.md)** - iOS & Android deployment

### For Desktop Apps

**[Desktop Deployment Guide](./desktop-deployment.md)** - Electron & Tauri deployment

---

## 📊 Deployment Options Comparison

| Platform             | Difficulty   | Cost/mo  | Users  | Setup Time | Best For          |
| -------------------- | ------------ | -------- | ------ | ---------- | ----------------- |
| **Oracle Free** 🆓   | Beginner     | $0       | <500   | 30 min     | Learning, MVP     |
| **Hetzner VPS** ⭐   | Intermediate | $6-13    | <1K    | 45 min     | Budget production |
| **Vercel**           | Beginner     | $0-40    | <10K   | 15 min     | Quick deploys     |
| **DigitalOcean K8s** | Advanced     | $100-500 | 1K-10K | 2 hours    | Production        |
| **AWS/GCP**          | Expert       | $500+    | 10K+   | 1 week     | Enterprise        |

**Legend**: ⭐ = Recommended, 🆓 = Free tier available

## Need Help?

- Check the [troubleshooting section](./vercel-deployment.md#troubleshooting) in the Vercel guide
- Join our [Discord community](https://discord.gg/nself)
- Open an issue on [GitHub](https://github.com/nself/nself-chat/issues)

## Backend Requirements

nchat requires a backend with these services:

1. **PostgreSQL** - Database
2. **Hasura** - GraphQL API
3. **Auth** - Authentication service
4. **Storage** - File storage (S3/MinIO)

### Backend Options

- **Nhost Cloud** (Recommended for beginners): Managed backend-as-a-service
- **nself CLI** (Self-hosted): Deploy your own backend stack

See the [Backend Setup Guide](../../INFRASTRUCTURE.md) for details.
