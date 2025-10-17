# Profile Synchronization System

## Overview

The Profile Synchronization system keeps startup and vendor profiles synchronized automatically for better data integrity across the marketplace platform. When a user updates their startup profile, the changes automatically sync to their vendor profile (and vice versa).

## Features

### 1. **Automatic Bidirectional Sync**
- Changes to startup profiles automatically sync to linked vendor profiles
- Changes to vendor profiles automatically sync to linked startup profiles
- Syncs common fields like name, email, phone, location, categories, and tags

### 2. **Manual Sync**
- Users can manually trigger synchronization from either profile page
- "Sync Now" button available in the profile sync status card
- Useful for ensuring profiles are up-to-date

### 3. **Auto-Create Missing Profile**
- If a user has a startup profile but no vendor profile (or vice versa), they can create the missing one
- "Create Vendor" or "Create Startup" button appears when applicable
- New profile is populated with data from the existing profile

### 4. **Sync Status Indicator**
- Visual card showing sync status on both profile pages
- Shows last sync timestamp
- Lists which fields are synchronized
- Indicates if profiles are linked or if missing profile exists

## Synchronized Fields

The following fields are synchronized between startup and vendor profiles:

| Field | Startup | Vendor |
|-------|---------|--------|
| `name` | ✅ | ✅ |
| `contactEmail` | ✅ | ✅ |
| `ownerUid` | ✅ | ✅ |
| `phone` | ✅ | ✅ |
| `website` | ✅ | ✅ |
| `country` | ✅ | ✅ |
| `city` | ✅ | ✅ |
| `addressLine` | ✅ | ✅ |
| `categories` | ✅ | ✅ |
| `tags` | ✅ | ✅ |

### Special Field Mappings

**Startup → Vendor:**
- `elevatorPitch` + `productsServices` → `description`
  - Both fields are combined with a double newline separator into the vendor description

**Vendor → Startup:**
- `description` → `elevatorPitch` + `productsServices`
  - First paragraph becomes `elevatorPitch`
  - Remaining paragraphs become `productsServices`
  - Only synced if startup fields are empty (preserves existing content)

### Profile-Specific Fields (Not Synced)

**Startup Only:**
- `elevatorPitch`
- `productsServices`
- `employeeCount`

**Vendor Only:**
- `description`
- `logoUrl`
- `bannerUrl`
- `foundedYear`
- `teamSize`
- `registrationNo`
- `status`
- `kycStatus`
- `socials` (twitter, linkedin, facebook, instagram, youtube, github)

## API Endpoints

### GET `/api/sync/status`

Check synchronization status for the current user.

**Response:**
```json
{
  "hasStartup": true,
  "hasVendor": true,
  "startupId": "uuid-123",
  "vendorId": "uuid-456",
  "startupLastSynced": "2024-01-15T10:30:00Z",
  "vendorLastSynced": "2024-01-15T10:30:00Z",
  "syncFields": ["name", "contactEmail", "phone", ...],
  "canSync": true,
  "canCreateStartup": false,
  "canCreateVendor": false
}
```

### POST `/api/sync/now`

Manually trigger bidirectional synchronization.

**Response (Success):**
```json
{
  "status": "success",
  "message": "Profiles synchronized successfully",
  "synced": true,
  "direction": "vendor_to_startup",
  "startupId": "uuid-123",
  "fieldsUpdated": ["name", "contactEmail", "phone", ...]
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "no_startup_profile",
  "synced": false,
  "hasVendor": true,
  "hasStartup": false
}
```

### POST `/api/sync/create-missing`

Auto-create missing profile from existing one.

**Request:**
```json
{
  "sourceType": "vendor"  // or "startup"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "startup profile created successfully",
  "created": true,
  "type": "startup",
  "id": "uuid-789",
  "fromVendorId": "uuid-456"
}
```

## Backend Implementation

### Files Structure

```
backend/
  utils/
    profileSync.js          # Core synchronization logic
  routes/
    sync.js                 # Sync API endpoints
    startups.js             # Modified to trigger sync on save
    vendors.js              # Modified to trigger sync on save
```

### Key Functions

#### `syncStartupToVendor(startupData)`
Syncs startup profile data to the linked vendor profile.

**Parameters:**
- `startupData` - The startup profile object

**Returns:**
```javascript
{
  synced: boolean,
  vendorId?: string,
  fieldsUpdated?: string[],
  reason?: string,
  error?: string
}
```

#### `syncVendorToStartup(vendorData)`
Syncs vendor profile data to the linked startup profile.

**Parameters:**
- `vendorData` - The vendor profile object

**Returns:**
```javascript
{
  synced: boolean,
  startupId?: string,
  fieldsUpdated?: string[],
  reason?: string,
  error?: string
}
```

#### `bidirectionalSync(ownerUid, email)`
Performs bidirectional synchronization, determining which profile is newer and syncing accordingly.

**Parameters:**
- `ownerUid` - User's Firebase UID
- `email` - User's email address

**Returns:**
```javascript
{
  synced: boolean,
  direction?: 'vendor_to_startup' | 'startup_to_vendor' | 'merged',
  reason?: string,
  error?: string
}
```

#### `autoCreateMissingProfile(ownerUid, email, sourceType)`
Creates a missing profile based on existing profile data.

**Parameters:**
- `ownerUid` - User's Firebase UID
- `email` - User's email address
- `sourceType` - Either `'vendor'` or `'startup'`

**Returns:**
```javascript
{
  created: boolean,
  type?: 'startup' | 'vendor',
  id?: string,
  fromVendorId?: string,
  fromStartupId?: string,
  reason?: string,
  error?: string
}
```

## Frontend Integration

### ProfileSyncStatus Component

Add the sync status component to your profile pages:

```tsx
import { ProfileSyncStatus } from '@/components/ProfileSyncStatus';

function StartupProfilePage() {
  const handleSyncSuccess = () => {
    // Refresh profile data or show notification
    console.log('Profiles synced successfully!');
  };

  return (
    <div>
      <ProfileSyncStatus 
        profileType="startup" 
        onSyncSuccess={handleSyncSuccess}
      />
      {/* Rest of your profile form */}
    </div>
  );
}
```

### Usage in Vendor Profile

```tsx
import { ProfileSyncStatus } from '@/components/ProfileSyncStatus';

function VendorProfilePage() {
  return (
    <div>
      <ProfileSyncStatus 
        profileType="vendor" 
        onSyncSuccess={() => {
          // Reload vendor data
        }}
      />
      {/* Rest of your vendor profile form */}
    </div>
  );
}
```

## How Sync Works

### 1. On Profile Save (Automatic)

When a user saves their startup or vendor profile:

1. **Backend Route Handler** (`POST /api/data/startups` or `/api/data/vendors`)
   - Saves the profile data to Firestore
   - Calls appropriate sync function (`syncStartupToVendor` or `syncVendorToStartup`)
   - Finds matching profile by `ownerUid` or `contactEmail`
   - Updates common fields in the linked profile
   - Adds sync metadata (`lastSyncedAt`, `lastSyncedFrom`)

2. **Response to Frontend**
   - Returns saved profile data
   - Includes sync status (`syncedToVendor` or `syncedToStartup`)
   - Frontend can display confirmation

### 2. Manual Sync

User clicks "Sync Now" button:

1. **Frontend** calls `POST /api/sync/now`
2. **Backend** calls `bidirectionalSync()`
3. **Sync Logic**:
   - Finds both profiles by `ownerUid`
   - Compares `lastSyncedAt` or `updatedAt` timestamps
   - Syncs from newer profile to older profile
   - If equal age, performs merge with vendor taking precedence
4. **Response** includes sync direction and updated fields

### 3. Create Missing Profile

User clicks "Create Vendor" or "Create Startup":

1. **Frontend** calls `POST /api/sync/create-missing` with `sourceType`
2. **Backend** calls `autoCreateMissingProfile()`
3. **Creation Logic**:
   - Verifies source profile exists
   - Checks target profile doesn't already exist
   - Creates new profile with mapped fields
   - Adds creation metadata (`createdFrom`)
4. **Response** includes new profile ID

## Sync Metadata Fields

Profiles include sync-related metadata:

```javascript
{
  // ... other profile fields ...
  lastSyncedAt: "2024-01-15T10:30:00Z",  // ISO timestamp
  lastSyncedFrom: "vendor",               // or "startup"
  syncedToVendor: true,                   // Present in response only
  syncedToStartup: true,                  // Present in response only
  createdFrom: "startup"                  // If auto-created
}
```

## Error Handling

### Common Error Scenarios

1. **No Matching Profile**
   - `reason: 'no_vendor_profile'` or `'no_startup_profile'`
   - User needs to create missing profile

2. **Profile Already Exists**
   - `reason: 'vendor_already_exists'` or `'startup_already_exists'`
   - When trying to auto-create but profile exists

3. **No Changes to Sync**
   - `reason: 'no_changes'`
   - Profiles are already in sync

4. **Authentication Required**
   - HTTP 401 error
   - User must be logged in to sync profiles

5. **Firestore Error**
   - `error: '<error message>'`
   - Database operation failed

## Security

- All sync endpoints require Firebase authentication (`firebaseAuthRequired` middleware)
- Users can only sync their own profiles (matched by `ownerUid` or email)
- Profiles are scoped by `tenantId` to prevent cross-tenant sync
- Sync operations are logged for audit purposes

## Testing

### Manual Testing

1. **Create Startup Profile**
   - Go to `/profile-startup`
   - Fill in profile information
   - Save profile
   - Verify sync status card appears

2. **Create Vendor from Startup**
   - Click "Create Vendor" button in sync status card
   - Verify vendor profile is created with startup data
   - Check that name, email, phone match

3. **Update Startup Profile**
   - Change name, phone, or location
   - Save profile
   - Go to `/profile-vendor`
   - Verify changes synced automatically

4. **Manual Sync**
   - Make changes in vendor profile
   - Click "Sync Now" in startup profile
   - Verify changes reflected

### Automated Testing

Test scripts can be created to verify:
- Sync triggers on profile save
- Bidirectional sync works correctly
- Field mappings are accurate
- Auto-create populates fields correctly
- Error handling works as expected

## Troubleshooting

### Profiles Not Syncing

1. **Check ownerUid Match**
   - Both profiles must have same `ownerUid` OR same `contactEmail`
   - Verify Firebase UID is set correctly

2. **Check Tenant Scope**
   - Profiles in different tenants won't sync
   - Verify both profiles have same `tenantId`

3. **Check Backend Logs**
   - Look for `[ProfileSync]` log messages
   - Check for errors in sync functions

### Sync Status Not Loading

1. **Check Authentication**
   - User must be logged in
   - Firebase token must be valid

2. **Check API Connection**
   - Verify backend is running on correct port
   - Check CORS configuration allows requests

3. **Check Browser Console**
   - Look for fetch errors or 401/403 responses

### Fields Not Updating

1. **Check Field Names**
   - Verify field is in `SYNC_FIELDS` array
   - Check spelling matches exactly

2. **Check Data Format**
   - Arrays (categories, tags) must be valid JSON arrays
   - Emails must be lowercase strings

3. **Check Sync Direction**
   - Some fields only sync one way (e.g., description)
   - Verify source profile has the data

## Future Enhancements

Potential improvements to the sync system:

1. **Conflict Resolution UI**
   - Show both values when conflicts detected
   - Let user choose which to keep

2. **Selective Field Sync**
   - Let users choose which fields to sync
   - Per-field sync controls in settings

3. **Sync History**
   - Track all sync operations
   - Show audit trail of changes

4. **Real-time Sync**
   - Use Firestore listeners for instant sync
   - No need to save/reload

5. **Batch Sync**
   - Admin tool to sync all profiles
   - Useful for data migrations

6. **Sync Notifications**
   - Email or in-app notifications when profiles sync
   - Notify of sync failures

## Conclusion

The Profile Synchronization system ensures data consistency between startup and vendor profiles, reducing manual work and preventing data discrepancies. It operates automatically in the background while providing manual controls for users who need them.

For questions or issues, check the backend logs for `[ProfileSync]` messages or contact support.
