import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { getShops, Shop } from '@/lib/firestore';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { GreenScoreRing } from '@/components/GreenScoreRing';
import { 
  Search, Leaf, MapPin, TrendingUp, Award, Users, 
  CheckCircle, ArrowRight, Sparkles, Shield
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useFirebaseAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ shops: 0, votes: 0, badges: 20 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shopsData = await getShops();
        const verifiedShops = shopsData
          .filter(s => s.isVerified)
          .sort((a, b) => (b.greenScore || 0) - (a.greenScore || 0));
        
        // Get vote count
        const votesSnapshot = await getDocs(collection(db, 'votes'));
        
        setShops(verifiedShops);
        setStats(prev => ({ 
          ...prev, 
          shops: verifiedShops.length,
          votes: votesSnapshot.size 
        }));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topShops = filteredShops.slice(0, 3);
  const otherShops = filteredShops.slice(3);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Background Effects */}
        <div className="absolute inset-0 hero-pattern opacity-50" />
        <div className="hero-glow top-0 left-1/4" />
        <div className="hero-glow bottom-0 right-1/4 opacity-10" />
        
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Eco Verification</span>
            </div>
            
            {/* Headline */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Every Badge is{' '}
              <span className="gradient-text">Democracy</span>
              <br />
              with <span className="relative">
                Evidence
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 10C40 4 100 2 198 8" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
              Discover eco-friendly shops verified by real customers with photo proof. 
              Your vote shapes sustainable commerce.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-lg mx-auto mt-8">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
              <div className="relative flex items-center bg-card border border-border/50 rounded-2xl overflow-hidden shadow-lg">
                <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search verified green shops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-transparent focus:outline-none"
                />
                <Button className="m-2 h-10 px-6 rounded-xl">
                  Search
                </Button>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Button 
                variant="outline" 
                className="rounded-full gap-2"
                onClick={() => navigate('/map')}
              >
                <MapPin className="h-4 w-4" />
                Explore Map
              </Button>
              <Button 
                variant="outline" 
                className="rounded-full gap-2"
                onClick={() => navigate('/leaderboard')}
              >
                <TrendingUp className="h-4 w-4" />
                Leaderboard
              </Button>
              {!user && (
                <Button 
                  className="rounded-full gap-2"
                  onClick={() => navigate('/auth')}
                >
                  <Users className="h-4 w-4" />
                  Join Now
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 border-y border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container">
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { value: stats.shops, label: 'Verified Shops', icon: CheckCircle },
              { value: stats.badges, label: 'Eco Badges', icon: Award },
              { value: stats.votes, label: 'Votes Cast', icon: Users },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-2">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Shops - Featured */}
      {topShops.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold">Top Green Champions</h2>
                <p className="text-muted-foreground mt-1">Highest rated eco-friendly shops</p>
              </div>
              <Button variant="ghost" className="gap-2" onClick={() => navigate('/leaderboard')}>
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {topShops.map((shop, index) => (
                <div
                  key={shop.id}
                  className="group relative glass-card card-hover cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/shop/${shop.id}`)}
                >
                  {/* Rank Badge */}
                  <div className={`absolute top-4 left-4 z-10 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
                    index === 0 ? 'gold-gradient' : 
                    index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' : 
                    'bg-gradient-to-br from-amber-600 to-orange-600'
                  }`}>
                    #{index + 1}
                  </div>

                  {/* Image */}
                  <div className="h-48 overflow-hidden">
                    {shop.shopImageUrl ? (
                      <img
                        src={shop.shopImageUrl}
                        alt={shop.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full eco-gradient-subtle flex items-center justify-center">
                        <Leaf className="h-16 w-16 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-end justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-semibold text-lg text-white truncate">
                            {shop.name}
                          </h3>
                          {shop.isVerified && (
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-white/70 truncate">{shop.address}</p>
                        {shop.tagline && (
                          <p className="text-xs text-white/50 mt-1 truncate">{shop.tagline}</p>
                        )}
                      </div>
                      <GreenScoreRing score={Math.round(Number(shop.greenScore) || 0)} size="md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other Shops Grid */}
      {otherShops.length > 0 && (
        <section className="py-12 bg-accent/30">
          <div className="container">
            <h2 className="font-display text-xl md:text-2xl font-bold mb-6">All Verified Shops</h2>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {otherShops.map((shop) => (
                <div
                  key={shop.id}
                  className="group p-4 rounded-2xl border border-border/50 bg-card hover:bg-card/80 hover:border-primary/20 transition-all cursor-pointer"
                  onClick={() => navigate(`/shop/${shop.id}`)}
                >
                  <div className="flex items-start gap-4">
                    {shop.shopImageUrl ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={shop.shopImageUrl}
                          alt={shop.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Leaf className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold truncate">{shop.name}</h3>
                        {shop.isVerified && (
                          <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{shop.address}</p>
                    </div>

                    <GreenScoreRing score={Math.round(Number(shop.greenScore) || 0)} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredShops.length === 0 && (
        <section className="py-20">
          <div className="container text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Leaf className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Shops Found</h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try a different search term' : 'Be the first to add a green shop!'}
            </p>
            {user && (
              <Button onClick={() => navigate('/add-shop')} className="gap-2">
                <Leaf className="h-4 w-4" />
                Add Your Shop
              </Button>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!user && (
        <section className="py-16 md:py-20">
          <div className="container">
            <div className="relative overflow-hidden rounded-3xl eco-gradient p-8 md:p-12">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="relative max-w-2xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 mb-6">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Join 500+ Eco Warriors</span>
                </div>
                
                <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                  Start Verifying Green Shops Today
                </h2>
                <p className="text-white/80 mb-8 max-w-lg mx-auto">
                  Your votes with photo proof help build transparent, eco-friendly commerce in your community.
                </p>
                
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="gap-2 rounded-xl"
                    onClick={() => navigate('/auth')}
                  >
                    <Users className="h-5 w-5" />
                    Create Account
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="gap-2 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={() => navigate('/auth?role=shop_owner')}
                  >
                    I'm a Shop Owner
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-display font-bold">GreenScore</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Building a greener future, one verified shop at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
