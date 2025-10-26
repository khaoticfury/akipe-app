'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { Restaurant, MapCenter, SearchFilters } from '@/app/types'
import { RestaurantCard } from './RestaurantCard'
import { SearchFilters as SearchFiltersComponent } from './SearchFilters'

const DEFAULT_CENTER: MapCenter = { lat: 19.4326, lng: -99.1332 } // Mexico City

export function GoogleMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [userLocation, setUserLocation] = useState<MapCenter | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    radius: 1000,
    type: 'restaurant',
    openNow: false
  })

  // Initialize Google Maps
  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places', 'marker']
    })

    try {
      const google = await loader.load()
      const center = userLocation || DEFAULT_CENTER

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 15,
        mapId: 'restaurant-finder-map',
        styles: [
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      mapInstanceRef.current = map
      serviceRef.current = new google.maps.places.PlacesService(map)

      // Add user location marker if available
      if (userLocation) {
        new google.maps.marker.AdvancedMarkerElement({
          position: userLocation,
          map,
          title: 'Tu ubicación',
        })
      }

      // Search for restaurants initially
      searchRestaurants(center)
    } catch (error) {
      console.error('Error loading Google Maps:', error)
    }
  }, [userLocation])

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setUserLocation(location)
      },
      (error) => {
        console.warn('Error getting user location:', error)
        // Use default location if geolocation fails
      }
    )
  }, [])

  // Search for restaurants
  const searchRestaurants = useCallback((center: MapCenter) => {
    if (!serviceRef.current) return

    setIsLoading(true)
    clearMarkers()

    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(center.lat, center.lng),
      radius: filters.radius,
      type: filters.type,
      ...(filters.openNow && { openNow: filters.openNow }),
      ...(filters.minRating && { minPriceLevel: filters.minRating })
    }

    serviceRef.current.nearbySearch(request, (results, status) => {
      setIsLoading(false)
      
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        let filteredResults = results.filter(place => 
          place.name && 
          place.geometry?.location &&
          place.business_status !== 'CLOSED_PERMANENTLY'
        )

        // Apply rating filter
        if (filters.minRating) {
          filteredResults = filteredResults.filter(place => 
            place.rating && place.rating >= filters.minRating!
          )
        }

        // Apply price level filter
        if (filters.priceLevel && filters.priceLevel.length > 0) {
          filteredResults = filteredResults.filter(place =>
            place.price_level !== undefined && 
            filters.priceLevel!.includes(place.price_level)
          )
        }

        const restaurantData: Restaurant[] = filteredResults.map(place => ({
          place_id: place.place_id || '',
          name: place.name || '',
          rating: place.rating,
          vicinity: place.vicinity || '',
          price_level: place.price_level,
          photos: place.photos,
          geometry: {
            location: place.geometry!.location!
          },
          types: place.types || [],
          business_status: place.business_status,
          opening_hours: place.opening_hours
        }))

        setRestaurants(restaurantData)
        addMarkersToMap(restaurantData)
      }
    })
  }, [filters])

  // Add markers to map
  const addMarkersToMap = useCallback((restaurants: Restaurant[]) => {
    if (!mapInstanceRef.current) return

    restaurants.forEach((restaurant) => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: restaurant.geometry.location,
        map: mapInstanceRef.current!,
        title: restaurant.name,
      })

      marker.addListener('click', () => {
        setSelectedRestaurant(restaurant)
      })

      markersRef.current.push(marker)
    })
  }, [])

  // Clear existing markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      marker.map = null
    })
    markersRef.current = []
  }, [])

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters)
    const center = userLocation || DEFAULT_CENTER
    searchRestaurants(center)
  }, [userLocation, searchRestaurants])

  // Handle restaurant selection
  const handleRestaurantSelect = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(restaurant.geometry.location)
      mapInstanceRef.current.setZoom(17)
    }
  }, [])

  useEffect(() => {
    getUserLocation()
  }, [getUserLocation])

  useEffect(() => {
    if (mapRef.current) {
      initializeMap()
    }
  }, [initializeMap])

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Map container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full min-h-[400px] rounded-lg" />
        
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-lg">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Buscando restaurantes...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 bg-white rounded-lg shadow-lg p-4 max-h-[600px] overflow-y-auto">
        <SearchFiltersComponent filters={filters} onFiltersChange={handleFiltersChange} />
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">
            Restaurantes encontrados ({restaurants.length})
          </h3>
          
          <div className="space-y-3">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.place_id}
                restaurant={restaurant}
                isSelected={selectedRestaurant?.place_id === restaurant.place_id}
                onClick={() => handleRestaurantSelect(restaurant)}
              />
            ))}
          </div>
          
          {restaurants.length === 0 && !isLoading && (
            <p className="text-gray-500 text-center py-8">
              No se encontraron restaurantes en esta área.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
