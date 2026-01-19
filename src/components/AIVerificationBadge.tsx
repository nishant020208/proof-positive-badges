import { CheckCircle, AlertTriangle, Clock, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AIVerificationBadgeProps {
  status: 'verified' | 'pending' | 'flagged' | 'failed' | null;
  confidence?: number;
  reason?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AIVerificationBadge({ 
  status, 
  confidence, 
  reason,
  size = 'md' 
}: AIVerificationBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (!status || status === 'pending') {
    return (
      <Tooltip>
        <TooltipTrigger>
          <span className={`inline-flex items-center rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ${sizeClasses[size]}`}>
            <Clock className={iconSizes[size]} />
            AI Pending
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">AI verification in progress...</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (status === 'verified') {
    return (
      <Tooltip>
        <TooltipTrigger>
          <span className={`inline-flex items-center rounded-full font-medium bg-primary/20 text-primary dark:bg-primary/30 ${sizeClasses[size]} animate-pulse-soft`}>
            <Sparkles className={iconSizes[size]} />
            AI Verified
            {confidence && <span className="opacity-70">({confidence}%)</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm font-medium">✓ AI Verified</p>
          {reason && <p className="text-xs text-muted-foreground mt-1">{reason}</p>}
          {confidence && <p className="text-xs mt-1">Confidence: {confidence}%</p>}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (status === 'flagged') {
    return (
      <Tooltip>
        <TooltipTrigger>
          <span className={`inline-flex items-center rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ${sizeClasses[size]}`}>
            <AlertTriangle className={iconSizes[size]} />
            AI Flagged
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm font-medium">⚠️ AI Flagged for Review</p>
          {reason && <p className="text-xs text-muted-foreground mt-1">{reason}</p>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <span className={`inline-flex items-center rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ${sizeClasses[size]}`}>
          <AlertTriangle className={iconSizes[size]} />
          Verification Failed
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-sm font-medium">✗ Verification Failed</p>
        {reason && <p className="text-xs text-muted-foreground mt-1">{reason}</p>}
      </TooltipContent>
    </Tooltip>
  );
}