# ChartedArt Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **AWS SAM CLI** installed
4. **Node.js 20+** installed
5. **Git** installed
6. **Supabase Project** set up
7. **Stripe Account** configured

## Quick Start Deployment

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy from example
cp .env.example .env

# Edit with your values
nano .env
```

Required variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `VITE_GOOGLE_MAPS_API_KEY` - Your Google Maps API key

### 3. Deploy Backend to AWS

```bash
cd backend

# Build the SAM application
sam build

# Deploy (first time - guided)
sam deploy --guided

# Follow the prompts:
# - Stack name: chartedart-backend-dev
# - AWS Region: us-east-1 (or your preferred region)
# - SupabaseUrl: [Your Supabase URL]
# - SupabaseServiceKey: [Your Supabase service role key]
# - StripeSecretKey: [Your Stripe secret key]
# - Environment: dev
# - Confirm changes: Y
# - Allow SAM CLI IAM role creation: Y
# - Save arguments to configuration file: Y

# Subsequent deployments
sam deploy
```

### 4. Update Frontend Environment

After backend deployment, update `.env` with the API Gateway URL:

```bash
# Get the API Gateway URL from SAM output
VITE_API_GATEWAY_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/Prod
```

### 5. Build and Deploy Frontend

```bash
# Build frontend
npm run build

# Deploy to S3 + CloudFront (or your hosting provider)
# Option 1: AWS S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Option 2: Netlify
netlify deploy --prod --dir=dist

# Option 3: Vercel
vercel --prod
```

## Detailed Deployment Steps

### Backend Deployment (AWS SAM)

#### First-Time Setup

1. **Create S3 Bucket for Deployment Artifacts**
   ```bash
   aws s3 mb s3://chartedart-deployment-artifacts-$(aws sts get-caller-identity --query Account --output text)
   ```

2. **Build SAM Application**
   ```bash
   cd backend
   sam build
   ```

3. **Deploy with Guided Mode**
   ```bash
   sam deploy --guided
   ```

4. **Save Configuration**
   The guided deployment will create `samconfig.toml` with your settings.

#### Updating Backend

```bash
cd backend
sam build
sam deploy
```

#### Viewing Logs

```bash
# View logs for a specific function
sam logs -n GetOrdersFunction --tail

# View logs for all functions
sam logs --tail
```

#### Deleting Stack

```bash
sam delete
```

### Frontend Deployment

#### Option 1: AWS S3 + CloudFront

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://chartedart-frontend
   aws s3 website s3://chartedart-frontend --index-document index.html --error-document index.html
   ```

2. **Create CloudFront Distribution**
   ```bash
   # Use AWS Console or CLI to create CloudFront distribution
   # Point origin to S3 bucket
   # Configure custom error responses for SPA routing
   ```

3. **Deploy**
   ```bash
   npm run build
   aws s3 sync dist/ s3://chartedart-frontend --delete
   aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
   ```

#### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login and Deploy**
   ```bash
   netlify login
   netlify init
   netlify deploy --prod --dir=dist
   ```

#### Option 3: Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

## Environment-Specific Deployments

### Development

```bash
# Backend
cd backend
sam deploy --config-env dev

# Frontend
npm run build
# Deploy to dev environment
```

### Staging

```bash
# Backend
cd backend
sam deploy --config-env staging --parameter-overrides Environment=staging

# Frontend
VITE_API_GATEWAY_URL=https://staging-api.chartedart.com npm run build
# Deploy to staging environment
```

### Production

```bash
# Backend
cd backend
sam deploy --config-env production --parameter-overrides Environment=production

# Frontend
VITE_API_GATEWAY_URL=https://api.chartedart.com npm run build
# Deploy to production environment
```

## CI/CD with AWS CodePipeline

### Setup CodePipeline

1. **Create CodePipeline**
   - Source: GitHub repository
   - Build: AWS CodeBuild (uses buildspec.yml)
   - Deploy: AWS CloudFormation (SAM)

2. **Configure CodeBuild Environment Variables**
   - `DEPLOYMENT_BUCKET` - S3 bucket for artifacts
   - `VITE_API_GATEWAY_URL` - API Gateway URL
   - `VITE_SUPABASE_URL` - Supabase URL
   - `VITE_SUPABASE_ANON_KEY` - Supabase anon key
   - `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

3. **Trigger Pipeline**
   - Push to main branch triggers automatic deployment
   - Or manually trigger from AWS Console

## Post-Deployment Tasks

### 1. Verify Backend

```bash
# Test API Gateway endpoints
curl https://your-api-gateway-url/Prod/admin/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Verify Frontend

- Visit your frontend URL
- Test user registration and login
- Test file upload
- Test order creation
- Test payment processing

### 3. Configure Monitoring

- Set up CloudWatch alarms
- Configure Sentry for error tracking
- Set up LogRocket for session replay

### 4. Configure Domain

```bash
# For API Gateway
# 1. Create custom domain in API Gateway
# 2. Create Route53 record pointing to API Gateway

# For Frontend (CloudFront)
# 1. Request SSL certificate in ACM
# 2. Add alternate domain name to CloudFront
# 3. Create Route53 record pointing to CloudFront
```

## Troubleshooting

### Backend Issues

**Problem**: SAM deployment fails
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name chartedart-backend-dev

# Validate template
sam validate

# Check logs
sam logs -n FunctionName --tail
```

**Problem**: Lambda function errors
```bash
# View function logs
sam logs -n FunctionName --tail

# Check function configuration
aws lambda get-function --function-name FunctionName
```

### Frontend Issues

**Problem**: API calls failing
- Check `VITE_API_GATEWAY_URL` is correct
- Verify CORS configuration in API Gateway
- Check browser console for errors

**Problem**: Build fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Rollback Procedures

### Backend Rollback

```bash
# List stack versions
aws cloudformation list-stacks

# Rollback to previous version
aws cloudformation rollback-stack --stack-name chartedart-backend-dev
```

### Frontend Rollback

```bash
# S3: Restore previous version
aws s3 sync s3://chartedart-frontend-backup/ s3://chartedart-frontend/

# Netlify: Rollback to previous deployment
netlify rollback

# Vercel: Rollback to previous deployment
vercel rollback
```

## Security Checklist

- [ ] All secrets stored in AWS Secrets Manager or SAM parameters
- [ ] No service keys in frontend code
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled on API Gateway
- [ ] CloudWatch alarms configured
- [ ] Database RLS policies enabled
- [ ] S3 buckets are private
- [ ] CloudFront uses HTTPS only
- [ ] JWT tokens expire appropriately
- [ ] Admin endpoints require admin role

## Monitoring

### CloudWatch Dashboards

Create dashboards for:
- Lambda invocations and errors
- API Gateway requests and latency
- S3 upload metrics

### Alarms

Set up alarms for:
- Lambda error rate > 5%
- API Gateway 5xx rate > 1%
- Lambda duration > 8s

### Logs

- Lambda logs: CloudWatch Logs
- Frontend errors: Sentry
- User sessions: LogRocket

## Support

For deployment issues:
1. Check this documentation
2. Review backend README: `backend/README.md`
3. Check MIGRATION_STATUS.md for known issues
4. Review CloudWatch logs

## Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
