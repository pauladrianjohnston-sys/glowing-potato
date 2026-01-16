# Pharmacy Fulfillment App - Quick Start Guide

## Overview

This guide will help you get started with implementing the pharmacy script fulfillment application. For detailed planning, see [PHARMACY_FULFILLMENT_PLAN.md](./PHARMACY_FULFILLMENT_PLAN.md).

## What We're Building

A comprehensive pharmacy prescription management system similar to Direct Chemist Outlet Australia, featuring:

- **Patient Portal**: Order prescriptions, track medications, get reminders
- **Pharmacist Dashboard**: Process orders, manage inventory, verify prescriptions
- **Admin Portal**: Multi-pharmacy management, analytics, system configuration
- **Electronic Prescriptions**: Integration with Australia's NPDS and Active Script List

## Technology Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS (already set up)
- **Backend**: Next.js API Routes + PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js
- **Payment**: Stripe
- **Notifications**: SendGrid (email) + Twilio (SMS)
- **Queue**: BullMQ + Redis

## Immediate Next Steps

### Step 1: Install Core Dependencies

```bash
npm install @prisma/client next-auth zustand react-hook-form zod @tanstack/react-query date-fns
npm install -D prisma
```

### Step 2: Set Up Database

```bash
# Initialize Prisma
npx prisma init

# Copy the schema from PHARMACY_FULFILLMENT_PLAN.md to prisma/schema.prisma
# Update .env with your database URL

# Create and run migrations
npx prisma migrate dev --name init
```

### Step 3: Configure Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pharmacy_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"

# Email (SendGrid)
SENDGRID_API_KEY="your-key-here"
FROM_EMAIL="noreply@yourpharmacy.com"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="your-sid-here"
TWILIO_AUTH_TOKEN="your-token-here"
TWILIO_PHONE_NUMBER="+61..."

# Payment (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# File Upload (AWS S3 or Cloudinary)
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="ap-southeast-2"
AWS_BUCKET_NAME="pharmacy-prescriptions"
```

### Step 4: Set Up Authentication

Create `lib/auth.ts` for NextAuth.js configuration with roles:
- PATIENT
- PHARMACIST
- PHARMACY_TECH
- PHARMACY_ADMIN
- SYSTEM_ADMIN

### Step 5: Create Base Layout Structure

Update the app directory structure:

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (patient)/
│   └── dashboard/page.tsx
├── (pharmacist)/
│   └── dashboard/page.tsx
└── api/
    └── auth/[...nextauth]/route.ts
```

## Implementation Phases

### Phase 1: Foundation (Current Priority)
1. Set up Prisma and database schema
2. Implement authentication (NextAuth.js)
3. Create basic page layouts for patient/pharmacist
4. Build core API endpoints

### Phase 2: Prescription Management
1. Prescription listing and detail views
2. Order creation flow
3. Pharmacist order queue
4. Basic email notifications

### Phase 3: Payment & Delivery
1. Stripe integration
2. Address management
3. Delivery options

### Phase 4-8: Advanced Features
See full plan in PHARMACY_FULFILLMENT_PLAN.md

## Key Files to Reference

- `PHARMACY_FULFILLMENT_PLAN.md` - Complete implementation plan
- Database schema is in the plan document (copy to `prisma/schema.prisma`)
- User workflows and features documented in detail

## Development Workflow

1. **Database First**: Set up Prisma schema and run migrations
2. **API Routes**: Create Next.js API routes for each feature
3. **UI Components**: Build reusable components
4. **Pages**: Assemble components into pages
5. **Test**: Test each feature thoroughly
6. **Iterate**: Refine based on testing

## Important Considerations

### Australian Compliance
- Electronic prescriptions require NPDS integration
- Must comply with Australian Privacy Principles
- PBS integration for subsidized medications
- Active Script List (ASL) synchronization

### Security
- All health data must be encrypted
- HTTPS only in production
- Audit logs for prescription access
- Role-based access control (RBAC)

### Performance
- Use React Query for data fetching
- Implement caching with Redis
- Optimize database queries with indexes
- Background jobs for notifications

## Testing Strategy

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

## Useful Commands

```bash
# Development
npm run dev

# Database
npx prisma studio          # Open database GUI
npx prisma generate        # Generate Prisma client
npx prisma migrate dev     # Run migrations
npx prisma db seed         # Seed database

# Build
npm run build
npm start
```

## Getting Help

- Review the detailed plan: `PHARMACY_FULFILLMENT_PLAN.md`
- Check Prisma docs: https://www.prisma.io/docs
- NextAuth.js docs: https://next-auth.js.org
- Australian Digital Health Agency: https://www.digitalhealth.gov.au

## Project Timeline

Estimated: 18-20 weeks for MVP

- Weeks 1-3: Foundation
- Weeks 4-6: Prescription management
- Weeks 7-8: Payment & delivery
- Weeks 9-11: Enhanced features
- Weeks 12-14: Electronic prescriptions
- Weeks 15-16: Analytics & admin
- Weeks 17-18: PBS integration & testing
- Weeks 19-20: Beta launch

## Contact & Support

For questions about this implementation plan, refer to the detailed documentation in PHARMACY_FULFILLMENT_PLAN.md.
