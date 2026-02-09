# Anti-Censorship Resilience Guide

**Version**: 1.0.0
**Date**: 2026-02-08
**Status**: Active
**Classification**: Operational

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Pluggable Transports](#pluggable-transports)
4. [Domain Fronting](#domain-fronting)
5. [Proxy and Bridge Configuration](#proxy-and-bridge-configuration)
6. [Censorship Detection](#censorship-detection)
7. [Fallback Strategies](#fallback-strategies)
8. [Operational Procedures](#operational-procedures)
9. [Troubleshooting](#troubleshooting)
10. [Security Considerations](#security-considerations)

---

## Overview

This document provides operational guidance for deploying and maintaining nself-chat's anti-censorship capabilities. The system is designed to maintain connectivity in restrictive network environments through multiple fallback mechanisms.

### Key Capabilities

| Feature | Description | Use Case |
|---------|-------------|----------|
| **Pluggable Transports** | Abstraction layer for multiple connection methods | Flexible connection strategies |
| **Domain Fronting** | CDN-based traffic masking | Bypass SNI-based filtering |
| **Proxy/Bridge Support** | SOCKS5, HTTP, Shadowsocks, obfs4 | Route traffic through intermediaries |
| **Censorship Detection** | Automatic identification of blocking | Trigger appropriate fallback |
| **Automatic Fallback** | Seamless transition between methods | Maintain connectivity |

### Threat Model Coverage

This implementation addresses the following threats from the [Threat Model](./THREAT-MODEL.md):

- **N3.5** - Traffic analysis (via obfuscation)
- **L5.1** - Compelled disclosure (via routing)
- **I7** - Metadata analysis (via transport masking)

---

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Unified Network Client                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   Transport    │  │    Domain      │  │     Proxy      │    │
│  │    Manager     │  │   Fronting     │  │    Manager     │    │
│  │                │  │    Client      │  │                │    │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘    │
│          │                   │                   │              │
│  ┌───────┴───────────────────┴───────────────────┴────────┐    │
│  │                  Censorship Detector                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Normal Operation**: Client connects via primary WebSocket transport
2. **Detection**: Censorship detector monitors for blocking indicators
3. **Fallback**: On detection, system switches to alternative transport
4. **Reconnection**: Traffic routed through CDN/proxy/bridge as needed

---

## Pluggable Transports

### Supported Transport Types

| Type | Protocol | Port | Obfuscation | Best For |
|------|----------|------|-------------|----------|
| `websocket` | WS | 80 | None | Unrestricted networks |
| `websocket-tls` | WSS | 443 | TLS | Standard deployment |
| `http-polling` | HTTP(S) | 80/443 | None | WebSocket-blocked environments |
| `domain-fronted` | HTTPS | 443 | CDN masking | SNI filtering |
| `obfs4` | Custom | Any | Strong | DPI environments |
| `meek` | HTTPS | 443 | CDN | High-censorship regions |
| `snowflake` | WebRTC | Dynamic | NAT traversal | Dynamic blocking |

### Configuration Example

```typescript
import {
  TransportManager,
  createWebSocketConfig,
  createHTTPPollingConfig,
  TransportPriority
} from '@/lib/network'

// Create transport manager
const manager = new TransportManager()

// Register primary transport
manager.registerTransport(createWebSocketConfig('wss://api.example.com', {
  priority: TransportPriority.PRIMARY,
  options: {
    connectionTimeout: 30000,
    keepAliveInterval: 30000,
  },
}))

// Register fallback transport
manager.registerTransport(createHTTPPollingConfig('https://api.example.com/poll', {
  priority: TransportPriority.SECONDARY,
}))

// Negotiate best connection
const result = await manager.negotiate()
console.log(`Connected via: ${result.transport.type}`)
```

### Transport Selection

The system automatically selects the best transport based on:

1. **Priority**: Lower priority number = preferred
2. **Health**: Only healthy transports considered
3. **Latency**: Among equal priority, lowest latency wins
4. **Availability**: Failed transports are temporarily excluded

---

## Domain Fronting

### How It Works

Domain fronting exploits the difference between DNS/SNI and HTTP Host headers:

1. Client sends HTTPS request to allowed CDN domain (e.g., `cdn.allowed.com`)
2. SNI shows `cdn.allowed.com` (passes DPI inspection)
3. HTTP Host header contains actual destination (`real.blocked.com`)
4. CDN routes request to the actual backend

### Supported CDN Providers

| Provider | Domains | Notes |
|----------|---------|-------|
| Cloudflare | `cdnjs.cloudflare.com`, `ajax.cloudflare.com` | Widely available |
| CloudFront | `*.cloudfront.net` | AWS-hosted |
| Fastly | `global.fastly.net` | GitHub uses Fastly |
| Akamai | `*.akamai.net` | Enterprise CDN |
| Azure CDN | `*.azureedge.net` | Microsoft services |
| Google Cloud | `storage.googleapis.com` | Google infrastructure |

### Configuration Example

```typescript
import {
  DomainFrontingClient,
  createCloudflareEndpoint,
  createCloudFrontEndpoint,
} from '@/lib/network'

// Create client
const client = new DomainFrontingClient({
  enabled: true,
  strategy: 'sni-host-split',
  obfuscation: {
    randomPath: true,
    randomQuery: true,
    timingJitter: true,
    maxJitterMs: 500,
  },
})

// Add endpoints
client.addEndpoint(createCloudflareEndpoint(
  'cdnjs.cloudflare.com',  // Front domain (visible in SNI)
  'api.realserver.com'     // Host header (actual destination)
))

client.addEndpoint(createCloudFrontEndpoint(
  'd1234567890abc',        // CloudFront distribution ID
  'api.realserver.com'
))

// Make fronted request
const response = await client.request({
  method: 'POST',
  path: '/api/messages',
  body: JSON.stringify({ content: 'Hello' }),
})
```

### Endpoint Health Monitoring

The client automatically monitors endpoint health and rotates to healthy endpoints:

```typescript
// Manual health check
await client.performHealthChecks()

// Get healthy endpoints
const healthy = client.getHealthyEndpoints()
console.log(`${healthy.length} healthy endpoints available`)

// Test specific endpoint
const result = await client.testEndpoint(endpoint)
console.log(`Latency: ${result.latency}ms, Success: ${result.success}`)
```

---

## Proxy and Bridge Configuration

### Proxy Types

#### SOCKS5 Proxy

```typescript
import { ProxyManager, createSocks5Proxy } from '@/lib/network'

const manager = new ProxyManager({ enabled: true })

manager.addProxy(createSocks5Proxy('proxy.example.com', 1080, {
  auth: {
    type: 'basic',
    username: 'user',
    password: 'password',
  },
  priority: 1,
  region: 'us-east',
}))
```

#### HTTP Proxy

```typescript
import { createHttpProxy } from '@/lib/network'

manager.addProxy(createHttpProxy('proxy.example.com', 8080, {
  priority: 2,
}))
```

#### Shadowsocks

```typescript
import { createShadowsocksProxy } from '@/lib/network'

manager.addProxy(createShadowsocksProxy({
  host: 'ss.example.com',
  port: 8388,
  password: 'your-password',
  cipher: 'aes-256-gcm',
}))
```

### Bridge Types

#### obfs4 Bridge

Best for evading deep packet inspection:

```typescript
import { createObfs4Bridge } from '@/lib/network'

manager.addBridge(createObfs4Bridge({
  address: 'bridge.example.com',
  port: 443,
  fingerprint: 'ABCD1234...',
  cert: 'base64-encoded-cert',
  iatMode: 0,  // 0=disabled, 1=enabled, 2=paranoid
}))
```

#### Meek Bridge

For extremely restrictive environments:

```typescript
import { createMeekBridge } from '@/lib/network'

manager.addBridge(createMeekBridge({
  cdnUrl: 'https://d2cly7j4zqgua7.cloudfront.net/',
  frontDomain: 'ajax.aspnetcdn.com',
}))
```

#### Snowflake Bridge

For dynamic, volunteer-based circumvention:

```typescript
import { createSnowflakeBridge } from '@/lib/network'

manager.addBridge(createSnowflakeBridge({
  brokerUrl: 'https://snowflake-broker.torproject.net/',
  stunServers: [
    'stun:stun.l.google.com:19302',
    'stun:stun.voip.blackberry.com:3478',
  ],
}))
```

### Proxy Chains

Route traffic through multiple proxies:

```typescript
import { createProxyChain } from '@/lib/network'

// Create proxies
const proxy1 = createSocks5Proxy('first.proxy.com', 1080)
const proxy2 = createSocks5Proxy('second.proxy.com', 1080)

manager.addProxy(proxy1)
manager.addProxy(proxy2)

// Create chain
manager.addChain(createProxyChain({
  name: 'Double Hop',
  proxyIds: [proxy1.id, proxy2.id],
  strategy: 'strict',  // Must use all proxies in order
}))
```

### Proxy Selection Modes

| Mode | Description |
|------|-------------|
| `priority` | Select highest priority (lowest number) |
| `random` | Random selection among healthy proxies |
| `round-robin` | Rotate through proxies sequentially |
| `least-latency` | Select lowest latency proxy |
| `least-used` | Select least recently used proxy |
| `geographic` | Prefer proxies in specified regions |

```typescript
const manager = new ProxyManager({
  enabled: true,
  selectionMode: 'least-latency',
  geoPreference: ['us-east', 'eu-west'],
  excludedRegions: ['cn', 'ru'],
})
```

---

## Censorship Detection

### Detection Strategies

The detector uses multiple probes to identify censorship:

| Probe Type | Detects |
|------------|---------|
| HTTP/HTTPS | Block pages, redirects, HTTP 451 |
| DNS | Poisoning, NXDOMAIN injection |
| DNS-over-HTTPS | DNS manipulation comparison |
| WebSocket | TCP blocking, RST injection |
| TLS | SNI filtering, certificate injection |

### Configuration Example

```typescript
import {
  CensorshipDetector,
  createComprehensiveDetector,
  NetworkStatus
} from '@/lib/network'

// Create detector
const detector = createComprehensiveDetector(
  'https://api.example.com',
  ['https://alt1.example.com', 'https://alt2.example.com']
)

// Run detection
const result = await detector.detect()

console.log(`Status: ${result.status}`)
console.log(`Censored: ${result.censored}`)
console.log(`Confidence: ${result.confidence}`)

if (result.censored) {
  console.log('Censorship types:', result.censorshipTypes)
  console.log('Recommendations:')
  for (const rec of result.recommendations) {
    console.log(`  - ${rec.method}: ${rec.description}`)
  }
}
```

### Censorship Types

| Type | Description | Indicators |
|------|-------------|------------|
| `dns-poisoning` | DNS returns fake IPs | Known bad IPs (127.0.0.1, etc.) |
| `dns-blocking` | DNS returns NXDOMAIN | NXDOMAIN for known-good domain |
| `tcp-rst` | TCP reset injection | ECONNRESET on valid server |
| `tcp-blocking` | TCP connection blocked | Timeout to known-good server |
| `http-blocking` | HTTP-level blocking | Block page, HTTP 451 |
| `https-blocking` | HTTPS-level blocking | TLS errors on valid cert |
| `sni-filtering` | SNI-based blocking | TLS fails, HTTP works |
| `dpi` | Deep packet inspection | Protocol-specific blocking |
| `ip-blocking` | IP address blocked | All ports fail |
| `throttling` | Bandwidth throttling | Very high latency |
| `captive-portal` | Login required | Redirect to portal |

### Automatic Detection

Enable periodic detection:

```typescript
const detector = new CensorshipDetector({
  primaryEndpoint: 'https://api.example.com',
  detectionInterval: 300000,  // Check every 5 minutes
})

detector.on('censorship-detected', (event) => {
  console.log('Censorship detected:', event.data)
  // Trigger fallback
})

detector.on('network-status-changed', (event) => {
  console.log(`Status: ${event.data.previousStatus} -> ${event.data.currentStatus}`)
})
```

---

## Fallback Strategies

### Automatic Fallback Chain

The recommended fallback order:

```
1. Primary WebSocket (WSS)
   ↓ (if blocked)
2. HTTP Long-Polling
   ↓ (if blocked)
3. Domain Fronting via CDN
   ↓ (if blocked)
4. SOCKS5 Proxy
   ↓ (if blocked)
5. obfs4 Bridge
   ↓ (if blocked)
6. Meek Bridge
   ↓ (if blocked)
7. Snowflake
```

### Unified Client Example

```typescript
import {
  UnifiedNetworkClient,
  createUnifiedNetworkClient,
} from '@/lib/network'

const client = createUnifiedNetworkClient('wss://api.example.com', {
  fallbackEndpoint: 'https://api.example.com/poll',
  autoDetect: true,
  autoCircumvent: true,
  domainFronting: {
    enabled: true,
    endpoints: [
      createCloudflareEndpoint('cdn.example.com', 'api.example.com'),
    ],
  },
  proxyManager: {
    enabled: true,
    selectionMode: 'priority',
  },
})

// Connect with automatic fallback
await client.connect()

// Send data (routed through best available transport)
await client.send(JSON.stringify({ action: 'ping' }))

// Check status
console.log('Network status:', client.getNetworkStatus())
```

### Manual Fallback

For fine-grained control:

```typescript
const detector = new CensorshipDetector({...})
const result = await detector.detect()

if (result.status === NetworkStatus.CENSORED) {
  const recommendation = result.recommendations[0]

  switch (recommendation.method) {
    case 'domain-fronting':
      // Enable domain fronting
      break
    case 'obfs4':
      // Enable obfs4 bridge
      break
    case 'dns-over-https':
      // Switch to DoH
      break
  }
}
```

---

## Operational Procedures

### Initial Deployment

1. **Configure Primary Transport**
   ```typescript
   manager.registerTransport(createWebSocketConfig('wss://api.example.com'))
   ```

2. **Add Fallback Endpoints**
   - At least 2 CDN endpoints for domain fronting
   - At least 3 proxy/bridge endpoints
   - Geographic diversity recommended

3. **Enable Detection**
   ```typescript
   const detector = new CensorshipDetector({
     primaryEndpoint: 'https://api.example.com',
     detectionInterval: 300000,
   })
   ```

4. **Test Fallback Chain**
   ```typescript
   const results = await client.testAllEndpoints()
   console.log('Working endpoints:', results.filter(r => r.success).length)
   ```

### Monitoring

Key metrics to monitor:

| Metric | Location | Alert Threshold |
|--------|----------|-----------------|
| Healthy endpoints | `getHealthyEndpoints().length` | < 2 |
| Failed connections | `metrics.failedRequests` | > 10% |
| Average latency | `metrics.averageLatency` | > 5000ms |
| Detection status | `detector.getNetworkStatus()` | CENSORED |
| Fallback activations | `transport-switch` events | > 5/hour |

```typescript
// Log metrics periodically
setInterval(() => {
  const metrics = manager.getMetrics()
  const health = manager.getHealthStatus()

  logger.info('Network metrics', {
    totalRequests: metrics.totalRequests,
    failedRequests: metrics.failedRequests,
    averageLatency: metrics.averageLatency,
    healthyTransports: [...health.values()].filter(h => h.healthy).length,
  })
}, 60000)
```

### Incident Response

#### Detected Censorship

1. **Verify Detection**
   ```typescript
   const result = await detector.detect()
   console.log('Censorship types:', result.censorshipTypes)
   console.log('Confidence:', result.confidence)
   ```

2. **Check Fallback Status**
   ```typescript
   const healthy = client.getHealthyEndpoints()
   if (healthy.length === 0) {
     // Alert: No fallback available
   }
   ```

3. **Activate Recommended Method**
   ```typescript
   const rec = result.recommendations[0]
   // Implement recommended circumvention
   ```

4. **Notify Users** (if appropriate)
   ```typescript
   // Show banner about degraded connectivity
   ```

#### All Endpoints Failed

1. **Verify Network Connectivity**
   - Test basic internet access
   - Check DNS resolution

2. **Rotate Credentials** (if proxies require auth)
   - Update proxy passwords
   - Refresh bridge certificates

3. **Add Emergency Endpoints**
   - Deploy new CDN distribution
   - Provision new proxy servers

4. **Contact Operations**
   - Escalate to infrastructure team

---

## Troubleshooting

### Common Issues

#### Connection Timeouts

**Symptoms**: Connections hang, then timeout

**Diagnosis**:
```typescript
const result = await detector.detect()
if (result.censorshipTypes.includes('tcp-blocking')) {
  console.log('TCP blocking detected')
}
```

**Resolution**:
- Switch to HTTP-based transport
- Enable domain fronting
- Use obfs4 bridge

#### DNS Resolution Failures

**Symptoms**: `ENOTFOUND` errors, DNS timeouts

**Diagnosis**:
```typescript
const result = await detector.isDomainBlocked('example.com')
if (result.indicators.some(i => i.type === 'dns-poisoning')) {
  console.log('DNS is being poisoned')
}
```

**Resolution**:
- Enable DNS-over-HTTPS
- Configure custom DNS resolver
- Use IP addresses directly

#### TLS Handshake Failures

**Symptoms**: `ERR_SSL_PROTOCOL_ERROR`, certificate errors

**Diagnosis**:
```typescript
const result = await detector.detect()
if (result.censorshipTypes.includes('sni-filtering')) {
  console.log('SNI filtering detected')
}
```

**Resolution**:
- Enable domain fronting
- Use encrypted SNI (ESNI) if available
- Route through Tor/obfs4

#### Slow Connections

**Symptoms**: High latency, throttled bandwidth

**Diagnosis**:
```typescript
const metrics = manager.getMetrics()
if (metrics.averageLatency > 3000) {
  console.log('Possible throttling')
}
```

**Resolution**:
- Switch to lower-latency endpoint
- Enable traffic shaping obfuscation
- Use different geographic region

### Debug Mode

Enable detailed logging:

```typescript
import { logger } from '@/lib/logger'

// Enable debug logging
logger.setLevel('debug')

// Log all transport events
manager.on('*', (event) => {
  logger.debug('Transport event', event)
})

// Log censorship detection details
detector.on('probe-completed', (event) => {
  logger.debug('Probe result', event.data)
})
```

---

## Security Considerations

### Operational Security

1. **Endpoint Rotation**
   - Rotate CDN endpoints periodically
   - Use multiple providers to avoid single point of failure
   - Keep backup endpoints ready

2. **Credential Management**
   - Store proxy credentials securely
   - Rotate credentials regularly
   - Use separate credentials per region

3. **Traffic Analysis**
   - Enable padding to obscure message sizes
   - Add timing jitter to break patterns
   - Use varying endpoints to prevent fingerprinting

### Legal Considerations

**Important**: The use of circumvention tools may be restricted or illegal in some jurisdictions. This documentation is provided for legitimate anti-censorship purposes only.

1. **Know Your Environment**
   - Understand local laws regarding circumvention
   - Consult legal counsel when deploying in sensitive regions

2. **User Consent**
   - Inform users about circumvention features
   - Allow opt-out where appropriate

3. **Data Protection**
   - Minimize logging in high-risk environments
   - Consider data retention requirements

### Threat Mitigation

| Threat | Mitigation |
|--------|------------|
| CDN blocking | Multiple CDN providers |
| Bridge blocking | Frequent bridge rotation |
| IP blocking | Dynamic IP allocation |
| Traffic fingerprinting | Protocol obfuscation |
| Metadata collection | Traffic padding, timing jitter |
| Endpoint enumeration | Keep endpoints confidential |

---

## References

- [Threat Model](./THREAT-MODEL.md)
- [Security Controls](./SECURITY-CONTROLS.md)
- [Data Flow Diagram](./DATA-FLOW.md)
- [Tor Project Pluggable Transports](https://www.torproject.org/docs/pluggable-transports)
- [Domain Fronting Paper](https://www.bamsoftware.com/papers/fronting/)
- [OONI Probe](https://ooni.org/)

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-08 | Security Team | Initial documentation |

**Classification**: Operational
**Review Cycle**: Quarterly
