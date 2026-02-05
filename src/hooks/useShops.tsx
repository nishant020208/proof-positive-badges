 import { useState, useEffect } from 'react';
 import { collection, query, orderBy, onSnapshot, where, getDocs } from 'firebase/firestore';
 import { db } from '@/lib/firebase';

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
 
   useEffect(() => {
     const q = query(collection(db, 'shops'), orderBy('green_score', 'desc'));
     
     const unsubscribe = onSnapshot(q, 
       (snapshot) => {
         const shopsData = snapshot.docs.map(doc => ({
           id: doc.id,
           ...doc.data(),
         })) as Shop[];
         setShops(shopsData);
         setLoading(false);
       },
       (err) => {
         console.error('Error fetching shops:', err);
         setError(err as Error);
         setLoading(false);
       }
     );
 
     return () => unsubscribe();
   }, []);
 
   const refetch = async () => {
     setLoading(true);
     const q = query(collection(db, 'shops'), orderBy('green_score', 'desc'));
     const snapshot = await getDocs(q);
     const shopsData = snapshot.docs.map(doc => ({
       id: doc.id,
       ...doc.data(),
     })) as Shop[];
     setShops(shopsData);
     setLoading(false);
   };
 
   return { shops, loading, error, refetch };
 }

 export function useShopBadges(shopId: string | null) {
   const [badges, setBadges] = useState<(ShopBadge & { badge: BadgeDefinition })[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (!shopId) {
       setLoading(false);
       return;
     }
 
     const fetchBadges = async () => {
       setLoading(true);
       
       // Get all badge definitions
       const badgesSnapshot = await getDocs(collection(db, 'badges'));
       const badgeDefs = badgesSnapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data(),
       })) as BadgeDefinition[];
       
       // Get shop badges
       const shopBadgesQuery = query(
         collection(db, 'shopBadges'),
         where('shopId', '==', shopId)
       );
       const shopBadgesSnapshot = await getDocs(shopBadgesQuery);
       const shopBadges = shopBadgesSnapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data(),
       }));
       
       const combined = badgeDefs.map(badge => {
         const shopBadge = shopBadges.find((sb: any) => sb.badgeId === badge.id);
         return {
           id: (shopBadge as any)?.id || `temp-${badge.id}`,
           shop_id: shopId,
           badge_id: badge.id,
           yes_count: (shopBadge as any)?.yesCount || 0,
           no_count: (shopBadge as any)?.noCount || 0,
           percentage: (shopBadge as any)?.percentage || 0,
           level: (shopBadge as any)?.level || 'none',
           is_eligible: (shopBadge as any)?.isEligible || false,
           badge: badge,
         };
       });
       setBadges(combined);
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
       const votesQuery = query(
         collection(db, 'votes'),
         where('userId', '==', userId),
         where('shopId', '==', shopId)
       );
       const snapshot = await getDocs(votesQuery);
       
       const voteMap: Record<string, 'yes' | 'no'> = {};
       snapshot.docs.forEach(doc => {
         const data = doc.data();
         voteMap[data.badgeId] = data.voteType as 'yes' | 'no';
       });
       setVotes(voteMap);
       setLoading(false);
     };
 
     fetchVotes();
   }, [userId, shopId]);
 
   return { votes, loading };
 }
