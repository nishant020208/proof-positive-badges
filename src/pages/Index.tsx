import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Search, Filter, Leaf, MapPin, Plus, Users, Trophy, LogIn } from 'lucide-react';
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
                <Button variant="ghost" size="sm" onClick={() => navigate('/map')}>
                  <MapPin className="h-4 w-4 mr-1" /> Map
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/leaderboard')}>
                  <Trophy className="h-4 w-4 mr-1" /> Leaderboard
                </Button>
                {profile?.role === 'shop_owner' && (
                  <Button size="sm" onClick={() => navigate('/add-shop')}>
                    <Plus className="h-4 w-4 mr-1" /> Add Shop
                  </Button>
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
            
            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
              Rate shops on their eco-practices. Real users, real proof, real impact. 
              20 badges across 4 categories. No mercy for fakers.
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search shops by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Quick Actions */}
            {!user && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Button size="lg" onClick={() => navigate('/auth?role=customer')}>
                  <Users className="h-4 w-4 mr-2" /> Join as Customer
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth?role=shop_owner')}>
                  <Plus className="h-4 w-4 mr-2" /> Register Your Shop
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-card/50">
        <div className="container py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-foreground">20</p>
              <p className="text-sm text-muted-foreground">Eco Badges</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-foreground">4</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-foreground">{shops.length}</p>
              <p className="text-sm text-muted-foreground">Shops</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-primary">100%</p>
              <p className="text-sm text-muted-foreground">Transparent</p>
            </div>
          </div>
        </div>
      </section>

      {/* Shops List */}
      <main className="container py-8 md:py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Verified Shops
            </h2>
            <p className="text-muted-foreground">
              {filteredShops.length} shops available for verification
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredShops.length > 0 ? (
          <div className="grid gap-4">
            {filteredShops.map((shop, index) => (
              <div
                key={shop.id}
                onClick={() => navigate(`/shop/${shop.id}`)}
                className="p-4 rounded-xl border border-border bg-card hover:bg-card/80 cursor-pointer transition-all animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  {shop.shop_image_url ? (
                    <img src={shop.shop_image_url} alt={shop.name} className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                      <Leaf className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{shop.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{shop.address}</span>
                    </div>
                  </div>
                  <GreenScoreRing score={Math.round(Number(shop.green_score) || 0)} size="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No shops found matching your search.' : 'No shops registered yet. Be the first!'}
            </p>
            {!user && (
              <Button onClick={() => navigate('/auth?role=shop_owner')}>
                Register Your Shop
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            GreenScore • Every badge is democracy with evidence • No manual claims • No mercy
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
