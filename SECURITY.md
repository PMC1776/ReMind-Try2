# Security Implementation Guide

## Overview
This document outlines the security measures implemented in this privacy-focused application and provides guidance for additional hardening before production deployment.

## Implemented Security Measures ✅

### 1. Secure Storage
- **What:** All sensitive data uses `expo-secure-store` (iOS Keychain / Android Keystore)
- **Protected data:**
  - Authentication tokens
  - User credentials
  - Encryption keys (private/public keypairs)
- **Files:** `utils/secureStorage.ts`, `hooks/useAuth.tsx`, `utils/encryption.ts`

### 2. Client-Side Password Hashing
- **What:** Passwords are hashed client-side before transmission
- **Algorithm:** SHA-256 with 10 rounds (PBKDF2-like)
- **Salt:** Derived from user email
- **Benefit:** Server never sees plaintext passwords
- **Files:** `utils/passwordHash.ts`, `screens/LoginScreen.tsx`, `screens/SignupScreen.tsx`

### 3. Strong Password Requirements
- **Minimum length:** 12 characters
- **Required complexity:**
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Validation:** Real-time password strength indicator
- **Files:** `utils/passwordHash.ts:55-95`, `screens/SignupScreen.tsx`

### 4. End-to-End Encryption
- **Algorithm:** NaCl Box (Curve25519 + XSalsa20 + Poly1305)
- **Key generation:** Secure random keypair generation
- **Storage:** Keys stored in SecureStore
- **Files:** `utils/encryption.ts`

### 5. Rate Limiting
- **Email verification:** Maximum 5 attempts before requiring new code
- **Resend code:** Maximum 3 resend attempts
- **Files:** `screens/EmailVerificationScreen.tsx:52-93`

### 6. Generic Error Messages
- **What:** Login errors don't reveal whether email exists
- **Benefit:** Prevents user enumeration attacks
- **Files:** `screens/LoginScreen.tsx:45`

## ⚠️ Additional Security Measures Required for Production

### 1. Certificate Pinning

Certificate pinning prevents man-in-the-middle (MITM) attacks by validating the server's SSL certificate.

#### For React Native/Expo Apps:

**Option A: Using react-native-ssl-pinning (Requires Ejecting)**
\`\`\`bash
npm install react-native-ssl-pinning
npx expo prebuild
\`\`\`

Then in your API configuration:
\`\`\`typescript
import { fetch } from 'react-native-ssl-pinning';

// Get your certificate hash:
// openssl s_client -servername yourdomain.com -connect yourdomain.com:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
\`\`\`

**Option B: Using expo-dev-client with native modules**

If you want to stay in Expo's managed workflow but add native code:

1. Install expo-dev-client: \`npx expo install expo-dev-client\`
2. Create a native module for certificate pinning
3. Build custom development client

**Certificate Hash for Your Domain:**

To get the certificate hash for your backend:
\`\`\`bash
# For your Replit backend
openssl s_client -servername 57c4d3e1-0ffe-4760-ac04-86a7e3deb7e6-00-39hpf0lz4sz6g.kirk.replit.dev -connect 57c4d3e1-0ffe-4760-ac04-86a7e3deb7e6-00-39hpf0lz4sz6g.kirk.replit.dev:443 < /dev/null 2>/dev/null | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64
\`\`\`

**Note:** Replit domains may use shared certificates, which makes pinning complex. For production, use a custom domain with your own SSL certificate.

### 2. Token Refresh Mechanism

Currently, there's no token refresh implementation. Add:
- Refresh tokens with longer expiration
- Access tokens with short expiration (15 minutes)
- Automatic token refresh on 401 errors

**Backend changes needed:**
\`\`\`typescript
// Add to authAPI
refreshToken: async (refreshToken: string) => {
  const { data } = await api.post("/auth/refresh", { refreshToken });
  return data;
}
\`\`\`

### 3. Biometric Authentication (Optional but Recommended)

Add fingerprint/Face ID authentication:
\`\`\`bash
npx expo install expo-local-authentication
\`\`\`

### 4. Network Security Configuration

For Android, add a network security config to enforce HTTPS:

Create \`android/app/src/main/res/xml/network_security_config.xml\`:
\`\`\`xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">your-domain.com</domain>
    </domain-config>
</network-security-config>
\`\`\`

### 5. Backend Security Checklist

Ensure your backend implements:
- [ ] HTTPS only (no HTTP)
- [ ] CORS properly configured
- [ ] CSRF protection
- [ ] Rate limiting on all endpoints
- [ ] SQL injection protection (use parameterized queries)
- [ ] Password hashing on server (bcrypt/argon2) for the hashed passwords
- [ ] Token blacklisting on logout
- [ ] Account lockout after failed login attempts
- [ ] Secure session management
- [ ] Input validation and sanitization
- [ ] Security headers (HSTS, X-Frame-Options, etc.)

## Security Audit Checklist

Before deploying to production:

- [ ] All secrets moved to environment variables
- [ ] Certificate pinning implemented
- [ ] Token refresh mechanism working
- [ ] Rate limiting on all sensitive endpoints
- [ ] Error messages don't leak information
- [ ] All data encrypted at rest and in transit
- [ ] Biometric authentication enabled (optional)
- [ ] Backend security audit completed
- [ ] Dependency vulnerability scan completed (\`npm audit\`)
- [ ] Code obfuscation enabled for production builds
- [ ] Logging doesn't include sensitive data
- [ ] Analytics/tracking doesn't collect PII

## Testing Security

### Test Password Hashing:
\`\`\`typescript
import { hashPassword } from './utils/passwordHash';

const hash1 = await hashPassword('MyP@ssw0rd123', 'user@example.com');
const hash2 = await hashPassword('MyP@ssw0rd123', 'user@example.com');
// hash1 should equal hash2 (deterministic)

const hash3 = await hashPassword('MyP@ssw0rd123', 'other@example.com');
// hash3 should differ from hash1 (different salt)
\`\`\`

### Test Secure Storage:
\`\`\`typescript
import { secureStorage } from './utils/secureStorage';

await secureStorage.setItem('test', 'sensitive-data');
const retrieved = await secureStorage.getItem('test');
console.log(retrieved === 'sensitive-data'); // should be true
\`\`\`

### Test Rate Limiting:
1. Navigate to email verification screen
2. Enter wrong code 5 times
3. Should show "Too Many Attempts" message
4. Request new code
5. Counter should reset

## Privacy Considerations

### Data Minimization
- Only collect email and user ID
- No tracking or analytics by default
- No third-party authentication providers

### User Rights
- Account deletion implemented with 30-day grace period
- Export functionality available
- Clear data retention policy needed

### Compliance
Consider GDPR/CCPA compliance:
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] Data retention policy defined
- [ ] User consent mechanisms implemented
- [ ] Right to be forgotten implemented

## Incident Response

If a security breach occurs:
1. Immediately revoke all active tokens
2. Force password reset for all users
3. Notify affected users within 72 hours
4. Document the incident
5. Implement fixes to prevent recurrence

## Contact

For security issues, please report to: [security@yourapp.com]

**Do not create public GitHub issues for security vulnerabilities.**
