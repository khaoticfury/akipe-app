import axios from 'axios';

interface RestaurantData {
  name: string;
  address: string;
  district: string;
  gps_coordinates: {
    latitude: number;
    longitude: number;
  };
  type_of_cuisine?: string;
  category?: string;
}

const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY'; // Replace with your API key

// Bounding boxes for all 43 districts of Lima (example coordinates, should be accurate)
const limaDistrictBounds = [
  { district: 'Ancón', north: -11.75, south: -11.80, east: -77.15, west: -77.20 },
  { district: 'Ate', north: -12.00, south: -12.05, east: -76.90, west: -76.95 },
  { district: 'Barranco', north: -12.13, south: -12.15, east: -77.00, west: -77.03 },
  // ... add all other districts with accurate bounding boxes
];

// Helper function to check if two restaurants are duplicates based on name and location proximity
function isDuplicate(r1: RestaurantData, r2: RestaurantData): boolean {
  const distanceThreshold = 0.05; // approx 50 meters in degrees
  const sameName = r1.name.toLowerCase() === r2.name.toLowerCase();
  const latDiff = Math.abs(r1.gps_coordinates.latitude - r2.gps_coordinates.latitude);
  const lngDiff = Math.abs(r1.gps_coordinates.longitude - r2.gps_coordinates.longitude);
  return sameName && latDiff < distanceThreshold && lngDiff < distanceThreshold;
}

// Fetch restaurants from Google Places API for a given district bounding box and radius
export async function fetchRestaurantsByDistrict(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}, radiusKm: number): Promise<RestaurantData[]> {
  const { north, south, east, west } = bounds;
  const location = `${(north + south) / 2},${(east + west) / 2}`;
  const radius = radiusKm * 1000; // convert km to meters

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`;

  try {
    const response = await axios.get(url);
    const places = response.data.results;

    const restaurants: RestaurantData[] = places.map((place: any) => ({
      name: place.name,
      address: place.vicinity,
      district: '', // To be filled based on reverse geocoding or external data
      gps_coordinates: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      },
      type_of_cuisine: place.types ? place.types[0] : 'restaurant',
      category: 'general',
    }));

    return restaurants;
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return [];
  }
}

// Fetch all restaurants for all districts with given radius, avoiding duplicates
export async function fetchAllLimaRestaurants(radiusKm: number): Promise<RestaurantData[]> {
  let allRestaurants: RestaurantData[] = [];

  for (const districtBounds of limaDistrictBounds) {
    const districtRestaurants = await fetchRestaurantsByDistrict(
      {
        north: districtBounds.north,
        south: districtBounds.south,
        east: districtBounds.east,
        west: districtBounds.west,
      },
      radiusKm
    );

    // Assign district name to each restaurant (could be improved with reverse geocoding)
    districtRestaurants.forEach((r) => (r.district = districtBounds.district));

    // Filter duplicates
    districtRestaurants.forEach((newR) => {
      const duplicate = allRestaurants.find((existingR) => isDuplicate(existingR, newR));
      if (!duplicate) {
        allRestaurants.push(newR);
      }
    });
  }

  return allRestaurants;
}
