import { useMemo } from 'react';
import { Restaurant } from '../types/restaurant';

interface UseRestaurantFiltersProps {
  restaurants: Restaurant[];
  userLocation: { latitude: number; longitude: number } | null;
  selectedRadius?: number | null;
}

export const useRestaurantFilters = ({
  restaurants,
  userLocation,
  selectedRadius
}: UseRestaurantFiltersProps) => {
  const filteredAndSortedRestaurants = useMemo(() => {
    if (!userLocation || typeof window === 'undefined' || !window.google) {
      return [];
    }

    const userLatLng = new window.google.maps.LatLng(
      userLocation.latitude,
      userLocation.longitude
    );

    return restaurants
      .filter(restaurant => {
        const restaurantLatLng = new window.google.maps.LatLng(
          restaurant.gps_coordinates.latitude,
          restaurant.gps_coordinates.longitude
        );
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          userLatLng,
          restaurantLatLng
        );
        return distance <= (selectedRadius || 10000); // use selectedRadius or default 10km
      })
      .sort((a, b) => {
        const aLatLng = new window.google.maps.LatLng(
          a.gps_coordinates.latitude,
          a.gps_coordinates.longitude
        );
        const bLatLng = new window.google.maps.LatLng(
          b.gps_coordinates.latitude,
          b.gps_coordinates.longitude
        );
        const distA = window.google.maps.geometry.spherical.computeDistanceBetween(
          userLatLng,
          aLatLng
        );
        const distB = window.google.maps.geometry.spherical.computeDistanceBetween(
          userLatLng,
          bLatLng
        );
        return distA - distB;
      });
  }, [restaurants, userLocation, selectedRadius]);

  const isLoading = restaurants.length === 0 && !userLocation;
  const hasError = !userLocation && restaurants.length === 0;

  return {
    filteredRestaurants: filteredAndSortedRestaurants,
    isLoading,
    hasError,
    totalCount: filteredAndSortedRestaurants.length
  };
};
