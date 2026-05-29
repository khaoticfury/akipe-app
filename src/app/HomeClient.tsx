"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Compass,
  Heart,
  Menu,
  Navigation,
  Plus,
  User,
  X,
  Star,
  Footprints,
  Car,
  List,
  Gift,
  SlidersHorizontal,
  ChevronRight,
  Search,
} from "lucide-react";
import { Restaurant } from "../types/restaurant";
import { useRestaurants } from "../hooks/useRestaurants";
import { useLocation } from "../hooks/useLocation";
import AkipeModal from "../components/AkipeModal";
import AddRestaurantModal from "../components/AddRestaurantModal";
import EditRestaurantModal from "../components/EditRestaurantModal";
import EnhancedLimaMap from "../components/EnhancedLimaMap";
import SearchBar from "../components/SearchBar";
import ThemeToggle from "../components/ThemeToggle";
import Profile from "../components/Profile";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { EmptyState } from "../components/ui/EmptyState";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

const getRestaurantImage = (restaurant: Restaurant | null) => {
  if (!restaurant) return "";

  const rawRestaurant = restaurant as any;

  const googlePhoto =
    rawRestaurant.image_url ||
    rawRestaurant.imageUrl ||
    rawRestaurant.photo_url ||
    rawRestaurant.photoUrl ||
    rawRestaurant.google_photo_url ||
    rawRestaurant.googlePhotoUrl ||
    rawRestaurant.photos?.[0]?.url ||
    rawRestaurant.photos?.[0]?.photo_url;

  if (googlePhoto) return googlePhoto;

  const cuisine = `${restaurant.type_of_cuisine || ""} ${restaurant.category || ""} ${restaurant.name || ""}`.toLowerCase();

  // Fallback visual para que Lista/Favoritos no queden sin imagen.
  // Si Google Places trae foto, se usa arriba. Si no, usamos imágenes genéricas por tipo.
  if (cuisine.includes("cafe") || cuisine.includes("cafetería") || cuisine.includes("coffee")) {
    return "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80";
  }

  if (cuisine.includes("bar") || cuisine.includes("cocktail")) {
    return "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=80";
  }

  if (cuisine.includes("sushi") || cuisine.includes("nikkei") || cuisine.includes("japonesa")) {
    return "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80";
  }

  if (cuisine.includes("pizza") || cuisine.includes("italiana") || cuisine.includes("pasta")) {
    return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";
  }

  if (cuisine.includes("poll") || cuisine.includes("parrilla") || cuisine.includes("grill")) {
    return "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80";
  }

  return "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80";
};

const getRestaurantRating = (restaurant: Restaurant | null) => {
  if (!restaurant?.rating || restaurant.rating <= 0) return null;
  return restaurant.rating.toFixed(1);
};

const getCuisineLabel = (restaurant: Restaurant | null) => {
  if (!restaurant) return "Restaurante";
  return restaurant.type_of_cuisine || "Restaurante";
};

const getRestaurantDescription = (restaurant: Restaurant) => {
  const rawRestaurant = restaurant as any;

  const summary =
    rawRestaurant.editorial_summary?.overview ||
    rawRestaurant.review_summary ||
    rawRestaurant.reviewSummary ||
    rawRestaurant.description ||
    rawRestaurant.comment ||
    rawRestaurant.vicinity;

  if (summary) {
    return String(summary);
  }

  const rating = restaurant.rating ? `${restaurant.rating.toFixed(1)} estrellas` : "";
  const reviews = rawRestaurant.user_ratings_total
    ? `${rawRestaurant.user_ratings_total} opiniones en Google`
    : "";
  const cuisine = restaurant.type_of_cuisine || "Restaurante";
  const address = restaurant.address || "";

  const parts = [cuisine, rating, reviews, address].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" · ");
  }

  return "Toca para ver reviews, fotos y más detalles del lugar.";
};

const getDistanceMeters = (
  from: { latitude: number; longitude: number },
  restaurant: Restaurant
) => {
  const to = {
    latitude: restaurant.gps_coordinates.latitude,
    longitude: restaurant.gps_coordinates.longitude,
  };

  const R = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const formatDistance = (meters: number) => {
  if (!Number.isFinite(meters)) return "";

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
};

const FerxxoGhostIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path
      d="M7 25V13.4C7 7.9 10.8 4 16 4s9 3.9 9 9.4V25c0 1.6-1.7 2.6-3.1 1.7l-1.4-.9c-.6-.4-1.3-.4-1.9 0l-1.4.9c-.7.4-1.5.4-2.2 0l-1.4-.9c-.6-.4-1.3-.4-1.9 0l-1.4.9C8.7 27.6 7 26.6 7 25Z"
      fill="currentColor"
    />
    <circle cx="13" cy="14" r="1.7" fill="#06130F" />
    <circle cx="19" cy="14" r="1.7" fill="#06130F" />
    <path d="M12.8 20c1.7 1.2 4.7 1.2 6.4 0" stroke="#06130F" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);


const HomeContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"map" | "list" | "saved">("map");
  const [isMapExploring, setIsMapExploring] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showAkipeModal, setShowAkipeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hideSearchBar, setHideSearchBar] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [selectedGroupType, setSelectedGroupType] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [routeRestaurant, setRouteRestaurant] = useState<Restaurant | null>(null);
  const [travelMode, setTravelMode] = useState<"walking" | "driving" | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showMenuOptions, setShowMenuOptions] = useState(false);
  const [mapNearbyRestaurants, setMapNearbyRestaurants] = useState<Restaurant[]>([]);
  const [isMapRestaurantPopupOpen, setIsMapRestaurantPopupOpen] = useState(false);
  const [isMapRoutePillOpen, setIsMapRoutePillOpen] = useState(false);

  const { actualTheme } = useTheme();
  const isDark = actualTheme === "dark";
  const isFerxxo = actualTheme === "ferxxo";

  const {
    userLocation,
    geoError,
    isLoading: locationLoading,
    requestLocation,
    fixedLocation,
    locationSource,
  } = useLocation();

  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout>;

    const handleMapInteractionStart = () => {
      clearTimeout(hideTimeout);
      setIsMapExploring(true);
    };

    const handleMapInteractionEnd = () => {
      clearTimeout(hideTimeout);

      hideTimeout = setTimeout(() => {
        setIsMapExploring(false);
      }, 900);
    };

    window.addEventListener("mapInteractionStart", handleMapInteractionStart);
    window.addEventListener("mapInteractionEnd", handleMapInteractionEnd);

    return () => {
      clearTimeout(hideTimeout);
      window.removeEventListener("mapInteractionStart", handleMapInteractionStart);
      window.removeEventListener("mapInteractionEnd", handleMapInteractionEnd);
    };
  }, []);

  useEffect(() => {
    const handleRestaurantPopupStateChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ open: boolean }>;
      setIsMapRestaurantPopupOpen(Boolean(customEvent.detail?.open));
    };

    const handleRoutePillStateChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ open: boolean }>;
      setIsMapRoutePillOpen(Boolean(customEvent.detail?.open));
    };

    window.addEventListener(
      "restaurantPopupStateChange",
      handleRestaurantPopupStateChange as EventListener
    );

    window.addEventListener(
      "routePillStateChange",
      handleRoutePillStateChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "restaurantPopupStateChange",
        handleRestaurantPopupStateChange as EventListener
      );

      window.removeEventListener(
        "routePillStateChange",
        handleRoutePillStateChange as EventListener
      );
    };
  }, []);

  useEffect(() => {
    const handleNearbyRestaurantsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ restaurants: Restaurant[] }>;
      const incomingRestaurants = customEvent.detail?.restaurants || [];

      setMapNearbyRestaurants((currentRestaurants) => {
        const mergedRestaurants = new Map<string, Restaurant>();

        currentRestaurants.forEach((restaurant) => {
          mergedRestaurants.set(restaurant.id, restaurant);
        });

        incomingRestaurants.forEach((restaurant) => {
          mergedRestaurants.set(restaurant.id, restaurant);
        });

        return Array.from(mergedRestaurants.values());
      });
    };

    window.addEventListener(
      "nearbyRestaurantsUpdate",
      handleNearbyRestaurantsUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "nearbyRestaurantsUpdate",
        handleNearbyRestaurantsUpdate as EventListener
      );
    };
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const {
    restaurants,
    loading,
    error,
    getSearchSuggestions,
    addRestaurant,
  } = useRestaurants({
    searchQuery,
    selectedRadius: selectedRadius || undefined,
    userLocation: userLocation || undefined,
    groupType: selectedGroupType || undefined,
  });

  const allKnownRestaurants = useMemo(() => {
    const mergedRestaurants = new Map<string, Restaurant>();

    restaurants.forEach((restaurant) => {
      mergedRestaurants.set(restaurant.id, restaurant);
    });

    mapNearbyRestaurants.forEach((restaurant) => {
      mergedRestaurants.set(restaurant.id, restaurant);
    });

    return Array.from(mergedRestaurants.values());
  }, [restaurants, mapNearbyRestaurants]);

  const sortRestaurantsByDistance = (restaurantList: Restaurant[]) => {
    if (!userLocation) return restaurantList;

    return [...restaurantList].sort(
      (a, b) => getDistanceMeters(userLocation, a) - getDistanceMeters(userLocation, b)
    );
  };

  const displayRestaurants = allKnownRestaurants;

  const savedRestaurants = useMemo(
    () =>
      sortRestaurantsByDistance(
        allKnownRestaurants.filter((restaurant) => favorites.includes(restaurant.id))
      ),
    [allKnownRestaurants, favorites, userLocation]
  );

  const nearbyRestaurants = useMemo(
    () => sortRestaurantsByDistance(allKnownRestaurants),
    [allKnownRestaurants, userLocation]
  );

  const mapFixedLocation = fixedLocation
    ? {
        lat: fixedLocation.latitude,
        lng: fixedLocation.longitude,
      }
    : null;

  const popupImage = getRestaurantImage(selectedRestaurant);
  const popupRating = getRestaurantRating(selectedRestaurant);
  const isSelectedFavorite = selectedRestaurant
    ? favorites.includes(selectedRestaurant.id)
    : false;

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setShowMenuOptions(false);
    setSelectedRestaurant(restaurant);
    setHideSearchBar(true);
    setActiveTab("map");
  };

  const handleSelectTravelMode = (restaurant: Restaurant, mode: "walking" | "driving") => {
    setTravelMode(mode);
    setRouteRestaurant(restaurant);
    setSelectedRestaurant(null);
    setHideSearchBar(true);
    setActiveTab("map");
  };

  const openRestaurantReviews = (restaurant: Restaurant) => {
    const query = encodeURIComponent(
      `${restaurant.name} ${restaurant.address || ""} reviews`
    );

    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const renderAestheticRestaurantCard = (restaurant: Restaurant) => {
    const distanceLabel = userLocation
      ? formatDistance(getDistanceMeters(userLocation, restaurant))
      : "";

    const ratingLabel = getRestaurantRating(restaurant);
    const imageUrl = getRestaurantImage(restaurant);
    const isFavorite = favorites.includes(restaurant.id);
    const description = getRestaurantDescription(restaurant);

    return (
      <div
        key={restaurant.id}
        className={`group relative overflow-hidden rounded-[32px] border p-3 shadow-[0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur-2xl transition-all duration-300 active:scale-[0.99] ${
          isFerxxo
            ? "border-[#00FF66]/18 bg-[#092019]/76 text-[#E8FFF1] shadow-[0_0_28px_rgba(0,255,102,0.10),0_18px_45px_rgba(0,0,0,0.28)]"
            : isDark
            ? "border-white/10 bg-white/7 text-white"
            : "border-white/75 bg-white/82 text-slate-950"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
            isFerxxo
              ? "bg-gradient-to-br from-[#00FF66]/12 via-transparent to-[#00FF66]/4"
              : isDark
              ? "bg-gradient-to-br from-white/8 via-transparent to-blue-400/5"
              : "bg-gradient-to-br from-white/85 via-transparent to-slate-100/60"
          }`}
        />

        <div className="relative">
          <button
            type="button"
            onClick={() => openRestaurantReviews(restaurant)}
            className="relative block w-full overflow-hidden rounded-[26px] text-left"
            aria-label={`Ver reviews de ${restaurant.name}`}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={restaurant.name}
                className="h-40 w-full object-cover sm:h-48"
              />
            ) : (
              <div
                className={`flex h-40 w-full items-center justify-center text-5xl sm:h-48 ${
                  isFerxxo
                    ? "bg-[#00FF66]/10 text-[#00FF66]"
                    : isDark
                    ? "bg-white/10"
                    : "bg-slate-100"
                }`}
              >
                🍽️
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/72 via-black/28 to-transparent p-4">
              <h3 className="truncate font-serif text-[26px] font-semibold leading-tight text-white sm:text-[30px]">
                {restaurant.name}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-white/88">
                {ratingLabel && (
                  <>
                    <span className="flex items-center gap-0.5 text-[#FBBF24]">
                      {[0, 1, 2, 3, 4].map((item) => (
                        <Star
                          key={item}
                          size={13}
                          fill="currentColor"
                          strokeWidth={1.5}
                        />
                      ))}
                    </span>
                    <span>{ratingLabel}</span>
                    <span className="text-white/45">•</span>
                  </>
                )}

                <span>{getCuisineLabel(restaurant)}</span>

                {distanceLabel && (
                  <>
                    <span className="text-white/45">•</span>
                    <span>{distanceLabel}</span>
                  </>
                )}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toggleFavorite(restaurant.id)}
            className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-xl transition-all active:scale-95 ${
              isFavorite
                ? isFerxxo
                  ? "border-[#00FF66]/35 bg-[#00FF66]/20 text-[#00FF66]"
                  : "border-[#C79A5B]/35 bg-[#C79A5B]/20 text-[#C79A5B]"
                : "border-white/40 bg-black/20 text-white hover:bg-black/30"
            }`}
            aria-label={isFavorite ? "Quitar de favoritos" : "Guardar como favorito"}
          >
            <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
          </button>

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              {distanceLabel && (
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-[12px] font-bold ${
                    isFerxxo
                      ? "bg-[#00FF66] text-[#06130F]"
                      : isDark
                      ? "bg-white/10 text-white"
                      : "bg-slate-950 text-white"
                  }`}
                >
                  {distanceLabel}
                </span>
              )}

              <span
                className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                  isFerxxo
                    ? "bg-[#00FF66]/12 text-[#00FF66]"
                    : isDark
                    ? "bg-white/10 text-white/75"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {getCuisineLabel(restaurant)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => openRestaurantReviews(restaurant)}
              className={`mt-3 line-clamp-2 w-full text-left text-[13px] leading-relaxed ${
                isDark || isFerxxo ? "text-white/58" : "text-slate-600"
              }`}
              aria-label={`Ver reviews de ${restaurant.name}`}
            >
              {description}
            </button>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectTravelMode(restaurant, "walking")}
                className={`flex items-center justify-center gap-2 rounded-[22px] border px-3 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                  isFerxxo
                    ? "border-[#00FF66]/20 bg-[#00FF66]/10 text-[#00FF66] hover:bg-[#00FF66]/16"
                    : isDark
                    ? "border-white/10 bg-white/8 text-white hover:bg-white/12"
                    : "border-white/80 bg-white/70 text-slate-950 shadow-sm hover:bg-white"
                }`}
              >
                <Footprints size={18} />
                <span>Caminar</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTravelMode(restaurant, "driving")}
                className={`flex items-center justify-center gap-2 rounded-[22px] px-3 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                  isFerxxo
                    ? "bg-[#00FF66] text-[#06130F] shadow-[0_0_20px_rgba(0,255,102,0.30)]"
                    : "bg-slate-950 text-white shadow-sm hover:bg-black"
                }`}
              >
                <Car size={18} />
                <span>Auto</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleEditClick = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
  };

  const handleEditSubmit = async (_updatedRestaurant: Restaurant) => {
    setEditingRestaurant(null);
  };

  const closeRoute = () => {
    setRouteRestaurant(null);
    setTravelMode(null);
    setHideSearchBar(false);
  };

  const clearAkipeFilter = () => {
    setSelectedRadius(null);
    setSelectedGroupType(null);
    setShowAkipeModal(false);
  };

  const openSearchAgain = () => {
    setSelectedRestaurant(null);
    setHideSearchBar(false);
    setActiveTab("map");
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden font-sans transition-colors duration-300 ${
        isFerxxo
          ? "bg-[#06130F] text-[#E8FFF1]"
          : isDark
          ? "bg-slate-950 text-white"
          : "bg-white text-slate-950"
      }`}
    >
      {activeTab === "map" && (
        <div className="absolute inset-0">
          <EnhancedLimaMap
            restaurants={displayRestaurants}
            selectedRadius={selectedRadius}
            userLocation={userLocation}
            onRestaurantClick={handleRestaurantClick}
            fixedLocation={mapFixedLocation}
            locationSource={locationSource}
            routeRestaurant={routeRestaurant}
            travelMode={travelMode}
            onClearRoute={closeRoute}
            favoriteRestaurantIds={favorites}
            onFavoriteClick={toggleFavorite}
          />
        </div>
      )}

      {/* Top premium header, estilo opción A */}
      {activeTab === "map" && (
        <div
          className={`pointer-events-none absolute left-0 right-0 top-0 z-40 px-4 pt-4 transition-all duration-500 ${
            isMapExploring
              ? "-translate-y-28 opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          <div className="relative mx-auto max-w-[760px]">
            <div className="mb-5 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowMenuOptions((value) => !value)}
                className={`pointer-events-auto fixed left-3 top-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border backdrop-blur-2xl transition-all active:scale-95 ${
                  isFerxxo
                    ? "border-[#00FF66]/25 bg-[#092019]/72 text-[#DFFFF0] shadow-[0_0_30px_rgba(0,255,102,0.18),0_14px_38px_rgba(0,0,0,0.38)]"
                    : isDark
                    ? "border-white/10 bg-slate-950/45 text-white shadow-[0_14px_38px_rgba(0,0,0,0.35)]"
                    : "border-white/70 bg-white/58 text-slate-950 shadow-[0_14px_38px_rgba(15,23,42,0.16)]"
                }`}
                aria-label="Abrir menú"
              >
                <Menu size={23} />
              </button>

              <div
                className={`pointer-events-none rounded-full px-7 py-2 backdrop-blur-xl ${
                  isFerxxo ? "bg-[#00FF66]/8 shadow-[0_0_35px_rgba(0,255,102,0.14)]" : isDark ? "bg-slate-950/20" : "bg-white/18"
                }`}
              >
                <h1
                  className={`font-serif text-[38px] font-semibold leading-none tracking-tight ${
                    isFerxxo ? "text-[#E8FFF1] drop-shadow-[0_0_16px_rgba(0,255,102,0.32)]" : isDark ? "text-white" : "text-slate-950"
                  }`}
                >
                  Akipe
                </h1>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("map");
                  setSelectedRestaurant(null);
                  setHideSearchBar(false);
                }}
                className={`pointer-events-auto fixed right-3 top-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border backdrop-blur-2xl transition-all active:scale-95 ${
                  isFerxxo
                    ? "border-[#00FF66]/25 bg-[#092019]/72 text-[#DFFFF0] shadow-[0_0_30px_rgba(0,255,102,0.18),0_14px_38px_rgba(0,0,0,0.38)]"
                    : isDark
                    ? "border-white/10 bg-slate-950/45 text-white shadow-[0_14px_38px_rgba(0,0,0,0.35)]"
                    : "border-white/70 bg-white/58 text-slate-950 shadow-[0_14px_38px_rgba(15,23,42,0.16)]"
                }`}
                aria-label="Mostrar búsqueda"
              >
                <Search size={23} />
              </button>
            </div>

            {showMenuOptions && (
              <>
                <div
                  className="pointer-events-auto fixed inset-0 z-40"
                  onClick={() => setShowMenuOptions(false)}
                />

                <div
                  className={`pointer-events-auto fixed left-3 top-[78px] z-[60] w-[260px] animate-in fade-in slide-in-from-top-2 rounded-[28px] border p-2 shadow-[0_18px_55px_rgba(15,23,42,0.22)] backdrop-blur-2xl duration-200 ${
                    isFerxxo
                      ? "border-[#00FF66]/24 bg-[#092019]/86 text-[#E8FFF1]"
                      : isDark
                      ? "border-white/10 bg-slate-950/82 text-white"
                      : "border-white/75 bg-white/88 text-slate-950"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowAkipeModal(true);
                      setShowMenuOptions(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition-all ${
                      isFerxxo
                        ? "hover:bg-[#00FF66]/12"
                        : isDark
                        ? "hover:bg-white/10"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    <SlidersHorizontal size={19} />
                    <div className="min-w-0 flex-1">
                      <div>Filtros Akipe</div>
                      <div className={`text-xs font-normal ${isDark || isFerxxo ? "text-white/50" : "text-slate-500"}`}>
                        Radio, grupo y preferencias
                      </div>
                    </div>
                    <ChevronRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(true);
                      setShowMenuOptions(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition-all ${
                      isFerxxo
                        ? "hover:bg-[#00FF66]/12"
                        : isDark
                        ? "hover:bg-white/10"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    <Plus size={19} />
                    <div className="min-w-0 flex-1">
                      <div>Agregar restaurante</div>
                      <div className={`text-xs font-normal ${isDark || isFerxxo ? "text-white/50" : "text-slate-500"}`}>
                        Sugiere un nuevo lugar
                      </div>
                    </div>
                    <ChevronRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      alert("Próximamente: descuentos y beneficios Akipe.");
                      setShowMenuOptions(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition-all ${
                      isFerxxo
                        ? "hover:bg-[#00FF66]/12"
                        : isDark
                        ? "hover:bg-white/10"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    <Gift size={19} />
                    <div className="min-w-0 flex-1">
                      <div>Descuentos</div>
                      <div className={`text-xs font-normal ${isDark || isFerxxo ? "text-white/50" : "text-slate-500"}`}>
                        Beneficios y promociones
                      </div>
                    </div>
                    <ChevronRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfile(true);
                      setShowMenuOptions(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition-all ${
                      isFerxxo
                        ? "hover:bg-[#00FF66]/12"
                        : isDark
                        ? "hover:bg-white/10"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    <User size={19} />
                    <div className="min-w-0 flex-1">
                      <div>Perfil</div>
                      <div className={`text-xs font-normal ${isDark || isFerxxo ? "text-white/50" : "text-slate-500"}`}>
                        Preferencias y cuenta
                      </div>
                    </div>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}

            <div
              className={`pointer-events-auto rounded-[30px] border p-2 backdrop-blur-2xl transition-all duration-300 ${
                !hideSearchBar && !isMapExploring && !isMapRestaurantPopupOpen && !isMapRoutePillOpen
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-5 opacity-0 pointer-events-none"
              } ${
                isFerxxo
                  ? "border-[#00FF66]/24 bg-[#092019]/70 shadow-[0_0_32px_rgba(0,255,102,0.14),0_18px_50px_rgba(0,0,0,0.38)]"
                  : isDark
                  ? "border-white/10 bg-slate-950/50 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
                  : "border-white/75 bg-white/64 shadow-[0_18px_50px_rgba(15,23,42,0.16)]"
              }`}
            >
              <div className="flex gap-2">
                <SearchBar
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onRestaurantSelect={handleRestaurantClick}
                  getSearchSuggestions={getSearchSuggestions}
                  userLocation={userLocation}
                  onShowDirections={(restaurant, mode) => {
                    setSelectedRestaurant(null);
                    setRouteRestaurant(restaurant);
                    setTravelMode(mode);
                    setHideSearchBar(true);
                    setActiveTab("map");
                  }}
                />

                <button
                  onClick={() => setShowAddModal(true)}
                  className={`shrink-0 rounded-[24px] border p-4 backdrop-blur-xl transition-all duration-300 active:scale-95 ${
                    isFerxxo
                      ? "border-[#00FF66]/20 bg-[#00FF66]/10 text-[#00FF66] hover:bg-[#00FF66]/16"
                      : isDark
                      ? "border-white/10 bg-white/8 text-white hover:bg-white/12"
                      : "border-white/70 bg-white/70 text-slate-950 hover:bg-white"
                  }`}
                  aria-label="Agregar restaurante"
                >
                  <Plus size={21} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtro Akipe activo */}
      {activeTab === "map" && selectedRadius && !isMapExploring && (
        <div className="absolute left-1/2 top-[92px] z-40 -translate-x-1/2">
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-2xl backdrop-blur-2xl ${
              isFerxxo
                ? "border-[#00FF66]/25 bg-[#092019]/78 text-[#00FF66]"
                : isDark
                ? "border-white/10 bg-slate-950/65 text-white"
                : "border-white/75 bg-white/80 text-slate-800"
            }`}
          >
            <span>
              Radio: {selectedRadius < 1 ? `${selectedRadius * 1000} m` : `${selectedRadius} km`}
            </span>

            <button
              type="button"
              onClick={clearAkipeFilter}
              className={`rounded-full px-2 py-1 text-[11px] transition-all active:scale-95 ${
                isFerxxo
                  ? "bg-[#00FF66] text-[#06130F]"
                  : isDark
                  ? "bg-white/10 text-white hover:bg-white/15"
                  : "bg-slate-950 text-white hover:bg-black"
              }`}
              aria-label="Borrar filtro Akipe"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Botón pequeño para volver a buscar */}
      {hideSearchBar && activeTab === "map" && !isMapExploring && (
        <button
          onClick={openSearchAgain}
          className={`absolute left-4 top-24 z-40 rounded-full border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-2xl transition-all duration-300 active:scale-95 ${
            isDark
              ? "border-white/10 bg-slate-950/60 text-white hover:bg-slate-900/75"
              : "border-white/70 bg-white/75 text-slate-950 hover:bg-white"
          }`}
          aria-label="Volver a buscar"
        >
          🔍 Buscar
        </button>
      )}

      {/* Theme toggle flotante sutil */}
      <div
        className={`absolute right-4 top-4 z-50 transition-all duration-500 ${
          isMapExploring ? "translate-y-4 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
      >
        <div
          className={`rounded-2xl border p-1 backdrop-blur-2xl ${
            isFerxxo ? "border-[#00FF66]/20 bg-[#092019]/70 shadow-[0_0_24px_rgba(0,255,102,0.18)]" : isDark ? "border-white/10 bg-slate-950/45" : "border-white/70 bg-white/55"
          }`}
        >
          <ThemeToggle />
        </div>
      </div>

      {/* Popup premium estilo opción A para selección desde búsqueda/lista */}
      {selectedRestaurant && activeTab === "map" && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-50 w-[calc(100%-24px)] max-w-[500px] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-3 duration-200 sm:bottom-28">
          <div
            className={`pointer-events-auto relative overflow-hidden rounded-[28px] border p-3 shadow-[0_18px_55px_rgba(15,23,42,0.24)] sm:p-4 backdrop-blur-2xl ${
              isFerxxo
                ? "border-[#39FF74]/55 bg-[#07160F]/82 text-[#ECFFF3] shadow-[0_0_0_1px_rgba(57,255,116,0.18),0_0_34px_rgba(57,255,116,0.26),0_0_72px_rgba(0,255,102,0.14),0_22px_60px_rgba(0,0,0,0.45)]"
                : isDark
                ? "border-white/10 bg-slate-950/72 text-white"
                : "border-white/75 bg-white/70 text-slate-950"
            }`}
          >
            <div
              className={`pointer-events-none absolute inset-0 ${
                isFerxxo
                  ? "bg-[radial-gradient(circle_at_top_left,rgba(57,255,116,0.25),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(0,255,102,0.16),transparent_28%),linear-gradient(135deg,rgba(0,255,102,0.14),rgba(5,18,12,0.10)_38%,rgba(57,255,116,0.08))]"
                  : isDark
                  ? "bg-gradient-to-br from-white/8 via-cyan-300/5 to-blue-500/5"
                  : "bg-gradient-to-br from-white/80 via-white/35 to-white/10"
              }`}
            />

            {isFerxxo && (
              <>
                <div className="pointer-events-none absolute -left-12 top-0 h-28 w-28 rounded-full bg-[#00FF66]/14 blur-3xl" />
                <div className="pointer-events-none absolute -right-10 bottom-0 h-32 w-32 rounded-full bg-[#39FF74]/12 blur-3xl" />
              </>
            )}

            <div className="relative">
              <div className="mb-3 flex justify-center">
                <div
                  className={`h-1 w-10 rounded-full ${
                    isFerxxo
                      ? "bg-[#39FF74] shadow-[0_0_14px_rgba(57,255,116,0.75)]"
                      : isDark
                      ? "bg-white/20"
                      : "bg-slate-300/80"
                  }`}
                />
              </div>

              <div className="flex gap-4">
                {popupImage ? (
                  <img
                    src={popupImage}
                    alt={selectedRestaurant.name}
                    className={`h-20 w-20 shrink-0 rounded-2xl object-cover shadow-md sm:h-28 sm:w-28 sm:rounded-3xl ${
                      isFerxxo ? "ring-2 ring-[#39FF74]/45 shadow-[0_0_20px_rgba(57,255,116,0.20)]" : ""
                    }`}
                  />
                ) : (
                  <div
                    className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl sm:h-28 sm:w-28 sm:rounded-3xl shadow-md ${
                      isFerxxo
                        ? "bg-[linear-gradient(180deg,rgba(57,255,116,0.14),rgba(8,28,18,0.9))] ring-2 ring-[#39FF74]/45 shadow-[0_0_20px_rgba(57,255,116,0.20)]"
                        : isDark
                        ? "bg-white/10"
                        : "bg-slate-100"
                    }`}
                  >
                    <span className={isFerxxo ? "text-[#39FF74]" : ""}>
                      {isFerxxo ? <FerxxoGhostIcon size={40} /> : <span className="text-3xl">🍽️</span>}
                    </span>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className={`truncate font-serif text-[21px] font-semibold leading-tight sm:text-[27px] ${isFerxxo ? "text-[#F4FFF7] drop-shadow-[0_0_10px_rgba(57,255,116,0.20)]" : ""}`}>
                        {selectedRestaurant.name}
                      </h3>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px]">
                        {popupRating && (
                          <>
                            <span className={`flex items-center gap-0.5 ${isFerxxo ? "text-[#39FF74] drop-shadow-[0_0_8px_rgba(57,255,116,0.45)]" : "text-[#C79A5B]"}`}>
                              {[0, 1, 2, 3, 4].map((item) => (
                                <Star
                                  key={item}
                                  size={14}
                                  fill="currentColor"
                                  strokeWidth={1.5}
                                />
                              ))}
                            </span>

                            <span className={isFerxxo ? "text-[#D8FFE6]" : isDark ? "text-white/70" : "text-slate-600"}>
                              {popupRating}
                            </span>
                          </>
                        )}

                        <span className={isFerxxo ? "text-[#39FF74]/55" : isDark ? "text-white/45" : "text-slate-400"}>•</span>

                        <span className={isFerxxo ? "text-[#C7FCD8]" : isDark ? "text-white/70" : "text-slate-600"}>
                          {getCuisineLabel(selectedRestaurant)}
                        </span>
                      </div>

                      <p
                        className={`mt-2 line-clamp-2 text-[13px] ${
                          isFerxxo
                            ? "text-[#B6EFC8]"
                            : isDark
                            ? "text-white/58"
                            : "text-slate-600"
                        }`}
                      >
                        {selectedRestaurant.address || "Elige cómo quieres llegar."}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(selectedRestaurant.id)}
                        className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-xl transition-all active:scale-95 ${
                          isFerxxo
                            ? isSelectedFavorite
                              ? "border-[#39FF74]/60 bg-[#39FF74]/14 text-[#39FF74] shadow-[0_0_18px_rgba(57,255,116,0.25)]"
                              : "border-[#39FF74]/30 bg-[#39FF74]/10 text-[#D8FFE6] hover:bg-[#39FF74]/14"
                            : isSelectedFavorite
                            ? "border-[#C79A5B]/30 bg-[#C79A5B]/15 text-[#C79A5B]"
                            : isDark
                            ? "border-white/10 bg-white/8 text-white hover:bg-white/12"
                            : "border-white/70 bg-white/70 text-slate-900 hover:bg-white"
                        }`}
                        aria-label="Guardar restaurante"
                      >
                        <Heart
                          size={20}
                          fill={isSelectedFavorite ? "currentColor" : "none"}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRestaurant(null)}
                        className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-xl transition-all active:scale-95 ${
                          isFerxxo
                            ? "border-[#39FF74]/30 bg-[#39FF74]/10 text-[#E8FFF1] hover:bg-[#39FF74]/14"
                            : isDark
                            ? "border-white/10 bg-white/8 text-white hover:bg-white/12"
                            : "border-white/70 bg-white/70 text-slate-900 hover:bg-white"
                        }`}
                        aria-label="Cerrar popup"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectTravelMode(selectedRestaurant, "walking")}
                  className={`flex items-center justify-center gap-3 rounded-[24px] border px-4 py-3.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                    isFerxxo
                      ? "border-[#39FF74]/28 bg-[linear-gradient(180deg,rgba(57,255,116,0.10),rgba(8,28,18,0.82))] text-[#F2FFF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_18px_rgba(57,255,116,0.10)] hover:bg-[#39FF74]/12"
                      : isDark
                      ? "border-white/10 bg-white/8 text-white hover:bg-white/12"
                      : "border-white/80 bg-white/70 text-slate-950 shadow-sm hover:bg-white"
                  }`}
                >
                  <Footprints size={22} className={isFerxxo ? "text-[#39FF74]" : ""} />
                  <span className="text-left leading-tight">
                    <span className="block">Caminar</span>
                    <span
                      className={`text-xs font-medium ${
                        isFerxxo
                          ? "text-[#B6EFC8]"
                          : isDark
                          ? "text-white/55"
                          : "text-slate-500"
                      }`}
                    >
                      Ver ruta
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTravelMode(selectedRestaurant, "driving")}
                  className={`flex items-center justify-center gap-3 rounded-[24px] px-4 py-3.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                    isFerxxo
                      ? "bg-gradient-to-br from-[#39FF74] via-[#18F76A] to-[#00C853] text-[#04120A] shadow-[0_0_30px_rgba(57,255,116,0.42),0_12px_30px_rgba(0,0,0,0.28)]"
                      : "bg-gradient-to-br from-slate-900 to-black text-white shadow-[0_12px_28px_rgba(2,6,23,0.22)]"
                  }`}
                >
                  <Car size={22} />
                  <span className="text-left leading-tight">
                    <span className="block">Auto</span>
                    <span className={`text-xs font-medium ${isFerxxo ? "text-[#04120A]/70" : "text-white/65"}`}>Ver ruta</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado de interacción */}
                  {/* Lista de restaurantes cercanos */}
      {activeTab === "list" && (
        <div
          className={`absolute inset-0 z-50 backdrop-blur-xl transition-all duration-500 ${
            isFerxxo ? "bg-[#06130F]/96" : isDark ? "bg-slate-950/96" : "bg-white/96"
          }`}
        >
          <div className="h-full overflow-auto p-4 pb-32">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-serif text-3xl font-semibold">Lista</h2>
                <p className={isDark || isFerxxo ? "text-sm text-white/55" : "text-sm text-slate-500"}>
                  Restaurantes cercanos a tu ubicación
                </p>
              </div>

              <button
                onClick={() => setActiveTab("map")}
                className={`shrink-0 rounded-full p-3 shadow-md transition-all duration-300 ${
                  isFerxxo
                    ? "bg-[#00FF66]/12 text-[#00FF66] hover:bg-[#00FF66]/18"
                    : isDark
                    ? "bg-white/8 text-white hover:bg-white/12"
                    : "bg-slate-100 text-slate-950 hover:bg-slate-200"
                }`}
                aria-label="Cerrar lista"
              >
                <X size={20} />
              </button>
            </div>

            {locationLoading || loading ? (
              <LoadingSpinner message="Cargando restaurantes cercanos..." />
            ) : geoError || error ? (
              <ErrorMessage
                message={geoError || error || "Error al cargar restaurantes"}
                onRetry={() => {
                  requestLocation();
                  window.location.reload();
                }}
              />
            ) : nearbyRestaurants.length === 0 ? (
              <EmptyState
                title="No encontramos restaurantes cercanos"
                message="Espera unos segundos a que Google Places cargue los locales cercanos o mueve el mapa."
                icon="map"
                action={{
                  label: "Volver al mapa",
                  onClick: () => setActiveTab("map"),
                }}
              />
            ) : (
              <div className="space-y-4">
                {nearbyRestaurants.map((restaurant) =>
                  renderAestheticRestaurantCard(restaurant)
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Favoritos */}
      {activeTab === "saved" && (
        <div
          className={`absolute inset-0 z-50 backdrop-blur-xl transition-all duration-500 ${
            isFerxxo ? "bg-[#06130F]/96" : isDark ? "bg-slate-950/96" : "bg-white/96"
          }`}
        >
          <div className="h-full overflow-auto p-4 pb-32">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-3xl font-semibold">Favoritos</h2>
                <p className={isDark || isFerxxo ? "text-sm text-white/55" : "text-sm text-slate-500"}>
                  Tus lugares favoritos, del más cercano al más lejano
                </p>
              </div>

              <button
                onClick={() => setActiveTab("map")}
                className={`rounded-full p-3 shadow-md transition-all duration-300 ${
                  isFerxxo
                    ? "bg-[#00FF66]/12 text-[#00FF66] hover:bg-[#00FF66]/18"
                    : isDark
                    ? "bg-white/8 text-white hover:bg-white/12"
                    : "bg-slate-100 text-slate-950 hover:bg-slate-200"
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {locationLoading || loading ? (
              <LoadingSpinner message="Cargando favoritos..." />
            ) : geoError || error ? (
              <ErrorMessage
                message={geoError || error || "Error al cargar favoritos"}
                onRetry={() => {
                  requestLocation();
                  window.location.reload();
                }}
              />
            ) : savedRestaurants.length === 0 ? (
              <EmptyState
                title="Aún no tienes favoritos"
                message="Toca el corazón de un restaurante para guardarlo aquí."
                icon="map"
                action={{
                  label: "Explorar restaurantes",
                  onClick: () => setActiveTab("map"),
                }}
              />
            ) : (
              <div className="space-y-4">
                {savedRestaurants.map((restaurant) =>
                  renderAestheticRestaurantCard(restaurant)
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom navigation opción A */}
      <nav
        className={`fixed bottom-5 left-1/2 z-50 w-[88%] max-w-[430px] -translate-x-1/2 transition-all duration-500 ${
          isMapExploring || isMapRestaurantPopupOpen || isMapRoutePillOpen
            ? "translate-y-28 opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div
          className={`rounded-full border px-4 py-2.5 shadow-[0_18px_55px_rgba(15,23,42,0.20)] backdrop-blur-2xl ${
            isFerxxo ? "border-[#00FF66]/24 bg-[#092019]/76 shadow-[0_0_36px_rgba(0,255,102,0.20),0_18px_55px_rgba(0,0,0,0.35)]" : isDark ? "border-white/10 bg-slate-950/65" : "border-white/75 bg-white/68"
          }`}
        >
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("map");
                setHideSearchBar(false);
              }}
              className={`flex flex-col items-center justify-center rounded-full px-3 py-2 transition-all active:scale-95 ${
                activeTab === "map"
                  ? isFerxxo
                    ? "bg-[#00FF66] text-[#06130F] shadow-[0_0_20px_rgba(0,255,102,0.42)]"
                    : isDark
                    ? "bg-white/10 text-white"
                    : "bg-slate-950 text-white"
                  : isFerxxo
                  ? "text-[#BDFDD6]/75 hover:text-[#00FF66]"
                  : isDark
                  ? "text-white/65 hover:text-white"
                  : "text-slate-500 hover:text-slate-950"
              }`}
              aria-label="Explorar"
            >
              <Compass size={22} />
              <span className="mt-1 text-xs font-medium">Explorar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`flex flex-col items-center justify-center rounded-full px-3 py-2 transition-all active:scale-95 ${
                activeTab === "list"
                  ? isFerxxo
                    ? "bg-[#00FF66] text-[#06130F] shadow-[0_0_20px_rgba(0,255,102,0.42)]"
                    : isDark
                    ? "bg-white/10 text-white"
                    : "bg-slate-950 text-white"
                  : isFerxxo
                  ? "text-[#BDFDD6]/75 hover:text-[#00FF66]"
                  : isDark
                  ? "text-white/65 hover:text-white"
                  : "text-slate-500 hover:text-slate-950"
              }`}
              aria-label="Lista"
            >
              <List size={22} />
              <span className="mt-1 text-xs font-medium">Lista</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className={`flex flex-col items-center justify-center rounded-full px-3 py-2 transition-all active:scale-95 ${
                activeTab === "saved"
                  ? isFerxxo
                    ? "bg-[#00FF66] text-[#06130F] shadow-[0_0_20px_rgba(0,255,102,0.42)]"
                    : isDark
                    ? "bg-white/10 text-white"
                    : "bg-slate-950 text-white"
                  : isFerxxo
                  ? "text-[#BDFDD6]/75 hover:text-[#00FF66]"
                  : isDark
                  ? "text-white/65 hover:text-white"
                  : "text-slate-500 hover:text-slate-950"
              }`}
              aria-label="Favoritos"
            >
              <Heart size={22} />
              <span className="mt-1 text-xs font-medium">Favoritos</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Botón Akipe flotante */}
      <button
        onClick={() => setShowAkipeModal(true)}
        className={`fixed bottom-28 right-4 z-50 flex items-center gap-2 rounded-full border px-4 py-3 shadow-2xl backdrop-blur-2xl transition-all duration-500 active:scale-95 ${
          isFerxxo
            ? "border-[#00FF66]/24 bg-[#092019]/76 text-[#00FF66] shadow-[0_0_28px_rgba(0,255,102,0.22)] hover:bg-[#00FF66]/12"
            : isDark
            ? "border-white/10 bg-slate-950/65 text-white hover:bg-slate-900/80"
            : "border-white/70 bg-white/78 text-slate-950 hover:bg-white"
        } ${
          isMapExploring || selectedRestaurant || isMapRestaurantPopupOpen || isMapRoutePillOpen || routeRestaurant || activeTab !== "map"
            ? "translate-y-16 opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100"
        }`}
      >
        {isFerxxo ? <FerxxoGhostIcon size={20} /> : <Navigation size={20} />}
        <span className="font-medium">{isFerxxo ? "Ferxxo" : "Akipe"}</span>
      </button>

      {showAkipeModal && (
        <AkipeModal
          onClose={() => setShowAkipeModal(false)}
          onClear={clearAkipeFilter}
          currentRadius={selectedRadius}
          currentGroupType={selectedGroupType}
          onSelect={(radius, groupType) => {
            setSelectedRadius(radius);
            setSelectedGroupType(groupType);
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

      {showProfile && <Profile onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export default function HomeClient() {
  return (
    <ThemeProvider>
      <HomeContent />
    </ThemeProvider>
  );
}

