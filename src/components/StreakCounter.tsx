import { Flame } from 'lucide-react';

interface StreakCounterProps {
  days: number;
}

export function StreakCounter({ days }: StreakCounterProps) {
  const isActive = days > 0;
  const intensity = Math.min(days / 30, 1); // 0 to 1 based on streak

  return (
    <div className="glass-card p-4 flex items-center gap-4">
      {/* Flame icon with animation */}
      <div className="relative">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
            isActive ? 'glow-eco' : ''
          }`}
          style={{
            background: isActive
              ? `linear-gradient(135deg, hsla(25, 90%, 50%, ${0.2 + intensity * 0.3}), hsla(0, 80%, 50%, ${0.1 + intensity * 0.2}))`
              : 'hsla(222, 40%, 15%, 0.5)',
          }}
        >
          <Flame
            className={`h-7 w-7 transition-all ${isActive ? 'text-warning' : 'text-muted-foreground'}`}
            style={isActive ? {
              filter: `drop-shadow(0 0 ${4 + intensity * 8}px hsla(25, 90%, 50%, 0.6))`,
              animation: 'flame-flicker 0.8s ease-in-out infinite alternate',
            } : {}}
          />
        </div>
        {isActive && (
          <style>{`
            @keyframes flame-flicker {
              0% { transform: scale(1) rotate(-2deg); }
              100% { transform: scale(1.1) rotate(2deg); }
            }
          `}</style>
        )}
      </div>

      {/* Streak info */}
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-vardant text-2xl font-bold text-foreground">{days}</span>
          <span className="text-sm text-muted-foreground">Day Streak</span>
        </div>
        <div className="flex gap-1 mt-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="w-6 h-1.5 rounded-full transition-all"
              style={{
                background: i < Math.min(days, 7)
                  ? `hsl(${25 + i * 5}, 90%, ${50 - i * 3}%)`
                  : 'hsla(222, 40%, 15%, 0.5)',
                boxShadow: i < Math.min(days, 7)
                  ? '0 0 6px hsla(25, 90%, 50%, 0.3)'
                  : 'none',
              }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {days === 0
            ? 'Start voting to build your streak!'
            : days >= 30
            ? '🔥 Legendary streak!'
            : days >= 7
            ? '🎯 Keep it going!'
            : 'Building momentum...'}
        </p>
      </div>
    </div>
  );
}
