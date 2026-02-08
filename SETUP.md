# RTC-KP Setup Guide

This guide covers two setup modes:

- **[Option A: Desktop Only](#option-a-desktop-only-setup)** — run and access on your computer using `localhost`
- **[Option B: Desktop + Mobile](#option-b-desktop--mobile-setup)** — also access from your phone using your computer's IP address

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — for backend & database
- [Node.js](https://nodejs.org/) v20+ — for the frontend
- [Git](https://git-scm.com/) — includes OpenSSL (needed for SSL certificates)

---

## Project Structure

```
RTC-KP/
├── .env                       ← you create this (DB, JWT, PORT config)
├── docker-compose.yml         # Runs backend + PostgreSQL in Docker
│
├── backend/                   # NestJS REST API (runs in Docker)
│   ├── Dockerfile
│   ├── ssl/                   ← you create this (SSL certificates)
│   │   ├── key.pem
│   │   └── cert.pem
│   ├── src/
│   │   ├── main.ts            # Entry point, CORS config
│   │   ├── config/            # DB & file upload config
│   │   └── modules/
│   │       ├── auth/          # Login, JWT authentication
│   │       ├── users/         # User accounts & roles
│   │       ├── students/      # Student CRUD
│   │       ├── teachers/      # Teacher CRUD
│   │       ├── departments/   # Departments
│   │       ├── programs/      # Academic programs
│   │       ├── courses/       # Courses
│   │       ├── groups/        # Student groups
│   │       ├── schedules/     # Class schedules
│   │       ├── sessions/      # Class sessions
│   │       ├── attendances/   # Attendance tracking
│   │       ├── leave-requests/# Leave requests
│   │       ├── library/       # E-Library resources
│   │       └── library-requests/ # Borrow requests
│   └── uploads/               # Uploaded files (images, documents)
│
└── frontend/                  # Vue 3 SPA (runs locally with Vite)
    ├── .env                   ← you create this (VITE_API_URL)
    ├── vite.config.ts         # Vite config (HTTPS, port)
    └── src/
        ├── views/
        │   ├── admin/         # Admin dashboard pages
        │   ├── teacher/       # Teacher pages
        │   └── student/       # Student pages
        ├── services/          # API service layer
        ├── router/            # Vue Router
        └── components/        # Shared components
```

---

## 1. Clone the Project

```bash
git clone https://github.com/kheang-Ann/RTC-KP.git
cd RTC-KP
```

---

## 2. Create Root `.env`

Create a `.env` file in the **project root** (`RTC-KP/.env`):

```env
# Database
DB_NAME=rtc_kp
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST_PORT=5432
DB_CONTAINER_PORT=5432
DATABASE_URL=postgres://postgres:postgres@postgres:5432/rtc_kp

# JWT
JWT_ACCESS_SECRET=your-secret-key-change-this
JWT_ACCESS_EXPIRES=60m

# Server
PORT=3000
```

> Make sure the password in `DATABASE_URL` matches `DB_PASSWORD`.

---

Now choose your setup mode:

---

# Option A: Desktop Only Setup

Use this if you only need to access the app from your computer's browser.

### A1. Create Frontend `.env`

Create `frontend/.env`:

```env
VITE_API_URL=https://localhost:3000
```

### A2. Generate SSL Certificates

**Windows PowerShell:**
```powershell
cd backend
mkdir ssl -Force
openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"
cd ..
```

**Git Bash / Mac / Linux:**
```bash
cd backend
mkdir -p ssl
openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "//CN=localhost"
cd ..
```

### A3. Start the Backend & Database

Make sure Docker Desktop is running:

```bash
docker compose up --build
```

Wait until you see:
```
✓ HTTPS enabled with SSL certificates
Nest application successfully started
```

> Add `-d` to run in background: `docker compose up --build -d`

### A4. Start the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

### A5. Accept the SSL Certificate

Since the backend uses a **self-signed certificate**, your browser will block API requests unless you accept it first.

> **⚠️ You MUST do this before using the app!**

1. **Visit the backend first:** open **https://localhost:3000** in your browser
   - You'll see _"Your connection is not private"_
   - Chrome: click **Advanced** → **Proceed to localhost (unsafe)**
   - A JSON error or blank page is fine — the certificate is now accepted

2. **Then visit the frontend:** open **https://localhost:5174**
   - Accept the certificate warning if prompted
   - You should see the login page

3. **Login** with default credentials:
   - Email: `admin@rtckp.kh`
   - Password: `helloworld`

> If you skip step 1, login will fail with a network error because the browser silently blocks requests to an untrusted HTTPS backend.

---

# Option B: Desktop + Mobile Setup

Use this if you also need to access the app from your phone (e.g. for QR camera scanning on iOS, which requires HTTPS).

### B1. Find Your Computer's IP Address

Your phone and computer must be on the **same WiFi network**.

```powershell
ipconfig          # Windows — look for "IPv4 Address"
```

Example IP: `192.168.0.154` — replace `YOUR_IP` below with your actual IP.

### B2. Create Frontend `.env`

Create `frontend/.env` using your IP:

```env
VITE_API_URL=https://YOUR_IP:3000
```

Example:
```env
VITE_API_URL=https://192.168.0.154:3000
```

### B3. Generate SSL Certificates with Your IP

**Windows PowerShell:**
```powershell
cd backend
mkdir ssl -Force
openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=YOUR_IP"
cd ..
```

**Git Bash / Mac / Linux:**
```bash
cd backend
mkdir -p ssl
openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "//CN=YOUR_IP"
cd ..
```

Example (replace with your IP):
```bash
openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=192.168.0.154"
```

### B4. Add Your IP to CORS

Edit `backend/src/main.ts` and add your IP to the CORS `origin` array:

```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://localhost:5174',
    'https://YOUR_IP:5174',     // ← add this line with your IP
  ],
  methods: 'GET,PATCH,POST,DELETE',
  credentials: true,
});
```

### B5. Start the Backend & Database

Make sure Docker Desktop is running:

```bash
docker compose up --build
```

Wait until you see:
```
✓ HTTPS enabled with SSL certificates
Nest application successfully started
```

### B6. Start the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

You should see:
```
Local:   https://localhost:5174/
Network: https://192.168.x.x:5174/
```

### B7. Accept SSL Certificates (Desktop)

> **⚠️ You MUST do this before using the app!**

1. Visit **https://YOUR_IP:3000** in your browser → accept the security warning
2. Visit **https://YOUR_IP:5174** → accept the warning → you'll see the login page

### B8. Accept SSL Certificates (Phone)

On your phone browser:

1. **Accept backend certificate first:**
   - Open Safari/Chrome → go to `https://YOUR_IP:3000`
   - **Safari**: tap _"Show Details"_ → _"visit this website"_ → _"Visit Website"_
   - **Chrome**: tap _"Advanced"_ → _"Proceed"_
   - A JSON error or blank page means it worked
   - **Hello World!** display on screen mean it worked

2. **Then open the frontend:**
   - Go to `https://YOUR_IP:5174`
   - Accept the certificate warning
   - You should see the login page

### B9. Configure Browser Privacy Settings

For camera/QR features to work in Browser, you need to adjust some privacy settings:

1. Open **Settings** app
2. Tap **Camera**
3. Select **"Ask"** or **"Allow"**
4. **"Turn off"** blocked cookie (if enable)

### B10. Login and Test

1. **Login** with:
   - Email: `admin@rtckp.kh`
   - Password: `helloworld`

2. **Test camera access:**
   - Go to Attendance or Check-in page
   - Tap the QR/Camera button
   - Browser should prompt "Allow camera access?" — tap **Allow**

> If camera still doesn't work, try: close Browser completely and clear cache, then reopen, and try again.

---

## Common Commands

```bash
# Start backend + database
docker compose up

# Start in background
docker compose up -d

# Rebuild backend (after package changes)
docker compose up --build

# Restart backend only
docker compose restart backend

# View backend logs
docker compose logs -f backend

# Stop everything
docker compose down

# Full reset (deletes database data)
docker compose down -v
docker compose up --build

# Start frontend
cd frontend && npm run dev

# Build frontend for production
cd frontend && npm run build
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Login fails / network error | Visit `https://localhost:3000` (or `https://YOUR_IP:3000`) first and accept the certificate |
| Backend won't start | Make sure Docker Desktop is running; check `docker compose logs backend` |
| "Port already in use" | `netstat -ano \| findstr :3000` then `taskkill /PID <PID> /F` |
| Database connection error | Check `.env` passwords match; try `docker compose down -v && docker compose up --build` |
| Phone can't connect | Same WiFi? Correct IP? CORS updated in `main.ts`? Certificates regenerated with IP? |
| Camera not working on phone | 1) Use `https://` (not `http://`) 2) Accept both certificates 3) **iOS**: Settings > Safari > Turn OFF "Prevent Cross-Site Tracking" 4) Settings > Privacy & Security > Camera > Enable Safari |
| Safari shows blank page | Accept certificate for both `:3000` and `:5174`; disable "Block All Cookies" in Safari settings |
| IP address changed | Re-run `ipconfig`, update `frontend/.env`, regenerate SSL cert, update CORS, restart both servers |

---

## Default Credentials

| Field    | Value            |
|----------|------------------|
| Email    | `admin@rtckp.kh` |
| Password | `helloworld`     |
