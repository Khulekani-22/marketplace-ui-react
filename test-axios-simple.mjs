// Simple axios test using curl-like approach
import axios from 'axios';

console.log('🧪 Testing axios with Firestore backend...\n');

const api = axios.create({ 
  baseURL: 'http://localhost:5173',
  timeout: 10000
});

async function testAPI() {
  try {
    // Test health endpoint
    console.log('🏥 Testing health endpoint...');
    const health = await api.get('/api/health');
    console.log(`✅ Health: ${health.data.status}`);

    // Test services endpoint
    console.log('\n📋 Testing services endpoint...');
    const services = await api.get('/api/data/services?limit=2');
    console.log(`✅ Services: ${services.data.items?.length || 0} items loaded`);
    console.log(`   First service: ${services.data.items?.[0]?.title || 'N/A'}`);

    // Test vendors endpoint
    console.log('\n👥 Testing vendors endpoint...');
    const vendors = await api.get('/api/data/vendors?limit=2');
    console.log(`✅ Vendors: ${vendors.data.items?.length || 0} items loaded`);
    console.log(`   First vendor: ${vendors.data.items?.[0]?.name || 'N/A'}`);

    // Test startups endpoint
    console.log('\n🚀 Testing startups endpoint...');
    const startups = await api.get('/api/data/startups?limit=2');
    console.log(`✅ Startups: ${startups.data.items?.length || 0} items loaded`);
    console.log(`   First startup: ${startups.data.items?.[0]?.name || 'N/A'}`);

    console.log('\n🎉 All axios tests passed! Firestore integration is working.');
    
  } catch (error) {
    console.error('❌ Axios test failed:', error.message);
    
    if (axios.isAxiosError(error)) {
      console.error(`   Status: ${error.response?.status || 'No response'}`);
      console.error(`   URL: ${error.config?.url || 'Unknown'}`);
      console.error(`   Data:`, error.response?.data || 'No data');
    }
  }
}

testAPI();