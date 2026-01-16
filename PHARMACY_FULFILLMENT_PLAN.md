# Pharmacy Script Fulfillment System - Implementation Plan

## Executive Summary

This document outlines the comprehensive plan for developing a pharmacy script fulfillment application similar to Direct Chemist Outlet Australia's system, which uses MedAdvisor as their prescription management platform. The system will handle the complete prescription lifecycle from order submission to dispensing and delivery.

## Research Findings

### Direct Chemist Outlet System
- **Technology Provider**: MedAdvisor platform
- **Network**: 65+ pharmacies across Australia
- **Core Capability**: Digital prescription ordering, tracking, and fulfillment
- **Key Differentiator**: Mobile-first approach with automated medication management

### Australian Regulatory Requirements
- **Electronic Prescribing Conformance Scheme**: All software must comply with standards maintained by Australian Digital Health Agency
- **National Prescription Delivery Service (NPDS)**: Secure infrastructure for storing and transmitting electronic prescriptions
- **Active Script List (ASL)**: Digital record of patient's electronic and paper prescriptions
- **PBS Claims**: Pharmaceutical Benefits Scheme integration for subsidized medications

## System Architecture

### Technology Stack

#### Frontend
- **Framework**: Next.js 15 (already in place)
- **Language**: TypeScript
- **UI Library**: React 19 with Tailwind CSS
- **State Management**: React Context API + Zustand for complex state
- **Forms**: React Hook Form with Zod validation
- **Icons**: lucide-react (already in place)
- **Date/Time**: date-fns
- **Charts**: Recharts (for pharmacy analytics)

#### Backend
- **API**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with multi-role support
- **File Storage**: AWS S3 or Cloudinary (for prescription images, documents)
- **Queue System**: BullMQ with Redis (for async tasks)
- **Email/SMS**: SendGrid + Twilio

#### External Integrations
- **Electronic Prescribing**: NPDS integration (requires certification)
- **Active Script List**: ASL API integration
- **PBS Claims**: Medicare Australia API
- **Payment Processing**: Stripe or Square
- **Pharmacy Management Systems**: HL7 FHIR standard for interoperability

### Database Schema

```prisma
// User & Authentication
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  phone         String?
  firstName     String
  lastName      String
  dateOfBirth   DateTime
  medicareNumber String?
  role          Role      @default(PATIENT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  patients      Patient[]
  prescriptions Prescription[]
  orders        Order[]
}

enum Role {
  PATIENT
  PHARMACIST
  PHARMACY_TECH
  PHARMACY_ADMIN
  DOCTOR
  SYSTEM_ADMIN
}

// Patient Profile
model Patient {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  medicareNumber  String?
  medicareExpiry  DateTime?
  allergies       String[]
  conditions      String[]
  preferredPharmacy String?

  medications     Medication[]
  prescriptions   Prescription[]
  orders          Order[]
}

// Prescription Management
model Prescription {
  id                String    @id @default(uuid())
  prescriptionNumber String   @unique
  electronicToken   String?   @unique // eScript token
  patientId         String
  patient           Patient   @relation(fields: [patientId], references: [id])
  prescriberId      String
  prescriber        User      @relation(fields: [prescriberId], references: [id])

  medicationName    String
  medicationCode    String    // PBS code or generic code
  strength          String
  form              String    // tablet, capsule, liquid, etc.
  quantity          Int
  repeatsAuthorized Int
  repeatsRemaining  Int

  dosageInstructions String
  prescribedDate    DateTime
  expiryDate        DateTime

  status            PrescriptionStatus @default(ACTIVE)
  pbsEligible       Boolean   @default(false)

  orders            Order[]
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

enum PrescriptionStatus {
  ACTIVE
  PARTIALLY_FILLED
  FILLED
  EXPIRED
  CANCELLED
}

// Medication Tracking
model Medication {
  id                String    @id @default(uuid())
  patientId         String
  patient           Patient   @relation(fields: [patientId], references: [id])

  name              String
  strength          String
  form              String
  dosageInstructions String
  prescriptionId    String?

  reminderEnabled   Boolean   @default(false)
  reminderTimes     DateTime[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

// Order Management
model Order {
  id                String    @id @default(uuid())
  orderNumber       String    @unique
  patientId         String
  patient           Patient   @relation(fields: [patientId], references: [id])
  userId            String
  user              User      @relation(fields: [userId], references: [id])

  prescriptionId    String
  prescription      Prescription @relation(fields: [prescriptionId], references: [id])

  pharmacyId        String
  pharmacy          Pharmacy  @relation(fields: [pharmacyId], references: [id])

  orderType         OrderType
  status            OrderStatus @default(PENDING)

  // Fulfillment details
  assignedPharmacistId String?
  assignedPharmacist User?   @relation("AssignedOrders", fields: [assignedPharmacistId], references: [id])

  // Payment
  totalAmount       Decimal
  paidAmount        Decimal   @default(0)
  paymentStatus     PaymentStatus @default(PENDING)
  paymentMethod     String?

  // Delivery
  deliveryAddress   String?
  deliveryInstructions String?
  estimatedReadyTime DateTime?
  actualReadyTime    DateTime?

  notes             String?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  orderItems        OrderItem[]
  timeline          OrderTimeline[]
}

enum OrderType {
  PICKUP
  DELIVERY
}

enum OrderStatus {
  PENDING
  RECEIVED
  PROCESSING
  READY_FOR_PICKUP
  OUT_FOR_DELIVERY
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
  FAILED
}

model OrderItem {
  id                String    @id @default(uuid())
  orderId           String
  order             Order     @relation(fields: [orderId], references: [id])

  medicationName    String
  quantity          Int
  unitPrice         Decimal
  totalPrice        Decimal
  pbsSubsidy        Decimal   @default(0)

  createdAt         DateTime  @default(now())
}

// Order Timeline Tracking
model OrderTimeline {
  id                String    @id @default(uuid())
  orderId           String
  order             Order     @relation(fields: [orderId], references: [id])

  status            OrderStatus
  notes             String?
  createdBy         String    // User ID who made the change
  createdAt         DateTime  @default(now())
}

// Pharmacy Management
model Pharmacy {
  id                String    @id @default(uuid())
  name              String
  phone             String
  email             String

  address           String
  suburb            String
  state             String
  postcode          String

  openingHours      Json      // Store as JSON object

  isActive          Boolean   @default(true)

  orders            Order[]
  inventory         Inventory[]
  staff             PharmacyStaff[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model PharmacyStaff {
  id                String    @id @default(uuid())
  pharmacyId        String
  pharmacy          Pharmacy  @relation(fields: [pharmacyId], references: [id])
  userId            String

  role              Role
  isActive          Boolean   @default(true)

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([pharmacyId, userId])
}

// Inventory Management
model Inventory {
  id                String    @id @default(uuid())
  pharmacyId        String
  pharmacy          Pharmacy  @relation(fields: [pharmacyId], references: [id])

  medicationCode    String
  medicationName    String
  strength          String
  form              String

  currentStock      Int
  minimumStock      Int
  maximumStock      Int

  unitCost          Decimal
  sellingPrice      Decimal

  expiryDate        DateTime
  batchNumber       String?

  lastRestocked     DateTime?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([pharmacyId, medicationCode, batchNumber])
}
```

## Core Features

### 1. Patient Portal

#### 1.1 Registration & Profile Management
- Account creation with email/phone verification
- Medicare number validation and linking
- Multi-family member support (manage prescriptions for dependents)
- Medical profile (allergies, conditions, current medications)
- Preferred pharmacy selection

#### 1.2 Prescription Management
- **Electronic Script (eScript) Integration**
  - QR code scanning from doctor
  - Token-based prescription retrieval from NPDS
  - Active Script List (ASL) synchronization

- **Prescription Display**
  - List of active prescriptions with details
  - Repeat tracking (show remaining repeats)
  - Expiry date alerts
  - Dosage instructions
  - Visual medication images

- **Order Prescriptions**
  - Tap-to-Refill for repeat prescriptions
  - Single or bulk ordering
  - Upload physical prescription images
  - Select pickup or delivery

#### 1.3 Medication Reminders
- Customizable reminder schedule
- Push notifications and SMS alerts
- Refill reminders based on supply duration
- Doctor appointment reminders

#### 1.4 Order Tracking
- Real-time order status updates
- Estimated ready time
- Push notifications for status changes
- Order history

#### 1.5 Payment & Delivery
- In-app payment processing
- PBS co-payment calculation
- Save payment methods
- Delivery address management
- Delivery tracking

### 2. Pharmacist Dashboard

#### 2.1 Order Queue Management
- **Incoming Orders**
  - Real-time order notifications
  - Priority queue (urgent vs. standard)
  - Order assignment to pharmacy staff

- **Workflow Stages**
  - Received → Processing → Verification → Ready
  - Color-coded status indicators
  - Estimated completion times

#### 2.2 Prescription Verification
- Display electronic prescription details
- Check patient profile and medication history
- Drug interaction checking
- Allergy verification
- PBS eligibility validation
- Clinical notes and flags

#### 2.3 Dispensing
- Barcode scanning for medication verification
- Stock level checking and allocation
- Label printing
- Packaging instructions
- Quality assurance checklist

#### 2.4 Patient Communication
- SMS/email notifications
- Call patient for clarifications
- Medication counseling notes
- Refusal reasons tracking

### 3. Pharmacy Admin Portal

#### 3.1 Inventory Management
- Stock level monitoring
- Low stock alerts
- Automatic reorder triggers
- Expiry date tracking
- Batch management
- Stock take functionality

#### 3.2 Staff Management
- User roles and permissions
- Shift scheduling
- Performance metrics
- Task assignment

#### 3.3 Analytics & Reporting
- Daily/weekly/monthly order volumes
- Average fulfillment times
- Revenue reports
- PBS claims summary
- Inventory turnover
- Patient acquisition metrics

#### 3.4 Configuration
- Pharmacy details and hours
- Service areas for delivery
- Pricing rules
- Notification templates

### 4. System Admin

#### 4.1 Multi-Pharmacy Management
- Pharmacy network overview
- Performance comparison
- System-wide analytics

#### 4.2 User Management
- Account administration
- Role management
- Access control

#### 4.3 Integration Management
- NPDS connection status
- ASL synchronization
- PBS claims processing
- Third-party API monitoring

## User Workflows

### Patient Workflow: New Prescription

```
1. Patient receives eScript from doctor (QR code/SMS token)
2. Patient opens app and scans QR code or enters token
3. System retrieves prescription from NPDS
4. Prescription appears in patient's medication list
5. Patient clicks "Order" → Tap-to-Refill
6. Selects delivery or pickup
7. Reviews order and confirms
8. Makes payment
9. Receives confirmation with estimated ready time
10. Gets notifications as order progresses
11. Picks up or receives delivery
```

### Pharmacist Workflow: Fulfill Order

```
1. Pharmacist receives order notification
2. Reviews prescription details and patient profile
3. Checks for drug interactions and contraindications
4. Verifies stock availability
5. Prepares medication:
   - Counts/measures medication
   - Scans barcode for verification
   - Prints label
   - Packages medication
6. Conducts quality check (second pharmacist if required)
7. Updates order status to "Ready for Pickup" / "Out for Delivery"
8. Patient notification sent
9. Dispenses to patient (pickup) or hands to courier (delivery)
10. Records completion in PBS claims system
```

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
**Goal**: Set up core infrastructure and basic functionality

#### Tasks:
1. **Project Setup**
   - Initialize database with Prisma
   - Set up authentication with NextAuth.js
   - Configure environment variables
   - Set up development, staging, production environments

2. **Core Models & APIs**
   - User registration and authentication
   - Patient profile management
   - Basic prescription model (manual entry)
   - Pharmacy model and configuration

3. **Basic UI Components**
   - Design system setup
   - Authentication pages (login, register)
   - Patient dashboard layout
   - Pharmacist dashboard layout

**Deliverables**:
- Working authentication system
- Basic patient registration flow
- Database schema implemented
- Core API endpoints

### Phase 2: Prescription Management (Weeks 4-6)
**Goal**: Implement prescription tracking and ordering

#### Tasks:
1. **Prescription Features**
   - Prescription listing and detail views
   - Manual prescription upload (image)
   - Repeat tracking
   - Prescription expiry management

2. **Order System**
   - Order creation flow
   - Order status management
   - Order history
   - Basic notification system (email)

3. **Pharmacist Order Queue**
   - Order list view
   - Order filtering and sorting
   - Order detail view
   - Status update workflow

**Deliverables**:
- Patients can view and manage prescriptions
- Patients can place orders
- Pharmacists can view and process orders
- Email notifications working

### Phase 3: Payment & Delivery (Weeks 7-8)
**Goal**: Implement payment processing and delivery options

#### Tasks:
1. **Payment Integration**
   - Stripe/Square integration
   - Payment flow (checkout)
   - PBS co-payment calculation
   - Payment history
   - Refund processing

2. **Delivery Management**
   - Address management
   - Delivery zone configuration
   - Delivery fee calculation
   - Delivery tracking (basic)

**Deliverables**:
- End-to-end payment processing
- Pickup and delivery options working
- Receipt generation

### Phase 4: Enhanced Features (Weeks 9-11)
**Goal**: Add medication reminders, inventory, and advanced features

#### Tasks:
1. **Medication Reminders**
   - Reminder configuration
   - Push notification setup
   - SMS integration (Twilio)
   - Reminder scheduling system

2. **Inventory Management**
   - Stock tracking
   - Low stock alerts
   - Stock allocation for orders
   - Basic reorder system

3. **Multi-Family Support**
   - Link family members
   - Manage dependents' prescriptions
   - Permission system

4. **Enhanced Notifications**
   - SMS notifications
   - Push notifications
   - Notification preferences

**Deliverables**:
- Working reminder system
- Inventory tracking functional
- Family member management
- Multi-channel notifications

### Phase 5: Electronic Prescriptions (Weeks 12-14)
**Goal**: Integrate with NPDS and Active Script List

#### Tasks:
1. **NPDS Integration**
   - Register with Australian Digital Health Agency
   - Obtain conformance certification
   - Implement eScript token retrieval
   - QR code scanning

2. **Active Script List**
   - ASL API integration
   - Sync patient prescriptions
   - Automatic prescription updates

3. **Testing & Compliance**
   - Test with NPDS sandbox
   - Security audit
   - Privacy compliance (Australian Privacy Principles)
   - Data encryption

**Deliverables**:
- Electronic prescription retrieval working
- ASL synchronization
- Regulatory compliance documentation

### Phase 6: Analytics & Admin Tools (Weeks 15-16)
**Goal**: Build reporting and administration features

#### Tasks:
1. **Pharmacy Analytics**
   - Dashboard with key metrics
   - Order volume reports
   - Revenue reports
   - Fulfillment time analysis
   - Inventory reports

2. **System Administration**
   - Multi-pharmacy management
   - User management tools
   - System configuration
   - Audit logs

3. **Performance Optimization**
   - Database query optimization
   - Caching strategy (Redis)
   - API response time optimization
   - Frontend performance tuning

**Deliverables**:
- Comprehensive analytics dashboard
- Admin tools for system management
- Optimized performance

### Phase 7: PBS Integration & Testing (Weeks 17-18)
**Goal**: Integrate PBS claims and conduct comprehensive testing

#### Tasks:
1. **PBS Claims**
   - Medicare Australia API integration
   - PBS eligibility checking
   - Automated claims submission
   - Claims reconciliation

2. **Comprehensive Testing**
   - End-to-end testing
   - User acceptance testing
   - Security testing
   - Performance testing
   - Mobile responsiveness testing

3. **Documentation**
   - User documentation
   - API documentation
   - Deployment documentation
   - Training materials

**Deliverables**:
- PBS claims processing working
- All features tested and stable
- Complete documentation

### Phase 8: Beta Launch & Refinement (Weeks 19-20)
**Goal**: Soft launch with select pharmacies and iterate based on feedback

#### Tasks:
1. **Beta Launch**
   - Deploy to production
   - Onboard 2-3 pilot pharmacies
   - Onboard initial patients

2. **Monitoring & Support**
   - Set up application monitoring (Sentry, LogRocket)
   - Establish support channels
   - Monitor system performance
   - Collect user feedback

3. **Iteration**
   - Bug fixes
   - UX improvements
   - Performance optimization
   - Feature refinements

**Deliverables**:
- Production system live
- Initial users onboarded
- Feedback collected and prioritized

## Technical Considerations

### Security & Compliance

1. **Data Protection**
   - End-to-end encryption for sensitive data
   - HTTPS everywhere
   - Secure credential storage (hashed passwords)
   - Token-based authentication (JWT)

2. **Privacy Compliance**
   - Australian Privacy Principles (APPs)
   - Consent management
   - Data retention policies
   - Right to access and deletion

3. **Healthcare Compliance**
   - NPDS conformance
   - PBS requirements
   - Pharmacy regulations (state-specific)
   - Controlled substances tracking

4. **Audit & Logging**
   - Comprehensive audit trails
   - Access logs
   - Prescription access tracking
   - Change history for all critical data

### Performance & Scalability

1. **Database Optimization**
   - Indexed queries
   - Connection pooling
   - Read replicas for reporting
   - Partition large tables

2. **Caching Strategy**
   - Redis for session data
   - API response caching
   - Static asset CDN
   - Database query caching

3. **Async Processing**
   - Queue system for long-running tasks
   - Background jobs for notifications
   - Scheduled tasks (reminders, reports)

4. **Monitoring**
   - Application performance monitoring
   - Error tracking
   - Uptime monitoring
   - Database performance monitoring

### Testing Strategy

1. **Unit Tests**
   - API endpoint testing
   - Business logic testing
   - Utility function testing

2. **Integration Tests**
   - End-to-end workflows
   - External API integration
   - Database operations

3. **E2E Tests**
   - Critical user journeys
   - Cross-browser testing
   - Mobile responsiveness

## File Structure

```
/home/user/glowing-potato/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (patient)/
│   │   ├── dashboard/
│   │   ├── prescriptions/
│   │   ├── medications/
│   │   ├── orders/
│   │   └── profile/
│   ├── (pharmacist)/
│   │   ├── dashboard/
│   │   ├── orders/
│   │   ├── queue/
│   │   └── inventory/
│   ├── (admin)/
│   │   ├── dashboard/
│   │   ├── pharmacies/
│   │   ├── users/
│   │   └── reports/
│   ├── api/
│   │   ├── auth/
│   │   ├── prescriptions/
│   │   ├── orders/
│   │   ├── patients/
│   │   ├── pharmacies/
│   │   ├── inventory/
│   │   ├── notifications/
│   │   └── integrations/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/              # Reusable UI components
│   ├── patient/         # Patient-specific components
│   ├── pharmacist/      # Pharmacist-specific components
│   ├── admin/           # Admin-specific components
│   └── shared/          # Shared business components
├── lib/
│   ├── prisma.ts        # Prisma client
│   ├── auth.ts          # Auth configuration
│   ├── api/             # API client functions
│   ├── utils/           # Utility functions
│   └── validations/     # Zod schemas
├── hooks/               # Custom React hooks
├── contexts/            # React contexts
├── types/               # TypeScript types
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                # Documentation
├── scripts/             # Build and deployment scripts
└── config/              # Configuration files
```

## Key Dependencies to Add

```json
{
  "dependencies": {
    "@prisma/client": "^5.x",
    "next-auth": "^4.x",
    "zustand": "^4.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@tanstack/react-query": "^5.x",
    "date-fns": "^3.x",
    "recharts": "^2.x",
    "stripe": "^14.x",
    "twilio": "^4.x",
    "@sendgrid/mail": "^7.x",
    "qrcode.react": "^3.x",
    "html5-qrcode": "^2.x",
    "aws-sdk": "^2.x",
    "bullmq": "^5.x",
    "ioredis": "^5.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "@testing-library/react": "^14.x",
    "@testing-library/jest-dom": "^6.x",
    "cypress": "^13.x"
  }
}
```

## Success Metrics

### Patient Metrics
- User registration rate
- Prescription ordering rate
- Repeat order rate
- Average time from prescription to order
- Patient satisfaction (NPS score)

### Pharmacy Metrics
- Average fulfillment time
- Orders per day per pharmacy
- Order completion rate
- Error rate (rejected/cancelled orders)
- Inventory accuracy

### System Metrics
- System uptime (target: 99.9%)
- API response time (target: <200ms)
- Error rate (target: <0.1%)
- Mobile app crash rate

## Risks & Mitigations

### Risk 1: Regulatory Compliance
- **Mitigation**: Engage healthcare compliance consultant early, continuous legal review

### Risk 2: NPDS Integration Complexity
- **Mitigation**: Start integration early, allocate buffer time, have fallback to manual entry

### Risk 3: Data Security Breach
- **Mitigation**: Security audits, penetration testing, insurance, incident response plan

### Risk 4: Pharmacy Adoption
- **Mitigation**: Simple onboarding, training materials, dedicated support, pilot program

### Risk 5: Performance at Scale
- **Mitigation**: Load testing, scalable architecture, performance monitoring, optimization sprints

## Next Steps

1. **Stakeholder Review**: Present this plan to stakeholders for feedback
2. **Team Formation**: Assemble development team (2-3 developers, 1 designer, 1 PM)
3. **Environment Setup**: Set up development infrastructure (hosting, databases, CI/CD)
4. **Design Sprint**: Create wireframes and mockups for core flows
5. **Begin Phase 1**: Start implementation

---

## Sources & References

- [Direct Chemist Outlet Australia](https://www.directchemistoutlet.com.au/)
- [Direct Chemist Outlet App - App Store](https://apps.apple.com/au/app/direct-chemist-outlet/id1579266682)
- [MedAdvisor Medication Management App](https://www.mymedadvisor.com/medication-management-app)
- [MedAdvisor Active Script List](https://www.mymedadvisor.com/en-au/active-script-list)
- [Electronic Prescribing - Australian Government Department of Health](https://www.health.gov.au/our-work/electronic-prescribing)
- [Australia ePharmacy Market Size and Forecast](https://www.credenceresearch.com/report/australia-epharmacy-market)
- [Top Pharmacy Software in Australia 2025](https://slashdot.org/software/pharmacy/in-australia/)
- [The Best Pharmacy Workflow Automation Software 2025](https://www.cflowapps.com/pharmacy-workflow-automation-software/)
