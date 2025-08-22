# TaskMaster - Task Manager

![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Tauri](https://img.shields.io/badge/Tauri-24C8DB?style=for-the-badge&logo=tauri&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

A modern full-stack task management application built with Rust, Tauri(React) and PostgreSQL

## Table of Contents 

- [Description](#-description)
- [Features](#-features)
- [Development Roadmap](#️-development-roadmap)
- [Installation and Setup](#-installation-and-setup)
- [Testing](#-testing)

## Description

TaskMaster is a comprehensive task management application that works both as a web application and cross-platform native app. It combines the robustness and performance of Rust in the backend with the flexibility of React and TypeScript in the frontend, powered by Tauri for creating native applications, and backed by PostgreSQL for data persistence.

### Tech Stack

- **Backend**: Rust with Actix-web, SQLx, JWT authentication
- **Web Frontend**: React 18, TypeScript, React Query, CSS
- **Native Application**: Tauri
- **Database**: PostgreSQL with automatic migrations
- **Containerization**: Docker and Docker Compose
- **Testing**: Unit and integration tests
- **Security**: JWT authentication, robust validations

## Features

- **Authentication** - Registration, login and secure sessions
- **Task CRUD** - Create, edit, delete and manage tasks
- **Advanced search** - Filters by status, priority, tags and dates
- **Interactive dashboard** - Kanban view (Drag and Drop interface) and list with statistics
- **Priority management** - Priority system (low, medium, high)
- **Tag system** - Flexible organization with tags
- **Smart notifications** - Automatic alerts for upcoming tasks
- **Cross-platform application** - Web and native application with Tauri
- **Dark mode** - Light/dark theme with persistence
<!-- - ⚡ **Performance** - Time optimizations and efficient loading -->

## Development Roadmap

### Phase 1: Foundations

#### Base Entities
- [x] **User**
  - [x] Unique ID
  - [x] Username
  - [x] Unique email
  - [x] Secure password hash
  - [x] Creation timestamps

- [x] **Task**
  - [x] Unique ID
  - [x] User relationship
  - [x] Title (3-120 characters)
  - [x] Optional description
  - [x] Status (todo|doing|done)
  - [x] Priority (low|med|high)
  - [x] Due date (nullable)
  - [x] Creation/update timestamps
  - [x] Tag system

#### Authentication System
- [x] User registration with validations
- [x] Login with JWT tokens
- [x] Authentication middleware
- [x] Private route protection
- [x] Secure session management

#### Complete Task CRUD
- [x] Create tasks with validations
- [x] Read tasks with advanced filters
- [x] Update existing tasks
- [x] Delete tasks with confirmation
- [x] Free text search
- [x] Filtering by status, priority and tags
- [x] Date range filtering

#### Pagination and Sorting System
- [x] Server-side pagination
- [x] Multi-criteria sorting
- [x] URL filter persistence
- [x] Optimized navigation

#### Robust Validations
- [x] Title validation (length and format)
- [x] Date validation (not in the past)
- [x] Data input sanitization
- [x] Consistent error handling

#### User Interface
- [x] Responsive and modern UI
- [x] Task list with visual indicators
- [x] Creation/editing forms
- [x] Dashboard with statistics
- [x] Status counters

#### Testing and Quality
- [x] Backend unit tests
- [x] Endpoint integration tests (Postman)
- [x] Frontend integration tests (32 tests)
- [x] Security validation
- [x] API documentation

#### DevOps and Deployment
- [x] Complete Docker configuration
- [x] Database migrations
- [x] Environment variables
- [x] Development scripts
- [x] Installation documentation

### Phase 2: Advanced Improvements

#### Advanced User Interface
- [x] Light-Dark Theme System
- [ ] Multi-language Support

#### Analytics and Visualization
- [x] Statistical Reports Dashboard
- [ ] Exportable reports

#### Automation System
- [x] Smart Automatic Notification System
- [x] Interactive Kanban Board with Drag & Drop system


## Installation and Setup

### Prerequisites

#### For Backend and Database (Docker)
- **Docker** 20.10+ and **Docker Compose** v2
- **Git** to clone the repository

#### For Frontend (Web + Native Application)
- **Node.js** 18+ and **npm** 8+
- **Rust** 1.70+ and **Cargo**
- **Visual Studio Build Tools**
- **WebView2**

### Download the Project

```bash
# Clone repository
git clone https://github.com/your-username/taskmaster.git
cd taskmaster

# Verify structure
ls -la
# You should see: backend/ frontend/ docker-compose.yml README.md
```

### Configure and Run Backend + Database

#### 1. Configure Environment Variables

```bash
# Configure Docker Compose
cp .env.example .env
nano .env  # Edit with your values

# Configure Backend
cd backend
cp .env.example .env
nano .env  # Edit backend configuration
cd ..
```

#### 2. Minimum Required Configuration

**`.env` file (root) - For Docker Compose:**
```env
DB_PASSWORD=password
JWT_SECRET=jwt_secret
```

**`backend/.env` file - For local development:**
```env
DATABASE_URL=postgresql://user:password@localhost4:5432/taskmaster
JWT_SECRET=tjwt_secret
```

**IMPORTANT - Variable synchronization:**
- `JWT_SECRET` **MUST be identical** in both files
- `DB_PASSWORD` **MUST match** in both files
- Local development reads `backend/.env` directly
- Docker Compose injects variables from root `.env` to container
- If they don't match, the system will fail in one of the environments

#### 3. Start Services

```bash
# Build and run backend + PostgreSQL
docker compose up -d

# Verify that services are running
docker compose ps

# View logs in real time
docker compose logs -f
```

### Database Configuration

#### Initialization Flow

The system uses a **separation of responsibilities** approach for database configuration:

1. **Docker Compose** → Creates empty database (`taskmaster`)
2. **Backend (SQLx Migrations)** → Creates all tables on startup
3. **Data scripts** → Populate with test data (optional)

#### Automatic Structure

**Database:**
- Automatically created by PostgreSQL when container starts
- Name: `taskmaster` (configurable in `.env`)
- User: `admin` (configurable)

**Tables:**
- Created by SQLx migrations in `/backend/migrations/`
- Executed automatically when backend starts
- Order: `users` → `tasks` → `notifications`

#### Test Data (Optional)

For development and testing, you can populate the database with sample data:

```bash
# Copy script to PostgreSQL container
docker cp database/seed_data.sql taskmaster-db:/tmp/

# Execute test data script
docker exec -i taskmaster-db psql -U admin -d taskmaster -f /tmp/seed_data.sql

# Created test credentials:
# Email: user1@taskmaster.com
# Password: user1pass
# Tasks: 50 tasks with varied states, priorities and tags
```

**Script structure:**
- ✅ 1 test user with valid credentials
- ✅ 50 tasks with realistic data
- ✅ Distributed states: `todo`, `in_progress`, `completed`
- ✅ Varied priorities: `low`, `med`, `high`
- ✅ Various tags: frontend, backend, devops, testing, etc.
- ✅ Staggered due dates (7, 14, 30 days)

**Note:** Test data is completely optional. The system works perfectly without it.

#### 4. Verify Backend

```bash
# Backend health check
curl http://localhost:8000/health

# Expected response: {"status":"ok","timestamp":"..."}
```

#### 5. Automatic Connectivity

**Backend ↔ Database:**
- Automatic connection via Docker Compose
- Internal network: `taskmaster_network`
- Internal DNS: `postgres:5432`
- No manual configuration required

**Frontend → Backend:**
- Default URL: `http://localhost:8000`
- Configurable in `frontend/.env`:
  ```env
  VITE_API_URL=http://localhost:8000
  ```

### Configure Frontend

#### 1. Prepare Environment

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables (optional)
cp .env.example .env
nano .env  # Adjust backend URL if necessary
```

**Frontend → Backend Connectivity:**
- By default connects to `http://localhost:8000`
- Make sure backend is running before starting frontend
- If you change backend port, update `VITE_API_URL` in `.env`

#### 2. Web Development

```bash
# Run in web development mode
npm run dev

# Open browser at: http://localhost:5173
```

#### 3. Native Application Development (Tauri)

```bash
# Verify Tauri configuration
npx tauri info

# Run native application in development
npm run tauri:dev

# Native system window will open (not browser)
# First run: 2-3 minutes (downloads dependencies)
# Subsequent runs: 30 seconds
```

#### 4. Build for Production

##### Web Application
```bash
# Option 1: Build with TypeScript verification
npm run build

# Option 2: Build without TypeScript verification (faster)
npx vite build --mode production

# Files are generated in:
# dist/
# ├── index.html                    # Main page  
# ├── assets/
# │   ├── index-KH009AWA.css       # Optimized styles (~91KB)
# │   ├── index-D_bsOU2a.js        # Optimized JavaScript (~818KB)
# │   ├── icon-CXRrNeXu.png        # Icons
# │   └── logo-DNlkYZlN.png        # Images
# └── vite.svg                     # Favicon
```

##### Native Application (Tauri)
```bash
# Compile native application for Windows
npm run tauri:build

# Build process:
# 1. Compiles web frontend (Vite)
# 2. Downloads Rust dependencies automatically
# 3. Compiles native application (2-3 minutes first time)
# 4. Generates professional installers

# Binaries are generated in:
# src-tauri/target/release/
# ├── taskmaster.exe                         # Direct executable (5.1 MB)
# └── bundle/
#     ├── msi/TaskMaster_1.0.0_x64_en-US.msi     # MSI installer (2.7 MB)
#     └── nsis/TaskMaster_1.0.0_x64-setup.exe   # NSIS installer (2.0 MB)
```


## Testing

### Frontend

#### Integration Tests

The frontend has **32 integration tests** that validate complete services against the **backend**, testing both successful and failure cases.

##### Covered Services

| Category | Tests | Description |
|----------|-------|-------------|
| **Authentication** | 5 tests | Login, registration, user profile, 401/400 error handling |
| **Task CRUD** | 12 tests | Create, read, update, delete tasks with validations |
| **Response Handling** | 3 tests | Standardized responses, individual resources, empty responses |
| **Error Handling** | 6 tests | 404, 401, 400, 403 errors, backend message preservation |
| **Data Integrity** | 2 tests | Data type preservation, optional fields |
| **Performance** | 2 tests | Response times, concurrent requests |
| **Edge Cases** | 3 tests | Long titles, special characters, extreme pagination |

##### How to Run

```bash
# Run integration tests (requires running backend)
npm run test:integration

# Run in watch mode
npm run test:integration:watch

# Run only unit tests (excludes integration)
npm run test:unit
```

##### Prerequisites

1. **Backend running** at `http://192.168.200.4:8000`
2. **PostgreSQL database** active and accessible
3. **Environment variables** configured correctly

##### Expected Responses

**🟢 Successful Case:**
```bash
✓ src/services/api.integration.test.ts (32 tests)
  ✓ Authentication - Backend Tests (5)
  ✓ Tasks CRUD - Backend Tests (12)
  ✓ Response Handling - Backend Tests (3)
  ✓ Error Handling - Backend Tests (6)
  ✓ Data Integrity - Backend Tests (2)
  ✓ Performance - Backend Tests (2)
  ✓ Edge Cases - Backend Tests (3)

Test Files  1 passed (1)
Tests  32 passed (32)
```

**🔴 Failure Case (Backend not available):**
```bash
❯ src/services/api.integration.test.ts (32 tests | 32 failed)
   ❯ Authentication - Backend Tests > should successfully authenticate
     → fetch failed

Test Files  1 failed (1)
Tests  32 failed (32)
```

##### Testing Technologies

- **Vitest**: Modern testing framework with special integration configuration
- **Fetch**: No mocks, connects directly to backend
- **jsdom**: DOM environment for localStorage and browser APIs
- **cross-env**: Cross-platform environment variables

### Backend

#### Unit Tests

The backend has **42 unit tests** that validate business logic.

##### Test Categories

| Category | Tests | Description |
|----------|-------|-------------|
| **Utils - JWT** | 2 tests | JWT token creation and verification |
| **Utils - Validation** | 3 tests | Date, title and tag validation |
| **Utils - Response** | 8 tests | Standardized HTTP responses (200, 201, 400, 401, 404, 409, 500) |
| **Models - User** | 8 tests | Registration, login validations and transformations |
| **Models - Task** | 15 tests | Enum serialization, CRUD validations and filters |
| **Models - Notification** | 9 tests | WebSocket messages, serialization and structures |

##### How to Run

```bash
# Navigate to backend directory
cd backend

# Run all pure unit tests
cargo test

# Run specific tests by category
cargo test models_user_test
cargo test models_task_test
cargo test models_notification_test
cargo test utils_validation_test
cargo test utils_response_test
cargo test utils_jwt_test

# Run specific test by name
cargo test test_create_task_request_validation_valid
```

##### Expected Responses

**🟢 Successful Test Example:**
```bash
running 15 tests
test test_task_status_serialization ... ok
test test_task_priority_serialization ... ok
test test_create_task_request_validation_valid ... ok
test test_create_task_request_validation_title_too_short ... ok
test test_update_task_request_validation_all_none ... ok
...

test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

**🔴 Failed Test Example:**
```bash
running 8 tests
test test_create_user_request_validation_invalid_email ... FAILED

failures:
---- test_create_user_request_validation_invalid_email stdout ----
assertion failed: request.validate().is_err()

test result: FAILED. 7 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out
```

##### Testing Technologies

- **Cargo Test**: Rust's native framework with parallel execution
- **Validator**: Input validations with custom rules  
- **Serde JSON**: Structure serialization/deserialization
- **UUID**: Unique identifier generation for tests
- **Chrono**: Date and timestamp handling

##### Functionality Coverage

Tests cover all backend **business logic**:

- ✅ **Input validations** - Email, passwords, titles, dates
- ✅ **Data transformations** - User → UserResponse, Notification → NotificationResponse  
- ✅ **Serialization/Deserialization** - JSON ↔ Structs, Enums
- ✅ **HTTP responses** - Status codes and standardized formats
- ✅ **JWT tokens** - Creation, verification and claims handling
- ✅ **WebSocket Messages** - Ping/Pong, real-time notifications

