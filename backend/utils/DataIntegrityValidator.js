import admin from 'firebase-admin';

/**
 * Data Integrity Validator for Marketplace
 * Ensures startups providing services are also registered as vendors
 */
export default class DataIntegrityValidator {
  constructor(db) {
    this.db = db;
  }

  /**
   * Validate that all service providers exist as vendors
   */
  async validateServiceVendors() {
    console.log('🔍 Validating service vendor integrity...');
    
    try {
      // Get all services
      const servicesSnapshot = await this.db.collection('services').get();
      const services = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get all vendors
      const vendorsSnapshot = await this.db.collection('vendors').get();
      const vendors = vendorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get unique service providers
      const serviceVendors = [...new Set(services.map(s => s.vendor))];
      const vendorNames = vendors.map(v => v.name);

      // Find missing vendors
      const missingVendors = serviceVendors.filter(sv => !vendorNames.includes(sv));

      if (missingVendors.length === 0) {
        console.log('✅ All service providers are registered as vendors');
        return { valid: true, missingVendors: [] };
      }

      console.log(`❌ Found ${missingVendors.length} service providers not in vendors collection:`);
      missingVendors.forEach(name => console.log(`  - ${name}`));

      return { valid: false, missingVendors };

    } catch (error) {
      console.error('Error validating service vendors:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Auto-sync missing vendors from startups collection
   */
  async autoSyncMissingVendors() {
    console.log('🔄 Auto-syncing missing vendors...');
    
    const validation = await this.validateServiceVendors();
    if (validation.valid) {
      console.log('✅ No sync needed - all vendors are valid');
      return { synced: 0 };
    }

    if (validation.missingVendors.length === 0) {
      console.log('✅ No missing vendors to sync');
      return { synced: 0 };
    }

    let syncedCount = 0;

    for (const vendorName of validation.missingVendors) {
      try {
        // Find startup with this name
        const startupsSnapshot = await this.db.collection('startups')
          .where('name', '==', vendorName)
          .get();

        if (startupsSnapshot.empty) {
          console.log(`⚠️  No startup found for vendor: ${vendorName}`);
          continue;
        }

        const startupDoc = startupsSnapshot.docs[0];
        const startup = startupDoc.data();

        // Get services for this vendor to determine skills
        const servicesSnapshot = await this.db.collection('services')
          .where('vendor', '==', vendorName)
          .get();
        
        const vendorServices = servicesSnapshot.docs.map(doc => doc.data());
        const skills = [...new Set(vendorServices.map(s => s.category))];

        // Create vendor record
        const vendorRecord = {
          id: startupDoc.id,
          vendorId: startupDoc.id,
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
          skills: skills,
          rating: 4.5,
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
            source: 'auto-sync',
            syncedAt: new Date().toISOString(),
            originalStartupId: startupDoc.id
          }
        };

        // Add to vendors collection
        await this.db.collection('vendors').doc(startupDoc.id).set(vendorRecord);
        console.log(`✅ Synced vendor: ${vendorRecord.name}`);
        syncedCount++;

      } catch (error) {
        console.error(`❌ Error syncing vendor ${vendorName}:`, error.message);
      }
    }

    console.log(`🎉 Auto-sync completed: ${syncedCount} vendors synced`);
    return { synced: syncedCount };
  }

  /**
   * Validate when a new service is added
   */
  async validateNewService(serviceData) {
    const vendorName = serviceData.vendor;
    
    // Check if vendor exists
    const vendorsSnapshot = await this.db.collection('vendors')
      .where('name', '==', vendorName)
      .get();

    if (!vendorsSnapshot.empty) {
      return { valid: true };
    }

    // Check if there's a startup with this name
    const startupsSnapshot = await this.db.collection('startups')
      .where('name', '==', vendorName)
      .get();

    if (startupsSnapshot.empty) {
      return { 
        valid: false, 
        error: `No vendor or startup found with name: ${vendorName}`,
        suggestion: 'Please register as a vendor first or ensure the vendor name matches an existing startup'
      };
    }

    // Auto-sync the vendor
    console.log(`🔄 Auto-syncing vendor for new service: ${vendorName}`);
    await this.autoSyncMissingVendors();

    return { valid: true, autoSynced: true };
  }

  /**
   * Run full integrity check
   */
  async runFullCheck() {
    console.log('🏥 Running full data integrity check...\n');
    
    const results = {
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // Check service vendors
    results.checks.serviceVendors = await this.validateServiceVendors();

    // Additional checks can be added here
    // e.g., orphaned services, duplicate vendors, etc.

    console.log('\n📊 Integrity Check Results:');
    console.log(`Service Vendors: ${results.checks.serviceVendors.valid ? '✅ Valid' : '❌ Issues found'}`);

    return results;
  }
}