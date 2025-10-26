"use client";

import React, { useState, useEffect } from "react";
import { MapPin, List, Tag, Navigation, Plus, Search, X } from "lucide-react";
import { Restaurant } from "../types/restaurant";
import { useRestaurants } from "../hooks/useRestaurants";
import { useLocation } from "../hooks/useLocation";
import { useFloatingControls } from "../hooks/useFloatingControls";
import { useRestaurantFilters } from "../hooks/useRestaurantFilters";
import RestaurantCard from "../components/RestaurantCard";
import AkipeModal from "../components/AkipeModal";
import AddRestaurantModal from "../components/AddRestaurantModal";
import EditRestaurantModal from "../components/EditRestaurantModal";
import EnhancedLimaMap from "../components/EnhancedLimaMap";
import SearchBar from "../components/SearchBar";
import ThemeToggle from "../components/ThemeToggle";
import Profile from "../components/Profile";
import NavigationModal from "../components/NavigationModal";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { EmptyState } from "../components/ui/EmptyState";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

const HomeContent: React.FC = () => {
  console.log("Env Google Maps API Key in page.tsx:", 'AIzaSyBqTXBlDlviimIzwCGoOtda0tVI9h5Matg');
  const [activeTab, setActiveTab] = useState("map");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showAkipeModal, setShowAkipeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [selectedGroupType, setSelectedGroupType] = useState<string | null>(null);
  const [hasSelectedFilters, setHasSelectedFilters] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [travelMode, setTravelMode] = useState<'walking' | 'driving' | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const { actualTheme } = useTheme();
  const {
    userLocation,
    geoError,
    isLoading: locationLoading,
    requestLocation,
    updateLocation,
    setAddressLocation,
    clearFixedLocation,
    fixedLocation,
    locationSource
  } = useLocation();
  const { showFloatingControls, mapMovedRecently, hasUserInteracted, handleShowControls, isUserInteracting } = useFloatingControls();

  // Request location on component mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Auto-refresh restaurant list when filters or location change
  useEffect(() => {
    if (userLocation && (selectedRadius || selectedGroupType || searchQuery)) {
      console.log("Filters or location changed, updating restaurant list...");
    }
  }, [userLocation, selectedRadius, selectedGroupType, searchQuery]);

  const handleRestaurantClick = (restaurant: Restaurant) => {
    console.log("Restaurant clicked:", restaurant.name);
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
    setSelectedRestaurant(null);
    if (selectedRestaurant) {
      setShowNavigationModal(true);
    }
  };

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

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleEditClick = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
  };

  const handleDirectionClick = (mode: 'walking' | 'driving') => {
    if (selectedRestaurant) {
      setTravelMode(mode);
      setShowNavigationModal(true);
    }
  };

  const handleEditSubmit = async (updatedRestaurant: Restaurant) => {
    // updateRestaurant is not available, so this function needs to be adjusted or removed
    // For now, just close the editing modal
    setEditingRestaurant(null);
  };

  // Use restaurants from useRestaurants hook - it already handles all filtering
  const displayRestaurants = restaurants;

  // Transform userLocation to match expected formats for different components
  const mapUserLocation = userLocation; // EnhancedLimaMap expects latitude/longitude format

  const searchBarUserLocation = userLocation; // SearchBar expects latitude/longitude format

  // Transform fixedLocation to match expected format for EnhancedLimaMap
  const mapFixedLocation = fixedLocation ? {
    lat: fixedLocation.latitude,
    lng: fixedLocation.longitude
  } : null;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      actualTheme === 'dark'
        ? 'bg-gray-900 text-white'
        : 'bg-white text-black'
    } font-sans relative overflow-hidden`}>
      {/* Full Screen Map */}
      {activeTab === "map" && (
        <div className="absolute inset-0">
          <EnhancedLimaMap
            restaurants={displayRestaurants}
            selectedRadius={selectedRadius}
            userLocation={mapUserLocation}
            onRestaurantClick={handleRestaurantClick}
            fixedLocation={mapFixedLocation}
            locationSource={locationSource}
          />
        </div>
      )}

      {/* Full Width Title */}
      <div className="absolute top-0 left-0 right-0 z-40">
        <div className={`w-full px-6 py-4 pr-20 backdrop-blur-xl transition-colors duration-300 ${
          actualTheme === 'dark'
            ? 'bg-gray-900/70'
            : 'bg-white/70'
        }`}>
          <h1 className="text-3xl font-bold tracking-tight text-center">
            Descubre con Akipe
          </h1>
        </div>
      </div>

      {/* Floating Search Bar */}
      <div className={`absolute top-20 left-4 right-4 z-30 transition-all duration-700 ${
        showFloatingControls ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'
      } ${!showFloatingControls && hasUserInteracted ? 'animate-pulse' : ''}`}>
        <div className="flex gap-2">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onRestaurantSelect={handleRestaurantClick}
            getSearchSuggestions={getSearchSuggestions}
            userLocation={searchBarUserLocation}
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
                ? 'bg-gray-800/90 text-white hover:bg-gray-700/95'
                : 'bg-white/90 text-black hover:bg-white/95'
            }`}
            aria-label="Agregar restaurante"
          >
            <Plus size={20} className={actualTheme === 'dark' ? 'text-white' : 'text-black'} />
          </button>


        </div>
      </div>

      {/* Floating Theme Toggle */}
      <div className={`absolute top-4 right-4 z-50 transition-all duration-700 ${
        showFloatingControls ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${!showFloatingControls && hasUserInteracted ? 'animate-pulse' : ''}`}>
        <div className={`p-1 rounded-2xl backdrop-blur-xl ${
          actualTheme === 'dark' ? 'bg-gray-800/60' : 'bg-white/60'
        }`}>
          <ThemeToggle />
        </div>
      </div>

      {/* Floating Akipe Button */}
      <button
        onClick={() => setShowAkipeModal(true)}
        className={`fixed right-4 bottom-24 z-50 p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-700 flex items-center space-x-2 border-0 backdrop-blur-xl ${
          actualTheme === 'dark'
            ? 'bg-gray-800/90 text-white hover:bg-gray-700/95'
            : 'bg-white/90 text-black hover:bg-white/95'
        } ${showFloatingControls ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'} ${!showFloatingControls && hasUserInteracted ? 'animate-pulse' : ''}`}
      >
        <Navigation size={24} className="text-white" />
        <span className="font-medium">Akipe</span>
      </button>



      {/* Interaction Status Indicator */}
      {isUserInteracting && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-blue-500/90 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg animate-pulse border border-white/20">
            🖱️ Interactuando con el mapa...
          </div>
        </div>
      )}

      {/* Tap to Show Controls */}
      {!showFloatingControls && hasUserInteracted && !isUserInteracting && (
        <button
          onClick={handleShowControls}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-black/40 backdrop-blur-md text-white shadow-lg hover:bg-black/50 transition-all duration-300 border border-white/20"
          aria-label="Mostrar controles"
        >
        <Search size={24} className="text-white" />
        </button>
      )}

      {/* Restaurant List Tab */}
      {activeTab === "list" && (
        <div className={`absolute inset-0 z-50 transition-all duration-500 ${
          actualTheme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'
        } backdrop-blur-xl`}>
          <div className="p-4 h-full overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Restaurantes</h2>
                <div className="flex items-center gap-2 mt-1">
                  {selectedRadius && (
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      actualTheme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-800'
                    }`}>
                      📍 {selectedRadius}km
                    </span>
                  )}
                  {selectedGroupType && (
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      actualTheme === 'dark' ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-800'
                    }`}>
                      👥 {selectedGroupType}
                    </span>
                  )}
                  {searchQuery && (
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      actualTheme === 'dark' ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-800'
                    }`}>
                      🔍 {searchQuery}
                    </span>
                  )}
                  <span className={`text-sm ${
                    actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {displayRestaurants.length} restaurante{displayRestaurants.length !== 1 ? 's' : ''} encontrado{displayRestaurants.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("map")}
                className={`p-2 rounded-full transition-all duration-300 shadow-md ${
                  actualTheme === 'dark' ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'
                }`}
              >
                <X size={20} className={actualTheme === 'dark' ? 'text-white' : 'text-black'} />
              </button>
            </div>

            {locationLoading || loading ? (
              <LoadingSpinner message="Cargando restaurantes..." />
            ) : geoError || error ? (
              <ErrorMessage
                message={geoError || error || "Error al cargar restaurantes"}
                onRetry={() => {
                  requestLocation();
                  window.location.reload();
                }}
              />
            ) : displayRestaurants.length === 0 ? (
              <EmptyState
                title="No se encontraron restaurantes"
                message="No hay restaurantes disponibles en tu área o que coincidan con tus filtros. Intenta ajustar tu búsqueda o ubicación."
                icon="map"
                action={{
                  label: "Agregar restaurante",
                  onClick: () => setShowAddModal(true)
                }}
              />
            ) : (
              <div className="space-y-4">
                {displayRestaurants.map((restaurant) => (
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
      <nav className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-700 ${
        actualTheme === 'dark'
          ? 'bg-gray-900/90 backdrop-blur-xl border-gray-700/50'
          : 'bg-white/90 backdrop-blur-xl border-gray-200/50'
      } ${showFloatingControls ? 'translate-y-0' : 'translate-y-full'} ${!showFloatingControls && hasUserInteracted ? 'animate-pulse' : ''}`}>
        <div className="max-w-screen-xl mx-auto flex justify-around py-3 px-4">
          {[
            { id: "map", label: "Mapa", icon: <MapPin size={24} className={actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} /> },
            { id: "list", label: "Lista", icon: <List size={24} className={actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} /> },
            { id: "discounts", label: "Ofertas", icon: <Tag size={24} className={actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} /> },
            { id: "profile", label: "Perfil", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "profile") {
                  setShowProfile(true);
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 min-w-[64px] ${
                activeTab === tab.id
                  ? actualTheme === 'dark'
                    ? 'text-white bg-gray-700 shadow-md'
                    : 'text-black bg-gray-100 shadow-md'
                  : actualTheme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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

      {showDirectionsModal && selectedRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`p-6 rounded-xl max-w-sm w-full shadow-2xl ${
            actualTheme === 'dark'
              ? 'bg-gray-800 text-white'
              : 'bg-white text-black'
          }`}>
            <h3 className="text-lg font-semibold mb-4">¿Cómo quieres llegar a {selectedRestaurant.name}?</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleSelectTravelMode('walking')}
                className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 11.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zM9 13.5A5.5 5.5 0 0 0 3.5 19h11A5.5 5.5 0 0 0 9 13.5z"/>
                  <path d="M14 8.5v-1a2 2 0 0 0-4 0v1"/>
                  <path d="M8 12v4"/>
                  <path d="M16 12v4"/>
                  <path d="M7 18h10"/>
                </svg>
                <span>Ir caminando</span>
              </button>
              <button
                onClick={() => handleSelectTravelMode('driving')}
                className={`w-full px-4 py-3 rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2 shadow-md ${
                  actualTheme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-black hover:bg-gray-300'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 17h2v2H5v-2zm14-2h2v4h-2v-4zM3 19h2v2H3v-2zm14-2h4v2h-4v-2zm-6-8h8v2h-8V9zm0 4h8v2h-8v-2zm0 4h4v2h-4v-2z"/>
                  <circle cx="7" cy="17" r="2"/>
                  <circle cx="17" cy="17" r="2"/>
                </svg>
                <span>Ir en auto</span>
              </button>
              <button
                onClick={() => setShowDirectionsModal(false)}
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

      {showNavigationModal && selectedRestaurant && travelMode && (
        <NavigationModal
          restaurant={selectedRestaurant}
          travelMode={travelMode}
          onClose={() => setShowNavigationModal(false)}
          userLocation={searchBarUserLocation}
        />
      )}

      {showProfile && (
        <Profile onClose={() => setShowProfile(false)} />
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
