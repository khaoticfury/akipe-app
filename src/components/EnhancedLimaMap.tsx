"use client";

import React, { useEffect, useRef, useState } from "react";
import { Restaurant } from "../types/restaurant";
import { loadGoogleMaps } from "../utils/loadScript";
import { handleGeolocationError } from "../utils/geolocationErrorHandler";

interface EnhancedLimaMapProps {
  restaurants: Restaurant[];
  selectedRadius: number | null;
  userLocation: { latitude: number; longitude: number } | null;
  onRestaurantClick?: (restaurant: Restaurant) => void;
  fixedLocation?: { lat: number; lng: number } | null;
  locationSource?: 'gps' | 'manual' | 'address' | null;
}

const EnhancedLimaMap: React.FC<EnhancedLimaMapProps> = ({
  restaurants,
  selectedRadius,
  userLocation,
  onRestaurantClick,
  fixedLocation: propFixedLocation,
  locationSource: propLocationSource,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circleRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  const watchIdRef = useRef<number | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [showLocationControls, setShowLocationControls] = useState(false);
  const [hasInitialZoom, setHasInitialZoom] = useState(false);
  const [hasInitialMarkers, setHasInitialMarkers] = useState(false);
  const [fixedLocation, setFixedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationSource, setLocationSource] = useState<'gps' | 'manual' | 'address' | null>(null);

  const reloadGoogleMaps = () => {
    setGoogleMapsLoaded(false);
    setLoadingError(null);
    setTimeout(() => {
      setGoogleMapsLoaded(true);
    }, 100);
  };

  useEffect(() => {
    const loadGoogleMapsAsync = async () => {
      try {
        setLoadingError(null);
        await loadGoogleMaps();
        setGoogleMapsLoaded(true);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        setLoadingError(error instanceof Error ? error.message : 'Failed to load Google Maps');
      }
    };
    loadGoogleMapsAsync();
  }, []);

  // Retry loading if error occurs
  useEffect(() => {
    if (loadingError) {
      const retryTimer = setTimeout(() => {
        setLoadingError(null);
        setGoogleMapsLoaded(false);
        // Trigger reload
        setTimeout(() => {
          setGoogleMapsLoaded(true);
        }, 100);
      }, 2000);
      return () => clearTimeout(retryTimer);
    }
  }, [loadingError]);

  useEffect(() => {
    if (!googleMapsLoaded || !mapRef.current || !window.google || !window.google.maps || !window.google.maps.Map) {
      if (!window.google || !window.google.maps || !window.google.maps.Map) {
        setLoadingError('Google Maps not loaded');
      }
      return;
    }

    try {
      if (!mapInstance.current) {
        // Initialize map centered on user location if available, otherwise Lima center
        const initialCenter = userLocation
          ? { lat: userLocation.latitude, lng: userLocation.longitude }
          : { lat: -12.0464, lng: -77.0428 }; // Lima center fallback

        const initialZoom = userLocation ? 16 : 12; // Zoom closer if user location available

        // Create map configuration with proper error handling
        const mapOptions: any = {
          center: initialCenter,
          zoom: initialZoom,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        };

        // Add zoom control position only if Google Maps is properly loaded
        if (window.google.maps && window.google.maps.ControlPosition) {
          mapOptions.zoomControlOptions = {
            position: window.google.maps.ControlPosition.RIGHT_CENTER,
          };
        }

        mapInstance.current = new window.google.maps.Map(mapRef.current, mapOptions);

        // Add map interaction listeners
        if (mapInstance.current) {
          mapInstance.current.addListener('dragstart', () => {
            window.dispatchEvent(new CustomEvent('mapInteractionStart'));
          });

          mapInstance.current.addListener('zoom_changed', () => {
            window.dispatchEvent(new CustomEvent('mapInteractionStart'));
          });

          // Add listeners for when interaction ends
          mapInstance.current.addListener('dragend', () => {
            window.dispatchEvent(new CustomEvent('mapInteractionEnd'));
          });

          mapInstance.current.addListener('idle', () => {
            // Only dispatch end event if we're not in the middle of another interaction
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('mapInteractionEnd'));
            }, 100);
          });

          // Add click listener to show controls and close info windows
          mapInstance.current.addListener('click', (event: any) => {
            setShowLocationControls(false);

            // Close any open info windows when clicking on map
            markersRef.current.forEach(marker => {
              if ((marker as any).infoWindow) {
                (marker as any).infoWindow.close();
              }
            });
          });
        }
      }

      // Clear existing markers
      markersRef.current.forEach((marker) => {
        if (marker && marker.map) {
          marker.map = null;
        }
      });
      markersRef.current = [];



      // Show all restaurants by default (Google Maps behavior)
      // Filter by radius when selected using Akipe button
      const centerLocation = propFixedLocation || manualLocation ? (propFixedLocation || manualLocation) : userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null;

      const filteredRestaurants = selectedRadius && centerLocation
        ? restaurants.filter((restaurant) => {
            const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
              new window.google.maps.LatLng(centerLocation.lat, centerLocation.lng),
              new window.google.maps.LatLng(restaurant.gps_coordinates.latitude, restaurant.gps_coordinates.longitude)
            );
            return distance <= selectedRadius * 1000; // Only show restaurants within radius
          })
        : restaurants; // Show all restaurants when no radius selected

      // Ensure all restaurants are displayed if no filtering is applied
      const displayRestaurants = filteredRestaurants.length > 0 ? filteredRestaurants : restaurants;

      displayRestaurants.forEach((restaurant) => {
        if (!mapInstance.current) return;

        // Get category color for marker
        const getCategoryColor = (category: string) => {
          const colors = {
            local: '#10B981',      // green
            fast_food: '#F59E0B',  // amber
            gourmet: '#8B5CF6',    // violet
            street_food: '#EF4444', // red
            cafe: '#06B6D4',       // cyan
            bakery: '#F97316'      // orange
          };
          return colors[category as keyof typeof colors] || '#3B82F6';
        };

        // Create Google Maps-style restaurant marker using AdvancedMarkerElement
        if (!window.google.maps.marker || !window.google.maps.marker.AdvancedMarkerElement) {
          console.error('AdvancedMarkerElement not available, falling back to Marker');
          const marker = new window.google.maps.Marker({
            position: new window.google.maps.LatLng(restaurant.gps_coordinates.latitude, restaurant.gps_coordinates.longitude),
            map: mapInstance.current,
            title: restaurant.name,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C9.372 0 4 5.372 4 12c0 8.5 12 28 12 28s12-19.5 12-28c0-6.628-5.372-12-12-12z" fill="${getCategoryColor(restaurant.category)}" stroke="white" stroke-width="2"/>
                  <circle cx="16" cy="12" r="6" fill="white" opacity="0.9"/>
                  <text x="16" y="16" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="${getCategoryColor(restaurant.category)}">🍽</text>
                </svg>
              `)}`,
              scaledSize: new window.google.maps.Size(32, 40),
              anchor: new window.google.maps.Point(16, 40)
            }
          });
          markersRef.current.push(marker);
          return;
        }

        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: new window.google.maps.LatLng(restaurant.gps_coordinates.latitude, restaurant.gps_coordinates.longitude),
          map: mapInstance.current,
          title: restaurant.name,
          content: document.createElement('div'),
        });

        // Set the icon using the content div
        const iconDiv = marker.content as HTMLDivElement;
        iconDiv.innerHTML = `
          <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C9.372 0 4 5.372 4 12c0 8.5 12 28 12 28s12-19.5 12-28c0-6.628-5.372-12-12-12z" fill="${getCategoryColor(restaurant.category)}" stroke="white" stroke-width="2"/>
            <circle cx="16" cy="12" r="6" fill="white" opacity="0.9"/>
            <text x="16" y="16" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="${getCategoryColor(restaurant.category)}">🍽</text>
          </svg>
        `;
        iconDiv.style.cursor = 'pointer';

        // Create info window with restaurant details
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="restaurant-info-window" style="max-width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="margin-bottom: 12px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${restaurant.name}</h3>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="background: ${getCategoryColor(restaurant.category)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">${restaurant.category.replace('_', ' ').toUpperCase()}</span>
                  <div style="display: flex; align-items: center; gap: 2px;">
                    <span style="color: #fbbf24;">★</span>
                    <span style="font-size: 13px; color: #6b7280;">${restaurant.rating.toFixed(1)}</span>
                  </div>
                </div>
                <p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;">🍽️ ${restaurant.type_of_cuisine}</p>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">📍 ${restaurant.address}</p>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 13px; color: #059669; font-weight: 500;">${restaurant.price_range.currency}${restaurant.price_range.min} - ${restaurant.price_range.currency}${restaurant.price_range.max}</span>
                  <span style="font-size: 12px; color: #6b7280;">⏱️ ${restaurant.wait_time}</span>
                </div>
                <p style="margin: 0 0 12px 0; font-size: 12px; color: #6b7280;">🕒 ${restaurant.opening_hours}</p>
              </div>
              <div style="display: flex; gap: 8px;">
                <button
                  onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${restaurant.gps_coordinates.latitude},${restaurant.gps_coordinates.longitude}&travelmode=walking', '_blank')"
                  style="flex: 1; padding: 8px 12px; background: #059669; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 11.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zM9 13.5A5.5 5.5 0 0 0 3.5 19h11A5.5 5.5 0 0 0 9 13.5z"/></svg> Walking
                </button>
                <button
                  onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${restaurant.gps_coordinates.latitude},${restaurant.gps_coordinates.longitude}&travelmode=driving', '_blank')"
                  style="flex: 1; padding: 8px 12px; background: #1f2937; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 17h2v2H5v-2zm14-2h2v4h-2v-4zM3 19h2v2H3v-2zm14-2h4v2h-4v-2zm-6-8h8v2h-8V9zm0 4h8v2h-8v-2zm0 4h4v2h-4v-2z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg> Driving
                </button>
              </div>
              ${restaurant.contact_number ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #9ca3af;">📞 ${restaurant.contact_number}</p>` : ''}
            </div>
          `,
        });

        // Add click listener to show selection dialog
        if (marker instanceof window.google.maps.Marker) {
          marker.addListener("click", () => {
            // Close any open info windows first
            markersRef.current.forEach(m => {
              if (m.infoWindow) m.infoWindow.close();
            });

            // Add bounce animation
            marker.setAnimation(window.google.maps.Animation.BOUNCE);
            setTimeout(() => {
              marker.setAnimation(null);
            }, 2000);

            // Trigger restaurant selection instead of showing info window
            if (onRestaurantClick) {
              onRestaurantClick(restaurant);
            }
          });
        } else {
          marker.addEventListener("click", () => {
            // Close any open info windows first
            markersRef.current.forEach(m => {
              if (m.infoWindow) m.infoWindow.close();
            });

            // Trigger restaurant selection instead of showing info window
            if (onRestaurantClick) {
              onRestaurantClick(restaurant);
            }
          });
        }

        // Add smooth animation on marker load only on initial load (not available in AdvancedMarkerElement, so skip)
        // if (!hasInitialMarkers) {
        //   marker.setAnimation(window.google.maps.Animation.DROP);
        // }

        // Store info window reference with marker
        (marker as any).infoWindow = infoWindow;
        markersRef.current.push(marker);
      });

      // Mark initial markers as loaded
      setHasInitialMarkers(true);

      // Draw or update circle for selected radius
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }

      if (selectedRadius && centerLocation && mapInstance.current) {
        circleRef.current = new window.google.maps.Circle({
          strokeColor: "#3b82f6", // blue-500
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#bfdbfe", // blue-200
          fillOpacity: 0.2,
          map: mapInstance.current,
          center: new window.google.maps.LatLng(centerLocation.lat, centerLocation.lng),
          radius: selectedRadius * 1000,
        });
      }

      // Update or add user location marker with person icon
      if (userLocation && mapInstance.current) {
        if (!userMarkerRef.current) {
          // Create AdvancedMarkerElement for user location
          if (!window.google.maps.marker || !window.google.maps.marker.AdvancedMarkerElement) {
            console.error('AdvancedMarkerElement not available, falling back to Marker for user location');
            userMarkerRef.current = new window.google.maps.Marker({
              position: new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude),
              map: mapInstance.current,
              title: "Tu ubicación",
              icon: {
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="8" r="6" fill="#2E8B57" stroke="#145A32" stroke-width="2"/>
                    <path d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="#2E8B57" stroke="#145A32" stroke-width="2"/>
                  </svg>
                `)}`,
                scaledSize: new window.google.maps.Size(32, 32),
                anchor: new window.google.maps.Point(16, 32)
              }
            });
            return;
          }

          userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
            position: new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude),
            map: mapInstance.current,
            title: "Tu ubicación",
            content: document.createElement('div'),
          });

          // Set the icon using the content div
          const userIconDiv = userMarkerRef.current.content as HTMLDivElement;
          userIconDiv.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="8" r="6" fill="#2E8B57" stroke="#145A32" stroke-width="2"/>
              <path d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="#2E8B57" stroke="#145A32" stroke-width="2"/>
            </svg>
          `;
          userIconDiv.style.cursor = 'pointer';

          if (userMarkerRef.current instanceof window.google.maps.Marker) {
            userMarkerRef.current.addListener("click", () => {
              setIsGpsActive(false);
            });

            // Add drag functionality to user marker
            userMarkerRef.current.setDraggable(true);
            userMarkerRef.current.addListener("dragstart", () => {
              setIsDragging(true);
            });

            userMarkerRef.current.addListener("dragend", (event: any) => {
              setIsDragging(false);
              const newPosition = event.latLng;
              const newLocation = {
                lat: newPosition.lat(),
                lng: newPosition.lng()
              };

              setManualLocation(newLocation);
              setFixedLocation(newLocation);
              setLocationSource('manual');

              // Dispatch custom event for manual location update
              window.dispatchEvent(new CustomEvent('manualLocationUpdate', {
                detail: { latitude: newLocation.lat, longitude: newLocation.lng }
              }));
            });
          } else {
            userMarkerRef.current.addEventListener("click", () => {
              setIsGpsActive(false);
            });

            // Add drag functionality to user marker (not available in AdvancedMarkerElement, so skip)
            // userMarkerRef.current.setDraggable(true);
            // userMarkerRef.current.addEventListener("dragstart", () => {
            //   setIsDragging(true);
            // });

            // userMarkerRef.current.addEventListener("dragend", (event: any) => {
            //   setIsDragging(false);
            //   const newPosition = event.latLng;
            //   const newLocation = {
            //     lat: newPosition.lat(),
            //     lng: newPosition.lng()
            //   };

            //   setManualLocation(newLocation);
            //   setFixedLocation(newLocation);
            //   setLocationSource('manual');

            //   // Dispatch custom event for manual location update
            //   window.dispatchEvent(new CustomEvent('manualLocationUpdate', {
            //     detail: { latitude: newLocation.lat, longitude: newLocation.lng }
            //   }));
            // });
          }
        } else {
          if (userMarkerRef.current instanceof window.google.maps.Marker) {
            userMarkerRef.current.setPosition(new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude));
          } else {
            userMarkerRef.current.position = new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude);
          }
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
    } catch (error) {
      console.error('Error initializing map:', error);
      setLoadingError('Error initializing map');
    }
  }, [googleMapsLoaded, restaurants, selectedRadius, userLocation, onRestaurantClick, manualLocation, propFixedLocation, hasInitialZoom, propLocationSource]);

  // Watch user location and update marker dynamically
  React.useEffect(() => {
    if (!googleMapsLoaded || !window.google) return;

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          if (mapInstance.current && userMarkerRef.current) {
            if (userMarkerRef.current instanceof window.google.maps.Marker) {
              userMarkerRef.current.setPosition({
                lat: newLocation.latitude,
                lng: newLocation.longitude,
              });
            } else {
              userMarkerRef.current.position = {
                lat: newLocation.latitude,
                lng: newLocation.longitude,
              };
            }
            mapInstance.current.setCenter({
              lat: newLocation.latitude,
              lng: newLocation.longitude,
            });



            setIsGpsActive(true);
          }
        },
        (error) => {
          const { errorMessage, errorCode } = handleGeolocationError(error);
          console.error("Error watching position:", errorMessage);

          // For timeout errors in watchPosition, just log and continue
          if (errorCode === 3) {
            console.log("Map GPS watch timeout - will retry automatically");
          }

          setIsGpsActive(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 60000, // Increased from 30s to 60s
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
    if (fixedLocation || manualLocation) {
      // If fixed or manual location is set, center on it
      const locationToUse = fixedLocation || manualLocation;
      if (locationToUse && mapInstance.current && userMarkerRef.current) {
        const pos = new window.google.maps.LatLng(locationToUse.lat, locationToUse.lng);
        if (userMarkerRef.current instanceof window.google.maps.Marker) {
          userMarkerRef.current.setPosition(pos);
        } else {
          userMarkerRef.current.position = pos;
        }
        mapInstance.current.setCenter(pos);
        mapInstance.current.setZoom(17);
      }
    } else if (navigator.geolocation) {
      // Request GPS location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mapInstance.current && userMarkerRef.current) {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            if (userMarkerRef.current instanceof window.google.maps.Marker) {
              userMarkerRef.current.setPosition(pos);
            } else {
              userMarkerRef.current.position = pos;
            }
            mapInstance.current.setCenter(pos);
            mapInstance.current.setZoom(17);
          }
        },
        (error) => {
          const { errorMessage, errorCode } = handleGeolocationError(error);
          console.error("Error getting location:", errorMessage);

          // For timeout errors, try with reduced accuracy
          if (errorCode === 3) { // TIMEOUT
            console.log("Map GPS timeout detected, retrying with reduced accuracy...");

            navigator.geolocation.getCurrentPosition(
              (position) => {
                if (mapInstance.current && userMarkerRef.current) {
                  const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  };
                  if (userMarkerRef.current instanceof window.google.maps.Marker) {
                    userMarkerRef.current.setPosition(pos);
                  } else {
                    userMarkerRef.current.position = pos;
                  }
                  mapInstance.current.setCenter(pos);
                  mapInstance.current.setZoom(17);
                }
              },
              (finalError) => {
                const { errorMessage: finalErrorMessage } = handleGeolocationError(finalError);
                console.error("Final map GPS error:", finalErrorMessage);
                alert(finalErrorMessage);
              },
              {
                enableHighAccuracy: false,
                maximumAge: 300000,
                timeout: 10000,
              }
            );
          } else {
            alert(errorMessage);
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 60000, // Increased from 30s to 60s
        }
      );
    } else {
      // No fallback needed since we removed manual input
      alert("La geolocalización no está disponible en este navegador.");
    }
  };



  const handleAddressSubmit = async () => {
    if (!addressInput.trim() || !window.google || !window.google.maps) {
      alert("Por favor ingresa una dirección válida.");
      return;
    }

    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: addressInput + ', Lima, Peru' }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          const newLocation = { lat, lng };

          setManualLocation(newLocation);
          setFixedLocation(newLocation);
          setLocationSource('address');

          // Dispatch custom event for address location update
          window.dispatchEvent(new CustomEvent('addressLocationUpdate', {
            detail: { latitude: lat, longitude: lng }
          }));

          if (mapInstance.current && userMarkerRef.current) {
            if (userMarkerRef.current instanceof window.google.maps.Marker) {
              userMarkerRef.current.setPosition(newLocation);
            } else {
              userMarkerRef.current.position = newLocation;
            }
            mapInstance.current.setCenter(newLocation);
            mapInstance.current.setZoom(17);
          }
          setShowAddressInput(false);
          setAddressInput("");
        } else {
          console.error('Geocoding error:', status, results);
          let errorMessage = "No se pudo encontrar la dirección. ";

          switch (status) {
            case 'ZERO_RESULTS':
              errorMessage += "No se encontraron resultados para esta dirección.";
              break;
            case 'OVER_QUERY_LIMIT':
              errorMessage += "Se ha excedido el límite de consultas. Intenta de nuevo en unos momentos.";
              break;
            case 'REQUEST_DENIED':
              errorMessage += "La solicitud fue denegada. Verifica la configuración de la API.";
              break;
            case 'INVALID_REQUEST':
              errorMessage += "La solicitud es inválida. Verifica que la dirección esté completa.";
              break;
            default:
              errorMessage += "Por favor, intenta con una dirección más específica o verifica tu conexión a internet.";
          }

          alert(errorMessage);
        }
      });
    } catch (error) {
      console.error('Error in handleAddressSubmit:', error);
      alert("Error al procesar la dirección. Por favor, intenta de nuevo.");
    }
  };

  const handleClearFixedLocation = () => {
    setFixedLocation(null);
    setManualLocation(null);
    setLocationSource(null);

    // Dispatch custom event to clear fixed location
    window.dispatchEvent(new CustomEvent('clearFixedLocation'));

    if (userLocation && mapInstance.current && userMarkerRef.current) {
      if (userMarkerRef.current instanceof window.google.maps.Marker) {
        userMarkerRef.current.setPosition({
          lat: userLocation.latitude,
          lng: userLocation.longitude
        });
      } else {
        userMarkerRef.current.position = {
          lat: userLocation.latitude,
          lng: userLocation.longitude
        };
      }
      mapInstance.current.setCenter({
        lat: userLocation.latitude,
        lng: userLocation.longitude
      });
      mapInstance.current.setZoom(16);
    }
  };

  // Show loading state while Google Maps is loading
  if (!googleMapsLoaded) {
    return (
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa...</p>
          {loadingError && (
            <p className="text-red-500 text-sm mt-2">{loadingError}</p>
          )}
        </div>
      </div>
    );
  }

  // Show error state if Google Maps failed to load
  if (loadingError) {
    return (
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-md">
        <div className="text-center p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error al cargar el mapa</h3>
          <p className="text-gray-600 mb-4">{loadingError}</p>
          <button
            onClick={reloadGoogleMaps}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Recargar mapa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-10">
      <div ref={mapRef} className="w-full h-full" />

      {/* Location Source Indicator */}
      {propLocationSource && propFixedLocation && (
        <div className="absolute top-4 left-4 z-10">
          <div className={`text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg ${
            propLocationSource === 'gps' ? 'bg-green-500 animate-pulse' :
            propLocationSource === 'manual' ? 'bg-blue-500' :
            'bg-purple-500'
          }`}>
            📍 {propLocationSource === 'gps' ? 'GPS Activo' :
                propLocationSource === 'manual' ? 'Ubicación Manual' :
                'Dirección Buscada'}
          </div>
        </div>
      )}

      {/* Radius Filter Indicator */}
      {selectedRadius && (propFixedLocation || manualLocation || userLocation) && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-in slide-in-from-top-2 duration-300">
            🎯 Solo restaurantes en {selectedRadius < 1 ? `${selectedRadius * 1000} metros` : `${selectedRadius} km`} (Google Places)
          </div>
        </div>
      )}

      {/* Dragging Indicator */}
      {isDragging && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg animate-pulse">
            👆 Arrastrando marcador...
          </div>
        </div>
      )}

      {/* GPS Active Indicator (when not fixed) */}
      {isGpsActive && !fixedLocation && userMarkerRef.current && (
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



                {propFixedLocation && (
                  <button
                    onClick={() => {
                      handleClearFixedLocation();
                      setShowLocationControls(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <span className="text-xl">🔄</span>
                    <div className="text-left">
                      <div className="font-medium">Limpiar ubicación fija</div>
                      <div className="text-xs opacity-60">
                        {propLocationSource === 'manual' ? 'Volver a GPS' :
                         propLocationSource === 'address' ? 'Volver a GPS' :
                         'Desactivar GPS'}
                      </div>
                    </div>
                  </button>
                )}

                {/* Current Location Status */}
                {propLocationSource && propFixedLocation && (
                  <div className="w-full p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      Ubicación actual:
                    </div>
                    <div className="text-xs text-gray-600">
                      {propLocationSource === 'manual' && 'Coordenadas manuales'}
                      {propLocationSource === 'address' && 'Dirección buscada'}
                      {propLocationSource === 'gps' && 'GPS activo'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Lat: {propFixedLocation.lat.toFixed(6)}, Lng: {propFixedLocation.lng.toFixed(6)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>



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
