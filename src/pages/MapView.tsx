import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useShops, Shop } from '@/hooks/useShops';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Leaf, Loader2 } from 'lucide-react';

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

export default function MapView() {
  const navigate = useNavigate();
  const { shops, loading } = useShops();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => setUserLocation(defaultCenter)
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
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },
    []
  );

  // Initialize map
  useEffect(() => {
    if (loading || !mapContainerRef.current || mapRef.current) return;

    const center = userLocation || defaultCenter;
    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // User location blue dot
    if (userLocation) {
      L.circleMarker(userLocation, {
        radius: 8,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 1,
        weight: 3,
      }).addTo(map);
    }

    // Shop markers
    const markers: L.Marker[] = [];
    verifiedShops.forEach((shop) => {
      const marker = L.marker([shop.latitude, shop.longitude], {
        icon: createCustomIcon(Number(shop.green_score)),
      }).addTo(map);

      const dist = userLocation
        ? calculateDistance(userLocation[0], userLocation[1], shop.latitude, shop.longitude).toFixed(1)
        : null;

      const popupHtml = `
        <div style="min-width:200px;font-family:sans-serif;">
          <div style="display:flex;align-items:center;gap:8px;">
            ${
              shop.shop_image_url
                ? `<img src="${shop.shop_image_url}" alt="${shop.name}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;"/>`
                : `<div style="width:48px;height:48px;border-radius:8px;background:hsla(142,71%,45%,0.15);display:flex;align-items:center;justify-content:center;">🌿</div>`
            }
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${shop.name}</div>
              <div style="font-size:11px;opacity:0.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${shop.address}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid rgba(0,0,0,0.1);">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:${getScoreColor(Number(shop.green_score))};color:#fff;font-size:11px;font-weight:700;">${Math.round(Number(shop.green_score))}</span>
              <span style="font-size:11px;opacity:0.6;">Grade ${getGrade(Number(shop.green_score))}</span>
            </div>
            ${dist ? `<span style="font-size:11px;opacity:0.5;">${dist} km</span>` : ''}
          </div>
          <button onclick="window.__navigateToShop('${shop.id}')" style="margin-top:8px;width:100%;font-size:12px;font-weight:500;padding:6px 12px;border-radius:6px;border:none;cursor:pointer;background:${getScoreColor(Number(shop.green_score))};color:#fff;">
            View Details →
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => setSelectedShop(shop));
      markers.push(marker);
    });
    markersRef.current = markers;

    // Fit bounds
    if (verifiedShops.length > 0) {
      const bounds = L.latLngBounds(verifiedShops.map((s) => [s.latitude, s.longitude] as [number, number]));
      if (userLocation) bounds.extend(userLocation);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (userLocation) {
      map.setView(userLocation, 13);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [loading, verifiedShops, userLocation, calculateDistance]);

  // Navigation helper for popup buttons
  useEffect(() => {
    (window as any).__navigateToShop = (id: string) => navigate(`/shop/${id}`);
    return () => { delete (window as any).__navigateToShop; };
  }, [navigate]);

  // Pan to selected shop
  useEffect(() => {
    if (selectedShop && mapRef.current) {
      mapRef.current.setView([selectedShop.latitude, selectedShop.longitude], 15, { animate: true });
    }
  }, [selectedShop]);

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
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
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
