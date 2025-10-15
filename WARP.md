# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

Monorepo with three apps:
- Web frontend (React + TypeScript + Vite) at repository root.
- Mobile app (React Native + Expo + TypeScript) in `mobile/`.
- Serverless backend (AWS SAM, API Gateway, Lambda, S3, Supabase, Stripe) in `backend/`.

Authentication is via Supabase. Clients attach the Supabase JWT to backend requests. Media uploads use S3 presigned URLs. Payments use Stripe (publishable key on clients; secret key in backend).

## Common commands

- Install dependencies
  ```bash path=null start=null
  # root web
  npm install

  # mobile app
  cd mobile && npm install

  # backend
  cd backend && npm install
  ```

### Web (Vite React)
- Dev server (localhost:3000 per `vite.config.ts`)
  ```bash path=null start=null
  npm run dev
  ```
- Build / preview
  ```bash path=null start=null
  npm run build
  npm run preview
  ```
- Lint
  ```bash path=null start=null
  npm run lint
  ```
- Type-check (no script)
  ```bash path=null start=null
  npx tsc --noEmit
  ```

### Mobile (Expo)
- Start Metro / run on platforms
  ```bash path=null start=null
  cd mobile
  npm start           # press i for iOS, a for Android, w for web
  npm run android     # or: npm run ios, npm run web
  ```
- Lint / type-check
  ```bash path=null start=null
  npm run lint
  npm run type-check
  ```
- Tests (Jest via jest-expo)
  ```bash path=null start=null
  npm test            # run all tests
  npm test -- -t "LoginScreen"                # by name pattern
  npm test -- src/screens/auth/LoginScreen.tsx # single file
  ```
- EAS builds
  ```bash path=null start=null
  npm run build:dev       # development client build
  npm run build:preview   # internal distribution build
  npm run build:prod      # production build
  npm run build:status    # list recent builds
  npm run submit          # submit to stores
  ```

### Backend (AWS SAM)
- Prereqs: AWS CLI, SAM CLI, Node 20.
- Build / deploy
  ```bash path=null start=null
  cd backend
  sam build
  sam deploy --guided     # first time; subsequent: sam deploy
  ```
- Local API
  ```bash path=null start=null
  sam local start-api     # serves on http://127.0.0.1:3000 by default
  ```
- Invoke a single Lambda locally
  ```bash path=null start=null
  sam local invoke CreateOrderFunction -e events/event.json
  ```
- Tail logs
  ```bash path=null start=null
  sam logs -n CreateOrderFunction --tail
  ```

## Environment configuration
- Root web app uses Vite envs (see `.env.example`):
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - `VITE_STRIPE_PUBLISHABLE_KEY`
  - `VITE_API_GATEWAY_URL`
- Mobile envs (create `mobile/.env`, see mobile README):
  - `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Backend secrets are parameters to SAM (see `backend/.env.backend.example` and `backend/README.md`):
  - `SupabaseUrl`, `SupabaseServiceKey` (NoEcho), `StripeSecretKey`, etc.

## High-level architecture
- Frontend (root)
  - Routing with React Router (`src/main.tsx`, `src/App.tsx`, `src/pages/*`).
  - Supabase client (`src/lib/supabase/client.ts`); Stripe setup (`src/lib/stripe.ts`).
  - API client (`src/lib/api/client.ts`) attaches Supabase JWT, retries transient errors, exposes endpoints: orders, payments (create intent), uploads (presigned URL + direct PUT to S3).
  - State via `CartContext`.
- Mobile (`mobile/`)
  - Expo RN app with screens under `src/screens/*`, navigation in `src/navigation/*`, auth context in `src/contexts/AuthContext.tsx`.
  - Supabase auth and API client in `src/lib/*`; Jest setup in `mobile/jest.setup.ts`.
  - EAS build profiles in `mobile/eas.json`; app config in `mobile/app.json`.
- Backend (`backend/`)
  - SAM template (`template.yaml`) provisions:
    - API Gateway with JWT authorizer (Supabase issuer), throttling, CORS.
    - Lambda functions: `generate-upload-url`, `create-order`, `create-payment-intent`, admin `get-orders` and `update-order-status`.
    - S3 bucket for uploads with encryption, lifecycle, versioning; optional antivirus scan trigger.
  - Handlers in `backend/src/handlers/*.js`; shared utils in `backend/src/utils/*`.

## Important notes
- Resolve merge conflicts in backend before building/deploying:
  - `backend/package.json` and `backend/template.yaml` contain conflict markers (`<<<<<<< HEAD`).
- Web dev server port is 3000 (configurable in `vite.config.ts`).
- Tests: configured for mobile only; web/backend do not define test scripts.
