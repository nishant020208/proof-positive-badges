import { useEffect, useState } from 'react';

interface GreenScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function GreenScoreRing({ score, size = 180, strokeWidth = 12 }: GreenScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreColor = () => {
    if (score >= 85) return 'hsl(45, 100%, 50%)'; // Gold
    if (score >= 70) return 'hsl(0, 0%, 75%)'; // Silver
    if (score >= 50) return 'hsl(30, 60%, 50%)'; // Bronze
    return 'hsl(150, 10%, 70%)'; // None
  };

  const getScoreLabel = () => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Great';
    if (score >= 50) return 'Good';
    if (score >= 25) return 'Fair';
    return 'Starting';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getScoreColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: score >= 85 ? 'drop-shadow(0 0 8px hsla(45, 100%, 50%, 0.5))' : 'none',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold text-foreground">
          {animatedScore}
        </span>
        <span className="text-sm font-medium text-muted-foreground mt-1">
          {getScoreLabel()}
        </span>
      </div>
    </div>
  );
}
