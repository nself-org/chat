#!/bin/bash
# Setup E2EE Dependencies
# Installs all required packages for E2EE implementation

set -e

echo "Installing E2EE dependencies..."

# Core dependencies (already installed)
echo "✓ @signalapp/libsignal-client already installed"
echo "✓ @noble/curves already installed"
echo "✓ @noble/hashes already installed"

# Add missing dependencies
echo "Installing additional dependencies..."

# QR Code React component
pnpm add qrcode.react@^3.1.0

# Argon2 for PIN hashing (Node.js only)
pnpm add @node-rs/argon2@^1.8.0

# Biometric auth for Capacitor (mobile)
pnpm add @aparajita/capacitor-biometric-auth@^6.0.0 --save-optional

# Capacitor secure storage (mobile)
pnpm add @capacitor-community/secure-storage-plugin@^0.9.0 --save-optional

# Dev dependencies
pnpm add -D @types/node@^20.11.0

echo ""
echo "✅ All E2EE dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Run database migrations: pnpm db:migrate"
echo "2. Run tests: pnpm test src/lib/e2ee/__tests__/"
echo "3. Start dev server: pnpm dev"
echo ""
echo "For production deployment:"
echo "1. Set environment variables (see .env.example)"
echo "2. Apply migrations to production database"
echo "3. Build: pnpm build"
echo "4. Deploy"
echo ""
