import dotenv from "dotenv";
dotenv.config();

// Import Firestore data store - THIS IS NOW THE ONLY DATA SOURCE
import { getData as getFirestoreData, saveData as saveFirestoreData } from './firestoreDataStore.js';

/**
 * Pure Firestore getData - NO FILE FALLBACK
 * All data now comes from Firestore only
 */
export async function getData(forceReload = false) {
  console.log('[dataStore] Loading from Firestore (FIRESTORE-ONLY MODE)...');
  try {
    const firestoreData = await getFirestoreData(forceReload);
    console.log('[dataStore] ✅ Successfully loaded from Firestore');
    return firestoreData;
  } catch (error) {
    console.error('[dataStore] ❌ Firestore failed:', error.message);
    throw new Error(`Failed to load data from Firestore: ${error.message}`);
  }
}

/**
 * Pure Firestore saveData - NO FILE FALLBACK
 * All data now saves to Firestore only
 */
export async function saveData(data) {
  // Validate data parameter
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data parameter: must be an object');
  }

  console.log('[dataStore] Saving to Firestore (FIRESTORE-ONLY MODE)...');
  try {
    await saveFirestoreData(data);
    console.log('[dataStore] ✅ Successfully saved to Firestore');
    return data;
  } catch (error) {
    console.error('[dataStore] ❌ Failed to save to Firestore:', error.message);
    throw new Error(`Failed to save data to Firestore: ${error.message}`);
  }
}

// Legacy exports for backward compatibility (all point to Firestore now)
export default { getData, saveData };
