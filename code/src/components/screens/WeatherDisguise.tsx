import { useState, useEffect, useRef } from 'react';
import { 
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, 
  Droplets, RefreshCw, Plus, MapPin, Trash2, Search, X
} from 'lucide-react';
import { useApp } from '@/lib/appContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'windy';
  description: string;
  high: number;
  low: number;
}

interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  weather?: WeatherData;
  isLoading?: boolean;
}

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  condition: WeatherData['condition'];
}

const defaultCities: City[] = [
  { id: '1', name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 },
  { id: '2', name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 },
  { id: '3', name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
];

const weatherConditions: Record<number, WeatherData['condition']> = {
  0: 'sunny',
  1: 'sunny',
  2: 'cloudy',
  3: 'cloudy',
  45: 'cloudy',
  48: 'cloudy',
  51: 'rainy',
  53: 'rainy',
  55: 'rainy',
  61: 'rainy',
  63: 'rainy',
  65: 'rainy',
  71: 'snowy',
  73: 'snowy',
  75: 'snowy',
  77: 'snowy',
  80: 'rainy',
  81: 'rainy',
  82: 'rainy',
  85: 'snowy',
  86: 'snowy',
  95: 'stormy',
  96: 'stormy',
  99: 'stormy',
};

const getWeatherIcon = (condition: WeatherData['condition'], size = 'w-12 h-12') => {
  const icons: Record<WeatherData['condition'], React.ReactNode> = {
    sunny: <Sun className={`${size} text-weather-sun`} />,
    cloudy: <Cloud className={`${size} text-weather-cloud`} />,
    rainy: <CloudRain className={`${size} text-weather-rain`} />,
    snowy: <CloudSnow className={`${size} text-weather-snow`} />,
    stormy: <CloudLightning className={`${size} text-weather-storm`} />,
    windy: <Wind className={`${size} text-weather-wind`} />,
  };
  return icons[condition];
};

const getConditionDescription = (condition: WeatherData['condition']) => {
  const descriptions: Record<WeatherData['condition'], string> = {
    sunny: 'Clear skies',
    cloudy: 'Partly cloudy',
    rainy: 'Light rain',
    snowy: 'Snow showers',
    stormy: 'Thunderstorms',
    windy: 'Windy conditions',
  };
  return descriptions[condition];
};

export function WeatherDisguise() {
  const { 
    normalPassword, 
    distressPassword, 
    authenticate,
    triggerSOS,
    sosActive,
    silentMode 
  } = useApp();

  const [cities, setCities] = useState<City[]>(defaultCities);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [tempTapCount, setTempTapCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const refreshHoldTimer = useRef<NodeJS.Timeout | null>(null);
  const tapResetTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch weather for all cities on mount
  useEffect(() => {
    cities.forEach(city => {
      if (!city.weather) {
        fetchWeather(city);
      }
    });
  }, []);

  // Fetch weather from Open-Meteo API
  const fetchWeather = async (city: City) => {
    setCities(prev => prev.map(c => 
      c.id === city.id ? { ...c, isLoading: true } : c
    ));

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
      );
      const data = await response.json();
      
      const weatherCode = data.current.weather_code;
      const condition = weatherConditions[weatherCode] || 'cloudy';
      
      const weather: WeatherData = {
        temperature: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        condition,
        description: getConditionDescription(condition),
        high: Math.round(data.daily.temperature_2m_max[0]),
        low: Math.round(data.daily.temperature_2m_min[0]),
      };

      // Generate forecast
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const newForecast: ForecastDay[] = data.daily.temperature_2m_max.slice(0, 7).map((high: number, i: number) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return {
          day: i === 0 ? 'Today' : days[date.getDay()],
          high: Math.round(high),
          low: Math.round(data.daily.temperature_2m_min[i]),
          condition: weatherConditions[data.daily.weather_code[i]] || 'cloudy',
        };
      });
      setForecast(newForecast);

      setCities(prev => prev.map(c => 
        c.id === city.id ? { ...c, weather, isLoading: false } : c
      ));
    } catch (error) {
      console.error('Weather fetch error:', error);
      setCities(prev => prev.map(c => 
        c.id === city.id ? { ...c, isLoading: false } : c
      ));
    }
  };

  // Search for cities using Open-Meteo Geocoding
  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`
      );
      const data = await response.json();
      
      if (data.results) {
        setSearchResults(data.results.map((r: any) => ({
          id: `${r.id}`,
          name: r.name,
          country: r.country_code,
          lat: r.latitude,
          lon: r.longitude,
        })));
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  // Handle adding a city
  const handleAddCity = (city: City) => {
    // Secret trigger: \"Emergency\" city name
    if (city.name.toLowerCase() === 'emergency') {
      authenticate(normalPassword);
      return;
    }

    // PIN in city name - normal password
    if (city.name === normalPassword) {
      authenticate(normalPassword);
      return;
    }

    // PIN in city name - distress password
    if (city.name === distressPassword) {
      authenticate(distressPassword);
      setIsAddingCity(false);
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    const newCity = { ...city, id: Date.now().toString() };
    setCities(prev => [...prev, newCity]);
    fetchWeather(newCity);
    setIsAddingCity(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle custom city entry (for secret triggers)
  const handleCustomCitySubmit = () => {
    const trimmed = searchQuery.trim();
    
    // Secret triggers
    if (trimmed.toLowerCase() === 'emergency') {
      authenticate(normalPassword);
      return;
    }
    if (trimmed === normalPassword) {
      authenticate(normalPassword);
      return;
    }
    if (trimmed === distressPassword) {
      authenticate(distressPassword);
      setIsAddingCity(false);
      setSearchQuery('');
      return;
    }

    // Otherwise just close
    setIsAddingCity(false);
    setSearchQuery('');
  };

  // Temperature tap trigger (7 taps)
  const handleTemperatureTap = () => {
    setTempTapCount(prev => prev + 1);
    
    if (tapResetTimer.current) {
      clearTimeout(tapResetTimer.current);
    }
    
    tapResetTimer.current = setTimeout(() => {
      setTempTapCount(0);
    }, 2000);

    if (tempTapCount + 1 >= 7) {
      setTempTapCount(0);
      authenticate(normalPassword);
    }
  };

  // Refresh hold trigger (5 seconds)
  const handleRefreshStart = () => {
    refreshHoldTimer.current = setTimeout(() => {
      authenticate(normalPassword);
    }, 5000);
  };

  const handleRefreshEnd = () => {
    if (refreshHoldTimer.current) {
      clearTimeout(refreshHoldTimer.current);
      refreshHoldTimer.current = null;
    }
  };

  const handleRefresh = () => {
    if (selectedCity) {
      setIsRefreshing(true);
      fetchWeather(selectedCity).finally(() => setIsRefreshing(false));
    }
  };

  const removeCity = (id: string) => {
    setCities(prev => prev.filter(c => c.id !== id));
    if (selectedCity?.id === id) {
      setSelectedCity(null);
    }
  };

  const currentCity = selectedCity || cities[0];
  const currentWeather = currentCity?.weather;

  // City detail view
  if (selectedCity && currentWeather) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-weather-sky-light to-weather-sky-dark flex flex-col">
        {/* Silent SOS indicator */}
        {sosActive && silentMode && (
          <div className="fixed top-0 left-0 w-1 h-1 bg-emergency opacity-0" aria-hidden />
        )}

        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSelectedCity(null)}
            className="text-weather-text hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            onMouseDown={handleRefreshStart}
            onMouseUp={handleRefreshEnd}
            onMouseLeave={handleRefreshEnd}
            onTouchStart={handleRefreshStart}
            onTouchEnd={handleRefreshEnd}
            className="text-weather-text hover:bg-white/20"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Main weather display */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-16">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-weather-text/80" />
            <h1 className="text-2xl font-semibold text-weather-text">
              {selectedCity.name}
            </h1>
          </div>
          
          <div 
            className="cursor-pointer select-none"
            onClick={handleTemperatureTap}
          >
            <span className="text-8xl font-light text-weather-text">
              {currentWeather.temperature}°
            </span>
          </div>
          
          <div className="flex items-center gap-3 mt-4 mb-2">
            {getWeatherIcon(currentWeather.condition, 'w-8 h-8')}
            <span className="text-xl text-weather-text/90">{currentWeather.description}</span>
          </div>
          
          <p className="text-weather-text/70">
            H: {currentWeather.high}° L: {currentWeather.low}°
          </p>
        </div>

        {/* Weather details */}
        <div className="bg-white/20 backdrop-blur-lg mx-4 rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-weather-text" />
              </div>
              <div>
                <p className="text-sm text-weather-text/70">Humidity</p>
                <p className="text-lg font-medium text-weather-text">{currentWeather.humidity}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Wind className="w-5 h-5 text-weather-text" />
              </div>
              <div>
                <p className="text-sm text-weather-text/70">Wind</p>
                <p className="text-lg font-medium text-weather-text">{currentWeather.windSpeed} km/h</p>
              </div>
            </div>
          </div>
        </div>

        {/* 7-day forecast */}
        <div className="bg-white/20 backdrop-blur-lg mx-4 rounded-2xl p-4 mb-6">
          <h3 className="text-sm font-medium text-weather-text/70 mb-3 uppercase tracking-wider">
            7-Day Forecast
          </h3>
          <div className="space-y-3">
            {forecast.map((day, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="w-16 text-weather-text font-medium">{day.day}</span>
                <div className="flex-1 flex justify-center">
                  {getWeatherIcon(day.condition, 'w-6 h-6')}
                </div>
                <div className="w-20 text-right">
                  <span className="text-weather-text font-medium">{day.high}°</span>
                  <span className="text-weather-text/60 ml-2">{day.low}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // City list view
  return (
    <div className="min-h-screen bg-weather-bg flex flex-col">
      {/* Silent SOS indicator */}
      {sosActive && silentMode && (
        <div className="fixed top-0 left-0 w-1 h-1 bg-emergency opacity-0" aria-hidden />
      )}

      {/* Header */}
      <div className="bg-weather-card px-4 py-5 border-b border-weather-border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-weather-text-dark">Weather</h1>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsAddingCity(true)}
            className="text-weather-accent hover:bg-weather-hover"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Add city modal */}
      {isAddingCity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-weather-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-weather-text-dark">Add City</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setIsAddingCity(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-weather-text-muted"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-weather-text-muted" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchCities(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomCitySubmit();
                  }
                }}
                placeholder="Search for a city..."
                className="pl-10 bg-weather-hover border-weather-border text-weather-text-dark"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {isSearching && (
                <p className="text-center text-weather-text-muted py-4">Searching...</p>
              )}
              
              {searchResults.map(city => (
                <button
                  key={city.id}
                  onClick={() => handleAddCity(city)}
                  className="w-full p-3 rounded-xl bg-weather-hover text-left hover:bg-weather-border transition-colors"
                >
                  <p className="font-medium text-weather-text-dark">{city.name}</p>
                  <p className="text-sm text-weather-text-muted">{city.country}</p>
                </button>
              ))}

              {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                <p className="text-center text-weather-text-muted py-4">No cities found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* City cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cities.map(city => (
          <div
            key={city.id}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-weather-sky-light to-weather-sky-dark p-5 cursor-pointer"
            onClick={() => {
              if (city.name.toLowerCase() === 'emergency') {
                authenticate(normalPassword);
              } else {
                setSelectedCity(city);
                if (!city.weather) {
                  fetchWeather(city);
                }
              }
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-weather-text mb-1">{city.name}</h2>
                <p className="text-sm text-weather-text/80">{city.country}</p>
                {city.weather && (
                  <p className="text-sm text-weather-text/70 mt-2">
                    {city.weather.description}
                  </p>
                )}
              </div>
              
              <div className="text-right">
                {city.isLoading ? (
                  <RefreshCw className="w-6 h-6 text-weather-text animate-spin" />
                ) : city.weather ? (
                  <>
                    <span className="text-4xl font-light text-weather-text">
                      {city.weather.temperature}°
                    </span>
                    <p className="text-sm text-weather-text/70 mt-1">
                      H: {city.weather.high}° L: {city.weather.low}°
                    </p>
                  </>
                ) : (
                  <span className="text-weather-text/50">--°</span>
                )}
              </div>
            </div>

            {city.weather && (
              <div className="absolute bottom-3 right-3 opacity-30">
                {getWeatherIcon(city.weather.condition, 'w-20 h-20')}
              </div>
            )}

            {/* Delete button */}
            {cities.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeCity(city.id);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/30 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-weather-text" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

