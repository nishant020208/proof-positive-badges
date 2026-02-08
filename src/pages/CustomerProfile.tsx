import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { ScrollReveal } from '@/components/ScrollReveal';
import { XPLevelBar } from '@/components/XPLevelBar';
import { StreakCounter } from '@/components/StreakCounter';
import { 
  Trophy, Target, TrendingUp, User,
  Calendar, CheckCircle, XCircle, Clock
} from 'lucide-react';

interface UserBadge {
  id: string;
  badgeId: string;
  percentage: number;
  level: string;
  isEligible: boolean;
  badgeDefinition?: {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    requirementValue: number;
  };
}

interface VoteHistory {
  id: string;
  voteType: string;
  createdAt: Date;
  shopId: string;
  shopName?: string;
  badgeId: string;
  badgeName?: string;
  badgeIcon?: string;
}

interface ProfileStats {
  credibilityScore: number;
  totalReports: number;
  acceptedReports: number;
  streakDays: number;
}

const USER_BADGE_CATEGORIES = {
  reporting: { name: 'Reporting & Trust', icon: '🔍', color: 'hsl(200, 60%, 45%)' },
  impact: { name: 'Green Impact', icon: '🌱', color: 'hsl(152, 45%, 28%)' },
  consistency: { name: 'Consistency & Activity', icon: '🔥', color: 'hsl(25, 90%, 50%)' },
  community: { name: 'Community Status', icon: '🌍', color: 'hsl(280, 60%, 50%)' },
};

export default function CustomerProfile() {
  const { user, profile, loading } = useFirebaseAuth();
  const navigate = useNavigate();
  
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [voteHistory, setVoteHistory] = useState<VoteHistory[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    credibilityScore: 50,
    totalReports: 0,
    acceptedReports: 0,
    streakDays: 0,
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && profile) {
      fetchUserData();
    }
  }, [user, profile]);

  const fetchUserData = async () => {
    if (!user || !profile) return;
    setLoadingData(true);

    try {
      setStats({
        credibilityScore: profile.credibilityScore || 50,
        totalReports: profile.totalReports || 0,
        acceptedReports: profile.acceptedReports || 0,
        streakDays: profile.streakDays || 0,
      });

      const userBadgesQuery = query(
        collection(db, 'userBadges'),
        where('userId', '==', user.uid)
      );
      const badgesSnapshot = await getDocs(userBadgesQuery);
      
      const badgeDefsSnapshot = await getDocs(collection(db, 'userBadgeDefinitions'));
      const badgeDefs = badgeDefsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const badges: UserBadge[] = badgesSnapshot.docs.map(doc => {
        const data = doc.data();
        const def = badgeDefs.find(d => d.id === data.badgeId);
        return {
          id: doc.id,
          badgeId: data.badgeId,
          percentage: data.percentage || 0,
          level: data.level || 'none',
          isEligible: data.isEligible || false,
          badgeDefinition: def ? {
            id: def.id,
            name: (def as any).name,
            description: (def as any).description,
            category: (def as any).category,
            icon: (def as any).icon,
            requirementValue: (def as any).requirementValue || 100,
          } : undefined,
        };
      });
      setUserBadges(badges);

      const votesQuery = query(
        collection(db, 'votes'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const votesSnapshot = await getDocs(votesQuery);
      
      const shopsSnapshot = await getDocs(collection(db, 'shops'));
      const shops = Object.fromEntries(shopsSnapshot.docs.map(d => [d.id, d.data()]));
      
      const badgesDefSnapshot = await getDocs(collection(db, 'badges'));
      const allBadges = Object.fromEntries(badgesDefSnapshot.docs.map(d => [d.id, d.data()]));
      
      const votes: VoteHistory[] = votesSnapshot.docs.map(doc => {
        const data = doc.data();
        const shop = shops[data.shopId];
        const badge = allBadges[data.badgeId];
        return {
          id: doc.id,
          voteType: data.voteType,
          createdAt: data.createdAt?.toDate() || new Date(),
          shopId: data.shopId,
          shopName: (shop as any)?.name,
          badgeId: data.badgeId,
          badgeName: (badge as any)?.name,
          badgeIcon: (badge as any)?.icon,
        };
      });
      setVoteHistory(votes);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'gold': return 'badge-level-gold';
      case 'silver': return 'badge-level-silver';
      case 'bronze': return 'badge-level-bronze';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center vardant-bg">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  const badgesByCategory = Object.entries(USER_BADGE_CATEGORIES).map(([key, info]) => ({
    ...info,
    key,
    badges: userBadges.filter(b => b.badgeDefinition?.category === key),
  }));

  return (
    <div className="min-h-screen vardant-bg">
      <AppHeader />

      {/* Floating particles */}
      <div className="particle" style={{ left: '5%' }} />
      <div className="particle" />
      <div className="particle" />

      <main className="container py-6 space-y-6 relative">
        {/* Page Title */}
        <ScrollReveal>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl eco-gradient glow-eco">
              <User className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">My Profile</h1>
              <p className="text-muted-foreground">Track your eco impact and badges</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Profile Card */}
        <ScrollReveal delay={100}>
          <div className="glass-card p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 ring-2 ring-primary/30">
                <AvatarImage src={profile?.avatarUrl || ''} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary font-vardant">
                  {profile?.fullName?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">{profile?.fullName || 'Green User'}</h2>
                <p className="text-muted-foreground text-sm">{profile?.email}</p>
                
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{userBadges.filter(b => b.isEligible).length} Badges</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{stats.totalReports} Reports</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* XP Level Bar */}
        <ScrollReveal delay={200}>
          <XPLevelBar
            totalReports={stats.totalReports}
            acceptedReports={stats.acceptedReports}
            streakDays={stats.streakDays}
            badgesEarned={userBadges.filter(b => b.isEligible).length}
          />
        </ScrollReveal>

        {/* Streak Counter */}
        <ScrollReveal delay={300}>
          <StreakCounter days={stats.streakDays} />
        </ScrollReveal>

        {/* Stats Cards with Animated Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: stats.credibilityScore, label: 'Credibility', suffix: '%', color: 'text-primary' },
            { value: stats.totalReports, label: 'Total Reports', suffix: '', color: 'text-accent' },
            { value: stats.acceptedReports, label: 'Accepted', suffix: '', color: 'text-primary' },
            { value: stats.streakDays, label: 'Day Streak', suffix: '', color: 'text-warning' },
          ].map((stat, i) => (
            <ScrollReveal key={stat.label} delay={400 + i * 100}>
              <div className="glass-card p-4 text-center stat-card">
                <div className={`text-2xl md:text-3xl font-bold ${stat.color}`}>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={1200 + i * 200} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="badges" className="w-full">
          <TabsList className="w-full grid grid-cols-2 glass-card" style={{ background: 'hsla(222, 40%, 12%, 0.8)' }}>
            <TabsTrigger value="badges" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">My Badges</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Vote History</TabsTrigger>
          </TabsList>

          <TabsContent value="badges" className="space-y-4 mt-4">
            {badgesByCategory.map((category, catIndex) => (
              <ScrollReveal key={category.key} delay={catIndex * 100}>
                <div className="glass-card overflow-hidden">
                  <div className="p-4 pb-2" style={{ borderBottom: '1px solid hsla(142, 71%, 45%, 0.08)' }}>
                    <h3 className="text-lg font-display font-bold flex items-center gap-2 text-foreground">
                      <span>{category.icon}</span>
                      {category.name}
                    </h3>
                  </div>
                  <div className="p-4">
                    {category.badges.length > 0 ? (
                      <div className="space-y-3">
                        {category.badges.map((badge) => (
                          <div key={badge.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'hsla(222, 40%, 15%, 0.5)' }}>
                            <span className="text-2xl">{badge.badgeDefinition?.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate text-foreground">{badge.badgeDefinition?.name}</span>
                                {badge.isEligible && (
                                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getLevelColor(badge.level)}`}>
                                    {badge.level.charAt(0).toUpperCase() + badge.level.slice(1)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {badge.badgeDefinition?.description}
                              </p>
                              <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-primary font-medium">{badge.percentage}%</span>
                                  <span className="text-muted-foreground">Target: {badge.badgeDefinition?.requirementValue || 100}%</span>
                                </div>
                                <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'hsla(222, 40%, 15%, 0.8)' }}>
                                  <div
                                    className="h-full rounded-full progress-fill"
                                    style={{
                                      width: `${badge.percentage}%`,
                                      background: badge.level === 'gold'
                                        ? 'var(--gradient-gold)'
                                        : badge.level === 'silver'
                                        ? 'var(--gradient-silver)'
                                        : badge.level === 'bronze'
                                        ? 'var(--gradient-bronze)'
                                        : 'var(--gradient-eco)',
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">No badges earned yet in this category</p>
                        <p className="text-xs mt-1">Keep reporting to earn badges!</p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}

            {userBadges.length === 0 && (
              <div className="glass-card p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2 text-foreground">No Badges Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start voting on shops to earn your first badge!
                </p>
                <Button className="mt-4 eco-gradient glow-eco" onClick={() => navigate('/')}>
                  Explore Shops
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="glass-card overflow-hidden">
              <div className="p-4 pb-2" style={{ borderBottom: '1px solid hsla(142, 71%, 45%, 0.08)' }}>
                <h3 className="text-lg font-display font-bold text-foreground">Recent Votes</h3>
                <p className="text-sm text-muted-foreground">Your voting activity on shop badges</p>
              </div>
              <div className="p-4">
                {voteHistory.length > 0 ? (
                  <div className="space-y-3">
                    {voteHistory.map((vote) => (
                      <div 
                        key={vote.id} 
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                        style={{ background: 'hsla(222, 40%, 15%, 0.5)' }}
                        onClick={() => navigate(`/shop/${vote.shopId}`)}
                      >
                        <div className={`p-2 rounded-full ${vote.voteType === 'yes' ? 'bg-primary/20' : 'bg-destructive/20'}`}>
                          {vote.voteType === 'yes' ? (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate text-foreground">{vote.shopName || 'Unknown Shop'}</span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>{vote.badgeIcon}</span>
                            <span>{vote.badgeName || vote.badgeId}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={vote.voteType === 'yes' ? 'default' : 'destructive'} className={vote.voteType === 'yes' ? 'eco-gradient' : ''}>
                            {vote.voteType.toUpperCase()}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" />
                            {vote.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2 text-foreground">No Votes Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Visit shops and vote on their eco-practices!
                    </p>
                    <Button className="mt-4 eco-gradient glow-eco" onClick={() => navigate('/')}>
                      Find Shops
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
