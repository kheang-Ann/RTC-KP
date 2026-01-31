# Mobile Browser Setup Guide

This guide explains how to access the application from your phone's browser (especially for camera access on iOS Safari).

## Why HTTPS is Required

- **Camera Access**: iOS Safari requires HTTPS to access device camera
- **Security**: Modern browsers block HTTP when accessing device features
- **Mixed Content**: HTTPS frontend cannot connect to HTTP backend

## Prerequisites

- Computer and phone on the same WiFi network
- OpenSSL installed (comes with Git for Windows)
- Backend running on port 3000
- Frontend running on port 5174

## Step-by-Step Setup

### 1. Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.0.154`)

**Mac/Linux:**
```bash
ifconfig
```

### 2. Generate SSL Certificates for Backend

Navigate to backend folder and create SSL certificates:

**Using PowerShell:**
```powershell
cd backend
mkdir ssl -Force
openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=YOUR_IP_ADDRESS"
```

**Using Git Bash:**
```bash
cd backend
mkdir -p ssl
openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "//CN=YOUR_IP_ADDRESS"
```

Replace `YOUR_IP_ADDRESS` with your actual IP (e.g., `192.168.0.154`)

### 3. Update Backend CORS Configuration

Edit `backend/src/main.ts` and update CORS origins:

```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://localhost:5174',
    'http://YOUR_IP_ADDRESS:5174',
    'https://YOUR_IP_ADDRESS:5174', // Important for phone
  ],
  methods: 'GET,PATCH,POST,DELETE',
  credentials: true,
});
```

Replace `YOUR_IP_ADDRESS` with your actual IP.

### 4. Configure Frontend Environment

Create or update `.env`:

```env
VITE_API_URL=https://YOUR_IP_ADDRESS:3000
```

Replace `YOUR_IP_ADDRESS` with your actual IP.

### 5. Enable HTTPS in Frontend Vite Config

Edit `frontend/vite.config.ts`:

```typescript
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    basicSsl(), // Enable HTTPS
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true,
    port: 5174,
    https: true, // Enable HTTPS
  },
})
```

### 6. Start the Servers

**Start Backend:**
```bash
cd backend
docker compose up -d
# or
npm run start:dev
```

You should see: `✓ HTTPS enabled with SSL certificates`

**Start Frontend:**
```bash
cd frontend
npm run dev
```

You should see the local network URL like: `https://192.168.0.154:5174`

### 7. Access from Phone

#### ⚠️ IMPORTANT: Accept Certificates FIRST

**You MUST visit both URLs separately to accept certificates BEFORE logging in!**

#### On iPhone Safari:

1. **Accept Backend Certificate (Port 3000) FIRST:**
   - Open Safari on your phone
   - Visit: `https://YOUR_IP_ADDRESS:3000`
   - Example: `https://192.168.0.154:3000`
   - You'll see "This Connection Is Not Private"
   - Tap **"Show Details"** → **"visit this website"** → **"Visit Website"**
   - You may see a NestJS error page or JSON - **that's OK!** Certificate is now trusted
   - **Do NOT skip this step** - backend must be trusted first

2. **Accept Frontend Certificate (Port 5174):**
   - In Safari, visit: `https://YOUR_IP_ADDRESS:5174`
   - Example: `https://192.168.0.154:5174`
   - Accept the certificate warning (same steps as above)
   - You should now see the login page

3. **Now Login and Use:**
   - Login with your credentials
   - **If login fails with "Load Failed"**: Go back to step 1 and make sure you accepted port 3000 certificate
   - Camera access will now work on Check In → Scan QR tab
   - Safari will ask for camera permission - tap **"Allow"**

#### On Android:

1. Visit `https://YOUR_IP_ADDRESS:3000` → Accept certificate
2. Visit `https://YOUR_IP_ADDRESS:5174` → Accept certificate
3. Login and use the app

## Troubleshooting

### "Load Failed" Error

**Cause**: Frontend (HTTPS) cannot connect to Backend
**Solutions**:
1. Make sure backend SSL certificates exist in `backend/ssl/` folder
2. Verify backend is running with HTTPS: Check logs for "✓ HTTPS enabled"
3. Ensure `.env` has `https://` (not `http://`)
4. Clear browser cache/cookies
5. Accept backend certificate first at `https://YOUR_IP:3000`

### Camera Not Working

**Cause**: iOS requires HTTPS for camera access
**Solutions**:
1. Verify you're accessing via `https://` (not `http://`)
2. Both frontend AND backend must use HTTPS
3. Accept certificate warnings on both URLs
4. Check Safari Settings → Privacy & Security → Camera

### "Cannot Connect" Error

**Solutions**:
1. Verify both devices on same WiFi network
2. Check firewall allows ports 3000 and 5174
3. Verify IP address hasn't changed (WiFi reconnect)
4. Restart both servers

### Mixed Content Error

**Cause**: Frontend using HTTPS but backend using HTTP
**Solution**: Both must use HTTPS - regenerate certificates and restart backend

## Files Changed Summary

1. **Backend SSL Certificates**: `backend/ssl/key.pem` & `backend/ssl/cert.pem`
2. **Backend CORS**: `backend/src/main.ts` - Update CORS origins
3. **Frontend Config**: `frontend/.env` - Set `VITE_API_URL`
4. **Frontend Vite**: `frontend/vite.config.ts` - Enable HTTPS

## Production Deployment

For production, use proper SSL certificates from:
- Let's Encrypt (free)
- Your domain provider
- AWS Certificate Manager
- Cloudflare

Do not use self-signed certificates in production!

## Security Notes

- Self-signed certificates are for development only
- Certificates expire in 365 days (regenerate annually)
- Keep `ssl/` folder in `.gitignore`
- Never commit private keys to version control
