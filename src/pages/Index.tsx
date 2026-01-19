import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Search, Filter, Leaf, MapPin, Plus, Users, Trophy, LogIn, User, LayoutDashboard } from 'lucide-react';
import { GreenScoreRing } from '@/components/GreenScoreRing';

interface Shop {
  id: string;
  name: string;
  address: string;
  green_score: number | null;
  is_verified: boolean | null;
  shop_image_url: string | null;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchShops = async () => {
      const { data } = await supabase
        .from('shops')
        .select('id, name, address, green_score, is_verified, shop_image_url')
        .order('green_score', { ascending: false });
      
      setShops(data || []);
      setLoading(false);
    };
    fetchShops();
  }, []);

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl eco-gradient">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">GreenScore</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                  <User className="h-4 w-4 mr-1" /> Profile
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/map')}>
                  <MapPin className="h-4 w-4 mr-1" /> Map
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/leaderboard')}>
                  <Trophy className="h-4 w-4 mr-1" /> Leaderboard
                </Button>
                {profile?.role === 'shop_owner' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                      <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
                    </Button>
                    <Button size="sm" onClick={() => navigate('/add-shop')}>
                      <Plus className="h-4 w-4 mr-1" /> Add Shop
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')}>
                <LogIn className="h-4 w-4 mr-1" /> Login
              </Button>
            )}
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-20">
        <div className="absolute inset-0 eco-gradient opacity-5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] eco-gradient opacity-10 rounded-full blur-3xl" />
        
        <div className="container relative">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Leaf className="w-4 h-4" />
              <span className="text-sm font-medium">Proof-Driven Eco Verification</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
              Every Badge is{' '}
              <span className="text-primary">Democracy</span>{' '}
              with Evidence
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              Discover and support eco-friendly shops in your area. Vote on sustainability practices with photo proof.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search shops near you..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 border-y border-border bg-card/30">
        <div className="container">
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary">{shops.length}</p>
              <p className="text-sm text-muted-foreground">Verified Shops</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary">20</p>
              <p className="text-sm text-muted-foreground">Eco Badges</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary">100%</p>
              <p className="text-sm text-muted-foreground">Transparency</p>
            </div>
          </div>
        </div>
      </section>

      {/* Shop List */}
      <section className="py-12">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">Top Green Shops</h2>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" /> Filter
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No shops found. Be the first to add one!</p>
              {user && profile?.role === 'shop_owner' && (
                <Button className="mt-4" onClick={() => navigate('/add-shop')}>
                  <Plus className="h-4 w-4 mr-2" /> Add Your Shop
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredShops.map((shop) => (
                <div
                  key={shop.id}
                  className="group p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/shop/${shop.id}`)}
                >
                  <div className="flex items-start gap-4">
                    {shop.shop_image_url ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={shop.shop_image_url}
                          alt={shop.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Leaf className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{shop.name}</h3>
                        {shop.is_verified && (
                          <span className="text-primary text-xs">✓</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{shop.address}</p>
                    </div>

                    <GreenScoreRing score={Math.round(Number(shop.green_score) || 0)} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-12 bg-primary/5">
          <div className="container text-center">
            <h2 className="font-display text-2xl font-bold mb-4">Join the Green Movement</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Sign up to vote on shops, earn badges, and help build a more sustainable community.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/auth')}>
                <Users className="h-4 w-4 mr-2" /> Get Started
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth?role=shop_owner')}>
                I'm a Shop Owner
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
