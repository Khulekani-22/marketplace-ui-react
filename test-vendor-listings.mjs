#!/usr/bin/env node

/**
 * Test Vendor Listings Endpoint
 * Simulates the backend logic to debug why listings aren't showing
 */

import { getData } from './backend/utils/hybridDataStore.js';

function normalizeEmail(value) {
  return (value || '').toString().trim().toLowerCase();
}

function normalizeTenantId(id) {
  if (!id) return 'public';
  const v = String(id).toLowerCase();
  return v === 'vendor' ? 'public' : v;
}

function sameTenant(tenantValue, tenantScope) {
  const a = normalizeTenantId(tenantValue);
  const b = normalizeTenantId(tenantScope);
  return a === b || (!tenantValue && b === 'public');
}

function findVendorRecord(data, tenantId, { uid, email }) {
  const emailLc = normalizeEmail(email);
  const pools = [
    Array.isArray(data?.startups) ? data.startups : [],
    Array.isArray(data?.vendors) ? data.vendors : [],
    Array.isArray(data?.companies) ? data.companies : [],
    Array.isArray(data?.profiles) ? data.profiles : [],
  ];

  // Don't filter by tenant during vendor lookup - vendors can own services in multiple tenants
  const lookup = (arr, predicate) => arr.find((v) => predicate(v));

  if (uid) {
    for (const arr of pools) {
      const hit = lookup(arr, (v) => String(v?.ownerUid || v?.uid || v?.id || "") === uid);
      if (hit) return hit;
    }
  }

  if (emailLc) {
    for (const arr of pools) {
      const hit = lookup(arr, (v) => normalizeEmail(v?.contactEmail || v?.email) === emailLc);
      if (hit) return hit;
    }

    for (const arr of pools) {
      const hit = lookup(
        arr,
        (v) => Array.isArray(v?.members) && v.members.some((m) => normalizeEmail(m?.email) === emailLc)
      );
      if (hit) return hit;
    }
  }

  return null;
}

async function testVendorListings() {
  console.log('🧪 Testing Vendor Listings Endpoint Logic...\n');
  
  try {
    const data = await getData();
    const services = Array.isArray(data?.services) ? data.services : [];
    const bookings = Array.isArray(data?.bookings) ? data.bookings : [];
    
    // Test with khulekani user
    const testUser = {
      uid: 'tAsFySNxnsW4a7L43wMRVLkJAqE3',
      email: 'khulekani@22onsloane.co'
    };
    const tenantId = 'public';
    
    console.log('=== TEST USER ===');
    console.log('UID:', testUser.uid);
    console.log('Email:', testUser.email);
    console.log('Tenant:', tenantId);
    
    console.log('\n=== FINDING VENDOR RECORD ===');
    const vendorRecord = findVendorRecord(data, tenantId, testUser);
    
    if (!vendorRecord) {
      console.log('❌ No vendor record found!');
      console.log('\nDebugging:');
      console.log('- Total startups:', data.startups?.length || 0);
      console.log('- Total vendors:', data.vendors?.length || 0);
      console.log('- Total companies:', data.companies?.length || 0);
      console.log('- Total profiles:', data.profiles?.length || 0);
      return;
    }
    
    console.log('✅ Vendor record found:');
    console.log(JSON.stringify({
      id: vendorRecord.id,
      vendorId: vendorRecord.vendorId,
      email: vendorRecord.email || vendorRecord.contactEmail,
      name: vendorRecord.name || vendorRecord.companyName,
      ownerUid: vendorRecord.ownerUid
    }, null, 2));
    
    const userEmail = normalizeEmail(testUser.email);
    const vendorId = vendorRecord?.vendorId || vendorRecord?.id || '';
    const vendorEmail = normalizeEmail(vendorRecord?.contactEmail || vendorRecord?.email) || userEmail;
    const vendorNameRaw =
      vendorRecord?.name || vendorRecord?.companyName || vendorRecord?.vendor || (userEmail ? userEmail.split('@')[0] : '');
    const vendorNameLc = (vendorNameRaw || '').toString().trim().toLowerCase();
    const uid = (testUser.uid || '').toString();
    
    console.log('\n=== MATCHING CRITERIA ===');
    console.log('vendorId:', vendorId);
    console.log('vendorEmail:', vendorEmail);
    console.log('vendorName:', vendorNameRaw);
    console.log('uid:', uid);
    
    console.log('\n=== FILTERING SERVICES ===');
    const listings = services.filter((s) => {
      if (!sameTenant(s?.tenantId, tenantId)) return false;
      const sid = (s?.vendorId || '').toString();
      const ownerUid = (s?.ownerUid || s?.ownerId || '').toString();
      const svcEmail = normalizeEmail(s?.contactEmail || s?.email);
      const svcName = (s?.vendor || '').toString().trim().toLowerCase();
      
      const match = (
        (!!vendorId && !!sid && sid === vendorId) ||
        (!!uid && !!ownerUid && ownerUid === uid) ||
        (!!vendorEmail && !!svcEmail && svcEmail === vendorEmail) ||
        (!sid && !!vendorNameLc && !!svcName && svcName === vendorNameLc)
      );
      
      if (match) {
        console.log(`  ✅ Match: ${s.id} - ${s.title}`);
        console.log(`     Service vendorId: ${sid}`);
        console.log(`     Service email: ${svcEmail}`);
      }
      
      return match;
    });
    
    console.log('\n=== RESULTS ===');
    console.log(`Total services in database: ${services.length}`);
    console.log(`Matching listings for vendor: ${listings.length}`);
    
    if (listings.length > 0) {
      console.log('\nListings:');
      listings.forEach((l, i) => {
        console.log(`  ${i + 1}. ${l.title} (ID: ${l.id}, vendorId: ${l.vendorId})`);
      });
    } else {
      console.log('\n❌ No listings found!');
      console.log('\nChecking why:');
      
      // Check if there are services with this vendorId
      const byVendorId = services.filter(s => s.vendorId === vendorId);
      console.log(`- Services with vendorId "${vendorId}": ${byVendorId.length}`);
      
      // Check if there are services with this email
      const byEmail = services.filter(s => normalizeEmail(s.contactEmail || s.email) === vendorEmail);
      console.log(`- Services with email "${vendorEmail}": ${byEmail.length}`);
      
      // Check if there are services with this UID
      const byUid = services.filter(s => String(s.ownerUid || s.ownerId || '') === uid);
      console.log(`- Services with ownerUid "${uid}": ${byUid.length}`);
      
      // Show all service vendorIds
      console.log('\nAll unique vendorIds in services:');
      const uniqueVendorIds = [...new Set(services.map(s => s.vendorId))];
      uniqueVendorIds.forEach(vid => {
        const count = services.filter(s => s.vendorId === vid).length;
        console.log(`  - ${vid}: ${count} services`);
      });
    }
    
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
}

// Run the test
testVendorListings()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
