import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { toast } from 'react-toastify';

/**
 * Wallet types (matching backend structure)
 */
export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  balanceAfter: number;
}

export interface WalletRecord {
  id: string;
  version: number;
  uid: string | null;
  email: string | null;
  tenantId: string;
  role: string;
  balance: number;
  startingBalance: number;
  transactions: WalletTransaction[];
  lastUpdated: string;
}

export interface RedeemOptions {
  description?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface WalletResponse {
  success: boolean;
  wallet?: WalletRecord;
  error?: string;
}

/**
 * Modern useWallet hook using axios backend API calls
 * Replaces direct Firestore operations with backend routes
 */
export function useWallet() {
  const [wallet, setWallet] = useState<WalletRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend wallet API
      const response = await api.get('/api/wallets/me');
      const { eligible: isEligible, wallet: walletData } = response.data;
      
      setEligible(isEligible);
      setWallet(walletData);
      
    } catch (err: any) {
      console.error('Error fetching wallet:', err);
      setError(err);
      setEligible(false);
      setWallet(null);
      
      // Don't show toast for 403 errors (user not eligible)
      if (err.response?.status !== 403) {
        toast.error('Failed to load wallet information');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const redeemCredits = useCallback(async (amount: number, options: RedeemOptions = {}): Promise<WalletResponse> => {
    try {
      setLoading(true);
      
      const payload = {
        amount: parseFloat(String(amount)),
        description: options.description || 'Voucher redemption',
        reference: options.reference || null,
        metadata: options.metadata || null
      };
      
      console.log('🎫 Redeeming credits:', payload);
      
      const response = await api.post('/api/wallets/me/redeem', payload);
      const { wallet: updatedWallet } = response.data;
      
      setWallet(updatedWallet);
      toast.success(`Successfully redeemed ${amount} credits`);
      
      return { success: true, wallet: updatedWallet };
      
    } catch (err: any) {
      console.error('Error redeeming credits:', err);
      const message = err.response?.data?.message || 'Failed to redeem credits';
      toast.error(message);
      
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const grantCredits = useCallback(async (
    userEmail: string,
    amount: number,
    description = 'Admin credit grant',
    options: RedeemOptions = {}
  ): Promise<WalletResponse> => {
    try {
      setLoading(true);
      
      const payload = {
        userEmail,
        amount: parseFloat(String(amount)),
        description,
        reference: options.reference || null,
        metadata: options.metadata || null
      };
      
      console.log('💰 Granting credits:', payload);
      
      const response = await api.post('/api/wallets/grant', payload);
      const { wallet: updatedWallet } = response.data;
      
      toast.success(`Successfully granted ${amount} credits to ${userEmail}`);
      
      // Refresh current user's wallet if it's their own
      await fetchWallet();
      
      return { success: true, wallet: updatedWallet };
      
    } catch (err: any) {
      console.error('Error granting credits:', err);
      const message = err.response?.data?.message || 'Failed to grant credits';
      toast.error(message);
      
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [fetchWallet]);

  const refresh = useCallback(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Initial load
  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return {
    wallet,
    loading,
    eligible,
    error,
    redeemCredits,
    grantCredits,
    refresh
  };
}

export default useWallet;
