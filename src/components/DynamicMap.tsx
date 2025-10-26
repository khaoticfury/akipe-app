"use client";

import React, { useEffect, useRef, useState } from "react";
import { loadScript } from "../utils/loadScript";

declare global {
  interface Window {
    google: any;
  }
}

const GOOGLE_MAPS_API_KEY = "AIzaSyCHVLloyILVDoB_EMeiFHnaJ8pOddxVk08";
const GOOGLE_MAPS_URL = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;

const DynamicMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        await loadScript(GOOGLE_MAPS_URL);

        if (!mapRef.current || !window.google) {
          throw new Error("Failed to initialize map");
        }

        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 37.7749, lng: -122.4194 },
          zoom: 12,
          styles: [{ featureType: "all", elementType: "all", stylers: [{ saturation: -100 }] }],
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          backgroundColor: "#f3f4f6",
        });

        new window.google.maps.Marker({
          position: { lat: 37.7749, lng: -122.4194 },
          map,
          title: "Current Location"
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading map:", error);
        setLoadError(error instanceof Error ? error.message : "Failed to load map");
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      const script = document.querySelector(`script[src="${GOOGLE_MAPS_URL}"]`);
      if (script) {
        script.remove();
      }
    };
  }, []);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <p className="text-red-500 font-medium mb-2">Failed to load map</p>
          <p className="text-gray-600 text-sm">{loadError}</p>
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

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
};

export default DynamicMap;
