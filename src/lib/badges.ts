export type BadgeLevel = 'none' | 'bronze' | 'silver' | 'gold';

export interface BadgeData {
  id: string;
  name: string;
  description: string;
  category: 'plastic' | 'energy' | 'operations' | 'community';
  icon: string;
  yesCount: number;
  noCount: number;
}

export interface Badge extends BadgeData {
  percentage: number;
  level: BadgeLevel;
  totalReports: number;
  isEligible: boolean;
}

export const BADGE_DEFINITIONS: Omit<BadgeData, 'yesCount' | 'noCount'>[] = [
  // PLASTIC & PACKAGING (5)
  { id: 'plastic-free', name: 'Plastic-Free Champ', description: 'No plastic bags used', category: 'plastic', icon: '🚫' },
  { id: 'low-plastic', name: 'Low-Plastic Usage', description: 'Reduced plastic (paper + occasional plastic)', category: 'plastic', icon: '📦' },
  { id: 'eco-packaging', name: 'Eco Packaging Pro', description: 'Biodegradable / recyclable packaging', category: 'plastic', icon: '♻️' },
  { id: 'byob-friendly', name: 'Bring-Your-Own Friendly', description: 'Allows customer containers', category: 'plastic', icon: '🛍️' },
  { id: 'zero-packaging', name: 'Zero Packaging', description: 'Bulk / refill-style shop', category: 'plastic', icon: '🌿' },

  // ENERGY & RESOURCES (5)
  { id: 'energy-saver', name: 'Energy Saver', description: 'LED lights, efficient appliances', category: 'energy', icon: '💡' },
  { id: 'green-power', name: 'Green Power User', description: 'Solar / renewable energy usage', category: 'energy', icon: '☀️' },
  { id: 'low-energy', name: 'Low Energy Waste', description: 'No unnecessary lights, optimized usage', category: 'energy', icon: '⚡' },
  { id: 'smart-cooling', name: 'Smart Cooling', description: 'Efficient AC / natural ventilation', category: 'energy', icon: '❄️' },
  { id: 'water-saver', name: 'Water Saver', description: 'Tap control, no visible water waste', category: 'energy', icon: '💧' },

  // OPERATIONS & SYSTEMS (5)
  { id: 'digital-billing', name: 'Digital Billing Hero', description: 'Users receiving digital bills', category: 'operations', icon: '📱' },
  { id: 'paper-reduction', name: 'Paper Reduction Champ', description: 'Minimal paper receipts, menus, flyers', category: 'operations', icon: '🧾' },
  { id: 'waste-segregation', name: 'Waste Segregation Pro', description: 'Separate dry/wet waste bins visible', category: 'operations', icon: '🗑️' },
  { id: 'clean-disposal', name: 'Clean Disposal Partner', description: 'Proper garbage handling confirmed', category: 'operations', icon: '🧹' },
  { id: 'compliance', name: 'Compliance Friendly', description: 'Follows local eco guidelines', category: 'operations', icon: '✅' },

  // COMMUNITY & CONSISTENCY (5)
  { id: 'community-trusted', name: 'Community Trusted', description: 'High user credibility confirmations', category: 'community', icon: '🤝' },
  { id: 'improvement-star', name: 'Eco Improvement Star', description: 'Score improved over time', category: 'community', icon: '📈' },
  { id: 'consistency-king', name: 'Consistency King', description: 'High % maintained for 60+ days', category: 'community', icon: '👑' },
  { id: 'green-favorite', name: 'Green Favorite', description: 'Frequently chosen by eco-conscious users', category: 'community', icon: '💚' },
  { id: 'green-earth-certified', name: 'Green Earth Certified', description: 'Top-tier badge: score ≥85, no flags, consistency', category: 'community', icon: '🏆' },
];

export const CATEGORY_INFO = {
  plastic: { name: 'Plastic & Packaging', icon: '♻️', color: 'hsl(152, 45%, 28%)' },
  energy: { name: 'Energy & Resources', icon: '💡', color: 'hsl(45, 90%, 50%)' },
  operations: { name: 'Operations & Systems', icon: '🧾', color: 'hsl(200, 60%, 45%)' },
  community: { name: 'Community & Consistency', icon: '🌍', color: 'hsl(340, 60%, 50%)' },
};

export const MIN_REPORTS = 10;

export function calculateBadgeLevel(percentage: number, isEligible: boolean): BadgeLevel {
  if (!isEligible) return 'none';
  if (percentage >= 85) return 'gold';
  if (percentage >= 70) return 'silver';
  if (percentage >= 50) return 'bronze';
  return 'none';
}

export function calculatePercentage(yesCount: number, noCount: number): number {
  const total = yesCount + noCount;
  if (total === 0) return 0;
  return Math.round((yesCount / total) * 100);
}

export function processBadgeData(data: BadgeData): Badge {
  const totalReports = data.yesCount + data.noCount;
  const isEligible = totalReports >= MIN_REPORTS;
  const percentage = calculatePercentage(data.yesCount, data.noCount);
  const level = calculateBadgeLevel(percentage, isEligible);

  return {
    ...data,
    percentage,
    level,
    totalReports,
    isEligible,
  };
}

export function calculateOverallScore(badges: Badge[]): number {
  const eligibleBadges = badges.filter(b => b.isEligible);
  if (eligibleBadges.length === 0) return 0;

  let totalScore = 0;
  eligibleBadges.forEach(badge => {
    let multiplier = 1;
    if (badge.level === 'gold') multiplier = 1.5;
    else if (badge.level === 'silver') multiplier = 1.2;
    else if (badge.level === 'bronze') multiplier = 1;
    else multiplier = 0.5;

    totalScore += badge.percentage * multiplier;
  });

  return Math.round(totalScore / eligibleBadges.length);
}

export function getNextLevelThreshold(currentPercentage: number): { level: BadgeLevel; threshold: number } | null {
  if (currentPercentage < 50) return { level: 'bronze', threshold: 50 };
  if (currentPercentage < 70) return { level: 'silver', threshold: 70 };
  if (currentPercentage < 85) return { level: 'gold', threshold: 85 };
  return null;
}
