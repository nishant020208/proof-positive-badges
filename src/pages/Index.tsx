import { useState } from 'react';
import { Header } from '@/components/Header';
import { ShopCard } from '@/components/ShopCard';
import { ShopProfile } from '@/components/ShopProfile';
import { MOCK_SHOPS, Shop } from '@/lib/mockData';
import { Search, Filter, Leaf } from 'lucide-react';

const Index = () => {
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredShops = MOCK_SHOPS.filter(shop =>
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedShop) {
    return (
      <div className="min-h-screen bg-background">
        <Header onBackToList={() => setSelectedShop(null)} showBack />
        <main className="container py-6 md:py-8">
          <ShopProfile shop={selectedShop} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
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
                placeholder="Search shops by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
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
              <p className="font-display text-3xl font-bold text-foreground">10+</p>
              <p className="text-sm text-muted-foreground">Min Reports</p>
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
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>

        <div className="grid gap-4">
          {filteredShops.map((shop, index) => (
            <div
              key={shop.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ShopCard shop={shop} onClick={() => setSelectedShop(shop)} />
            </div>
          ))}
        </div>

        {filteredShops.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No shops found matching your search.</p>
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
