import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

// Types
export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  shopImageUrl: string | null;
  certificateUrl: string | null;
  licenseUrl: string | null;
  gstNumber: string | null;
  tagline: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  isVerified: boolean;
  greenScore: number;
  verificationStatus: string;
  ownerVerified: boolean;
  ownerVerifiedAt: Date | null;
  ownerVerifiedBy: string | null;
  openingHours: Record<string, any> | null;
  socialLinks: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

export interface Vote {
  id: string;
  userId: string;
  shopId: string;
  badgeId: string;
  voteType: 'yes' | 'no';
  proofImageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  aiVerified: boolean | null;
  aiConfidenceScore: number | null;
  aiVerificationResult: string | null;
  ownerApproved: boolean | null;
  ownerApprovedAt: Date | null;
  ownerApprovedBy: string | null;
  ownerRejectionReason: string | null;
  createdAt: Date;
}

export interface ShopBadge {
  id: string;
  shopId: string;
  badgeId: string;
  yesCount: number;
  noCount: number;
  percentage: number;
  level: 'none' | 'bronze' | 'silver' | 'gold';
  isEligible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Helper to convert Firestore timestamp
const toDate = (timestamp: Timestamp | null): Date | null => {
  return timestamp ? timestamp.toDate() : null;
};

// Shops
export const getShops = async (): Promise<Shop[]> => {
  const querySnapshot = await getDocs(collection(db, 'shops'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt) || new Date(),
    updatedAt: toDate(doc.data().updatedAt) || new Date(),
    ownerVerifiedAt: toDate(doc.data().ownerVerifiedAt),
  } as Shop));
};

export const getShopById = async (shopId: string): Promise<Shop | null> => {
  const docSnap = await getDoc(doc(db, 'shops', shopId));
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: toDate(data.createdAt) || new Date(),
    updatedAt: toDate(data.updatedAt) || new Date(),
    ownerVerifiedAt: toDate(data.ownerVerifiedAt),
  } as Shop;
};

export const createShop = async (shopData: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'shops'), {
    ...shopData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateShop = async (shopId: string, updates: Partial<Shop>): Promise<void> => {
  await updateDoc(doc(db, 'shops', shopId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Badges
export const getBadges = async (): Promise<Badge[]> => {
  const querySnapshot = await getDocs(collection(db, 'badges'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Badge));
};

// Shop Badges
export const getShopBadges = async (shopId: string): Promise<ShopBadge[]> => {
  const q = query(collection(db, 'shopBadges'), where('shopId', '==', shopId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt) || new Date(),
    updatedAt: toDate(doc.data().updatedAt) || new Date(),
  } as ShopBadge));
};

export const updateShopBadge = async (shopId: string, badgeId: string, voteType: 'yes' | 'no'): Promise<void> => {
  const q = query(
    collection(db, 'shopBadges'), 
    where('shopId', '==', shopId),
    where('badgeId', '==', badgeId)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    // Create new shop badge
    await addDoc(collection(db, 'shopBadges'), {
      shopId,
      badgeId,
      yesCount: voteType === 'yes' ? 1 : 0,
      noCount: voteType === 'no' ? 1 : 0,
      percentage: voteType === 'yes' ? 100 : 0,
      level: 'none',
      isEligible: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Update existing
    const docRef = snapshot.docs[0].ref;
    const data = snapshot.docs[0].data();
    const newYes = data.yesCount + (voteType === 'yes' ? 1 : 0);
    const newNo = data.noCount + (voteType === 'no' ? 1 : 0);
    const total = newYes + newNo;
    const percentage = total > 0 ? Math.round((newYes / total) * 100) : 0;
    const isEligible = total >= 10;
    
    let level: 'none' | 'bronze' | 'silver' | 'gold' = 'none';
    if (isEligible) {
      if (percentage >= 85) level = 'gold';
      else if (percentage >= 70) level = 'silver';
      else if (percentage >= 50) level = 'bronze';
    }
    
    await updateDoc(docRef, {
      yesCount: newYes,
      noCount: newNo,
      percentage,
      level,
      isEligible,
      updatedAt: serverTimestamp(),
    });
  }
};

// Votes
export const getVotesByShop = async (shopId: string): Promise<Vote[]> => {
  const q = query(collection(db, 'votes'), where('shopId', '==', shopId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt) || new Date(),
    ownerApprovedAt: toDate(doc.data().ownerApprovedAt),
  } as Vote));
};

export const createVote = async (voteData: Omit<Vote, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'votes'), {
    ...voteData,
    createdAt: serverTimestamp(),
  });
  
  // Update shop badge counts
  await updateShopBadge(voteData.shopId, voteData.badgeId, voteData.voteType);
  
  // Update shop green score
  await recalculateGreenScore(voteData.shopId);
  
  return docRef.id;
};

// Recalculate green score
const recalculateGreenScore = async (shopId: string): Promise<void> => {
  const badges = await getShopBadges(shopId);
  
  if (badges.length === 0) return;
  
  const eligibleBadges = badges.filter(b => b.isEligible);
  if (eligibleBadges.length === 0) {
    await updateDoc(doc(db, 'shops', shopId), { greenScore: 0 });
    return;
  }
  
  const score = eligibleBadges.reduce((sum, badge) => {
    const levelPoints = badge.level === 'gold' ? 5 : badge.level === 'silver' ? 3 : badge.level === 'bronze' ? 1 : 0;
    return sum + (levelPoints * badge.percentage);
  }, 0) / eligibleBadges.length / 100 * 100;
  
  await updateDoc(doc(db, 'shops', shopId), { 
    greenScore: Math.round(score),
    updatedAt: serverTimestamp(),
  });
};

// File upload
export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

// Realtime subscriptions
export const subscribeToShop = (shopId: string, callback: (shop: Shop | null) => void) => {
  return onSnapshot(doc(db, 'shops', shopId), (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback({
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt) || new Date(),
        updatedAt: toDate(data.updatedAt) || new Date(),
        ownerVerifiedAt: toDate(data.ownerVerifiedAt),
      } as Shop);
    } else {
      callback(null);
    }
  });
};

export const subscribeToShopBadges = (shopId: string, callback: (badges: ShopBadge[]) => void) => {
  const q = query(collection(db, 'shopBadges'), where('shopId', '==', shopId));
  return onSnapshot(q, (snapshot) => {
    const badges = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt) || new Date(),
      updatedAt: toDate(doc.data().updatedAt) || new Date(),
    } as ShopBadge));
    callback(badges);
  });
};

// Notifications
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data: Record<string, any>;
  createdAt: Date;
}

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const q = query(
    collection(db, 'notifications'), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt) || new Date(),
  } as Notification));
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
};

export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  const q = query(
    collection(db, 'notifications'), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt) || new Date(),
    } as Notification));
    callback(notifications);
  });
};

// Appeals
export interface Appeal {
  id: string;
  shopId: string;
  voteId: string;
  appealReason: string;
  evidenceUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  resolutionNotes: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const createAppeal = async (appealData: Omit<Appeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'appeals'), {
    ...appealData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getAppeals = async (): Promise<Appeal[]> => {
  const q = query(collection(db, 'appeals'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt) || new Date(),
    updatedAt: toDate(doc.data().updatedAt) || new Date(),
    resolvedAt: toDate(doc.data().resolvedAt),
  } as Appeal));
};

export const updateAppeal = async (appealId: string, updates: Partial<Appeal>): Promise<void> => {
  await updateDoc(doc(db, 'appeals', appealId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};
