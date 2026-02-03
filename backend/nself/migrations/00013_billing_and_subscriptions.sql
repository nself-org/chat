-- =====================================================================================
-- Billing and Subscriptions Schema
-- =====================================================================================
--
-- This migration adds comprehensive billing and subscription management tables
-- for nChat v0.9.1, including:
-- - Subscription plans and pricing
-- - User subscriptions and billing cycles
-- - Payment methods and invoices
-- - Usage tracking and metering
-- - Token gating for channels
-- - Crypto payment support
--
-- Dependencies: Stripe plugin installed via nself CLI
-- Version: 0.9.1
-- Date: 2026-02-03
--
-- =====================================================================================

-- =====================================================================================
-- 1. Subscription Plans
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nchat_subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Plan identification
  slug VARCHAR(50) UNIQUE NOT NULL, -- free, pro, enterprise, custom
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tier VARCHAR(20) NOT NULL DEFAULT 'free', -- free, starter, professional, enterprise, custom

  -- Pricing (cents)
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER DEFAULT NULL, -- NULL = not available
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Stripe integration
  stripe_product_id VARCHAR(255),
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),

  -- Resource limits
  max_members INTEGER DEFAULT NULL, -- NULL = unlimited
  max_channels INTEGER DEFAULT NULL,
  max_storage_bytes BIGINT DEFAULT NULL,
  max_file_size_bytes BIGINT DEFAULT NULL,
  max_api_calls_per_month INTEGER DEFAULT NULL,
  max_call_participants INTEGER DEFAULT NULL,
  max_stream_duration_minutes INTEGER DEFAULT NULL,

  -- Feature flags (JSON for flexibility)
  features JSONB NOT NULL DEFAULT '{}',

  -- Display configuration
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_recommended BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  highlighted_features TEXT[], -- Array of feature highlights

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active public plans
CREATE INDEX idx_plans_active_public ON nchat_subscription_plans(is_active, is_public, sort_order);

-- Index for Stripe integration
CREATE INDEX idx_plans_stripe_product ON nchat_subscription_plans(stripe_product_id);

-- =====================================================================================
-- 2. Workspace Subscriptions
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nchat_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  workspace_id UUID NOT NULL REFERENCES nchat_workspaces(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES nchat_subscription_plans(id),
  user_id UUID NOT NULL REFERENCES nchat_users(id), -- Subscription owner

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'trialing', -- trialing, active, past_due, canceled, unpaid, paused
  billing_interval VARCHAR(10) NOT NULL DEFAULT 'monthly', -- monthly, yearly

  -- Stripe references
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_price_id VARCHAR(255),

  -- Trial period
  trial_ends_at TIMESTAMPTZ,

  -- Current billing period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  -- Cancellation
  canceled_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancellation_reason VARCHAR(50), -- user_requested, payment_failed, fraud, other
  cancellation_feedback TEXT,

  -- Pause/Resume
  paused_at TIMESTAMPTZ,
  resumes_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_subscription_status CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  CONSTRAINT chk_billing_interval CHECK (billing_interval IN ('monthly', 'yearly'))
);

-- One active subscription per workspace
CREATE UNIQUE INDEX idx_subscriptions_workspace_active
  ON nchat_subscriptions(workspace_id)
  WHERE status IN ('trialing', 'active', 'past_due');

-- Index for Stripe lookups
CREATE INDEX idx_subscriptions_stripe ON nchat_subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_customer ON nchat_subscriptions(stripe_customer_id);

-- Index for status queries
CREATE INDEX idx_subscriptions_status ON nchat_subscriptions(status);

-- =====================================================================================
-- 3. Invoices
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nchat_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  workspace_id UUID NOT NULL REFERENCES nchat_workspaces(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES nchat_subscriptions(id) ON DELETE SET NULL,

  -- Invoice details
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  stripe_invoice_id VARCHAR(255) UNIQUE,

  -- Amounts (cents)
  subtotal INTEGER NOT NULL,
  tax INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  amount_due INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, open, paid, void, uncollectible

  -- Billing period
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,

  -- Payment
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- URLs
  hosted_invoice_url TEXT,
  invoice_pdf_url TEXT,

  -- Line items (JSON)
  line_items JSONB DEFAULT '[]',

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_invoice_status CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible'))
);

-- Index for workspace invoices
CREATE INDEX idx_invoices_workspace ON nchat_invoices(workspace_id, created_at DESC);

-- Index for subscription invoices
CREATE INDEX idx_invoices_subscription ON nchat_invoices(subscription_id);

-- Index for Stripe lookups
CREATE INDEX idx_invoices_stripe ON nchat_invoices(stripe_invoice_id);

-- =====================================================================================
-- 4. Payment Methods
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nchat_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  workspace_id UUID NOT NULL REFERENCES nchat_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES nchat_users(id),

  -- Stripe reference
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,

  -- Payment method details
  type VARCHAR(20) NOT NULL, -- card, bank_account, ideal, sepa_debit, crypto
  is_default BOOLEAN NOT NULL DEFAULT false,

  -- Card details (if type = card)
  card_brand VARCHAR(20), -- visa, mastercard, amex, etc.
  card_last4 VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  card_fingerprint VARCHAR(100),

  -- Bank account details (if type = bank_account)
  bank_name VARCHAR(100),
  bank_last4 VARCHAR(4),
  bank_account_type VARCHAR(20), -- checking, savings

  -- Crypto wallet details (if type = crypto)
  crypto_address VARCHAR(255),
  crypto_network VARCHAR(50), -- ethereum, bitcoin, polygon, etc.

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One default payment method per workspace
CREATE UNIQUE INDEX idx_payment_methods_workspace_default
  ON nchat_payment_methods(workspace_id)
  WHERE is_default = true;

-- Index for workspace payment methods
CREATE INDEX idx_payment_methods_workspace ON nchat_payment_methods(workspace_id);

-- =====================================================================================
-- 5. Usage Tracking
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nchat_subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  subscription_id UUID NOT NULL REFERENCES nchat_subscriptions(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES nchat_workspaces(id) ON DELETE CASCADE,

  -- Period identifier (YYYY-MM format)
  period VARCHAR(7) NOT NULL,

  -- Member usage
  current_members INTEGER NOT NULL DEFAULT 0,
  max_members_reached INTEGER NOT NULL DEFAULT 0,

  -- Channel usage
  current_channels INTEGER NOT NULL DEFAULT 0,
  max_channels_reached INTEGER NOT NULL DEFAULT 0,

  -- Storage usage (bytes)
  current_storage_bytes BIGINT NOT NULL DEFAULT 0,
  max_storage_bytes_reached BIGINT NOT NULL DEFAULT 0,

  -- Message usage
  messages_sent INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,

  -- API usage
  api_calls INTEGER NOT NULL DEFAULT 0,

  -- Call/Stream usage
  call_minutes INTEGER NOT NULL DEFAULT 0,
  stream_minutes INTEGER NOT NULL DEFAULT 0,

  -- File uploads
  files_uploaded INTEGER NOT NULL DEFAULT 0,
  total_file_size_bytes BIGINT NOT NULL DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one record per subscription per period
  UNIQUE(subscription_id, period)
);

-- Index for usage queries
CREATE INDEX idx_usage_subscription_period ON nchat_subscription_usage(subscription_id, period DESC);
CREATE INDEX idx_usage_workspace ON nchat_subscription_usage(workspace_id);

-- =====================================================================================
-- 6. Token-Gated Channels
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nchat_token_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  channel_id UUID NOT NULL REFERENCES nchat_channels(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES nchat_workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES nchat_users(id),

  -- Token requirements
  gate_type VARCHAR(20) NOT NULL, -- erc20, erc721, erc1155
  contract_address VARCHAR(255) NOT NULL,
  chain_id VARCHAR(10) NOT NULL, -- 0x1, 0x89, etc.
  network_name VARCHAR(50) NOT NULL, -- ethereum, polygon, etc.

  -- Token details
  token_name VARCHAR(100),
  token_symbol VARCHAR(20),

  -- Requirements
  minimum_balance VARCHAR(100), -- For ERC-20 tokens
  required_token_ids TEXT[], -- For specific NFTs (ERC-721/1155)

  -- Access control
  is_active BOOLEAN NOT NULL DEFAULT true,
  bypass_roles TEXT[] DEFAULT '{"owner", "admin"}', -- Roles that bypass gate

  -- Cache (for performance)
  verified_addresses JSONB DEFAULT '{}', -- {address: {verified: true, lastCheck: timestamp}}
  cache_ttl INTEGER DEFAULT 3600, -- Seconds to cache verification

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_gate_type CHECK (gate_type IN ('erc20', 'erc721', 'erc1155'))
);

-- One token gate per channel
CREATE UNIQUE INDEX idx_token_gates_channel ON nchat_token_gates(channel_id);

-- Index for workspace gates
CREATE INDEX idx_token_gates_workspace ON nchat_token_gates(workspace_id);

-- Index for contract lookups
CREATE INDEX idx_token_gates_contract ON nchat_token_gates(contract_address, chain_id);

-- =====================================================================================
-- 7. Token Gate Verification Log
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nchat_token_gate_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  token_gate_id UUID NOT NULL REFERENCES nchat_token_gates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,

  -- Wallet details
  wallet_address VARCHAR(255) NOT NULL,
  chain_id VARCHAR(10) NOT NULL,

  -- Verification result
  is_verified BOOLEAN NOT NULL,
  balance VARCHAR(100), -- Token balance at time of verification
  token_ids TEXT[], -- NFT token IDs owned

  -- Verification details
  verification_method VARCHAR(20) NOT NULL, -- on_chain, cached, api
  verification_response JSONB, -- Raw response from verification

  -- Access decision
  access_granted BOOLEAN NOT NULL,
  denial_reason VARCHAR(100),

  -- Timestamps
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Index for user verifications
CREATE INDEX idx_verifications_user ON nchat_token_gate_verifications(user_id, verified_at DESC);

-- Index for gate verifications
CREATE INDEX idx_verifications_gate ON nchat_token_gate_verifications(token_gate_id, verified_at DESC);

-- Index for wallet lookups
CREATE INDEX idx_verifications_wallet ON nchat_token_gate_verifications(wallet_address, chain_id);

-- =====================================================================================
-- 8. Crypto Payments
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nchat_crypto_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  workspace_id UUID NOT NULL REFERENCES nchat_workspaces(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES nchat_subscriptions(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES nchat_invoices(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES nchat_users(id),

  -- Payment provider
  provider VARCHAR(50) NOT NULL, -- coinbase_commerce, stripe_crypto, manual
  provider_payment_id VARCHAR(255) UNIQUE,

  -- Cryptocurrency details
  crypto_currency VARCHAR(10) NOT NULL, -- ETH, BTC, USDC, etc.
  crypto_amount VARCHAR(100) NOT NULL, -- Crypto amount (as string for precision)
  crypto_network VARCHAR(50) NOT NULL, -- ethereum, bitcoin, polygon, etc.

  -- Fiat conversion
  fiat_amount INTEGER NOT NULL, -- Amount in cents
  fiat_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  exchange_rate VARCHAR(50), -- Rate at time of payment

  -- Transaction details
  transaction_hash VARCHAR(255),
  from_address VARCHAR(255),
  to_address VARCHAR(255),
  block_number VARCHAR(50),
  confirmations INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, confirming, completed, failed, expired

  -- Payment details
  payment_url TEXT, -- Hosted payment page
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_crypto_payment_status CHECK (status IN ('pending', 'confirming', 'completed', 'failed', 'expired'))
);

-- Index for workspace crypto payments
CREATE INDEX idx_crypto_payments_workspace ON nchat_crypto_payments(workspace_id, created_at DESC);

-- Index for provider lookups
CREATE INDEX idx_crypto_payments_provider ON nchat_crypto_payments(provider, provider_payment_id);

-- Index for transaction hash
CREATE INDEX idx_crypto_payments_tx ON nchat_crypto_payments(transaction_hash);

-- Index for status
CREATE INDEX idx_crypto_payments_status ON nchat_crypto_payments(status);

-- =====================================================================================
-- 9. Subscription Events Log
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nchat_subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  subscription_id UUID NOT NULL REFERENCES nchat_subscriptions(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES nchat_workspaces(id) ON DELETE CASCADE,

  -- Event details
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',

  -- Source
  source VARCHAR(50) NOT NULL, -- stripe, user_action, system, api
  source_id VARCHAR(255), -- Stripe event ID, user ID, etc.

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for subscription events
CREATE INDEX idx_subscription_events ON nchat_subscription_events(subscription_id, created_at DESC);

-- Index for workspace events
CREATE INDEX idx_subscription_events_workspace ON nchat_subscription_events(workspace_id, created_at DESC);

-- Index for event type
CREATE INDEX idx_subscription_events_type ON nchat_subscription_events(event_type);

-- =====================================================================================
-- 10. Promo Codes / Coupons
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nchat_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Code details
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100),
  description TEXT,

  -- Discount
  discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount
  discount_value INTEGER NOT NULL, -- Percentage (0-100) or amount in cents
  currency VARCHAR(3) DEFAULT 'USD',

  -- Application
  applies_to_plans UUID[], -- Array of plan IDs, empty = all plans
  duration VARCHAR(20) NOT NULL, -- once, repeating, forever
  duration_months INTEGER, -- For repeating duration

  -- Stripe integration
  stripe_coupon_id VARCHAR(255),

  -- Limits
  max_redemptions INTEGER, -- NULL = unlimited
  redemptions_count INTEGER NOT NULL DEFAULT 0,

  -- Validity
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_promo_discount_type CHECK (discount_type IN ('percentage', 'fixed_amount')),
  CONSTRAINT chk_promo_duration CHECK (duration IN ('once', 'repeating', 'forever'))
);

-- Index for active codes
CREATE INDEX idx_promo_codes_active ON nchat_promo_codes(is_active, valid_until);

-- =====================================================================================
-- 11. Promo Code Redemptions
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nchat_promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  promo_code_id UUID NOT NULL REFERENCES nchat_promo_codes(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES nchat_workspaces(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES nchat_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES nchat_users(id),

  -- Redemption details
  discount_amount INTEGER NOT NULL, -- Actual discount applied (cents)

  -- Timestamps
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for promo code redemptions
CREATE INDEX idx_promo_redemptions_code ON nchat_promo_redemptions(promo_code_id);

-- Index for workspace redemptions
CREATE INDEX idx_promo_redemptions_workspace ON nchat_promo_redemptions(workspace_id);

-- =====================================================================================
-- 12. Functions and Triggers
-- =====================================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON nchat_subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON nchat_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON nchat_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON nchat_payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_updated_at BEFORE UPDATE ON nchat_subscription_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_gates_updated_at BEFORE UPDATE ON nchat_token_gates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crypto_payments_updated_at BEFORE UPDATE ON nchat_crypto_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON nchat_promo_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================================
-- 13. Seed Default Plans
-- =====================================================================================

-- Insert default subscription plans
INSERT INTO nchat_subscription_plans (slug, name, description, tier, price_monthly, price_yearly, features, highlighted_features, is_recommended, sort_order)
VALUES
  (
    'free',
    'Free',
    'For small teams getting started',
    'free',
    0,
    0,
    '{
      "publicChannels": true,
      "privateChannels": true,
      "directMessages": true,
      "groupDMs": true,
      "threads": true,
      "fileUploads": true,
      "voiceMessages": false,
      "videoCalls": false,
      "screenSharing": false,
      "customEmoji": false,
      "webhooks": false,
      "integrations": false,
      "apiAccess": false,
      "sso": false,
      "auditLogs": false,
      "prioritySupport": false,
      "customBranding": false,
      "messageRetentionDays": 90,
      "searchHistoryDays": 90
    }'::jsonb,
    ARRAY['10 team members', '5 channels', '1 GB storage', 'Basic messaging', '90-day history'],
    false,
    1
  ),
  (
    'pro',
    'Pro',
    'For growing teams that need more',
    'professional',
    1500,
    15000,
    '{
      "publicChannels": true,
      "privateChannels": true,
      "directMessages": true,
      "groupDMs": true,
      "threads": true,
      "fileUploads": true,
      "voiceMessages": true,
      "videoCalls": true,
      "screenSharing": true,
      "customEmoji": true,
      "webhooks": true,
      "integrations": true,
      "apiAccess": true,
      "sso": false,
      "auditLogs": true,
      "prioritySupport": false,
      "customBranding": false,
      "messageRetentionDays": -1,
      "searchHistoryDays": -1
    }'::jsonb,
    ARRAY['100 team members', '50 channels', '100 GB storage', 'Video calls & screen sharing', 'Unlimited history', 'Integrations & webhooks'],
    true,
    2
  ),
  (
    'enterprise',
    'Enterprise',
    'For large organizations',
    'enterprise',
    9900,
    99000,
    '{
      "publicChannels": true,
      "privateChannels": true,
      "directMessages": true,
      "groupDMs": true,
      "threads": true,
      "fileUploads": true,
      "voiceMessages": true,
      "videoCalls": true,
      "screenSharing": true,
      "customEmoji": true,
      "webhooks": true,
      "integrations": true,
      "apiAccess": true,
      "sso": true,
      "auditLogs": true,
      "prioritySupport": true,
      "customBranding": true,
      "messageRetentionDays": -1,
      "searchHistoryDays": -1
    }'::jsonb,
    ARRAY['Unlimited members', 'Unlimited channels', 'Unlimited storage', 'SSO & SAML', 'Priority support', 'Custom branding', 'Advanced security'],
    false,
    3
  )
ON CONFLICT (slug) DO NOTHING;

-- =====================================================================================
-- 14. Row Level Security (RLS)
-- =====================================================================================

-- Enable RLS on all tables
ALTER TABLE nchat_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_token_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_token_gate_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_crypto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Plans are publicly readable
CREATE POLICY "Plans are publicly readable" ON nchat_subscription_plans
  FOR SELECT USING (is_public = true OR is_active = true);

-- Workspace members can view their subscription
CREATE POLICY "Workspace members can view subscription" ON nchat_subscriptions
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM nchat_workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Only workspace owners/admins can manage subscriptions
CREATE POLICY "Workspace owners can manage subscription" ON nchat_subscriptions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM nchat_workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Similar RLS policies for other tables...

-- =====================================================================================
-- End of Migration
-- =====================================================================================
