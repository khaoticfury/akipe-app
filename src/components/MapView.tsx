"use client";

import React from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

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

const MapView: React.FC<MapViewProps> = ({ center = defaultCenter, zoom = 12 }) => {
  const [loadError, setLoadError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const handleMapError = (error: Error) => {
    console.error("Error loading Google Maps:", error);
    setLoadError(error);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

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

  return (
    <LoadScript
      googleMapsApiKey="AIzaSyCHVLloyILVDoB_EMeiFHnaJ8pOddxVk08"
      onLoad={handleLoad}
      onError={handleMapError}
      loadingElement={
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Google Maps...</p>
          </div>
        </div>
      }
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        options={mapOptions}
      >
      </GoogleMap>
    </LoadScript>
  );
};

export default MapView;
