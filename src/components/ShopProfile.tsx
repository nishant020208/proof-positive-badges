import { useState } from 'react';
import { Shop, getProcessedBadges, getShopScore } from '@/lib/mockData';
import { CATEGORY_INFO, Badge } from '@/lib/badges';
import { ShopHeader } from './ShopHeader';
import { BadgeCategory } from './BadgeCategory';
import { toast } from 'sonner';

interface ShopProfileProps {
  shop: Shop;
}

export function ShopProfile({ shop }: ShopProfileProps) {
  const [badges, setBadges] = useState<Badge[]>(() => getProcessedBadges(shop));
  const score = getShopScore(shop);

  const handleVote = (badgeId: string, vote: 'yes' | 'no') => {
    setBadges(prev => prev.map(badge => {
      if (badge.id !== badgeId) return badge;
      
      const newYesCount = vote === 'yes' ? badge.yesCount + 1 : badge.yesCount;
      const newNoCount = vote === 'no' ? badge.noCount + 1 : badge.noCount;
      const totalReports = newYesCount + newNoCount;
      const percentage = Math.round((newYesCount / totalReports) * 100);
      const isEligible = totalReports >= 10;
      
      let level = badge.level;
      if (isEligible) {
        if (percentage >= 85) level = 'gold';
        else if (percentage >= 70) level = 'silver';
        else if (percentage >= 50) level = 'bronze';
        else level = 'none';
      }

      return {
        ...badge,
        yesCount: newYesCount,
        noCount: newNoCount,
        totalReports,
        percentage,
        isEligible,
        level,
      };
    }));

    toast.success(
      vote === 'yes' 
        ? 'Verification confirmed! Thank you for your input.' 
        : 'Report submitted. Thanks for keeping it honest.',
      {
        description: 'Your vote has been recorded with timestamp and location.',
      }
    );
  };

  const categories = Object.keys(CATEGORY_INFO) as (keyof typeof CATEGORY_INFO)[];

  return (
    <div className="space-y-8">
      <ShopHeader shop={shop} score={score} badges={badges} />
      
      {categories.map(category => (
        <BadgeCategory
          key={category}
          category={category}
          badges={badges}
          onVote={handleVote}
        />
      ))}
    </div>
  );
}
