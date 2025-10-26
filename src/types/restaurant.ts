export interface Restaurant {
  id: string;
  name: string;
  address: string;
  district: string;
  type_of_cuisine: string;
  gps_coordinates: {
    latitude: number;
    longitude: number;
  };
  opening_hours: string;
  contact_number?: string;
  social_links?: {
    website?: string;
    instagram?: string;
    facebook?: string;
  };
  price_range: {
    min: number;
    max: number;
    currency: string;
  };
  category: 'local' | 'fast_food' | 'gourmet' | 'street_food' | 'cafe' | 'bakery';
  date_added: string;
  added_by_user_id?: string;
  rating: number;
  wait_time: string;
  seating_capacity?: number;
  group_friendly: {
    solo: boolean;
    couple: boolean;
    family: boolean;
    large_group: boolean;
  };
}

export interface GroupType {
  id: string;
  label: string;
  icon: string;
}

export interface PriceRange {
  min: number;
  max: number;
  label: string;
}
