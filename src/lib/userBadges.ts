export type UserBadgeLevel = 'none' | 'bronze' | 'silver' | 'gold';

export interface UserBadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: 'reporting' | 'impact' | 'consistency' | 'community';
  icon: string;
  requirementType: string;
  requirementValue: number;
}

export const USER_BADGE_DEFINITIONS: UserBadgeDefinition[] = [
  // REPORTING & TRUST (3)
  { 
    id: 'eco-watcher', 
    name: 'Eco Watcher', 
    description: '≥10 valid reports accepted', 
    category: 'reporting', 
    icon: '🔍',
    requirementType: 'accepted_reports',
    requirementValue: 10
  },
  { 
    id: 'proof-master', 
    name: 'Proof Master', 
    description: '≥90% submissions accepted with proof', 
    category: 'reporting', 
    icon: '📸',
    requirementType: 'acceptance_rate',
    requirementValue: 90
  },
  { 
    id: 'truth-teller', 
    name: 'Truth Teller', 
    description: 'Votes align with majority ≥80%', 
    category: 'reporting', 
    icon: '✓',
    requirementType: 'alignment_rate',
    requirementValue: 80
  },

  // GREEN IMPACT (3)
  { 
    id: 'green-supporter', 
    name: 'Green Supporter', 
    description: '≥70% visits to A/B grade shops', 
    category: 'impact', 
    icon: '🌱',
    requirementType: 'green_visit_rate',
    requirementValue: 70
  },
  { 
    id: 'plastic-fighter', 
    name: 'Plastic Fighter', 
    description: '≥20 reports exposing plastic usage', 
    category: 'impact', 
    icon: '🚫',
    requirementType: 'plastic_reports',
    requirementValue: 20
  },
  { 
    id: 'digital-first', 
    name: 'Digital First', 
    description: '≥70% confirmations support digital billing', 
    category: 'impact', 
    icon: '📱',
    requirementType: 'digital_support_rate',
    requirementValue: 70
  },

  // CONSISTENCY & ACTIVITY (2)
  { 
    id: 'consistency-streak', 
    name: 'Consistency Streak', 
    description: 'Active eco reporting for 30+ days', 
    category: 'consistency', 
    icon: '🔥',
    requirementType: 'streak_days',
    requirementValue: 30
  },
  { 
    id: 'area-guardian', 
    name: 'Area Guardian', 
    description: 'Top contributor in a specific locality', 
    category: 'consistency', 
    icon: '🛡️',
    requirementType: 'locality_rank',
    requirementValue: 1
  },

  // COMMUNITY STATUS (2)
  { 
    id: 'community-verified', 
    name: 'Community Verified', 
    description: 'Confirmations backed by others ≥85%', 
    category: 'community', 
    icon: '✅',
    requirementType: 'community_backing',
    requirementValue: 85
  },
  { 
    id: 'green-champion', 
    name: 'Green Champion', 
    description: 'Top-tier: high credibility, long-term, no abuse', 
    category: 'community', 
    icon: '🌍',
    requirementType: 'champion_score',
    requirementValue: 85
  },
];

export const USER_BADGE_CATEGORIES = {
  reporting: { name: 'Reporting & Trust', icon: '🔍', color: 'hsl(200, 60%, 45%)' },
  impact: { name: 'Green Impact', icon: '🌱', color: 'hsl(152, 45%, 28%)' },
  consistency: { name: 'Consistency & Activity', icon: '🔥', color: 'hsl(25, 90%, 50%)' },
  community: { name: 'Community Status', icon: '🌍', color: 'hsl(280, 60%, 50%)' },
};

export function calculateUserBadgeLevel(percentage: number, isEligible: boolean): UserBadgeLevel {
  if (!isEligible) return 'none';
  if (percentage >= 85) return 'gold';
  if (percentage >= 70) return 'silver';
  if (percentage >= 50) return 'bronze';
  return 'none';
}
