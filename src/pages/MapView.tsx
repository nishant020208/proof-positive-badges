import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShops, Shop } from '@/hooks/useShops';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Leaf, ArrowLeft, MapPin, Navigation, Star } from 'lucide-react';

function getScoreColor(score: number) {
  if (score >= 85) return '#22c55e'; // green
  if (score >= 50) return '#eab308'; // yellow
  return '#ef4444'; // red
}

export default function MapView() {
  const navigate = useNavigate();
  const { shops, loading } = useShops();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  useEffect(() => {
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
          // Default to a central location
          setUserLocation({ lat: 20.5937, lng: 78.9629 }); // India center
        }
      );
    }
  }, []);

  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const sortedShops = shops
    .filter(shop => shop.is_verified)
    .map(shop => ({
      ...shop,
      distance: userLocation 
        ? calculateDistance(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude)
        : 0
    }))
    .sort((a, b) => a.distance - b.distance);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center h-16">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 ml-2">
            <div className="p-2 rounded-xl eco-gradient">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Nearby Shops</span>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Map Placeholder - Shows location info */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-64 bg-muted relative flex items-center justify-center">
            <div className="text-center p-4">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-3" />
              {userLocation ? (
                <>
                  <p className="font-medium text-foreground">Your Location</p>
                  <p className="text-sm text-muted-foreground">
                    {userLocation.lat.toFixed(4)}°N, {userLocation.lng.toFixed(4)}°E
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {sortedShops.length} verified shops nearby
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Getting your location...</p>
              )}
            </div>
            
            {/* Mini shop indicators */}
            <div className="absolute inset-0 pointer-events-none">
              {sortedShops.slice(0, 5).map((shop, index) => {
                const angle = (index * 72) * Math.PI / 180;
                const radius = 80 + (index * 10);
                const x = 50 + Math.cos(angle) * (radius / 3);
                const y = 50 + Math.sin(angle) * (radius / 3);
                
                return (
                  <div
                    key={shop.id}
                    className="absolute w-3 h-3 rounded-full pointer-events-auto cursor-pointer hover:scale-150 transition-transform"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      backgroundColor: getScoreColor(Number(shop.green_score)),
                      transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => setSelectedShop(shop)}
                  />
                );
              })}
            </div>
          </div>
        </Card>

        {/* Shop List */}
        <h2 className="font-display text-xl font-bold mb-4">
          Shops by Distance
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : sortedShops.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No verified shops found nearby</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedShops.map((shop) => (
              <Card
                key={shop.id}
                className={`cursor-pointer hover:shadow-md transition-all ${
                  selectedShop?.id === shop.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => navigate(`/shop/${shop.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Shop Image */}
                    <div className="flex-shrink-0">
                      {shop.shop_image_url ? (
                        <img
                          src={shop.shop_image_url}
                          alt={shop.name}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                          <Leaf className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Shop Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{shop.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Navigation className="h-3 w-3" />
                        <span>{shop.distance.toFixed(1)} km away</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{shop.address}</span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0 text-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: getScoreColor(Number(shop.green_score)) }}
                      >
                        {Math.round(Number(shop.green_score))}
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
