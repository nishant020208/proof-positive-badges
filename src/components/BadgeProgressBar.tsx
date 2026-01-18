import { Badge, getNextLevelThreshold } from '@/lib/badges';
import { cn } from '@/lib/utils';

interface BadgeProgressBarProps {
  badge?: Badge;
  percentage?: number;
  isEligible?: boolean;
  level?: string;
  showThresholds?: boolean;
}

export function BadgeProgressBar({ badge, percentage: propPercentage, isEligible: propIsEligible, level: propLevel, showThresholds = true }: BadgeProgressBarProps) {
  const percentage = badge?.percentage ?? propPercentage ?? 0;
  const isEligible = badge?.isEligible ?? propIsEligible ?? false;
  const level = badge?.level ?? propLevel ?? 'none';
  
  const nextLevel = getNextLevelThreshold(percentage);

  const getProgressColor = () => {
    if (level === 'gold') return 'gold-gradient';
    if (level === 'silver') return 'silver-gradient';
    if (level === 'bronze') return 'bronze-gradient';
    return 'bg-muted-foreground/30';
  };

  return (
    <div className="w-full space-y-2">
      {/* Progress bar container */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        {/* Threshold markers */}
        {showThresholds && (
          <>
            <div
              className="absolute top-0 bottom-0 w-px bg-foreground/20"
              style={{ left: '50%' }}
            />
            <div
              className="absolute top-0 bottom-0 w-px bg-foreground/20"
              style={{ left: '70%' }}
            />
            <div
              className="absolute top-0 bottom-0 w-px bg-foreground/20"
              style={{ left: '85%' }}
            />
          </>
        )}

        {/* Progress fill */}
        <div
          className={cn(
            'absolute top-0 left-0 h-full rounded-full progress-fill',
            getProgressColor()
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Labels */}
      {showThresholds && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span className="text-badge-bronze">50%</span>
          <span className="text-badge-silver">70%</span>
          <span className="text-badge-gold">85%</span>
          <span>100%</span>
        </div>
      )}

      {/* Next level hint */}
      {nextLevel && isEligible && (
        <p className="text-xs text-muted-foreground">
          {nextLevel.threshold - badge.percentage}% more to reach{' '}
          <span className={cn(
            'font-semibold',
            nextLevel.level === 'gold' && 'text-badge-gold',
            nextLevel.level === 'silver' && 'text-badge-silver',
            nextLevel.level === 'bronze' && 'text-badge-bronze'
          )}>
            {nextLevel.level.charAt(0).toUpperCase() + nextLevel.level.slice(1)}
          </span>
        </p>
      )}
    </div>
  );
}
