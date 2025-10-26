"use client";

import React, { useState, useEffect } from "react";
import { MapPin, List, Tag, User, Navigation, Plus, Search, X } from "lucide-react";
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
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [travelMode, setTravelMode] = useState<'walking' | 'driving' | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [showFloatingControls, setShowFloatingControls] = useState(true);
  const [mapMovedRecently, setMapMovedRecently] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

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

  // Auto-hide floating controls only when map is moved by user
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;

    const handleMapInteraction = () => {
      setShowFloatingControls(true);
      setMapMovedRecently(true);
      setHasUserInteracted(true);

      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        setShowFloatingControls(false);
        setMapMovedRecently(false);
      }, 3000);
    };

    window.addEventListener('mapInteraction', handleMapInteraction);

    return () => {
      window.removeEventListener('mapInteraction', handleMapInteraction);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  const handleShowControls = () => {
    setShowFloatingControls(true);
    setMapMovedRecently(false);
    setHasUserInteracted(true);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      actualTheme === 'dark'
        ? 'bg-gray-900 text-white'
        : 'bg-white text-black'
    } font-sans relative overflow-hidden`}>
      {/* Full Screen Map */}
      <div className="absolute inset-0">
        {hasSelectedFilters && (
          <EnhancedLimaMap
            restaurants={restaurants}
            selectedRadius={selectedRadius}
            userLocation={userLocation}
            onRestaurantClick={handleRestaurantClick}
          />
        )}
      </div>

      {/* Floating Title */}
      <div className={`absolute top-0 left-0 right-0 z-40 transition-all duration-500 ${
        showFloatingControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className={`p-6 backdrop-blur-xl transition-colors duration-300 ${
          actualTheme === 'dark'
            ? 'bg-gray-900/60'
            : 'bg-white/60'
        }`}>
          <h1 className="text-3xl font-bold tracking-tight text-center">
            Descubre con Akipe
          </h1>
        </div>
      </div>

      {/* Floating Search Bar */}
      <div className={`absolute top-20 left-4 right-4 z-30 transition-all duration-500 ${
        showFloatingControls ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'
      }`}>
        <div className="flex gap-2">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onRestaurantSelect={handleRestaurantClick}
            getSearchSuggestions={getSearchSuggestions}
            userLocation={userLocation}
            onLocationRequest={handleLocationRequest}
            onShowDirections={(restaurant) => {
              setSelectedRestaurant(restaurant);
              setShowDirectionsModal(true);
            }}
          />

          {/* Add Restaurant Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className={`p-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 border-0 backdrop-blur-xl ${
              actualTheme === 'dark'
                ? 'bg-gray-800/80 text-white hover:bg-gray-700/90'
                : 'bg-white/80 text-black hover:bg-white/90'
            }`}
            aria-label="Agregar restaurante"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Floating Theme Toggle */}
      <div className={`absolute top-4 right-4 z-50 transition-all duration-500 ${
        showFloatingControls ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        <ThemeToggle />
      </div>

      {/* Floating Akipe Button */}
      <button
        onClick={() => setShowAkipeModal(true)}
        className={`fixed right-4 bottom-24 z-50 p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-500 flex items-center space-x-2 border-0 backdrop-blur-xl ${
          actualTheme === 'dark'
            ? 'bg-gray-800/80 text-white hover:bg-gray-700/90'
            : 'bg-white/80 text-black hover:bg-white/90'
        } ${showFloatingControls ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}
      >
        <Navigation size={24} />
        <span className="font-medium">Akipe</span>
      </button>

      {/* Tap to Show Controls */}
      {!showFloatingControls && hasUserInteracted && (
        <button
          onClick={handleShowControls}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-black/20 backdrop-blur-md text-white shadow-lg hover:bg-black/30 transition-all duration-300"
          aria-label="Mostrar controles"
        >
          <Search size={24} />
        </button>
      )}

      {/* Restaurant List Tab */}
      {activeTab === "list" && (
        <div className={`absolute inset-0 z-50 transition-all duration-500 ${
          actualTheme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'
        } backdrop-blur-xl`}>
          <div className="p-4 h-full overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Restaurantes</h2>
              <button
                onClick={() => setActiveTab("map")}
                className={`p-2 rounded-full transition-all duration-300 ${
                  actualTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'
                }`}
              >
                <X size={20} />
              </button>
            </div>

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
        </div>
      )}

      {/* Translucent Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-500 ${
        actualTheme === 'dark'
          ? 'bg-gray-900/80 backdrop-blur-xl border-gray-700/50'
          : 'bg-white/80 backdrop-blur-xl border-gray-200/50'
      } ${showFloatingControls ? 'translate-y-0' : 'translate-y-full'}`}>
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
