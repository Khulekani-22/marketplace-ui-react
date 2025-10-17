# Profile Sync - Quick Integration Guide

## Quick Start

This guide shows you how to add profile synchronization to your startup and vendor profile pages.

## Step 1: Add Sync Component to Startup Profile

Edit `src/pages/StartupProfilePage.tsx`:

```tsx
import { ProfileSyncStatus } from '../components/ProfileSyncStatus';

function StartupProfilePage() {
  // ... existing code ...

  const handleSyncSuccess = () => {
    // Reload startup data after sync
    loadExistingProfile();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Startup Profile</h1>
      
      {/* Add sync status card */}
      <ProfileSyncStatus 
        profileType="startup"
        onSyncSuccess={handleSyncSuccess}
      />
      
      {/* Rest of your existing form */}
      <form onSubmit={save}>
        {/* ... existing form fields ... */}
      </form>
    </div>
  );
}
```

## Step 2: Add Sync Component to Vendor Profile

Edit `src/pages/VendorProfilePage.tsx`:

```tsx
import { ProfileSyncStatus } from '../components/ProfileSyncStatus';

function VendorProfilePage() {
  // ... existing code ...

  const handleSyncSuccess = () => {
    // Reload vendor data after sync
    fetchVendorData();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Vendor Profile</h1>
      
      {/* Add sync status card */}
      <ProfileSyncStatus 
        profileType="vendor"
        onSyncSuccess={handleSyncSuccess}
      />
      
      {/* Rest of your existing form */}
      <form onSubmit={handleSave}>
        {/* ... existing form fields ... */}
      </form>
    </div>
  );
}
```

## What Users Will See

### Startup Profile Page
```
┌─────────────────────────────────────────────────────────────┐
│ 🔄 Profile Synchronization                      [Sync Now]  │
│                                                               │
│ Your startup and vendor profiles are linked.                │
│ Changes to shared fields will automatically sync.           │
│                                                               │
│ ⏰ Last synced: 1/15/2024, 10:30:00 AM                      │
│ ▼ Synchronized fields                                        │
│   name, contactEmail, phone, website, country, city...      │
└─────────────────────────────────────────────────────────────┘
```

### Vendor Profile Page (No Startup)
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Profile Synchronization              [Create Startup]   │
│                                                               │
│ No startup profile found. Create one to enable              │
│ automatic synchronization.                                   │
└─────────────────────────────────────────────────────────────┘
```

## How It Works

### Automatic Sync (Behind the Scenes)

When users save their profile:

1. **User clicks "Save Profile"**
   ```
   POST /api/data/startups
   {
     "name": "My Startup",
     "contactEmail": "user@example.com",
     "phone": "+1234567890",
     ...
   }
   ```

2. **Backend saves startup**
   - Saves to Firestore
   - Checks for linked vendor profile
   - Syncs common fields automatically

3. **Response includes sync status**
   ```json
   {
     "id": "startup-123",
     "name": "My Startup",
     ...
     "syncedToVendor": true,
     "lastSyncedAt": "2024-01-15T10:30:00Z"
   }
   ```

### Manual Sync

When users click "Sync Now":

1. **Frontend calls sync endpoint**
   ```javascript
   POST /api/sync/now
   ```

2. **Backend syncs profiles**
   - Finds both profiles by ownerUid
   - Compares last updated times
   - Syncs from newer to older

3. **Success notification shown**
   ```
   ✅ Profiles synchronized successfully! (vendor_to_startup)
   ```

### Create Missing Profile

When users click "Create Vendor" or "Create Startup":

1. **Frontend calls create endpoint**
   ```javascript
   POST /api/sync/create-missing
   { "sourceType": "startup" }
   ```

2. **Backend creates new profile**
   - Copies common fields from existing profile
   - Maps special fields (e.g., elevatorPitch → description)
   - Saves new profile to Firestore

3. **Success notification shown**
   ```
   ✅ Vendor profile created successfully!
   ```

## Synchronized Fields

These fields automatically sync between profiles:

| Field | Description |
|-------|-------------|
| `name` | Business/company name |
| `contactEmail` | Primary contact email |
| `phone` | Phone number |
| `website` | Website URL |
| `country` | Country location |
| `city` | City location |
| `addressLine` | Street address |
| `categories` | Business categories |
| `tags` | Profile tags |

## Testing Your Integration

### Test 1: Startup to Vendor Sync

1. Go to `/profile-startup`
2. Create or update startup profile
3. Change name to "Test Company Updated"
4. Click "Save Profile"
5. Go to `/profile-vendor`
6. Verify name changed to "Test Company Updated"

### Test 2: Vendor to Startup Sync

1. Go to `/profile-vendor`
2. Change phone number to "+9876543210"
3. Click "Save Profile"
4. Go to `/profile-startup`
5. Verify phone number updated

### Test 3: Manual Sync

1. Make changes in one profile
2. Go to the other profile
3. Click "Sync Now" button
4. Verify changes appear immediately

### Test 4: Create Missing Profile

1. Create only a startup profile
2. Check sync status card
3. Click "Create Vendor" button
4. Go to `/profile-vendor`
5. Verify vendor profile was created with startup data

## Troubleshooting

### Sync Status Card Not Appearing

**Problem:** ProfileSyncStatus component doesn't show up

**Solutions:**
- Check that component is imported correctly
- Verify user is authenticated (Firebase token present)
- Check browser console for errors
- Ensure backend is running on correct port

### Profiles Not Syncing

**Problem:** Changes don't sync between profiles

**Solutions:**
- Verify both profiles have same `ownerUid`
- Check backend logs for `[ProfileSync]` messages
- Ensure profiles are in same tenant
- Verify fields are in the SYNC_FIELDS list

### "Sync Now" Button Not Working

**Problem:** Manual sync fails or does nothing

**Solutions:**
- Check that both profiles exist
- Verify user authentication is valid
- Look for error messages in sync status card
- Check network tab for 401/403 errors

## API Reference

### Check Sync Status
```
GET /api/sync/status
Authorization: Firebase token (automatic via cookies)

Response:
{
  "hasStartup": true,
  "hasVendor": true,
  "canSync": true,
  "startupLastSynced": "2024-01-15T10:30:00Z",
  "vendorLastSynced": "2024-01-15T10:30:00Z"
}
```

### Trigger Manual Sync
```
POST /api/sync/now
Authorization: Firebase token (automatic via cookies)

Response:
{
  "status": "success",
  "synced": true,
  "direction": "vendor_to_startup"
}
```

### Create Missing Profile
```
POST /api/sync/create-missing
Content-Type: application/json
Authorization: Firebase token (automatic via cookies)

Body:
{
  "sourceType": "vendor"  // or "startup"
}

Response:
{
  "status": "success",
  "created": true,
  "type": "startup",
  "id": "new-profile-id"
}
```

## Styling Customization

The ProfileSyncStatus component uses Tailwind CSS classes. You can customize colors:

```tsx
// Custom colors example
<ProfileSyncStatus 
  profileType="startup"
  className="custom-sync-card"  // Add custom classes
/>
```

Or edit the component directly in `src/components/ProfileSyncStatus.tsx` to change:
- Background colors (bg-blue-50, bg-green-50, etc.)
- Border colors (border-blue-200, etc.)
- Text colors (text-gray-600, etc.)
- Button styles (bg-blue-600 hover:bg-blue-700)

## Next Steps

1. ✅ Add ProfileSyncStatus to both profile pages
2. ✅ Test automatic sync by saving profiles
3. ✅ Test manual sync with "Sync Now" button
4. ✅ Test creating missing profile
5. 📝 Customize styling to match your app design
6. 📝 Add sync status to user dashboard (optional)
7. 📝 Set up monitoring for sync failures (optional)

## Support

For issues or questions:
- Check backend logs for `[ProfileSync]` messages
- Review full documentation in `PROFILE_SYNC_GUIDE.md`
- Check Firestore data to verify profile structure
- Test with different user accounts

---

**Integration complete!** Your startup and vendor profiles will now stay synchronized automatically. 🎉
