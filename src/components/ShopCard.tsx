import { Shop, getProcessedBadges, getShopScore } from '@/lib/mockData';
import { MapPin, Store, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShopCardProps {
  shop: Shop;
  onClick: () => void;
}

export function ShopCard({ shop, onClick }: ShopCardProps) {
  const badges = getProcessedBadges(shop);
  const score = getShopScore(shop);
  const goldCount = badges.filter(b => b.level === 'gold').length;
  const silverCount = badges.filter(b => b.level === 'silver').length;
  const bronzeCount = badges.filter(b => b.level === 'bronze').length;

  const getScoreColor = () => {
    if (score >= 85) return 'text-badge-gold';
    if (score >= 70) return 'text-badge-silver';
    if (score >= 50) return 'text-badge-bronze';
    return 'text-muted-foreground';
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-5 rounded-xl bg-card border border-border card-hover group"
    >
      <div className="flex items-center gap-4">
        {/* Score */}
        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <span className={cn('font-display text-2xl font-bold', getScoreColor())}>
            {score}
          </span>
        </div>

        {/* Info */}
        <div className="flex-grow min-w-0">
          <h3 className="font-display font-bold text-lg text-foreground truncate">
            {shop.name}
          </h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Store className="w-3.5 h-3.5" />
              {shop.category}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {shop.address.split(',')[0]}
            </span>
          </div>
          
          {/* Badge counts */}
          <div className="flex items-center gap-2 mt-2">
            {goldCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded gold-gradient">
                {goldCount} Gold
              </span>
            )}
            {silverCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded silver-gradient">
                {silverCount} Silver
              </span>
            )}
            {bronzeCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bronze-gradient text-primary-foreground">
                {bronzeCount} Bronze
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );
}
