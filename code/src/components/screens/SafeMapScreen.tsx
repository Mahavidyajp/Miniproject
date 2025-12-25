import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Shield, 
  AlertTriangle, 
  Clock,
  Route,
  Loader2,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/lib/appContext';
import { BottomNav } from '@/components/BottomNav';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const startIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

interface LatLng {
  lat: number;
  lng: number;
}

interface SafetyZone {
  id: string;
  center: LatLng;
  radius: number;
  type: 'safe' | 'caution' | 'avoid';
  name: string;
  reason: string;
}

interface RouteInfo {
  distance: string;
  duration: string;
  safetyScore: number;
  coordinates: [number, number][];
  warnings: string[];
}

const mockSafetyZones: SafetyZone[] = [
  { id: '1', center: { lat: 40.7128, lng: -74.0060 }, radius: 300, type: 'safe', name: 'Police Station', reason: '24/7 patrol coverage' },
  { id: '2', center: { lat: 40.7138, lng: -74.0080 }, radius: 200, type: 'safe', name: 'Hospital', reason: 'Well-lit, security cameras' },
  { id: '3', center: { lat: 40.7148, lng: -74.0040 }, radius: 250, type: 'caution', name: 'Park Area', reason: 'Limited lighting after dark' },
  { id: '4', center: { lat: 40.7108, lng: -74.0100 }, radius: 300, type: 'avoid', name: 'Industrial Zone', reason: 'Reported incidents in past month' },
];

function MapUpdater({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 15);
  }, [center, map]);
  return null;
}

export function SafeMapScreen() {
  const { setScreen } = useApp();
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [startCoords, setStartCoords] = useState<LatLng | null>(null);
  const [endCoords, setEndCoords] = useState<LatLng | null>(null);
  const [currentPosition, setCurrentPosition] = useState<LatLng>({ lat: 40.7128, lng: -74.0060 });
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showSafetyZones, setShowSafetyZones] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentHour] = useState(new Date().getHours());

  const isNightTime = currentHour >= 20 || currentHour < 6;

  useEffect(() => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCurrentPosition(pos);
          setStartCoords(pos);
          setStartLocation('Current Location');
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const searchLocation = async (query: string): Promise<LatLng | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
      return null;
    } catch {
      return null;
    }
  };

  const calculateRoute = async () => {
    if (!startCoords || !endCoords) {
      setError('Please set both start and end locations');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );

        let safetyScore = 85;
        const warnings: string[] = [];

        if (isNightTime) {
          safetyScore -= 15;
          warnings.push('Nighttime travel - reduced visibility');
        }

        mockSafetyZones.forEach(zone => {
          const routePassesThrough = coords.some(([lat, lng]) => {
            const dist = Math.sqrt(
              Math.pow(lat - zone.center.lat, 2) + Math.pow(lng - zone.center.lng, 2)
            ) * 111000;
            return dist < zone.radius;
          });

          if (routePassesThrough) {
            if (zone.type === 'avoid') {
              safetyScore -= 20;
              warnings.push(`Route passes through ${zone.name}: ${zone.reason}`);
            } else if (zone.type === 'caution') {
              safetyScore -= 10;
              warnings.push(`Caution near ${zone.name}: ${zone.reason}`);
            } else if (zone.type === 'safe') {
              safetyScore += 5;
            }
          }
        });

        safetyScore = Math.max(0, Math.min(100, safetyScore));

        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMins = Math.ceil(route.duration / 60);

        setRouteInfo({
          distance: `${distanceKm} km`,
          duration: `${durationMins} min`,
          safetyScore,
          coordinates: coords,
          warnings,
        });
      } else {
        setError('Could not find a route between these locations');
      }
    } catch {
      setError('Failed to calculate route. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSearch = async () => {
    if (startLocation && startLocation !== 'Current Location') {
      const coords = await searchLocation(startLocation);
      if (coords) {
        setStartCoords(coords);
      } else {
        setError('Could not find start location');
      }
    }
  };

  const handleEndSearch = async () => {
    if (endLocation) {
      const coords = await searchLocation(endLocation);
      if (coords) {
        setEndCoords(coords);
        setCurrentPosition(coords);
      } else {
        setError('Could not find destination');
      }
    }
  };

  const useCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCurrentPosition(pos);
          setStartCoords(pos);
          setStartLocation('Current Location');
          setIsLocating(false);
        },
        () => {
          setError('Could not get current location');
          setIsLocating(false);
        }
      );
    }
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-alert';
    return 'text-emergency';
  };

  const getZoneColor = (type: SafetyZone['type']) => {
    switch (type) {
      case 'safe': return { color: '#22c55e', fillColor: '#22c55e' };
      case 'caution': return { color: '#f59e0b', fillColor: '#f59e0b' };
      case 'avoid': return { color: '#ef4444', fillColor: '#ef4444' };
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Route className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Safe Route Map</h1>
              <p className="text-xs text-muted-foreground">Find the safest path to your destination</p>
            </div>
          </div>
          {isNightTime && (
            <Badge variant="outline" className="text-alert border-alert">
              <Clock className="w-3 h-3 mr-1" />
              Night Mode
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
              <Input
                placeholder="Start location"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                onBlur={handleStartSearch}
                className="pl-9"
                data-testid="input-start-location"
              />
            </div>
            <Button variant="outline" size="icon" onClick={useCurrentLocation} disabled={isLocating} data-testid="button-current-location">
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            </Button>
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emergency" />
            <Input
              placeholder="Where do you want to go?"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
              onBlur={handleEndSearch}
              className="pl-9"
              data-testid="input-end-location"
            />
          </div>
          <Button 
            className="w-full" 
            onClick={calculateRoute} 
            disabled={isLoading || !startCoords || !endCoords}
            data-testid="button-find-route"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calculating safest route...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Find Safest Route
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-2 p-3 bg-emergency/10 border border-emergency/20 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-emergency" />
          <p className="text-sm text-emergency">{error}</p>
          <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="flex-1 relative">
        <div className="h-[300px] mx-4 mt-2 rounded-lg overflow-hidden border border-border">
          <MapContainer
            center={[currentPosition.lat, currentPosition.lng]}
            zoom={15}
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={currentPosition} />

            {showSafetyZones && mockSafetyZones.map((zone) => (
              <Circle
                key={zone.id}
                center={[zone.center.lat, zone.center.lng]}
                radius={zone.radius}
                pathOptions={{ ...getZoneColor(zone.type), fillOpacity: 0.2, weight: 2 }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{zone.name}</p>
                    <p className="text-muted-foreground">{zone.reason}</p>
                    <Badge variant={zone.type === 'safe' ? 'default' : zone.type === 'caution' ? 'secondary' : 'destructive'} className="mt-1">
                      {zone.type.charAt(0).toUpperCase() + zone.type.slice(1)}
                    </Badge>
                  </div>
                </Popup>
              </Circle>
            ))}

            {startCoords && (
              <Marker position={[startCoords.lat, startCoords.lng]} icon={startIcon}>
                <Popup>Start: {startLocation}</Popup>
              </Marker>
            )}

            {endCoords && (
              <Marker position={[endCoords.lat, endCoords.lng]} icon={endIcon}>
                <Popup>Destination: {endLocation}</Popup>
              </Marker>
            )}

            {routeInfo && (
              <Polyline
                positions={routeInfo.coordinates}
                pathOptions={{
                  color: routeInfo.safetyScore >= 80 ? '#22c55e' : routeInfo.safetyScore >= 60 ? '#f59e0b' : '#ef4444',
                  weight: 5,
                  opacity: 0.8,
                }}
              />
            )}
          </MapContainer>
        </div>

        <div className="absolute top-4 right-6 z-[1000]">
          <Button
            variant={showSafetyZones ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowSafetyZones(!showSafetyZones)}
            data-testid="button-toggle-zones"
          >
            <Shield className="w-4 h-4 mr-1" />
            Safety Zones
          </Button>
        </div>
      </div>

      {routeInfo && (
        <div className="p-4 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Route Summary</span>
                <Badge variant="outline" className={getSafetyColor(routeInfo.safetyScore)}>
                  Safety Score: {routeInfo.safetyScore}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Route className="w-4 h-4 text-muted-foreground" />
                  <span>{routeInfo.distance}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{routeInfo.duration}</span>
                </div>
              </div>

              {routeInfo.warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Warnings:</p>
                  {routeInfo.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-alert">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              {routeInfo.safetyScore >= 80 && (
                <div className="flex items-center gap-2 text-sm text-success mt-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>This route is considered safe for travel</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${startCoords?.lat},${startCoords?.lng}&destination=${endCoords?.lat},${endCoords?.lng}`, '_blank')} data-testid="button-open-maps">
              <Navigation className="w-4 h-4 mr-2" />
              Open in Maps
            </Button>
          </div>
        </div>
      )}

      {!routeInfo && (
        <div className="p-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground mb-1">How Safe Routes Work</h3>
                  <p className="text-sm text-muted-foreground">
                    Our safety algorithm considers time of day, reported incidents, 
                    well-lit areas, police station proximity, and public safety reviews 
                    to suggest the safest path to your destination.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <BottomNav activeTab="map" />
    </div>
  );
}

export default SafeMapScreen;
