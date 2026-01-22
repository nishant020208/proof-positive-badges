import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  BarChart3, Award, MessageSquare, 
  CheckCircle, XCircle, Clock, Send, Star, Store
} from 'lucide-react';
import { GreenScoreRing } from '@/components/GreenScoreRing';
import { BadgeLevelIndicator } from '@/components/BadgeLevelIndicator';
import { BadgeProgressBar } from '@/components/BadgeProgressBar';

interface Shop {
  id: string;
  name: string;
  green_score: number;
  is_verified: boolean;
  ai_verification_status: string;
}

interface ShopBadge {
  id: string;
  badge_id: string;
  yes_count: number;
  no_count: number;
  percentage: number;
  level: string;
  is_eligible: boolean;
  badge: {
    name: string;
    description: string;
    category: string;
    icon: string;
  };
}

interface Vote {
  id: string;
  vote_type: string;
  created_at: string;
  proof_image_url: string;
  ai_verified: boolean | null;
  ai_verification_result: string | null;
  badge: {
    name: string;
  };
  profile: {
    full_name: string | null;
    email: string;
  };
  response?: {
    response_text: string;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  plastic_packaging: 'from-emerald-500 to-green-600',
  energy_resources: 'from-amber-500 to-yellow-600',
  operations_systems: 'from-blue-500 to-cyan-600',
  community_consistency: 'from-rose-500 to-pink-600',
};

export default function ShopOwnerDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [badges, setBadges] = useState<ShopBadge[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVote, setSelectedVote] = useState<Vote | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user || profile?.role !== 'shop_owner') {
      navigate('/');
      return;
    }
    fetchData();
    setupRealtimeSubscription();
  }, [user, profile, navigate]);

  const fetchData = async () => {
    if (!profile?.id) return;

    // Fetch shop
    const { data: shopData } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', profile.id)
      .single();

    if (!shopData) {
      toast.error('No shop found for this account');
      navigate('/add-shop');
      return;
    }

    setShop(shopData as Shop);

    // Fetch badges
    const { data: badgesData } = await supabase
      .from('shop_badges')
      .select(`
        *,
        badge:badges(name, description, category, icon)
      `)
      .eq('shop_id', shopData.id);

    setBadges((badgesData || []) as unknown as ShopBadge[]);

    // Fetch votes with responses
    const { data: votesData } = await supabase
      .from('votes')
      .select(`
        *,
        badge:badges(name),
        profile:profiles!votes_user_id_fkey(full_name, email)
      `)
      .eq('shop_id', shopData.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch responses separately
    const { data: responsesData } = await supabase
      .from('shop_responses')
      .select('*')
      .eq('shop_id', shopData.id);

    const responsesMap = new Map(responsesData?.map(r => [r.vote_id, r]) || []);
    
    const votesWithResponses = (votesData || []).map(vote => ({
      ...vote,
      response: responsesMap.get(vote.id),
    }));

    setVotes(votesWithResponses as unknown as Vote[]);
    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('shop-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_badges' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shops' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleRespond = async () => {
    if (!selectedVote || !shop || !responseText.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('shop_responses')
        .upsert({
          shop_id: shop.id,
          vote_id: selectedVote.id,
          response_text: responseText.trim(),
        });

      if (error) throw error;

      toast.success('Response submitted successfully');
      setSelectedVote(null);
      setResponseText('');
      fetchData();
    } catch (error) {
      toast.error('Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!shop) return null;

  const goldBadges = badges.filter(b => b.level === 'gold').length;
  const silverBadges = badges.filter(b => b.level === 'silver').length;
  const bronzeBadges = badges.filter(b => b.level === 'bronze').length;
  const totalVotes = votes.length;
  const negativeVotes = votes.filter(v => v.vote_type === 'no').length;

  const groupedBadges = badges.reduce((acc, badge) => {
    const category = badge.badge?.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(badge);
    return acc;
  }, {} as Record<string, ShopBadge[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AppHeader />

      <main className="container py-8 space-y-8">
        {/* Page Title */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Shop Dashboard</h1>
            <p className="text-muted-foreground">Monitor your shop performance and badges</p>
          </div>
        </div>
        {/* Shop Overview */}
        <Card className="overflow-hidden card-glass border-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <CardContent className="relative p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="relative">
                <GreenScoreRing score={Math.round(shop.green_score || 0)} size="lg" />
                <div className="absolute -bottom-2 -right-2">
                  {shop.is_verified && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <h1 className="font-display text-3xl font-bold mb-2">{shop.name}</h1>
                <div className="flex items-center gap-2 mb-4">
                  {shop.ai_verification_status === 'verified' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                      <CheckCircle className="h-4 w-4" /> AI Verified
                    </span>
                  )}
                  {shop.ai_verification_status === 'pending' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 text-sm font-medium">
                      <Clock className="h-4 w-4" /> Verification Pending
                    </span>
                  )}
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="stat-card">
                    <div className="flex items-center gap-2 text-yellow-500">
                      <Star className="h-5 w-5" />
                      <span className="font-display text-2xl font-bold">{goldBadges}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Gold Badges</p>
                  </div>
                  <div className="stat-card">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Award className="h-5 w-5" />
                      <span className="font-display text-2xl font-bold">{silverBadges}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Silver Badges</p>
                  </div>
                  <div className="stat-card">
                    <div className="flex items-center gap-2 text-amber-600">
                      <Award className="h-5 w-5" />
                      <span className="font-display text-2xl font-bold">{bronzeBadges}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Bronze Badges</p>
                  </div>
                  <div className="stat-card">
                    <div className="flex items-center gap-2 text-primary">
                      <BarChart3 className="h-5 w-5" />
                      <span className="font-display text-2xl font-bold">{totalVotes}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Total Votes</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badge Categories */}
        <div className="grid gap-6">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Badge Progress
          </h2>
          
          {Object.entries(groupedBadges).map(([category, categoryBadges]) => (
            <Card key={category} className="card-glass overflow-hidden">
              <CardHeader className={`bg-gradient-to-r ${CATEGORY_COLORS[category] || 'from-gray-500 to-gray-600'} text-white`}>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-2xl">{categoryBadges[0]?.badge?.icon || '🏷️'}</span>
                  {category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {categoryBadges.map((badge) => (
                  <div key={badge.badge_id} className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{badge.badge?.name}</h4>
                          <BadgeLevelIndicator level={badge.level as any} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{badge.badge?.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm mb-3">
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" /> {badge.yes_count} Yes
                          </span>
                          <span className="flex items-center gap-1 text-red-500">
                            <XCircle className="h-3 w-3" /> {badge.no_count} No
                          </span>
                          <span className="font-bold text-primary">{Math.round(badge.percentage || 0)}%</span>
                        </div>
                        
                        <BadgeProgressBar 
                          percentage={badge.percentage || 0}
                          isEligible={badge.is_eligible || false}
                          level={badge.level || 'none'}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Reports */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              User Reports & Votes
            </CardTitle>
            <CardDescription>
              Recent votes from customers with proof images
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {votes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No votes yet. Share your shop to get community feedback!</p>
              </div>
            ) : (
              votes.map((vote) => (
                <div
                  key={vote.id}
                  className={`p-4 rounded-xl border transition-all ${
                    vote.vote_type === 'no' 
                      ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900' 
                      : 'border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {vote.proof_image_url && (
                      <img 
                        src={vote.proof_image_url} 
                        alt="Proof" 
                        className="w-20 h-20 rounded-lg object-cover shadow-md"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          vote.vote_type === 'yes' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {vote.vote_type === 'yes' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {vote.vote_type.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium">{vote.badge?.name}</span>
                        {vote.ai_verified !== null && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                            vote.ai_verified ? 'bg-primary/20 text-primary' : 'bg-amber-100 text-amber-700'
                          }`}>
                            AI {vote.ai_verified ? 'Verified' : 'Flagged'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        by {vote.profile?.full_name || vote.profile?.email} • {new Date(vote.created_at).toLocaleDateString()}
                      </p>
                      
                      {vote.response ? (
                        <div className="mt-2 p-3 rounded-lg bg-card/80 border border-border">
                          <p className="text-sm font-medium text-primary mb-1">Your Response:</p>
                          <p className="text-sm text-muted-foreground">{vote.response.response_text}</p>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedVote(vote)}
                          className="mt-2"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" /> Respond
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Response Dialog */}
        <Dialog open={!!selectedVote} onOpenChange={() => setSelectedVote(null)}>
          <DialogContent className="card-glass">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Respond to Report
              </DialogTitle>
              <DialogDescription>
                Your response will be visible to all users viewing this vote.
              </DialogDescription>
            </DialogHeader>
            
            {selectedVote && (
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${
                  selectedVote.vote_type === 'no' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-green-50 dark:bg-green-950/30'
                }`}>
                  <p className="text-sm">
                    <strong>{selectedVote.vote_type === 'yes' ? 'Positive' : 'Negative'}</strong> vote on <strong>{selectedVote.badge?.name}</strong>
                  </p>
                </div>
                
                <Textarea
                  placeholder="Write your response..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            )}
            
            <DialogFooter>
              <Button variant="ghost" onClick={() => setSelectedVote(null)}>
                Cancel
              </Button>
              <Button onClick={handleRespond} disabled={!responseText.trim() || isSubmitting}>
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" /> Submit Response
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}