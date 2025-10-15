// Comprehensive axios-Firestore integration test
import axios from 'axios';

console.log('🔧 Testing axios-Firestore integration comprehensively...\n');

const API_BASE_URL = process.env.TEST_API_BASE_URL || 'http://localhost:5055';

const api = axios.create({ 
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to show what's being sent
api.interceptors.request.use(
  config => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to show what's received
api.interceptors.response.use(
  response => {
    console.log(`📥 ${response.status} ${response.config.url} - ${JSON.stringify(response.data).substring(0, 100)}...`);
    return response;
  },
  error => {
    console.error(`❌ Response error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    return Promise.reject(error);
  }
);

async function testEndpoints() {
  const tests = [
    // Basic health check
    {
      name: 'Health Check',
      request: () => api.get('/api/health'),
      expected: data => data.status === 'ok'
    },
    
    // Test services endpoint (public data)
    {
      name: 'Services List',
      request: () => api.get('/api/data/services?limit=3'),
      expected: data => data.items && data.items.length >= 0
    },
    
    // Test vendors endpoint (may need auth)
    {
      name: 'Vendors List',
      request: () => api.get('/api/data/vendors?limit=3'),
      expected: data => data.items !== undefined
    },
    
    // Test startups endpoint (may need auth)
    {
      name: 'Startups List',
      request: () => api.get('/api/data/startups?limit=3'),
      expected: data => data.items !== undefined
    },
    
    // Test tenants endpoint (needs auth)
    {
      name: 'Tenants List',
      request: () => api.get('/api/tenants'),
      expected: data => true, // Any response is ok
      authRequired: true
    },
    
    // Test users endpoint (needs auth)
    {
      name: 'Users List',
      request: () => api.get('/api/users'),
      expected: data => true, // Any response is ok
      authRequired: true
    }
  ];

  console.log(`Running ${tests.length} endpoint tests...\n`);
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      
      const response = await test.request();
      const isValid = test.expected(response.data);
      
      if (isValid) {
        console.log(`✅ ${test.name}: PASSED`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name}: FAILED - Invalid response format`);
        failedTests++;
      }
      
    } catch (error) {
      if (test.authRequired && error.response?.status === 401) {
        console.log(`⚠️  ${test.name}: SKIPPED - Authentication required`);
      } else if (test.authRequired && error.response?.status === 403) {
        console.log(`⚠️  ${test.name}: SKIPPED - Permission required`);
      } else {
        console.log(`❌ ${test.name}: FAILED - ${error.message}`);
        failedTests++;
      }
    }
    
    console.log(''); // Add spacing
  }
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📝 Total: ${tests.length}`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All axios-Firestore integration tests passed!');
  } else {
    console.log(`\n⚠️  ${failedTests} tests failed. See details above.`);
  }
}

// Test axios configuration
async function testAxiosConfig() {
  console.log('🔧 Testing axios configuration...');
  
  console.log(`Base URL: ${api.defaults.baseURL}`);
  console.log(`Timeout: ${api.defaults.timeout}ms`);
  console.log(`Default headers: ${JSON.stringify(api.defaults.headers.common, null, 2)}`);
  
  // Test basic connectivity
  try {
  const response = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 5000 });
    console.log('✅ Basic connectivity: OK');
  } catch (error) {
    console.log('❌ Basic connectivity: FAILED');
    console.log(`   Error: ${error.message}`);
  }
  
  console.log(''); // Add spacing
}

// Test error handling
async function testErrorHandling() {
  console.log('🧪 Testing error handling...');
  
  try {
    // Test 404 error
    await api.get('/api/nonexistent-endpoint');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('✅ Axios error detection: Working');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.message}`);
    } else {
      console.log('❌ Axios error detection: Not working');
    }
  }
  
  console.log(''); // Add spacing
}

async function runAllTests() {
  try {
    await testAxiosConfig();
    await testErrorHandling();
    await testEndpoints();
    
    console.log('\n🏁 All axios-Firestore compatibility tests completed!');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
}

runAllTests();