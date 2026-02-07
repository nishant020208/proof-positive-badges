import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { getShops, Shop } from '@/lib/firestore';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { GreenScoreRing } from '@/components/GreenScoreRing';
import { 
  Search, Leaf, MapPin, TrendingUp, Award, Users, 
  CheckCircle, ArrowRight, Sparkles, Shield, Zap
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
    <div className="min-h-screen vardant-bg">
      <AppHeader />

      {/* Floating particles */}
      <div className="particle" style={{ left: '5%' }} />
      <div className="particle" />
      <div className="particle" />
      <div className="particle" />
      <div className="particle" />
      <div className="particle" />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Background orbs */}
        <div className="hero-orb w-96 h-96 top-0 left-1/4 opacity-30" style={{ background: 'hsla(142, 71%, 45%, 0.15)' }} />
        <div className="hero-orb w-72 h-72 bottom-0 right-1/4 opacity-20" style={{ background: 'hsla(183, 100%, 50%, 0.1)' }} />
        
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 text-primary" style={{ background: 'hsla(142, 71%, 45%, 0.08)' }}>
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Eco Verification</span>
            </div>
            
            {/* Headline */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              Every Badge is{' '}
              <span className="gradient-text">Democracy</span>
              <br />
              with <span className="relative gradient-text-cyan">
                Evidence
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 10C40 4 100 2 198 8" stroke="hsl(183, 100%, 50%)" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.6"/>
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
              <div className="absolute inset-0 rounded-2xl blur-xl" style={{ background: 'hsla(142, 71%, 45%, 0.1)' }} />
              <div className="relative flex items-center rounded-2xl overflow-hidden shadow-lg glass-card" style={{ padding: 0, border: '1px solid hsla(142, 71%, 45%, 0.15)' }}>
                <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search verified green shops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
                />
                <Button className="m-2 h-10 px-6 rounded-xl eco-gradient font-semibold">
                  Search
                </Button>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Button 
                variant="outline" 
                className="rounded-full gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                onClick={() => navigate('/map')}
              >
                <MapPin className="h-4 w-4 text-primary" />
                Explore Map
              </Button>
              <Button 
                variant="outline" 
                className="rounded-full gap-2 border-accent/30 hover:bg-accent/10 hover:border-accent/50"
                onClick={() => navigate('/leaderboard')}
              >
                <TrendingUp className="h-4 w-4 text-accent" />
                Leaderboard
              </Button>
              {!user && (
                <Button 
                  className="rounded-full gap-2 eco-gradient glow-eco"
                  onClick={() => navigate('/auth')}
                >
                  <Zap className="h-4 w-4" />
                  Join Now
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 border-y" style={{ borderColor: 'hsla(142, 71%, 45%, 0.1)', background: 'hsla(222, 40%, 10%, 0.3)' }}>
        <div className="container">
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { value: stats.shops, label: 'Verified Shops', icon: CheckCircle, color: 'primary' },
              { value: stats.badges, label: 'Eco Badges', icon: Award, color: 'accent' },
              { value: stats.votes, label: 'Votes Cast', icon: Users, color: 'primary' },
            ].map((stat, i) => (
              <div key={i} className="text-center animate-count" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 ${
                  stat.color === 'accent' ? 'bg-accent/10' : 'bg-primary/10'
                }`}>
                  <stat.icon className={`h-5 w-5 ${stat.color === 'accent' ? 'text-accent' : 'text-primary'}`} />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Shops */}
      {topShops.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Top <span className="gradient-text">Green Champions</span>
                </h2>
                <p className="text-muted-foreground mt-1">Highest rated eco-friendly shops</p>
              </div>
              <Button variant="ghost" className="gap-2 text-primary hover:bg-primary/10" onClick={() => navigate('/leaderboard')}>
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {topShops.map((shop, index) => (
                <div
                  key={shop.id}
                  className={`group relative glass-card card-hover cursor-pointer overflow-hidden ${
                    index === 0 ? 'rank-1' : ''
                  }`}
                  onClick={() => navigate(`/shop/${shop.id}`)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Rank Badge */}
                  <div className={`absolute top-4 left-4 z-10 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg ${
                    index === 0 ? 'badge-level-gold' : 
                    index === 1 ? 'badge-level-silver' : 
                    'badge-level-bronze'
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
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsla(142, 71%, 45%, 0.1), hsla(183, 100%, 50%, 0.05))' }}>
                        <Leaf className="h-16 w-16 text-primary/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-end justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-semibold text-lg text-foreground truncate">
                            {shop.name}
                          </h3>
                          {shop.isVerified && (
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{shop.address}</p>
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
        <section className="py-12" style={{ background: 'hsla(222, 40%, 8%, 0.5)' }}>
          <div className="container">
            <h2 className="font-display text-xl md:text-2xl font-bold mb-6 text-foreground">All Verified Shops</h2>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {otherShops.map((shop) => (
                <div
                  key={shop.id}
                  className="group glass-card p-4 cursor-pointer"
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
                        <h3 className="font-semibold truncate text-foreground">{shop.name}</h3>
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
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 glow-eco">
              <Leaf className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">No Shops Found</h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try a different search term' : 'Be the first to add a green shop!'}
            </p>
            {user && (
              <Button onClick={() => navigate('/add-shop')} className="gap-2 eco-gradient glow-eco">
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
            <div className="relative overflow-hidden rounded-3xl p-8 md:p-12" style={{ background: 'linear-gradient(135deg, hsla(142, 71%, 45%, 0.15), hsla(183, 100%, 50%, 0.08))', border: '1px solid hsla(142, 71%, 45%, 0.15)' }}>
              <div className="hero-orb w-64 h-64 -top-32 -right-32 opacity-40" style={{ background: 'hsla(142, 71%, 45%, 0.2)' }} />
              <div className="relative max-w-2xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Join 500+ Eco Warriors</span>
                </div>
                
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Start Verifying <span className="gradient-text">Green Shops</span> Today
                </h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                  Your votes with photo proof help build transparent, eco-friendly commerce in your community.
                </p>
                
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="gap-2 rounded-xl eco-gradient glow-eco"
                    onClick={() => navigate('/auth')}
                  >
                    <Zap className="h-5 w-5" />
                    Create Account
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="gap-2 rounded-xl border-primary/30 hover:bg-primary/10"
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
      <footer className="py-8" style={{ borderTop: '1px solid hsla(142, 71%, 45%, 0.1)' }}>
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-vardant font-bold tracking-wider gradient-text">VARDANT</span>
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
