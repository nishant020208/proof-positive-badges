import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  badge_id: string;
  percentage: number;
  level: string;
  is_eligible: boolean;
  badge_definition?: {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    requirement_value: number;
  };
}

interface VoteHistory {
  id: string;
  vote_type: string;
  created_at: string;
  shop: {
    id: string;
    name: string;
  };
  badge: {
    id: string;
    name: string;
    icon: string;
  };
}

interface ProfileStats {
  credibility_score: number;
  total_reports: number;
  accepted_reports: number;
  streak_days: number;
}

const USER_BADGE_CATEGORIES = {
  reporting: { name: 'Reporting & Trust', icon: '🔍', color: 'hsl(200, 60%, 45%)' },
  impact: { name: 'Green Impact', icon: '🌱', color: 'hsl(152, 45%, 28%)' },
  consistency: { name: 'Consistency & Activity', icon: '🔥', color: 'hsl(25, 90%, 50%)' },
  community: { name: 'Community Status', icon: '🌍', color: 'hsl(280, 60%, 50%)' },
};

export default function CustomerProfile() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [voteHistory, setVoteHistory] = useState<VoteHistory[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    credibility_score: 50,
    total_reports: 0,
    accepted_reports: 0,
    streak_days: 0,
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      fetchUserData();
    }
  }, [profile]);

  const fetchUserData = async () => {
    if (!profile) return;
    setLoadingData(true);

    try {
      // Fetch profile stats
      const { data: profileData } = await supabase
        .from('profiles')
        .select('credibility_score, total_reports, accepted_reports, streak_days')
        .eq('id', profile.id)
        .single();
      
      if (profileData) {
        setStats({
          credibility_score: profileData.credibility_score || 50,
          total_reports: profileData.total_reports || 0,
          accepted_reports: profileData.accepted_reports || 0,
          streak_days: profileData.streak_days || 0,
        });
      }

      // Fetch user badges
      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', profile.id);
      
      // Fetch badge definitions
      const { data: badgeDefsData } = await supabase
        .from('user_badge_definitions')
        .select('*');
      
      if (badgesData && badgeDefsData) {
        const badgesWithDefs = badgesData.map(badge => ({
          ...badge,
          badge_definition: badgeDefsData.find(def => def.id === badge.badge_id),
        }));
        setUserBadges(badgesWithDefs as UserBadge[]);
      }

      // Fetch vote history
      const { data: votesData } = await supabase
        .from('votes')
        .select(`
          id,
          vote_type,
          created_at,
          shop:shops(id, name),
          badge:badges(id, name, icon)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (votesData) {
        setVoteHistory(votesData as unknown as VoteHistory[]);
      }
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
    badges: userBadges.filter(b => b.badge_definition?.category === key),
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
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile?.full_name || 'Green User'}</h2>
                <p className="text-muted-foreground">{profile?.email}</p>
                
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{userBadges.filter(b => b.is_eligible).length} Badges</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{stats.total_reports} Reports</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{stats.streak_days} Day Streak</span>
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
              <div className={`text-3xl font-bold ${getCredibilityColor(stats.credibility_score)}`}>
                {stats.credibility_score}%
              </div>
              <p className="text-sm text-muted-foreground">Credibility Score</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-primary">{stats.total_reports}</div>
              <p className="text-sm text-muted-foreground">Total Reports</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-green-500">{stats.accepted_reports}</div>
              <p className="text-sm text-muted-foreground">Accepted Reports</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-orange-500">{stats.streak_days}</div>
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
                          <span className="text-2xl">{badge.badge_definition?.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{badge.badge_definition?.name}</span>
                              {badge.is_eligible && (
                                <Badge className={getLevelColor(badge.level)}>
                                  {badge.level.charAt(0).toUpperCase() + badge.level.slice(1)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {badge.badge_definition?.description}
                            </p>
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span>{badge.percentage}%</span>
                                <span>Target: {badge.badge_definition?.requirement_value || 100}%</span>
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
                        onClick={() => navigate(`/shop/${vote.shop?.id}`)}
                      >
                        <div className={`p-2 rounded-full ${vote.vote_type === 'yes' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          {vote.vote_type === 'yes' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{vote.shop?.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>{vote.badge?.icon}</span>
                            <span>{vote.badge?.name}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={vote.vote_type === 'yes' ? 'default' : 'destructive'}>
                            {vote.vote_type.toUpperCase()}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" />
                            {new Date(vote.created_at).toLocaleDateString()}
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
