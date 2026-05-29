import { Restaurant } from "../types/restaurant";

interface GooglePlacesConfig {
  apiKey: string;
  radius: number;
  type: string;
}

type GooglePlaceResult = google.maps.places.PlaceResult;

export class GooglePlacesService {
  private placesService: google.maps.places.PlacesService | null = null;
  private config: GooglePlacesConfig;
  private initialized = false;

  constructor(config: GooglePlacesConfig) {
    this.config = config;
  }

  private waitForGoogleMapsPlaces(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30;

      const check = () => {
        if (
          typeof window !== "undefined" &&
          window.google &&
          window.google.maps &&
          window.google.maps.places
        ) {
          resolve();
          return;
        }

        attempts++;

        if (attempts >= maxAttempts) {
          reject(
            new Error(
              "Google Maps Places not loaded. Revisa que el script cargue con libraries=places."
            )
          );
          return;
        }

        setTimeout(check, 300);
      };

      check();
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized && this.placesService) {
      return;
    }

    await this.waitForGoogleMapsPlaces();

    const mapDiv = document.createElement("div");

    const map = new window.google.maps.Map(mapDiv, {
      center: { lat: -12.0464, lng: -77.0428 },
      zoom: 13,
    });

    this.placesService = new window.google.maps.places.PlacesService(map);
    this.initialized = true;
  }

  async searchNearbyRestaurants(
    location: { latitude: number; longitude: number },
    radius?: number
  ): Promise<Restaurant[]> {
    if (!this.placesService) {
      await this.initialize();
    }

    if (!this.placesService) {
      throw new Error("Places service not initialized");
    }

    const searchRadius = radius ?? this.config.radius;

    return this.performSearch(
      {
        lat: location.latitude,
        lng: location.longitude,
      },
      searchRadius
    );
  }

  private async performSearch(
    location: { lat: number; lng: number },
    radius: number
  ): Promise<Restaurant[]> {
    if (!this.placesService) {
      throw new Error("Places service not initialized");
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius,
        type: "restaurant",
      };

      this.placesService!.nearbySearch(request, (results, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          results
        ) {
          const restaurants = results.map((place, index) =>
            this.convertGooglePlaceToRestaurant(place, index)
          );

          resolve(restaurants);
          return;
        }

        if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
          return;
        }

        reject(new Error(`Places API error: ${status}`));
      });
    });
  }

  async searchRestaurantsByText(
    query: string,
    location?: { latitude: number; longitude: number },
    radius?: number
  ): Promise<Restaurant[]> {
    if (!this.placesService) {
      await this.initialize();
    }

    if (!this.placesService) {
      throw new Error("Places service not initialized");
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.TextSearchRequest = {
        query: query || "restaurants in Lima, Peru",
      };

      if (location) {
        request.location = new window.google.maps.LatLng(
          location.latitude,
          location.longitude
        );
        request.radius = radius ?? this.config.radius;
      }

      this.placesService!.textSearch(request, (results, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          results
        ) {
          const restaurants = results.map((place, index) =>
            this.convertGooglePlaceToRestaurant(place, index)
          );

          resolve(restaurants);
          return;
        }

        if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
          return;
        }

        reject(new Error(`Places API error: ${status}`));
      });
    });
  }

  private convertGooglePlaceToRestaurant(
    place: GooglePlaceResult,
    index: number
  ): Restaurant {
    const address = place.vicinity || place.formatted_address || "Dirección no disponible";
    const district = this.extractDistrict(address);
    const types = place.types || [];

    return {
      id: place.place_id || `google-${index}`,
      name: place.name || "Restaurante",
      address,
      district,
      type_of_cuisine: this.getCuisineType(types),
      gps_coordinates: {
        latitude: place.geometry?.location?.lat() || 0,
        longitude: place.geometry?.location?.lng() || 0,
      },
      opening_hours:
        place.opening_hours?.weekday_text?.join(", ") || "Horarios no disponibles",
      rating: place.rating || 0,
      price_range: this.convertPriceLevel(place.price_level),
      category: this.getCategory(types),
      date_added: new Date().toISOString(),
      wait_time: "Tiempo variable",
      group_friendly: {
        solo: true,
        couple: true,
        family: true,
        large_group: true,
      },
    };
  }

  private extractDistrict(address: string): string {
    const districts = [
      "Ancón",
      "Ate",
      "Barranco",
      "Breña",
      "Carabayllo",
      "Chaclacayo",
      "Chorrillos",
      "Cieneguilla",
      "Comas",
      "El Agustino",
      "Independencia",
      "Jesús María",
      "La Molina",
      "La Victoria",
      "Lima",
      "Lince",
      "Los Olivos",
      "Lurigancho",
      "Lurín",
      "Magdalena del Mar",
      "Miraflores",
      "Pachacámac",
      "Pucusana",
      "Pueblo Libre",
      "Puente Piedra",
      "Punta Hermosa",
      "Punta Negra",
      "Rímac",
      "San Bartolo",
      "San Borja",
      "San Isidro",
      "San Juan de Lurigancho",
      "San Juan de Miraflores",
      "San Luis",
      "San Martín de Porres",
      "San Miguel",
      "Santa Anita",
      "Santa María del Mar",
      "Santa Rosa",
      "Santiago de Surco",
      "Surquillo",
      "Villa El Salvador",
      "Villa María del Triunfo",
    ];

    const normalizedAddress = address.toLowerCase();

    for (const district of districts) {
      if (normalizedAddress.includes(district.toLowerCase())) {
        return district;
      }
    }

    return "Lima";
  }

  private getCuisineType(types: string[]): string {
    const cuisineMap: Record<string, string> = {
      restaurant: "Restaurante",
      food: "Comida",
      bar: "Bar",
      cafe: "Café",
      bakery: "Panadería",
      meal_takeaway: "Para llevar",
      meal_delivery: "Delivery",
    };

    for (const type of types) {
      if (cuisineMap[type]) {
        return cuisineMap[type];
      }
    }

    return "Restaurante";
  }

  private convertPriceLevel(
    priceLevel?: number
  ): { min: number; max: number; currency: string } {
    const priceRanges = [
      { min: 0, max: 15, currency: "S/" },
      { min: 15, max: 35, currency: "S/" },
      { min: 35, max: 70, currency: "S/" },
      { min: 70, max: 150, currency: "S/" },
      { min: 150, max: 500, currency: "S/" },
    ];

    const level = priceLevel ?? 1;

    return priceRanges[Math.min(level, priceRanges.length - 1)] || priceRanges[1];
  }

  private getCategory(
    types: string[]
  ): "local" | "fast_food" | "gourmet" | "street_food" | "cafe" | "bakery" {
    if (types.includes("bar") || types.includes("night_club")) {
      return "local";
    }

    if (types.includes("fast_food_restaurant") || types.includes("meal_takeaway")) {
      return "fast_food";
    }

    if (types.includes("cafe") || types.includes("coffee_shop")) {
      return "cafe";
    }

    if (types.includes("bakery")) {
      return "bakery";
    }

    if (types.includes("street_food_vendor")) {
      return "street_food";
    }

    if (types.includes("restaurant") || types.includes("food")) {
      return "gourmet";
    }

    return "local";
  }
}

let googlePlacesService: GooglePlacesService | null = null;

export const getGooglePlacesService = (): GooglePlacesService => {
  if (!googlePlacesService) {
    googlePlacesService = new GooglePlacesService({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      radius: 50000,
      type: "restaurant",
    });
  }

  return googlePlacesService;
};