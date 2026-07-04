# Distributed Job Scheduler

A highly reliable, production-ready, distributed asynchronous job scheduling platform designed to run on top of a relational database. It is built to reliably queue, schedule, execute, and monitor background tasks across multiple concurrent worker nodes.

---

## 1. Project Overview

This project implements a distributed background job scheduler designed for scalability, transactional integrity, and fault tolerance. Unlike simple, memory-based queues, this platform is designed as a **database-backed distributed queue** that guarantees atomic, duplicate-free job claiming via PostgreSQL transactions using `SELECT ... FOR UPDATE SKIP LOCKED`. 

It supports multiple queue groups, priority scheduling, dynamic concurrency throttling, configurable retry backoffs, and dead letter queue (DLQ) support for failed jobs. It is packaged with a responsive admin dashboard for real-time visualization and queue management.

---

## 2. Problem Statement

Modern microservice architectures require executing asynchronous background work (e.g., PDF generation, transactional emails, web scraping, data synchronization) outside the request-response lifecycle of the main application. 

Key challenges in distributed job scheduling include:
*   **Race Conditions**: Ensuring that a single job is executed by exactly one worker, even when dozens of worker nodes poll the queue concurrently.
*   **Worker Failures**: Detecting when a worker crashes mid-job and safely reclaiming or retrying its unfinished work.
*   **Resource Management**: Throttling job execution per-queue to prevent overloading downstream databases or third-party APIs.
*   **Scheduling Flexibility**: Supporting immediate, delayed, recurring (cron-based), and batched execution.
*   **Observability**: Monitoring execution latencies, failure rates, queue throughput, and worker heartbeats in real-time.

This platform addresses these issues using a clean, database-driven architecture optimized for transaction safety and operational simplicity.

---

## 3. Core Features

*   **Multi-Tenant Organization & Project Isolation**: Multiple projects can manage their own decoupled set of job queues.
*   **Configurable Job Queues**: Define priority, concurrency limits, and pause/resume states on a per-queue level.
*   **Diverse Job Types**:
    *   *Immediate Jobs*: Executed as soon as system resources allow.
    *   *Delayed Jobs*: Scheduled for a specific future timestamp.
    *   *Recurring Jobs (Cron)*: Evaluated using standard cron syntax.
    *   *Batch Jobs*: Track the progress of multiple jobs executed as a single logical unit.
*   **Worker Pool Concurrency**: Self-registering worker processes that dynamically poll, heartbeat, and execute jobs within defined concurrency envelopes.
*   **Atomic Claiming & Execution Guarantee**: Uses Postgres row-level locking (`FOR UPDATE SKIP LOCKED`) to eliminate double-execution.
*   **Configurable Retry Policies**: Fixed delay, linear backoff, and exponential backoff strategies.
*   **Fault Isolation & Dead Letter Queue (DLQ)**: Hard failures are routed to a DLQ for manual inspection and replay.
*   **Graceful Shutdown**: Workers trap OS signals (`SIGTERM`/`SIGINT`) to complete in-flight tasks and clean up their registrations.
*   **Comprehensive Observability**: Web dashboard displaying live worker heartbeats, job logs, and throughput metrics.

---

## 4. Technology Stack

*   **Runtime Environment**: Node.js (v18+)
*   **Programming Language**: TypeScript (v5+)
*   **API Framework**: Express.js
*   **Database ORM**: Prisma ORM
*   **Primary Database**: PostgreSQL (v15+)
*   **Testing Suite**: Jest & Supertest
*   **Frontend Dashboard**: React (Vite) + CSS Modules

---

## 5. High-Level Architecture

The system consists of three main services interacting with a single, highly indexed PostgreSQL instance:

1.  **API Gateway / Server**: Receives REST requests for creating and managing projects, queues, and jobs.
2.  **Worker Daemon**: A lightweight runner process that polls the database, acquires row locks, executes tasks concurrently, and heartbeats back to the DB.
3.  **Scheduler/Orchestrator**: A lightweight background coordinator that evaluates cron job frequencies and reclaims dead workers.

```mermaid
graph TD
    Client[REST API / Dashboard] -->|HTTP / JSON| API[API Server Express]
    API -->|Read/Write SQL| DB[(PostgreSQL Database)]
    
    subgraph Workers [Worker Pool]
        W1[Worker Node A]
        W2[Worker Node B]
    end
    
    Workers -->|SELECT FOR UPDATE SKIP LOCKED| DB
    Workers -->|Heartbeat Updates| DB
    
    subgraph Orchestrator [Scheduler Engine]
        Reaper[Dead Worker Reaper]
        CronEngine[Cron & Delay Scheduler]
    end
    
    Reaper -->|Reclaim Abandoned Jobs| DB
    CronEngine -->|Enqueue Due Recurring Jobs| DB
```

---

## 6. Folder Structure

The project is structured as a monorepo containing the backend service, frontend dashboard, and architectural documentation.

```
codity-job-scheduler/
├── backend/
│   ├── prisma/             # Database schema, migrations, and seeds
│   ├── src/
│   │   ├── core/           # Interfaces, Domain Models, and Constants
│   │   ├── application/    # Business logic, Use Cases, and Retry Engines
│   │   ├── infrastructure/ # DB Repository, Logger, and DB Adapters
│   │   ├── interfaces/
│   │   │   ├── http/       # Express server, controllers, middleware, and routes
│   │   │   └── worker/     # Polling daemon, worker registration, and heartbeat loops
│   │   ├── shared/         # Common utilities, cron parsers, and errors
│   │   └── app.ts          # Server entry point
│   ├── tests/              # Unit, integration, and concurrency tests
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # UI Components (Buttons, Charts, Logs)
│   │   ├── pages/          # Dashboard, Queues, Workers, Jobs Explorer
│   │   ├── services/       # API integration client
│   │   ├── styles/         # CSS Modules for styling
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── architecture.md     # Software Architecture Document (SAD)
│   ├── database_design.md  # Schema definitions, indices, & performance
│   ├── api_documentation.md# Complete REST API specification
│   ├── design_decisions.md # Rationale behind key design trade-offs
│   ├── testing_strategy.md # Verification patterns & test coverage
│   ├── deployment_guide.md # Production deployments & native setup guide
│   └── engineering_tradeoffs.md # Performance, consistency, and structural trade-offs
└── README.md               # Main entry point
```

---

## 7. Environment Variables

Create a `.env` file in the `backend/` directory based on the configuration below:

```bash
# System Configuration
PORT=4000
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/scheduler_db?schema=public"

# Security Configuration
JWT_SECRET="super-secret-security-token-for-signing-json-web-tokens"
JWT_EXPIRES_IN="7d"

# Worker Settings
WORKER_CONCURRENCY_LIMIT=10
WORKER_POLL_INTERVAL_MS=1000
WORKER_HEARTBEAT_INTERVAL_MS=5000
REAPER_INTERVAL_MS=10000
```

---

## 8. Installation Guide

### Prerequisites
*   Node.js (v18.0.0 or higher)
*   npm (v9.0.0 or higher)
*   PostgreSQL (v15.0 or higher)

### Setup Database
Create a database named `scheduler_db` owned by your PostgreSQL user.

### Install Dependencies

From the root directory, install all required dependencies for both backend and frontend projects:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## 9. Running Locally

### Backend Server
Generate the database client, run migrations, seed initial records, and start the development server:
```bash
cd backend
npx prisma migrate dev
npm run seed
npm run dev
```

### Worker Service
You can start a separate instance of the worker service to process background jobs:
```bash
cd backend
npm run worker
```

### Frontend Dashboard
Start the Vite development server for the web interface:
```bash
cd frontend
npm run dev
```
The dashboard will be available at `http://localhost:5173`.

---

## 10. Future Improvements

*   **WebSocket Integration**: Replace HTTP polling on the frontend with server-sent events or WebSockets for instant updates.
*   **Redis Cache Layer**: Add a Redis cache layer for high-throughput statistics counters to avoid hitting PostgreSQL for dashboard reads.
*   **Queue Sharding**: Support partitioning the `jobs` table to scale horizontally past Postgres single-instance disk throughput.

---

## 11. Links to Documentation

Detailed documentation explaining the engineering behind the system is located in the `docs/` folder:

*   **Architecture & Internals**: [docs/architecture.md](docs/architecture.md)
*   **Database Schema & Indices**: [docs/database_design.md](docs/database_design.md)
*   **API Reference Specification**: [docs/api_documentation.md](docs/api_documentation.md)
*   **Design Rationale & Alternatives**: [docs/design_decisions.md](docs/design_decisions.md)
*   **Testing Strategy**: [docs/testing_strategy.md](docs/testing_strategy.md)
*   **Production Deployment Guide**: [docs/deployment_guide.md](docs/deployment_guide.md)
*   **Trade-off Analysis**: [docs/engineering_tradeoffs.md](docs/engineering_tradeoffs.md)

---

## 12. Dashboards & Demos

### Screenshots Placeholder
*(Screenshots of the React Dashboard showing Queue Stats, Job Details, and Worker heartbeats will be placed here)*

### Live Demo Link
*(Link to the live hosted application staging environment)*
