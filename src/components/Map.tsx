"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface MapProps {
  center?: google.maps.LatLngLiteral;
  zoom?: number;
}

const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "0.5rem"
};

const defaultCenter = {
  lat: 37.7749,    // Default latitude (San Francisco)
  lng: -122.4194,  // Default longitude
};

const mapOptions: google.maps.MapOptions = {
  styles: [
    {
      featureType: "all",
      elementType: "all",
      stylers: [
        { saturation: -100 },
        { lightness: 0 }
      ]
    }
  ],
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  backgroundColor: "#f3f4f6", // Tailwind gray-100
  gestureHandling: "cooperative",
  disableDefaultUI: false,
};

const Map: React.FC<MapProps> = ({ center = defaultCenter, zoom = 12 }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;
      try {
        const loader = new Loader({
          apiKey: "AIzaSyCHVLloyILVDoB_EMeiFHnaJ8pOddxVk08",
          version: "weekly",
          libraries: ["places"],
          language: "en",
          region: "US"
        });

        const google = await loader.load();
        const newMap = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          ...mapOptions
        });

        setMap(newMap);
        setIsLoading(false);

        // Add a marker at the center
        new google.maps.Marker({
          position: center,
          map: newMap,
          title: "Current Location"
        });

      } catch (error) {
        console.error("Error loading Google Maps:", error);
        setLoadError(error instanceof Error ? error : new Error("Failed to load Google Maps"));
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      // Cleanup
      if (map) {
        // Remove event listeners, markers, etc.
      }
    };
  }, [center, zoom]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <p className="text-red-500 font-medium mb-2">Failed to load Google Maps</p>
          <p className="text-gray-600 text-sm">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} style={containerStyle} />;
};

export default Map;
