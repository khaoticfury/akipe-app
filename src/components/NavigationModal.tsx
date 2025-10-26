"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  MapPin,
  Clock,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Loader2
} from 'lucide-react';
import { Restaurant } from '../types/restaurant';
import { useTheme } from '../contexts/ThemeContext';

interface NavigationStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver: 'straight' | 'turn-left' | 'turn-right' | 'slight-left' | 'slight-right' | 'u-turn' | 'arrive';
  roadName?: string;
}

interface NavigationModalProps {
  restaurant: Restaurant;
  travelMode: 'walking' | 'driving';
  onClose: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const NavigationModal: React.FC<NavigationModalProps> = ({
  restaurant,
  travelMode,
  onClose,
  userLocation
}) => {
  const { actualTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalDistance, setTotalDistance] = useState<string>('');
  const [totalDuration, setTotalDuration] = useState<string>('');
  const mapRef = useRef<HTMLDivElement>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);

  useEffect(() => {
    if (userLocation && window.google && window.google.maps) {
      loadDirections();
    }
  }, [userLocation, restaurant, travelMode]);

  const loadDirections = async () => {
    if (!userLocation || !window.google || !window.google.maps) {
      setError('Ubicación o Google Maps no disponible');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const directionsService = new window.google.maps.DirectionsService();
      const origin = new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude);
      const destination = new window.google.maps.LatLng(
        restaurant.gps_coordinates.latitude,
        restaurant.gps_coordinates.longitude
      );

      const response = await new Promise<any>((resolve, reject) => {
        directionsService.route(
          {
            origin,
            destination,
            travelMode: travelMode === 'walking'
              ? window.google.maps.TravelMode.WALKING
              : window.google.maps.TravelMode.DRIVING,
            optimizeWaypoints: true,
            provideRouteAlternatives: false
          },
          (result: any, status: any) => {
            if (status === 'OK' && result) {
              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          }
        );
      });

      if (response.routes && response.routes[0]) {
        const route = response.routes[0];
        const legs = route.legs[0];

        // Extract steps from the route
        const steps: NavigationStep[] = legs.steps.map((step: any, index: number) => ({
          instruction: step.instructions || `Paso ${index + 1}`,
          distance: step.distance?.text || '0 m',
          duration: step.duration?.text || '0 min',
          maneuver: mapManeuverType(step.maneuver),
          roadName: step.instructions ? extractRoadName(step.instructions) : undefined
        }));

        // Add arrival step
        steps.push({
          instruction: `Ha llegado a ${restaurant.name}`,
          distance: '0 m',
          duration: '0 min',
          maneuver: 'arrive'
        });

        setNavigationSteps(steps);
        setTotalDistance(legs.distance?.text || '0 km');
        setTotalDuration(legs.duration?.text || '0 min');

        // Calculate estimated arrival time
        const now = new Date();
        const durationInSeconds = legs.duration?.value || 0;
        const arrivalTime = new Date(now.getTime() + durationInSeconds * 1000);
        setEstimatedArrival(arrivalTime.toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit'
        }));

        // Initialize map with directions
        initializeMapWithDirections(route);
      }
    } catch (err) {
      console.error('Error loading directions:', err);
      setError('No se pudo cargar la ruta. Verifica tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  const mapManeuverType = (maneuver: string): NavigationStep['maneuver'] => {
    switch (maneuver) {
      case 'turn-left': return 'turn-left';
      case 'turn-right': return 'turn-right';
      case 'slight-left': return 'slight-left';
      case 'slight-right': return 'slight-right';
      case 'u-turn': return 'u-turn';
      case 'straight': return 'straight';
      default: return 'straight';
    }
  };

  const extractRoadName = (instructions: string): string | undefined => {
    // Simple extraction of road name from HTML instructions
    const cleanText = instructions.replace(/<[^>]*>/g, '');
    const parts = cleanText.split(' ');
    if (parts.length > 1) {
      return parts.slice(1).join(' ');
    }
    return undefined;
  };

  const initializeMapWithDirections = (route: any) => {
    if (!mapRef.current || !window.google) return;

    const mapOptions = {
      zoom: 15,
      center: userLocation ? {
        lat: userLocation.latitude,
        lng: userLocation.longitude
      } : { lat: -12.0464, lng: -77.0428 },
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    };

    const map = new window.google.maps.Map(mapRef.current, mapOptions);
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map: map,
      directions: { routes: [route] } as any,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#3b82f6',
        strokeWeight: 6,
        strokeOpacity: 0.8
      }
    });

    directionsServiceRef.current = new window.google.maps.DirectionsService();
    directionsRendererRef.current = directionsRenderer;
  };

  const getManeuverIcon = (maneuver: NavigationStep['maneuver']) => {
    switch (maneuver) {
      case 'straight': return '⬆️';
      case 'turn-left': return '⬅️';
      case 'turn-right': return '➡️';
      case 'slight-left': return '↖️';
      case 'slight-right': return '↗️';
      case 'u-turn': return '🔄';
      case 'arrive': return '🎯';
      default: return '⬆️';
    }
  };

  const getManeuverColor = (maneuver: NavigationStep['maneuver']) => {
    switch (maneuver) {
      case 'turn-left': return 'text-blue-500';
      case 'turn-right': return 'text-blue-500';
      case 'slight-left': return 'text-green-500';
      case 'slight-right': return 'text-green-500';
      case 'u-turn': return 'text-red-500';
      case 'arrive': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const handleStartNavigation = () => {
    setIsNavigating(true);
    // In a real app, this would start GPS tracking and real-time updates
  };

  const handleNextStep = () => {
    if (currentStep < navigationSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = navigationSteps[currentStep];
  const progress = navigationSteps.length > 0 ? ((currentStep + 1) / navigationSteps.length) * 100 : 0;

  if (loading) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col ${
        actualTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'
      }`}>
        <div className={`flex items-center justify-between p-4 border-b ${
          actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <X size={24} />
            </button>
            <div>
              <h2 className="text-lg font-bold">Navegación</h2>
              <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {restaurant.name}
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin mx-auto mb-4 text-blue-500" />
            <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Calculando ruta...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col ${
        actualTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'
      }`}>
        <div className={`flex items-center justify-between p-4 border-b ${
          actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <X size={24} />
            </button>
            <div>
              <h2 className="text-lg font-bold">Navegación</h2>
              <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {restaurant.name}
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className={`text-sm mb-4 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {error}
            </p>
            <button
              onClick={loadDirections}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${
      actualTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <X size={24} />
          </button>
          <div>
            <h2 className="text-lg font-bold">Navegación</h2>
            <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {restaurant.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button className={`p-2 rounded-lg transition-colors ${
            actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}>
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      {/* Map with Route */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className={`w-full bg-gray-300 rounded-full h-2 mb-2 ${
            actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
          }`}>
            <div
              className="bg-black h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Paso {currentStep + 1} de {navigationSteps.length}</span>
            <span>{Math.round(progress)}% completado</span>
          </div>
        </div>
      </div>

      {/* Navigation Instructions */}
      <div className={`p-4 border-t ${
        actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {/* Current Step */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`text-2xl ${getManeuverColor(currentStepData.maneuver)}`}>
            {getManeuverIcon(currentStepData.maneuver)}
          </div>
          <div className="flex-1">
            <p className="font-medium mb-1">{currentStepData.instruction}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {currentStepData.distance}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {currentStepData.duration}
              </span>
            </div>
            {currentStepData.roadName && (
              <p className={`text-xs mt-1 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentStepData.roadName}
              </p>
            )}
          </div>
        </div>

        {/* Trip Summary */}
        <div className={`p-3 rounded-lg mb-4 ${
          actualTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <div className="flex items-center justify-between text-sm">
            <span className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Tiempo estimado de llegada
            </span>
            <span className="font-medium">{estimatedArrival}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Distancia total
            </span>
            <span className="font-medium">{totalDistance}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Duración total
            </span>
            <span className="font-medium">{totalDuration}</span>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex gap-3">
          <button
            onClick={handlePreviousStep}
            disabled={currentStep === 0}
            className={`flex-1 py-3 px-4 rounded-lg border transition-colors ${
              currentStep === 0
                ? actualTheme === 'dark' ? 'bg-gray-800 text-gray-600 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-200'
                : actualTheme === 'dark'
                  ? 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700'
                  : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <ArrowLeft size={20} className="mx-auto" />
          </button>

          {!isNavigating ? (
            <button
              onClick={handleStartNavigation}
              className="flex-2 bg-black text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Iniciar Navegación
            </button>
          ) : (
            <button className="flex-2 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium">
              🚶 En Ruta
            </button>
          )}

          <button
            onClick={handleNextStep}
            disabled={currentStep === navigationSteps.length - 1}
            className={`flex-1 py-3 px-4 rounded-lg border transition-colors ${
              currentStep === navigationSteps.length - 1
                ? actualTheme === 'dark' ? 'bg-gray-800 text-gray-600 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-200'
                : actualTheme === 'dark'
                  ? 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700'
                  : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <ArrowRight size={20} className="mx-auto" />
          </button>
        </div>

        {/* Alternative Actions */}
        <div className="flex gap-2 mt-3">
          <button className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${
            actualTheme === 'dark'
              ? 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}>
            <RotateCcw size={16} className="mr-2" />
            Recalcular
          </button>
          <button
            onClick={() => window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                restaurant.address + ', ' + restaurant.district + ', Lima, Peru'
              )}&travelmode=${travelMode}`,
              '_blank'
            )}
            className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
              actualTheme === 'dark'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            📱 Google Maps
          </button>
        </div>
      </div>
    </div>
  );
};

export default NavigationModal;
