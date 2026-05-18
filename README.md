# ZenQ - Goal Tracking Portal

**ZenQ** is a rule-based Goal Setting & Tracking Portal engineered for precision and accountability. Built as a monorepo, it transitions organizational strategy from passive spreadsheets into an active "Command Center" featuring real-time updates, automated escalations, and strict role-based governance.


---

## System Architecture

AtomQuest utilizes an N-Tier architecture designed for high availability, strict data integrity, and background automation.

```mermaid
flowchart TB
    %% Styling Definitions
    classDef actor fill:#e0f2fe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a,font-weight:bold
    classDef frontend fill:#fef08a,stroke:#d97706,stroke-width:2px,color:#78350f,font-weight:bold
    classDef backend fill:#dcfce7,stroke:#65a30d,stroke-width:2px,color:#3f6212,font-weight:bold
    classDef database fill:#e0e7ff,stroke:#4f46e5,stroke-width:2px,color:#312e81,font-weight:bold
    classDef external fill:#f3f4f6,stroke:#4b5563,stroke-width:2px,color:#1f2937,stroke-dasharray: 5 5

    %% Actor Layer
    subgraph Actors ["👤 Organizational Actors"]
        direction LR
        Emp[Employee]:::actor
        Mgr[Manager]:::actor
        Adm[System Admin]:::actor
    end

    %% Client/Presentation Tier
    subgraph ClientTier ["🖥️ Presentation Tier (Next.js 16)"]
        direction TB
        UI[Dynamic UI / Tailwind v4]:::frontend
        State[AuthContext & Session]:::frontend
        Fetcher[API Fetcher]:::frontend
        
        UI --> State
        State --> Fetcher
    end

    %% API/Application Tier
    subgraph AppTier ["⚙️ Application Tier (Node.js / Express)"]
        direction TB
        APIGateway[REST API Router]:::backend
        Security[JWT & RBAC Middleware]:::backend
        
        subgraph BusinessLogic ["Core Controllers"]
            direction LR
            AuthSvc[Identity Engine]:::backend
            GoalSvc[Goal Lifecycle]:::backend
            AnalyticSvc[Analytics Aggregator]:::backend
        end
        
        subgraph BackgroundProcess ["Async Automation"]
            Cron[Node-Cron Scheduler]:::backend
            Escalation[Rule-Based Escalation]:::backend
            EmailSvc[Nodemailer Dispatch]:::backend
            
            Cron --> Escalation
            Escalation --> EmailSvc
        end

        DAL[Prisma ORM]:::backend

        APIGateway --> Security
        Security --> AuthSvc & GoalSvc & AnalyticSvc
        GoalSvc -- Notifications --> EmailSvc
        AuthSvc & GoalSvc & AnalyticSvc --> DAL
        Escalation --> DAL
    end

    %% Data Tier
    subgraph DataTier ["🗄️ Persistence Tier"]
        direction TB
        PG[(PostgreSQL Database)]:::database
        Audit[(Immutable Audit Logs)]:::database
        
        PG -.- Audit
    end

    %% Network Connections
    Actors -->|HTTPS| UI
    Fetcher <-->|JSON + Bearer JWT| APIGateway
    DAL <-->|TCP Pool| PG
```

---

## Repository Structure

This repository is structured as a monorepo containing two primary services:

*   **[`/frontend`](./frontend):** The Next.js 16 (App Router) client application featuring Tailwind CSS v4, custom theme engines, and high-density industrial dashboards.
*   **[`/backend`](./backend):** The Node.js/Express REST API powered by TypeScript and Prisma ORM, handling business logic, JWT authentication, and automated cron jobs.

---

## Quick Start Guide

To run the entire AtomQuest stack locally, follow these steps:

### 1. Database & Environment Setup
Navigate to the `backend/` directory and configure your environment:
1. Create a `backend/.env` file.
2. Add your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/atomquest?schema=public"
   JWT_SECRET="your-super-secret-key"
   SMTP_HOST="sandbox.smtp.mailtrap.io"
   SMTP_PORT=2525
   SMTP_USER="your_mailtrap_user"
   SMTP_PASS="your_mailtrap_pass"
   FRONTEND_URL="http://localhost:3000"
   ```

### 2. Initialize the Backend
Open a terminal in the root directory and run:
```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
npm run dev
```
*(The server will start on `http://localhost:5000`. The seed script generates default users with the password `password123`)*.

### 3. Initialize the Frontend
Open a **second terminal**, navigate to the frontend, and run:
```bash
cd frontend
npm install
npm run dev
```
*(The portal will be accessible at `http://localhost:3000`)*.

---

## Email Notifications (Mailtrap Sandbox)

All automated emails triggered by the system (such as goal submissions, approvals, rejections, and quarterly check-in reminders) are routed securely to a **Mailtrap Sandbox** environment instead of actual inboxes. This ensures that no real emails are sent or spammed during testing.

![Mailtrap Sandbox Dashboard](images/image.png)

---

## Default Provisioned Accounts
If you ran the seed script, you can immediately log in with:
*   **Admin Access:** `admin@atomberg.com` (Password: `password123`)
*   **Manager Access:** `manager@atomberg.com` (Password: `password123`)
*   **Employee Access:** `emp1@atomberg.com` (Password: `password123`)

---
*Developed for the Atomberg Hackathon 2026.*