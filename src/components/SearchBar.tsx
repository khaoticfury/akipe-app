"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Restaurant } from '../types/restaurant';
import { useTheme } from '../contexts/ThemeContext';

interface GooglePlaceSuggestion {
  id: string;
  name: string;
  address: string;
  district: string;
  type_of_cuisine: string;
  gps_coordinates: { latitude: number; longitude: number };
  rating: number;
  price_range: { min: number; max: number; currency: string };
  description: string;
  isGooglePlace: boolean;
  placeId: string;
}

type SearchSuggestion = Restaurant | GooglePlaceSuggestion;

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRestaurantSelect: (restaurant: Restaurant) => void;
  getSearchSuggestions: (query: string, userLocation?: { latitude: number; longitude: number }) => Restaurant[];
  userLocation: { latitude: number; longitude: number } | null;
  onShowDirections?: (restaurant: Restaurant) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onRestaurantSelect,
  getSearchSuggestions,
  userLocation,
  onShowDirections,
}) => {
  const { actualTheme } = useTheme();
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [googlePlacesService, setGooglePlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [googleAutocompleteService, setGoogleAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      try {
        // Initialize Google Places services when Google Maps is loaded
        // Note: PlacesService and AutocompleteService show deprecation warnings as of March 1st, 2025
        // for new customers, but existing implementations continue to work
        const mapDiv = document.createElement('div');
        const map = new window.google.maps.Map(mapDiv, { center: { lat: 0, lng: 0 }, zoom: 1 });
        const placesService = new window.google.maps.places.PlacesService(map);
        const autocompleteService = new window.google.maps.places.AutocompleteService();

        console.log('Google Places services initialized successfully');
        setGooglePlacesService(placesService);
        setGoogleAutocompleteService(autocompleteService);
      } catch (error) {
        console.error('Error initializing Google Places services:', error);
      }
    } else {
      console.log('Google Maps not loaded yet, waiting...');
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length > 1) {
        setIsLoadingSuggestions(true);

        // Get Google Places suggestions using text search
        if (userLocation) {
          console.log('Getting Google Places suggestions for:', searchQuery);
          const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
          placesService.textSearch(
            {
              query: `${searchQuery} restaurant in Lima, Peru`,
              locationBias: {
                center: { lat: userLocation.latitude, lng: userLocation.longitude },
                radius: 50000
              }
            },
            (results, status) => {
              console.log('Google Places response:', status, results);

              if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                const googleSuggestions: GooglePlaceSuggestion[] = results.slice(0, 5).map((place, index) => ({
                  id: `google-${index}`,
                  name: place.name,
                  address: place.formatted_address,
                  district: 'Lima',
                  type_of_cuisine: 'Restaurant',
                  gps_coordinates: { latitude: place.geometry.location.lat(), longitude: place.geometry.location.lng() },
                  rating: place.rating || 0,
                  price_range: { min: 0, max: 0, currency: 'PEN' },
                  description: place.formatted_address,
                  isGooglePlace: true,
                  placeId: place.place_id
                }));

                console.log('Google suggestions:', googleSuggestions.length);
                setSuggestions(googleSuggestions);
              } else {
                console.warn('Google Places API error:', status);
                setSuggestions([]);
              }
            }
          );
        } else {
          console.log('User location not available, no suggestions');
          setSuggestions([]);
        }

        setShowSuggestions(true);
        setIsLoadingSuggestions(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsLoadingSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, getSearchSuggestions, googleAutocompleteService, userLocation]);

  // Update suggestions when user location changes (for real-time distance updates)
  useEffect(() => {
    if (searchQuery.length > 1 && userLocation) {
      const appSuggestions = getSearchSuggestions(searchQuery, userLocation);
      console.log('Location update - App suggestions:', appSuggestions.length);

      // Only update if we have app suggestions, otherwise keep existing suggestions
      if (appSuggestions.length > 0) {
        setSuggestions(prev => {
          // Replace only the app suggestions, keep Google suggestions
          const googleSuggestions = prev.filter(s => 'isGooglePlace' in s && s.isGooglePlace);
          return [...appSuggestions, ...googleSuggestions];
        });
      }
    }
  }, [userLocation, searchQuery, getSearchSuggestions]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);

    // Convert Google Place to Restaurant format if needed
    if ('isGooglePlace' in suggestion && suggestion.isGooglePlace) {
      const restaurant: Restaurant = {
        id: suggestion.id,
        name: suggestion.name,
        address: suggestion.address,
        district: suggestion.district,
        type_of_cuisine: suggestion.type_of_cuisine,
        gps_coordinates: suggestion.gps_coordinates,
        opening_hours: 'Horario no disponible',
        rating: suggestion.rating,
        price_range: suggestion.price_range,
        category: 'local',
        date_added: new Date().toISOString(),
        wait_time: 'No disponible',
        group_friendly: {
          solo: true,
          couple: true,
          family: true,
          large_group: true
        }
      };
      onRestaurantSelect(restaurant);
    } else {
      onRestaurantSelect(suggestion as Restaurant);
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <div className="relative flex-1">
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar restaurantes en Lima..."
            className={`w-full p-4 pr-12 pl-12 border-0 rounded-2xl shadow-2xl backdrop-blur-xl focus:ring-2 focus:outline-none transition-all duration-300 ${
              actualTheme === 'dark'
                ? 'bg-gray-800/80 text-white placeholder-gray-400 focus:ring-white/20'
                : 'bg-white/80 text-black placeholder-gray-500 focus:ring-black/20'
            }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
            actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`} size={20} />
          <MapPin className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
            actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`} size={20} />
        </div>


      </div>

      {/* Search Suggestions */}
      {showSuggestions && (
        <div className={`absolute top-full left-0 right-0 backdrop-blur-xl border-0 rounded-2xl shadow-2xl z-50 mt-2 max-h-80 overflow-y-auto animate-in slide-in-from-top-2 duration-200 ${
          actualTheme === 'dark' ? 'bg-gray-800/95' : 'bg-white/95'
        }`}>
          {/* Distance ordering indicator */}
          <div className={`px-4 py-2 text-xs border-b ${
            actualTheme === 'dark' ? 'border-gray-700/50 text-gray-400' : 'border-gray-100/50 text-gray-500'
          }`}>
            📍 Ordenado por distancia (más cercano primero) • Google Places
          </div>

          {isLoadingSuggestions ? (
            <div className={`p-4 text-center ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mx-auto mb-2"></div>
              <div className="text-sm">Buscando restaurantes...</div>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((restaurant, index) => (
            <div
              key={`${restaurant.id}-${index}`}
              className={`border-b last:border-b-0 ${
                actualTheme === 'dark' ? 'border-gray-700/50' : 'border-gray-100/50'
              }`}
            >
              <div className={`p-4 transition-colors duration-150 ${
                actualTheme === 'dark' ? 'hover:bg-gray-700/80' : 'hover:bg-gray-50/80'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        actualTheme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-800'
                      }`}>
                        #{index + 1}
                      </span>
                      <span className={`font-medium ${
                        actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{restaurant.name}</span>
                    </div>
                    <div className={`text-sm mt-1 ${
                      actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {restaurant.type_of_cuisine} • {restaurant.district}
                    </div>
                    {userLocation && (
                      <div className={`text-xs mt-1 ${
                        actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        📍 {calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          restaurant.gps_coordinates.latitude,
                          restaurant.gps_coordinates.longitude
                        ).toFixed(1)} km de distancia
                      </div>
                    )}
                    {'description' in restaurant && restaurant.description && (
                      <div className={`text-xs mt-1 truncate ${
                        actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {restaurant.description}
                      </div>
                    )}
                  </div>
                  {'isGooglePlace' in restaurant && restaurant.isGooglePlace && (
                    <div className={`text-xs px-2 py-1 rounded-full ml-2 ${
                      actualTheme === 'dark'
                        ? 'bg-blue-900/50 text-blue-300'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      Google
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const restaurantToSelect = 'isGooglePlace' in restaurant && restaurant.isGooglePlace
                        ? {
                            id: restaurant.id,
                            name: restaurant.name,
                            address: restaurant.address,
                            district: restaurant.district,
                            type_of_cuisine: restaurant.type_of_cuisine,
                            gps_coordinates: restaurant.gps_coordinates,
                            opening_hours: 'Horario no disponible',
                            rating: restaurant.rating,
                            price_range: restaurant.price_range,
                            category: 'local',
                            date_added: new Date().toISOString(),
                            wait_time: 'No disponible',
                            group_friendly: {
                              solo: true,
                              couple: true,
                              family: true,
                              large_group: true
                            }
                          } as Restaurant
                        : restaurant as Restaurant;

                      if (onShowDirections) {
                        onShowDirections(restaurantToSelect);
                      }
                    }}
                    className="flex-1 bg-black text-white text-xs px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                  >
                    🚶 Caminar
                  </button>
                  <button
                    onClick={() => {
                      const restaurantToSelect = 'isGooglePlace' in restaurant && restaurant.isGooglePlace
                        ? {
                            id: restaurant.id,
                            name: restaurant.name,
                            address: restaurant.address,
                            district: restaurant.district,
                            type_of_cuisine: restaurant.type_of_cuisine,
                            gps_coordinates: restaurant.gps_coordinates,
                            opening_hours: 'Horario no disponible',
                            rating: restaurant.rating,
                            price_range: restaurant.price_range,
                            category: 'local',
                            date_added: new Date().toISOString(),
                            wait_time: 'No disponible',
                            group_friendly: {
                              solo: true,
                              couple: true,
                              family: true,
                              large_group: true
                            }
                          } as Restaurant
                        : restaurant as Restaurant;

                      if (onShowDirections) {
                        onShowDirections(restaurantToSelect);
                      }
                    }}
                    className={`flex-1 text-xs px-3 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-1 ${
                      actualTheme === 'dark'
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-black hover:bg-gray-300'
                    }`}
                  >
                    🚗 Auto
                  </button>
                </div>
              </div>
            </div>
            ))
          ) : (
            <div className={`p-4 text-center ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div className="text-sm">No se encontraron restaurantes</div>
              <div className="text-xs mt-1">Intenta con otros términos de búsqueda o ajusta tu ubicación</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
