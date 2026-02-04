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
      // Set stats from profile
      setStats({
        credibilityScore: profile.credibilityScore || 50,
        totalReports: profile.totalReports || 0,
        acceptedReports: profile.acceptedReports || 0,
        streakDays: profile.streakDays || 0,
      });

      // Fetch user badges
      const userBadgesQuery = query(
        collection(db, 'userBadges'),
        where('userId', '==', user.uid)
      );
      const badgesSnapshot = await getDocs(userBadgesQuery);
      
      // Fetch badge definitions
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

      // Fetch vote history
      const votesQuery = query(
        collection(db, 'votes'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const votesSnapshot = await getDocs(votesQuery);
      
      // Fetch shops and badges for vote details
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
      case 'gold': return 'bg-yellow-500 text-yellow-950';
      case 'silver': return 'bg-gray-300 text-gray-800';
      case 'bronze': return 'bg-amber-600 text-amber-50';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const badgesByCategory = Object.entries(USER_BADGE_CATEGORIES).map(([key, info]) => ({
    ...info,
    key,
    badges: userBadges.filter(b => b.badgeDefinition?.category === key),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10">
      <AppHeader />

      <main className="container py-6 space-y-6">
        {/* Page Title */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Track your eco impact and badges</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatarUrl || ''} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {profile?.fullName?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile?.fullName || 'Green User'}</h2>
                <p className="text-muted-foreground">{profile?.email}</p>
                
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{userBadges.filter(b => b.isEligible).length} Badges</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{stats.totalReports} Reports</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{stats.streakDays} Day Streak</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className={`text-3xl font-bold ${getCredibilityColor(stats.credibilityScore)}`}>
                {stats.credibilityScore}%
              </div>
              <p className="text-sm text-muted-foreground">Credibility Score</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-primary">{stats.totalReports}</div>
              <p className="text-sm text-muted-foreground">Total Reports</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-green-500">{stats.acceptedReports}</div>
              <p className="text-sm text-muted-foreground">Accepted Reports</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-orange-500">{stats.streakDays}</div>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="badges" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="badges">My Badges</TabsTrigger>
            <TabsTrigger value="history">Vote History</TabsTrigger>
          </TabsList>

          <TabsContent value="badges" className="space-y-4 mt-4">
            {badgesByCategory.map((category) => (
              <Card key={category.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {category.badges.length > 0 ? (
                    <div className="space-y-3">
                      {category.badges.map((badge) => (
                        <div key={badge.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <span className="text-2xl">{badge.badgeDefinition?.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{badge.badgeDefinition?.name}</span>
                              {badge.isEligible && (
                                <Badge className={getLevelColor(badge.level)}>
                                  {badge.level.charAt(0).toUpperCase() + badge.level.slice(1)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {badge.badgeDefinition?.description}
                            </p>
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span>{badge.percentage}%</span>
                                <span>Target: {badge.badgeDefinition?.requirementValue || 100}%</span>
                              </div>
                              <Progress value={badge.percentage} className="h-2" />
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
                </CardContent>
              </Card>
            ))}

            {userBadges.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Badges Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start voting on shops to earn your first badge!
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/')}>
                    Explore Shops
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Votes</CardTitle>
                <CardDescription>Your voting activity on shop badges</CardDescription>
              </CardHeader>
              <CardContent>
                {voteHistory.length > 0 ? (
                  <div className="space-y-3">
                    {voteHistory.map((vote) => (
                      <div 
                        key={vote.id} 
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted"
                        onClick={() => navigate(`/shop/${vote.shopId}`)}
                      >
                        <div className={`p-2 rounded-full ${vote.voteType === 'yes' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          {vote.voteType === 'yes' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{vote.shopName || 'Unknown Shop'}</span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>{vote.badgeIcon}</span>
                            <span>{vote.badgeName || vote.badgeId}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={vote.voteType === 'yes' ? 'default' : 'destructive'}>
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
                    <h3 className="font-semibold mb-2">No Votes Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Visit shops and vote on their eco-practices!
                    </p>
                    <Button className="mt-4" onClick={() => navigate('/')}>
                      Find Shops
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
