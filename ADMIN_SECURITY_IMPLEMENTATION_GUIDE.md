# Admin Security Implementation Guide

## Quick Start (15 minutes)

Follow these steps to implement the most critical security improvements immediately.

---

## Step 1: Run Database Migrations (5 minutes)

### The security features have been added to existing migration files:

**No new migration files needed!** Security tables, functions, triggers, and RLS policies have been added to:
- ✅ `supabase/migrations/00300_admin_system.sql` - Security tables
- ✅ `supabase/migrations/01500_rls_policies.sql` - RLS policies
- ✅ `supabase/migrations/01700_functions.sql` - Security functions
- ✅ `supabase/migrations/01800_triggers.sql` - Security triggers

### To apply (if starting fresh):
```bash
# Run all migrations in order
cd supabase/migrations
# Or use Supabase CLI
supabase db reset
```

### If database already exists:
The migrations use `IF NOT EXISTS` and `IF EXISTS` so they're safe to re-run. Just execute:
- `00300_admin_system.sql` - Adds security tables and fields
- `01500_rls_policies.sql` - Adds RLS policies
- `01700_functions.sql` - Adds security functions
- `01800_triggers.sql` - Adds security triggers

**Via Supabase Dashboard:**
1. Go to SQL Editor
2. Run each file in order (00300, 01500, 01700, 01800)
3. Verify tables created successfully

---

## Step 2: Update Admin Dashboard (5 minutes)

### Add Security Dashboard to Admin Panel

Edit `src/pages/AdminDashboardPage.tsx`:

```typescript
import SecurityDashboard from '@/components/admin/SecurityDashboard';
import SessionTimeoutWarning from '@/components/admin/SessionTimeoutWarning';

// Add 'security' to TabType
type TabType = 'dashboard' | 'orders' | 'messages' | 'products' | 'customers' | 'movements' | 'settings' | 'security';

// Add to navigation tabs
<button
  onClick={() => setActiveTab('security')}
  className={`...`}
>
  <Shield className="w-4 h-4" />
  Security
</button>

// Add to content area
{activeTab === 'security' && <SecurityDashboard />}

// Add session timeout warning
<SessionTimeoutWarning timeoutMinutes={30} />
```

---

## Step 3: Enable Audit Logging (3 minutes)

### Wrap admin actions with audit logging

Edit your admin action handlers to include logging:

```typescript
import { useAdminSecurity } from '@/hooks/useAdminSecurity';

const { logAction } = useAdminSecurity();

// Example: Log order status update
const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    // Perform the update
    await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    
    // Log the action
    await logAction(
      'update_order_status',
      'order',
      orderId,
      { old_status: currentStatus, new_status: status }
    );
  } catch (err) {
    console.error('Failed to update order:', err);
  }
};
```

---

## Step 4: Add Login Tracking (2 minutes)

### Update your login page

Edit `src/pages/auth/LoginPage.tsx`:

```typescript
import { useAdminSecurity } from '@/hooks/useAdminSecurity';

const { trackLoginAttempt, updateLastLogin } = useAdminSecurity();

const handleLogin = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Track failed attempt
      await trackLoginAttempt(email, false, error.message);
      throw error;
    }

    // Track successful attempt
    await trackLoginAttempt(email, true);
    
    // Update last login
    if (data.user) {
      await updateLastLogin(data.user.id);
    }

    navigate('/admin');
  } catch (err) {
    console.error('Login failed:', err);
  }
};
```

---

## Step 5: Test the Implementation (Optional)

### Verify everything works:

1. **Test Audit Logging:**
   - Perform an admin action (e.g., update an order)
   - Go to Security Dashboard → Audit Log
   - Verify the action is logged

2. **Test Session Timeout:**
   - Stay inactive for 25 minutes
   - Verify warning appears at 25 minutes
   - Verify auto-logout at 30 minutes

3. **Test Login Tracking:**
   - Try logging in with wrong password 5 times
   - Verify security alert is created

---

## Advanced Features (Optional)

### Enable MFA (Multi-Factor Authentication)

1. Go to Admin Dashboard → Security → MFA Settings
2. Click "Enable MFA"
3. Scan QR code with authenticator app
4. Enter verification code
5. MFA is now enabled for your account

### Configure IP Whitelist

```sql
-- Add your office/home IP to whitelist
INSERT INTO admin_ip_whitelist (ip_address, description)
VALUES ('YOUR_IP_ADDRESS', 'Office Network');
```

Then add IP check to your admin routes:

```typescript
// In AdminDashboardPage.tsx
const checkIPWhitelist = async () => {
  const { data } = await supabase.rpc('is_ip_whitelisted', {
    p_ip_address: await getClientIP()
  });
  
  if (!data) {
    navigate('/access-denied');
  }
};
```

---

## Monitoring & Alerts

### Set up real-time monitoring:

```typescript
// Subscribe to security alerts
useEffect(() => {
  const channel = supabase
    .channel('security_alerts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'security_alerts'
      },
      (payload) => {
        // Show notification
        toast.error(`Security Alert: ${payload.new.alert_type}`);
        
        // Send to monitoring service
        sendToSlack(payload.new);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, []);
```

---

## Environment Variables

Add to your `.env` file:

```bash
# Session timeout in minutes (default: 30)
VITE_ADMIN_SESSION_TIMEOUT=30

# Enable IP whitelist checking (default: false)
VITE_ADMIN_IP_WHITELIST_ENABLED=false

# Admin access code (optional additional security layer)
VITE_ADMIN_ACCESS_CODE=your-secret-code-here
```

---

## Production Checklist

Before deploying to production:

- [ ] Database migration executed successfully
- [ ] Audit logging implemented for all admin actions
- [ ] Login tracking enabled
- [ ] Session timeout configured
- [ ] MFA enabled for all admin users
- [ ] Security alerts monitored
- [ ] IP whitelist configured (if needed)
- [ ] Security headers added to hosting config
- [ ] Rate limiting configured (AWS WAF or similar)
- [ ] Backup and recovery tested

---

## Troubleshooting

### Issue: Audit logs not appearing

**Solution:** Check RLS policies
```sql
-- Verify you have admin access
SELECT * FROM admin_users WHERE user_id = auth.uid();

-- Test audit log insert
SELECT log_admin_action(
  (SELECT id FROM admin_users WHERE user_id = auth.uid()),
  'test_action',
  'test_resource'
);
```

### Issue: MFA enrollment fails

**Solution:** Check Supabase Auth settings
1. Go to Supabase Dashboard → Authentication → Settings
2. Ensure "Enable Multi-Factor Authentication" is ON
3. Verify TOTP is enabled

### Issue: Session timeout not working

**Solution:** Check browser console for errors
- Ensure `useSessionTimeout` hook is called in admin layout
- Verify event listeners are attached correctly

---

## Security Best Practices

1. **Regular Audits:** Review audit logs weekly
2. **Alert Response:** Respond to security alerts within 24 hours
3. **Password Policy:** Enforce strong passwords (12+ characters)
4. **MFA Mandatory:** Require MFA for all admin users
5. **Least Privilege:** Grant minimum necessary permissions
6. **Regular Updates:** Keep dependencies updated
7. **Backup Strategy:** Regular database backups
8. **Incident Response:** Have a plan for security incidents

---

## Support & Resources

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **OWASP Security Guide:** https://owasp.org/www-project-web-security-testing-guide/
- **Security Headers:** https://securityheaders.com/

---

## Next Steps

After implementing basic security:

1. **Week 2:** Add rate limiting and IP whitelist
2. **Week 3:** Set up monitoring and alerting
3. **Week 4:** Conduct security audit
4. **Month 2:** Implement advanced RBAC
5. **Month 3:** Set up admin subdomain

---

## Cost Estimate

| Feature | Monthly Cost |
|---------|-------------|
| Database storage (audit logs) | $2-5 |
| AWS WAF (rate limiting) | $5-50 |
| Monitoring service | $0-20 |
| **Total** | **$7-75/month** |

Most features are free or low-cost!

---

## Questions?

If you encounter any issues:
1. Check the troubleshooting section above
2. Review Supabase logs in dashboard
3. Check browser console for errors
4. Review RLS policies in database
