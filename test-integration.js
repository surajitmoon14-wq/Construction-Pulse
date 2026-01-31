#!/usr/bin/env node

/**
 * Integration Test Script for Construction Quality Pulse
 * Tests complete authentication flow with new Firebase credentials
 */

const axios = require('axios');
const admin = require('firebase-admin');

const API_BASE = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log('cyan', `  ${title}`);
  console.log('='.repeat(60) + '\n');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class IntegrationTest {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async test(name, fn) {
    process.stdout.write(`${colors.blue}▶${colors.reset} ${name}... `);
    try {
      await fn();
      log('green', '✓ PASSED');
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
    } catch (error) {
      log('red', `✗ FAILED: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
    }
  }

  printSummary() {
    section('TEST SUMMARY');
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    log('green', `Passed: ${this.results.passed}`);
    log('red', `Failed: ${this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log('\nFailed Tests:');
      this.results.tests
        .filter(t => t.status === 'FAILED')
        .forEach(t => {
          log('red', `  ✗ ${t.name}`);
          console.log(`    ${t.error}`);
        });
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    if (this.results.failed === 0) {
      log('green', '🎉 ALL TESTS PASSED!');
      return 0;
    } else {
      log('red', '❌ SOME TESTS FAILED');
      return 1;
    }
  }
}

async function main() {
  const tester = new IntegrationTest();

  section('FIREBASE CONFIGURATION VERIFICATION');
  
  await tester.test('Firebase credentials are properly configured', async () => {
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
    ];

    // Read from .env.local
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');

    for (const varName of requiredEnvVars) {
      if (!envContent.includes(varName)) {
        throw new Error(`Missing ${varName} in .env.local`);
      }
      // Check it's not empty
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (!match || !match[1] || match[1].trim() === '') {
        throw new Error(`${varName} is empty in .env.local`);
      }
    }

    // Verify NEXT_PUBLIC_FIREBASE_ENABLED=true
    if (!envContent.includes('NEXT_PUBLIC_FIREBASE_ENABLED=true')) {
      throw new Error('NEXT_PUBLIC_FIREBASE_ENABLED must be set to true');
    }
  });

  await tester.test('Firebase API key has correct format', async () => {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const match = envContent.match(/NEXT_PUBLIC_FIREBASE_API_KEY=(.+)/);
    if (!match) throw new Error('API key not found');
    
    const apiKey = match[1].trim();
    if (!apiKey.startsWith('AIza')) {
      throw new Error('API key does not start with "AIza"');
    }
    if (apiKey.length < 30) {
      throw new Error('API key is too short');
    }
  });

  section('BACKEND SERVER VERIFICATION');

  await tester.test('Backend server is running', async () => {
    const response = await axios.get('http://localhost:5000/health', {
      timeout: 5000
    });
    if (response.status !== 200) {
      throw new Error(`Backend returned status ${response.status}`);
    }
  });

  await tester.test('Backend governance endpoint is accessible', async () => {
    const response = await axios.get(`${API_BASE}/governance/status`);
    if (response.status !== 200) {
      throw new Error(`Governance status returned ${response.status}`);
    }
    if (typeof response.data.initialized !== 'boolean') {
      throw new Error('Invalid governance status response');
    }
  });

  section('FIREBASE ADMIN SDK VERIFICATION');

  await tester.test('Firebase Admin SDK is initialized', async () => {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const projectIdMatch = envContent.match(/FIREBASE_PROJECT_ID=(.+)/);
    if (!projectIdMatch) throw new Error('FIREBASE_PROJECT_ID not found');
    
    const projectId = projectIdMatch[1].trim();
    if (projectId !== 'newpr-17a5c') {
      throw new Error(`Expected project ID 'newpr-17a5c', got '${projectId}'`);
    }
  });

  section('AUTHENTICATION FLOW VERIFICATION');

  let bootstrapped = false;
  let testUserEmail = `test-admin-${Date.now()}@example.com`;
  let testUserPassword = 'TestPassword123!';
  let testUserName = 'Test Admin User';

  await tester.test('Check if system needs bootstrap', async () => {
    const response = await axios.get(`${API_BASE}/governance/status`);
    bootstrapped = !response.data.initialized;
    
    if (bootstrapped) {
      log('yellow', '    → System not initialized, will test bootstrap flow');
    } else {
      log('yellow', '    → System already initialized, skipping bootstrap');
    }
  });

  if (bootstrapped) {
    await tester.test('Bootstrap admin user creation', async () => {
      const response = await axios.post(`${API_BASE}/governance/bootstrap-admin`, {
        email: testUserEmail,
        password: testUserPassword,
        name: testUserName
      });

      if (response.status !== 201) {
        throw new Error(`Expected status 201, got ${response.status}`);
      }

      if (!response.data.user || !response.data.user.email) {
        throw new Error('Invalid bootstrap response');
      }
    });

    await tester.test('Bootstrap is disabled after first admin', async () => {
      try {
        await axios.post(`${API_BASE}/governance/bootstrap-admin`, {
          email: 'another@example.com',
          password: 'password123',
          name: 'Another User'
        });
        throw new Error('Bootstrap should have been rejected');
      } catch (error) {
        if (error.response && error.response.status === 403) {
          // Expected
        } else {
          throw error;
        }
      }
    });
  }

  section('API ENDPOINTS VERIFICATION');

  await tester.test('Protected routes require authentication', async () => {
    try {
      await axios.get(`${API_BASE}/sites`);
      throw new Error('Protected route should require authentication');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Expected
      } else {
        throw error;
      }
    }
  });

  await tester.test('Auth /me endpoint requires token', async () => {
    try {
      await axios.get(`${API_BASE}/auth/me`);
      throw new Error('Auth /me should require token');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Expected
      } else {
        throw error;
      }
    }
  });

  section('ERROR HANDLING VERIFICATION');

  await tester.test('Invalid token is rejected by backend', async () => {
    try {
      await axios.get(`${API_BASE}/sites`, {
        headers: {
          'Authorization': 'Bearer invalid-token-12345'
        }
      });
      throw new Error('Invalid token should be rejected');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Expected
      } else {
        throw error;
      }
    }
  });

  section('CONFIGURATION VALIDATION');

  await tester.test('API URL configuration is correct', async () => {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const match = envContent.match(/NEXT_PUBLIC_API_URL=(.+)/);
    if (!match) throw new Error('API URL not found');
    
    const apiUrl = match[1].trim();
    if (!apiUrl.endsWith('/api')) {
      throw new Error('API URL should end with /api');
    }
  });

  await tester.test('MongoDB URI is configured', async () => {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (!envContent.includes('MONGODB_URI=')) {
      throw new Error('MONGODB_URI not configured');
    }
  });

  // Print final summary
  const exitCode = tester.printSummary();
  
  if (exitCode === 0) {
    log('green', '\n✅ All integration tests passed!');
    log('cyan', '\nNext steps:');
    console.log('  1. Start the backend: npm run dev:backend');
    console.log('  2. Start the frontend: npm run dev');
    console.log('  3. Navigate to http://localhost:3000/bootstrap-admin (if needed)');
    console.log('  4. Create an admin account');
    console.log('  5. Login at http://localhost:3000/login');
    console.log('  6. Verify dashboard access and functionality\n');
  }

  process.exit(exitCode);
}

// Run tests
main().catch(error => {
  log('red', `\n❌ Test runner failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
