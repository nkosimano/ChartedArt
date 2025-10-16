-- ============================================
-- Migration: 00300_admin_system.sql
-- Description: Admin infrastructure (admin users, messages, config, idempotency)
-- Dependencies: 00200_core_tables.sql
-- ============================================

-- Rollback:
-- DROP TABLE IF EXISTS inventory_alerts CASCADE;
-- DROP TABLE IF EXISTS idempotency_keys CASCADE;
-- DROP TABLE IF EXISTS system_config CASCADE;
-- DROP TABLE IF EXISTS messages CASCADE;
-- DROP TABLE IF EXISTS admin_users CASCADE;

-- ============================================
-- 1. ADMIN USERS TABLE
-- ============================================
-- Tracks which users have admin privileges
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Admin Details
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator', 'support')),
  permissions JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Security Fields
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret TEXT,
  failed_login_count INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. MESSAGES TABLE
-- ============================================
-- Customer support messages and admin communication
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sender/Recipient
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Message Content
  subject VARCHAR(255),
  message TEXT NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Categorization
  category VARCHAR(100),
  tags TEXT[],
  
  -- Thread
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ
);

-- ============================================
-- 3. SYSTEM CONFIG TABLE
-- ============================================
-- System-wide configuration and feature flags
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Config Key
  key VARCHAR(255) UNIQUE NOT NULL,
  
  -- Config Value
  value JSONB NOT NULL,
  
  -- Metadata
  description TEXT,
  category VARCHAR(100),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  
  -- Audit
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. IDEMPOTENCY KEYS TABLE
-- ============================================
-- Prevents duplicate API requests (e.g., double payments)
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Key Details
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Request Details
  endpoint VARCHAR(255) NOT NULL,
  request_body JSONB,
  
  -- Response
  response_status INTEGER,
  response_body JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ============================================
-- 5. INVENTORY ALERTS TABLE
-- ============================================
-- Low stock alerts for admin dashboard
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Alert Details
  alert_type VARCHAR(50) DEFAULT 'low_stock' CHECK (alert_type IN ('low_stock', 'out_of_stock', 'restock_needed')),
  threshold INTEGER,
  current_stock INTEGER,
  
  -- Status
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. ADMIN AUDIT LOG TABLE
-- ============================================
-- Tracks all admin actions for security and compliance
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  
  -- Action Details
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  
  -- Request Context
  ip_address INET,
  user_agent TEXT,
  changes JSONB,
  
  -- Status
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'blocked')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. LOGIN ATTEMPTS TABLE
-- ============================================
-- Tracks login attempts for brute force detection
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Attempt Details
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. ADMIN SESSIONS TABLE
-- ============================================
-- Tracks active admin sessions for security monitoring
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  
  -- Session Details
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Activity
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. SECURITY ALERTS TABLE
-- ============================================
-- Security alerts for admin monitoring
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Alert Details
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
    'failed_login_attempts',
    'new_admin_user',
    'role_change',
    'bulk_operation',
    'suspicious_ip',
    'after_hours_access',
    'mfa_disabled',
    'password_change'
  )),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Related Admin
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  
  -- Details
  details JSONB NOT NULL,
  
  -- Resolution
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. ADMIN IP WHITELIST TABLE
-- ============================================
-- Whitelisted IP addresses for admin access
CREATE TABLE IF NOT EXISTS admin_ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- IP Details
  ip_address INET NOT NULL UNIQUE,
  description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  added_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
-- Admin Users
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active) WHERE is_active = true;

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_priority ON messages(priority);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_message_id);

-- System Config
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);
CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_config(category);
CREATE INDEX IF NOT EXISTS idx_system_config_active ON system_config(is_active) WHERE is_active = true;

-- Idempotency Keys
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user_id ON idempotency_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);

-- Inventory Alerts
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_resolved ON inventory_alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_created_at ON inventory_alerts(created_at DESC);

-- Admin Audit Log
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_status ON admin_audit_log(status) WHERE status != 'success';

-- Login Attempts
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_failed ON login_attempts(email, created_at) WHERE success = false;

-- Admin Sessions
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_user ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active, expires_at) WHERE is_active = true;

-- Security Alerts
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_unresolved ON security_alerts(is_resolved, created_at) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_security_alerts_admin_user ON security_alerts(admin_user_id);

-- Admin IP Whitelist
CREATE INDEX IF NOT EXISTS idx_admin_ip_whitelist_active ON admin_ip_whitelist(ip_address) WHERE is_active = true;

-- Admin Users Security Fields
CREATE INDEX IF NOT EXISTS idx_admin_users_mfa ON admin_users(mfa_enabled) WHERE mfa_enabled = true;
CREATE INDEX IF NOT EXISTS idx_admin_users_locked ON admin_users(locked_until) WHERE locked_until IS NOT NULL;

-- ============================================
-- DEFAULT DATA
-- ============================================
-- Insert default system config values
INSERT INTO system_config (key, value, description, category, is_public) VALUES
  ('ENABLE_MOVEMENTS', '{"enabled": true}'::jsonb, 'Enable social impact movements feature', 'features', true),
  ('ENABLE_PUZZLE_PIECES', '{"enabled": true}'::jsonb, 'Enable puzzle pieces NFT-style feature', 'features', true),
  ('ENABLE_COMPETITIONS', '{"enabled": true}'::jsonb, 'Enable competitions and events', 'features', true),
  ('MAINTENANCE_MODE', '{"enabled": false}'::jsonb, 'Enable maintenance mode', 'system', true),
  ('LOW_STOCK_THRESHOLD', '{"threshold": 5}'::jsonb, 'Low stock alert threshold', 'inventory', false),
  ('FREE_SHIPPING_THRESHOLD', '{"amount": 500}'::jsonb, 'Free shipping threshold in ZAR', 'shipping', true),
  ('TAX_RATE', '{"rate": 0.15}'::jsonb, 'VAT rate (15%)', 'pricing', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE admin_users IS 'Admin role management and permissions';
COMMENT ON TABLE messages IS 'Customer support messages and admin communication';
COMMENT ON TABLE system_config IS 'System-wide configuration and feature flags';
COMMENT ON TABLE idempotency_keys IS 'API idempotency keys to prevent duplicate requests';
COMMENT ON TABLE inventory_alerts IS 'Low stock alerts for admin dashboard';
COMMENT ON TABLE admin_audit_log IS 'Tracks all admin actions for security and compliance';
COMMENT ON TABLE login_attempts IS 'Tracks login attempts for brute force detection';
COMMENT ON TABLE admin_sessions IS 'Tracks active admin sessions for security monitoring';
COMMENT ON TABLE security_alerts IS 'Security alerts for admin monitoring';
COMMENT ON TABLE admin_ip_whitelist IS 'Whitelisted IP addresses for admin access';

COMMENT ON COLUMN admin_users.role IS 'Admin role: super_admin, admin, moderator, support';
COMMENT ON COLUMN admin_users.mfa_enabled IS 'Whether multi-factor authentication is enabled';
COMMENT ON COLUMN messages.status IS 'Message status: unread, read, replied, archived';
COMMENT ON COLUMN system_config.is_public IS 'Whether config value is exposed to frontend';
COMMENT ON COLUMN idempotency_keys.expires_at IS 'Idempotency keys expire after 24 hours';
COMMENT ON COLUMN admin_audit_log.status IS 'Action status: success, failed, blocked';
COMMENT ON COLUMN security_alerts.severity IS 'Alert severity: low, medium, high, critical';

