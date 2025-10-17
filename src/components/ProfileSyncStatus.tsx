import React, { useState, useEffect } from 'react';

interface SyncStatus {
  hasStartup: boolean;
  hasVendor: boolean;
  startupId?: string;
  vendorId?: string;
  startupLastSynced?: string;
  vendorLastSynced?: string;
  syncFields: string[];
  canSync: boolean;
  canCreateStartup: boolean;
  canCreateVendor: boolean;
}

interface ProfileSyncStatusProps {
  profileType: 'startup' | 'vendor';
  onSyncSuccess?: () => void;
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:5055';

export const ProfileSyncStatus: React.FC<ProfileSyncStatusProps> = ({ 
  profileType, 
  onSyncSuccess 
}) => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/api/sync/status`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching sync status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sync status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_BASE}/api/sync/now`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Sync failed');
      }

      setSuccess(`Profiles synchronized successfully! (${data.direction})`);
      await fetchStatus();
      onSyncSuccess?.();
    } catch (err) {
      console.error('Error syncing profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync profiles');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateMissing = async () => {
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const sourceType = profileType === 'startup' ? 'startup' : 'vendor';
      const targetType = profileType === 'startup' ? 'vendor' : 'startup';

      const response = await fetch(`${API_BASE}/api/sync/create-missing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ sourceType }),
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Profile creation failed');
      }

      setSuccess(`${targetType.charAt(0).toUpperCase() + targetType.slice(1)} profile created successfully!`);
      await fetchStatus();
      onSyncSuccess?.();
    } catch (err) {
      console.error('Error creating missing profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-gray-500">
          <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm">Loading sync status...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const lastSynced = profileType === 'startup' 
    ? status.startupLastSynced 
    : status.vendorLastSynced;

  const hasOtherProfile = profileType === 'startup' 
    ? status.hasVendor 
    : status.hasStartup;

  const canCreate = profileType === 'startup' 
    ? status.canCreateVendor 
    : status.canCreateStartup;

  const otherProfileType = profileType === 'startup' ? 'vendor' : 'startup';

  return (
    <div className="space-y-3">
      {/* Sync Status Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {status.canSync ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <h3 className="font-semibold text-gray-900">Profile Synchronization</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              {hasOtherProfile ? (
                <>
                  Your {profileType} and {otherProfileType} profiles are linked.
                  Changes to shared fields will automatically sync.
                </>
              ) : (
                <>
                  No {otherProfileType} profile found. Create one to enable automatic synchronization.
                </>
              )}
            </p>

            {lastSynced && (
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Last synced: {new Date(lastSynced).toLocaleString()}</span>
              </div>
            )}

            {status.canSync && (
              <details className="mt-2">
                <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                  Synchronized fields
                </summary>
                <div className="mt-1 text-xs text-gray-600">
                  {status.syncFields.join(', ')}
                </div>
              </details>
            )}
          </div>

          <div className="flex flex-col space-y-2 ml-4">
            {status.canSync && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            )}

            {canCreate && (
              <button
                onClick={handleCreateMissing}
                disabled={creating}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>{creating ? 'Creating...' : `Create ${otherProfileType.charAt(0).toUpperCase() + otherProfileType.slice(1)}`}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-green-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-red-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSyncStatus;
