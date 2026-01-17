import { Shop } from '@/lib/mockData';
import { GreenScoreRing } from './GreenScoreRing';
import { MapPin, Store, Award } from 'lucide-react';
import { Badge } from '@/lib/badges';

interface ShopHeaderProps {
  shop: Shop;
  score: number;
  badges: Badge[];
}

export function ShopHeader({ shop, score, badges }: ShopHeaderProps) {
  const goldCount = badges.filter(b => b.level === 'gold').length;
  const silverCount = badges.filter(b => b.level === 'silver').length;
  const bronzeCount = badges.filter(b => b.level === 'bronze').length;
  const totalEarned = goldCount + silverCount + bronzeCount;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 md:p-8">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 eco-gradient opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
        {/* Score Ring */}
        <div className="flex-shrink-0">
          <GreenScoreRing score={score} size={180} />
          <p className="text-center mt-2 text-sm font-medium text-muted-foreground">
            GreenScore
          </p>
        </div>

        {/* Shop Info */}
        <div className="flex-grow text-center md:text-left">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            {shop.name}
          </h1>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">
              <Store className="w-4 h-4" />
              {shop.category}
            </span>
            <span className="hidden sm:inline text-border">•</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {shop.address}
            </span>
          </div>

          {/* Badge Summary */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{totalEarned} of {badges.length} badges</span>
            </div>
            
            {goldCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full gold-gradient badge-shine">
                <span className="text-sm font-bold">{goldCount}</span>
                <span className="text-sm">Gold</span>
              </div>
            )}
            
            {silverCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full silver-gradient">
                <span className="text-sm font-bold">{silverCount}</span>
                <span className="text-sm">Silver</span>
              </div>
            )}
            
            {bronzeCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bronze-gradient text-primary-foreground">
                <span className="text-sm font-bold">{bronzeCount}</span>
                <span className="text-sm">Bronze</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trust banner */}
      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-center text-sm text-muted-foreground italic">
          "Every badge is democracy with evidence."
        </p>
      </div>
    </div>
  );
}
