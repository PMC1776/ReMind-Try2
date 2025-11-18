# 🚀 Deploy Your Backend in 3 Minutes

## Step-by-Step Instructions

### 1. Create New Replit (1 minute)
1. Open a new tab: https://replit.com
2. Click "+ Create Repl"
3. Choose **"Node.js"** template
4. Name it: **remind-backend**
5. Click "Create Repl"

### 2. Copy Backend Files (1 minute)

In your new Replit, **delete** the existing `index.js` file, then create these two files:

#### Create file: `server.js`
**Copy the ENTIRE contents from:**
`backend/server.js` in this project

(It's about 600 lines - copy all of it!)

#### Create file: `package.json`
**Copy from:** `backend/package.json`

Or paste this:
```json
{
  "name": "remind-backend",
  "version": "1.0.0",
  "description": "ReMind Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5"
  }
}
```

#### Create file: `.env`
```
PORT=3000
JWT_SECRET=replace-with-secure-random-string
```

### 3. Run the Backend (30 seconds)

In the Replit Shell (bottom of screen):
```bash
npm install && node server.js
```

Or just click the green **"Run"** button!

You should see:
```
🚀 ReMind Backend Server running on port 3000
```

### 4. Get Your Backend URL (30 seconds)

At the top of the Replit window, you'll see a URL like:
```
https://remind-backend.your-username.repl.co
```

**Copy this entire URL!**

Test it by visiting:
```
https://remind-backend.your-username.repl.co/health
```

You should see:
```json
{"status":"healthy","users":0,"reminders":0,"uptime":123.45}
```

### 5. Update This Project (30 seconds)

Back in **THIS** Replit (your frontend), update `/utils/api.ts`:

Replace:
```typescript
const API_BASE_URL = "YOUR_BACKEND_URL_HERE";
```

With:
```typescript
const API_BASE_URL = "https://remind-backend.your-username.repl.co";
```

(Use YOUR actual backend URL from step 4!)

### 6. Restart Your App

Stop and restart `npm run dev` in this project.

## ✅ Done! Now Test It

1. Open your app on your phone (Expo Go)
2. Click "Sign Up"
3. Enter email: `test@example.com`
4. Enter password: `MySecure@Pass2024`
5. Click "Create Account"
6. Watch your **backend Replit console** for the verification code
7. Enter the code in the app
8. Save your recovery key
9. You're in! 🎉

## 🔍 Verification Code Location

The 6-digit code will appear in your **backend Replit's console** like this:
```
📧 EMAIL SENT TO: test@example.com
Subject: Verify Your Email - ReMind
Body: Your verification code is: 123456

This code will expire in 15 minutes.
```

## 🐛 Troubleshooting

### "Cannot find module"
Run `npm install` in the backend Replit

### "Port already in use"
Just click Stop then Run again in Replit

### Backend keeps sleeping
Replit free tier may sleep after inactivity. Click Run to wake it up.

For always-on backend:
- Upgrade to Replit Hacker plan, OR
- Use UptimeRobot.com to ping it every 5 minutes (free)

### Still getting "Network Error"
1. Make sure backend URL in `/utils/api.ts` matches your backend Replit URL exactly
2. Make sure backend Replit is running (shows green "Running" status)
3. Test backend URL in browser: `https://your-backend.repl.co/health`

## 📚 Files to Copy

From this project's `backend/` folder:
- ✅ server.js (required)
- ✅ package.json (required)
- ✅ .env (create new)
- ℹ️ README.md (optional - for reference)

## 🎯 Summary

- **Frontend Replit:** Your current project (React Native app)
- **Backend Replit:** New project you just created (Node.js API)
- **Connection:** Frontend calls backend via HTTPS URL

Both Repls need to be running for the app to work!

---

**Total time: ~3 minutes**
**Cost: FREE**

Once done, you can create accounts and use the app from your phone! 🚀
