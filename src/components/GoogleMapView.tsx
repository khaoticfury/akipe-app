"use client";

import React, { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface MapViewProps {
  center?: google.maps.LatLngLiteral;
  zoom?: number;
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 37.7749,    // Default latitude (San Francisco)
  lng: -122.4194,  // Default longitude
};

const mapOptions = {
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
};

const GoogleMapView: React.FC<MapViewProps> = ({ center = defaultCenter, zoom = 12 }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<Error | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const loader = new Loader({
      apiKey: "AIzaSyCHVLloyILVDoB_EMeiFHnaJ8pOddxVk08",
      version: "weekly",
      libraries: ["places"]
    });

    loader
      .load()
      .then((google) => {
        new google.maps.Map(mapRef.current!, {
          center,
          zoom,
          ...mapOptions
        });
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error loading Google Maps:", error);
        setLoadError(error);
        setIsLoading(false);
      });
  }, [center, zoom]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-4">
          <p className="text-red-500 font-medium mb-2">Failed to load Google Maps</p>
          <p className="text-gray-600 text-sm">Please check your API key and try again</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} style={containerStyle} className="rounded-lg" />;
};

export default GoogleMapView;
