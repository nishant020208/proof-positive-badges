import { Badge, MIN_REPORTS } from '@/lib/badges';
import { BadgeLevelIndicator } from './BadgeLevelIndicator';
import { BadgeProgressBar } from './BadgeProgressBar';
import { cn } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';

interface BadgeCardProps {
  badge: Badge;
  onVote?: (badgeId: string, vote: 'yes' | 'no') => void;
}

export function BadgeCard({ badge, onVote }: BadgeCardProps) {
  return (
    <div
      className={cn(
        'group relative p-5 rounded-xl bg-card border border-border card-hover',
        badge.level === 'gold' && 'ring-2 ring-badge-gold/30',
        !badge.isEligible && 'opacity-80'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{badge.icon}</span>
          <div>
            <h3 className="font-display font-semibold text-foreground leading-tight">
              {badge.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {badge.description}
            </p>
          </div>
        </div>
        <BadgeLevelIndicator level={badge.level} size="sm" />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-success" />
          <span className="font-semibold text-foreground">{badge.yesCount}</span>
          <span className="text-sm text-muted-foreground">Yes</span>
        </div>
        <div className="flex items-center gap-2">
          <ThumbsDown className="w-4 h-4 text-destructive" />
          <span className="font-semibold text-foreground">{badge.noCount}</span>
          <span className="text-sm text-muted-foreground">No</span>
        </div>
        <div className="ml-auto">
          <span className="text-2xl font-display font-bold text-foreground">
            {badge.percentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <BadgeProgressBar badge={badge} />

      {/* Eligibility Warning */}
      {!badge.isEligible && (
        <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-warning/10 text-warning">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">
            Needs {MIN_REPORTS - badge.totalReports} more reports to be eligible
          </span>
        </div>
      )}

      {/* Vote buttons */}
      {onVote && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onVote(badge.id, 'yes')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-success/10 text-success font-medium hover:bg-success/20 transition-colors"
          >
            <ThumbsUp className="w-4 h-4" />
            Confirm
          </button>
          <button
            onClick={() => onVote(badge.id, 'no')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors"
          >
            <ThumbsDown className="w-4 h-4" />
            Deny
          </button>
        </div>
      )}
    </div>
  );
}
