import { Restaurant } from '../types/restaurant';

interface GooglePlacesConfig {
  apiKey: string;
  radius: number;
  type: string;
}

export class GooglePlacesService {
  private placesService: google.maps.places.PlacesService | null = null;
  private config: GooglePlacesConfig;

  constructor(config: GooglePlacesConfig) {
    this.config = config;
  }

  initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.marker) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      try {
        // Create a temporary map for PlacesService
        const mapDiv = document.createElement('div');
        const map = new window.google.maps.Map(mapDiv, {
          center: { lat: -12.0464, lng: -77.0428 }, // Lima center
          zoom: 13
        });

        this.placesService = new window.google.maps.places.PlacesService(map);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async searchNearbyRestaurants(
    location: { latitude: number; longitude: number },
    radius?: number
  ): Promise<Restaurant[]> {
    if (!this.placesService) {
      throw new Error('Places service not initialized');
    }

    // Use text search for broader coverage of Lima
    return new Promise((resolve, reject) => {
      const request = {
        query: 'restaurants in Lima, Peru',
        fields: ['displayName', 'formattedAddress', 'location', 'rating', 'priceLevel', 'openingHours', 'types', 'id', 'userRatingCount', 'priceRange'],
        locationBias: {
          center: { lat: -12.0464, lng: -77.0428 },
          radius: 100000 // 100km to cover all of Lima
        }
      };

      const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
      placesService.textSearch(request, (results: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const restaurants: Restaurant[] = results.map((place: any, index: number) => {
            // Get district from address
            const district = this.extractDistrict(place.formattedAddress || '');

            // Convert price level to price range
            const priceRange = this.convertPriceLevel(place.priceLevel);

            // Convert opening hours
            const openingHours = place.openingHours?.weekdayDescriptions?.join(', ') || 'Horarios no disponibles';

            return {
              id: place.id || `google-${index}`,
              name: place.displayName?.text || 'Restaurant',
              address: place.formattedAddress || 'Dirección no disponible',
              district: district,
              type_of_cuisine: this.getCuisineType(place.types || []),
              gps_coordinates: {
                latitude: place.location?.lat() || 0,
                longitude: place.location?.lng() || 0
              },
              opening_hours: openingHours,
              rating: place.rating || 0,
              price_range: priceRange,
              category: this.getCategory(place.types || []),
              date_added: new Date().toISOString(),
              wait_time: 'Tiempo variable',
              group_friendly: {
                solo: true,
                couple: true,
                family: true,
                large_group: true
              }
            };
          });

          resolve(restaurants);
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Places API error: ${status}`));
        }
      });
    });
  }

  private async performSearch(location: { lat: number; lng: number }, radius: number): Promise<Restaurant[]> {
    return new Promise((resolve, reject) => {
      // Use the old Places API for better compatibility
      const request = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius: radius,
        type: 'restaurant'
      };

      const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
      placesService.nearbySearch(request, (results: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const restaurants: Restaurant[] = results.map((place: any, index: number) => {
            // Get district from address
            const district = this.extractDistrict(place.vicinity || '');

            // Convert price level to price range
            const priceRange = this.convertPriceLevel(place.price_level);

            // Convert opening hours
            const openingHours = place.opening_hours ? place.opening_hours.weekday_text.join(', ') : 'Horarios no disponibles';

            return {
              id: place.place_id || `google-${index}`,
              name: place.name,
              address: place.vicinity,
              district: district,
              type_of_cuisine: this.getCuisineType(place.types || []),
              gps_coordinates: {
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng()
              },
              opening_hours: openingHours,
              rating: place.rating || 0,
              price_range: priceRange,
              category: this.getCategory(place.types || []),
              date_added: new Date().toISOString(),
              wait_time: 'Tiempo variable',
              group_friendly: {
                solo: true,
                couple: true,
                family: true,
                large_group: true
              }
            };
          });

          resolve(restaurants);
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Places API error: ${status}`));
        }
      });
    });
  }

  private extractDistrict(address: string): string {
    const districts = [
      'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo',
      'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia',
      'Jesús María', 'La Molina', 'La Victoria', 'Lima', 'Lince',
      'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar', 'Miraflores',
      'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa',
      'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro',
      'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis',
      'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar',
      'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador',
      'Villa María del Triunfo'
    ];

    for (const district of districts) {
      if (address.toLowerCase().includes(district.toLowerCase())) {
        return district;
      }
    }

    return 'Lima';
  }

  private getCuisineType(types: string[]): string {
    const cuisineMap: { [key: string]: string } = {
      'restaurant': 'Restaurante',
      'food': 'Comida',
      'bar': 'Bar',
      'cafe': 'Café',
      'bakery': 'Panadería',
      'meal_takeaway': 'Para llevar',
      'meal_delivery': 'Delivery'
    };

    for (const type of types) {
      if (cuisineMap[type]) {
        return cuisineMap[type];
      }
    }

    return 'Restaurante';
  }

  private convertPriceLevel(priceLevel?: number): { min: number; max: number; currency: string } {
    const priceRanges = [
      { min: 0, max: 15, currency: 'S/' },
      { min: 15, max: 35, currency: 'S/' },
      { min: 35, max: 70, currency: 'S/' },
      { min: 70, max: 150, currency: 'S/' },
      { min: 150, max: 500, currency: 'S/' }
    ];

    const level = priceLevel || 0;
    return priceRanges[Math.min(level, priceRanges.length - 1)] || priceRanges[1];
  }

  private getCategory(types: string[]): 'local' | 'fast_food' | 'gourmet' | 'street_food' | 'cafe' | 'bakery' {
    if (types.includes('bar') || types.includes('night_club')) {
      return 'local';
    }
    if (types.includes('fast_food_restaurant') || types.includes('meal_takeaway')) {
      return 'fast_food';
    }
    if (types.includes('fine_dining') || types.includes('restaurant')) {
      return 'gourmet';
    }
    if (types.includes('street_food_vendor')) {
      return 'street_food';
    }
    if (types.includes('cafe') || types.includes('coffee_shop')) {
      return 'cafe';
    }
    if (types.includes('bakery')) {
      return 'bakery';
    }

    return 'local';
  }
}

// Singleton instance
let googlePlacesService: GooglePlacesService | null = null;

export const getGooglePlacesService = (): GooglePlacesService => {
  if (!googlePlacesService) {
    googlePlacesService = new GooglePlacesService({
      apiKey: 'AIzaSyBqTXBlDlviimIzwCGoOtda0tVI9h5Matg',
      radius: 50000,
      type: 'restaurant'
    });
  }
  return googlePlacesService;
};
