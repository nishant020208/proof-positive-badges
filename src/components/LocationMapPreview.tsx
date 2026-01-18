import { useEffect, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface LocationMapPreviewProps {
  latitude: number | null;
  longitude: number | null;
  shopName?: string;
  className?: string;
}

export default function LocationMapPreview({ 
  latitude, 
  longitude, 
  shopName = 'Shop Location',
  className = ''
}: LocationMapPreviewProps) {
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    if (latitude && longitude) {
      // Reverse geocode to get address
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        .then(res => res.json())
        .then(data => {
          if (data.display_name) {
            setAddress(data.display_name);
          }
        })
        .catch(console.error);
    }
  }, [latitude, longitude]);

  if (!latitude || !longitude) {
    return (
      <div className={`w-full h-48 rounded-xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Pin your location to see preview</p>
        </div>
      </div>
    );
  }

  // Generate static map URL using OpenStreetMap tiles
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div className={`w-full rounded-xl overflow-hidden border border-border ${className}`}>
      {/* Map Preview */}
      <div className="relative h-48 bg-muted">
        <iframe
          src={mapUrl}
          className="w-full h-full border-0"
          title="Location Preview"
          loading="lazy"
        />
        
        {/* Overlay with pin */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping" />
            <div className="relative p-2 bg-primary rounded-full shadow-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="p-3 bg-card border-t border-border">
        <div className="flex items-start gap-2">
          <Navigation className="h-4 w-4 text-primary mt-1 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{shopName}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
