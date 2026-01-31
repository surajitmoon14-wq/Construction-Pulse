# Firebase Integration Testing Guide

This guide will help you verify the complete Firebase authentication integration for the Construction Quality Pulse application.

## Prerequisites

1. Node.js and npm installed
2. MongoDB Atlas connection configured
3. Firebase project credentials (already configured in `.env.local`)

## Environment Configuration

The following Firebase credentials have been configured in `.env.local`:

```
NEXT_PUBLIC_FIREBASE_ENABLED=true
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAQRxsJIGtIIAWCuoPhceDP8XWocuo__TU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=newpr-17a5c.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=newpr-17a5c
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=newpr-17a5c.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=310429401725
NEXT_PUBLIC_FIREBASE_APP_ID=1:310429401725:web:25887550126901fd5b6714
```

## Firebase Admin SDK Setup

**IMPORTANT**: You need to configure the Firebase Admin SDK private key to enable backend token verification.

### Getting Your Firebase Private Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `newpr-17a5c`
3. Click on the gear icon (⚙️) → Project Settings
4. Go to the "Service Accounts" tab
5. Click "Generate new private key"
6. Download the JSON file

### Configuring the Private Key

Add the following to your `.env.local` file (or set as environment variable):

```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

**Note**: Make sure to:
- Keep the quotes around the key
- Preserve the `\n` characters for line breaks
- Never commit this key to version control

Alternatively, for the backend server, you can create a `server/.env` file with the same Firebase Admin credentials.

## Testing Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Backend Server

In one terminal:

```bash
npm run dev:backend
```

Expected output:
```
🚀 Server running on port 5000
Connected to MongoDB Atlas
```

### 3. Run Integration Tests

In another terminal:

```bash
node test-integration.js
```

This will verify:
- ✅ Firebase credentials are properly configured
- ✅ Backend server is running
- ✅ Firebase Admin SDK is initialized
- ✅ Protected routes require authentication
- ✅ Invalid tokens are rejected

### 4. Start the Frontend

In a third terminal:

```bash
npm run dev
```

Expected output:
```
▲ Next.js 15.x
- Local: http://localhost:3000
```

### 5. Test Bootstrap Flow (First Time Only)

1. Open browser to: `http://localhost:3000/bootstrap-admin`
2. Create the first admin account:
   - Name: Your Name
   - Email: admin@example.com
   - Password: (minimum 6 characters)
3. Click "Initialize System"
4. You should be redirected to `/login?bootstrapped=true`

**Note**: After the first admin is created, the bootstrap page will be permanently disabled.

### 6. Test Login Flow

1. Navigate to: `http://localhost:3000/login`
2. Enter your credentials (email and password from bootstrap)
3. Click "Sign In to Dashboard"

**Expected behavior**:
- Firebase authenticates the user
- Frontend receives Firebase ID token
- User is redirected to `/admin` dashboard
- Dashboard loads successfully with user data

### 7. Test Protected Routes

**Admin Dashboard**: `http://localhost:3000/admin`
- Should show admin dashboard with analytics
- Should display sites, reports, and user management options

**Engineer Dashboard**: `http://localhost:3000/engineer`
- Create an engineer user first via Admin → Users
- Login as engineer
- Should show engineer-specific dashboard

### 8. Test API Integration

Open browser DevTools (F12) → Network tab:

1. Login and observe the network requests
2. Look for API calls to `http://localhost:5000/api/*`
3. Verify requests include `Authorization: Bearer <token>` header
4. Verify successful responses (200 status)

### 9. Test Logout

1. Click user menu (top right)
2. Click "Logout"
3. Verify you're redirected to `/login`
4. Verify you can't access `/admin` or `/engineer` without logging in

### 10. Test Session Persistence

1. Login to the dashboard
2. Refresh the page (F5)
3. Verify you remain logged in
4. Verify dashboard data loads correctly

### 11. Test Role-Based Access

**Create an Engineer User**:
1. Login as admin
2. Go to "Manage Users"
3. Create a new user with role "engineer"
4. Logout

**Test Engineer Access**:
1. Login with engineer credentials
2. Verify redirect to `/engineer` dashboard
3. Try accessing `/admin` directly
4. Should be redirected back to `/engineer`

### 12. Test Error Handling

**Invalid Credentials**:
1. Go to login page
2. Enter wrong password
3. Should see error message: "Login failed"

**Network Failure**:
1. Stop the backend server
2. Try to login
3. Should see appropriate error message

**Firebase Disabled** (optional test):
1. Set `NEXT_PUBLIC_FIREBASE_ENABLED=false` in `.env.local`
2. Restart frontend
3. Try to login
4. Should see: "Firebase authentication is disabled"

## Verification Checklist

- [ ] Environment variables configured correctly
- [ ] Backend server starts without errors
- [ ] Firebase Admin SDK initializes successfully
- [ ] Bootstrap flow creates first admin (one-time)
- [ ] Login flow authenticates with Firebase
- [ ] Firebase ID token is obtained after login
- [ ] API requests include Authorization header
- [ ] Backend validates Firebase tokens
- [ ] Protected routes require authentication
- [ ] Role-based access control works (admin/engineer)
- [ ] Session persists across page refreshes
- [ ] Logout clears authentication state
- [ ] No console errors during normal usage
- [ ] Dashboard data loads correctly after login
- [ ] Socket.IO notifications connect successfully

## Common Issues and Solutions

### Issue: "Firebase not initialized"

**Solution**: Verify `NEXT_PUBLIC_FIREBASE_ENABLED=true` in `.env.local` and restart the dev server.

### Issue: "Missing or invalid Firebase web config"

**Solution**: Check all `NEXT_PUBLIC_FIREBASE_*` variables are set and not empty.

### Issue: "Unauthorized: Invalid token"

**Solution**: 
1. Verify Firebase Admin private key is configured
2. Check the project ID matches in both client and server config
3. Ensure the token hasn't expired (Firebase tokens expire after 1 hour)

### Issue: Backend can't verify tokens

**Solution**: Configure `FIREBASE_PRIVATE_KEY` environment variable for the backend.

### Issue: "Cannot read properties of null (reading 'currentUser')"

**Solution**: Wait for Firebase to initialize before making API calls. The auth-context handles this automatically.

### Issue: MongoDB connection fails

**Solution**: Verify `MONGODB_URI` in `.env.local` is correct and MongoDB Atlas is accessible.

## Browser Console Verification

Open DevTools Console (F12) during login:

**Good indicators**:
```
✓ No Firebase initialization errors
✓ No 401 Unauthorized errors
✓ API calls return 200 status
✓ Socket.IO connects successfully
```

**Bad indicators**:
```
✗ "Firebase not initialized"
✗ "401 Unauthorized"
✗ "Invalid token"
✗ Network errors on API calls
```

## Firebase Console Verification

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `newpr-17a5c`
3. Go to Authentication → Users
4. Verify your created users appear here
5. Check "Sign-in method" → Email/Password is enabled

## MongoDB Atlas Verification

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to your cluster
3. Go to Collections
4. Check the `quality_pulse` database
5. Verify `users` collection has your admin user
6. Check `firebaseUid` matches the UID from Firebase Console

## Performance Verification

Test these scenarios to ensure optimal performance:

1. **Cold Start**: First page load should complete in < 3 seconds
2. **Login Time**: Authentication should complete in < 2 seconds
3. **Dashboard Load**: Data should load in < 1 second
4. **API Response**: API calls should respond in < 500ms
5. **Session Restore**: Page refresh should restore session instantly

## Security Verification

- [ ] Passwords are not logged in console
- [ ] Firebase tokens are not exposed in URLs
- [ ] Protected routes redirect to login when unauthenticated
- [ ] Invalid tokens return 401 Unauthorized
- [ ] Role-based access prevents unauthorized page access
- [ ] Admin-only features not accessible to engineers
- [ ] Logout properly clears all session data

## Success Criteria

✅ All integration tests pass
✅ Login flow works end-to-end
✅ Firebase authenticates users successfully
✅ Backend validates Firebase tokens
✅ Protected API routes work correctly
✅ Role-based access control functions properly
✅ Session persists across page reloads
✅ Logout clears authentication state
✅ No console errors during normal usage
✅ Dashboard data loads correctly
✅ Real-time notifications work (Socket.IO)

## Next Steps After Successful Testing

1. **Add more users**: Create engineers via admin panel
2. **Create sites**: Add construction sites
3. **Submit reports**: Test QA report submission flow
4. **Review reports**: Test admin report approval/rejection
5. **Check analytics**: Verify dashboard analytics update
6. **Test notifications**: Verify real-time notifications work
7. **Export data**: Test CSV and PDF export functionality
8. **Audit logs**: Check audit log tracking

## Production Deployment Checklist

Before deploying to production:

- [ ] Generate strong Firebase Admin private key
- [ ] Store private key securely (environment variables, secrets manager)
- [ ] Enable Firebase Authentication email/password provider
- [ ] Configure Firebase authorized domains
- [ ] Set up MongoDB Atlas IP whitelist
- [ ] Configure CORS for production domains
- [ ] Set `NODE_ENV=production`
- [ ] Enable rate limiting on authentication endpoints
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for MongoDB
- [ ] Test disaster recovery with `ADMIN_RECOVERY_TOKEN`

## Support

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Check the backend server logs
3. Verify all environment variables are set correctly
4. Ensure Firebase project is properly configured
5. Check MongoDB Atlas connectivity
6. Review the Firebase Console for authentication events

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
