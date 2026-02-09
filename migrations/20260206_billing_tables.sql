-- Billing Tables Migration
-- Created: 2026-02-06
-- Purpose: Add crypto payments and token gating tables

-- ============================================================================
-- Crypto Payments Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crypto_payments (
  id VARCHAR(64) PRIMARY KEY,
  workspace_id UUID NOT NULL,
  subscription_id UUID,
  invoice_id UUID,
  user_id UUID NOT NULL,

  -- Provider info
  provider VARCHAR(32) NOT NULL, -- 'coinbase_commerce', 'stripe_crypto', 'manual'
  provider_payment_id VARCHAR(256),

  -- Crypto details
  crypto_currency VARCHAR(10) NOT NULL, -- 'ETH', 'BTC', 'USDC', etc.
  crypto_amount VARCHAR(64) NOT NULL,
  crypto_network VARCHAR(32) NOT NULL, -- 'ethereum', 'bitcoin', 'polygon', etc.

  -- Fiat conversion
  fiat_amount INTEGER NOT NULL, -- cents
  fiat_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  exchange_rate VARCHAR(32) NOT NULL,

  -- Transaction details
  transaction_hash VARCHAR(128),
  from_address VARCHAR(64),
  to_address VARCHAR(64),
  block_number VARCHAR(32),
  confirmations INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'confirming', 'completed', 'failed', 'expired'
  payment_url TEXT,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for crypto_payments
CREATE INDEX IF NOT EXISTS idx_crypto_payments_workspace ON public.crypto_payments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_user ON public.crypto_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_status ON public.crypto_payments(status);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_provider_id ON public.crypto_payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_tx_hash ON public.crypto_payments(transaction_hash);

-- ============================================================================
-- Token Gates Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.token_gates (
  id VARCHAR(64) PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES nchat_channels(id) ON DELETE CASCADE,

  -- Token configuration
  gate_type VARCHAR(16) NOT NULL, -- 'erc20', 'erc721', 'erc1155'
  contract_address VARCHAR(64) NOT NULL,
  chain_id VARCHAR(16) NOT NULL, -- '0x1', '0x89', etc.
  network_name VARCHAR(32) NOT NULL,
  token_name VARCHAR(128),
  token_symbol VARCHAR(16),

  -- Requirements
  minimum_balance VARCHAR(64), -- For ERC-20 tokens
  required_token_ids JSONB DEFAULT '[]', -- For specific NFT IDs

  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  bypass_roles JSONB NOT NULL DEFAULT '["owner", "admin"]',
  cache_ttl INTEGER NOT NULL DEFAULT 300, -- seconds

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint per channel
  UNIQUE(channel_id)
);

-- Indexes for token_gates
CREATE INDEX IF NOT EXISTS idx_token_gates_channel ON public.token_gates(channel_id);
CREATE INDEX IF NOT EXISTS idx_token_gates_active ON public.token_gates(is_active);
CREATE INDEX IF NOT EXISTS idx_token_gates_contract ON public.token_gates(contract_address);

-- ============================================================================
-- Token Gate Verifications Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.token_gate_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL,
  wallet_address VARCHAR(64) NOT NULL,
  chain_id VARCHAR(16) NOT NULL,

  -- Verification result
  is_verified BOOLEAN NOT NULL,
  balance VARCHAR(64),
  token_ids JSONB DEFAULT '[]',
  verification_method VARCHAR(16) NOT NULL, -- 'on_chain', 'cached', 'api'
  access_granted BOOLEAN NOT NULL,
  denial_reason TEXT,

  -- Timestamps
  verified_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for token_gate_verifications
CREATE INDEX IF NOT EXISTS idx_tg_verifications_user ON public.token_gate_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_tg_verifications_channel ON public.token_gate_verifications(channel_id);
CREATE INDEX IF NOT EXISTS idx_tg_verifications_wallet ON public.token_gate_verifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_tg_verifications_expires ON public.token_gate_verifications(expires_at);

-- ============================================================================
-- Plan Enforcement Audit Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plan_enforcement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,

  -- Enforcement details
  action VARCHAR(64) NOT NULL, -- 'feature_check', 'limit_check', 'upgrade_required'
  resource_type VARCHAR(64), -- 'members', 'channels', 'storage', 'feature'
  resource_name VARCHAR(128),

  -- Result
  allowed BOOLEAN NOT NULL,
  current_value INTEGER,
  limit_value INTEGER,
  current_plan VARCHAR(32) NOT NULL,
  required_plan VARCHAR(32),

  -- Context
  request_path TEXT,
  request_method VARCHAR(10),
  user_agent TEXT,
  ip_address VARCHAR(45),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for plan_enforcement_logs
CREATE INDEX IF NOT EXISTS idx_plan_enforcement_tenant ON public.plan_enforcement_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_plan_enforcement_action ON public.plan_enforcement_logs(action);
CREATE INDEX IF NOT EXISTS idx_plan_enforcement_allowed ON public.plan_enforcement_logs(allowed);
CREATE INDEX IF NOT EXISTS idx_plan_enforcement_created ON public.plan_enforcement_logs(created_at);

-- ============================================================================
-- Update Triggers
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crypto_payments_updated_at
    BEFORE UPDATE ON public.crypto_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_gates_updated_at
    BEFORE UPDATE ON public.token_gates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.crypto_payments IS 'Cryptocurrency payment records for subscriptions';
COMMENT ON TABLE public.token_gates IS 'Token-gated channel access requirements';
COMMENT ON TABLE public.token_gate_verifications IS 'Token ownership verification history';
COMMENT ON TABLE public.plan_enforcement_logs IS 'Audit log for plan-based access enforcement';
