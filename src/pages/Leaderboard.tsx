import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShops } from '@/hooks/useShops';
import { AppHeader } from '@/components/AppHeader';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Medal, Award, Search, MapPin, Leaf } from 'lucide-react';

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Award className="h-6 w-6 text-amber-600" />;
    default:
      return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  }
}

function getGradeColor(score: number) {
  if (score >= 85) return 'text-primary';
  if (score >= 70) return 'text-blue-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
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
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10">
      <AppHeader />

      <main className="container py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary">{filteredAndSortedShops.length}</div>
            <div className="text-xs text-muted-foreground">Verified Shops</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary">
              {filteredAndSortedShops.filter(s => Number(s.green_score) >= 85).length}
            </div>
            <div className="text-xs text-muted-foreground">A+ Rated</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary">
              {Math.round(filteredAndSortedShops.reduce((sum, s) => sum + Number(s.green_score), 0) / Math.max(filteredAndSortedShops.length, 1))}
            </div>
            <div className="text-xs text-muted-foreground">Avg Score</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'score' | 'name')}>
            <SelectTrigger className="w-full sm:w-40">
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
            <p className="text-sm text-muted-foreground mt-1">Be the first to add your shop!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedShops.map((shop, index) => (
              <Card
                key={shop.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
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
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
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
                      <div className={`text-2xl font-bold ${getGradeColor(Number(shop.green_score))}`}>
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
