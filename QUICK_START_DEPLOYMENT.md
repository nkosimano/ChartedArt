# Quick Start Deployment Guide

**Time Required:** ~30 minutes  
**Difficulty:** Intermediate

---

## 🚀 Step-by-Step Deployment

### Step 1: Database Migrations (5 minutes)

```bash
# Connect to your Supabase project
# Go to SQL Editor in Supabase Dashboard

# Run Migration 1: Push Notifications
# Copy and paste contents of:
database/migrations/create_push_notification_log.sql

# Run Migration 2: Cart Analytics
# Copy and paste contents of:
database/migrations/create_cart_analytics.sql

# Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('push_notification_log', 'cart_sessions', 'order_status_history');
```

**Expected Output:** 3 tables listed

---

### Step 2: Backend Deployment (10 minutes)

#### Option A: AWS SAM (Recommended)

```bash
cd backend

# Update template.yaml to include new functions
# Add these to Resources section:

  AddToCartFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/handlers/
      Handler: add-to-cart.handler
      Events:
        AddToCart:
          Type: Api
          Properties:
            Path: /cart
            Method: post

  SendBulkNotificationFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/handlers/
      Handler: send-bulk-notification.handler
      Events:
        SendBulkNotification:
          Type: Api
          Properties:
            Path: /admin/send-bulk-notification
            Method: post

# Deploy
sam build
sam deploy --guided
```

#### Option B: Manual Lambda Upload

1. Zip each handler file with node_modules
2. Upload to AWS Lambda console
3. Create API Gateway routes
4. Set environment variables

---

### Step 3: Admin Portal Update (5 minutes)

```bash
cd src

# Install dependencies (if needed)
npm install

# Build
npm run build

# Deploy to your hosting
# Vercel:
vercel --prod

# Or Netlify:
netlify deploy --prod

# Or manual:
# Upload build/ folder to your hosting
```

---

### Step 4: Mobile App Rebuild (10 minutes)

```bash
cd mobile

# Update environment variables
# Edit .env or eas.json

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Or for testing
eas build --platform all --profile preview
```

---

## ✅ Verification Tests

### Test 1: Price Validation (2 minutes)

```bash
# Test add to cart endpoint
curl -X POST https://your-api.com/cart \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://your-bucket.s3.amazonaws.com/test.jpg",
    "size": "8x10",
    "frame": "black",
    "quantity": 1
  }'

# Expected: Success with server-calculated price
# Should return: { "item": { "price": 44.99, ... } }
```

### Test 2: Push Notifications (3 minutes)

```bash
# 1. Update an order status in admin panel
# 2. Check mobile device for notification
# 3. Verify in database:

SELECT * FROM push_notification_log 
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC LIMIT 5;

# Expected: Recent notification entries
```

### Test 3: Admin Notification Composer (2 minutes)

```bash
# 1. Open admin panel
# 2. Navigate to notification composer
# 3. Send test notification to yourself
# 4. Check mobile device
# 5. Verify delivery report shows success
```

### Test 4: Cart Analytics (2 minutes)

```bash
# 1. Add items to cart in mobile app
# 2. Check database:

SELECT * FROM cart_sessions 
WHERE status = 'active'
ORDER BY last_activity DESC;

# Expected: Your cart session appears
```

---

## 🔧 Configuration Checklist

### Backend Environment Variables
- [ ] `SUPABASE_URL` set
- [ ] `SUPABASE_SERVICE_KEY` set
- [ ] `S3_BUCKET_URL` set
- [ ] All Lambda functions have correct IAM roles

### Mobile App Environment
- [ ] `EXPO_PUBLIC_API_URL` points to production API
- [ ] `EXPO_PUBLIC_SUPABASE_URL` set
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `EXPO_PUBLIC_USE_MOCK_DATA` is `false`

### Admin Portal Environment
- [ ] `NEXT_PUBLIC_API_URL` points to production API
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set

---

## 🐛 Troubleshooting

### Issue: Database migration fails

**Solution:**
```sql
-- Check if tables already exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Drop existing tables if needed (CAUTION!)
DROP TABLE IF EXISTS push_notification_log CASCADE;
DROP TABLE IF EXISTS cart_sessions CASCADE;

-- Re-run migration
```

### Issue: Lambda function not found

**Solution:**
```bash
# List deployed functions
aws lambda list-functions --query 'Functions[*].FunctionName'

# Check function logs
aws logs tail /aws/lambda/YourFunctionName --follow
```

### Issue: Notifications not sending

**Solution:**
```sql
-- Check if user has push token
SELECT id, email, push_token FROM profiles WHERE id = 'USER_ID';

-- Check notification log for errors
SELECT * FROM push_notification_log 
WHERE delivered = false 
ORDER BY created_at DESC LIMIT 10;
```

### Issue: Mobile app still using mock data

**Solution:**
```bash
# Check environment variables
cat mobile/.env

# Rebuild with correct env
eas build --platform all --profile production --clear-cache
```

---

## 📊 Post-Deployment Monitoring

### Day 1: Monitor Logs

```bash
# Backend logs
aws logs tail /aws/lambda/AddToCartFunction --follow
aws logs tail /aws/lambda/SendBulkNotificationFunction --follow

# Database queries
SELECT COUNT(*) FROM push_notification_log WHERE created_at > NOW() - INTERVAL '1 day';
SELECT COUNT(*) FROM cart_sessions WHERE status = 'active';
```

### Week 1: Check Metrics

```sql
-- Notification delivery rate
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE delivered = true) as delivered,
  ROUND(COUNT(*) FILTER (WHERE delivered = true)::DECIMAL / COUNT(*) * 100, 2) as delivery_rate
FROM push_notification_log
WHERE created_at > NOW() - INTERVAL '7 days';

-- Cart conversion rate
SELECT * FROM cart_analytics WHERE date > NOW() - INTERVAL '7 days';

-- Active users with push enabled
SELECT COUNT(*) FROM profiles WHERE push_token IS NOT NULL;
```

---

## 🎯 Success Metrics

After deployment, you should see:

- ✅ **Push notification delivery rate:** >95%
- ✅ **Cart tracking:** 100% of carts logged
- ✅ **Price validation:** 0 client-side price manipulations
- ✅ **Admin notifications:** Successfully sent to targeted users
- ✅ **Order notifications:** Sent within 5 seconds of status change

---

## 📞 Need Help?

### Check These First:
1. Review `MOBILE_APP_AUDIT.md` for detailed issue descriptions
2. Check `IMPLEMENTATION_COMPLETE.md` for full implementation details
3. Review CloudWatch/Lambda logs for backend errors
4. Check Supabase logs for database errors

### Common Commands:

```bash
# View Lambda logs
aws logs tail /aws/lambda/FUNCTION_NAME --follow

# Test API endpoint
curl -X POST https://your-api.com/endpoint \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Check database
psql -h your-db-host -U postgres -d your-db
```

---

## ✅ Deployment Complete!

Once all steps are complete and tests pass, your implementation is live! 🎉

**Next:** Monitor for 24-48 hours and proceed with Phase 2 improvements.

