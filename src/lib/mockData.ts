import { BadgeData, BADGE_DEFINITIONS, processBadgeData, calculateOverallScore } from './badges';

export interface Shop {
  id: string;
  name: string;
  address: string;
  category: string;
  image: string;
  badges: BadgeData[];
}

// Generate realistic mock data
function generateBadgeData(): BadgeData[] {
  return BADGE_DEFINITIONS.map(def => {
    // Generate realistic vote distributions
    const totalVotes = Math.floor(Math.random() * 80) + 5; // 5-85 votes
    const yesRatio = Math.random() * 0.6 + 0.3; // 30-90% yes ratio
    const yesCount = Math.floor(totalVotes * yesRatio);
    const noCount = totalVotes - yesCount;

    return {
      ...def,
      yesCount,
      noCount,
    };
  });
}

export const MOCK_SHOPS: Shop[] = [
  {
    id: 'shop-1',
    name: 'Green Leaf Grocery',
    address: '123 Eco Street, Sustainable City',
    category: 'Grocery Store',
    image: '',
    badges: generateBadgeData(),
  },
  {
    id: 'shop-2',
    name: 'EcoMart Express',
    address: '456 Nature Avenue, Green Town',
    category: 'Convenience Store',
    image: '',
    badges: generateBadgeData(),
  },
  {
    id: 'shop-3',
    name: 'Pure Earth Organics',
    address: '789 Garden Lane, Earth Village',
    category: 'Organic Market',
    image: '',
    badges: generateBadgeData(),
  },
];

export function getShopById(id: string): Shop | undefined {
  return MOCK_SHOPS.find(shop => shop.id === id);
}

export function getProcessedBadges(shop: Shop) {
  return shop.badges.map(processBadgeData);
}

export function getShopScore(shop: Shop): number {
  const processedBadges = getProcessedBadges(shop);
  return calculateOverallScore(processedBadges);
}
