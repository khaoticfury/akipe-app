"use client";

import React, { useEffect, useRef, useState } from "react";
import { Restaurant } from "../types/restaurant";
import { loadGoogleMaps } from "../utils/loadScript";

interface LimaMapProps {
  restaurants: Restaurant[];
  selectedRadius: number | null;
  userLocation: { latitude: number; longitude: number } | null;
  onRestaurantClick?: (restaurant: Restaurant) => void;
}

const LimaMap: React.FC<LimaMapProps> = ({
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
  const [travelMode, setTravelMode] = useState<'walking' | 'driving' | null>(null);

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
      // @ts-ignore
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: -12.0464, lng: -77.0428 }, // Lima center
        zoom: 12,
      });
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
      const marker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(restaurant.gps_coordinates.latitude, restaurant.gps_coordinates.longitude),
        map: mapInstance.current!,
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
          setSelectedRestaurant(restaurant);
          setShowDirectionsModal(true);
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
          map: mapInstance.current!
        });
        polylinesRef.current.push(line);
      }
    });

    // Draw or update circle for selected radius
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }

    if (selectedRadius && centerLocation) {
      circleRef.current = new window.google.maps.Circle({
        strokeColor: "#3b82f6", // blue-500
        strokeOpacity: 0.5,
        strokeWeight: 2,
        fillColor: "#bfdbfe", // blue-200
        fillOpacity: 0.3,
        map: mapInstance.current!,
        center: new window.google.maps.LatLng(centerLocation.lat, centerLocation.lng),
        radius: selectedRadius * 1000,
      });
    }
   // Update or add user location marker
   if (userLocation) {
    if (!userMarkerRef.current) {
      // @ts-ignore
      userMarkerRef.current = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude),
        map: mapInstance.current!,
        title: "Tu ubicación",
        draggable: true,
        icon: travelMode === 'walking' ? {
          url: '/icons/walking-person.svg',
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32),
        } : travelMode === 'driving' ? {
          url: '/icons/car.svg',
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16),
        } : {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: "#2E8B57", // Aston Martin greenish inside
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#145A32",
        },
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
      // @ts-ignore
      userMarkerRef.current.setPosition(new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude));
    }
    // @ts-ignore
    mapInstance.current.setCenter(new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude));
  }

  // Center map on user location if available and no user marker (fallback)
  else if (userLocation) {
    mapInstance.current.setCenter(new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude));
  }
}, [googleMapsLoaded, restaurants, selectedRadius, userLocation, onRestaurantClick, manualLocation]);

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
        }
      },
      (error) => {
        console.error("Error watching position:", error);
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

// Locate Me button handler
const handleLocateMe = () => {
  if (manualLocation) {
    if (mapInstance.current && userMarkerRef.current) {
      const pos = new window.google.maps.LatLng(manualLocation.lat, manualLocation.lng);
      userMarkerRef.current.setPosition(pos);
      mapInstance.current.setCenter(pos);
      mapInstance.current.setZoom(17);
    }
  } else if (navigator.geolocation) {
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

return (
  <div className="relative rounded-lg" style={{ height: "600px", width: "100%" }}>
    <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
    <button
      onClick={handleLocateMe}
      className="absolute top-4 right-4 bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
      aria-label="Locate Me"
    >
      📍
    </button>

    {showManualInput && (
      <div className="absolute top-16 right-4 bg-white p-4 rounded-lg shadow-lg z-50 w-64">
        <h3 className="text-lg font-semibold mb-2">Ingresar ubicación manual</h3>
        <input
          type="text"
          placeholder="Latitud"
          value={manualLatInput}
          onChange={(e) => setManualLatInput(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-2"
        />
        <input
          type="text"
          placeholder="Longitud"
          value={manualLngInput}
          onChange={(e) => setManualLngInput(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-2"
        />
        <button
          onClick={handleManualLocationSubmit}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition-colors"
        >
          Confirmar
        </button>
      </div>
    )}
  </div>
);
};

export default LimaMap;
