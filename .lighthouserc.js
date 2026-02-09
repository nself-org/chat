/**
 * Lighthouse CI Configuration
 *
 * Performance budgets and CI integration for automated performance testing.
 *
 * Run with:
 * - pnpm lighthouse:collect  # Collect metrics
 * - pnpm lighthouse:assert   # Assert budgets
 * - pnpm lighthouse:upload   # Upload to LHCI server
 * - pnpm lighthouse          # Run all steps
 */

module.exports = {
  ci: {
    collect: {
      // URLs to test
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/login',
        'http://localhost:3000/chat',
        'http://localhost:3000/settings',
      ],
      // Number of runs per URL (for consistency)
      numberOfRuns: 3,
      // Settings
      settings: {
        // Use Chromium bundled with Lighthouse
        chromeFlags: '--no-sandbox --disable-gpu',
        // Emulate mobile
        emulatedFormFactor: 'mobile',
        // Throttling
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1,
        },
        // Only run these categories
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        // Skip audits that require authentication
        skipAudits: [
          'uses-http2',
          'uses-long-cache-ttl', // We control this with headers
        ],
      },
    },

    // Performance assertions (budgets)
    assert: {
      assertions: {
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }], // 1.8s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // 0.1
        'max-potential-fid': ['error', { maxNumericValue: 100 }], // 100ms
        'total-blocking-time': ['warn', { maxNumericValue: 300 }], // 300ms
        'speed-index': ['warn', { maxNumericValue: 3400 }], // 3.4s

        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 300000 }], // 300KB
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 50000 }], // 50KB
        'resource-summary:document:size': ['warn', { maxNumericValue: 50000 }], // 50KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 500000 }], // 500KB
        'resource-summary:font:size': ['warn', { maxNumericValue: 100000 }], // 100KB
        'resource-summary:total:size': ['warn', { maxNumericValue: 1000000 }], // 1MB

        // Request counts
        'resource-summary:script:count': ['warn', { maxNumericValue: 15 }],
        'resource-summary:stylesheet:count': ['warn', { maxNumericValue: 5 }],
        'resource-summary:font:count': ['warn', { maxNumericValue: 3 }],

        // Performance score (0-100)
        'categories:performance': ['warn', { minScore: 0.85 }], // 85+
        'categories:accessibility': ['error', { minScore: 0.95 }], // 95+
        'categories:best-practices': ['warn', { minScore: 0.90 }], // 90+
        'categories:seo': ['warn', { minScore: 0.90 }], // 90+

        // Specific audits
        'uses-responsive-images': 'warn',
        'offscreen-images': 'warn',
        'unminified-css': 'error',
        'unminified-javascript': 'error',
        'unused-css-rules': 'warn',
        'unused-javascript': 'warn',
        'modern-image-formats': 'warn',
        'uses-optimized-images': 'warn',
        'uses-text-compression': 'error',
        'uses-rel-preconnect': 'warn',
        'font-display': 'warn',
        'third-party-summary': 'warn',
        'bootup-time': 'warn',
        'mainthread-work-breakdown': 'warn',
        'dom-size': 'warn',
        'duplicated-javascript': 'warn',
        'legacy-javascript': 'warn',

        // Accessibility
        'aria-allowed-attr': 'error',
        'aria-required-attr': 'error',
        'aria-valid-attr': 'error',
        'button-name': 'error',
        'color-contrast': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'meta-viewport': 'error',
        'valid-lang': 'error',

        // Best Practices
        'errors-in-console': 'warn',
        'no-vulnerable-libraries': 'error',
        'notification-on-start': 'error',
        'geolocation-on-start': 'error',

        // SEO
        'meta-description': 'warn',
        'crawlable-anchors': 'warn',
        'robots-txt': 'off', // Not applicable for SPA
      },
    },

    // Upload to Lighthouse CI server (optional)
    upload: {
      target: 'temporary-public-storage', // Free temporary storage
      // For private storage, set up LHCI server:
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN,
    },

    // Server configuration (if running own LHCI server)
    // server: {
    //   port: 9001,
    //   storage: {
    //     storageMethod: 'sql',
    //     sqlDialect: 'postgres',
    //     sqlConnectionUrl: process.env.DATABASE_URL,
    //   },
    // },
  },
}
