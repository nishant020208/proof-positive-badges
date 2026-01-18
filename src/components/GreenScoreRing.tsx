import { useEffect, useState } from 'react';

interface GreenScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | number;
  strokeWidth?: number;
}

const SIZE_MAP = {
  sm: 60,
  md: 120,
  lg: 180,
};

export function GreenScoreRing({ score, size = 'md', strokeWidth }: GreenScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const numericSize = typeof size === 'number' ? size : SIZE_MAP[size];
  const defaultStroke = typeof size === 'number' ? 12 : size === 'sm' ? 6 : size === 'md' ? 10 : 12;
  const actualStroke = strokeWidth ?? defaultStroke;
  const radius = (numericSize - actualStroke) / 2;
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

  const fontSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-4xl' : 'text-2xl';
  const labelSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={numericSize} height={numericSize} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={numericSize / 2}
          cy={numericSize / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={actualStroke}
        />
        {/* Progress circle */}
        <circle
          cx={numericSize / 2}
          cy={numericSize / 2}
          r={radius}
          fill="none"
          stroke={getScoreColor()}
          strokeWidth={actualStroke}
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
        <span className={`font-display font-bold text-foreground ${fontSize}`}>
          {animatedScore}
        </span>
        {size !== 'sm' && (
          <span className={`font-medium text-muted-foreground mt-0.5 ${labelSize}`}>
            {getScoreLabel()}
          </span>
        )}
      </div>
    </div>
  );
}
