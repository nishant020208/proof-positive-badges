import { useEffect, useState } from 'react';
import { Zap, Star } from 'lucide-react';

interface XPLevelBarProps {
  totalReports: number;
  acceptedReports: number;
  streakDays: number;
  badgesEarned: number;
}

function calculateXP(stats: XPLevelBarProps) {
  return (
    stats.totalReports * 10 +
    stats.acceptedReports * 25 +
    stats.streakDays * 5 +
    stats.badgesEarned * 50
  );
}

function getLevel(xp: number) {
  if (xp >= 5000) return { level: 10, title: 'Eco Legend', min: 5000, max: 99999 };
  if (xp >= 3500) return { level: 9, title: 'Green Master', min: 3500, max: 5000 };
  if (xp >= 2500) return { level: 8, title: 'Eco Champion', min: 2500, max: 3500 };
  if (xp >= 1800) return { level: 7, title: 'Green Warrior', min: 1800, max: 2500 };
  if (xp >= 1200) return { level: 6, title: 'Eco Guardian', min: 1200, max: 1800 };
  if (xp >= 800) return { level: 5, title: 'Green Scout', min: 800, max: 1200 };
  if (xp >= 500) return { level: 4, title: 'Eco Tracker', min: 500, max: 800 };
  if (xp >= 250) return { level: 3, title: 'Green Spotter', min: 250, max: 500 };
  if (xp >= 100) return { level: 2, title: 'Eco Starter', min: 100, max: 250 };
  return { level: 1, title: 'Seedling', min: 0, max: 100 };
}

export function XPLevelBar({ totalReports, acceptedReports, streakDays, badgesEarned }: XPLevelBarProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const xp = calculateXP({ totalReports, acceptedReports, streakDays, badgesEarned });
  const levelInfo = getLevel(xp);
  const progress = Math.min(((xp - levelInfo.min) / (levelInfo.max - levelInfo.min)) * 100, 100);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(progress), 300);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Level header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl eco-gradient flex items-center justify-center glow-eco">
              <span className="font-vardant text-xl font-bold text-primary-foreground">
                {levelInfo.level}
              </span>
            </div>
            {/* Level star */}
            <Star className="absolute -top-1 -right-1 h-5 w-5 text-warning fill-warning" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">{levelInfo.title}</h3>
            <p className="text-xs text-muted-foreground">Level {levelInfo.level}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-primary">
            <Zap className="h-4 w-4" />
            <span className="font-vardant text-lg font-bold">{xp}</span>
          </div>
          <p className="text-xs text-muted-foreground">Total XP</p>
        </div>
      </div>

      {/* XP Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{xp - levelInfo.min} / {levelInfo.max - levelInfo.min} XP</span>
          <span>Next: Level {levelInfo.level + 1}</span>
        </div>
        <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'hsla(222, 40%, 15%, 0.8)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
            style={{
              width: `${animatedWidth}%`,
              background: 'var(--gradient-eco)',
            }}
          >
            {/* Shine effect */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, hsla(0,0%,100%,0.3) 50%, transparent 100%)',
                animation: 'shine 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>

      {/* XP breakdown */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {[
          { label: 'Reports', value: totalReports * 10, icon: '📋' },
          { label: 'Accepted', value: acceptedReports * 25, icon: '✅' },
          { label: 'Streak', value: streakDays * 5, icon: '🔥' },
          { label: 'Badges', value: badgesEarned * 50, icon: '🏅' },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <span className="text-base">{item.icon}</span>
            <p className="text-xs font-semibold text-primary mt-0.5">+{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
