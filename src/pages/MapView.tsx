import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useShops, Shop } from '@/hooks/useShops';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Leaf, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAJSIfOUWlIafoqWjPLY36ZGTz_Y8GBtJo';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = { lat: 20.5937, lng: 78.9629 };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry.fill',
      stylers: [{ color: '#c8e6f5' }],
    },
    {
      featureType: 'landscape.natural',
      elementType: 'geometry.fill',
      stylers: [{ color: '#e8f5e9' }],
    },
  ],
};

function getScoreColor(score: number): string {
  if (score >= 85) return '#16a34a'; // green
  if (score >= 50) return '#eab308'; // yellow
  return '#dc2626'; // red
}

function getGrade(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 50) return 'B';
  return 'C';
}

function createMarkerIcon(score: number): string {
  const color = getScoreColor(score);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="18" cy="18" r="10" fill="white"/>
      <text x="18" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="${color}">${Math.round(score)}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function MapView() {
  const navigate = useNavigate();
  const { shops, loading } = useShops();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
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

  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);
      if (verifiedShops.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        if (userLocation) bounds.extend(userLocation);
        verifiedShops.forEach((shop) =>
          bounds.extend({ lat: shop.latitude, lng: shop.longitude })
        );
        mapInstance.fitBounds(bounds, 60);
      }
    },
    [verifiedShops, userLocation]
  );

  const onUnmount = useCallback(() => setMap(null), []);

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent/10">
        <AppHeader />
        <main className="container py-12 text-center">
          <MapPin className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-medium">Failed to load Google Maps</p>
          <p className="text-sm text-muted-foreground mt-1">Please check your connection and try again.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10 flex flex-col">
      <AppHeader />

      <main className="flex-1 flex flex-col">
        {/* Map */}
        <div className="relative h-[55vh] md:h-[60vh] w-full">
          {!isLoaded || loading ? (
            <div className="h-full flex items-center justify-center bg-muted">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading map…</p>
              </div>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={12}
              options={mapOptions}
              onLoad={onLoad}
              onUnmount={onUnmount}
              onClick={() => setSelectedShop(null)}
            >
              {/* User location marker */}
              {userLocation && (
                <MarkerF
                  position={userLocation}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#3b82f6',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 3,
                  }}
                  title="Your Location"
                  zIndex={999}
                />
              )}

              {/* Shop markers */}
              {verifiedShops.map((shop) => (
                <MarkerF
                  key={shop.id}
                  position={{ lat: shop.latitude, lng: shop.longitude }}
                  icon={{
                    url: createMarkerIcon(Number(shop.green_score)),
                    scaledSize: new google.maps.Size(36, 46),
                    anchor: new google.maps.Point(18, 46),
                  }}
                  onClick={() => setSelectedShop(shop)}
                  zIndex={selectedShop?.id === shop.id ? 100 : 1}
                />
              ))}

              {/* Info Window */}
              {selectedShop && (
                <InfoWindowF
                  position={{
                    lat: selectedShop.latitude,
                    lng: selectedShop.longitude,
                  }}
                  onCloseClick={() => setSelectedShop(null)}
                  options={{ pixelOffset: new google.maps.Size(0, -46) }}
                >
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      {selectedShop.shop_image_url ? (
                        <img
                          src={selectedShop.shop_image_url}
                          alt={selectedShop.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Leaf className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-900 truncate">
                          {selectedShop.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {selectedShop.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white"
                          style={{
                            backgroundColor: getScoreColor(
                              Number(selectedShop.green_score)
                            ),
                          }}
                        >
                          {Math.round(Number(selectedShop.green_score))}
                        </span>
                        <span className="text-xs text-gray-500">
                          Grade {getGrade(Number(selectedShop.green_score))}
                        </span>
                      </div>
                      {userLocation && (
                        <span className="text-xs text-gray-400">
                          {calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            selectedShop.latitude,
                            selectedShop.longitude
                          ).toFixed(1)}{' '}
                          km
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/shop/${selectedShop.id}`)}
                      className="mt-2 w-full text-xs font-medium text-white py-1.5 px-3 rounded-md"
                      style={{
                        backgroundColor: getScoreColor(
                          Number(selectedShop.green_score)
                        ),
                      }}
                    >
                      View Details →
                    </button>
                  </div>
                </InfoWindowF>
              )}
            </GoogleMap>
          )}
        </div>

        {/* Shop List */}
        <div className="container py-4 flex-1">
          <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Nearby Shops ({verifiedShops.length})
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
                    ? calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        shop.latitude,
                        shop.longitude
                      )
                    : 0,
                }))
                .sort((a, b) => a.distance - b.distance)
                .map((shop) => (
                  <Card
                    key={shop.id}
                    className={`cursor-pointer hover:shadow-md transition-all ${
                      selectedShop?.id === shop.id
                        ? 'ring-2 ring-primary shadow-md'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedShop(shop);
                      map?.panTo({ lat: shop.latitude, lng: shop.longitude });
                      map?.setZoom(15);
                    }}
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
                          <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
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
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{
                            backgroundColor: getScoreColor(
                              Number(shop.green_score)
                            ),
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
