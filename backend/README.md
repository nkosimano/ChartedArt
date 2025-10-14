# ChartedArt Backend

Serverless backend for ChartedArt built with AWS SAM (Serverless Application Model).

## Architecture

- **API Gateway**: REST API with JWT authentication
- **Lambda Functions**: Node.js 20 serverless functions
- **S3**: File storage with presigned URLs
- **Supabase**: PostgreSQL database
- **Stripe**: Payment processing

## Prerequisites

1. **AWS CLI**: [Install AWS CLI](https://aws.amazon.com/cli/)
2. **AWS SAM CLI**: [Install SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
3. **Node.js 20+**: [Install Node.js](https://nodejs.org/)
4. **AWS Account**: With appropriate permissions

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure AWS Credentials

```bash
aws configure
```

### 3. Build the Application

```bash
sam build
```

### 4. Deploy to AWS

First deployment (guided):
```bash
sam deploy --guided
```

You'll be prompted for:
- Stack name: `chartedart-backend-dev`
- AWS Region: `us-east-1` (or your preferred region)
- SupabaseUrl: Your Supabase project URL
- SupabaseServiceKey: Your Supabase service role key
- StripeSecretKey: Your Stripe secret key
- Environment: `dev`, `staging`, or `production`

Subsequent deployments:
```bash
sam deploy
```

### 5. Get API Gateway URL

After deployment, the API Gateway URL will be displayed in the outputs:
```
Outputs:
  ApiGatewayUrl: https://xxxxx.execute-api.us-east-1.amazonaws.com/Prod
```

Copy this URL and add it to your frontend `.env` file:
```
VITE_API_GATEWAY_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/Prod
```

## Local Development

### Test Lambda Functions Locally

```bash
sam local start-api
```

This starts a local API Gateway at `http://localhost:3000`

### Invoke a Specific Function

```bash
sam local invoke FunctionName -e events/event.json
```

## Project Structure

```
backend/
├── src/
│   ├── handlers/          # Lambda function handlers
│   │   ├── get-orders.js
│   │   ├── create-order.js
│   │   └── ...
│   └── utils/             # Shared utilities
│       ├── auth.js
│       ├── email.js
│       └── ...
├── template.yaml          # SAM infrastructure definition
├── package.json           # Node.js dependencies
└── README.md             # This file
```

## Environment Variables

Lambda functions have access to these environment variables:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key (admin access)
- `STRIPE_SECRET_KEY`: Stripe secret key
- `S3_BUCKET_NAME`: S3 bucket for file uploads
- `NODE_ENV`: Environment (production)

## API Endpoints

### Public Endpoints
- `POST /orders` - Create new order
- `POST /create-payment-intent` - Create Stripe payment intent
- `POST /generate-upload-url` - Get presigned S3 URL

### Admin Endpoints (Requires JWT + Admin Role)
- `GET /admin/orders` - List all orders
- `PUT /admin/orders/{id}` - Update order status
- `PUT /admin/orders/{id}/archive` - Archive order
- `PUT /admin/orders/{id}/unarchive` - Unarchive order
- `POST /admin/orders/{id}/refund` - Refund payment

### Webhook Endpoints
- `POST /webhooks/stripe` - Stripe webhook handler

## Monitoring

### CloudWatch Logs

View logs for a specific function:
```bash
sam logs -n FunctionName --tail
```

### CloudWatch Metrics

- Lambda invocations, errors, duration
- API Gateway requests, 4xx/5xx errors, latency
- Custom metrics for business logic

## Troubleshooting

### Build Errors

```bash
# Clean build artifacts
rm -rf .aws-sam

# Rebuild
sam build
```

### Deployment Errors

```bash
# Validate template
sam validate

# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name chartedart-backend-dev
```

### Permission Errors

Ensure your IAM user/role has these permissions:
- CloudFormation
- Lambda
- API Gateway
- S3
- IAM (for creating execution roles)
- CloudWatch Logs

## Security Best Practices

1. **Never commit secrets**: Use SAM parameters or AWS Secrets Manager
2. **Enable MFA**: For AWS account and admin users
3. **Use least privilege**: IAM roles with minimal permissions
4. **Enable CloudTrail**: Audit all API calls
5. **Rotate keys**: Regularly rotate Supabase and Stripe keys
6. **Monitor logs**: Set up CloudWatch alarms for errors

## Cleanup

To delete all AWS resources:
```bash
sam delete
```

## Support

For issues or questions, contact the ChartedArt development team.
