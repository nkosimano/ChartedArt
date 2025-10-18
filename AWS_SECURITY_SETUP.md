# 🚨 URGENT: AWS Credentials Security Issue

## ⚠️ IMMEDIATE ACTION REQUIRED

Your AWS credentials were previously exposed and have been rotated.

**If you see any AWS credentials in chat history, they should be immediately rotated.**

---

## 🔒 Step 1: Rotate Credentials (DO THIS NOW)

### 1.1 Deactivate Old Credentials
1. Go to **AWS Console**: https://console.aws.amazon.com
2. Navigate to **IAM** → **Users** → [Your User]
3. Click **Security credentials** tab
4. Find any compromised access keys
5. Click **Actions** → **Deactivate**
6. Then click **Actions** → **Delete** (after deactivating)

### 1.2 Create New Credentials
1. In the same **Security credentials** tab
2. Click **Create access key**
3. Select **Use case**: "Local code" or "CLI"
4. Click **Next** → **Create access key**
5. **IMMEDIATELY** download the CSV or copy both:
   - Access Key ID
   - Secret Access Key
6. Click **Done**

### 1.3 Configure New Credentials
```powershell
# Run this command and enter your NEW credentials
aws configure

# Enter:
# AWS Access Key ID: <your-new-access-key-id>
# AWS Secret Access Key: <your-new-secret-access-key>
# Default region: us-east-1
# Default output format: json
```

---

## 🛡️ Step 2: Set Up S3 Securely

### 2.1 Run the Setup Script
```powershell
# Make sure you've rotated credentials first!
cd C:\Users\nathi\OneDrive\Documents\Projects\ChartedArt
.\setup-s3.ps1
```

This script will:
- ✅ Create S3 bucket with proper security
- ✅ Enable versioning
- ✅ Configure CORS for web uploads
- ✅ Set up bucket policy for Lambda access
- ✅ Store config in AWS Secrets Manager
- ✅ Update your .env files

### 2.2 What the Script Does

**Creates S3 Bucket:**
- Name: `chartedart-user-uploads-{your-account-id}`
- Region: `us-east-1`
- Versioning: Enabled
- Public access: Blocked (secure)

**Security Configuration:**
- CORS enabled for web uploads
- Bucket policy allows only Lambda functions
- No public read/write access
- Files accessed via signed URLs

**Secrets Manager:**
- Stores S3 config securely
- Lambda functions read from Secrets Manager
- No hardcoded credentials

---

## 📋 Step 3: Update Backend Configuration

### 3.1 Update backend/.env.backend
After running `setup-s3.ps1`, edit `backend/.env.backend`:

```bash
# AWS Configuration (auto-filled by script)
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=<your-account-id>

# S3 Configuration (auto-filled by script)
S3_BUCKET_NAME=chartedart-user-uploads-<your-account-id>
S3_BUCKET_URL=https://chartedart-user-uploads-<your-account-id>.s3.amazonaws.com

# Supabase (REQUIRED: Get from Supabase Dashboard)
SUPABASE_URL=https://nmfalijsgoqokxjlhzha.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_KEY

# Stripe (REQUIRED: Get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY
```

### 3.2 Get Supabase Service Role Key
1. Go to: https://supabase.com/dashboard/project/nmfalijsgoqokxjlhzha/settings/api
2. Copy **service_role** key (NOT anon key!)
3. Paste into `SUPABASE_SERVICE_KEY`

### 3.3 Get Stripe Secret Key
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy **Secret key** (starts with `sk_test_`)
3. Paste into `STRIPE_SECRET_KEY`

---

## 🚀 Step 4: Deploy Backend

```powershell
cd backend

# Build
sam build

# Deploy (first time - guided)
sam deploy --guided

# Answer prompts:
# Stack Name: chartedart-backend
# AWS Region: us-east-1
# Confirm changes before deploy: Y
# Allow SAM CLI IAM role creation: Y
# Save arguments to configuration file: Y
```

---

## ✅ Step 5: Test Everything

### 5.1 Test S3 Upload
```powershell
# Test upload
aws s3 cp test.jpg s3://chartedart-user-uploads-<account-id>/test.jpg

# List files
aws s3 ls s3://chartedart-user-uploads-<account-id>/

# Delete test file
aws s3 rm s3://chartedart-user-uploads-<account-id>/test.jpg
```

### 5.2 Test Web App
1. Start dev server: `npm run dev`
2. Go to Create page
3. Upload an image
4. Should upload to S3 successfully
5. Add to cart
6. Should insert into cart_items ✅

---

## 🔐 Security Best Practices

### ✅ DO:
- ✅ Use **AWS Secrets Manager** for sensitive data
- ✅ Use **IAM roles** for Lambda (no hardcoded keys)
- ✅ Rotate credentials regularly
- ✅ Use **environment variables** for config
- ✅ Keep `.env` files in `.gitignore`
- ✅ Use **least privilege** IAM policies

### ❌ DON'T:
- ❌ Share credentials in chat/email/Slack
- ❌ Commit credentials to Git
- ❌ Use root account credentials
- ❌ Give credentials broad permissions
- ❌ Store credentials in code
- ❌ Share credentials between environments

---

## 🆘 If Credentials Are Compromised

1. **Immediately deactivate** in IAM Console
2. **Delete** the compromised key
3. **Create new** credentials
4. **Review CloudTrail** logs for unauthorized access
5. **Check AWS billing** for unexpected charges
6. **Rotate all related secrets**

---

## 📞 Support

If you need help:
- AWS Support: https://console.aws.amazon.com/support
- IAM Best Practices: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
- Security Incident Response: Contact AWS Support immediately

---

## ✅ Checklist

Before continuing, make sure you've completed:

- [ ] Deactivated any compromised credentials
- [ ] Created new AWS credentials
- [ ] Configured AWS CLI with new credentials (`aws configure`)
- [ ] Run `setup-s3.ps1` successfully
- [ ] Updated `backend/.env.backend` with Supabase & Stripe keys
- [ ] S3 bucket created and configured
- [ ] Secrets stored in AWS Secrets Manager
- [ ] Ready to deploy backend

**Once completed, you can safely use S3 for file uploads!** 🎉
