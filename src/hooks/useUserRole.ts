import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AppRole = 'customer' | 'shop_owner' | 'owner';

interface UserRole {
  role: AppRole;
  isOwner: boolean;
  isShopOwner: boolean;
  isCustomer: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useUserRole(): UserRole {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>('customer');
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole('customer');
      setLoading(false);
      return;
    }

    try {
      // Check user_roles table first for owner role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData && roleData.role === 'owner') {
        setRole('owner');
      } else {
        // Fall back to profile role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setRole(profile.role as AppRole);
        }
      }
    } catch (error) {
      console.error('Error fetching role:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
