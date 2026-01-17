import { Badge, CATEGORY_INFO } from '@/lib/badges';
import { BadgeCard } from './BadgeCard';

interface BadgeCategoryProps {
  category: keyof typeof CATEGORY_INFO;
  badges: Badge[];
  onVote?: (badgeId: string, vote: 'yes' | 'no') => void;
}

export function BadgeCategory({ category, badges, onVote }: BadgeCategoryProps) {
  const info = CATEGORY_INFO[category];
  const categoryBadges = badges.filter(b => b.category === category);
  const earnedCount = categoryBadges.filter(b => b.level !== 'none').length;

  return (
    <div className="space-y-4">
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{info.icon}</span>
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">
              {info.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {earnedCount} of {categoryBadges.length} badges earned
            </p>
          </div>
        </div>
        <div 
          className="h-2 w-24 rounded-full bg-muted overflow-hidden"
        >
          <div
            className="h-full eco-gradient transition-all duration-500"
            style={{ width: `${(earnedCount / categoryBadges.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryBadges.map((badge, index) => (
          <div
            key={badge.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <BadgeCard badge={badge} onVote={onVote} />
          </div>
        ))}
      </div>
    </div>
  );
}
