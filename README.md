# RTC-KP School Management System

A full-stack school management system built with **NestJS** (backend), **Vue 3** (frontend), and **PostgreSQL** (database).

---

## 📋 Features

- **User Management** — Admin, Teacher, Student roles with JWT authentication
- **Student Management** — CRUD operations, profiles, photos
- **Teacher Management** — Teacher profiles, assignments
- **Departments & Programs** — Academic department and program organization
- **Courses** — Course creation, assignments, credit hours
- **Groups** — Student group management
- **Schedules** — Class scheduling and timetables
- **Sessions** — Class session tracking with code generation
- **Attendance** — Mark and track student attendance
- **Leave Requests** — Student/teacher leave request system with approvals
- **E-Library** — Digital library with document uploads, cover images, categories
- **Library Requests** — Book borrowing system

---

## 👥 Role-Based Features

The system has three user roles, each with specific features and permissions.

### 🔑 Admin Role

Full system management with access to all features.

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview with statistics: total students, teachers, courses, library items |
| **Departments** | Create/edit/delete academic departments |
| **Programs** | Manage degree programs (Bachelor, Master, etc.) with duration and department |
| **Courses** | Create courses with code, name, credit hours, assign to programs |
| **Teachers** | Add/edit teacher profiles with photos, qualifications, contact info |
| **Students** | Full student management with program/group enrollment, photos |
| **Groups** | Create student groups by program and academic year, assign students |
| **Sessions** | Create class sessions for courses, generate attendance codes |
| **Attendance** | View all attendance records across courses, export reports |
| **Schedule** | Create and manage class timetables for all groups |
| **Leave Requests** | Review and approve/reject leave requests from students and teachers |
| **E-Library** | Upload documents (PDF, DOC, etc.) with cover images, manage categories |
| **Library Requests** | Review book requests, approve/reject with notes |
| **Profile** | Edit own admin profile |

### 👨‍🏫 Teacher Role

Class management and student interaction features.

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview of assigned courses, upcoming sessions, pending tasks |
| **Sessions** | Create sessions for assigned courses, generate QR codes for attendance |
| **Students** | View students enrolled in assigned courses |
| **Attendance** | Mark student attendance manually, view attendance history |
| **Schedule** | View personal teaching schedule |
| **Leave Requests** | Submit personal leave requests, view status |
| **E-Library** | Browse and download library resources |
| **Library Requests** | Submit requests for new books/materials, track request status |
| **Profile** | Edit personal profile and contact information |

**How Sessions Work:**
1. Teacher creates a session for their course
2. System generates a unique 6-character attendance code
3. Teacher can display QR code or share the code verbally
4. Students enter the code or scan QR to check in
5. Teacher can view real-time attendance and mark late/absent manually

### 🎓 Student Role

Course participation and personal management.

| Feature | Description |
|---------|-------------|
| **Dashboard** | Personal overview: enrolled courses, attendance stats, upcoming classes |
| **Check-In** | Enter attendance code manually OR scan QR code with camera |
| **Attendance** | View personal attendance history by course with Present/Absent/Late status |
| **Courses** | View enrolled courses with details (name, code, credits, teacher) |
| **Schedule** | View personal class timetable |
| **Leave Requests** | Submit leave requests with reason and supporting documents |
| **E-Library** | Browse, search, and download library resources |
| **Library Requests** | Request new books or materials, track request status |
| **Profile** | View and edit personal profile |

**How Check-In Works:**
1. **Code Entry**: Enter the 6-character code shown by teacher
2. **QR Scan**: Tap "Scan QR" tab, allow camera, point at QR code
3. System validates code and records attendance with timestamp
4. Student sees confirmation with course name and session

**Leave Request Process:**
1. Student submits request with: leave type (sick/annual/emergency), dates, reason
2. Optional: Upload supporting documents (medical certificate, etc.)
3. Admin reviews and approves/rejects with notes
4. Student can track status: Pending → Approved/Rejected

---

## 📚 Feature Details

### E-Library System

Digital library for books, documents, and research materials.

**Categories:**
- Book
- Document
- Publication
- Research Paper
- Guide
- Other

**Features:**
- Upload files (PDF, DOC, DOCX, XLSX, PPTX, TXT, ZIP)
- Add cover images (auto-resized to 600×900px, book cover ratio)
- Search by title, author, or description
- Filter by category
- Track view and download counts
- Edit/delete items (admin only for upload, all can browse)

### Attendance System

QR-based attendance with manual override options.

**Session Codes:**
- 6-character alphanumeric codes (e.g., `ABC123`)
- Time-limited: valid only during session
- Single-use per student per session

**Attendance Status:**
- ✅ Present — Checked in during allowed time
- ⏰ Late — Checked in after grace period
- ❌ Absent — No check-in recorded
- 📝 Excused — Approved leave request

### Leave Request System

Formal leave application with approval workflow.

**Leave Types:**
| Type | Use Case |
|------|----------|
| Sick | Illness, medical appointments |
| Annual | Personal vacation, family events |
| Emergency | Urgent family matters, accidents |
| Other | Miscellaneous (requires explanation) |

**Workflow:**
```
Student/Teacher submits → Admin reviews → Approved/Rejected
        ↓                      ↓                ↓
   Upload docs          Add review note    Status updated
```

---

## 🚀 Quick Start

### Installation

See **[SETUP.md](SETUP.md)** for complete installation instructions:

- **[Desktop Only Setup](SETUP.md#option-a-desktop-only-setup)** — run on your computer using `localhost`
- **[Desktop + Mobile Setup](SETUP.md#option-b-desktop--mobile-setup)** — also access from your phone

### Default Login

| Field    | Value            |
|----------|------------------|
| Email    | `admin@rtckp.kh` |
| Password | `helloworld`     |

---

## 🛠️ Tech Stack

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| Backend    | NestJS, TypeORM, Passport JWT, Multer + Sharp      |
| Frontend   | Vue 3, Vue Router, Vite, TypeScript                 |
| Database   | PostgreSQL 16                                       |
| Containers | Docker & Docker Compose                             |

---

## 📁 Project Structure

```
RTC-KP/
├── .env                       # DB, JWT, PORT config (you create)
├── docker-compose.yml         # Backend + PostgreSQL containers
│
├── backend/                   # NestJS API (runs in Docker)
│   ├── ssl/                   # SSL certificates (you create)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth          # Login, JWT
│   │   │   ├── users         # User accounts
│   │   │   ├── students      # Student CRUD
│   │   │   ├── teachers      # Teacher CRUD
│   │   │   ├── departments   # Departments
│   │   │   ├── programs      # Academic programs
│   │   │   ├── courses       # Courses
│   │   │   ├── groups        # Student groups
│   │   │   ├── schedules     # Class schedules
│   │   │   ├── sessions      # Class sessions
│   │   │   ├── attendances   # Attendance
│   │   │   ├── leave-requests# Leave requests
│   │   │   ├── library       # E-Library
│   │   │   └── library-requests # Borrow requests
│   │   └── main.ts           # Entry point, CORS
│   └── uploads/              # Uploaded files
│
└── frontend/                  # Vue 3 SPA (runs locally)
    ├── .env                   # VITE_API_URL (you create)
    └── src/
        ├── views/
        │   ├── admin/         # Admin pages
        │   ├── teacher/       # Teacher pages
        │   └── student/       # Student pages
        ├── services/          # API services
        └── router/            # Vue Router
```

---

### Common Commands

```bash
# Backend
docker compose up              # Start backend + database
docker compose up -d           # Start in background
docker compose restart         # Restart
docker compose logs -f backend # View logs
docker compose down            # Stop
docker compose down -v         # Stop & delete database

# Frontend
cd frontend
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run lint                   # Lint code
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Login fails | Visit backend URL first (`https://localhost:3000`) and accept the SSL certificate |
| Port conflict | `netstat -ano \| findstr :3000` then `taskkill /PID <PID> /F` |
| Backend won't start | Ensure Docker Desktop is running; check `docker compose logs backend` |
| Database error | Verify `.env` config; try `docker compose down -v && docker compose up --build` |
| Phone can't connect | See [SETUP.md - Desktop + Mobile](SETUP.md#option-b-desktop--mobile-setup) |

For more help, see **[SETUP.md](SETUP.md)**.

---

## 📝 License

Private project for RTC-KP.

---

## 👥 Contributors

- **Sam Sokleap**
- **Noch Munnyratanak**
- **Try Khemchhun**
- **Kheang ann**
- **Pon Pulprachgnar**