export interface Restaurant {
  place_id: string
  name: string
  rating?: number
  vicinity: string
  price_level?: number
  photos?: google.maps.places.PlacePhoto[]
  geometry: {
    location: google.maps.LatLng
  }
  types: string[]
  business_status?: string
  opening_hours?: {
    open_now?: boolean
  }
}

export interface MapCenter {
  lat: number
  lng: number
}

export interface SearchFilters {
  radius: number
  type: string
  minRating?: number
  priceLevel?: number[]
  openNow?: boolean
}
