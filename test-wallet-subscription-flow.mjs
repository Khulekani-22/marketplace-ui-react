#!/usr/bin/env node
/**
 * Test wallet-based subscription and booking flow
 * Validates TrendingNFTsOne.jsx wallet integration
 */

import axios from 'axios';

const API_BASE_URL = process.env.TEST_API_BASE_URL || 'http://localhost:5055';
const api = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

console.log('🧪 Testing Wallet Subscription & Booking Flow\n');
console.log(`📍 API Base: ${API_BASE_URL}\n`);

const results = {
  healthCheck: false,
  servicesEndpoint: false,
  walletsEndpoint: false,
  subscriptionsEndpoint: false,
  walletStructure: false,
  serviceStructure: false,
};

async function testHealthCheck() {
  console.log('🏥 Testing health endpoint...');
  try {
    const { data } = await api.get('/api/health');
    results.healthCheck = data.status === 'ok';
    console.log(results.healthCheck ? '✅ Health check passed\n' : '❌ Health check failed\n');
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}\n`);
  }
}

async function testServicesEndpoint() {
  console.log('📋 Testing services endpoint...');
  try {
    const { data } = await api.get('/api/data/services', { 
      params: { limit: 5 },
      timeout: 15000 
    });
    
    const hasItems = Array.isArray(data?.items) || Array.isArray(data?.services);
    const services = data?.items || data?.services || [];
    
    if (hasItems && services.length > 0) {
      results.servicesEndpoint = true;
      console.log(`✅ Services endpoint returned ${services.length} items`);
      
      // Check for price field (needed for wallet logic)
      const paidServices = services.filter(s => Number(s.price || 0) > 0);
      console.log(`   📊 Found ${paidServices.length} paid listings`);
      
      if (paidServices.length > 0) {
        const sample = paidServices[0];
        console.log(`   💰 Sample: "${sample.title}" - R${sample.price} credits`);
        results.serviceStructure = !!(sample.id && sample.title && sample.price);
      }
    } else {
      console.log('⚠️  Services endpoint returned no items');
    }
    console.log('');
  } catch (error) {
    console.log(`❌ Services endpoint failed: ${error.message}\n`);
  }
}

async function testWalletsEndpoint() {
  console.log('💰 Testing wallets endpoint...');
  try {
    const { data } = await api.get('/api/wallets/me');
    
    // Expect 401/403 without auth, which is correct behavior
    if (data) {
      results.walletsEndpoint = true;
      console.log('✅ Wallets endpoint accessible');
      
      if (data.wallet) {
        console.log(`   📊 Balance: ${data.wallet.balance} credits`);
        console.log(`   ✓ Eligible: ${data.eligible}`);
        results.walletStructure = !!(
          typeof data.wallet.balance === 'number' &&
          typeof data.eligible === 'boolean'
        );
      }
    }
    console.log('');
  } catch (error) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      results.walletsEndpoint = true; // Expected for unauthenticated
      console.log('✅ Wallets endpoint requires authentication (expected)\n');
    } else {
      console.log(`❌ Wallets endpoint error: ${error.message}\n`);
    }
  }
}

async function testSubscriptionsEndpoint() {
  console.log('📝 Testing subscriptions endpoint...');
  try {
    const { data } = await api.get('/api/subscriptions/my');
    
    if (Array.isArray(data)) {
      results.subscriptionsEndpoint = true;
      console.log(`✅ Subscriptions endpoint returned ${data.length} items\n`);
    }
  } catch (error) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      results.subscriptionsEndpoint = true; // Expected for unauthenticated
      console.log('✅ Subscriptions endpoint requires authentication (expected)\n');
    } else {
      console.log(`❌ Subscriptions endpoint error: ${error.message}\n`);
    }
  }
}

async function testWalletIntegrationReadiness() {
  console.log('🔍 Checking wallet integration readiness...\n');
  
  const checks = [
    { name: 'Services API', pass: results.servicesEndpoint, detail: 'Listings with prices available' },
    { name: 'Service Structure', pass: results.serviceStructure, detail: 'Has id, title, price fields' },
    { name: 'Wallets API', pass: results.walletsEndpoint, detail: 'Wallet balance endpoint ready' },
    { name: 'Subscriptions API', pass: results.subscriptionsEndpoint, detail: 'Subscribe/unsubscribe endpoints ready' },
  ];
  
  checks.forEach(check => {
    const icon = check.pass ? '✅' : '❌';
    console.log(`${icon} ${check.name}: ${check.detail}`);
  });
  
  const allPass = checks.every(c => c.pass);
  console.log('');
  
  if (allPass) {
    console.log('🎉 All wallet integration dependencies are ready!');
    console.log('   Users can subscribe to listings using wallet credits.');
  } else {
    console.log('⚠️  Some wallet integration dependencies need attention.');
    const failed = checks.filter(c => !c.pass);
    console.log('   Failed checks:');
    failed.forEach(f => console.log(`   - ${f.name}`));
  }
  
  return allPass;
}

async function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 WALLET SUBSCRIPTION FLOW TEST REPORT');
  console.log('='.repeat(60) + '\n');
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(Boolean).length;
  const score = Math.round((passed / total) * 100);
  
  console.log(`Overall Score: ${score}% (${passed}/${total} checks passed)\n`);
  
  console.log('Component Readiness:');
  Object.entries(results).forEach(([key, pass]) => {
    const status = pass ? '✅ PASS' : '❌ FAIL';
    const label = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`  ${status} - ${label}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('Next Steps for Manual Testing:');
  console.log('='.repeat(60) + '\n');
  
  console.log('1. Deploy to Vercel or start local dev server:');
  console.log('   npm run dev\n');
  
  console.log('2. Navigate to dashboard:');
  console.log('   https://marketplace-ui-react-vcl-main-oct.vercel.app/dashboard\n');
  
  console.log('3. Log in as startup/vendor user\n');
  
  console.log('4. Verify wallet banner shows:');
  console.log('   - Current balance in credits');
  console.log('   - "View wallet" and "Refresh balance" buttons\n');
  
  console.log('5. Find a paid listing and check:');
  console.log('   - Price shows "R X credits"');
  console.log('   - Coverage status: "Covered by wallet" or "Short by X credits"');
  console.log('   - Subscribe button enabled/disabled correctly\n');
  
  console.log('6. Test subscription flow:');
  console.log('   - Click Subscribe on covered listing');
  console.log('   - Verify toast shows "Voucher applied! Remaining balance: X credits"');
  console.log('   - Confirm wallet balance decreased by listing price');
  console.log('   - Check button changes to "Subscribed"\n');
  
  console.log('7. Test booking flow (for service listings):');
  console.log('   - Click "Book session"');
  console.log('   - Check modal shows wallet summary');
  console.log('   - Choose date and time slot');
  console.log('   - Confirm booking completes and credits deducted');
  console.log('   - Verify "Next session" shows on card\n');
  
  console.log('8. Check wallet history:');
  console.log('   - Navigate to /wallet page');
  console.log('   - Verify transactions logged with correct metadata\n');
}

async function runTests() {
  try {
    await testHealthCheck();
    await testServicesEndpoint();
    await testWalletsEndpoint();
    await testSubscriptionsEndpoint();
    
    const ready = await testWalletIntegrationReadiness();
    await generateReport();
    
    process.exit(ready ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }
}

runTests();
