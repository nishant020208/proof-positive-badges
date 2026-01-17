import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  shop_image_url: string | null;
  certificate_url: string | null;
  license_url: string | null;
  gst_number: string | null;
  is_verified: boolean;
  verification_status: string;
  green_score: number;
  created_at: string;
  updated_at: string;
}

export interface ShopBadge {
  id: string;
  shop_id: string;
  badge_id: string;
  yes_count: number;
  no_count: number;
  percentage: number;
  level: string;
  is_eligible: boolean;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

export function useShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchShops = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('green_score', { ascending: false });
    
    if (error) {
      setError(error);
    } else {
      setShops(data as Shop[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchShops();
  }, []);

  return { shops, loading, error, refetch: fetchShops };
}

export function useShopBadges(shopId: string | null) {
  const [badges, setBadges] = useState<(ShopBadge & { badge: BadgeDefinition })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;

    const fetchBadges = async () => {
      setLoading(true);
      
      // First get all badge definitions
      const { data: badgeDefs } = await supabase
        .from('badges')
        .select('*');
      
      // Then get shop badges
      const { data: shopBadges } = await supabase
        .from('shop_badges')
        .select('*')
        .eq('shop_id', shopId);
      
      if (badgeDefs) {
        const combined = badgeDefs.map(badge => {
          const shopBadge = shopBadges?.find(sb => sb.badge_id === badge.id);
          return {
            id: shopBadge?.id || `temp-${badge.id}`,
            shop_id: shopId,
            badge_id: badge.id,
            yes_count: shopBadge?.yes_count || 0,
            no_count: shopBadge?.no_count || 0,
            percentage: shopBadge?.percentage || 0,
            level: shopBadge?.level || 'none',
            is_eligible: shopBadge?.is_eligible || false,
            badge: badge as BadgeDefinition,
          };
        });
        setBadges(combined);
      }
      setLoading(false);
    };

    fetchBadges();
  }, [shopId]);

  return { badges, loading };
}

export function useUserVotes(userId: string | null, shopId: string | null) {
  const [votes, setVotes] = useState<Record<string, 'yes' | 'no'>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !shopId) {
      setLoading(false);
      return;
    }

    const fetchVotes = async () => {
      const { data } = await supabase
        .from('votes')
        .select('badge_id, vote_type')
        .eq('user_id', userId)
        .eq('shop_id', shopId);
      
      if (data) {
        const voteMap: Record<string, 'yes' | 'no'> = {};
        data.forEach(vote => {
          voteMap[vote.badge_id] = vote.vote_type as 'yes' | 'no';
        });
        setVotes(voteMap);
      }
      setLoading(false);
    };

    fetchVotes();
  }, [userId, shopId]);

  return { votes, loading };
}
