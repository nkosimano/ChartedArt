-- ============================================
-- Admin Security Enhancement Tables
-- ============================================

-- 1. Admin Audit Log Table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  changes jsonb,
  status text DEFAULT 'success' CHECK (status IN ('success', 'failed', 'blocked')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_audit_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX idx_admin_audit_status ON admin_audit_log(status) WHERE status != 'success';

COMMENT ON TABLE admin_audit_log IS 'Tracks all admin actions for security and compliance';

-- 2. Login Attempts Table
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  success boolean NOT NULL,
  ip_address inet,
  user_agent text,
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at DESC);
CREATE INDEX idx_login_attempts_failed ON login_attempts(email, created_at) WHERE success = false;

COMMENT ON TABLE login_attempts IS 'Tracks login attempts for brute force detection';

-- 3. Admin Sessions Table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id uuid REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  ip_address inet,
  user_agent text,
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_sessions_admin_user ON admin_sessions(admin_user_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_active ON admin_sessions(is_active, expires_at) WHERE is_active = true;

COMMENT ON TABLE admin_sessions IS 'Tracks active admin sessions for security monitoring';

-- 4. Security Alerts Table
CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type text NOT NULL CHECK (alert_type IN (
    'failed_login_attempts',
    'new_admin_user',
    'role_change',
    'bulk_operation',
    'suspicious_ip',
    'after_hours_access',
    'mfa_disabled',
    'password_change'
  )),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  admin_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  details jsonb NOT NULL,
  is_resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_unresolved ON security_alerts(is_resolved, created_at) WHERE is_resolved = false;
CREATE INDEX idx_security_alerts_admin_user ON security_alerts(admin_user_id);

COMMENT ON TABLE security_alerts IS 'Security alerts for admin monitoring';

-- 5. IP Whitelist Table
CREATE TABLE IF NOT EXISTS admin_ip_whitelist (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address inet NOT NULL UNIQUE,
  description text,
  added_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_ip_whitelist_active ON admin_ip_whitelist(ip_address) WHERE is_active = true;

COMMENT ON TABLE admin_ip_whitelist IS 'Whitelisted IP addresses for admin access';

-- 6. Extend admin_users table with security fields
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
ADD COLUMN IF NOT EXISTS last_login_ip inet,
ADD COLUMN IF NOT EXISTS mfa_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS mfa_secret text,
ADD COLUMN IF NOT EXISTS failed_login_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until timestamptz,
ADD COLUMN IF NOT EXISTS password_changed_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_admin_users_mfa ON admin_users(mfa_enabled) WHERE mfa_enabled = true;
CREATE INDEX IF NOT EXISTS idx_admin_users_locked ON admin_users(locked_until) WHERE locked_until IS NOT NULL;

-- ============================================
-- Security Functions
-- ============================================

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_changes jsonb DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    ip_address,
    user_agent,
    changes
  ) VALUES (
    p_admin_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    p_changes
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for brute force attempts
CREATE OR REPLACE FUNCTION check_brute_force(p_email text)
RETURNS boolean AS $$
DECLARE
  v_failed_count integer;
BEGIN
  -- Count failed attempts in last 15 minutes
  SELECT COUNT(*) INTO v_failed_count
  FROM login_attempts
  WHERE email = p_email
    AND success = false
    AND created_at > now() - interval '15 minutes';
  
  -- Return true if too many failed attempts
  RETURN v_failed_count >= 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create security alert
CREATE OR REPLACE FUNCTION create_security_alert(
  p_alert_type text,
  p_severity text,
  p_admin_user_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_alert_id uuid;
BEGIN
  INSERT INTO security_alerts (
    alert_type,
    severity,
    admin_user_id,
    details
  ) VALUES (
    p_alert_type,
    p_severity,
    p_admin_user_id,
    p_details
  ) RETURNING id INTO v_alert_id;
  
  -- TODO: Trigger notification (webhook, email, etc.)
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check IP whitelist
CREATE OR REPLACE FUNCTION is_ip_whitelisted(p_ip_address inet)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_ip_whitelist
    WHERE ip_address = p_ip_address
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old audit logs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(p_days integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM admin_audit_log
  WHERE created_at < now() - (p_days || ' days')::interval;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_ip_whitelist ENABLE ROW LEVEL SECURITY;

-- Admin audit log policies
CREATE POLICY "Admin users can view audit logs"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.is_active = true
        AND au.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Login attempts policies
CREATE POLICY "Admin users can view login attempts"
  ON login_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.is_active = true
        AND au.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can insert login attempts"
  ON login_attempts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admin sessions policies
CREATE POLICY "Admin users can view their own sessions"
  ON admin_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND (au.id = admin_sessions.admin_user_id OR au.role = 'super_admin')
    )
  );

-- Security alerts policies
CREATE POLICY "Admin users can view security alerts"
  ON security_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.is_active = true
        AND au.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Super admins can update security alerts"
  ON security_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.is_active = true
        AND au.role = 'super_admin'
    )
  );

-- IP whitelist policies
CREATE POLICY "Admin users can view IP whitelist"
  ON admin_ip_whitelist FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.is_active = true
        AND au.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Super admins can manage IP whitelist"
  ON admin_ip_whitelist FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.is_active = true
        AND au.role = 'super_admin'
    )
  );

-- ============================================
-- Triggers
-- ============================================

-- Trigger to create alert on new admin user
CREATE OR REPLACE FUNCTION trigger_new_admin_alert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_security_alert(
    'new_admin_user',
    'high',
    NEW.id,
    jsonb_build_object(
      'email', (SELECT email FROM profiles WHERE id = NEW.user_id),
      'role', NEW.role,
      'created_by', NEW.created_by
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_admin_user_alert
  AFTER INSERT ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_admin_alert();

-- Trigger to create alert on role change
CREATE OR REPLACE FUNCTION trigger_role_change_alert()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role != NEW.role THEN
    PERFORM create_security_alert(
      'role_change',
      'high',
      NEW.id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'email', (SELECT email FROM profiles WHERE id = NEW.user_id)
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_role_change_alert
  AFTER UPDATE ON admin_users
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION trigger_role_change_alert();

-- ============================================
-- Initial Data
-- ============================================

-- Add localhost to IP whitelist for development
INSERT INTO admin_ip_whitelist (ip_address, description, is_active)
VALUES 
  ('127.0.0.1', 'Localhost', true),
  ('::1', 'Localhost IPv6', true)
ON CONFLICT (ip_address) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT ON admin_audit_log TO authenticated;
GRANT SELECT, INSERT ON login_attempts TO authenticated;
GRANT SELECT ON admin_sessions TO authenticated;
GRANT SELECT ON security_alerts TO authenticated;
GRANT SELECT ON admin_ip_whitelist TO authenticated;

COMMENT ON SCHEMA public IS 'Admin security tables and functions added';
