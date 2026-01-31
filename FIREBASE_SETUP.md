# Firebase Configuration Summary

## Updated Firebase Credentials

The Construction Quality Pulse application has been configured with the following Firebase credentials:

### Frontend Configuration (Client SDK)

These credentials are stored in `.env.local` and are prefixed with `NEXT_PUBLIC_` to be available in the browser:

```env
NEXT_PUBLIC_FIREBASE_ENABLED=true
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAQRxsJIGtIIAWCuoPhceDP8XWocuo__TU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=newpr-17a5c.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=newpr-17a5c
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=newpr-17a5c.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=310429401725
NEXT_PUBLIC_FIREBASE_APP_ID=1:310429401725:web:25887550126901fd5b6714
```

### Backend Configuration (Admin SDK)

The backend requires Firebase Admin SDK credentials for token verification:

```env
FIREBASE_PROJECT_ID=newpr-17a5c
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@newpr-17a5c.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**IMPORTANT**: You must configure the `FIREBASE_PRIVATE_KEY` environment variable with your Firebase service account private key.

## Getting the Private Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **newpr-17a5c**
3. Click Settings (⚙️) → Project Settings
4. Navigate to "Service Accounts" tab
5. Click "Generate new private key"
6. Download the JSON file
7. Extract the `private_key` field from the JSON
8. Add to `.env.local` (or server environment):

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...your-key-here...\n-----END PRIVATE KEY-----\n"
```

## Firebase Project Information

- **Project ID**: newpr-17a5c
- **Project Name**: newpr
- **Auth Domain**: newpr-17a5c.firebaseapp.com
- **Storage Bucket**: newpr-17a5c.firebasestorage.app

## Authentication Flow

### 1. User Login (Frontend)
```typescript
// File: src/lib/auth-context.tsx
const login = async (email: string, password: string) => {
  if (!firebaseAuth) throw new Error('Firebase not initialized')
  const { signInWithEmailAndPassword } = await import('firebase/auth')
  await signInWithEmailAndPassword(firebaseAuth, email, password)
  await syncUserWithBackend()
}
```

### 2. Token Attachment (Frontend)
```typescript
// File: src/lib/api.ts
api.interceptors.request.use(async (config) => {
  const user = auth?.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. Token Verification (Backend)
```javascript
// File: server/middleware/auth.js
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  const decodedToken = await admin.auth().verifyIdToken(token);
  let user = await User.findOne({ firebaseUid: decodedToken.uid });
  req.user = user;
  next();
};
```

### 4. User Sync (Backend)
```javascript
// Auto-creates user in MongoDB if not exists
if (!user) {
  user = await User.create({
    firebaseUid: decodedToken.uid,
    email: decodedToken.email,
    name: decodedToken.name || decodedToken.email?.split('@')[0],
    role: decodedToken.role || 'engineer'
  });
}
```

## Key Features Implemented

### ✅ Frontend Firebase Integration
- Firebase client SDK initialization (`src/lib/firebase.ts`)
- Auth context provider (`src/lib/auth-context.tsx`)
- Login/logout functionality
- Session persistence across page reloads
- Automatic token refresh

### ✅ Backend Firebase Integration
- Firebase Admin SDK initialization (`server/config/firebase.js`)
- Token verification middleware (`server/middleware/auth.js`)
- User auto-creation and sync
- Role-based access control

### ✅ API Integration
- Axios interceptor adds Firebase token to all requests (`src/lib/api.ts`)
- Protected routes require valid Firebase authentication
- Automatic 401 handling for invalid tokens

### ✅ User Experience
- Smooth login/logout flow
- AuthGuard component for protected pages
- Role-based dashboard routing (admin/engineer)
- Real-time notifications via Socket.IO
- Error handling and user feedback

## Configuration Validation

The Firebase configuration includes validation checks:

```typescript
// Validates API key format
const isLikelyApiKey = firebaseConfig.apiKey.startsWith('AIza') && 
                       firebaseConfig.apiKey.length > 30;

// Validates auth domain
const isLikelyAuthDomain = firebaseConfig.authDomain.includes('firebaseapp.com') ||
                           firebaseConfig.authDomain.includes('web.app');
```

## Testing the Configuration

Run the integration test:

```bash
node test-integration.js
```

This will verify:
- All environment variables are set
- Firebase credentials are valid
- Backend can initialize Firebase Admin SDK
- Authentication flow works end-to-end

## Required Firebase Console Settings

In the Firebase Console (https://console.firebase.google.com/), ensure:

1. **Authentication → Sign-in method**
   - Email/Password provider is **enabled**

2. **Authentication → Settings → Authorized domains**
   - Add your domains (e.g., localhost, your-app.com)

3. **Project Settings → Service Accounts**
   - Generate a new private key for backend use

## Security Considerations

### ✅ Implemented
- Firebase tokens are never logged or exposed in URLs
- Private key is stored in environment variables (not in code)
- Protected routes require authentication
- Role-based access control prevents unauthorized access
- Tokens expire after 1 hour (Firebase default)

### 🔒 Production Recommendations
- Use a secrets manager for `FIREBASE_PRIVATE_KEY` (e.g., AWS Secrets Manager)
- Enable Firebase App Check for additional security
- Set up rate limiting on authentication endpoints
- Monitor Firebase Console for suspicious activity
- Rotate service account keys periodically
- Enable 2FA for Firebase project admins

## Common Issues

### Issue: "Firebase not initialized"
**Cause**: `NEXT_PUBLIC_FIREBASE_ENABLED` is not set to `true`
**Fix**: Set `NEXT_PUBLIC_FIREBASE_ENABLED=true` in `.env.local` and restart

### Issue: "Invalid token"
**Cause**: Backend doesn't have private key or project ID mismatch
**Fix**: Configure `FIREBASE_PRIVATE_KEY` and verify `FIREBASE_PROJECT_ID=newpr-17a5c`

### Issue: "Missing or invalid Firebase web config"
**Cause**: One or more `NEXT_PUBLIC_FIREBASE_*` variables are empty
**Fix**: Verify all Firebase credentials in `.env.local`

## File Locations

- Frontend config: `src/lib/firebase.ts`
- Auth context: `src/lib/auth-context.tsx`
- API client: `src/lib/api.ts`
- Backend config: `server/config/firebase.js`
- Auth middleware: `server/middleware/auth.js`
- Environment: `.env.local`
- Login page: `src/app/login/page.tsx`
- Bootstrap page: `src/app/bootstrap-admin/page.tsx`

## Next Steps

1. **Set up Firebase Private Key**
   ```bash
   # Add to .env.local
   FIREBASE_PRIVATE_KEY="your-private-key-here"
   ```

2. **Start the application**
   ```bash
   # Terminal 1: Backend
   npm run dev:backend
   
   # Terminal 2: Frontend
   npm run dev
   ```

3. **Bootstrap the system**
   - Navigate to: http://localhost:3000/bootstrap-admin
   - Create the first admin account

4. **Test the login flow**
   - Go to: http://localhost:3000/login
   - Sign in with your admin credentials
   - Verify dashboard access

5. **Create additional users**
   - Use the admin panel to create engineers
   - Test role-based access control

## Support

For issues or questions:
1. Check the `TESTING_GUIDE.md` for detailed testing instructions
2. Review Firebase Console for authentication events
3. Check backend logs for token verification errors
4. Verify MongoDB connection and user data

## References

- Firebase Auth Docs: https://firebase.google.com/docs/auth
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- Next.js Environment Variables: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
