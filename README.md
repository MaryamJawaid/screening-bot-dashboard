# KSA Screening Interview Dashboard

> Next.js-based dashboard for automating AI-powered screening interviews. Orchestrates call initiation and post-call analysis via IngressFlow and ElevenLabs integration.

This is a Next.js project for managing AI-powered screening interviews.

## Quick Start

First, install dependencies and run the development server:

```bash
npm install
npm run dev
# or
yarn install
yarn dev
# or
pnpm install
pnpm dev
# or
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses `next/font` to automatically optimize and load fonts.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites & Infrastructure](#prerequisites--infrastructure)
4. [Environment Configuration](#environment-configuration)
5. [Getting Started](#getting-started)
6. [Database Setup](#database-setup)
7. [Running the Application](#running-the-application)
8. [End-to-End Call Workflow](#end-to-end-call-workflow)
9. [Agent Configuration](#agent-configuration)
10. [API Reference](#api-reference)
11. [Webhook Integration](#webhook-integration)
12. [Database Schema](#database-schema)
13. [Project Structure](#project-structure)

---

## Overview

The KSA Screening Interview Dashboard is an AI-powered outbound calling platform that leverages **ElevenLabs** conversational AI agents to conduct automated screening interviews for Sales Consultant positions in Saudi Arabia. The system orchestrates call initiation and post-call data processing through IngressFlow middleware integration.

The AI agent **Ahmad** is configured and managed directly on ElevenLabs. The dashboard is responsible for:

- Receiving screening requests via web interface
- Publishing jobs to IngressFlow workflow orchestration
- Tracking call status and candidate information
- Processing post-call webhooks (transcript, analysis, audio recording)
- Displaying comprehensive call history and analytics

---

## Architecture

The application follows a **three-tier architecture** with clear separation of concerns:

| Layer              | Technology      | Responsibility                                               |
| ------------------ | --------------- | ------------------------------------------------------------ |
| **Presentation**   | Next.js 14      | Web interface for HR teams to manage screening calls        |
| **Orchestration**  | IngressFlow     | Middleware handling ElevenLabs integration and call routing |
| **Voice AI**       | ElevenLabs      | Conversational AI agent conducting screening interviews      |

### Infrastructure Dependencies

| Service                | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| **PostgreSQL**         | Candidate data, call sessions, and interview history        |
| **IngressFlow**        | Call workflow orchestration and ElevenLabs proxy           |
| **ElevenLabs**         | AI voice agent hosting, STT, voice synthesis               |
| **Next.js App**        | Web dashboard for HR screening management                   |

### Call Flow Architecture

```
HR Dashboard → IngressFlow → ElevenLabs (Ahmad) → Candidate Interview → Webhook → Database → History View
```

---

## Prerequisites & Infrastructure

- **Node.js** v20+ (enforced in `package.json` `engines` field)
- **PostgreSQL** 15+ (separate database for screening data)
- **IngressFlow API Access** with valid API keys
- **ElevenLabs Agent** configured with screening interview prompt

Ensure PostgreSQL is running and accessible before starting the application.

## Environment Configuration

Create `.env.local` and populate the following variables:

| Variable                    | Description                                    |
| --------------------------- | ---------------------------------------------- |
| `DATABASE_URL`              | PostgreSQL connection string for screening DB  |
| `INVOKE_API_KEY`            | IngressFlow workflow invocation API key       |
| `ANALYSE_AUTH_TOKEN`        | IngressFlow analysis API token (optional)     |
| `INGRESSFLOW_WEBHOOK_URL`   | IngressFlow webhook endpoint URL               |
| `SCREENING_AGENT_KEY`       | Agent key for KSA screening interview agent   |
| `NEXT_PUBLIC_WEBHOOK_URL`   | Public webhook URL for call status updates    |

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up the Database

```bash
# Connect to PostgreSQL and create new database
psql -h your_postgres_host -U postgres
CREATE DATABASE screening_bot_db;
\q

# Run schema to create tables
psql -h your_postgres_host -U postgres -d screening_bot_db -f schema.sql
```

### 3. Configure Environment

```bash
# Copy and edit environment configuration
cp .env.local.example .env.local
# Edit .env.local with your actual values
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

---

## Database Setup

The project uses **PostgreSQL** with a dedicated database for screening operations, following the same pattern as the sales training dashboard.

### Database Creation

```bash
# Create separate screening database
psql -h your_postgres_host -U postgres
CREATE DATABASE screening_bot_db;
\q
```

### Schema Migration

```bash
# Apply database schema
psql -h your_postgres_host -U postgres -d screening_bot_db -f schema.sql
```

### Key Data Models

| Model            | Table            | Purpose                                          |
| ---------------- | ---------------- | ------------------------------------------------ |
| `Candidate`      | `candidates`     | Candidate contact information and names          |
| `PendingSession` | `pending_sessions` | Temporary call tracking before completion      |
| `CallSession`    | `call_sessions`  | Complete call records with transcripts and analysis |

---

## Running the Application

### Development Mode

```bash
npm run dev               # Start development server (port 3000)
```

### Production Build

```bash
npm run build             # Build for production
npm run start             # Start production server
```

### Utility Commands

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run lint`    | Lint and auto-fix TypeScript files |
| `npm run build`   | Build production bundle            |
| `npm test`        | Run unit tests                     |

---

## End-to-End Call Workflow

This section describes the complete lifecycle of a screening interview call, from the initial dashboard request to the final post-call analysis.

```
┌──────────┐  Trigger Call Form  ┌──────────────┐
│ HR User  │ ──────────────────→ │ Next.js App  │
└──────────┘                     │  Port 3000   │
                                 └──────┬───────┘
                                        │ POST /api/start-screening
                                        │ Create pending session
                                        │ Call IngressFlow API
                                        ▼
                                 ┌──────────────┐
                                 │ IngressFlow  │
                                 │ Workflow API │ 
                                 └──────┬───────┘
                                        │ Orchestrate call
                                        │ Route to ElevenLabs
                                        ▼
                          ┌─────────────────────┐
                          │    ElevenLabs      │
                          │ Ahmad AI Agent     │
                          └──────────┬─────────┘
                                     │ Conduct screening
                                     │ Generate transcript
                                     │ Post-call webhook
                                     ▼
                              ┌─────────────┐
                              │ Webhook     │ ──→ Update call session
                              │ Handler     │     Store transcript
                              └─────────────┘     Mark completed
                                     │
                                     ▼
                              ┌─────────────┐
                              │ Call History│
                              │ Dashboard   │
                              └─────────────┘
```

### Step 1 — Call Initiation (Dashboard Form)

HR user fills out the screening form:

```typescript
{
  candidateName: "Sara Al-Mahmoud",
  phoneNumber: "+966501234567"
}
```

The dashboard:

1. Validates form inputs (name and phone number required).
2. Creates a candidate record in the database if new.
3. Creates a pending session for call tracking.
4. Calls IngressFlow workflow API with agent key and candidate data.
5. Returns success confirmation to user.

### Step 2 — IngressFlow Orchestration

IngressFlow receives the payload:

```json
{
  "agent_key": "ksa_screening_interview_agent",
  "data": {
    "workflow_slug": "ksa_screening_interview",
    "workflow_id": 3,
    "candidate_name": "Sara Al-Mahmoud",
    "contact_number": "+966501234567"
  }
}
```

IngressFlow:
1. Routes the request to the appropriate ElevenLabs agent.
2. Initiates the outbound call to the candidate.
3. Manages call state and audio bridging.

### Step 3 — AI Screening Interview

The ElevenLabs agent **Ahmad** conducts a structured interview covering:

- **Background**: Current role, sales experience, education
- **Sales Performance**: Monthly targets, achievement rates, best sales month  
- **Sales Activity**: Daily call volume and outreach methods
- **Lead Generation**: Self-sourcing strategies during slow periods
- **Customer Management**: Handling objections and closing deals
- **Market Knowledge**: Riyadh/Jeddah property market awareness
- **Numerical Assessment**: Price per square meter calculation
- **Tools & Mobility**: CRM experience, driver's license, vehicle access

### Step 4 — Post-Call Processing

When the interview ends, IngressFlow sends a webhook to:

```
POST /api/webhook
```

The webhook handler:

1. Matches the call to the pending session by phone number.
2. Stores the complete transcript in `call_sessions`.
3. Saves audio recording URL if available.
4. Updates call status to "completed" or "failed".
5. Cleans up the pending session record.

### Step 5 — Results Review

HR users can review results in the call history dashboard:

- Complete interview transcripts
- Call duration and timing
- Audio playback capability  
- Candidate contact information
- Interview status and outcomes

## Agent Configuration

The KSA Screening Interview Agent is configured with the following parameters:

| Parameter        | Value                             | Description                           |
| ---------------- | --------------------------------- | ------------------------------------- |
| `agent_key`      | `ksa_screening_interview_agent`   | Unique identifier for API requests    |
| `elevenlabs_id`  | `agent_6801kvg2vxh8fsn8sh51gx7bssc8` | ElevenLabs agent ID                |
| `name`           | "Ahmad"                           | AI interviewer persona name          |
| `role`           | Sales Consultant Screening        | Interview focus area                  |
| `language`       | English                           | Primary interview language            |
| `duration`       | 10-15 minutes                     | Target interview length               |

### Agent Capabilities

The Ahmad AI agent is configured to evaluate candidates across multiple dimensions:

1. **Communication Assessment**
   - Verbal fluency and confidence
   - Professional communication style
   - Ability to articulate responses clearly

2. **Sales Experience Evaluation**
   - Previous sales roles and industries
   - Target achievement history
   - Sales methodology understanding

3. **Market Knowledge Testing**
   - Real estate market awareness (Riyadh/Jeddah)
   - Property pricing comprehension
   - Local market dynamics understanding

4. **Practical Skills Verification**
   - CRM and digital tool proficiency
   - Lead generation techniques
   - Customer objection handling

5. **Logistics and Mobility**
   - Transportation availability
   - Field sales readiness
   - Schedule flexibility

---

## API Reference

### Start Screening Interview

```http
POST /api/start-screening
Content-Type: application/json
```

**Request Body:**

```json
{
  "candidateName": "Sara Al-Mahmoud",
  "phoneNumber": "+966501234567"
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Screening call initiated successfully",
  "sessionId": "uuid-here",
  "ingressFlowResponse": { ... }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Phone number and candidate name are required` | Missing required fields |
| 500 | `Failed to start screening call` | IngressFlow API error |

### Get Call History

Call history is retrieved server-side on the `/history` page. The data includes:

- Candidate information joined from `candidates` table
- Complete call session details
- Transcription and analysis data
- Call timing and duration statistics

---

## Webhook Integration

### IngressFlow Webhook Handler

```
POST /api/webhook
Content-Type: application/json
```

The webhook receives post-call data from IngressFlow and processes:

**Expected Payload Structure:**

```json
{
  "phone_number": "+966501234567",
  "status": "completed",
  "transcription": "Full interview transcript...",
  "audio_url": "https://recordings.example.com/call.mp3",
  "duration_seconds": 847,
  "conversation_id": "elevenlabs-conv-id"
}
```

**Processing Steps:**

1. **Call Matching**: Locate active call session by phone number
2. **Transcript Storage**: Save full interview transcript  
3. **Status Update**: Mark call as completed/failed
4. **Audio Handling**: Store recording URL for playback
5. **Cleanup**: Remove pending session record
6. **Analytics**: Update call statistics and metrics

## 🗄️ Database Schema

**Separate Screening Database Tables (following sales dashboard pattern):**

### Candidates Table
```sql
- id: UUID primary key
- phone_number: Unique candidate phone
- name: Candidate name
- created_at/updated_at: Timestamps
```

### Call Sessions Table  
```sql
- id: UUID primary key
- candidate_phone: Foreign key to candidates
- agent_key: Screening agent identifier
- status: Call status (pending, in_progress, completed, failed)
- transcription: Interview transcript
- analysis: Analysis results and metadata
- audio_url: Recording link
- conversation_id: ElevenLabs conversation ID
- duration_seconds: Call duration
- started_at/ended_at: Call timing
- created_at/updated_at: Timestamps
```

### Pending Sessions Table
```sql
- id: UUID primary key
- candidate_phone: Foreign key to candidates
- agent_key: Agent identifier  
- status: Session status (pending, in_progress)
- created_at/updated_at: Timestamps
```

## Database Schema

**Separate Screening Database Tables (following sales dashboard pattern):**

### Candidates Table
```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Call Sessions Table  
```sql  
CREATE TABLE call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_phone TEXT NOT NULL,
  agent_key TEXT NOT NULL DEFAULT 'ksa_screening_interview_agent',
  status TEXT NOT NULL DEFAULT 'pending',
  transcription TEXT NULL,
  analysis JSONB NULL,
  audio_url TEXT NULL,
  conversation_id TEXT NULL,
  duration_seconds INTEGER NULL,
  started_at TIMESTAMPTZ NULL,
  ended_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Pending Sessions Table
```sql
CREATE TABLE pending_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_phone TEXT NOT NULL,
  agent_key TEXT NOT NULL DEFAULT 'ksa_screening_interview_agent',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Relationships and Indexes

```sql
-- Foreign key relationships
ALTER TABLE pending_sessions 
ADD CONSTRAINT fk_pending_sessions_candidate 
FOREIGN KEY (candidate_phone) REFERENCES candidates(phone_number);

ALTER TABLE call_sessions 
ADD CONSTRAINT fk_call_sessions_candidate 
FOREIGN KEY (candidate_phone) REFERENCES candidates(phone_number);

-- Performance indexes
CREATE INDEX idx_candidates_phone ON candidates(phone_number);
CREATE INDEX idx_call_sessions_created ON call_sessions(created_at DESC);
CREATE INDEX idx_call_sessions_status ON call_sessions(status);
```

---

## Project Structure

```
screening-bot-dashboard/
├── app/
│   ├── page.tsx                    # Main dashboard (candidate form)
│   ├── history/
│   │   └── page.tsx                # Call history with analytics
│   ├── api/
│   │   ├── start-screening/
│   │   │   └── route.ts            # Call initiation API endpoint
│   │   └── webhook/
│   │       └── route.ts            # IngressFlow webhook handler
│   ├── layout.tsx                  # Root layout component
│   └── globals.css                 # Global styles (Tailwind)
├── lib/
│   └── db.ts                       # PostgreSQL connection and queries
├── schema.sql                      # Database schema definition
├── .env.local                      # Environment configuration
├── package.json                    # Dependencies and scripts
├── tailwind.config.js              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # Project documentation
```

### Key Components Architecture

| Component          | Path                    | Responsibility                              |
| ------------------ | ----------------------- | ------------------------------------------- |
| **Dashboard Form** | `app/page.tsx`          | Candidate input and call initiation UI     |
| **Call History**   | `app/history/page.tsx`  | Interview results display and analytics    |
| **Database Layer** | `lib/db.ts`             | PostgreSQL queries and data management      |
| **API Routes**     | `app/api/*/route.ts`    | REST endpoints for call management         |

---

## Deployment

### Environment Variables Checklist

- [ ] `DATABASE_URL` - PostgreSQL connection string for screening database
- [ ] `INVOKE_API_KEY` - IngressFlow workflow invocation API key  
- [ ] `ANALYSE_AUTH_TOKEN` - IngressFlow analysis token (optional)
- [ ] `SCREENING_AGENT_KEY` - Agent key (ksa_screening_interview_agent)
- [ ] `NEXT_PUBLIC_WEBHOOK_URL` - Public webhook URL for status updates

### Deployment Steps

1. **Deploy Application**
   ```bash
   # Build for production
   npm run build
   
   # Deploy to platform (Vercel, AWS, etc.)
   ```

2. **Configure Database**
   ```bash
   # Create production database
   psql -h prod_host -U postgres
   CREATE DATABASE screening_bot_db;
   
   # Apply schema
   psql -h prod_host -U postgres -d screening_bot_db -f schema.sql
   ```

3. **Set Environment Variables**
   - Configure all required environment variables in deployment platform
   - Ensure `NEXT_PUBLIC_WEBHOOK_URL` points to deployed webhook endpoint

4. **Configure IngressFlow**
   - Update IngressFlow webhook configuration to point to deployed URL
   - Test connectivity with sample webhook payload

5. **Verify Integration**
   - Test end-to-end call flow with test candidate
   - Verify webhook processing and data storage
   - Confirm call history displays correctly

### Health Checks

The application provides health check endpoints:

```http
GET /api/health              # Application health status
```

---

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Verify connection string format
DATABASE_URL=postgresql://user:pass@host:5432/screening_bot_db

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

**IngressFlow API Failures**
- Validate `INVOKE_API_KEY` is correct and active
- Check IngressFlow service status and endpoint availability  
- Review request payload format matches expected schema

**Webhook Processing Issues**
- Confirm `NEXT_PUBLIC_WEBHOOK_URL` is publicly accessible
- Check webhook handler logs for processing errors
- Verify IngressFlow webhook configuration matches deployed URL

**Call Session Tracking Problems**
- Ensure phone numbers are stored in consistent format
- Check foreign key constraints between tables
- Verify pending session cleanup after call completion

### Debug Mode

Enable detailed logging:

```bash
# Add to .env.local
NODE_ENV=development
DEBUG=screening:*
```

### Performance Monitoring

Monitor key metrics:
- Call initiation success rate
- Webhook processing latency  
- Database query performance
- Average interview completion time

---

## Support and Maintenance

For operational issues:

| Component        | Contact/Resource                           |
| ---------------- | ------------------------------------------ |
| **Database**     | PostgreSQL administrator                   |
| **IngressFlow**  | IngressFlow API support team              |
| **ElevenLabs**   | ElevenLabs agent configuration support    |
| **Application**  | Development team / repository issues      |

### Monitoring and Alerts

Recommended monitoring setup:
- Database connection health checks
- API endpoint availability monitoring  
- Webhook processing success rates
- Call completion analytics dashboard
