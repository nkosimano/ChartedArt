# Admin UI Security Improvements

## Current Security Analysis

### ✅ What's Already Secure
1. **Database-level RLS (Row Level Security)** - Admin access is verified via `admin_users` table
2. **Session-based Authentication** - Using Supabase Auth with JWT tokens
3. **Client-side Route Protection** - Admin routes check session and admin status
4. **Backend API Authorization** - Lambda functions verify admin role before operations

### ⚠️ Security Gaps Identified

1. **No Multi-Factor Authentication (MFA)**
2. **No IP Whitelisting or Rate Limiting**
3. **No Audit Logging for Admin Actions**
4. **No Session Timeout Configuration**
5. **Admin routes accessible via direct URL (client-side only protection)**
6. **No separate admin subdomain or path prefix**
7. **No RBAC (Role-Based Access Control) enforcement on frontend**

---

## Recommended Security Improvements

### 1. **Enable Multi-Factor Authentication (MFA)** ⭐ HIGH PRIORITY

**Implementation:**
```typescript
// Add MFA enrollment for admin users
const enableMFA = async () => {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'ChartedArt Admin'
  });
  
  if (error) throw error;
  
  // Display QR code to user
  return data;
};

// Verify MFA on login
const verifyMFA = async (factorId: string, code: string) => {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    code
  });
  
  return { data, error };
};
```

**Benefits:**
- Prevents unauthorized access even if password is compromised
- Industry standard for admin panels
- Supabase has built-in MFA support

---

### 2. **Implement Audit Logging** ⭐ HIGH PRIORITY

**Database Schema:**
```sql
CREATE TABLE admin_audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  changes jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_audit_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_created_at ON admin_audit_log(created_at);
CREATE INDEX idx_admin_audit_action ON admin_audit_log(action);
```

**Implementation:**
```typescript
const logAdminAction = async (
  action: string,
  resourceType: string,
  resourceId?: string,
  changes?: any
) => {
  await supabase.from('admin_audit_log').insert({
    admin_user_id: currentAdminUser.id,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    ip_address: await getClientIP(),
    user_agent: navigator.userAgent,
    changes
  });
};
```

---

### 3. **Add Rate Limiting & IP Whitelisting** ⭐ MEDIUM PRIORITY

**Option A: Using AWS WAF (Recommended for Production)**
```yaml
# Add to AWS SAM template
AdminApiWAF:
  Type: AWS::WAFv2::WebACL
  Properties:
    Scope: REGIONAL
    DefaultAction:
      Allow: {}
    Rules:
      - Name: RateLimitRule
        Priority: 1
        Statement:
          RateBasedStatement:
            Limit: 100
            AggregateKeyType: IP
        Action:
          Block: {}
      - Name: IPWhitelistRule
        Priority: 2
        Statement:
          IPSetReferenceStatement:
            Arn: !GetAtt AdminIPSet.Arn
        Action:
          Allow: {}
```

**Option B: Using Supabase Edge Functions**
```typescript
// In Supabase Edge Function
const ALLOWED_IPS = ['YOUR_OFFICE_IP', 'YOUR_VPN_IP'];
const RATE_LIMIT = 100; // requests per minute

export async function handler(req: Request) {
  const clientIP = req.headers.get('x-forwarded-for');
  
  // Check IP whitelist
  if (!ALLOWED_IPS.includes(clientIP)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Check rate limit (use Redis or KV store)
  const rateKey = `rate:${clientIP}`;
  const count = await kv.incr(rateKey);
  
  if (count === 1) {
    await kv.expire(rateKey, 60);
  }
  
  if (count > RATE_LIMIT) {
    return new Response('Too Many Requests', { status: 429 });
  }
  
  // Continue with request
}
```

---

### 4. **Implement Session Management** ⭐ MEDIUM PRIORITY

**Configure Supabase Auth Settings:**
```typescript
// In Supabase Dashboard > Authentication > Settings
// Or via API
{
  "jwt_expiry": 3600, // 1 hour for admin sessions
  "refresh_token_rotation_enabled": true,
  "security_update_password_require_reauthentication": true
}
```

**Add Session Timeout Warning:**
```typescript
const useSessionTimeout = (timeoutMinutes = 30) => {
  const [showWarning, setShowWarning] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    let warningTimer: NodeJS.Timeout;
    let logoutTimer: NodeJS.Timeout;
    
    const resetTimers = () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      
      // Show warning 5 minutes before logout
      warningTimer = setTimeout(() => {
        setShowWarning(true);
      }, (timeoutMinutes - 5) * 60 * 1000);
      
      // Auto logout
      logoutTimer = setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/auth/login?timeout=true');
      }, timeoutMinutes * 60 * 1000);
    };
    
    // Reset on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimers);
    });
    
    resetTimers();
    
    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimers);
      });
    };
  }, [timeoutMinutes, navigate]);
  
  return { showWarning, setShowWarning };
};
```

---

### 5. **Separate Admin Access Path** ⭐ LOW PRIORITY

**Option A: Subdomain (Recommended)**
```
admin.chartedart.com → Admin Panel
app.chartedart.com → Main App
```

**Benefits:**
- Clear separation of concerns
- Can apply different security policies
- Easier to monitor and protect

**Option B: Hidden Path with Additional Auth**
```typescript
// Use a non-obvious path
/secure-admin-panel-x7k9m2

// Add additional password layer
const ADMIN_ACCESS_CODE = import.meta.env.VITE_ADMIN_ACCESS_CODE;

const AdminAccessGate = ({ children }) => {
  const [accessCode, setAccessCode] = useState('');
  const [granted, setGranted] = useState(false);
  
  if (granted) return children;
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <input
        type="password"
        value={accessCode}
        onChange={(e) => setAccessCode(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && accessCode === ADMIN_ACCESS_CODE) {
            setGranted(true);
          }
        }}
        placeholder="Enter admin access code"
      />
    </div>
  );
};
```

---

### 6. **Enhanced RBAC (Role-Based Access Control)** ⭐ MEDIUM PRIORITY

**Current Roles:**
- `super_admin` - Full access
- `admin` - Most operations
- `moderator` - Content moderation
- `support` - Customer support
- `analyst` - Read-only analytics

**Implementation:**
```typescript
// Define permissions
const PERMISSIONS = {
  super_admin: ['*'], // All permissions
  admin: [
    'orders.read', 'orders.update', 'orders.delete',
    'products.read', 'products.create', 'products.update', 'products.delete',
    'customers.read', 'customers.update',
    'messages.read', 'messages.update',
    'analytics.read'
  ],
  moderator: [
    'products.read', 'products.update',
    'messages.read', 'messages.update'
  ],
  support: [
    'orders.read', 'orders.update',
    'customers.read',
    'messages.read', 'messages.update'
  ],
  analyst: [
    'orders.read',
    'products.read',
    'customers.read',
    'analytics.read'
  ]
};

// Permission check hook
const usePermission = (permission: string) => {
  const { adminUser } = useAdmin();
  
  if (!adminUser) return false;
  
  const userPermissions = PERMISSIONS[adminUser.role] || [];
  
  if (userPermissions.includes('*')) return true;
  
  return userPermissions.includes(permission);
};

// Usage in components
const ProductManagement = () => {
  const canCreate = usePermission('products.create');
  const canUpdate = usePermission('products.update');
  const canDelete = usePermission('products.delete');
  
  return (
    <div>
      {canCreate && <button>Create Product</button>}
      {canUpdate && <button>Edit Product</button>}
      {canDelete && <button>Delete Product</button>}
    </div>
  );
};
```

---

### 7. **Security Headers & CSP** ⭐ HIGH PRIORITY

**Add to your hosting configuration:**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        font-src 'self' data:;
        connect-src 'self' https://*.supabase.co https://api.stripe.com;
        frame-src https://js.stripe.com;
      `.replace(/\s+/g, ' ').trim()
    }
  }
});
```

---

## Implementation Priority

### Phase 1 (Immediate - Week 1)
1. ✅ Enable MFA for all admin users
2. ✅ Implement audit logging
3. ✅ Add security headers

### Phase 2 (Short-term - Week 2-3)
4. ✅ Configure session timeout
5. ✅ Add rate limiting
6. ✅ Implement RBAC permissions

### Phase 3 (Long-term - Month 1-2)
7. ✅ Set up admin subdomain
8. ✅ Add IP whitelisting
9. ✅ Implement monitoring & alerts

---

## Quick Wins (Can Implement Today)

### 1. Force Password Complexity
```typescript
// In Supabase Dashboard > Authentication > Policies
// Or via SQL
ALTER TABLE auth.users 
ADD CONSTRAINT password_length CHECK (char_length(encrypted_password) >= 12);
```

### 2. Add Login Attempt Monitoring
```typescript
const trackLoginAttempt = async (email: string, success: boolean) => {
  await supabase.from('login_attempts').insert({
    email,
    success,
    ip_address: await getClientIP(),
    user_agent: navigator.userAgent,
    timestamp: new Date().toISOString()
  });
  
  // Check for brute force
  const { count } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .eq('success', false)
    .gte('timestamp', new Date(Date.now() - 15 * 60 * 1000).toISOString());
  
  if (count && count > 5) {
    throw new Error('Too many failed login attempts. Please try again later.');
  }
};
```

### 3. Add "Last Login" Tracking
```typescript
// Add to admin_users table
ALTER TABLE admin_users 
ADD COLUMN last_login_at timestamptz,
ADD COLUMN last_login_ip inet;

// Update on login
const updateLastLogin = async (userId: string) => {
  await supabase
    .from('admin_users')
    .update({
      last_login_at: new Date().toISOString(),
      last_login_ip: await getClientIP()
    })
    .eq('user_id', userId);
};
```

---

## Monitoring & Alerts

### Set up alerts for:
1. Failed login attempts (>3 in 5 minutes)
2. New admin user added
3. Admin user role changed
4. Bulk operations (delete >10 items)
5. Access from new IP address
6. After-hours access (if applicable)

### Example Alert Implementation:
```typescript
const sendSecurityAlert = async (event: string, details: any) => {
  // Send to your monitoring service (e.g., Slack, Email, PagerDuty)
  await fetch('YOUR_WEBHOOK_URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      details,
      timestamp: new Date().toISOString(),
      severity: 'high'
    })
  });
};
```

---

## Cost Considerations

| Feature | Cost | Effort |
|---------|------|--------|
| MFA | Free (Supabase built-in) | Low |
| Audit Logging | ~$5/month (storage) | Medium |
| Rate Limiting | $5-50/month (AWS WAF) | Medium |
| Session Management | Free | Low |
| Admin Subdomain | $0-10/month | Medium |
| RBAC | Free | High |
| Security Headers | Free | Low |

**Total Estimated Cost:** $10-65/month
**Total Implementation Time:** 2-3 weeks

---

## Testing Checklist

- [ ] MFA enrollment works for new admin users
- [ ] MFA verification required on login
- [ ] Audit log captures all admin actions
- [ ] Rate limiting blocks excessive requests
- [ ] Session timeout triggers after inactivity
- [ ] RBAC prevents unauthorized actions
- [ ] Security headers present in responses
- [ ] Failed login attempts are tracked
- [ ] Alerts trigger for suspicious activity

---

## Additional Resources

- [Supabase MFA Documentation](https://supabase.com/docs/guides/auth/auth-mfa)
- [OWASP Admin Interface Security](https://cheatsheetseries.owasp.org/cheatsheets/Admin_Interface_Security_Cheat_Sheet.html)
- [AWS WAF Best Practices](https://docs.aws.amazon.com/waf/latest/developerguide/security-best-practices.html)
