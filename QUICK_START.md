# Quick Start Guide - ReMind App

## ✅ Backend is Ready!

Your backend server is now set up and ready to run.

## 🚀 Starting the Backend Server

### Terminal 1 - Start Backend Server

```bash
cd backend
npm start
```

You should see:
```
🚀 ReMind Backend Server running on port 3000
📍 Health check: http://localhost:3000/health
🔐 JWT Secret: ⚠️  USING DEFAULT - CHANGE IN PRODUCTION!

📝 In-memory database active (data will be lost on restart)
   Consider implementing PostgreSQL/MongoDB for production
```

**Keep this terminal running!**

---

### Terminal 2 - Start Expo App

In a new terminal:

```bash
npm run dev
```

Then:
1. Scan QR code with Expo Go app on your phone
2. Or press 'w' to open in web browser
3. Or press 'a' for Android emulator
4. Or press 'i' for iOS simulator

---

## 📱 Testing the App

### 1. Create Account

1. Click "Don't have an account? Sign up"
2. Enter email: `test@example.com`
3. Enter password: Must be 12+ characters with uppercase, lowercase, number, and special character
   - Example: `MySecure@Pass2024`
4. Confirm password
5. Click "Create Account"

### 2. Verify Email

**IMPORTANT:** The verification code will be printed in the **backend terminal** (not sent via email yet).

Look for something like:
```
📧 EMAIL SENT TO: test@example.com
Subject: Verify Your Email - ReMind
Body: Your verification code is: 123456

This code will expire in 15 minutes.
```

Enter the 6-digit code in the app.

### 3. Save Recovery Key

Your recovery key will be displayed. This is your **private encryption key**.

**Important:**
- Save it somewhere safe!
- You'll need it if you lose access to your account
- Without it, your encrypted data cannot be recovered

Check the box confirming you've saved it, then click "Continue".

### 4. You're In!

You should now be logged in and see the main app screen.

---

## 🔍 Checking If Everything Works

### Test Backend Health

Open a new terminal:
```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "healthy",
  "users": 1,
  "reminders": 0,
  "uptime": 123.45
}
```

### View Verification Codes

Verification codes are printed to the backend server console. Watch Terminal 1 for:
```
📧 EMAIL SENT TO: your-email@example.com
```

---

## 🐛 Troubleshooting

### Backend won't start

**Error: "Cannot find module 'express'"**
```bash
cd backend
npm install
```

**Error: "Port 3000 already in use"**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

Or change the port in `backend/.env`:
```
PORT=3001
```

And update `utils/api.ts`:
```typescript
const API_BASE_URL = "http://localhost:3001";
```

### App shows "Network Error"

1. **Make sure backend is running** (check Terminal 1)
2. **Check the URL in** `utils/api.ts` - should be `http://localhost:3000`
3. **For physical device testing:** Use your computer's IP address:
   ```typescript
   const API_BASE_URL = "http://192.168.1.XXX:3000";
   ```
   Find your IP:
   - Mac/Linux: `ifconfig | grep inet`
   - Windows: `ipconfig`

### "Weak Password" error

Password must have:
- At least 12 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-)

Example strong passwords:
- `MySecure@Pass2024`
- `Hello!World123`
- `Privacy#First2024`

### Can't see verification code

The code is printed in the **backend server terminal** (Terminal 1).

Scroll up in that terminal to find:
```
📧 EMAIL SENT TO: test@example.com
Subject: Verify Your Email - ReMind
Body: Your verification code is: 123456
```

### Code expired

Codes expire after 15 minutes. Click "Resend Code" to get a new one.

---

## 📝 Important Notes

### In-Memory Database

The backend currently uses in-memory storage. This means:
- ⚠️ **All data is lost when you restart the server**
- ✅ Perfect for development and testing
- ❌ Not suitable for production

To persist data, you'll need to implement a real database (see backend/README.md).

### Email Service

Verification codes are currently printed to console, not sent via email.

For production:
1. Set up SendGrid, AWS SES, or similar
2. Configure in `backend/server.js`
3. See backend/README.md for details

### Security

The current setup uses a default JWT secret. **Change this for production!**

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update `backend/.env`:
```
JWT_SECRET=your-generated-secret-here
```

---

## 🎯 Next Steps

1. ✅ Create an account
2. ✅ Verify your email
3. ✅ Save your recovery key
4. ✅ Explore the app!

For production deployment, see:
- `backend/README.md` - Backend deployment guide
- `SECURITY.md` - Security recommendations
- `SECURITY_IMPROVEMENTS.md` - Changes made

---

## 📚 Additional Resources

- **Backend API Documentation:** `backend/README.md`
- **Security Guide:** `SECURITY.md`
- **All Security Changes:** `SECURITY_IMPROVEMENTS.md`

---

## 🆘 Still Having Issues?

1. Make sure both terminals are running (backend + expo)
2. Check that backend shows "running on port 3000"
3. Try restarting both servers
4. Clear app data and try fresh signup
5. Check console logs in both terminals for errors

---

Happy coding! 🚀
