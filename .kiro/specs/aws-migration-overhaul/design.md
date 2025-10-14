# Design Document

## Overview

This design document outlines the architectural transformation of ChartedArt from a client-heavy Supabase application to a secure, serverless AWS-native backend with an enhanced frontend experience. The migration addresses critical security vulnerabilities, establishes Infrastructure as Code practices, and implements a comprehensive animation system using Framer Motion.

### Current Architecture Issues

1. **Critical Security Flaw**: The `VITE_SUPABASE_SERVICE_ROLE_KEY` is exposed in the client bundle through `src/lib/supabase/admin-client.ts`
2. **Client-Heavy Logic**: Business logic and data validation occur on the client side
3. **Direct Database Access**: Admin operations bypass proper authorization layers
4. **Unprotected File Uploads**: Files are uploaded directly to Supabase storage without server-side validation
5. **Missing Animation System**: No cohesive animation framework for user interactions

### Target Architecture

The new architecture follows a serverless, API-first approach:

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                    │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Framer    │  │   Tailwind   │  │  Supabase Auth   │    │
│  │  Motion    │  │   Design     │  │  (Client SDK)    │    │
│  └────────────┘  └──────────────┘  └──────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS API Gateway                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   /orders    │  │  /admin/*    │  │  /generate-url   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└────────┬──────────────────┬──────────────────┬──────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  Lambda:       │  │  Lambda:       │  │  Lambda:       │
│  Order Mgmt    │  │  Admin Ops     │  │  File Upload   │
└────────┬───────┘  └────────┬───────┘  └────────┬───────┘
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Database                       │
│  (Accessed via Service Key in Lambda Environment)           │
└─────────────────────────────────────────────────────────────┘
                                                  │
                                                  ▼
                                         ┌────────────────┐
                                         │   AWS S3       │
                                         │   (Uploads)    │
                                         └────────────────┘
```

## Architecture

### Backend Infrastructure (AWS SAM)

#### API Gateway Configuration

**Purpose**: Single entry point for all backend operations with CORS support

**Configuration**:
```yaml
ApiGateway:
  Type: AWS::Serverless::Api
  Properties:
    StageName: Prod
    Cors:
      AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
      AllowHeaders: "'Content-Type,Authorization,X-Amz-Date,X-Api-Key'"
      AllowOrigin: "'*'"  # Production: Replace with actual domain
    Auth:
      DefaultAuthorizer: JWTAuthorizer
      Authorizers:
        JWTAuthorizer:
          Type: JWT
          IdentitySource: $request.header.Authorization
          JwtConfiguration:
            Audience:
              - !Ref SupabaseProjectRef
            Issuer: !Sub 'https://${SupabaseUrl}/auth/v1'
```

**Endpoints**:
- `POST /orders` - Create new order
- `GET /admin/orders` - List all orders (admin only)
- `PUT /admin/orders/{id}` - Update order status (admin only)
- `POST /create-payment-intent` - Generate Stripe payment intent
- `POST /generate-upload-url` - Generate S3 presigned URL
- `POST /webhooks/stripe` - Handle Stripe webhooks

#### Lambda Functions

**Global Configuration**:
```yaml
Globals:
  Function:
    Timeout: 10
    MemorySize: 256
    Runtime: nodejs20.x
    Environment:
      Variables:
        SUPABASE_URL: !Ref SupabaseUrl
        SUPABASE_SERVICE_KEY: !Ref SupabaseServiceKey
        STRIPE_SECRET_KEY: !Ref StripeSecretKey
        S3_BUCKET_NAME: !Ref UploadsBucket
    Layers:
      - !Ref DependenciesLayer
```

**Shared Dependencies Layer**:
- `@supabase/supabase-js` - Database client
- `stripe` - Payment processing
- `@aws-sdk/client-s3` - S3 operations
- `@aws-sdk/s3-request-presigner` - Presigned URL generation

#### S3 Bucket Configuration

**Purpose**: Secure file storage with virus scanning

```yaml
UploadsBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: !Sub 'chartedart-uploads-${AWS::AccountId}'
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
    CorsConfiguration:
      CorsRules:
        - AllowedHeaders: ['*']
          AllowedMethods: [PUT, GET]
          AllowedOrigins: ['*']  # Production: Lock to domain
          MaxAge: 3000
    LifecycleConfiguration:
      Rules:
        - Id: DeleteUnscannedFiles
          Status: Enabled
          ExpirationInDays: 1
          TagFilters:
            - Key: scanned
              Value: 'false'
    NotificationConfiguration:
      LambdaConfigurations:
        - Event: s3:ObjectCreated:*
          Function: !GetAtt AntivirusScanFunction.Arn
```

### Frontend Architecture

#### Project Structure

```
src/
├── components/
│   ├── ui/              # Shadcn components with Framer Motion
│   ├── animations/      # Reusable animation variants
│   └── ProtectedRoute.tsx
├── contexts/
│   └── CartContext.tsx
├── layouts/
│   └── RootLayout.tsx   # AnimatePresence wrapper
├── lib/
│   ├── api/             # NEW: API client functions
│   ├── supabase/
│   │   └── client.ts    # Auth-only client
│   └── utils.ts
├── pages/
│   ├── auth/
│   ├── admin/
│   └── ...
├── types/
└── App.tsx              # Route definitions
```

#### New API Client Layer

**Purpose**: Centralize all backend API calls with proper error handling

**File**: `src/lib/api/client.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(response.status, error.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  orders: {
    create: (data: CreateOrderData) => 
      fetchAPI<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    list: () => 
      fetchAPI<Order[]>('/admin/orders'),
    update: (id: string, data: UpdateOrderData) =>
      fetchAPI<Order>(`/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  payments: {
    createIntent: (amount: number) =>
      fetchAPI<{ clientSecret: string }>('/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),
  },
  uploads: {
    generateUrl: (filename: string, contentType: string) =>
      fetchAPI<{ uploadUrl: string; fileKey: string }>('/generate-upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename, contentType }),
      }),
  },
};
```

## Components and Interfaces

### Lambda Handler Interfaces

#### 1. Order Management Handler

**File**: `backend/src/handlers/orders.js`

**Responsibilities**:
- Validate cart contents
- Calculate totals
- Create order records
- Clear user cart
- Send confirmation email

**Input Schema**:
```typescript
interface CreateOrderRequest {
  items: Array<{
    product_id: string;
    quantity: number;
    customization?: Record<string, any>;
  }>;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  payment_method: 'card' | 'cash';
  payment_intent_id?: string;
}
```

**Output Schema**:
```typescript
interface CreateOrderResponse {
  order_id: string;
  total: number;
  status: 'pending' | 'confirmed';
  created_at: string;
}
```

**Error Handling**:
- 400: Invalid cart items or missing required fields
- 401: Unauthorized (invalid JWT)
- 500: Database or external service errors

#### 2. Admin Operations Handler

**File**: `backend/src/handlers/admin-orders.js`

**Responsibilities**:
- List orders with filters
- Update order status
- Verify admin role from JWT claims

**Authorization**:
```javascript
async function verifyAdmin(event) {
  const token = event.headers.Authorization?.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}
```

#### 3. File Upload Handler

**File**: `backend/src/handlers/generate-upload-url.js`

**Responsibilities**:
- Generate presigned S3 URLs
- Validate file types and sizes
- Tag files for virus scanning

**Implementation**:
```javascript
const { S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  const { filename, contentType } = JSON.parse(event.body);
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(contentType)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid file type' }),
    };
  }

  const fileKey = `uploads/${Date.now()}-${filename}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
    Tagging: 'scanned=false',
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return {
    statusCode: 200,
    body: JSON.stringify({ uploadUrl, fileKey }),
  };
};
```

#### 4. Antivirus Scan Handler

**File**: `backend/src/handlers/antivirus-scan.js`

**Trigger**: S3 ObjectCreated event

**Responsibilities**:
- Scan uploaded files for malware
- Tag files as scanned
- Delete infected files
- Update database records

**Integration**: Uses ClamAV Lambda layer or AWS Marketplace solution

#### 5. Payment Intent Handler

**File**: `backend/src/handlers/create-payment-intent.js`

**Responsibilities**:
- Create Stripe payment intents
- Validate amounts
- Return client secret

**Implementation**:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { amount } = JSON.parse(event.body);
  
  if (!amount || amount < 50) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid amount' }),
    };
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
  };
};
```

### Frontend Component Updates

#### 1. Root Layout with AnimatePresence

**File**: `src/layouts/RootLayout.tsx`

**Changes**:
```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Outlet } from 'react-router-dom';

export default function RootLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-1"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
    </div>
  );
}
```

#### 2. Admin Orders Page Refactor

**File**: `src/pages/AdminOrdersPage.tsx`

**Before**:
```typescript
// Direct Supabase admin client usage (INSECURE)
const { data, error } = await supabaseAdmin
  .from('orders')
  .select('*, profiles(*), order_items(*, products(*))');
```

**After**:
```typescript
// Secure API call through Lambda
const orders = await api.orders.list();
```

#### 3. Create Page File Upload Refactor

**File**: `src/pages/CreatePage.tsx`

**Before**:
```typescript
// Direct Supabase storage upload
const { data, error } = await supabase.storage
  .from('uploads')
  .upload(filePath, file);
```

**After**:
```typescript
// Two-step secure upload
const { uploadUrl, fileKey } = await api.uploads.generateUrl(
  file.name,
  file.type
);

await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type },
});

// Store fileKey in database
```

#### 4. Checkout Page Refactor

**File**: `src/pages/CheckoutPage.tsx`

**Changes**:
- Replace direct Supabase order creation with `api.orders.create()`
- Update payment intent creation to use `api.payments.createIntent()`
- Add loading states with animations

## Data Models

### Database Schema (Unchanged)

The Supabase database schema remains the same. Only the access pattern changes:

**Before**: Client → Supabase (with service key exposed)
**After**: Client → API Gateway → Lambda → Supabase (service key secure)

### New Data Structures

#### API Response Envelope

```typescript
interface APIResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    request_id: string;
  };
}
```

#### File Upload Metadata

```typescript
interface UploadMetadata {
  file_key: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  uploaded_at: string;
  scanned: boolean;
  scan_result?: 'clean' | 'infected' | 'error';
  user_id: string;
}
```

## Error Handling

### Backend Error Strategy

**Lambda Error Response Format**:
```javascript
function errorResponse(statusCode, message, details = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      error: {
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    }),
  };
}
```

**Error Categories**:
- 400: Client errors (validation, malformed requests)
- 401: Authentication failures
- 403: Authorization failures (non-admin accessing admin routes)
- 404: Resource not found
- 500: Server errors (database, external services)
- 503: Service unavailable (rate limiting, maintenance)

### Frontend Error Handling

**API Client Error Handling**:
```typescript
try {
  const order = await api.orders.create(orderData);
  setStatus('success');
} catch (error) {
  if (error instanceof APIError) {
    if (error.status === 401) {
      // Redirect to login
      navigate('/auth/login');
    } else if (error.status === 400) {
      // Show validation errors
      setFormErrors(error.message);
    } else {
      // Generic error
      toast.error('Something went wrong. Please try again.');
    }
  }
  setStatus('error');
}
```

## Animation System Design

### Animation Variants Library

**File**: `src/components/animations/variants.ts`

```typescript
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeInOut' },
};

export const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2 },
};

export const buttonTap = {
  scale: 0.95,
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4 },
};

export const slideUp = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};
```

### Custom CSS Animations

**File**: `src/index.css` (additions)

```css
@keyframes shake-error {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes pulse-success {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-shake-error {
  animation: shake-error 0.5s ease-in-out;
}

.animate-pulse-success {
  animation: pulse-success 1s ease-in-out 2;
}

.animate-spin-slow {
  animation: spin-slow 2s linear infinite;
}
```

### Form State Animations

**Pattern for all forms**:

```typescript
type FormStatus = 'idle' | 'loading' | 'success' | 'error';

const [status, setStatus] = useState<FormStatus>('idle');

// In JSX
<motion.button
  type="submit"
  disabled={status === 'loading'}
  whileHover={status === 'idle' ? buttonHover : undefined}
  whileTap={status === 'idle' ? buttonTap : undefined}
  className={cn(
    'btn-primary',
    status === 'loading' && 'opacity-70 cursor-not-allowed'
  )}
>
  {status === 'loading' && <Spinner className="mr-2" />}
  {status === 'success' && <CheckIcon className="mr-2" />}
  Submit
</motion.button>

<motion.input
  className={cn(
    'input-base',
    status === 'error' && 'border-red-400 animate-shake-error'
  )}
  animate={status === 'error' ? { x: [0, -4, 4, -4, 4, 0] } : undefined}
/>
```

## Testing Strategy

### Backend Testing

**Unit Tests** (Jest):
- Lambda handler logic
- Authorization functions
- Data validation
- Error handling

**Integration Tests**:
- API Gateway → Lambda flow
- Lambda → Supabase interactions
- S3 upload and scanning workflow

**Test Structure**:
```
backend/
├── src/
│   ├── handlers/
│   └── utils/
└── tests/
    ├── unit/
    │   ├── handlers/
    │   └── utils/
    └── integration/
        └── api/
```

### Frontend Testing

**Component Tests** (Vitest + React Testing Library):
- API client functions
- Form submissions
- Error handling
- Animation triggers

**E2E Tests** (Playwright):
- Complete user flows
- Admin operations
- Payment processing
- File uploads

### Security Testing

**Automated Scans**:
- Dependency vulnerability scanning (npm audit)
- SAST (Static Application Security Testing)
- Secrets detection in commits

**Manual Testing**:
- JWT validation
- Admin authorization
- CORS configuration
- Rate limiting

## Deployment Strategy

### Environment Configuration

**Development**:
- Local SAM testing with `sam local start-api`
- Mock Stripe and S3 services
- Development Supabase project

**Staging**:
- Dedicated AWS account/region
- Staging Supabase project
- Stripe test mode
- Full CI/CD pipeline

**Production**:
- Production AWS account
- Production Supabase project
- Stripe live mode
- Blue-green deployment

### SAM Deployment Commands

```bash
# Build
sam build

# Deploy with guided prompts (first time)
sam deploy --guided

# Deploy with saved config
sam deploy

# Deploy to specific environment
sam deploy --config-env production
```

### Frontend Deployment

**Build Process**:
```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Output: dist/ directory
```

**Hosting Options**:
1. AWS S3 + CloudFront (recommended)
2. Netlify
3. Vercel

**Environment Variables** (injected at build time):
- `VITE_API_GATEWAY_URL` - API Gateway endpoint
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key (public)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (public)

### CI/CD Pipeline (AWS CodePipeline)

**Pipeline Stages**:

1. **Source**: GitHub repository webhook
2. **Build**: AWS CodeBuild
   - Run tests
   - Build frontend
   - Package SAM application
3. **Deploy**: AWS CodeDeploy
   - Deploy Lambda functions
   - Update API Gateway
   - Deploy frontend to S3/CloudFront

**buildspec.yml**:
```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
      - npm install
      - cd backend && npm install && cd ..
  
  pre_build:
    commands:
      - npm run lint
      - npm test
  
  build:
    commands:
      - npm run build
      - cd backend && sam build && cd ..
  
  post_build:
    commands:
      - cd backend && sam package --s3-bucket $DEPLOYMENT_BUCKET --output-template-file packaged.yaml

artifacts:
  files:
    - backend/packaged.yaml
    - dist/**/*
```

## Security Considerations

### Secrets Management

**Current Approach** (Phase 1): SAM Parameters
- Secrets passed as CloudFormation parameters
- Stored in Lambda environment variables
- Encrypted at rest

**Future Enhancement** (Phase 2): AWS Secrets Manager
- Centralized secret storage
- Automatic rotation
- Fine-grained access control

### API Security

**Rate Limiting**:
- API Gateway usage plans
- Per-user quotas
- Burst limits

**CORS Configuration**:
- Development: Allow all origins
- Production: Whitelist specific domains

**JWT Validation**:
- Verify signature with Supabase public key
- Check expiration
- Validate audience and issuer

### File Upload Security

**Validation Layers**:
1. Client-side: File type and size checks
2. Lambda: Content-Type validation
3. S3: Bucket policies
4. Antivirus: ClamAV scanning

**Quarantine Process**:
- Infected files moved to quarantine bucket
- Admin notification
- User notification
- Database record updated

## Migration Checklist

### Phase 0: Preparation
- [ ] Create feature branch
- [ ] Set up backend directory structure
- [ ] Create .env.example
- [ ] Install Framer Motion

### Phase 1: Security & Backend
- [ ] Delete admin-client.ts
- [ ] Create SAM template
- [ ] Implement Lambda handlers
- [ ] Set up S3 bucket
- [ ] Deploy to AWS

### Phase 2: Frontend Migration
- [ ] Create API client layer
- [ ] Refactor admin pages
- [ ] Refactor file uploads
- [ ] Refactor order creation
- [ ] Refactor payment processing

### Phase 3: UX/UI Overhaul
- [ ] Update Tailwind config
- [ ] Add custom animations to CSS
- [ ] Implement AnimatePresence
- [ ] Add button animations
- [ ] Add form state animations

### Phase 4: DevOps
- [ ] Create buildspec.yml
- [ ] Set up CodePipeline
- [ ] Configure staging environment
- [ ] Configure production environment
- [ ] Set up monitoring and alerts

## Monitoring and Observability

### CloudWatch Metrics

**Lambda Metrics**:
- Invocation count
- Error rate
- Duration
- Throttles

**API Gateway Metrics**:
- Request count
- 4xx/5xx errors
- Latency

**Custom Metrics**:
- Order creation success rate
- Payment processing success rate
- File upload success rate

### Logging Strategy

**Lambda Logs**:
```javascript
console.log(JSON.stringify({
  level: 'info',
  message: 'Order created',
  order_id: orderId,
  user_id: userId,
  timestamp: new Date().toISOString(),
}));
```

**Log Aggregation**:
- CloudWatch Logs Insights
- Custom dashboards
- Alerts on error patterns

### Alerting

**Critical Alerts**:
- Lambda error rate > 5%
- API Gateway 5xx rate > 1%
- Payment processing failures
- Antivirus scan failures

**Warning Alerts**:
- Lambda duration > 8s
- API Gateway latency > 2s
- S3 upload failures

## Performance Optimization

### Lambda Optimization

**Cold Start Mitigation**:
- Provisioned concurrency for critical functions
- Minimize dependencies
- Use Lambda layers for shared code

**Memory Allocation**:
- Start with 256MB
- Monitor and adjust based on metrics
- Balance cost vs. performance

### Frontend Optimization

**Code Splitting**:
```typescript
// Lazy load admin pages
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'));
const ArchivePage = lazy(() => import('./pages/ArchivePage'));
```

**Animation Performance**:
- Use `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly

**Bundle Optimization**:
- Tree shaking
- Minification
- Compression (gzip/brotli)

## Rollback Strategy

### Backend Rollback

**SAM Rollback**:
```bash
# Automatic rollback on deployment failure
sam deploy --no-fail-on-empty-changeset

# Manual rollback to previous version
aws cloudformation rollback-stack --stack-name chartedart-backend
```

**Database Rollback**:
- Supabase migrations are not affected
- No schema changes in this migration

### Frontend Rollback

**S3/CloudFront**:
- Keep previous build artifacts
- Update CloudFront distribution to point to previous version
- Invalidate cache

**Feature Flags**:
- Implement feature flags for gradual rollout
- Disable new features without redeployment

## Success Criteria

### Security
- ✅ No service keys in client bundle
- ✅ All admin operations require JWT validation
- ✅ File uploads go through presigned URLs
- ✅ Antivirus scanning on all uploads

### Functionality
- ✅ All existing features work identically
- ✅ No data loss during migration
- ✅ Payment processing success rate > 99%
- ✅ Order creation success rate > 99%

### Performance
- ✅ API response time < 500ms (p95)
- ✅ Page load time < 2s
- ✅ Animation frame rate > 60fps

### User Experience
- ✅ Smooth page transitions
- ✅ Interactive button feedback
- ✅ Clear loading and error states
- ✅ Consistent design system
