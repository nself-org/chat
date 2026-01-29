-- ============================================================================
-- nself-chat Database Initialization
-- ============================================================================
-- This script runs when the PostgreSQL container is first initialized
-- It sets up the database schema and extensions required by nself-chat
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS nchat;

-- Grant permissions
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT USAGE ON SCHEMA storage TO postgres;
GRANT USAGE ON SCHEMA nchat TO postgres;

-- ============================================================================
-- nchat Core Tables
-- ============================================================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS nchat.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE,
    email CITEXT NOT NULL UNIQUE,
    display_name VARCHAR(255),
    avatar_url TEXT,
    status VARCHAR(50) DEFAULT 'active',
    role VARCHAR(50) DEFAULT 'member',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channels table
CREATE TABLE IF NOT EXISTS nchat.channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(50) DEFAULT 'public',
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES nchat.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channel members
CREATE TABLE IF NOT EXISTS nchat.channel_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES nchat.channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES nchat.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    UNIQUE(channel_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS nchat.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES nchat.channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES nchat.users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES nchat.messages(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text',
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions table
CREATE TABLE IF NOT EXISTS nchat.reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES nchat.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES nchat.users(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- App configuration table
CREATE TABLE IF NOT EXISTS nchat.app_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON nchat.users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON nchat.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_channels_slug ON nchat.channels(slug);
CREATE INDEX IF NOT EXISTS idx_channel_members_user ON nchat.channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON nchat.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON nchat.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON nchat.messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON nchat.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_message ON nchat.reactions(message_id);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION nchat.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON nchat.users
    FOR EACH ROW EXECUTE FUNCTION nchat.update_updated_at();

CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON nchat.channels
    FOR EACH ROW EXECUTE FUNCTION nchat.update_updated_at();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON nchat.messages
    FOR EACH ROW EXECUTE FUNCTION nchat.update_updated_at();

-- ============================================================================
-- Default Data
-- ============================================================================

-- Insert default configuration
INSERT INTO nchat.app_configuration (key, value)
VALUES ('app_config', '{
    "setup": {
        "completed": false,
        "completedSteps": [],
        "currentStep": 0
    },
    "branding": {
        "appName": "nchat",
        "tagline": "Team Communication Platform"
    },
    "features": {
        "channels": true,
        "directMessages": true,
        "threads": true,
        "reactions": true,
        "fileUploads": true
    },
    "theme": {
        "mode": "system",
        "preset": "default"
    }
}')
ON CONFLICT (key) DO NOTHING;

-- Insert default #general channel
INSERT INTO nchat.channels (name, slug, description, type)
VALUES ('General', 'general', 'General discussion channel', 'public')
ON CONFLICT (slug) DO NOTHING;

COMMIT;
