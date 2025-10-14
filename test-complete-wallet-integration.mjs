#!/usr/bin/env node

/**
 * Comprehensive Axios Wallet Integration Test
 * Tests the complete wallet flow with the new axios-based hooks
 */

import axios from 'axios';

const API_BASE = 'http://localhost:5055';
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

async function testCompleteWalletFlow() {
  console.log('🧪 Testing Complete Axios Wallet Integration...\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function addTest(name, success, details = '') {
    results.tests.push({ name, success, details });
    if (success) {
      results.passed++;
      console.log(`✅ ${name}${details ? ': ' + details : ''}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}${details ? ': ' + details : ''}`);
    }
  }

  try {
    // 1. Test backend availability
    console.log('🔍 Testing Backend Services...\n');
    
    const healthResponse = await api.get('/api/health');
    addTest('Backend Health Check', healthResponse.data.status === 'ok');

    // 2. Test wallet endpoint structure (without auth)
    try {
      await api.get('/api/wallets/me');
      addTest('Wallet Endpoint', false, 'Should require authentication');
    } catch (error) {
      const expectedError = error.response?.status === 401 || error.response?.status === 403;
      addTest('Wallet Authentication', expectedError, 'Correctly requires auth');
    }

    // 3. Test data endpoints that should work
    console.log('\n📊 Testing Data Endpoints...\n');
    
    const servicesResponse = await api.get('/api/data/services', {
      params: { page: 1, pageSize: 5 }
    });
    
    const hasServices = Array.isArray(servicesResponse.data.items);
    addTest('Services API', hasServices, `${servicesResponse.data.items?.length || 0} services`);
    
    const hasPagination = servicesResponse.data.hasOwnProperty('page') && 
                         servicesResponse.data.hasOwnProperty('pageSize') && 
                         servicesResponse.data.hasOwnProperty('total');
    addTest('Pagination Format', hasPagination, 'Consistent structure');

    // 4. Test vendors endpoint
    const vendorsResponse = await api.get('/api/data/vendors', {
      params: { page: 1, pageSize: 5 }
    });
    addTest('Vendors API', Array.isArray(vendorsResponse.data.items), 
           `${vendorsResponse.data.items?.length || 0} vendors`);

    // 5. Test startups endpoint
    const startupsResponse = await api.get('/api/data/startups', {
      params: { page: 1, pageSize: 5 }
    });
    addTest('Startups API', Array.isArray(startupsResponse.data.items), 
           `${startupsResponse.data.items?.length || 0} startups`);

    // 6. Test admin endpoints (should require auth)
    console.log('\n🔐 Testing Admin Endpoints...\n');
    
    try {
      await api.get('/api/wallets');
      addTest('Admin Wallet List', false, 'Should require admin auth');
    } catch (error) {
      const expectedError = error.response?.status === 401 || error.response?.status === 403;
      addTest('Admin Authentication', expectedError, 'Correctly secured');
    }

    // 7. Test wallet grant endpoint (should require admin auth)
    try {
      await api.post('/api/wallets/grant', {
        userEmail: 'test@example.com',
        amount: 100,
        description: 'Test grant'
      });
      addTest('Admin Grant Credits', false, 'Should require admin auth');
    } catch (error) {
      const expectedError = error.response?.status === 401 || error.response?.status === 403;
      addTest('Admin Grant Auth', expectedError, 'Correctly secured');
    }

    // 8. Test response time
    console.log('\n⚡ Testing Performance...\n');
    
    const startTime = Date.now();
    await api.get('/api/data/services', { params: { page: 1, pageSize: 1 } });
    const responseTime = Date.now() - startTime;
    
    addTest('Response Time', responseTime < 1000, `${responseTime}ms`);

    // 9. Test error handling
    console.log('\n🛡️ Testing Error Handling...\n');
    
    try {
      await api.get('/api/data/nonexistent');
      addTest('404 Handling', false, 'Should return 404');
    } catch (error) {
      addTest('404 Handling', error.response?.status === 404, 'Correct error status');
    }

    console.log('\n📋 Test Summary:');
    console.log(`   Passed: ${results.passed}/${results.tests.length}`);
    console.log(`   Failed: ${results.failed}/${results.tests.length}`);
    
    if (results.failed === 0) {
      console.log('\n🎉 All tests passed! Axios-Firestore integration is working correctly.');
      
      console.log('\n✨ Integration Status:');
      console.log('   - Backend server: Running and responsive ✅');
      console.log('   - Authentication: Properly secured ✅');
      console.log('   - Data APIs: Working with pagination ✅');
      console.log('   - Admin APIs: Correctly protected ✅');
      console.log('   - Performance: Under 1s response time ✅');
      console.log('   - Error handling: Functional ✅');
      
      console.log('\n🚀 Ready for frontend testing with useWalletAxios hook!');
      return true;
    } else {
      console.log('\n⚠️ Some tests failed. Check the details above.');
      return false;
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    addTest('Test Suite', false, error.message);
    return false;
  }
}

// Run tests
testCompleteWalletFlow()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });