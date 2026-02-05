 import { useState, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
 import { useFirebaseUserRole } from '@/hooks/useFirebaseUserRole';
 import { collection, query, where, orderBy, getDocs, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
 import { db } from '@/lib/firebase';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Shield, Users, Store, CheckCircle, XCircle, Clock, 
  Image, Plus, Trash2, Mail, AlertTriangle, Eye, ThumbsUp, ThumbsDown, Gavel
} from 'lucide-react';

interface PendingShop {
  id: string;
  name: string;
  address: string;
  shop_image_url: string | null;
  owner_id: string;
  created_at: string;
  is_verified: boolean;
  owner_verified: boolean;
  ai_verification_status: string;
  profiles?: { email: string; full_name: string | null };
}

interface PendingVote {
  id: string;
  shop_id: string;
  badge_id: string;
  vote_type: string;
  proof_image_url: string | null;
  ai_verified: boolean;
  ai_confidence_score: number;
  owner_approved: boolean | null;
  created_at: string;
  shops?: { name: string };
  badges?: { name: string };
  profiles?: { email: string; full_name: string | null };
}

interface WhitelistEntry {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

interface Appeal {
  id: string;
  shop_id: string;
  vote_id: string;
  appeal_reason: string;
  evidence_url: string | null;
  status: string;
  created_at: string;
  shops?: { name: string };
  votes?: { 
    badge_id: string; 
    vote_type: string;
    proof_image_url: string | null;
    badges?: { name: string };
  };
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
   const { user } = useFirebaseAuth();
   const { isOwner, loading: roleLoading } = useFirebaseUserRole();
  
  const [pendingShops, setPendingShops] = useState<PendingShop[]>([]);
  const [pendingVotes, setPendingVotes] = useState<PendingVote[]>([]);
  const [pendingAppeals, setPendingAppeals] = useState<Appeal[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalShops: 0,
    verifiedShops: 0,
    pendingVotes: 0,
    totalVotes: 0,
    pendingAppeals: 0,
  });

  useEffect(() => {
    if (!roleLoading && !isOwner) {
      toast.error('Access denied. Owner role required.');
      navigate('/');
      return;
    }
    
    if (isOwner) {
      fetchData();
    }
  }, [isOwner, roleLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    
     try {
       // Fetch pending shops
       const shopsQuery = query(
         collection(db, 'shops'),
         where('ownerVerified', '==', false),
         orderBy('createdAt', 'desc')
       );
       const shopsSnapshot = await getDocs(shopsQuery);
       const shops = shopsSnapshot.docs.map(d => ({
         id: d.id,
         name: d.data().name,
         address: d.data().address,
         shop_image_url: d.data().shopImageUrl,
         owner_id: d.data().ownerId,
         created_at: d.data().createdAt?.toDate?.()?.toISOString() || '',
         is_verified: d.data().isVerified || false,
         owner_verified: d.data().ownerVerified || false,
         ai_verification_status: d.data().aiVerificationStatus || 'pending',
       }));
 
       // Fetch pending votes
       const votesQuery = query(
         collection(db, 'votes'),
         orderBy('createdAt', 'desc')
       );
       const votesSnapshot = await getDocs(votesQuery);
       const allVotes = votesSnapshot.docs.map(d => ({
         id: d.id,
         ...d.data(),
       }));
       const pendingVotesData = allVotes.filter((v: any) => v.ownerApproved === null || v.ownerApproved === undefined);
 
       // Get shop and badge info
       const shopsMap = new Map(shopsSnapshot.docs.map(d => [d.id, d.data()]));
       const badgesSnapshot = await getDocs(collection(db, 'badges'));
       const badgesMap = new Map(badgesSnapshot.docs.map(d => [d.id, d.data()]));
 
       const votes = pendingVotesData.map((v: any) => ({
         id: v.id,
         shop_id: v.shopId,
         badge_id: v.badgeId,
         vote_type: v.voteType,
         proof_image_url: v.proofImageUrl,
         ai_verified: v.aiVerified || false,
         ai_confidence_score: v.aiConfidenceScore || 0,
         owner_approved: v.ownerApproved,
         created_at: v.createdAt?.toDate?.()?.toISOString() || '',
         shops: { name: shopsMap.get(v.shopId)?.name || 'Unknown' },
         badges: { name: badgesMap.get(v.badgeId)?.name || 'Unknown' },
       }));
 
       // Fetch pending appeals
       const appealsQuery = query(
         collection(db, 'appeals'),
         where('status', '==', 'pending'),
         orderBy('createdAt', 'desc')
       );
       const appealsSnapshot = await getDocs(appealsQuery);
       const appeals = appealsSnapshot.docs.map(d => {
         const data = d.data();
         return {
           id: d.id,
           shop_id: data.shopId,
           vote_id: data.voteId,
           appeal_reason: data.appealReason,
           evidence_url: data.evidenceUrl,
           status: data.status,
           created_at: data.createdAt?.toDate?.()?.toISOString() || '',
           shops: { name: shopsMap.get(data.shopId)?.name || 'Unknown' },
         };
       });
 
       // Fetch whitelist
       const whitelistQuery = query(
         collection(db, 'ownerWhitelist'),
         orderBy('createdAt', 'desc')
       );
       const whitelistSnapshot = await getDocs(whitelistQuery);
       const whitelistData = whitelistSnapshot.docs.map(d => ({
         id: d.id,
         email: d.data().email,
         status: d.data().status,
         created_at: d.data().createdAt?.toDate?.()?.toISOString() || '',
       }));
 
       // Stats
       const allShopsSnapshot = await getDocs(collection(db, 'shops'));
       const verifiedCount = allShopsSnapshot.docs.filter(d => d.data().ownerVerified === true).length;
       const allVotesSnapshot = await getDocs(collection(db, 'votes'));
 
       setPendingShops(shops as PendingShop[]);
       setPendingVotes(votes as PendingVote[]);
       setPendingAppeals(appeals as Appeal[]);
       setWhitelist(whitelistData as WhitelistEntry[]);
       setStats({
         totalShops: allShopsSnapshot.size,
         verifiedShops: verifiedCount,
         pendingVotes: votes.length,
         totalVotes: allVotesSnapshot.size,
         pendingAppeals: appeals.length,
       });
     } catch (error) {
       console.error('Error fetching data:', error);
     }
     setLoading(false);
  };

  const handleVerifyShop = async (shopId: string, verified: boolean) => {
     try {
       await updateDoc(doc(db, 'shops', shopId), {
         ownerVerified: verified,
         ownerVerifiedAt: verified ? serverTimestamp() : null,
         ownerVerifiedBy: verified ? user?.uid : null,
         isVerified: verified,
         verificationStatus: verified ? 'verified' : 'rejected',
       });
       toast.success(verified ? 'Shop verified successfully!' : 'Shop rejected');
       fetchData();
     } catch (error) {
      toast.error('Failed to update shop');
    }
  };

  const handleApproveVote = async (voteId: string, approved: boolean, reason?: string) => {
     try {
       await updateDoc(doc(db, 'votes', voteId), {
         ownerApproved: approved,
         ownerApprovedAt: serverTimestamp(),
         ownerApprovedBy: user?.uid,
         ownerRejectionReason: approved ? null : reason,
       });
       toast.success(approved ? 'Vote approved!' : 'Vote rejected');
       fetchData();
     } catch (error) {
      toast.error('Failed to update vote');
    }
  };

  const handleResolveAppeal = async (appealId: string, approved: boolean, notes?: string) => {
     try {
       await updateDoc(doc(db, 'appeals', appealId), {
         status: approved ? 'approved' : 'rejected',
         resolvedAt: serverTimestamp(),
         resolvedBy: user?.uid,
         resolutionNotes: notes || (approved ? 'Appeal approved' : 'Appeal rejected'),
       });
       toast.success(approved ? 'Appeal approved - vote will be reviewed' : 'Appeal rejected');
       fetchData();
     } catch (error) {
      toast.error('Failed to resolve appeal');
    }
  };

  const handleAddToWhitelist = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

     try {
       await addDoc(collection(db, 'ownerWhitelist'), {
         email: newEmail.toLowerCase(),
         addedBy: user?.uid,
         status: 'pending',
         createdAt: serverTimestamp(),
       });
      toast.success('Email added to whitelist');
      setNewEmail('');
      fetchData();
     } catch (error: any) {
       if (error.message?.includes('duplicate')) {
         toast.error('Email already whitelisted');
       } else {
         toast.error('Failed to add email');
       }
    }
  };

  const handleRemoveFromWhitelist = async (id: string) => {
     try {
       await deleteDoc(doc(db, 'ownerWhitelist', id));
       toast.success('Email removed from whitelist');
       fetchData();
     } catch (error) {
      toast.error('Failed to remove email');
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10">
      <AppHeader />

      <main className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Owner Dashboard</h1>
            <p className="text-muted-foreground">Manage shops, votes, and team access</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Shops', value: stats.totalShops, icon: Store, color: 'primary' },
            { label: 'Verified', value: stats.verifiedShops, icon: CheckCircle, color: 'green-500' },
            { label: 'Pending Votes', value: stats.pendingVotes, icon: Clock, color: 'yellow-500' },
            { label: 'Total Votes', value: stats.totalVotes, icon: Users, color: 'blue-500' },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-${stat.color}/10`}>
                    <stat.icon className={`h-5 w-5 text-${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="shops" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="shops" className="gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Shops</span>
              {pendingShops.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-600 rounded-full">
                  {pendingShops.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="votes" className="gap-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Votes</span>
              {pendingVotes.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-600 rounded-full">
                  {pendingVotes.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="appeals" className="gap-2">
              <Gavel className="h-4 w-4" />
              <span className="hidden sm:inline">Appeals</span>
              {pendingAppeals.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-600 rounded-full">
                  {pendingAppeals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
          </TabsList>

          {/* Pending Shops */}
          <TabsContent value="shops" className="space-y-4">
            {pendingShops.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">All caught up!</p>
                  <p className="text-muted-foreground">No pending shop verifications</p>
                </CardContent>
              </Card>
            ) : (
              pendingShops.map((shop) => (
                <Card key={shop.id} className="border-border/50 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {shop.shop_image_url && (
                      <div 
                        className="w-full md:w-48 h-32 md:h-auto cursor-pointer"
                        onClick={() => setSelectedImage(shop.shop_image_url)}
                      >
                        <img
                          src={shop.shop_image_url}
                          alt={shop.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{shop.name}</h3>
                          <p className="text-sm text-muted-foreground">{shop.address}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Owner: {shop.profiles?.full_name || shop.profiles?.email}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              shop.ai_verification_status === 'verified' 
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-yellow-500/20 text-yellow-500'
                            }`}>
                              AI: {shop.ai_verification_status}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:bg-red-500/10"
                            onClick={() => handleVerifyShop(shop.id, false)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleVerifyShop(shop.id, true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Pending Votes */}
          <TabsContent value="votes" className="space-y-4">
            {pendingVotes.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">All votes reviewed!</p>
                  <p className="text-muted-foreground">No pending vote approvals</p>
                </CardContent>
              </Card>
            ) : (
              pendingVotes.map((vote) => (
                <Card key={vote.id} className="border-border/50 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {vote.proof_image_url && (
                      <div 
                        className="w-full md:w-48 h-32 md:h-auto cursor-pointer"
                        onClick={() => setSelectedImage(vote.proof_image_url)}
                      >
                        <img
                          src={vote.proof_image_url}
                          alt="Proof"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              vote.vote_type === 'yes' 
                                ? 'bg-green-500/20 text-green-500' 
                                : 'bg-red-500/20 text-red-500'
                            }`}>
                              {vote.vote_type === 'yes' ? <ThumbsUp className="h-3 w-3 inline mr-1" /> : <ThumbsDown className="h-3 w-3 inline mr-1" />}
                              {vote.vote_type.toUpperCase()}
                            </span>
                            <span className="text-sm font-medium">{vote.badges?.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Shop: {vote.shops?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              vote.ai_verified 
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-yellow-500/20 text-yellow-500'
                            }`}>
                              AI Confidence: {vote.ai_confidence_score || 0}%
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:bg-red-500/10"
                            onClick={() => handleApproveVote(vote.id, false, 'Invalid proof')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveVote(vote.id, true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Appeals */}
          <TabsContent value="appeals" className="space-y-4">
            {pendingAppeals.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <Gavel className="h-12 w-12 text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">No pending appeals</p>
                  <p className="text-muted-foreground">All appeals have been resolved</p>
                </CardContent>
              </Card>
            ) : (
              pendingAppeals.map((appeal) => (
                <Card key={appeal.id} className="border-border/50 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {appeal.evidence_url && (
                      <div 
                        className="w-full md:w-48 h-32 md:h-auto cursor-pointer"
                        onClick={() => setSelectedImage(appeal.evidence_url)}
                      >
                        <img
                          src={appeal.evidence_url}
                          alt="Appeal evidence"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">Appeal for {appeal.shops?.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Vote: <span className={appeal.votes?.vote_type === 'yes' ? 'text-green-600' : 'text-red-500'}>
                              {appeal.votes?.vote_type?.toUpperCase()}
                            </span> on {appeal.votes?.badges?.name}
                          </p>
                          <div className="p-3 rounded-lg bg-accent/50 mb-3">
                            <p className="text-sm">{appeal.appeal_reason}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Submitted {new Date(appeal.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleResolveAppeal(appeal.id, false)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => handleResolveAppeal(appeal.id, true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Team Access */}
          <TabsContent value="team" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Whitelist Co-Workers
                </CardTitle>
                <CardDescription>
                  Add email addresses to allow others to sign up as Owners
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddToWhitelist} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                {whitelist.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No whitelisted emails yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {whitelist.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{entry.email}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            entry.status === 'active' 
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {entry.status}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveFromWhitelist(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Image Preview
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto max-h-[70vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
