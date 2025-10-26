"use client";

import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google: any;
  }
}

const SimpleMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadMap = () => {
      if (mapRef.current && window.google) {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
          zoom: 12,
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
        });

        new window.google.maps.Marker({
          position: { lat: 37.7749, lng: -122.4194 },
          map,
          title: "Current Location"
        });

        setIsLoading(false);
      }
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCHVLloyILVDoB_EMeiFHnaJ8pOddxVk08`;
    script.async = true;
    script.onload = loadMap;
    script.onerror = () => {
      setLoadError("Failed to load Google Maps");
      setIsLoading(false);
    };

    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      document.head.appendChild(script);
    } else {
      loadMap();
    }

    return () => {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <p className="text-red-500 font-medium mb-2">Failed to load Google Maps</p>
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

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-lg"
    />
  );
};

export default SimpleMap;
