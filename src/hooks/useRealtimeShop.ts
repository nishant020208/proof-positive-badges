import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ShopScore {
  green_score: number;
}

interface ShopBadge {
  badge_id: string;
  yes_count: number;
  no_count: number;
  percentage: number;
  level: string;
  is_eligible: boolean;
}

export function useRealtimeShop(shopId: string | null) {
  const [score, setScore] = useState<number>(0);
  const [badges, setBadges] = useState<Map<string, ShopBadge>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchInitialData = useCallback(async () => {
    if (!shopId) return;

    const { data: shopData } = await supabase
      .from('shops')
      .select('green_score')
      .eq('id', shopId)
      .single();

    if (shopData) {
      setScore(Math.round(Number(shopData.green_score) || 0));
    }

    const { data: badgesData } = await supabase
      .from('shop_badges')
      .select('*')
      .eq('shop_id', shopId);

    if (badgesData) {
      const badgeMap = new Map<string, ShopBadge>();
      badgesData.forEach(badge => {
        badgeMap.set(badge.badge_id, {
          badge_id: badge.badge_id,
          yes_count: badge.yes_count ?? 0,
          no_count: badge.no_count ?? 0,
          percentage: badge.percentage ?? 0,
          level: badge.level ?? 'none',
          is_eligible: badge.is_eligible ?? false,
        });
      });
      setBadges(badgeMap);
    }
  }, [shopId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!shopId) return;

    const channel = supabase
      .channel(`realtime-shop-${shopId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'shops', filter: `id=eq.${shopId}` },
        (payload) => {
          const newData = payload.new as ShopScore;
          setScore(Math.round(Number(newData.green_score) || 0));
          setLastUpdate(new Date());
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shop_badges', filter: `shop_id=eq.${shopId}` },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newBadge = payload.new as any;
            setBadges(prev => {
              const updated = new Map(prev);
              updated.set(newBadge.badge_id, {
                badge_id: newBadge.badge_id,
                yes_count: newBadge.yes_count ?? 0,
                no_count: newBadge.no_count ?? 0,
                percentage: newBadge.percentage ?? 0,
                level: newBadge.level ?? 'none',
                is_eligible: newBadge.is_eligible ?? false,
              });
              return updated;
            });
            setLastUpdate(new Date());
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes', filter: `shop_id=eq.${shopId}` },
        () => {
          // Trigger a badge refresh when new vote comes in
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId]);

  return { score, badges, lastUpdate, refetch: fetchInitialData };
}