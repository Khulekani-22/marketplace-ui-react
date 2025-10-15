// Final axios-Firestore integration validation
import axios from 'axios';

console.log('🚀 Final axios-Firestore integration validation\n');

const API_BASE_URL = process.env.TEST_API_BASE_URL || 'http://localhost:5055';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Test all CRUD operations and data consistency
async function validateIntegration() {
  const results = {
    connectivity: false,
    dataConsistency: false,
    errorHandling: false,
    pagination: false,
    search: false,
    performance: false
  };

  console.log('🔗 Testing connectivity...');
  try {
    const health = await api.get('/api/health');
    results.connectivity = health.data.status === 'ok';
    console.log(results.connectivity ? '✅ Connectivity: OK' : '❌ Connectivity: FAILED');
  } catch (error) {
    console.log('❌ Connectivity: FAILED -', error.message);
  }

  console.log('\n📊 Testing data consistency...');
  try {
    const [services, vendors, startups] = await Promise.all([
      api.get('/api/data/services?limit=5'),
      api.get('/api/data/vendors?limit=5'), 
      api.get('/api/data/startups?limit=5')
    ]);

    const hasValidFormat = [services, vendors, startups].every(response => 
      response.data && 
      typeof response.data.page === 'number' &&
      typeof response.data.total === 'number' &&
      Array.isArray(response.data.items)
    );

    results.dataConsistency = hasValidFormat;
    console.log(results.dataConsistency ? '✅ Data consistency: OK' : '❌ Data consistency: FAILED');
    
    console.log(`   Services: ${services.data.total} total, ${services.data.items.length} loaded`);
    console.log(`   Vendors: ${vendors.data.total} total, ${vendors.data.items.length} loaded`);
    console.log(`   Startups: ${startups.data.total} total, ${startups.data.items.length} loaded`);
  } catch (error) {
    console.log('❌ Data consistency: FAILED -', error.message);
  }

  console.log('\n⚠️  Testing error handling...');
  try {
    await api.get('/api/nonexistent');
  } catch (error) {
    results.errorHandling = axios.isAxiosError(error) && error.response?.status === 404;
    console.log(results.errorHandling ? '✅ Error handling: OK' : '❌ Error handling: FAILED');
  }

  console.log('\n📄 Testing pagination...');
  try {
    const page1 = await api.get('/api/data/services?page=1&pageSize=2');
    const page2 = await api.get('/api/data/services?page=2&pageSize=2');
    
    const validPagination = 
      page1.data.page === 1 && 
      page2.data.page === 2 && 
      page1.data.pageSize === 2 &&
      page2.data.pageSize === 2;
    
    results.pagination = validPagination;
    console.log(results.pagination ? '✅ Pagination: OK' : '❌ Pagination: FAILED');
  } catch (error) {
    console.log('❌ Pagination: FAILED -', error.message);
  }

  console.log('\n🔍 Testing search functionality...');
  try {
    const searchResult = await api.get('/api/data/services?q=logo');
    const hasSearch = typeof searchResult.data.total === 'number';
    results.search = hasSearch;
    console.log(results.search ? '✅ Search: OK' : '❌ Search: FAILED');
  } catch (error) {
    console.log('❌ Search: FAILED -', error.message);
  }

  console.log('\n⚡ Testing performance...');
  try {
    const start = Date.now();
    await Promise.all([
      api.get('/api/health'),
      api.get('/api/data/services?limit=1'),
      api.get('/api/data/vendors?limit=1'),
      api.get('/api/data/startups?limit=1')
    ]);
    const duration = Date.now() - start;
    results.performance = duration < 5000; // Should complete within 5 seconds
    console.log(results.performance ? `✅ Performance: OK (${duration}ms)` : `❌ Performance: SLOW (${duration}ms)`);
  } catch (error) {
    console.log('❌ Performance: FAILED -', error.message);
  }

  return results;
}

// Test specific Firestore-axios compatibility features
async function testFirestoreCompatibility() {
  console.log('\n🔥 Testing Firestore-specific compatibility...\n');
  
  console.log('📡 Testing real-time data freshness...');
  try {
    const response1 = await api.get('/api/data/services?limit=1');
    // Wait a bit and fetch again
    await new Promise(resolve => setTimeout(resolve, 100));
    const response2 = await api.get('/api/data/services?limit=1');
    
    // Both should return valid data (may be same data, that's ok)
    const isConsistent = response1.data.total === response2.data.total;
    console.log(isConsistent ? '✅ Data consistency: OK' : '⚠️  Data may be updating');
  } catch (error) {
    console.log('❌ Data freshness test failed:', error.message);
  }

  console.log('\n🔄 Testing concurrent requests...');
  try {
    const promises = Array(5).fill(0).map(() => api.get('/api/health'));
    const responses = await Promise.all(promises);
    const allSuccessful = responses.every(r => r.data.status === 'ok');
    console.log(allSuccessful ? '✅ Concurrent requests: OK' : '❌ Concurrent requests: FAILED');
  } catch (error) {
    console.log('❌ Concurrent requests failed:', error.message);
  }

  console.log('\n🎯 Testing data integrity validation...');
  try {
    const response = await api.get('/api/integrity/validate-service-vendors');
    // This endpoint exists and validates vendor-service relationships
    console.log('✅ Data integrity endpoint: Available');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('⚠️  Data integrity endpoint: Requires authentication');
    } else {
      console.log('❌ Data integrity endpoint: Failed');
    }
  }
}

async function generateReport(results) {
  console.log('\n📋 AXIOS-FIRESTORE INTEGRATION REPORT');
  console.log('=====================================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  const score = (passed / total * 100).toFixed(1);
  
  console.log(`\n📊 Overall Score: ${score}% (${passed}/${total} tests passed)\n`);
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${status} ${testName}`);
  });
  
  console.log('\n🎯 Summary:');
  if (score >= 90) {
    console.log('🎉 EXCELLENT! Axios-Firestore integration is working perfectly.');
  } else if (score >= 70) {
    console.log('✅ GOOD! Axios-Firestore integration is working well with minor issues.');
  } else if (score >= 50) {
    console.log('⚠️  FAIR! Axios-Firestore integration needs some improvements.');
  } else {
    console.log('❌ POOR! Axios-Firestore integration has significant issues.');
  }
  
  console.log('\n🔧 Recommendations:');
  if (!results.connectivity) console.log('- Fix backend connectivity issues');
  if (!results.dataConsistency) console.log('- Review data format consistency');
  if (!results.errorHandling) console.log('- Improve error handling patterns');
  if (!results.pagination) console.log('- Fix pagination implementation');
  if (!results.search) console.log('- Implement search functionality');
  if (!results.performance) console.log('- Optimize API response times');
}

async function runValidation() {
  try {
    const results = await validateIntegration();
    await testFirestoreCompatibility();
    await generateReport(results);
    
    console.log('\n🏁 Validation completed successfully!');
  } catch (error) {
    console.error('💥 Validation failed:', error);
  }
}

runValidation();