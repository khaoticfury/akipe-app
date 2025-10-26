import { useState, useEffect, useCallback, useRef } from 'react';
import { handleGeolocationError } from '../utils/geolocationErrorHandler';

interface LocationState {
  userLocation: { latitude: number; longitude: number } | null;
  geoError: string | null;
  isLoading: boolean;
  fixedLocation: { latitude: number; longitude: number } | null;
  locationSource: 'gps' | 'manual' | 'address' | null;
}

export const useLocation = () => {
  const [locationState, setLocationState] = useState<LocationState>({
    userLocation: null,
    geoError: null,
    isLoading: true,
    fixedLocation: null,
    locationSource: null
  });

  const watchIdRef = useRef<number | null>(null);
  const lastGpsLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const movementThreshold = 0.001; // Approximately 100 meters

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState(prev => ({
        ...prev,
        geoError: "La geolocalización no es compatible con este navegador.",
        isLoading: false
      }));
      return;
    }

    setLocationState(prev => ({ ...prev, isLoading: true, geoError: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        setLocationState(prev => ({
          ...prev,
          userLocation: newLocation,
          geoError: null,
          isLoading: false,
          locationSource: 'gps'
        }));

        lastGpsLocationRef.current = newLocation;
      },
      (error) => {
        // Handle empty or malformed error objects
        if (!error || typeof error !== 'object') {
          console.error("Received empty or invalid error object:", error);
          setLocationState(prev => ({
            ...prev,
            geoError: "Error desconocido al obtener la ubicación. Por favor, verifica tu conexión a internet y los permisos de ubicación.",
            isLoading: false
          }));
          return;
        }

        let errorMessage: string;
        let errorCode: number | undefined;

        try {
          const errorResult = handleGeolocationError(error);
          errorMessage = errorResult.errorMessage;
          errorCode = errorResult.errorCode;
        } catch (handlerError) {
          console.error("Error in handleGeolocationError:", handlerError);
          errorMessage = "Error desconocido al procesar el error de ubicación.";
          errorCode = undefined;
        }

        // For timeout errors, try with reduced accuracy
        if (errorCode === 3) { // TIMEOUT
          console.log("GPS timeout detected, retrying with reduced accuracy...");

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const newLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              };

              setLocationState(prev => ({
                ...prev,
                userLocation: newLocation,
                geoError: null,
                isLoading: false,
                locationSource: 'gps'
              }));

              lastGpsLocationRef.current = newLocation;
            },
            (finalError) => {
              // Handle empty error in fallback as well
              if (!finalError || typeof finalError !== 'object') {
                console.error("Received empty error in fallback:", finalError);
                setLocationState(prev => ({
                  ...prev,
                  geoError: "Error desconocido en la ubicación de respaldo.",
                  isLoading: false
                }));
                return;
              }

              const { errorMessage: finalErrorMessage } = handleGeolocationError(finalError);
              setLocationState(prev => ({
                ...prev,
                geoError: finalErrorMessage,
                isLoading: false
              }));
            },
            {
              enableHighAccuracy: false, // Reduced accuracy for faster response
              maximumAge: 300000, // Accept locations up to 5 minutes old
              timeout: 10000, // Longer timeout for fallback
            }
          );
        } else {
          setLocationState(prev => ({
            ...prev,
            geoError: errorMessage,
            isLoading: false
          }));
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000, // Increased from 5s to 15s
      }
    );
  }, []);

  const updateLocation = useCallback((latitude: number, longitude: number, source: 'manual' | 'address' = 'manual') => {
    const newLocation = { latitude, longitude };

    setLocationState(prev => ({
      ...prev,
      userLocation: newLocation,
      fixedLocation: newLocation,
      geoError: null,
      isLoading: false,
      locationSource: source
    }));

    // Stop GPS tracking when manually setting location
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const clearFixedLocation = useCallback(() => {
    setLocationState(prev => ({
      ...prev,
      fixedLocation: null,
      locationSource: null
    }));

    // Restart GPS tracking
    requestLocation();
  }, [requestLocation]);

  const setAddressLocation = useCallback((latitude: number, longitude: number) => {
    updateLocation(latitude, longitude, 'address');
  }, [updateLocation]);

  // GPS tracking effect
  useEffect(() => {
    if (!navigator.geolocation || locationState.fixedLocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        // Check if GPS location has moved significantly
        if (lastGpsLocationRef.current) {
          const distance = Math.sqrt(
            Math.pow(newLocation.latitude - lastGpsLocationRef.current.latitude, 2) +
            Math.pow(newLocation.longitude - lastGpsLocationRef.current.longitude, 2)
          );

          if (distance > movementThreshold) {
            // GPS has moved significantly, update location
            setLocationState(prev => ({
              ...prev,
              userLocation: newLocation,
              locationSource: 'gps'
            }));
          }
        } else {
          // First GPS reading
          setLocationState(prev => ({
            ...prev,
            userLocation: newLocation,
            locationSource: 'gps'
          }));
        }

        lastGpsLocationRef.current = newLocation;
      },
      (error) => {
        // Handle empty or malformed error objects in watchPosition
        if (!error || typeof error !== 'object') {
          console.error("Received empty or invalid error object in watchPosition:", error);
          return; // Don't update state for empty errors in watch mode
        }

        let errorMessage: string;
        let errorCode: number | undefined;

        try {
          const errorResult = handleGeolocationError(error);
          errorMessage = errorResult.errorMessage;
          errorCode = errorResult.errorCode;
        } catch (handlerError) {
          console.error("Error in handleGeolocationError (watchPosition):", handlerError);
          errorMessage = "Error desconocido en el seguimiento de ubicación.";
          errorCode = undefined;
        }

        console.error("Error watching position:", errorMessage);

        // For timeout errors in watchPosition, we don't retry as it's continuous
        // Just log and continue - the watch will retry automatically
        if (errorCode === 3) {
          console.log("GPS watch timeout - will retry automatically");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000, // Increased from 5s to 15s
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [locationState.fixedLocation]);

  // Listen for manual location updates
  useEffect(() => {
    const handleManualLocationUpdate = (event: CustomEvent) => {
      const { latitude, longitude } = event.detail;
      updateLocation(latitude, longitude, 'manual');
    };

    const handleAddressLocationUpdate = (event: CustomEvent) => {
      const { latitude, longitude } = event.detail;
      setAddressLocation(latitude, longitude);
    };

    window.addEventListener("manualLocationUpdate", handleManualLocationUpdate as EventListener);
    window.addEventListener("addressLocationUpdate", handleAddressLocationUpdate as EventListener);

    return () => {
      window.removeEventListener("manualLocationUpdate", handleManualLocationUpdate as EventListener);
      window.removeEventListener("addressLocationUpdate", handleAddressLocationUpdate as EventListener);
    };
  }, [updateLocation, setAddressLocation]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    ...locationState,
    requestLocation,
    updateLocation,
    setAddressLocation,
    clearFixedLocation
  };
};
