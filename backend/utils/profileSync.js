// utils/profileSync.js
/**
 * Profile Synchronization Utility
 * Keeps vendor and startup profiles synchronized for data integrity
 */

import { getData, saveData } from './hybridDataStore.js';

/**
 * Common fields that should be synchronized between vendor and startup profiles
 */
const SYNC_FIELDS = [
  'name',
  'contactEmail',
  'ownerUid',
  'phone',
  'website',
  'country',
  'city',
  'addressLine',
  'categories',
  'tags',
];

/**
 * Normalize email for comparison
 */
function normalizeEmail(email) {
  return (email || '').toString().trim().toLowerCase();
}

/**
 * Find a vendor profile by owner UID or email
 */
function findVendor(vendors, ownerUid, email) {
  const normalizedEmail = normalizeEmail(email);
  return vendors.find((v) => 
    (ownerUid && v.ownerUid === ownerUid) ||
    (normalizedEmail && normalizeEmail(v.contactEmail || v.email) === normalizedEmail)
  );
}

/**
 * Find a startup profile by owner UID or email
 */
function findStartup(startups, ownerUid, email) {
  const normalizedEmail = normalizeEmail(email);
  return startups.find((s) => 
    (ownerUid && s.ownerUid === ownerUid) ||
    (normalizedEmail && normalizeEmail(s.contactEmail || s.email) === normalizedEmail)
  );
}

/**
 * Sync startup data to vendor profile
 * Called when startup profile is saved
 */
export async function syncStartupToVendor(startupData) {
  try {
    const data = await getData();
    const vendor = findVendor(data.vendors || [], startupData.ownerUid, startupData.contactEmail);
    
    if (!vendor) {
      console.log('[ProfileSync] No vendor profile found to sync with startup:', startupData.id);
      return { synced: false, reason: 'no_vendor_profile' };
    }

    console.log('[ProfileSync] Syncing startup to vendor:', { 
      startupId: startupData.id, 
      vendorId: vendor.id 
    });

    // Sync common fields from startup to vendor
    let changed = false;
    SYNC_FIELDS.forEach((field) => {
      if (startupData[field] !== undefined) {
        if (JSON.stringify(vendor[field]) !== JSON.stringify(startupData[field])) {
          vendor[field] = startupData[field];
          changed = true;
        }
      }
    });

    // Sync description from startup's pitch and products
    if (startupData.elevatorPitch || startupData.productsServices) {
      const description = [
        startupData.elevatorPitch || '',
        startupData.productsServices || ''
      ].filter(Boolean).join('\n\n');
      
      if (description && vendor.description !== description) {
        vendor.description = description;
        changed = true;
      }
    }

    // Update timestamp
    if (changed) {
      vendor.lastSyncedAt = new Date().toISOString();
      vendor.lastSyncedFrom = 'startup';
      await saveData(data);
      console.log('[ProfileSync] ✅ Synced startup to vendor successfully');
      return { synced: true, vendorId: vendor.id, fieldsUpdated: SYNC_FIELDS };
    }

    return { synced: false, reason: 'no_changes' };
  } catch (error) {
    console.error('[ProfileSync] Error syncing startup to vendor:', error);
    return { synced: false, error: error.message };
  }
}

/**
 * Sync vendor data to startup profile
 * Called when vendor profile is saved
 */
export async function syncVendorToStartup(vendorData) {
  try {
    const data = await getData();
    const startup = findStartup(data.startups || [], vendorData.ownerUid, vendorData.contactEmail);
    
    if (!startup) {
      console.log('[ProfileSync] No startup profile found to sync with vendor:', vendorData.id);
      return { synced: false, reason: 'no_startup_profile' };
    }

    console.log('[ProfileSync] Syncing vendor to startup:', { 
      vendorId: vendorData.id, 
      startupId: startup.id 
    });

    // Sync common fields from vendor to startup
    let changed = false;
    SYNC_FIELDS.forEach((field) => {
      if (vendorData[field] !== undefined) {
        if (JSON.stringify(startup[field]) !== JSON.stringify(vendorData[field])) {
          startup[field] = vendorData[field];
          changed = true;
        }
      }
    });

    // Sync description back to elevator pitch (if startup fields are empty)
    if (vendorData.description && !startup.elevatorPitch) {
      // Take first paragraph as elevator pitch
      const paragraphs = vendorData.description.split('\n\n');
      if (paragraphs.length > 0) {
        startup.elevatorPitch = paragraphs[0];
        changed = true;
      }
      if (paragraphs.length > 1) {
        startup.productsServices = paragraphs.slice(1).join('\n\n');
        changed = true;
      }
    }

    // Update timestamp
    if (changed) {
      startup.lastSyncedAt = new Date().toISOString();
      startup.lastSyncedFrom = 'vendor';
      await saveData(data);
      console.log('[ProfileSync] ✅ Synced vendor to startup successfully');
      return { synced: true, startupId: startup.id, fieldsUpdated: SYNC_FIELDS };
    }

    return { synced: false, reason: 'no_changes' };
  } catch (error) {
    console.error('[ProfileSync] Error syncing vendor to startup:', error);
    return { synced: false, error: error.message };
  }
}

/**
 * Bi-directional sync - ensures both profiles are in sync
 * Used for manual sync or data integrity checks
 */
export async function bidirectionalSync(ownerUid, email) {
  try {
    const data = await getData();
    const vendor = findVendor(data.vendors || [], ownerUid, email);
    const startup = findStartup(data.startups || [], ownerUid, email);

    if (!vendor || !startup) {
      return { 
        synced: false, 
        reason: !vendor ? 'no_vendor_profile' : 'no_startup_profile',
        hasVendor: !!vendor,
        hasStartup: !!startup
      };
    }

    console.log('[ProfileSync] Bi-directional sync:', { 
      vendorId: vendor.id, 
      startupId: startup.id 
    });

    // Determine which profile is newer based on lastSyncedAt or updatedAt
    const vendorTime = new Date(vendor.lastSyncedAt || vendor.updatedAt || 0).getTime();
    const startupTime = new Date(startup.lastSyncedAt || startup.updatedAt || 0).getTime();

    let result;
    if (vendorTime > startupTime) {
      // Vendor is newer, sync vendor → startup
      result = await syncVendorToStartup(vendor);
      result.direction = 'vendor_to_startup';
    } else if (startupTime > vendorTime) {
      // Startup is newer, sync startup → vendor
      result = await syncStartupToVendor(startup);
      result.direction = 'startup_to_vendor';
    } else {
      // Both are same age, merge any differences (vendor takes precedence)
      result = await syncVendorToStartup(vendor);
      result.direction = 'merged';
    }

    return result;
  } catch (error) {
    console.error('[ProfileSync] Error in bidirectional sync:', error);
    return { synced: false, error: error.message };
  }
}

/**
 * Auto-create missing profile
 * If user has vendor but no startup (or vice versa), create the missing one
 */
export async function autoCreateMissingProfile(ownerUid, email, sourceType = 'vendor') {
  try {
    const data = await getData();
    const normalizedEmail = normalizeEmail(email);
    
    if (sourceType === 'vendor') {
      const vendor = findVendor(data.vendors || [], ownerUid, email);
      if (!vendor) {
        return { created: false, reason: 'source_vendor_not_found' };
      }

      const existingStartup = findStartup(data.startups || [], ownerUid, email);
      if (existingStartup) {
        return { created: false, reason: 'startup_already_exists' };
      }

      // Create startup from vendor
      const startup = {
        id: ownerUid || vendor.id,
        name: vendor.name,
        contactEmail: normalizedEmail,
        ownerUid: ownerUid,
        phone: vendor.phone || '',
        website: vendor.website || '',
        elevatorPitch: vendor.description ? vendor.description.split('\n\n')[0] : '',
        productsServices: vendor.description ? vendor.description.split('\n\n').slice(1).join('\n\n') : '',
        country: vendor.country || '',
        city: vendor.city || '',
        addressLine: vendor.addressLine || '',
        categories: vendor.categories || [],
        tags: vendor.tags || [],
        employeeCount: 0,
        tenantId: vendor.tenantId || 'public',
        createdAt: new Date().toISOString(),
        createdFrom: 'vendor',
      };

      data.startups = data.startups || [];
      data.startups.push(startup);
      await saveData(data);

      console.log('[ProfileSync] ✅ Auto-created startup from vendor:', startup.id);
      return { created: true, type: 'startup', id: startup.id, fromVendorId: vendor.id };

    } else if (sourceType === 'startup') {
      const startup = findStartup(data.startups || [], ownerUid, email);
      if (!startup) {
        return { created: false, reason: 'source_startup_not_found' };
      }

      const existingVendor = findVendor(data.vendors || [], ownerUid, email);
      if (existingVendor) {
        return { created: false, reason: 'vendor_already_exists' };
      }

      // Create vendor from startup
      const description = [
        startup.elevatorPitch || '',
        startup.productsServices || ''
      ].filter(Boolean).join('\n\n');

      const vendor = {
        id: ownerUid || startup.id,
        name: startup.name,
        contactEmail: normalizedEmail,
        ownerUid: ownerUid,
        phone: startup.phone || '',
        website: startup.website || '',
        description: description,
        country: startup.country || '',
        city: startup.city || '',
        addressLine: startup.addressLine || '',
        categories: startup.categories || [],
        tags: startup.tags || [],
        status: 'pending',
        kycStatus: 'pending',
        tenantId: startup.tenantId || 'public',
        createdAt: new Date().toISOString(),
        createdFrom: 'startup',
      };

      data.vendors = data.vendors || [];
      data.vendors.push(vendor);
      await saveData(data);

      console.log('[ProfileSync] ✅ Auto-created vendor from startup:', vendor.id);
      return { created: true, type: 'vendor', id: vendor.id, fromStartupId: startup.id };
    }

    return { created: false, reason: 'invalid_source_type' };
  } catch (error) {
    console.error('[ProfileSync] Error auto-creating missing profile:', error);
    return { created: false, error: error.message };
  }
}

export {
  syncStartupToVendor,
  syncVendorToStartup,
  SYNC_FIELDS,
};
