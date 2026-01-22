import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShopBadges, useUserVotes, Shop } from '@/hooks/useShops';
import { useAIVerification } from '@/hooks/useAIVerification';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MapPin, CheckCircle, ThumbsUp, ThumbsDown, Camera, Award, Brain, AlertCircle, Upload } from 'lucide-react';
import { GreenScoreRing } from '@/components/GreenScoreRing';
import { BadgeLevelIndicator } from '@/components/BadgeLevelIndicator';
import { BadgeProgressBar } from '@/components/BadgeProgressBar';
import { AIVerificationPanel } from '@/components/AIVerificationPanel';

const CATEGORY_INFO: Record<string, { name: string; icon: string; color: string }> = {
  plastic_packaging: { name: 'Plastic & Packaging', icon: '♻️', color: 'hsl(152, 45%, 28%)' },
  energy_resources: { name: 'Energy & Resources', icon: '💡', color: 'hsl(45, 90%, 50%)' },
  operations_systems: { name: 'Operations & Systems', icon: '🧾', color: 'hsl(200, 60%, 45%)' },
  community_consistency: { name: 'Community & Consistency', icon: '🌍', color: 'hsl(340, 60%, 50%)' },
};

export default function ShopDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { badges, loading: badgesLoading } = useShopBadges(id || null);
  const { votes: userVotes, loading: votesLoading } = useUserVotes(profile?.id || null, id || null);
  const { isVerifying, verificationResult, verifyProofImage, clearResult } = useAIVerification();
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [votingBadge, setVotingBadge] = useState<string | null>(null);
  const [votingBadgeName, setVotingBadgeName] = useState<string>('');
  const [voteType, setVoteType] = useState<'yes' | 'no' | null>(null);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [aiVerified, setAiVerified] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchShop = async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        toast.error('Shop not found');
        navigate('/');
      } else {
        setShop(data as Shop);
      }
      setLoading(false);
    };

    fetchShop();
  }, [id, navigate]);

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location error:', error);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const handleVoteClick = (badgeId: string, badgeName: string, type: 'yes' | 'no') => {
    if (!user) {
      toast.error('Please login to vote');
      navigate('/auth');
      return;
    }

    if (userVotes[badgeId]) {
      toast.error('You have already voted on this badge');
      return;
    }

    setVotingBadge(badgeId);
    setVotingBadgeName(badgeName);
    setVoteType(type);
    setProofImage(null);
    setProofPreview(null);
    setAiVerified(false);
    clearResult();
  };

  const handleProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setProofImage(file);
    setProofPreview(URL.createObjectURL(file));
    setAiVerified(false);

    // Trigger AI verification
    if (shop) {
      const result = await verifyProofImage(
        file,
        votingBadgeName,
        shop.name,
        voteType === 'yes' ? 'Evidence supporting the eco-practice' : 'Evidence showing lack of eco-practice'
      );

      if (result) {
        setAiVerified(true);
        if (!result.isValid) {
          toast.warning('AI detected issues with your proof image. You can still submit, but it may be reviewed.');
        } else if (result.confidence >= 70) {
          toast.success('AI verified your proof image!');
        }
      }
    }
  };

  const submitVote = async () => {
    if (!profile || !votingBadge || !voteType || !id) return;

    if (!proofImage) {
      toast.error('Please upload a proof image');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload proof image
      const fileExt = proofImage.name.split('.').pop();
      const fileName = `votes/${id}/${votingBadge}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('proof-images')
        .upload(fileName, proofImage);
      
      if (uploadError) {
        toast.error('Failed to upload proof image');
        setIsSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('proof-images')
        .getPublicUrl(fileName);

      // Get AI verification data
      const proofResult = verificationResult as {
        isValid?: boolean;
        confidence?: number;
        supports?: string;
        reason?: string;
      } | null;

      // Submit vote with AI verification data
      const { error: voteError } = await supabase.from('votes').insert({
        user_id: profile.id,
        shop_id: id,
        badge_id: votingBadge,
        vote_type: voteType,
        proof_image_url: urlData.publicUrl,
        latitude: userLocation?.lat || null,
        longitude: userLocation?.lng || null,
        ai_verified: proofResult?.isValid ?? false,
        ai_confidence_score: proofResult?.confidence ?? 0,
        ai_verification_result: proofResult ? JSON.stringify({
          supports: proofResult.supports,
          reason: proofResult.reason,
        }) : null,
      });

      if (voteError) {
        if (voteError.message.includes('duplicate')) {
          toast.error('You have already voted on this badge');
        } else {
          toast.error('Failed to submit vote');
        }
      } else {
        toast.success(
          voteType === 'yes'
            ? 'Verification confirmed! Thank you!'
            : 'Report submitted. Thanks for keeping it honest.'
        );
        // Refresh badges
        window.location.reload();
      }
    } catch (err) {
      toast.error('An error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setVotingBadge(null);
      setVoteType(null);
      clearResult();
    }
  };

  if (loading || badgesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!shop) {
    return null;
  }

  const groupedBadges = badges.reduce((acc, badge) => {
    const category = badge.badge.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(badge);
    return acc;
  }, {} as Record<string, typeof badges>);

  const earnedBadges = badges.filter(b => b.level !== 'none' && b.is_eligible);

  // Check if current user is the shop owner
  const isOwner = profile?.id === shop.owner_id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10">
      <AppHeader />

      <main className="container py-6 space-y-6">
        {/* Shop Header */}
        <Card className="overflow-hidden glass-card">
          {shop.shop_image_url && (
            <div className="h-48 overflow-hidden">
              <img
                src={shop.shop_image_url}
                alt={shop.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <GreenScoreRing score={Math.round(Number(shop.green_score))} size="lg" />
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="font-display text-2xl font-bold">{shop.name}</h1>
                  {shop.is_verified && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                
                {shop.description && (
                  <p className="text-muted-foreground mb-3">{shop.description}</p>
                )}
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{shop.address}</span>
                </div>

                {/* Earned Badges Summary */}
                {earnedBadges.length > 0 && (
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{earnedBadges.length} badges earned</span>
                    <div className="flex gap-1">
                      {earnedBadges.slice(0, 5).map(b => (
                        <span
                          key={b.badge_id}
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            b.level === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                            b.level === 'silver' ? 'bg-gray-100 text-gray-800' :
                            'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.badge.name.split(' ')[0]}
                        </span>
                      ))}
                      {earnedBadges.length > 5 && (
                        <span className="text-xs text-muted-foreground">+{earnedBadges.length - 5} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badge Categories */}
        {Object.entries(groupedBadges).map(([category, categoryBadges]) => (
          <Card key={category} className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <span>{CATEGORY_INFO[category]?.icon || '🏷️'}</span>
                <span>{CATEGORY_INFO[category]?.name || category}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryBadges.map((badge) => {
                const hasVoted = !!userVotes[badge.badge_id];
                
                return (
                  <div
                    key={badge.badge_id}
                    className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{badge.badge.name}</h4>
                          <BadgeLevelIndicator level={badge.level as any} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {badge.badge.description}
                        </p>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm mb-3">
                          <span className="text-green-600">
                            ✓ {badge.yes_count} Yes
                          </span>
                          <span className="text-red-500">
                            ✗ {badge.no_count} No
                          </span>
                          <span className="font-medium">
                            {Math.round(Number(badge.percentage))}%
                          </span>
                          {!badge.is_eligible && (
                            <span className="text-xs text-muted-foreground">
                              ({10 - (badge.yes_count + badge.no_count)} more votes needed)
                            </span>
                          )}
                        </div>
                        
                        <BadgeProgressBar 
                          percentage={Number(badge.percentage)} 
                          isEligible={badge.is_eligible ?? false}
                          level={badge.level ?? 'none'}
                        />
                      </div>
                      
                      {/* Vote Buttons */}
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant={hasVoted && userVotes[badge.badge_id] === 'yes' ? 'default' : 'outline'}
                          className={hasVoted && userVotes[badge.badge_id] === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                          onClick={() => handleVoteClick(badge.badge_id, badge.badge.name, 'yes')}
                          disabled={hasVoted}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={hasVoted && userVotes[badge.badge_id] === 'no' ? 'default' : 'outline'}
                          className={hasVoted && userVotes[badge.badge_id] === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                          onClick={() => handleVoteClick(badge.badge_id, badge.badge.name, 'no')}
                          disabled={hasVoted}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </main>

      {/* Vote Dialog with AI Verification */}
      <Dialog open={!!votingBadge} onOpenChange={() => { setVotingBadge(null); clearResult(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              {voteType === 'yes' ? 'Confirm Verification' : 'Report Issue'}
            </DialogTitle>
            <DialogDescription>
              Upload a photo as proof. AI will instantly analyze your image.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Proof Upload */}
            <div>
              <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                proofPreview ? 'border-primary' : 'border-border hover:border-primary/50'
              } ${isVerifying ? 'pointer-events-none opacity-50' : ''}`}>
                {proofPreview ? (
                  <img src={proofPreview} alt="Proof" className="h-full w-full object-cover rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center">
                    <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Take or upload proof photo</span>
                    <span className="text-xs text-muted-foreground mt-1">AI will verify instantly</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleProofChange}
                  disabled={isVerifying}
                />
              </label>
            </div>

            {/* AI Verification Panel */}
            <AIVerificationPanel 
              isVerifying={isVerifying}
              result={verificationResult}
              type="proof"
            />

            {userLocation && (
              <p className="text-xs text-muted-foreground text-center">
                📍 Location captured: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
            )}

            <Button
              className="w-full"
              onClick={submitVote}
              disabled={!proofImage || isSubmitting || isVerifying}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Vote with Proof
                </>
              )}
            </Button>

            {aiVerified && verificationResult && (
              <p className="text-xs text-center text-muted-foreground">
                AI confidence: {verificationResult.confidence}%
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
