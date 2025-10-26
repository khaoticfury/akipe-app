import { useState, useEffect, useMemo } from 'react';
import { Restaurant } from '../types/restaurant';
import { restaurantDatabase } from '../data/restaurantDatabase';
import { getGooglePlacesService } from '../services/googlePlacesService';

interface UseRestaurantsProps {
  searchQuery?: string;
  selectedRadius?: number;
  userLocation?: { latitude: number; longitude: number };
  groupType?: string;
  priceRange?: { min: number; max: number };
}

export const useRestaurants = ({
  searchQuery,
  selectedRadius,
  userLocation,
  groupType,
  priceRange
}: UseRestaurantsProps) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleServiceInitialized, setGoogleServiceInitialized] = useState(false);

  // Initialize Google Places service
  useEffect(() => {
    const initializeGooglePlaces = async () => {
      // Check if Google Maps is loaded
      if (!window.google || !window.google.maps) {
        console.error('Google Maps not loaded, cannot fetch restaurants');
        setError('Google Maps not loaded');
        return;
      }

      try {
        const service = getGooglePlacesService();
        await service.initialize();
        setGoogleServiceInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Google Places service:', err);
        setError('Failed to initialize Google Places service');
      }
    };

    initializeGooglePlaces();
  }, []);

  // Fetch restaurants from Google Places API
  useEffect(() => {
    const fetchRestaurants = async () => {
      // Use userLocation if available, otherwise use default Lima location
      const locationToUse = userLocation || { latitude: -12.0464, longitude: -77.0428 };

      if (!googleServiceInitialized) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const service = getGooglePlacesService();
        // Use a large radius to get all restaurants by default, or the selected radius if filtered
        const radiusToUse = selectedRadius || 100000; // 100km to cover all of Lima
        const googleRestaurants = await service.searchNearbyRestaurants(
          locationToUse,
          radiusToUse
        );

        // Use only Google restaurants
        const allRestaurants = googleRestaurants;
        setRestaurants(allRestaurants);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError('Error al cargar restaurantes');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [userLocation, selectedRadius, googleServiceInitialized]);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter and sort restaurants
  const filteredRestaurants = useMemo(() => {
    let filtered = [...restaurants];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(restaurant => 
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.district.toLowerCase().includes(query) ||
        restaurant.type_of_cuisine.toLowerCase().includes(query)
      );
    }

    // Distance filter (if radius is selected)
    if (selectedRadius && userLocation) {
      filtered = filtered.filter(restaurant => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          restaurant.gps_coordinates.latitude,
          restaurant.gps_coordinates.longitude
        );
        return distance <= selectedRadius;
      });
    }

    // Group type filter
    if (groupType) {
      filtered = filtered.filter(restaurant => 
        restaurant.group_friendly[groupType as keyof typeof restaurant.group_friendly]
      );
    }

    // Price range filter
    if (priceRange) {
      filtered = filtered.filter(restaurant =>
        restaurant.price_range.min >= priceRange.min &&
        restaurant.price_range.max <= priceRange.max
      );
    }

    // Sort by distance from user location (nearest first)
    if (userLocation) {
      filtered.sort((a, b) => {
        const distanceA = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          a.gps_coordinates.latitude,
          a.gps_coordinates.longitude
        );
        const distanceB = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          b.gps_coordinates.latitude,
          b.gps_coordinates.longitude
        );
        return distanceA - distanceB;
      });
    }

    return filtered;
  }, [restaurants, searchQuery, selectedRadius, userLocation, groupType, priceRange]);

  // Get search suggestions with distance-based ordering
  const getSearchSuggestions = (query: string, userLocation?: { latitude: number; longitude: number }): Restaurant[] => {
    if (!query) return [];

    let suggestions = restaurants.filter(restaurant =>
      restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
      restaurant.district.toLowerCase().includes(query.toLowerCase()) ||
      restaurant.type_of_cuisine.toLowerCase().includes(query.toLowerCase())
    );

    // Sort suggestions by distance from user location (closest first)
    if (userLocation && suggestions.length > 0) {
      suggestions.sort((a, b) => {
        const distanceA = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          a.gps_coordinates.latitude,
          a.gps_coordinates.longitude
        );
        const distanceB = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          b.gps_coordinates.latitude,
          b.gps_coordinates.longitude
        );
        return distanceA - distanceB;
      });
    }

    return suggestions.slice(0, 8); // Return top 8 suggestions
  };

  // Add new restaurant
  const addRestaurant = async (newRestaurant: Omit<Restaurant, 'id' | 'date_added'>) => {
    try {
      setLoading(true);
      const restaurant: Restaurant = {
        ...newRestaurant,
        id: String(restaurants.length + 1),
        date_added: new Date().toISOString()
      };
      
      setRestaurants(prev => [...prev, restaurant]);
      setLoading(false);
    } catch (err) {
      setError('Failed to add restaurant');
      setLoading(false);
    }
  };

  // Get restaurant by ID
  const getRestaurantById = (id: string): Restaurant | undefined => {
    return restaurants.find(restaurant => restaurant.id === id);
  };

  return {
    restaurants: filteredRestaurants,
    loading,
    error,
    getSearchSuggestions,
    addRestaurant,
    getRestaurantById
  };
};
