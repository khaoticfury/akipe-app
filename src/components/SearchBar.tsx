"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, X } from "lucide-react";
import { Restaurant } from "../types/restaurant";
import { useTheme } from "../contexts/ThemeContext";

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
  getSearchSuggestions: (
    query: string,
    userLocation?: { latitude: number; longitude: number }
  ) => Restaurant[];
  userLocation: { latitude: number; longitude: number } | null;
  onShowDirections?: (
    restaurant: Restaurant,
    mode: "walking" | "driving"
  ) => void;
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

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  const handleClearSearch = () => {
    setLocalQuery("");
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setIsLoadingSuggestions(false);
    searchRef.current?.focus();
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }

    return `${distanceKm.toFixed(1)} km`;
  };

  const getDistanceFromUser = (restaurant: SearchSuggestion): number => {
    if (!userLocation) return Number.POSITIVE_INFINITY;

    return calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      restaurant.gps_coordinates.latitude,
      restaurant.gps_coordinates.longitude
    );
  };

  const sortSuggestionsByDistance = (
    items: SearchSuggestion[]
  ): SearchSuggestion[] => {
    if (!userLocation) return items;

    return [...items].sort((a, b) => {
      return getDistanceFromUser(a) - getDistanceFromUser(b);
    });
  };

  const removeDuplicateSuggestions = (
    items: SearchSuggestion[]
  ): SearchSuggestion[] => {
    const seen = new Set<string>();

    return items.filter((item) => {
      const key = `${item.name.toLowerCase().trim()}-${item.gps_coordinates.latitude.toFixed(
        5
      )}-${item.gps_coordinates.longitude.toFixed(5)}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  };

  const convertSuggestionToRestaurant = (
    suggestion: SearchSuggestion
  ): Restaurant => {
    if ("isGooglePlace" in suggestion && suggestion.isGooglePlace) {
      return {
        id: suggestion.id,
        name: suggestion.name,
        address: suggestion.address,
        district: suggestion.district,
        type_of_cuisine: suggestion.type_of_cuisine,
        gps_coordinates: suggestion.gps_coordinates,
        opening_hours: "Horario no disponible",
        rating: suggestion.rating,
        price_range: suggestion.price_range,
        category: "local",
        date_added: new Date().toISOString(),
        wait_time: "No disponible",
        group_friendly: {
          solo: true,
          couple: true,
          family: true,
          large_group: true,
        },
      };
    }

    return suggestion as Restaurant;
  };

  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length <= 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoadingSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsLoadingSuggestions(true);
      setShowSuggestions(true);

      const appSuggestions = userLocation
        ? getSearchSuggestions(query, userLocation)
        : getSearchSuggestions(query);

      const sortedAppSuggestions = sortSuggestionsByDistance(appSuggestions);

      if (
        typeof window === "undefined" ||
        !window.google ||
        !window.google.maps ||
        !window.google.maps.places ||
        !userLocation
      ) {
        setSuggestions(sortedAppSuggestions);
        setIsLoadingSuggestions(false);
        return;
      }

      const placesService = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );

      placesService.textSearch(
        {
          query: `${query} restaurant in Lima, Peru`,
          location: new window.google.maps.LatLng(
            userLocation.latitude,
            userLocation.longitude
          ),
          radius: 50000,
        },
        (results, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            const googleSuggestions: GooglePlaceSuggestion[] = results
              .slice(0, 8)
              .filter((place) => place.geometry?.location)
              .map((place, index) => ({
                id: place.place_id || `google-${index}`,
                name: place.name || "Restaurante",
                address:
                  place.formatted_address ||
                  place.vicinity ||
                  "Dirección no disponible",
                district: "Lima",
                type_of_cuisine: "Restaurante",
                gps_coordinates: {
                  latitude: place.geometry!.location!.lat(),
                  longitude: place.geometry!.location!.lng(),
                },
                rating: place.rating || 0,
                price_range: { min: 0, max: 0, currency: "S/" },
                description:
                  place.formatted_address ||
                  place.vicinity ||
                  "Dirección no disponible",
                isGooglePlace: true,
                placeId: place.place_id || "",
              }));

            const mergedSuggestions = removeDuplicateSuggestions([
              ...sortedAppSuggestions,
              ...googleSuggestions,
            ]);

            const sortedSuggestions = sortSuggestionsByDistance(mergedSuggestions);

            setSuggestions(sortedSuggestions);
          } else {
            console.warn("Google Places API error:", status);
            setSuggestions(sortedAppSuggestions);
          }

          setIsLoadingSuggestions(false);
        }
      );
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, getSearchSuggestions, userLocation]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const restaurant = convertSuggestionToRestaurant(suggestion);

    setLocalQuery(restaurant.name);
    setSearchQuery(restaurant.name);
    setShowSuggestions(false);
    onRestaurantSelect(restaurant);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 || localQuery.trim().length > 1) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="w-full relative">
      <div className="relative flex items-center">
        <div className="relative flex-1">
          <input
            ref={searchRef}
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Buscar restaurantes en Lima..."
            className={`w-full p-4 pr-12 pl-12 border-0 rounded-2xl shadow-2xl backdrop-blur-xl focus:ring-2 focus:outline-none transition-all duration-300 ${
              actualTheme === "dark"
                ? "bg-gray-800/80 text-white placeholder-gray-400 focus:ring-white/20"
                : "bg-white/80 text-black placeholder-gray-500 focus:ring-black/20"
            }`}
          />

          <Search
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
              actualTheme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
            size={20}
          />

          {localQuery.trim().length > 0 ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClearSearch}
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 rounded-full p-1 transition-colors ${
                actualTheme === "dark"
                  ? "text-gray-400 hover:text-white hover:bg-gray-700"
                  : "text-gray-500 hover:text-black hover:bg-gray-200"
              }`}
              aria-label="Limpiar búsqueda"
            >
              <X size={18} />
            </button>
          ) : (
            <MapPin
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                actualTheme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
              size={20}
            />
          )}
        </div>
      </div>

      {showSuggestions && (
        <div
          className={`absolute top-full left-0 right-0 backdrop-blur-xl border-0 rounded-2xl shadow-2xl z-50 mt-2 max-h-80 overflow-y-auto animate-in slide-in-from-top-2 duration-200 ${
            actualTheme === "dark" ? "bg-gray-800/95" : "bg-white/95"
          }`}
        >
          <div
            className={`px-4 py-2 text-xs border-b ${
              actualTheme === "dark"
                ? "border-gray-700/50 text-gray-400"
                : "border-gray-100/50 text-gray-500"
            }`}
          >
            📍 Más cercanos primero • Google Places
          </div>

          {isLoadingSuggestions ? (
            <div
              className={`p-4 text-center ${
                actualTheme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mx-auto mb-2"></div>
              <div className="text-sm">Buscando restaurantes cercanos...</div>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((restaurant, index) => {
              const restaurantToSelect =
                convertSuggestionToRestaurant(restaurant);

              const distanceKm = getDistanceFromUser(restaurant);

              return (
                <div
                  key={`${restaurant.id}-${index}`}
                  className={`border-b last:border-b-0 ${
                    actualTheme === "dark"
                      ? "border-gray-700/50"
                      : "border-gray-100/50"
                  }`}
                >
                  <div
                    className={`p-4 transition-colors duration-150 cursor-pointer ${
                      actualTheme === "dark"
                        ? "hover:bg-gray-700/80"
                        : "hover:bg-gray-50/80"
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSuggestionClick(restaurant)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                              actualTheme === "dark"
                                ? "bg-blue-600/20 text-blue-400"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            #{index + 1}
                          </span>

                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`font-medium truncate ${
                                actualTheme === "dark"
                                  ? "text-white"
                                  : "text-gray-900"
                              }`}
                            >
                              {restaurant.name}
                            </span>

                            {restaurant.rating > 0 && (
                              <div
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full shrink-0 ${
                                  actualTheme === "dark"
                                    ? "bg-yellow-400/10 text-yellow-300"
                                    : "bg-yellow-50 text-yellow-600"
                                }`}
                              >
                                <span className="text-[11px] leading-none">
                                  ★
                                </span>
                                <span className="text-[11px] font-bold">
                                  {restaurant.rating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          className={`text-sm mt-1 ${
                            actualTheme === "dark"
                              ? "text-gray-300"
                              : "text-gray-600"
                          }`}
                        >
                          {restaurant.type_of_cuisine} • {restaurant.district}
                        </div>

                        {userLocation && Number.isFinite(distanceKm) && (
                          <div
                            className={`text-xs mt-1 ${
                              actualTheme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            📍 {formatDistance(distanceKm)} de distancia
                          </div>
                        )}

                        {"description" in restaurant &&
                          restaurant.description && (
                            <div
                              className={`text-xs mt-1 truncate ${
                                actualTheme === "dark"
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {restaurant.description}
                            </div>
                          )}
                      </div>

                      {"isGooglePlace" in restaurant &&
                        restaurant.isGooglePlace && (
                          <div
                            className={`text-xs px-2 py-1 rounded-full ml-2 shrink-0 ${
                              actualTheme === "dark"
                                ? "bg-blue-900/50 text-blue-300"
                                : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            Google
                          </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation();

                          if (onShowDirections) {
                            onShowDirections(restaurantToSelect, "walking");
                          }

                          setShowSuggestions(false);
                        }}
                        className="flex-1 bg-black text-white text-xs px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                      >
                        🚶 Caminar
                      </button>

                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation();

                          if (onShowDirections) {
                            onShowDirections(restaurantToSelect, "driving");
                          }

                          setShowSuggestions(false);
                        }}
                        className={`flex-1 text-xs px-3 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-1 ${
                          actualTheme === "dark"
                            ? "bg-gray-700 text-white hover:bg-gray-600"
                            : "bg-gray-200 text-black hover:bg-gray-300"
                        }`}
                      >
                        🚗 Auto
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className={`p-4 text-center ${
                actualTheme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <div className="text-sm">No se encontraron restaurantes</div>
              <div className="text-xs mt-1">
                Intenta con otros términos de búsqueda o ajusta tu ubicación
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;