import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useAIVerification } from '@/hooks/useAIVerification';
import { 
  getShopById, 
  getBadges, 
  getShopBadges, 
  createVote, 
  uploadFile,
  Shop,
  Badge,
  ShopBadge
} from '@/lib/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MapPin, CheckCircle, ThumbsUp, ThumbsDown, Camera, Award, Brain, Upload } from 'lucide-react';
import { GreenScoreRing } from '@/components/GreenScoreRing';
import { BadgeLevelIndicator } from '@/components/BadgeLevelIndicator';
import { BadgeProgressBar } from '@/components/BadgeProgressBar';
import { AIVerificationPanel } from '@/components/AIVerificationPanel';

interface ShopBadgeWithDetails extends ShopBadge {
  badge: Badge;
}

const CATEGORY_INFO: Record<string, { name: string; icon: string; color: string }> = {
  plastic_packaging: { name: 'Plastic & Packaging', icon: '♻️', color: 'hsl(152, 45%, 28%)' },
  energy_resources: { name: 'Energy & Resources', icon: '💡', color: 'hsl(45, 90%, 50%)' },
  operations_systems: { name: 'Operations & Systems', icon: '🧾', color: 'hsl(200, 60%, 45%)' },
  community_consistency: { name: 'Community & Consistency', icon: '🌍', color: 'hsl(340, 60%, 50%)' },
};

export default function ShopDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useFirebaseAuth();
  const { isVerifying, verificationResult, verifyProofImage, clearResult } = useAIVerification();
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [badges, setBadges] = useState<ShopBadgeWithDetails[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
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

    const fetchData = async () => {
      try {
        // Fetch shop
        const shopData = await getShopById(id);
        if (!shopData) {
          toast.error('Shop not found');
          navigate('/');
          return;
        }
        setShop(shopData);

        // Fetch all badges
        const allBadges = await getBadges();
        
        // Fetch shop badges
        const shopBadges = await getShopBadges(id);
        
        // Combine badges with shop badge data
        const badgesWithDetails: ShopBadgeWithDetails[] = allBadges.map(badge => {
          const shopBadge = shopBadges.find(sb => sb.badgeId === badge.id);
          return {
            id: shopBadge?.id || `new-${badge.id}`,
            shopId: id,
            badgeId: badge.id,
            yesCount: shopBadge?.yesCount || 0,
            noCount: shopBadge?.noCount || 0,
            percentage: shopBadge?.percentage || 0,
            level: shopBadge?.level || 'none',
            isEligible: shopBadge?.isEligible || false,
            createdAt: shopBadge?.createdAt || new Date(),
            updatedAt: shopBadge?.updatedAt || new Date(),
            badge: badge,
          };
        });
        
        setBadges(badgesWithDetails);

        // Fetch user votes if logged in
        if (user) {
          const votesQuery = query(
            collection(db, 'votes'),
            where('userId', '==', user.uid),
            where('shopId', '==', id)
          );
          const votesSnapshot = await getDocs(votesQuery);
          const votes: Record<string, string> = {};
          votesSnapshot.forEach(doc => {
            const data = doc.data();
            votes[data.badgeId] = data.voteType;
          });
          setUserVotes(votes);
        }
      } catch (error) {
        console.error('Error fetching shop:', error);
        toast.error('Failed to load shop');
      }
      setLoading(false);
    };

    fetchData();
  }, [id, navigate, user]);

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
    if (!user || !votingBadge || !voteType || !id) return;

    if (!proofImage) {
      toast.error('Please upload a proof image');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload proof image
      const fileName = `votes/${id}/${votingBadge}/${Date.now()}.${proofImage.name.split('.').pop()}`;
      const proofImageUrl = await uploadFile(proofImage, fileName);

      // Get AI verification data
      const proofResult = verificationResult as {
        isValid?: boolean;
        confidence?: number;
        supports?: string;
        reason?: string;
      } | null;

      // Submit vote
      await createVote({
        userId: user.uid,
        shopId: id,
        badgeId: votingBadge,
        voteType: voteType,
        proofImageUrl: proofImageUrl,
        latitude: userLocation?.lat || null,
        longitude: userLocation?.lng || null,
        aiVerified: proofResult?.isValid ?? false,
        aiConfidenceScore: proofResult?.confidence ?? 0,
        aiVerificationResult: proofResult ? JSON.stringify({
          supports: proofResult.supports,
          reason: proofResult.reason,
        }) : null,
        ownerApproved: null,
        ownerApprovedAt: null,
        ownerApprovedBy: null,
        ownerRejectionReason: null,
      });

      toast.success(
        voteType === 'yes'
          ? 'Verification confirmed! Thank you!'
          : 'Report submitted. Thanks for keeping it honest.'
      );
      
      // Refresh page
      window.location.reload();
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

  if (loading) {
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
  }, {} as Record<string, ShopBadgeWithDetails[]>);

  const earnedBadges = badges.filter(b => b.level !== 'none' && b.isEligible);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10">
      <AppHeader />

      <main className="container py-6 space-y-6">
        {/* Shop Header */}
        <Card className="overflow-hidden glass-card">
          {shop.shopImageUrl && (
            <div className="h-48 overflow-hidden">
              <img
                src={shop.shopImageUrl}
                alt={shop.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <GreenScoreRing score={Math.round(Number(shop.greenScore))} size="lg" />
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="font-display text-2xl font-bold">{shop.name}</h1>
                  {shop.isVerified && (
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
                          key={b.badgeId}
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
                const hasVoted = !!userVotes[badge.badgeId];
                
                return (
                  <div
                    key={badge.badgeId}
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
                            ✓ {badge.yesCount} Yes
                          </span>
                          <span className="text-red-500">
                            ✗ {badge.noCount} No
                          </span>
                          <span className="font-medium">
                            {Math.round(Number(badge.percentage))}%
                          </span>
                          {!badge.isEligible && (
                            <span className="text-xs text-muted-foreground">
                              ({10 - (badge.yesCount + badge.noCount)} more votes needed)
                            </span>
                          )}
                        </div>
                        
                        <BadgeProgressBar 
                          percentage={Number(badge.percentage)} 
                          isEligible={badge.isEligible ?? false}
                          level={badge.level ?? 'none'}
                        />
                      </div>
                      
                      {/* Vote Buttons */}
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant={hasVoted && userVotes[badge.badgeId] === 'yes' ? 'default' : 'outline'}
                          className={hasVoted && userVotes[badge.badgeId] === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                          onClick={() => handleVoteClick(badge.badgeId, badge.badge.name, 'yes')}
                          disabled={hasVoted}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={hasVoted && userVotes[badge.badgeId] === 'no' ? 'default' : 'outline'}
                          className={hasVoted && userVotes[badge.badgeId] === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                          onClick={() => handleVoteClick(badge.badgeId, badge.badge.name, 'no')}
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
