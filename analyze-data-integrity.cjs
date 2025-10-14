const data = require('./backend/appData.json');

console.log('=== DATA INTEGRITY ANALYSIS ===\n');

// Get all vendor names
const vendorNames = data.vendors.map(v => v.name);
console.log('Registered Vendors:');
vendorNames.forEach(name => console.log(`  - ${name}`));

// Get all service vendors
const serviceVendors = [...new Set(data.services.map(s => s.vendor))];
console.log('\nService Providers:');
serviceVendors.forEach(name => console.log(`  - ${name}`));

// Find service providers not in vendors
const missingVendors = serviceVendors.filter(sv => !vendorNames.includes(sv));
console.log('\n🔴 SERVICE PROVIDERS NOT IN VENDORS COLLECTION:');
missingVendors.forEach(name => console.log(`  - ${name}`));

// Find startups that are also service vendors
const startupNames = data.startups.map(s => s.name);
const startupsAsVendors = serviceVendors.filter(sv => startupNames.includes(sv));
console.log('\n🟡 STARTUPS THAT ARE ALSO SERVICE PROVIDERS:');
startupsAsVendors.forEach(name => console.log(`  - ${name}`));

// Find the startup details for those that should be vendors
console.log('\n📋 STARTUP DETAILS FOR MISSING VENDORS:');
missingVendors.forEach(vendorName => {
  const startup = data.startups.find(s => s.name === vendorName);
  if (startup) {
    console.log(`\n${vendorName}:`);
    console.log(`  Contact Email: ${startup.contactEmail || 'Not provided'}`);
    console.log(`  Description: ${startup.description?.substring(0, 100)}...`);
    console.log(`  Industry: ${startup.industry || 'Not specified'}`);
    
    // Find services provided by this vendor
    const vendorServices = data.services.filter(s => s.vendor === vendorName);
    console.log(`  Services Provided: ${vendorServices.length}`);
    vendorServices.forEach(service => {
      console.log(`    - ${service.title} (${service.category})`);
    });
  }
});

console.log('\n=== SUMMARY ===');
console.log(`Total Vendors: ${data.vendors.length}`);
console.log(`Total Service Providers: ${serviceVendors.length}`);
console.log(`Missing Vendor Records: ${missingVendors.length}`);
console.log(`Startups Also Providing Services: ${startupsAsVendors.length}`);