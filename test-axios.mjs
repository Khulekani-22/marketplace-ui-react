// Test axios configuration with Firestore
import { api } from './src/lib/api.js';

console.log('🧪 Testing axios configuration...\n');

async function testAxiosConfig() {
  try {
    console.log('Current axios config:');
    console.log(`- Base URL: ${api.defaults.baseURL}`);
    console.log(`- Timeout: ${api.defaults.timeout || 'default'}`);
    console.log(`- Headers: ${JSON.stringify(api.defaults.headers.common, null, 2)}`);

    // Test health endpoint
    console.log('\n🏥 Testing health endpoint...');
    const healthResponse = await api.get('/api/health');
    console.log(`✅ Health check: ${healthResponse.data.status}`);

    // Test services endpoint  
    console.log('\n📋 Testing services endpoint...');
    const servicesResponse = await api.get('/api/data/services', { params: { limit: 2 } });
    console.log(`✅ Services loaded: ${servicesResponse.data.items?.length || 0} items`);

    // Test vendors endpoint
    console.log('\n👥 Testing vendors endpoint...');
    const vendorsResponse = await api.get('/api/data/vendors', { params: { limit: 2 } });
    console.log(`✅ Vendors loaded: ${vendorsResponse.data.items?.length || 0} items`);

    console.log('\n🎉 All axios tests passed!');
    
  } catch (error) {
    console.error('❌ Axios test failed:', error.message);
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
    }
    if (error.config) {
      console.error(`Request URL: ${error.config.baseURL}${error.config.url}`);
    }
  }
}

testAxiosConfig();