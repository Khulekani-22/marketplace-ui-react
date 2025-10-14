#!/usr/bin/env node

/**
 * Data Integrity Fix Script
 * 
 * Fixes vendor data integrity issues:
 * 1. Ensures all vendors have both `id` and `vendorId` fields
 * 2. Normalizes vendor identifiers across collections
 * 3. Updates services to reference correct vendorId
 */

import { getData, saveData } from './backend/utils/hybridDataStore.js';

async function fixVendorDataIntegrity() {
  console.log('🔧 Starting vendor data integrity fix...\n');
  
  try {
    const data = await getData();
    const vendors = data.vendors || [];
    const services = data.services || [];
    const startups = data.startups || [];
    
    console.log('📊 Current state:');
    console.log(`  - Vendors: ${vendors.length}`);
    console.log(`  - Services: ${services.length}`);
    console.log(`  - Startups: ${startups.length}\n`);
    
    // Step 1: Fix vendor records - ensure id and vendorId are consistent
    console.log('Step 1: Normalizing vendor records...');
    const fixedVendors = vendors.map(vendor => {
      const original = { ...vendor };
      
      // If vendorId is missing, use id
      if (!vendor.vendorId && vendor.id) {
        vendor.vendorId = vendor.id;
        console.log(`  ✓ Set vendorId for ${vendor.email || vendor.name}: ${vendor.id}`);
      }
      
      // If id is missing, use vendorId
      if (!vendor.id && vendor.vendorId) {
        vendor.id = vendor.vendorId;
        console.log(`  ✓ Set id for ${vendor.email || vendor.name}: ${vendor.vendorId}`);
      }
      
      // Ensure consistency - vendorId should equal id for simplicity
      if (vendor.id && vendor.vendorId && vendor.id !== vendor.vendorId) {
        console.log(`  ⚠️  Vendor ${vendor.email} has mismatched id (${vendor.id}) and vendorId (${vendor.vendorId})`);
        console.log(`     Keeping vendorId as primary: ${vendor.vendorId}`);
        vendor.id = vendor.vendorId;
      }
      
      return vendor;
    });
    
    // Step 2: Build email and vendorId lookup maps
    console.log('\nStep 2: Building vendor lookup maps...');
    const vendorByEmail = new Map();
    const vendorByOldId = new Map();
    
    fixedVendors.forEach(vendor => {
      const email = (vendor.email || vendor.contactEmail || '').toLowerCase();
      if (email) {
        vendorByEmail.set(email, vendor);
      }
      
      // Track old IDs for migration
      if (vendor.id) {
        vendorByOldId.set(vendor.id, vendor);
      }
    });
    
    // Also check startups for additional vendor info
    startups.forEach(startup => {
      const email = (startup.email || startup.contactEmail || '').toLowerCase();
      if (email && !vendorByEmail.has(email)) {
        const vendorId = startup.vendorId || startup.id;
        console.log(`  📝 Found additional vendor from startups: ${email} (${vendorId})`);
        
        // Check if this vendor exists in our fixed list
        const existing = fixedVendors.find(v => 
          (v.email || v.contactEmail || '').toLowerCase() === email
        );
        
        if (!existing && vendorId) {
          vendorByEmail.set(email, { 
            ...startup, 
            id: vendorId, 
            vendorId: vendorId 
          });
        }
      }
    });
    
    console.log(`  - Email lookup map: ${vendorByEmail.size} entries`);
    console.log(`  - ID lookup map: ${vendorByOldId.size} entries`);
    
    // Step 3: Fix service records - ensure correct vendorId references
    console.log('\nStep 3: Fixing service vendor references...');
    let servicesFixed = 0;
    
    const fixedServices = services.map(service => {
      const original = { ...service };
      let fixed = false;
      
      // Try to match by email first (most reliable)
      const serviceEmail = (service.contactEmail || service.email || '').toLowerCase();
      if (serviceEmail && vendorByEmail.has(serviceEmail)) {
        const vendor = vendorByEmail.get(serviceEmail);
        if (service.vendorId !== vendor.vendorId) {
          console.log(`  ✓ Service "${service.title}" (${service.id})`);
          console.log(`    Old vendorId: ${service.vendorId}`);
          console.log(`    New vendorId: ${vendor.vendorId} (matched by email: ${serviceEmail})`);
          service.vendorId = vendor.vendorId;
          fixed = true;
        }
      }
      
      // If vendorId is missing entirely, try to assign one
      if (!service.vendorId && serviceEmail && vendorByEmail.has(serviceEmail)) {
        const vendor = vendorByEmail.get(serviceEmail);
        console.log(`  ✓ Service "${service.title}" (${service.id}) missing vendorId`);
        console.log(`    Assigned vendorId: ${vendor.vendorId} (by email: ${serviceEmail})`);
        service.vendorId = vendor.vendorId;
        fixed = true;
      }
      
      if (fixed) servicesFixed++;
      return service;
    });
    
    console.log(`\n  Fixed ${servicesFixed} service records`);
    
    // Step 4: Save changes
    console.log('\n📝 Saving changes to Firestore...');
    await saveData({
      ...data,
      vendors: fixedVendors,
      services: fixedServices
    });
    
    console.log('\n✅ Data integrity fix completed successfully!');
    console.log('\nSummary:');
    console.log(`  - Vendors normalized: ${fixedVendors.length}`);
    console.log(`  - Services fixed: ${servicesFixed}`);
    console.log('\n🎯 Vendor listings should now display correctly!');
    
  } catch (error) {
    console.error('❌ Error fixing data integrity:', error);
    throw error;
  }
}

// Run the fix
fixVendorDataIntegrity()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
