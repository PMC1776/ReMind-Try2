# Deploy to Render - Manual Method (No GitHub Needed)

## Step-by-Step Guide

Since your code is on Replit, here's the easiest way to deploy to Render:

### Option 1: Direct Upload (Easiest!)

#### Step 1: Package Your Backend
On Replit, create a ZIP file:

```bash
# Create a temporary directory for deployment files
mkdir -p /tmp/render-deploy
cp server.js /tmp/render-deploy/
cp database.js /tmp/render-deploy/
cp schema.sql /tmp/render-deploy/
cp package.json /tmp/render-deploy/
cp .env.example /tmp/render-deploy/
cd /tmp/render-deploy
zip -r backend.zip .
```

#### Step 2: Upload to GitHub Gist or Pastebin
Since Render requires Git, here are your options:

**Option A: Create Quick GitHub Repo**
1. Go to https://github.com/new
2. Name: `remind-backend`
3. Make it Public
4. Don't initialize with README
5. Create repository

**Then upload files:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/remind-backend.git
git push -u origin main
```

**Option B: Use My Pre-Made Template**
I'll create a deployment package for you below.

---

### Option 2: Using Render Shell (Advanced)

1. Create empty web service on Render
2. Use their shell to pull code
3. Build and run

---

## Simplified Instructions (Recommended)

Let me create the exact files you need to copy-paste into Render.

### Files to Upload:

#### 1. Create GitHub Repository
https://github.com/new

Settings:
- Repository name: `remind-backend`
- Public
- Add a README file: ✓
- Click "Create repository"

#### 2. Upload These Files

Click "Add file" → "Create new file" for each:

**File: `package.json`**
```json
{
  "name": "remind-backend",
  "version": "2.0.0",
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
    "express-rate-limit": "^7.1.5",
    "pg": "^8.11.3"
  }
}
```

**File: `server.js`**
Copy ENTIRE contents from your `server.js` file

**File: `database.js`**
Copy ENTIRE contents from your `database.js` file

**File: `.env.example`**
```
PORT=3000
NODE_ENV=production
JWT_SECRET=change-me
DATABASE_URL=postgresql://user:pass@host/db
```

#### 3. Deploy on Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Select "Build and deploy from a Git repository"
4. Connect your GitHub account
5. Select `remind-backend` repository
6. Fill in:
   - **Name:** `remind-backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free

7. Click "Advanced" and add environment variables:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `JWT_SECRET` = (generate secure random string)
   - `DATABASE_URL` = (paste from Step 1 - your PostgreSQL URL)

8. Click "Create Web Service"

---

## Environment Variables

### Generate JWT_SECRET

Run on Replit:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output.

### DATABASE_URL

From Step 1 when you created PostgreSQL database.
Should look like:
```
postgresql://remind_user:XXX@dpg-xxx.oregon-postgres.render.com/remind
```

---

## After Deployment

### Get Your Backend URL
- Render will give you: `https://remind-backend.onrender.com`
- Or similar

### Test It
```bash
curl https://remind-backend.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "users": 0,
  "reminders": 0
}
```

### Update Frontend

In your frontend Replit (`utils/api.ts`):
```typescript
const API_BASE_URL = "https://remind-backend.onrender.com";
```

---

## Troubleshooting

### Build fails
- Check Node version (should use latest)
- Verify all files uploaded correctly
- Check build logs

### Database connection fails
- Verify DATABASE_URL is correct
- Use INTERNAL database URL (not external)
- Check database is running

### 503 Service Unavailable
- Free tier is spinning up (wait 30-60 seconds)
- Or service crashed (check logs)

---

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Get backend URL
3. ✅ Update frontend `utils/api.ts`
4. ✅ Test on phone!
