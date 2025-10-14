const admin = require('firebase-admin');
const appData = require('./backend/appData.json');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function syncStartupsToVendors() {
  console.log('🔄 Starting vendor synchronization...\n');
  
  try {
    // Get service providers that are not in vendors collection
    const vendorNames = appData.vendors.map(v => v.name);
    const serviceVendors = [...new Set(appData.services.map(s => s.vendor))];
    const missingVendors = serviceVendors.filter(sv => !vendorNames.includes(sv));
    
    console.log(`Found ${missingVendors.length} service providers missing from vendors collection:`);
    missingVendors.forEach(name => console.log(`  - ${name}`));
    
    if (missingVendors.length === 0) {
      console.log('✅ No missing vendor records found!');
      return;
    }
    
    // Process each missing vendor
    for (const vendorName of missingVendors) {
      console.log(`\n🔧 Processing: ${vendorName}`);
      
      // Find the startup details
      const startup = appData.startups.find(s => s.name === vendorName);
      if (!startup) {
        console.log(`❌ No startup found with name: ${vendorName}`);
        continue;
      }
      
      // Find services provided by this vendor
      const vendorServices = appData.services.filter(s => s.vendor === vendorName);
      console.log(`📋 Services provided: ${vendorServices.length}`);
      
      // Create vendor record from startup data
      const vendorRecord = {
        id: startup.uid || generateId(),
        vendorId: startup.uid || generateId(),
        name: startup.name,
        companyName: startup.name,
        email: startup.contactEmail || startup.email || '',
        contactEmail: startup.contactEmail || startup.email || '',
        website: startup.website || '',
        phone: startup.phone || '',
        country: startup.country || 'South Africa',
        city: startup.city || '',
        address: startup.address || '',
        bio: startup.description || '',
        avatar: startup.logoUrl || startup.imageUrl || '',
        skills: vendorServices.map(s => s.category).filter((v, i, a) => a.indexOf(v) === i),
        rating: 4.5, // Default rating
        totalEarnings: 0,
        completedProjects: 0,
        responseTime: '2 hours',
        languages: ['English'],
        certifications: [],
        portfolio: [],
        availability: 'Available',
        hourlyRate: 500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        isVerified: false,
        metadata: {
          source: 'startup-sync',
          originalStartupData: true
        }
      };
      
      console.log(`📝 Creating vendor record for: ${vendorRecord.name}`);
      console.log(`   Email: ${vendorRecord.contactEmail}`);
      console.log(`   Skills: ${vendorRecord.skills.join(', ')}`);
      
      // Add to Firestore
      try {
        await db.collection('vendors').doc(vendorRecord.id).set(vendorRecord);
        console.log(`✅ Successfully added vendor: ${vendorRecord.name}`);
        
        // Update local appData.json as well
        appData.vendors.push(vendorRecord);
        
      } catch (error) {
        console.error(`❌ Error adding vendor ${vendorRecord.name}:`, error.message);
      }
    }
    
    // Write updated data back to file
    const fs = require('fs');
    fs.writeFileSync('./backend/appData.json', JSON.stringify(appData, null, 2));
    console.log(`\n💾 Updated local appData.json file`);
    
    console.log(`\n🎉 Vendor synchronization completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Missing vendors found: ${missingVendors.length}`);
    console.log(`   - Vendors added to Firestore: ${missingVendors.length}`);
    console.log(`   - Total vendors now: ${appData.vendors.length}`);
    
  } catch (error) {
    console.error('❌ Error during synchronization:', error);
  } finally {
    process.exit(0);
  }
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Run the sync
syncStartupsToVendors();