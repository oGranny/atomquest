# 🚀 AtomQuest 1.0 - Precision Goal Tracking Portal

An enterprise-grade, rule-based Goal Setting & Tracking Portal designed specifically for Atomberg's industrial and engineering workflows. AtomQuest moves beyond passive spreadsheets, offering a high-density, real-time command center that enforces strategic alignment across all organizational nodes.

![AtomQuest Industrial Theme](https://via.placeholder.com/1000x500/141b2b/ffd700?text=AtomQuest+Command+Center)

## 📋 Table of Contents
- [Core Features](#-core-features)
- [Technical Architecture](#-technical-architecture)
- [Role-Based Access (RBAC)](#-role-based-access)
- [Automated Engines](#-automated-engines)
- [Local Setup & Installation](#-local-setup--installation)

---

## ✨ Core Features

*   **Idempotent Goal Builder:** A robust, autosaving strategy builder supporting diverse Units of Measurement (Percentages, Numeric, Timelines, and strict Binary Pass/Fail logic).
*   **Dual-Direction Scoring:** Dynamically computes precision scores whether a target is "Higher is Better" (Growth/Revenue) or "Lower is Better" (Cost/Turnaround Time).
*   **Intelligent Quarter Locking:** Automatically restricts data entry to the current active financial quarter, ensuring historical data integrity.
*   **Cinematic Governance Heatmap:** A massive, ultra-wide terminal for Super Admins to instantly gauge departmental alignment and organizational bottleneck concentrations.
*   **Dynamic Theme Engine:** A fully realized CSS architecture utilizing Tailwind v4 that seamlessly transitions between a crisp "Light Mode" and a high-contrast "Industrial Dark Mode."

---

## 🏗 Technical Architecture

AtomQuest is built on a robust N-Tier architecture designed for high availability and strict data integrity.

*   **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons, Shadcn UI.
*   **Backend:** Node.js, Express.js, TypeScript.
*   **Database:** PostgreSQL (Cloud/Local) managed via **Prisma ORM**.
*   **Security:** Local Identity Management using **Bcrypt** (10 salt rounds) and **JWT** (JSON Web Tokens).
*   **Background Jobs:** `node-cron` for async automation.
*   **Notifications:** `nodemailer` integrated with Mailtrap SMTP Sandbox.

---

## 🔐 Role-Based Access

The system enforces strict operational boundaries:

1.  **EMPLOYEE:** Can provision their own account, draft strategic goals, and log quarterly telemetry.
2.  **MANAGER:** Inherits Employee rights, plus the ability to review subordinate sheets, mandate revisions, approve (lock) strategies, and push "Shared Goals" downwards.
3.  **ADMIN:** Has full read-access to the entire organizational tree. Can override locks, access the Governance Heatmap, view system-wide Audit/Escalation logs, and dynamically reassign user roles.

---

## ⚙️ Automated Engines

AtomQuest is an *active* system, powered by dedicated background threads:

*   **Quarterly Reminders:** Runs daily at 09:00 AM. Scans the database for users who have not logged progress for the active quarter and dispatches an automated email.
*   **Rule-Based Escalation:** Runs daily at Midnight. Evaluates hardcoded business rules (e.g., "Submission overdue by 7 days") and escalates notifications up the management chain (Employee → Manager → Skip-level), logging the bottleneck in the Governance Terminal.
*   *(Note: Admins can manually trigger these jobs via the "Execute System Jobs" module in the Settings portal).*

---

## 🛠 Local Setup & Installation

### Prerequisites
- Node.js (v20+)
- PostgreSQL Database (Local or Cloud like Neon/Supabase)
- Mailtrap Account (Free Sandbox for Email Testing)

### 1. Database Configuration (Backend)
Navigate to the `backend/` directory and create a `.env` file:
```env
# Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/atomquest?schema=public"

# Security
JWT_SECRET="your-super-secret-key"

# Email Configuration (Mailtrap Sandbox Recommended)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_password

# Link for Emails
FRONTEND_URL=http://localhost:3000
```

### 2. Initialize Database & Seed
Run the following commands in the `backend/` directory to push the schema and generate the default testing accounts:
```bash
npm install
npx prisma db push
npx prisma db seed
```
*(The seed script will create `admin@atomberg.com`, `manager@atomberg.com`, and employee accounts, all with the default password: **`password123`**).*

### 3. Start the Backend Server
```bash
npm run dev
# Server will start on http://localhost:5000
```

### 4. Start the Frontend Application
Open a new terminal, navigate to the `frontend/` directory:
```bash
npm install
npm run dev
# Portal will be accessible at http://localhost:3000
```

---
*Built for the Atomberg Hackathon 2026. Engineering Excellence.*