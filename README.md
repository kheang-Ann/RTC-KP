# RTC-KP School Management System

A comprehensive school management system built with Vue 3 frontend and NestJS backend. This system manages students, teachers, courses, attendance, schedules, and includes an E-Library with cover image support.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Quick Start with Docker](#quick-start-with-docker)
- [Manual Setup](#manual-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Testing Features](#testing-features)
- [Troubleshooting](#troubleshooting)
- [Default Credentials](#default-credentials)

## Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Sharp (image processing)
- **Port**: 3000

### Frontend
- **Framework**: Vue 3
- **Build Tool**: Vite
- **Language**: TypeScript
- **HTTP Client**: Fetch API
- **Styling**: CSS3
- **Port**: 5174

### Database
- **Type**: PostgreSQL
- **Port**: 5435
- **Container**: Docker

## Prerequisites

### Option 1: Docker Setup (Recommended)
- Docker Desktop installed and running
- Docker Compose v1.29+
- ~2GB free disk space

### Option 2: Manual Setup
- Node.js 18+ and npm
- PostgreSQL 13+
- Git

## Project Structure

```
RTC-KP/
├── backend/                    # NestJS backend application
│   ├── src/
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/          # Authentication
│   │   │   ├── users/         # User management
│   │   │   ├── students/      # Student management
│   │   │   ├── teachers/      # Teacher management
│   │   │   ├── courses/       # Course management
│   │   │   ├── library/       # E-Library (with cover images)
│   │   │   └── ...            # Other modules
│   │   └── config/            # Configuration files
│   ├── package.json
│   ├── Dockerfile
│   └── tsconfig.json
├── frontend/                   # Vue 3 frontend application
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── views/             # Page components
│   │   │   ├── admin/         # Admin dashboard views
│   │   │   ├── teacher/       # Teacher views
│   │   │   └── student/       # Student views
│   │   ├── services/          # API services
│   │   ├── router/            # Vue Router
│   │   └── assets/            # Styles and images
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── docker-compose.yml         # Docker services configuration
└── .env                        # Environment variables
```

## Quick Start with Docker (Recommended)

This is the easiest way to get the application running.

### 1. Clone and Navigate to Project
```bash
cd RTC-KP
```

### 2. Create Environment File
Create a `.env` file in the root directory with the following content:

```bash
# Backend Configuration
NODE_ENV=development
PORT=3000
JWT_ACCESS_SECRET=rtc-kp-super-secret-jwt-key-2024
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_SECRET=rtc-kp-super-secret-refresh-key-2024
JWT_REFRESH_EXPIRATION=7d

# Database Configuration
DATABASE_URL=postgresql://postgres:password@rtc_kp_pg:5435/rtc_kp_db
DB_HOST=rtc_kp_pg
DB_PORT=5435
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=rtc_kp_db

# Frontend Configuration
VITE_API_URL=http://localhost:3000
```

⚠️ **Important**: Change the JWT secrets and database password for production use!

### 3. Start Docker Services
```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database on port 5435
- Start NestJS backend on port 3000
- Start Vue.js development server on port 5174

Wait 15-20 seconds for all services to fully initialize.

### 4. Verify Services Are Running
```bash
docker-compose ps
```

All three containers should show "Up" status:
```
NAME                COMMAND                  SERVICE             STATUS
rtc_kp_backend      node dist/main.js        backend             Up
rtc_kp_pg           postgres                 postgres            Up
rtc_kp_frontend     npm run dev              frontend            Up
```

### 5. Access the Application

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3000
- **Database**: PostgreSQL on localhost:5435

## Manual Setup (Without Docker)

Follow this if you prefer to run services locally without Docker.

### Backend Setup

#### 1. Navigate to Backend Directory
```bash
cd backend
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Create Backend Environment File
Create `backend/.env`:
```bash
NODE_ENV=development
PORT=3000
JWT_ACCESS_SECRET=rtc-kp-super-secret-jwt-key-2024
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_SECRET=rtc-kp-super-secret-refresh-key-2024
JWT_REFRESH_EXPIRATION=7d
DATABASE_URL=postgresql://postgres:password@localhost:5435/rtc_kp_db
DB_HOST=localhost
DB_PORT=5435
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=rtc_kp_db
```

#### 4. Setup PostgreSQL Database

**On Windows:**
1. Open pgAdmin or PostgreSQL shell
2. Run:
```sql
CREATE DATABASE rtc_kp_db;
```

**Using psql command line:**
```bash
psql -U postgres
CREATE DATABASE rtc_kp_db;
\q
```

**Verify connection:**
```bash
psql -U postgres -d rtc_kp_db -h localhost
```

#### 5. Start Backend Development Server
```bash
npm run start:dev
```

Backend will start on http://localhost:3000

You should see output like:
```
[Nest] 34 - 02/03/2026, 12:40:18 PM LOG [NestApplication] Nest application successfully started +5ms
```

### Frontend Setup

#### 1. Navigate to Frontend Directory
```bash
cd frontend
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Create Frontend Environment File
Create `frontend/.env.local`:
```bash
VITE_API_URL=http://localhost:3000
```

#### 4. Start Frontend Development Server
```bash
npm run dev
```

Frontend will start on http://localhost:5174

You should see output showing the local development URL.

## Environment Configuration

### Backend `.env` File - Complete Reference

Create or edit `backend/.env` with these variables:

```bash
# Application Environment
NODE_ENV=development              # development or production

# Server Configuration
PORT=3000                         # Backend server port

# JWT Authentication
JWT_ACCESS_SECRET=your-secret-key-here                # Change this! Min 32 chars recommended
JWT_ACCESS_EXPIRATION=1h          # Token expiration time
JWT_REFRESH_SECRET=your-refresh-secret-here           # Change this! Min 32 chars recommended
JWT_REFRESH_EXPIRATION=7d         # Refresh token expiration

# PostgreSQL Database Connection
DATABASE_URL=postgresql://postgres:password@localhost:5435/rtc_kp_db
DB_HOST=localhost                 # localhost for manual, rtc_kp_pg for Docker
DB_PORT=5435                      # PostgreSQL port
DB_USERNAME=postgres              # Database user
DB_PASSWORD=password              # Database password (change in production!)
DB_DATABASE=rtc_kp_db             # Database name
```

### Frontend `.env.local` File - Complete Reference

Create or edit `frontend/.env.local`:

```bash
# Backend API URL
VITE_API_URL=http://localhost:3000    # Backend address
```

### Environment Variables Explanation

| Variable | Purpose | Example | Notes |
|----------|---------|---------|-------|
| NODE_ENV | Environment mode | development | Set to "production" for deployment |
| PORT | Backend server port | 3000 | Must match frontend VITE_API_URL |
| JWT_ACCESS_SECRET | Encrypts access tokens | random-string | Change to secure random string |
| JWT_ACCESS_EXPIRATION | How long tokens last | 1h | 1 hour recommended |
| JWT_REFRESH_SECRET | Encrypts refresh tokens | random-string | Change to secure random string |
| JWT_REFRESH_EXPIRATION | How long refresh tokens last | 7d | 7 days recommended |
| DATABASE_URL | Full PostgreSQL connection string | postgresql://... | Format: postgresql://user:pass@host:port/db |
| DB_HOST | Database server address | localhost | For Docker: rtc_kp_pg |
| DB_PORT | Database port | 5435 | Default PostgreSQL port is 5432 |
| DB_USERNAME | Database user | postgres | Don't use default in production |
| DB_PASSWORD | Database password | password | Change in production! |
| DB_DATABASE | Database name | rtc_kp_db | Must be created before starting |
| VITE_API_URL | Backend URL for frontend | http://localhost:3000 | Must match where backend is running |

## Database Setup

### Automatic Setup with Docker
Database is automatically created and seeded when running:
```bash
docker-compose up -d
```

### Manual Database Setup

#### Step 1: Create Database
```bash
# Using psql
psql -U postgres -c "CREATE DATABASE rtc_kp_db;"

# Or using PostgreSQL admin tool (pgAdmin)
# Right-click Databases > Create > Database
# Name: rtc_kp_db
```

#### Step 2: Start Backend
```bash
cd backend
npm run start:dev
```

TypeORM will automatically:
- Create all tables
- Run seeders to create roles and default admin user

#### Step 3: Verify Database
```bash
# Connect to database
psql -U postgres -d rtc_kp_db

# List tables
\dt

# View roles
SELECT * FROM roles;

# View admin user
SELECT id, email FROM users LIMIT 1;

# Exit
\q
```

### Database Seeders

The application automatically runs seeders on startup:

1. **RoleSeeder**: Creates user roles
   - admin
   - teacher
   - student

2. **AdminSeeder**: Creates default admin user
   - Email: admin@rtckp.kh
   - Password: helloworld

## Running the Application

### With Docker Compose (Recommended)

#### Start All Services
```bash
docker-compose up -d
```

#### View Logs
```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

#### Stop Services
```bash
docker-compose down
```

#### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
docker-compose restart frontend
```

#### Force Rebuild
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Without Docker (Multiple Terminals)

#### Terminal 1 - Backend
```bash
cd backend
npm run start:dev
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

#### Terminal 3 - PostgreSQL (if running locally)
```bash
# Make sure PostgreSQL is running on port 5435
# Windows: PostgreSQL service should start automatically
# Mac: brew services start postgresql
# Linux: sudo service postgresql start
```

## Testing Features

### Initial Login
1. Navigate to http://localhost:5174
2. Login with default credentials:
   - **Email**: admin@rtckp.kh
   - **Password**: helloworld
3. You should see the admin dashboard

### 1. E-Library Feature (Main Feature)

#### Upload a Book/Document
1. Go to **Library Uploads** from sidebar menu
2. Fill in the form:
   - **Title** (required): e.g., "Fahrenheit 451"
   - **Author** (optional): e.g., "Ray Bradbury"
   - **Category** (required): Choose from:
     - Book
     - Document
     - Publication
     - Research Paper
     - Guide
     - Other
   - **Description** (optional): Brief summary
3. Click the **📁 Click to upload or drag and drop** area to select file
   - Supported: PDF, DOC, DOCX, XLSX, PPTX, TXT, ZIP
4. Click the **🖼️ Click to upload cover image** area (optional)
   - Supported: JPEG, PNG, WebP
   - Will be auto-resized to 600x900px (book cover ratio)
5. Click **⬆️ Upload Item** button
6. Wait for success message

#### View Library Items
1. Go to **E-Library** from sidebar
2. See uploaded items in grid view with:
   - Cover image (6:9 ratio book cover)
   - Title and author
   - Category badge
   - View count and download count
3. **Search**: Type in search box to find books
4. **Filter**: Select category to filter by type
5. Click **View** button on any item to see details

#### View Item Details
1. Click **View** on any library item
2. Modal shows:
   - Full cover image
   - Complete description
   - File size and upload date
   - View/download counts
3. Download file button available
4. **Edit** button - Change title, author, category, description
5. **Delete** button - Remove item with confirmation

#### Test Edit Feature
1. Open item detail modal
2. Click **Edit** button
3. Change any field:
   - Title
   - Author
   - Category
   - Description
4. Click **Save Changes**
5. Return to verify changes applied

#### Test Delete Feature
1. Open item detail modal
2. Click **Delete** button
3. Confirm deletion
4. Item should be removed from library

#### Verify Features
- ✓ File uploads successfully
- ✓ Cover image displays in 6:9 ratio (not square)
- ✓ Cover image is auto-resized and compressed
- ✓ Description hidden in list view, visible in detail view
- ✓ Search/filter works correctly
- ✓ Edit functionality updates all fields
- ✓ Delete removes item permanently
- ✓ Edit and Delete buttons have proper spacing
- ✓ View count increments when opening item

### 2. Programs Management
1. Go to **Programs** from sidebar
2. Click **+ Add Program** button
3. Enter program details:
   - Program name
   - Duration in years
   - Degree type (Bachelor, Master, etc.)
   - Department
4. Click to create program
5. Test **Edit** button - Verify button spacing ✓
6. Test **Delete** button with confirmation
7. Verify consistent button styling across page

### 3. Departments
1. Navigate to **Departments**
2. Create new department
3. Edit department info
4. Delete department
5. Verify button spacing and alignment

### 4. Courses
1. Go to **Courses**
2. Add new course with:
   - Course code
   - Course name
   - Credit hours
   - Program assignment
3. Edit course details
4. Delete courses
5. Check button consistency

### 5. Students
1. Navigate to **Students**
2. Create student with:
   - Full name
   - Email
   - Phone
   - Program enrollment
   - Group assignment
3. Edit student information
4. View student details
5. Delete students
6. Test search/filter functionality

### 6. Teachers
1. Go to **Teachers**
2. Add teacher with:
   - Name
   - Email
   - Phone
   - Department assignment
   - Qualifications
3. Edit teacher details
4. Delete teachers
5. View teacher assignments

### 7. Groups
1. Navigate to **Groups**
2. Create group for program and year
3. Manage students in group:
   - Click **Students** button to add/remove
4. Edit group details
5. Delete groups
6. Verify multi-button layout (Students, Edit, Delete)

### 8. Sessions
1. Go to **Sessions**
2. View current sessions
3. Create new session with:
   - Session name/code
   - Start date
   - End date
   - Academic year
4. Generate session codes
5. Edit session details
6. Delete sessions

### 9. Attendance
1. Navigate to **Attendance**
2. Mark attendance:
   - Select student/session
   - Mark present/absent/late/excused
3. View attendance reports
4. Edit attendance records
5. Delete incorrect entries

### 10. Schedules
1. Go to **Schedule**
2. View class schedules
3. Create schedule entry:
   - Select course
   - Select group
   - Select teacher
   - Set days and times
4. Edit schedule
5. Delete schedule

### 11. Dashboard Overview
1. Check **Dashboard**
2. Verify quick action cards:
   - Students
   - Teachers
   - Courses
   - E-Library (new!)
3. Check statistics and recent activities
4. All quick actions should navigate correctly

## Troubleshooting

### Issue: Docker containers won't start
```bash
# Check port conflicts
netstat -ano | findstr :3000
netstat -ano | findstr :5174
netstat -ano | findstr :5435

# Kill process on port (Windows PowerShell Admin)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or use different ports in docker-compose.yml
```

### Issue: Backend connection error when starting Docker
```bash
# Wait a bit longer for services to start
sleep 30
docker-compose ps

# If still failing, check logs
docker-compose logs backend
```

### Issue: Database connection refused
```bash
# Check database is running
docker-compose ps | grep postgres

# Check database logs
docker logs rtc_kp_pg

# Verify DATABASE_URL format in .env:
# postgresql://postgres:password@rtc_kp_pg:5435/rtc_kp_db
```

### Issue: Frontend shows blank page or 404
```bash
# Clear browser cache
# Press Ctrl+Shift+Delete > Clear All

# Reload page
# Press Ctrl+Shift+R (hard refresh)

# Check console for errors
# Press F12 > Console tab
# Look for red error messages
```

### Issue: Cannot login with admin credentials
```bash
# Check admin user was created
docker exec rtc_kp_backend npm run typeorm:query "SELECT * FROM users"

# Seed admin again
docker-compose down
docker-compose up -d
# Wait 20 seconds for seeding

# Check backend logs
docker logs rtc_kp_backend | grep -i admin
```

### Issue: File upload not working
```bash
# Check logs for error
docker logs rtc_kp_backend | grep -i "upload\|error"

# Verify uploads directory
docker exec rtc_kp_backend ls -la /app/uploads/library/

# Check file permissions
docker exec rtc_kp_backend chmod 755 /app/uploads/library/
```

### Issue: Cover image not displaying
```bash
# Check if file exists
docker exec rtc_kp_backend ls -la /app/uploads/library/ | grep webp

# Test endpoint
curl http://localhost:3000/library/1/cover

# Check browser console (F12) for errors
# Look at Network tab > library/{id}/cover
```

### Issue: "Port already in use" error
```bash
# Find and kill process using port
# For port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# For port 5174
netstat -ano | findstr :5174
taskkill /PID <PID> /F

# For port 5435
netstat -ano | findstr :5435
taskkill /PID <PID> /F
```

### Issue: Backend crashes after file upload
```bash
# Check Sharp library is installed
docker exec rtc_kp_backend npm list sharp

# Install Sharp if missing
docker exec rtc_kp_backend npm install sharp

# Rebuild container
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Issue: "Module not found" errors
```bash
# For backend
cd backend
npm install
npm run build
npm run start:dev

# For frontend
cd frontend
npm install
npm run dev
```

### Issue: Database tables not created
```bash
# Check TypeORM synchronize setting (should be true)
# Edit backend/src/app.module.ts

# Manually run migrations
docker-compose down
docker-compose up -d
docker logs rtc_kp_backend | grep -i "synchronize\|creating\|table"
```

### Quick Diagnostics Checklist

```bash
# 1. Are all services running?
docker-compose ps

# 2. Can you reach the backend?
curl http://localhost:3000

# 3. Can you reach the frontend?
curl http://localhost:5174

# 4. Is database connected?
docker exec rtc_kp_pg psql -U postgres -d rtc_kp_db -c "SELECT 1"

# 5. Check all logs
docker-compose logs --tail=50

# 6. Try fresh restart
docker-compose down -v
docker-compose up -d
```

## Default Credentials

After initial setup, login with:

| Field | Value |
|-------|-------|
| Email | admin@rtckp.kh |
| Password | helloworld |

⚠️ **IMPORTANT**: Change these credentials immediately in production!

## Production Deployment

### Before Going Live

1. **Generate Secure JWT Secrets**
```bash
# On any machine with Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **Update Environment Variables**
```bash
NODE_ENV=production
JWT_ACCESS_SECRET=<newly-generated-secret>
JWT_REFRESH_SECRET=<newly-generated-secret>
# Use strong database password
DB_PASSWORD=<strong-password-here>
```

3. **Enable HTTPS**
- Obtain SSL certificate
- Configure HTTPS in frontend server (Nginx/Apache)
- Update VITE_API_URL to use HTTPS

4. **Setup Database Backups**
```bash
# Regular PostgreSQL backups
docker exec rtc_kp_pg pg_dump -U postgres rtc_kp_db > backup.sql
```

5. **Configure CORS**
- Update backend CORS settings for production domain
- Set specific allowed origins (not *)

6. **Enable File Upload Limits**
- Configure max upload file size
- Implement virus scanning for uploads

## Performance Optimization

1. **Database Indexing**
```sql
CREATE INDEX idx_students_program_id ON students(program_id);
CREATE INDEX idx_library_category ON library_items(category);
CREATE INDEX idx_attendance_session_id ON attendances(session_id);
```

2. **Image Optimization**
- Cover images automatically resized to 600x900px
- Stored as WebP format (higher compression)
- Consider CDN for image serving

3. **Frontend Performance**
- Use production build: `npm run build`
- Enable gzip compression
- Minify assets
- Consider lazy loading routes

4. **Backend Performance**
- Enable query logging (development only)
- Implement pagination for large datasets
- Cache frequently accessed data
- Consider Redis for session storage

## Support & Help

### Documentation Files
- Backend: See `backend/README.md`
- Frontend: See `frontend/README.md`

### Common Commands

```bash
# View running services
docker-compose ps

# View logs
docker-compose logs -f backend

# Access database CLI
docker exec -it rtc_kp_pg psql -U postgres -d rtc_kp_db

# Execute backend commands
docker exec rtc_kp_backend npm run <command>

# Restart specific service
docker-compose restart backend

# Remove all containers and data
docker-compose down -v
```

### Getting More Help

1. Check Docker logs: `docker-compose logs`
2. Check browser console: Press F12
3. Check database: Access via pgAdmin (localhost:5050 if using docker pgadmin)
4. Review error messages carefully
5. Google the error message