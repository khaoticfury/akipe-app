const axios = require('axios');
const Restaurant = require('./models/restaurant');

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Function to fetch restaurants from Google Places API and save to DB
async function fetchAndSaveRestaurants(location = '-12.0464,-77.0428', radius = 5000, type = 'restaurant') {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await axios.get(url);
    const places = response.data.results;

    for (const place of places) {
      const filter = { place_id: place.place_id };
      const update = {
        place_id: place.place_id,
        name: place.name,
        address: place.vicinity,
        location: place.geometry.location,
        rating: place.rating || null,
        user_ratings_total: place.user_ratings_total || null,
        types: place.types || [],
        photos: place.photos || [],
        opening_hours: place.opening_hours || null,
      };
      await Restaurant.findOneAndUpdate(filter, update, { upsert: true, new: true });
    }

    console.log(`Fetched and saved ${places.length} restaurants.`);
  } catch (error) {
    console.error('Error fetching restaurants:', error.message);
  }
}

module.exports = fetchAndSaveRestaurants;
