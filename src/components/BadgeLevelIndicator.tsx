import { BadgeLevel } from '@/lib/badges';
import { cn } from '@/lib/utils';

interface BadgeLevelIndicatorProps {
  level: BadgeLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const levelConfig = {
  none: {
    label: 'Not Earned',
    bgClass: 'bg-badge-none/20',
    textClass: 'text-muted-foreground',
    borderClass: 'border-badge-none/30',
  },
  bronze: {
    label: 'Bronze',
    bgClass: 'bronze-gradient',
    textClass: 'text-primary-foreground',
    borderClass: 'border-badge-bronze',
  },
  silver: {
    label: 'Silver',
    bgClass: 'silver-gradient',
    textClass: 'text-foreground',
    borderClass: 'border-badge-silver',
  },
  gold: {
    label: 'Gold',
    bgClass: 'gold-gradient',
    textClass: 'text-foreground',
    borderClass: 'border-badge-gold',
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function BadgeLevelIndicator({ level, size = 'md', showLabel = true }: BadgeLevelIndicatorProps) {
  const config = levelConfig[level];

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold',
        config.bgClass,
        config.textClass,
        sizeConfig[size],
        level !== 'none' && 'badge-shine shadow-badge'
      )}
    >
      {showLabel && config.label}
    </span>
  );
}
