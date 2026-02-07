import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useShops, Shop } from '@/hooks/useShops';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Leaf, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const defaultCenter: [number, number] = [20.5937, 78.9629];

function getScoreColor(score: number): string {
  if (score >= 85) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}

function getGrade(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 50) return 'B';
  return 'C';
}

function createCustomIcon(score: number) {
  const color = getScoreColor(score);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="18" cy="18" r="10" fill="white"/>
      <text x="18" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="${color}">${Math.round(score)}</text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    popupAnchor: [0, -46],
  });
}

// Component to fit map bounds
function FitBounds({ shops, userLocation }: { shops: Shop[]; userLocation: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (shops.length > 0) {
      const bounds = L.latLngBounds(
        shops.map(s => [s.latitude, s.longitude] as [number, number])
      );
      if (userLocation) bounds.extend(userLocation);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (userLocation) {
      map.setView(userLocation, 13);
    }
  }, [shops, userLocation, map]);

  return null;
}

// Component to pan to selected shop
function PanToShop({ shop }: { shop: Shop | null }) {
  const map = useMap();
  useEffect(() => {
    if (shop) {
      map.setView([shop.latitude, shop.longitude], 15, { animate: true });
    }
  }, [shop, map]);
  return null;
}

export default function MapView() {
  const navigate = useNavigate();
  const { shops, loading } = useShops();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          setUserLocation(defaultCenter);
        }
      );
    }
  }, []);

  const verifiedShops = useMemo(
    () => shops.filter((shop) => shop.is_verified),
    [shops]
  );

  const calculateDistance = useCallback(
    (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  const center = useMemo(
    () => userLocation || defaultCenter,
    [userLocation]
  );

  return (
    <div className="min-h-screen vardant-bg flex flex-col">
      <AppHeader />

      <main className="flex-1 flex flex-col">
        {/* Map */}
        <div className="relative h-[55vh] md:h-[60vh] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-secondary/50">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading map…</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={center}
              zoom={12}
              style={{ width: '100%', height: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              <FitBounds shops={verifiedShops} userLocation={userLocation} />
              <PanToShop shop={selectedShop} />

              {/* User location */}
              {userLocation && (
                <CircleMarker
                  center={userLocation}
                  radius={8}
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 1,
                    weight: 3,
                  }}
                />
              )}

              {/* Shop markers */}
              {verifiedShops.map((shop) => (
                <Marker
                  key={shop.id}
                  position={[shop.latitude, shop.longitude]}
                  icon={createCustomIcon(Number(shop.green_score))}
                  eventHandlers={{
                    click: () => setSelectedShop(shop),
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <div className="flex items-center gap-3">
                        {shop.shop_image_url ? (
                          <img
                            src={shop.shop_image_url}
                            alt={shop.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'hsla(142, 71%, 45%, 0.1)' }}>
                            <Leaf className="h-5 w-5" style={{ color: 'hsl(142, 71%, 45%)' }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm truncate">{shop.name}</h3>
                          <p className="text-xs opacity-70 truncate">{shop.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid hsla(0,0%,100%,0.1)' }}>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: getScoreColor(Number(shop.green_score)),
                              color: '#fff',
                            }}
                          >
                            {Math.round(Number(shop.green_score))}
                          </span>
                          <span className="text-xs opacity-60">
                            Grade {getGrade(Number(shop.green_score))}
                          </span>
                        </div>
                        {userLocation && (
                          <span className="text-xs opacity-50">
                            {calculateDistance(
                              userLocation[0], userLocation[1],
                              shop.latitude, shop.longitude
                            ).toFixed(1)} km
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/shop/${shop.id}`)}
                        className="mt-2 w-full text-xs font-medium py-1.5 px-3 rounded-md"
                        style={{
                          backgroundColor: getScoreColor(Number(shop.green_score)),
                          color: '#fff',
                        }}
                      >
                        View Details →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Shop List */}
        <div className="container py-4 flex-1">
          <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="gradient-text">Nearby Shops</span>
            <span className="text-muted-foreground text-sm font-normal">({verifiedShops.length})</span>
          </h2>

          {verifiedShops.length === 0 && !loading ? (
            <div className="text-center py-8">
              <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No verified shops found</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {verifiedShops
                .map((shop) => ({
                  ...shop,
                  distance: userLocation
                    ? calculateDistance(userLocation[0], userLocation[1], shop.latitude, shop.longitude)
                    : 0,
                }))
                .sort((a, b) => a.distance - b.distance)
                .map((shop) => (
                  <Card
                    key={shop.id}
                    className={`cursor-pointer transition-all glass-card ${
                      selectedShop?.id === shop.id ? 'neon-border-animate' : ''
                    }`}
                    onClick={() => setSelectedShop(shop)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {shop.shop_image_url ? (
                          <img
                            src={shop.shop_image_url}
                            alt={shop.name}
                            className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                            <Leaf className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-foreground truncate">
                            {shop.name}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Navigation className="h-3 w-3" />
                            <span>{shop.distance.toFixed(1)} km</span>
                            <span className="mx-1">·</span>
                            <span className="truncate">{shop.address}</span>
                          </div>
                        </div>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            backgroundColor: getScoreColor(Number(shop.green_score)),
                            color: '#fff',
                            boxShadow: `0 0 12px ${getScoreColor(Number(shop.green_score))}40`,
                          }}
                        >
                          {Math.round(Number(shop.green_score))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
