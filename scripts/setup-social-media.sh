#!/bin/bash
# ============================================================================
# Social Media Integration Setup Script
# Automates setup of social media integration for nself-chat
# ============================================================================

set -e

echo "🚀 Setting up Social Media Integration for nself-chat"
echo "=================================================="
echo ""

# Check if .backend directory exists
if [ ! -d ".backend" ]; then
  echo "❌ Error: .backend directory not found"
  echo "   Please run 'nself init' first to set up the backend"
  exit 1
fi

# Check if migration file exists
if [ ! -f ".backend/migrations/012_social_media_integration.sql" ]; then
  echo "❌ Error: Migration file not found"
  echo "   Expected: .backend/migrations/012_social_media_integration.sql"
  exit 1
fi

# Step 1: Run database migration
echo "📦 Step 1: Running database migration..."
cd .backend
if nself exec postgres psql -U postgres -d nself -f ../migrations/012_social_media_integration.sql > /dev/null 2>&1; then
  echo "   ✅ Database migration completed"
else
  echo "   ⚠️  Migration may have already been applied (this is OK)"
fi
cd ..

# Step 2: Check environment variables
echo ""
echo "🔐 Step 2: Checking environment variables..."

if [ ! -f ".env.local" ]; then
  echo "   ⚠️  .env.local not found, creating from .env.social.example"
  cp .env.social.example .env.local
  echo "   📝 Please edit .env.local and add your API credentials"
else
  # Check for required variables
  missing_vars=()

  if ! grep -q "TWITTER_CLIENT_ID" .env.local; then
    missing_vars+=("TWITTER_CLIENT_ID")
  fi

  if ! grep -q "INSTAGRAM_APP_ID" .env.local; then
    missing_vars+=("INSTAGRAM_APP_ID")
  fi

  if ! grep -q "LINKEDIN_CLIENT_ID" .env.local; then
    missing_vars+=("LINKEDIN_CLIENT_ID")
  fi

  if ! grep -q "SOCIAL_MEDIA_ENCRYPTION_KEY" .env.local; then
    missing_vars+=("SOCIAL_MEDIA_ENCRYPTION_KEY")
  fi

  if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "   ⚠️  Missing variables in .env.local:"
    for var in "${missing_vars[@]}"; do
      echo "      - $var"
    done
    echo ""
    echo "   Please add these to your .env.local file"
    echo "   See .env.social.example for reference"
  else
    echo "   ✅ All required environment variables found"
  fi
fi

# Step 3: Generate encryption key if needed
echo ""
echo "🔑 Step 3: Checking encryption key..."

if grep -q "SOCIAL_MEDIA_ENCRYPTION_KEY=$" .env.local 2>/dev/null || \
   grep -q "SOCIAL_MEDIA_ENCRYPTION_KEY=\"\"" .env.local 2>/dev/null; then
  echo "   Generating encryption key..."
  ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

  # Update .env.local with generated key
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|SOCIAL_MEDIA_ENCRYPTION_KEY=.*|SOCIAL_MEDIA_ENCRYPTION_KEY=$ENCRYPTION_KEY|" .env.local
  else
    # Linux
    sed -i "s|SOCIAL_MEDIA_ENCRYPTION_KEY=.*|SOCIAL_MEDIA_ENCRYPTION_KEY=$ENCRYPTION_KEY|" .env.local
  fi

  echo "   ✅ Encryption key generated and saved to .env.local"
else
  echo "   ✅ Encryption key already set"
fi

# Step 4: Install dependencies (if needed)
echo ""
echo "📚 Step 4: Checking dependencies..."

if [ -f "package.json" ]; then
  if ! grep -q "date-fns" package.json; then
    echo "   Installing date-fns..."
    pnpm add date-fns
  fi
  echo "   ✅ All dependencies installed"
else
  echo "   ⚠️  package.json not found"
fi

# Step 5: Setup instructions
echo ""
echo "=================================================="
echo "✅ Social Media Integration setup complete!"
echo ""
echo "Next steps:"
echo ""
echo "1. 📝 Configure API credentials in .env.local:"
echo "   - Twitter: https://developer.twitter.com/en/portal/dashboard"
echo "   - Instagram: https://developers.facebook.com/apps"
echo "   - LinkedIn: https://www.linkedin.com/developers/apps"
echo ""
echo "2. 🚀 Start the development server:"
echo "   pnpm dev"
echo ""
echo "3. 🔗 Connect social accounts:"
echo "   Navigate to: http://localhost:3000/admin/social"
echo ""
echo "4. ⏰ Setup polling (every 5 minutes):"
echo "   Option A - Cron job:"
echo "   */5 * * * * curl -X POST http://localhost:3000/api/social/poll"
echo ""
echo "   Option B - Vercel Cron (vercel.json):"
echo '   {
  "crons": [{
    "path": "/api/social/poll",
    "schedule": "*/5 * * * *"
  }]
}'
echo ""
echo "📖 Full documentation: docs/Social-Media-Integration.md"
echo "=================================================="
