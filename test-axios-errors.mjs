// Test axios error handling with Firestore
import axios from 'axios';

console.log('🧪 Testing axios error handling with Firestore...\n');

const API_BASE_URL = process.env.TEST_API_BASE_URL || 'http://localhost:5055';

const api = axios.create({ 
  baseURL: API_BASE_URL,
  timeout: 5000
});

async function testErrorHandling() {
  const tests = [
    {
      name: 'Network Error (Invalid URL)',
      test: async () => {
        try {
          await axios.get('http://nonexistent-server:9999/api/health', { timeout: 2000 });
          return { success: false, error: 'Should have failed' };
        } catch (error) {
          return { 
            success: axios.isAxiosError(error) && error.code === 'ERR_NETWORK',
            error: error.message,
            code: error.code
          };
        }
      }
    },
    
    {
      name: '404 Error (Route Not Found)',
      test: async () => {
        try {
          await api.get('/api/nonexistent-endpoint');
          return { success: false, error: 'Should have failed' };
        } catch (error) {
          return { 
            success: axios.isAxiosError(error) && error.response?.status === 404,
            error: error.response?.data?.message || error.message,
            status: error.response?.status
          };
        }
      }
    },
    
    {
      name: '401 Error (Unauthorized)',
      test: async () => {
        try {
          await api.get('/api/admin/users'); // Requires auth
          return { success: false, error: 'Should have failed or returned empty' };
        } catch (error) {
          return { 
            success: axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403),
            error: error.response?.data?.message || error.message,
            status: error.response?.status
          };
        }
      }
    },
    
    {
      name: 'Timeout Error',
      test: async () => {
        try {
          // Create a very short timeout to force timeout
          await axios.get(`${API_BASE_URL}/api/health`, { timeout: 1 });
          return { success: false, error: 'Should have timed out' };
        } catch (error) {
          return { 
            success: axios.isAxiosError(error) && error.code === 'ECONNABORTED',
            error: error.message,
            code: error.code
          };
        }
      }
    },
    
    {
      name: 'Invalid JSON Response',
      test: async () => {
        try {
          // Try to get a non-JSON endpoint if it exists
          const response = await api.get('/api/health');
          // If successful, test JSON parsing
          return { 
            success: typeof response.data === 'object',
            error: 'None - valid JSON response',
            data: response.data
          };
        } catch (error) {
          return { 
            success: axios.isAxiosError(error),
            error: error.message,
            status: error.response?.status
          };
        }
      }
    }
  ];

  console.log('🧪 Running error handling tests...\n');
  
  for (const testCase of tests) {
    console.log(`Testing: ${testCase.name}`);
    try {
      const result = await testCase.test();
      if (result.success) {
        console.log(`✅ PASSED: ${result.error}`);
      } else {
        console.log(`❌ FAILED: ${result.error}`);
        if (result.status) console.log(`   Status: ${result.status}`);
        if (result.code) console.log(`   Code: ${result.code}`);
      }
    } catch (error) {
      console.log(`💥 TEST ERROR: ${error.message}`);
    }
    console.log(''); // spacing
  }
}

// Test axios interceptors
async function testInterceptors() {
  console.log('🔧 Testing axios interceptors...\n');
  
  let requestIntercepted = false;
  let responseIntercepted = false;
  
  const testApi = axios.create({ baseURL: API_BASE_URL });
  
  // Add request interceptor
  testApi.interceptors.request.use(
    config => {
      requestIntercepted = true;
      console.log('✅ Request interceptor working');
      return config;
    },
    error => Promise.reject(error)
  );
  
  // Add response interceptor
  testApi.interceptors.response.use(
    response => {
      responseIntercepted = true;
      console.log('✅ Response interceptor working');
      return response;
    },
    error => {
      responseIntercepted = true;
      console.log('✅ Error response interceptor working');
      return Promise.reject(error);
    }
  );
  
  try {
    await testApi.get('/api/health');
    console.log(`Request intercepted: ${requestIntercepted}`);
    console.log(`Response intercepted: ${responseIntercepted}`);
  } catch (error) {
    console.log('Interceptor test failed:', error.message);
  }
  
  console.log(''); // spacing
}

async function runErrorTests() {
  await testInterceptors();
  await testErrorHandling();
  console.log('🏁 Axios error handling tests completed!');
}

runErrorTests();