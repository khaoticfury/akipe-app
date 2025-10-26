"use client";

import React, { useState, useEffect } from "react";
import { MapPin, List, Tag, User, Navigation, Plus, Search } from "lucide-react";
import { Restaurant } from "../types/restaurant";
import { useRestaurants } from "../hooks/useRestaurants";
import RestaurantCard from "../components/RestaurantCard";
import AkipeModal from "../components/AkipeModal";
import AddRestaurantModal from "../components/AddRestaurantModal";
import EditRestaurantModal from "../components/EditRestaurantModal";
import EnhancedLimaMap from "../components/EnhancedLimaMap";
import SearchBar from "../components/SearchBar";
import ThemeToggle from "../components/ThemeToggle";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

const HomeContent: React.FC = () => {
  console.log("Env Google Maps API Key in page.tsx:", 'AIzaSyB-lBvj-olcVi-bhZD8N0petLA_Yvb2dDU');
  const [activeTab, setActiveTab] = useState("map");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showAkipeModal, setShowAkipeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [selectedGroupType, setSelectedGroupType] = useState<string | null>(null);
  const [hasSelectedFilters, setHasSelectedFilters] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [travelMode, setTravelMode] = useState<'walking' | 'driving' | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

  const { actualTheme } = useTheme();

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDirectionsModal(true);
  };

  const handleCloseDirectionsModal = () => {
    setShowDirectionsModal(false);
    setSelectedRestaurant(null);
    setTravelMode(null);
  };

  const handleSelectTravelMode = (mode: 'walking' | 'driving') => {
    setTravelMode(mode);
    setShowDirectionsModal(false);
  };

  useEffect(() => {
    const handleManualLocationUpdate = (event: CustomEvent) => {
      const { latitude, longitude } = event.detail;
      setUserLocation({ latitude, longitude });
    };
    window.addEventListener("manualLocationUpdate", handleManualLocationUpdate as EventListener);
    return () => {
      window.removeEventListener("manualLocationUpdate", handleManualLocationUpdate as EventListener);
    };
  }, []);

  // Initialize useRestaurants hook with filters
  const {
    restaurants,
    loading,
    error,
    getSearchSuggestions,
    addRestaurant,
    getRestaurantById
  } = useRestaurants({
    searchQuery,
    selectedRadius: selectedRadius || undefined,
    userLocation: userLocation || undefined,
    groupType: selectedGroupType || undefined
  });

  // Filter restaurants within 10km and sort by distance
  const filteredRestaurants = React.useMemo(() => {
    if (!userLocation || typeof window === 'undefined' || !window.google) return [];
    const userLatLng = new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude);
    return restaurants
      .filter(r => {
        const restaurantLatLng = new window.google.maps.LatLng(r.gps_coordinates.latitude, r.gps_coordinates.longitude);
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(userLatLng, restaurantLatLng);
        return distance <= 10000; // 10 km
      })
      .sort((a, b) => {
        const aLatLng = new window.google.maps.LatLng(a.gps_coordinates.latitude, a.gps_coordinates.longitude);
        const bLatLng = new window.google.maps.LatLng(b.gps_coordinates.latitude, b.gps_coordinates.longitude);
        const distA = window.google.maps.geometry.spherical.computeDistanceBetween(userLatLng, aLatLng);
        const distB = window.google.maps.geometry.spherical.computeDistanceBetween(userLatLng, bLatLng);
        return distA - distB;
      });
  }, [restaurants, userLocation]);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setGeoError(null);
        },
        (error) => {
          console.error("Error getting location:", error);
          setGeoError("No se pudo obtener la ubicación. Por favor, permita el acceso a la ubicación.");
        }
      );
    } else {
      setGeoError("La geolocalización no es compatible con este navegador.");
    }
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleEditClick = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
  };

  // Filter restaurants within 10km and sort by distance
  const filteredRestaurantsList = React.useMemo(() => {
    if (!userLocation || typeof window === 'undefined' || !window.google) return [];
    const userLatLng = new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude);
    return restaurants
      .filter(r => {
        const restaurantLatLng = new window.google.maps.LatLng(r.gps_coordinates.latitude, r.gps_coordinates.longitude);
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(userLatLng, restaurantLatLng);
        return distance <= (selectedRadius || 10000); // use selectedRadius or default 10km
      })
      .sort((a, b) => {
        const aLatLng = new window.google.maps.LatLng(a.gps_coordinates.latitude, a.gps_coordinates.longitude);
        const bLatLng = new window.google.maps.LatLng(b.gps_coordinates.latitude, b.gps_coordinates.longitude);
        const distA = window.google.maps.geometry.spherical.computeDistanceBetween(userLatLng, aLatLng);
        const distB = window.google.maps.geometry.spherical.computeDistanceBetween(userLatLng, bLatLng);
        return distA - distB;
      });
  }, [restaurants, userLocation, selectedRadius]);

  const handleDirectionClick = (mode: 'walking' | 'driving') => {
    if (selectedRestaurant) {
      const destination = encodeURIComponent(
        selectedRestaurant.address + ', ' + selectedRestaurant.district + ', Lima, Peru'
      );
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${mode}`,
        '_blank'
      );
      setShowDirectionsModal(false);
    }
  };

  const handleEditSubmit = async (updatedRestaurant: Restaurant) => {
    // updateRestaurant is not available, so this function needs to be adjusted or removed
    // For now, just close the editing modal
    setEditingRestaurant(null);
  };

  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      actualTheme === 'dark'
        ? 'bg-gray-900 text-white'
        : 'bg-white text-black'
    } font-sans flex flex-col`}>
      <header className={`p-4 border-b shadow-sm transition-colors duration-300 ${
        actualTheme === 'dark'
          ? 'border-gray-700 bg-gray-800/80 backdrop-blur-md'
          : 'border-gray-200 bg-white/80 backdrop-blur-md'
      }`}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Descubre con Akipe
          </h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 p-4 pb-20 overflow-auto">
        {/* Enhanced Search Bar with Add Button */}
        <div className="relative w-full flex gap-2 mb-4">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onRestaurantSelect={handleRestaurantClick}
            getSearchSuggestions={getSearchSuggestions}
            userLocation={userLocation}
            onLocationRequest={handleLocationRequest}
          />

          {/* Add Restaurant Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className={`p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 ${
              actualTheme === 'dark'
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
            aria-label="Agregar restaurante"
          >
            <Plus size={20} />
          </button>
        </div>

        {geoError && (
          <div className={`mb-4 p-4 rounded-lg text-center transition-colors duration-300 ${
            actualTheme === 'dark'
              ? 'bg-red-900/50 text-red-200'
              : 'bg-red-100 text-red-700'
          }`}>
            {geoError}
            <p className="mt-2 text-sm">
              Para usar esta función, por favor permita el acceso a la ubicación en la configuración de su navegador.
            </p>
          </div>
        )}

        {activeTab === "map" && (
          <div className="h-[calc(100vh-240px)] rounded-xl overflow-hidden shadow-2xl">
            {hasSelectedFilters && (
              <EnhancedLimaMap
                restaurants={restaurants}
                selectedRadius={selectedRadius}
                userLocation={userLocation}
                onRestaurantClick={handleRestaurantClick}
              />
            )}
          </div>
        )}

        {activeTab === "list" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto ${
                  actualTheme === 'dark' ? 'border-white' : 'border-gray-900'
                }`}></div>
                <p className={`mt-2 ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Cargando restaurantes...
                </p>
              </div>
            ) : error ? (
              <div className={`text-center py-8 ${
                actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`}>
                {error}
              </div>
            ) : filteredRestaurantsList.length === 0 ? (
              <div className={`text-center py-8 ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                No se encontraron restaurantes
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRestaurantsList.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    isFavorite={favorites.includes(restaurant.id)}
                    onFavoriteClick={toggleFavorite}
                    onRestaurantClick={handleRestaurantClick}
                    onEditClick={handleEditClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className={`p-6 rounded-xl shadow-sm border transition-colors duration-300 ${
            actualTheme === 'dark'
              ? 'bg-gray-800/80 backdrop-blur-md border-gray-700'
              : 'bg-white/80 backdrop-blur-md border-gray-100'
          }`}>
            <div className="flex flex-col items-center space-y-4">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <User size={40} className={actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-400'} />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold">Usuario</h2>
                <p className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  usuario@example.com
                </p>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <div className={`flex justify-between py-3 border-b ${
                actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <span className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  Lugares Favoritos
                </span>
                <span className="font-medium">{favorites.length}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Akipe Button */}
      <button
        onClick={() => setShowAkipeModal(true)}
        className={`fixed right-4 bottom-20 z-50 p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 border-0 ${
          actualTheme === 'dark'
            ? 'bg-gray-700 text-white hover:bg-gray-600'
            : 'bg-black text-white hover:bg-gray-800'
        }`}
      >
        <Navigation size={24} />
        <span className="font-medium">Akipe</span>
      </button>

      {/* Navigation Tabs */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t shadow-lg transition-colors duration-300 ${
        actualTheme === 'dark'
          ? 'border-gray-700 bg-gray-800/95 backdrop-blur-md'
          : 'border-gray-200 bg-white/95 backdrop-blur-md'
      }`}>
        <div className="max-w-screen-xl mx-auto flex justify-around py-3 px-4">
          {[
            { id: "map", label: "Mapa", icon: <MapPin size={24} /> },
            { id: "list", label: "Lista", icon: <List size={24} /> },
            { id: "discounts", label: "Ofertas", icon: <Tag size={24} /> },
            { id: "profile", label: "Perfil", icon: <User size={24} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 min-w-[64px] ${
                activeTab === tab.id
                  ? actualTheme === 'dark'
                    ? 'text-white bg-gray-700'
                    : 'text-black bg-gray-100'
                  : actualTheme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              aria-label={tab.label}
            >
              {tab.icon}
              <span className="text-xs mt-1.5 font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modals */}
      {showAkipeModal && (
        <AkipeModal
          onClose={() => setShowAkipeModal(false)}
          onSelect={(radius, groupType) => {
          setSelectedRadius(radius);
          setSelectedGroupType(groupType);
          setHasSelectedFilters(true);
          setActiveTab("map");
          setShowAkipeModal(false);
          }}
        />
      )}

      {showAddModal && (
        <AddRestaurantModal
          onClose={() => setShowAddModal(false)}
          onSubmit={async (newRestaurant) => {
            await addRestaurant(newRestaurant);
            setShowAddModal(false);
          }}
        />
      )}

      {editingRestaurant && (
        <EditRestaurantModal
          restaurant={editingRestaurant}
          onClose={() => setEditingRestaurant(null)}
          onSubmit={handleEditSubmit}
        />
      )}

      {showRouteModal && selectedRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-xl max-w-sm w-full mx-4 shadow-2xl ${
            actualTheme === 'dark'
              ? 'bg-gray-800 text-white'
              : 'bg-white text-black'
          }`}>
            <h3 className="text-lg font-semibold mb-4">¿Cómo quieres llegar a {selectedRestaurant.name}?</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      selectedRestaurant.address + ', ' + selectedRestaurant.district + ', Lima, Peru'
                    )}&travelmode=walking`,
                    '_blank'
                  );
                  setShowRouteModal(false);
                }}
                className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                🚶 Ir caminando
              </button>
              <button
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      selectedRestaurant.address + ', ' + selectedRestaurant.district + ', Lima, Peru'
                    )}&travelmode=driving`,
                    '_blank'
                  );
                  setShowRouteModal(false);
                }}
                className={`w-full px-4 py-3 rounded-lg hover:opacity-90 transition-colors ${
                  actualTheme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'
                }`}
              >
                🚗 Ir en auto
              </button>
              <button
                onClick={() => setShowRouteModal(false)}
                className={`w-full px-4 py-3 transition-colors ${
                  actualTheme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  return (
    <ThemeProvider>
      <HomeContent />
    </ThemeProvider>
  );
}
