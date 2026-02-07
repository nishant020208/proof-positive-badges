import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShops } from '@/hooks/useShops';
import { AppHeader } from '@/components/AppHeader';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Medal, Award, Search, MapPin, Leaf, Crown } from 'lucide-react';

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return (
        <div className="relative">
          <Crown className="h-4 w-4 absolute -top-3 left-1/2 -translate-x-1/2" style={{ color: 'hsl(45, 100%, 50%)' }} />
          <Trophy className="h-6 w-6" style={{ color: 'hsl(45, 100%, 50%)', filter: 'drop-shadow(0 0 6px hsla(45, 100%, 50%, 0.5))' }} />
        </div>
      );
    case 2:
      return <Medal className="h-6 w-6" style={{ color: 'hsl(220, 8%, 72%)' }} />;
    case 3:
      return <Award className="h-6 w-6" style={{ color: 'hsl(30, 70%, 48%)' }} />;
    default:
      return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  }
}

function getGradeColor(score: number) {
  if (score >= 85) return 'text-primary';
  if (score >= 70) return 'text-accent';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

function getGrade(score: number) {
  if (score >= 85) return 'A+';
  if (score >= 70) return 'A';
  if (score >= 50) return 'B';
  return 'C';
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { shops, loading } = useShops();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');

  const filteredAndSortedShops = useMemo(() => {
    let filtered = shops.filter(shop => 
      shop.is_verified && 
      shop.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      if (sortBy === 'score') {
        return Number(b.green_score) - Number(a.green_score);
      }
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [shops, searchQuery, sortBy]);

  return (
    <div className="min-h-screen vardant-bg">
      <AppHeader />

      <main className="container py-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            <span className="gradient-text">Leaderboard</span>
          </h1>
          <p className="text-muted-foreground">Top eco-friendly shops ranked by Green Score</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { value: filteredAndSortedShops.length, label: 'Verified Shops', glow: 'primary' },
            { value: filteredAndSortedShops.filter(s => Number(s.green_score) >= 85).length, label: 'A+ Rated', glow: 'gold' },
            { value: Math.round(filteredAndSortedShops.reduce((sum, s) => sum + Number(s.green_score), 0) / Math.max(filteredAndSortedShops.length, 1)), label: 'Avg Score', glow: 'accent' },
          ].map((stat, i) => (
            <Card key={i} className="text-center p-4 glass-card">
              <div className={`text-2xl font-bold ${
                stat.glow === 'gold' ? 'text-warning' : stat.glow === 'accent' ? 'text-accent' : 'text-primary'
              }`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-border"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'score' | 'name')}>
            <SelectTrigger className="w-full sm:w-40 bg-secondary/50">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Highest Score</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredAndSortedShops.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No verified shops found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedShops.map((shop, index) => (
              <Card
                key={shop.id}
                className={`cursor-pointer transition-all glass-card ${
                  index < 3 ? 'neon-border-animate' : ''
                }`}
                onClick={() => navigate(`/shop/${shop.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                      {getRankIcon(index + 1)}
                    </div>

                    {/* Shop Image */}
                    <div className="flex-shrink-0">
                      {shop.shop_image_url ? (
                        <img
                          src={shop.shop_image_url}
                          alt={shop.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                          <Leaf className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Shop Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{shop.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{shop.address}</span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0 text-right">
                      <div
                        className={`text-2xl font-bold ${getGradeColor(Number(shop.green_score))}`}
                        style={{
                          textShadow: Number(shop.green_score) >= 85
                            ? '0 0 10px hsla(142, 71%, 45%, 0.4)'
                            : 'none',
                        }}
                      >
                        {Math.round(Number(shop.green_score))}
                      </div>
                      <div className={`text-xs font-medium ${getGradeColor(Number(shop.green_score))}`}>
                        Grade {getGrade(Number(shop.green_score))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
