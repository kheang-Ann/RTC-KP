# QR Code Attendance Scanner - Setup Guide

## Overview
This is a Vue.js-based attendance scanning system that uses QR codes. It works on both desktop and mobile devices with camera support.

## Features
- Real-time QR code scanning via camera
- Image upload for QR code scanning
- Manual code entry option
- Flash/torch support (on compatible devices)
- Fully responsive design (mobile, tablet, desktop)
- HTTPS support for iOS Safari camera access

## Prerequisites
- Node.js v20.19.0 or >=22.12.0
- npm (comes with Node.js)
- Modern browser with camera support
- Same WiFi network for mobile testing

## Installation

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install QR Scanner Library
```bash
npm install jsqr
```

### 4. Install HTTPS Plugin (Required for iOS/Mobile)
```bash
npm install -D @vitejs/plugin-basic-ssl
```

### 5. Optional: Install mkcert for Trusted SSL (Recommended)
This eliminates the certificate warning by creating locally-trusted certificates.

**Windows:**
```bash
winget install -e --id FiloSottile.mkcert
```

**Mac:**
```bash
brew install mkcert
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install mkcert

# Arch
sudo pacman -S mkcert
```

**After installation:**
```bash
# Install local CA
mkcert -install

# Generate certificates (in frontend directory)
cd frontend
mkcert localhost 127.0.0.1 192.168.1.2 ::1
```

This creates `localhost.pem` and `localhost-key.pem` files. Then update `vite.config.ts`:

```typescript
import fs from 'fs'
import path from 'path'

export default defineConfig({
  // ... other config
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
    },
    host: true,
  },
})
```

**Note:** If you skip mkcert, you'll need to accept certificate warnings in your browser (which is fine for development).

## Project Structure
```
frontend/
├── src/
│   ├── views/
│   │   └── AttendanceScan.vue    # Main QR scanner page
│   ├── router/
│   │   └── index.ts              # Route configuration
│   └── App.vue                   # Root component
├── vite.config.ts                # Vite config with HTTPS
└── package.json
```

## Running the Application

### Development Server (Desktop Only)
```bash
npm run dev
```
Access at: `http://localhost:5173/attendance-scan`

### Development Server (Mobile/iPhone Access)
```bash
npm run dev
```

The server will show network URLs like:
```
➜  Local:   https://localhost:5173/
➜  Network: https://192.168.1.2:5173/
➜  Network: https://172.25.176.1:5173/
```

## Testing on Mobile Devices

### iPhone/iOS (Safari)

1. **Ensure Same WiFi Network**
   - Connect your iPhone to the same WiFi as your computer

2. **Get Your Computer's IP**
   - On Windows: `ipconfig | Select-String -Pattern "IPv4"`
   - On Mac/Linux: `ifconfig | grep "inet "`

3. **Access from iPhone**
   - Open Safari
   - Visit: `https://YOUR-IP-ADDRESS:5173/attendance-scan`
   - Example: `https://192.168.1.2:5173/attendance-scan`

4. **Accept Certificate Warning**
   - Tap "Show Details"
   - Tap "visit this website"
   - Confirm by tapping "Visit Website"

5. **Allow Camera Permission**
   - Tap "Start Camera"
   - Allow camera access when prompted

### Android

1. Same WiFi network as your computer
2. Open Chrome
3. Visit: `https://YOUR-IP-ADDRESS:5173/attendance-scan`
4. Accept certificate warning
5. Allow camera permission

### Desktop (Chrome/Edge)

If you see "Not secure" warning:
- Click anywhere on page
- Type: `thisisunsafe` (no input box will appear)
- Page will reload

OR
- Click "Not secure" → "Site settings"
- Allow insecure content

## How to Use

### Camera Scanning
1. Click "Start Camera" button (green)
2. Point camera at QR code
3. QR code will be automatically detected
4. Camera turns red when active - click "Stop Camera" to stop

### Image Upload
1. Click "Upload QR Image" button (orange)
2. Select image from device
3. QR code will be detected from image

### Manual Entry
1. Click "Enter Code Manually" button (blue)
2. Type the attendance code
3. Press Enter or click "Submit"

### Flash/Torch
- Only available when camera is active
- Only works on devices with flash support
- Toggle on/off with "Flash: OFF/ON" button

## Dependencies

### Production Dependencies
```json
{
  "jsqr": "^1.x.x",           // QR code detection library
  "vue": "^3.5.26",           // Vue.js framework
  "vue-router": "^4.6.4",     // Routing
  "pinia": "^3.0.4"           // State management
}
```

### Development Dependencies
```json
{
  "@vitejs/plugin-basic-ssl": "^1.x.x",  // HTTPS for mobile testing
  "@vitejs/plugin-vue": "^6.0.3",        // Vue SFC support
  "vite": "^7.3.0",                       // Build tool
  "typescript": "~5.9.3"                  // TypeScript support
}
```

## Troubleshooting

### Camera Not Working on iPhone
**Problem:** Camera permission denied or not showing
**Solution:** 
- HTTPS is required (not HTTP)
- Accept the certificate warning
- Check Safari settings: Settings → Safari → Camera → Allow

### "Unable to access camera" Error
**Possible causes:**
1. Camera already in use by another app
2. Browser doesn't have camera permission
3. Using HTTP instead of HTTPS on mobile
4. Camera hardware not available

**Solutions:**
- Close other apps using camera
- Check browser permissions
- Use HTTPS URLs on mobile
- Try different browser

### Certificate Warning on Desktop
**Problem:** "Your connection is not secure" warning
**Solution:**
- Type `thisisunsafe` on the page
- OR use regular HTTP: `http://localhost:5173` (desktop only)

### QR Code Not Detected
**Problem:** Camera active but QR code not scanning
**Solutions:**
1. Ensure good lighting
2. Hold camera steady
3. Adjust distance from QR code
4. Make sure QR code is clear and not damaged
5. Try uploading image instead

### Network URL Not Working
**Problem:** Can't access from mobile using network URL
**Solution:**
1. Verify same WiFi network
2. Check firewall settings (may block port 5173)
3. Try different IP address shown in terminal
4. Restart dev server

## Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

For production deployment, configure proper SSL certificates (not self-signed).

## Security Notes

- Self-signed certificates are ONLY for development
- Production should use proper SSL/TLS certificates
- Camera access requires user permission
- QR codes are processed client-side (no data sent during scanning)

## Browser Compatibility

### Desktop
- ✅ Chrome 63+
- ✅ Edge 79+
- ✅ Firefox 68+
- ✅ Safari 11+

### Mobile
- ✅ iOS Safari 11+ (HTTPS required)
- ✅ Chrome for Android 63+
- ✅ Samsung Internet 7+

## API Integration (TODO)

Currently, scanned codes are logged to console. To integrate with backend:

1. Update `processAttendanceCode()` in `AttendanceScan.vue`
2. Add API call to your backend endpoint
3. Handle success/error responses
4. Update toast notifications

Example:
```typescript
const processAttendanceCode = async (code: string) => {
  try {
    const response = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, timestamp: new Date() })
    })
    
    if (response.ok) {
      showToast('Attendance recorded successfully', 'success')
    } else {
      showToast('Failed to record attendance', 'error')
    }
  } catch (error) {
    showToast('Network error', 'error')
  }
}
```

## Support

For issues or questions, contact the development team.

## License

[Your License Here]
