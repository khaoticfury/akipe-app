"use client";

import React, { useEffect, useRef, useState } from "react";
import { Restaurant } from "../types/restaurant";
import { loadGoogleMaps } from "../utils/loadScript";

interface EnhancedLimaMapProps {
  restaurants: Restaurant[];
  selectedRadius: number | null;
  userLocation: { latitude: number; longitude: number } | null;
  onRestaurantClick?: (restaurant: Restaurant) => void;
}

const EnhancedLimaMap: React.FC<EnhancedLimaMapProps> = ({
  restaurants,
  selectedRadius,
  userLocation,
  onRestaurantClick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualLatInput, setManualLatInput] = useState("");
  const [manualLngInput, setManualLngInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [showLocationControls, setShowLocationControls] = useState(false);
  const [hasInitialZoom, setHasInitialZoom] = useState(false);

  useEffect(() => {
    const loadGoogleMapsAsync = async () => {
      if (!googleMapsLoaded) {
        await loadGoogleMaps();
        setGoogleMapsLoaded(true);
      }
    };
    loadGoogleMapsAsync();
  }, [googleMapsLoaded]);

  useEffect(() => {
    if (!googleMapsLoaded || !mapRef.current) return;

    if (!mapInstance.current) {
      // Initialize map centered on user location if available, otherwise Lima center
      const initialCenter = userLocation
        ? { lat: userLocation.latitude, lng: userLocation.longitude }
        : { lat: -12.0464, lng: -77.0428 }; // Lima center fallback

      const initialZoom = userLocation ? 16 : 12; // Zoom closer if user location available

      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        styles: [
          // Custom map styles for better aesthetics
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "transit",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ],
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER,
        },
        gestureHandling: 'greedy',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Add map interaction listeners
      if (mapInstance.current) {
        mapInstance.current.addListener('dragstart', () => {
          window.dispatchEvent(new CustomEvent('mapInteraction'));
        });

        mapInstance.current.addListener('zoom_changed', () => {
          window.dispatchEvent(new CustomEvent('mapInteraction'));
        });

        // Add click listener to show controls
        mapInstance.current.addListener('click', () => {
          setShowLocationControls(false);
        });
      }
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Clear existing polylines
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];

    // Add markers for restaurants within radius if radius and userLocation are set
    const centerLocation = manualLocation ? { lat: manualLocation.lat, lng: manualLocation.lng } : userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null;
    const filteredRestaurants = restaurants.filter((restaurant) => {
      if (selectedRadius && centerLocation) {
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(centerLocation.lat, centerLocation.lng),
          new window.google.maps.LatLng(restaurant.gps_coordinates.latitude, restaurant.gps_coordinates.longitude)
        );
        return distance <= selectedRadius * 1000; // meters
      }
      return false; // Hide all restaurants if no radius selected
    });

    filteredRestaurants.forEach((restaurant) => {
      if (!mapInstance.current) return;

      const marker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(restaurant.gps_coordinates.latitude, restaurant.gps_coordinates.longitude),
        map: mapInstance.current,
        title: restaurant.name,
        label: {
          text: restaurant.name,
          color: "#000000",
          fontWeight: "bold",
          fontSize: "14px",
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 0,
        },
      });

      marker.addListener("click", () => {
        if (onRestaurantClick) {
          onRestaurantClick(restaurant);
        }
      });

      markersRef.current.push(marker);

      // Draw polyline with arrow from user location to restaurant
      if (userMarkerRef.current) {
        const line = new window.google.maps.Polyline({
          path: [
            userMarkerRef.current.getPosition()!,
            marker.getPosition()!
          ],
          icons: [{
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              strokeColor: "#3b82f6"
            },
            offset: "100%"
          }],
          strokeColor: "#3b82f6",
          strokeOpacity: 0.6,
          strokeWeight: 2,
          map: mapInstance.current
        });
        polylinesRef.current.push(line);
      }
    });

    // Draw or update circle for selected radius
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }

    if (selectedRadius && centerLocation && mapInstance.current) {
      circleRef.current = new window.google.maps.Circle({
        strokeColor: "#3b82f6", // blue-500
        strokeOpacity: 0.5,
        strokeWeight: 2,
        fillColor: "#bfdbfe", // blue-200
        fillOpacity: 0.3,
        map: mapInstance.current,
        center: new window.google.maps.LatLng(centerLocation.lat, centerLocation.lng),
        radius: selectedRadius * 1000,
      });
    }

    // Update or add user location marker with person icon
    if (userLocation && mapInstance.current) {
      if (!userMarkerRef.current) {
        // Create person-shaped marker using custom SVG
        const personIcon = {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="8" r="6" fill="#2E8B57" stroke="#145A32" stroke-width="2"/>
              <path d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="#2E8B57" stroke="#145A32" stroke-width="2"/>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32),
        };

        userMarkerRef.current = new window.google.maps.Marker({
          position: new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude),
          map: mapInstance.current,
          title: "Tu ubicación",
          draggable: true,
          icon: personIcon,
          animation: window.google.maps.Animation.DROP,
        });

        userMarkerRef.current.addListener("dragstart", () => {
          setIsGpsActive(false);
        });

        userMarkerRef.current.addListener("dragend", (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            const previousPosition = userMarkerRef.current?.getPosition();
            if (window.confirm("¿Es esta la ubicación correcta? ¿Desea dejarla como permanente?")) {
              setManualLocation({ lat, lng });
              if (mapInstance.current) {
                mapInstance.current.setCenter(event.latLng);
              }
              // Update userLocation state to manualLocation to prevent reset
              if (typeof window !== "undefined") {
                const eventDetail = new CustomEvent("manualLocationUpdate", { detail: { latitude: lat, longitude: lng } });
                window.dispatchEvent(eventDetail);
              }
            } else {
              // Revert to previous position
              if (previousPosition && userMarkerRef.current) {
                userMarkerRef.current.setPosition(previousPosition);
                if (mapInstance.current) {
                  mapInstance.current.setCenter(previousPosition);
                }
              }
            }
          }
        });
      } else {
        userMarkerRef.current.setPosition(new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude));
      }

      // Auto-zoom to user location on initial load
      if (!hasInitialZoom && mapInstance.current) {
        mapInstance.current.setCenter(new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude));
        mapInstance.current.setZoom(16);
        setHasInitialZoom(true);
      }
    }

    // Center map on user location if available and no user marker (fallback)
    else if (userLocation && mapInstance.current) {
      mapInstance.current.setCenter(new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude));
    }
  }, [googleMapsLoaded, restaurants, selectedRadius, userLocation, onRestaurantClick, manualLocation, hasInitialZoom]);

  // Watch user location and update marker dynamically
  React.useEffect(() => {
    if (!googleMapsLoaded) return;

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          if (mapInstance.current && userMarkerRef.current) {
            userMarkerRef.current.setPosition({
              lat: newLocation.latitude,
              lng: newLocation.longitude,
            });
            mapInstance.current.setCenter({
              lat: newLocation.latitude,
              lng: newLocation.longitude,
            });

            // Update polylines positions
            polylinesRef.current.forEach(polyline => {
              const path = polyline.getPath();
              if (path.getLength() > 0) {
                path.setAt(0, new window.google.maps.LatLng(newLocation.latitude, newLocation.longitude));
              }
            });

            setIsGpsActive(true);
          }
        },
        (error) => {
          console.error("Error watching position:", error);
          setIsGpsActive(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [googleMapsLoaded]);

  // Unified Location Control Handler
  const handleLocationAction = () => {
    if (manualLocation) {
      // If manual location is set, center on it
      if (mapInstance.current && userMarkerRef.current) {
        const pos = new window.google.maps.LatLng(manualLocation.lat, manualLocation.lng);
        userMarkerRef.current.setPosition(pos);
        mapInstance.current.setCenter(pos);
        mapInstance.current.setZoom(17);
      }
    } else if (navigator.geolocation) {
      // Request GPS location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mapInstance.current) {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            mapInstance.current.setCenter(pos);
            mapInstance.current.setZoom(17);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setShowManualInput(true);
          alert("No se pudo obtener la ubicación. Por favor, permita el acceso a la ubicación o ingrese manualmente.");
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
    } else {
      setShowManualInput(true);
    }
  };

  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualLatInput);
    const lng = parseFloat(manualLngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      setManualLocation({ lat, lng });
      if (mapInstance.current) {
        mapInstance.current.setCenter({ lat, lng });
      }
      setShowManualInput(false);
    }
  };

  const handleAddressSubmit = async () => {
    if (!addressInput.trim() || !window.google || !window.google.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: addressInput + ', Lima, Peru' }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();

        setManualLocation({ lat, lng });
        if (mapInstance.current) {
          mapInstance.current.setCenter({ lat, lng });
          mapInstance.current.setZoom(17);
        }
        setShowAddressInput(false);
        setAddressInput("");
      } else {
        alert("No se pudo encontrar la dirección. Por favor, intenta con una dirección más específica.");
      }
    });
  };

  return (
    <div className="relative rounded-xl overflow-hidden shadow-2xl bg-white/80 backdrop-blur-md" style={{ height: "100%", width: "100%" }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />

      {/* GPS Active Indicator */}
      {isGpsActive && userMarkerRef.current && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg animate-pulse">
            📍 GPS Activo
          </div>
        </div>
      )}

      {/* Unified Location Button - Moved to upper 3/4 of screen */}
      <div className="absolute right-4 top-1/3 transform -translate-y-1/2 z-10">
        <button
          onClick={() => setShowLocationControls(!showLocationControls)}
          className="bg-white/80 backdrop-blur-md text-gray-700 p-3 rounded-xl shadow-lg hover:bg-white/90 transition-all duration-300 border-0"
          aria-label="Ubicación"
        >
          📍
        </button>

        {/* Location Controls Panel */}
        {showLocationControls && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-20"
              onClick={() => setShowLocationControls(false)}
            />

            {/* Controls Panel */}
            <div className="absolute right-4 top-1/3 transform -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl w-64 animate-in slide-in-from-right-2 duration-200">
              <h3 className="text-lg font-semibold mb-3">Ubicación</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    handleLocationAction();
                    setShowLocationControls(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <span className="text-xl">📍</span>
                  <div className="text-left">
                    <div className="font-medium">Usar mi ubicación</div>
                    <div className="text-xs opacity-80">GPS actual</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowAddressInput(true);
                    setShowLocationControls(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <span className="text-xl">🏠</span>
                  <div className="text-left">
                    <div className="font-medium">Buscar dirección</div>
                    <div className="text-xs opacity-60">Ej: Av. Larco 123</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowManualInput(true);
                    setShowLocationControls(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <span className="text-xl">📍</span>
                  <div className="text-left">
                    <div className="font-medium">Coordenadas</div>
                    <div className="text-xs opacity-60">Latitud, Longitud</div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showManualInput && (
        <div className="absolute top-16 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl z-50 w-64 animate-in slide-in-from-top-2 duration-200">
          <h3 className="text-lg font-semibold mb-2">Ingresar ubicación manual</h3>
          <input
            type="text"
            placeholder="Latitud"
            value={manualLatInput}
            onChange={(e) => setManualLatInput(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg mb-2 focus:ring-2 focus:ring-black/20 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Longitud"
            value={manualLngInput}
            onChange={(e) => setManualLngInput(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg mb-2 focus:ring-2 focus:ring-black/20 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleManualLocationSubmit}
              className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Confirmar
            </button>
            <button
              onClick={() => setShowManualInput(false)}
              className="flex-1 bg-gray-200 text-black py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showAddressInput && (
        <div className="absolute top-16 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl z-50 w-80 animate-in slide-in-from-top-2 duration-200">
          <h3 className="text-lg font-semibold mb-2">Buscar por dirección</h3>
          <input
            type="text"
            placeholder="Ej: Av. Larco 123, Miraflores, Lima"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg mb-2 focus:ring-2 focus:ring-black/20 focus:outline-none"
            onKeyPress={(e) => e.key === 'Enter' && handleAddressSubmit()}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddressSubmit}
              className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Buscar
            </button>
            <button
              onClick={() => {
                setShowAddressInput(false);
                setAddressInput("");
              }}
              className="flex-1 bg-gray-200 text-black py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedLimaMap;
