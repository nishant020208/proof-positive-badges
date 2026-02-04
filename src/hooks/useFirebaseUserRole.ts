import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

export type AppRole = 'customer' | 'shop_owner' | 'owner';

interface UserRole {
  role: AppRole;
  isOwner: boolean;
  isShopOwner: boolean;
  isCustomer: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useFirebaseUserRole(): UserRole {
  const { user, profile } = useFirebaseAuth();
  const [role, setRole] = useState<AppRole>('customer');
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole('customer');
      setLoading(false);
      return;
    }

    try {
      // Check userRoles collection first for owner role
      const roleDoc = await getDoc(doc(db, 'userRoles', user.uid));
      
      if (roleDoc.exists() && roleDoc.data()?.role === 'owner') {
        setRole('owner');
      } else if (profile) {
        setRole(profile.role as AppRole);
      }
    } catch (error) {
      console.error('Error fetching role:', error);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  return {
    role,
    isOwner: role === 'owner',
    isShopOwner: role === 'shop_owner',
    isCustomer: role === 'customer',
    loading,
    refetch: fetchRole,
  };
}
