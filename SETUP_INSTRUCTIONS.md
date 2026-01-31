# Firebase Integration Setup Instructions

## Overview

The Construction Quality Pulse application has been updated with new Firebase credentials. This document provides step-by-step instructions to complete the setup and verify the integration.

## ✅ What Has Been Completed

1. **Environment Configuration**
   - Firebase credentials updated in `.env.local`
   - `NEXT_PUBLIC_FIREBASE_ENABLED=true` (authentication enabled)
   - New Firebase project: `newpr-17a5c`

2. **Code Updates**
   - Admin dashboard updated to use `api` instance
   - Engineer dashboard updated to use `api` instance
   - Both dashboards now properly use Firebase authentication

3. **Documentation Created**
   - `FIREBASE_SETUP.md` - Configuration reference
   - `TESTING_GUIDE.md` - Complete testing instructions
   - `FIREBASE_INTEGRATION_COMPLETE.md` - Implementation details
   - `test-integration.js` - Automated test script
   - `start-test.sh` - Quick start helper

4. **Existing Features Verified**
   - ✅ Firebase client SDK initialization
   - ✅ Authentication context provider
   - ✅ API token interceptor
   - ✅ Backend token verification
   - ✅ Login/logout flow
   - ✅ Bootstrap admin functionality
   - ✅ Role-based access control
   - ✅ Protected routes
   - ✅ Session persistence

## 🔴 Critical Setup Step Required

### Configure Firebase Admin Private Key

The backend requires a Firebase Admin SDK private key to verify authentication tokens. **This step is mandatory for the application to work.**

#### Get Your Private Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **newpr-17a5c**
3. Click the gear icon (⚙️) → **Project Settings**
4. Go to the **Service Accounts** tab
5. Click **Generate new private key**
6. A JSON file will be downloaded

#### Configure the Private Key

Open the downloaded JSON file and locate the `private_key` field. It will look like:
```json
{
  "type": "service_account",
  "project_id": "newpr-17a5c",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQ...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@newpr-17a5c.iam.gserviceaccount.com",
  ...
}
```

Copy the entire `private_key` value (including the quotes and `\n` characters).

#### Add to .env.local

Open `.env.local` and add/update these lines:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@newpr-17a5c.iam.gserviceaccount.com
```

**Important Notes:**
- Keep the quotes around the private key
- Don't remove the `\n` characters
- Use the exact `client_email` from your JSON file
- **Never commit this file to version control** (already in .gitignore)

## 🟡 Recommended Setup Steps

### Enable Email/Password Authentication in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **newpr-17a5c**
3. Go to **Authentication** → **Sign-in method**
4. Click on **Email/Password**
5. Enable the provider
6. Click **Save**

### Add Authorized Domains

1. In Firebase Console, go to **Authentication** → **Settings**
2. Under **Authorized domains**, add:
   - `localhost` (for development)
   - Your production domain (when deploying)

## 🚀 Testing the Integration

### Quick Start (Recommended)

Use the automated start script:

```bash
./start-test.sh
```

This will:
- Validate your configuration
- Start the backend server
- Start the frontend
- Provide next steps

### Manual Start

#### Terminal 1: Backend Server
```bash
npm install  # If you haven't already
npm run dev:backend
```

Expected output:
```
🚀 Server running on port 5000
Connected to MongoDB Atlas
```

#### Terminal 2: Frontend
```bash
npm run dev
```

Expected output:
```
▲ Next.js 15.x
- Local: http://localhost:3000
```

### Run Automated Tests

```bash
node test-integration.js
```

This will verify:
- ✅ Firebase credentials are configured
- ✅ Backend server is running
- ✅ Protected routes require authentication
- ✅ Invalid tokens are rejected

## 📋 Manual Testing Checklist

### 1. Bootstrap Admin Account (First Time Only)

1. Open browser: http://localhost:3000/bootstrap-admin
2. Fill in the form:
   - Name: Your Name
   - Email: admin@example.com
   - Password: (minimum 6 characters)
3. Click "Initialize System"
4. You should be redirected to login page

### 2. Test Login Flow

1. Go to: http://localhost:3000/login
2. Enter credentials from bootstrap step
3. Click "Sign In to Dashboard"
4. Verify you're redirected to `/admin` dashboard
5. Dashboard should load with analytics data

### 3. Verify API Integration

Open browser DevTools (F12) → Network tab:

1. Refresh the dashboard
2. Look for API calls to `http://localhost:5000/api/*`
3. Check request headers include: `Authorization: Bearer <token>`
4. Verify responses are successful (200 status)

### 4. Test Session Persistence

1. While logged in, refresh the page (F5)
2. You should remain logged in
3. Dashboard data should reload

### 5. Test Logout

1. Click your user menu (top right)
2. Click "Logout"
3. Verify redirect to `/login`
4. Try accessing `/admin` - should redirect to login

### 6. Create Engineer User

1. Login as admin
2. Go to "Manage Users"
3. Click "Create User"
4. Fill in:
   - Name: Test Engineer
   - Email: engineer@example.com
   - Password: password123
   - Role: **Engineer**
5. Click "Create User"

### 7. Test Engineer Login

1. Logout
2. Login with engineer credentials
3. Verify redirect to `/engineer` dashboard
4. Try accessing `/admin` - should redirect back to `/engineer`

## ✅ Verification Points

Your setup is successful if:

- [ ] Backend starts without Firebase errors
- [ ] Frontend starts without console errors
- [ ] Login authenticates successfully
- [ ] You're redirected to the correct dashboard
- [ ] Dashboard data loads
- [ ] API requests include Authorization header
- [ ] Session persists across page reloads
- [ ] Logout clears authentication
- [ ] Role-based access works (admin vs engineer)
- [ ] No errors in browser console during normal use

## 🐛 Troubleshooting

### Error: "Firebase not initialized"

**Cause**: Firebase is disabled or credentials are missing

**Solution**:
1. Check `.env.local` has `NEXT_PUBLIC_FIREBASE_ENABLED=true`
2. Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set
3. Restart the dev server

### Error: "Unauthorized: Invalid token"

**Cause**: Backend can't verify Firebase tokens

**Solution**:
1. Verify `FIREBASE_PRIVATE_KEY` is set in `.env.local`
2. Check the private key format (should have `\n` characters)
3. Verify `FIREBASE_PROJECT_ID=newpr-17a5c`
4. Restart the backend server

### Error: "Missing or invalid Firebase web config"

**Cause**: One or more frontend Firebase variables are empty

**Solution**:
1. Check all `NEXT_PUBLIC_FIREBASE_*` variables in `.env.local`
2. Verify API key starts with "AIza"
3. Verify auth domain includes "firebaseapp.com"
4. Restart the frontend

### Backend Won't Start

**Cause**: MongoDB connection or Firebase initialization failed

**Solution**:
1. Check `MONGODB_URI` in `.env.local`
2. Verify MongoDB Atlas is accessible
3. Check backend logs for specific error
4. Verify Firebase private key is valid

### Login Works But Dashboard Shows Errors

**Cause**: API calls failing

**Solution**:
1. Check browser console for errors
2. Verify backend is running on port 5000
3. Check Network tab for failed requests
4. Verify `NEXT_PUBLIC_API_URL=http://localhost:5000/api`

## 📖 Additional Resources

- **TESTING_GUIDE.md** - Comprehensive testing instructions
- **FIREBASE_SETUP.md** - Detailed configuration reference
- **FIREBASE_INTEGRATION_COMPLETE.md** - Implementation details

## 🎯 Next Steps After Setup

1. **Add More Users**
   - Create engineers via admin panel
   - Test different user roles

2. **Create Sites**
   - Add construction sites
   - Assign engineers to sites

3. **Submit QA Reports**
   - Login as engineer
   - Submit inspection reports
   - Upload photos

4. **Review Reports**
   - Login as admin
   - Approve/reject reports
   - View analytics

5. **Test Notifications**
   - Submit a report (triggers notification)
   - Check notification bell icon
   - Verify real-time updates

6. **Export Data**
   - Test CSV export
   - Test PDF export
   - Check audit logs

## 🚢 Production Deployment

When deploying to production:

1. **Environment Variables**
   - Set all Firebase credentials in production environment
   - Use secrets manager for private key
   - Update `NEXT_PUBLIC_API_URL` to production backend URL

2. **Firebase Console**
   - Add production domain to authorized domains
   - Enable Firebase App Check (recommended)
   - Set up monitoring

3. **Security**
   - Enable rate limiting
   - Set up logging and monitoring
   - Configure backup strategy
   - Test disaster recovery

4. **Verification**
   - Test complete login flow in production
   - Verify API calls work
   - Test role-based access
   - Check audit logging

## 📞 Support

If you encounter issues:

1. Run `node test-integration.js` to diagnose
2. Check browser console (F12) for errors
3. Check backend logs for server errors
4. Review Firebase Console for auth events
5. Verify MongoDB Atlas connection

## 🎉 Success!

Once you complete the setup steps above, your application will have:

- ✅ Complete Firebase authentication
- ✅ Frontend-backend integration
- ✅ Secure token-based API access
- ✅ Role-based dashboards
- ✅ Session persistence
- ✅ Real-time notifications
- ✅ Comprehensive audit logging

Happy testing! 🚀
