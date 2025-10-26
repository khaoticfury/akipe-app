"use client";

import React, { useState, useEffect } from "react";
import { MapPin, List, Tag, User, Navigation, Plus, Search } from "lucide-react";
import { Restaurant } from "../types/restaurant";
import { useRestaurants } from "../hooks/useRestaurants";
import RestaurantCard from "../components/RestaurantCard";
import AkipeModal from "../components/AkipeModal";
import AddRestaurantModal from "../components/AddRestaurantModal";
import EditRestaurantModal from "../components/EditRestaurantModal";
import LimaMap from "../components/LimaMap";

export default function Home() {
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

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col">
      <header className="p-4 border-b border-gray-200 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-center tracking-tight">
          Descubre con Akipe
        </h1>
      </header>

      <main className="flex-1 p-4 pb-20 overflow-auto bg-gray-50">
        {/* Enhanced Search Bar with Add Button */}
        <div className="relative w-full flex gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar restaurantes en Lima..."
              className="w-full p-4 pr-12 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-4 top-4 text-gray-400" size={20} />

            {/* Search Suggestions */}
            {searchQuery.length > 1 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                {getSearchSuggestions(searchQuery).map((restaurant) => (
                  <button
                    key={restaurant.id}
                    onClick={() => {
                      setSearchQuery(restaurant.name);
                      handleRestaurantClick(restaurant);
                    }}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{restaurant.name}</div>
                    <div className="text-sm text-gray-600">
                      {restaurant.type_of_cuisine} • {restaurant.district}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Restaurant Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="p-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
            aria-label="Agregar restaurante"
          >
            <Plus size={20} />
          </button>
        </div>

        {geoError && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-center">
            {geoError}
            <p className="mt-2 text-sm text-red-600">
              Para usar esta función, por favor permita el acceso a la ubicación en la configuración de su navegador.
            </p>
          </div>
        )}

        {activeTab === "map" && (
          <div className="h-[calc(100vh-240px)] bg-gray-100 rounded-lg overflow-hidden shadow-inner">
        {hasSelectedFilters && (
          <LimaMap
            restaurants={restaurants}
            selectedRadius={selectedRadius}
            userLocation={userLocation}
          />
        )}
          </div>
        )}

        {activeTab === "list" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando restaurantes...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                {error}
              </div>
            ) : filteredRestaurantsList.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
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
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={40} className="text-gray-400" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold">Usuario</h2>
                <p className="text-gray-600">usuario@example.com</p>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Lugares Favoritos</span>
                <span className="font-medium">{favorites.length}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Akipe Button */}
      <button
        onClick={() => setShowAkipeModal(true)}
        className="fixed right-4 bottom-20 z-50 bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
      >
        <Navigation size={24} />
        <span className="font-medium">Akipe</span>
      </button>

      {/* Navigation Tabs */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white shadow-lg">
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
              className={`flex flex-col items-center p-2 rounded-lg transition-colors min-w-[64px] ${
                activeTab === tab.id
                  ? "text-black bg-gray-100"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
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
          <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
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
                className="w-full px-4 py-3 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-colors"
              >
                🚗 Ir en auto
              </button>
              <button
                onClick={() => setShowRouteModal(false)}
                className="w-full px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
