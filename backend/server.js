const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/akipe';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyBqTXBlDlviimIzwCGoOtda0tVI9h5Matg';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Restaurant Schema
const restaurantSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  address: String,
  district: String,
  type_of_cuisine: String,
  gps_coordinates: {
    latitude: Number,
    longitude: Number
  },
  opening_hours: String,
  rating: Number,
  price_range: {
    min: Number,
    max: Number,
    currency: String
  },
  category: String,
  date_added: Date,
  wait_time: String,
  group_friendly: {
    solo: Boolean,
    couple: Boolean,
    family: Boolean,
    large_group: Boolean
  }
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

// Routes

// Get all restaurants
app.get('/api/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a restaurant
app.post('/api/restaurants', async (req, res) => {
  try {
    const restaurant = new Restaurant(req.body);
    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch restaurants from Google Places and add to database
app.post('/api/restaurants/fetch-from-google', async (req, res) => {
  try {
    const { location, radius = 50000 } = req.body;

    // Define search centers for Lima
    const searchCenters = [
      { lat: -12.0464, lng: -77.0428 }, // Lima center
      { lat: -12.0564, lng: -77.0528 }, // Miraflores
      { lat: -12.0364, lng: -77.0328 }, // San Isidro
      { lat: -12.0664, lng: -77.0628 }, // Barranco
      { lat: -12.0264, lng: -77.0228 }, // La Molina
      { lat: -12.0764, lng: -77.0728 }, // Surco
    ];

    const allRestaurants = [];

    for (const center of searchCenters) {
      try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
          params: {
            location: `${center.lat},${center.lng}`,
            radius: radius,
            type: 'restaurant',
            key: GOOGLE_MAPS_API_KEY
          }
        });

        if (response.data.results) {
          const restaurants = response.data.results.map((place, index) => ({
            id: place.place_id || `google-${index}`,
            name: place.name,
            address: place.vicinity,
            district: extractDistrict(place.vicinity),
            type_of_cuisine: getCuisineType(place.types || []),
            gps_coordinates: {
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng
            },
            opening_hours: place.opening_hours ? place.opening_hours.weekday_text.join(', ') : 'Horarios no disponibles',
            rating: place.rating || 0,
            price_range: convertPriceLevel(place.price_level),
            category: getCategory(place.types || []),
            date_added: new Date(),
            wait_time: 'Tiempo variable',
            group_friendly: {
              solo: true,
              couple: true,
              family: true,
              large_group: true
            }
          }));

          allRestaurants.push(...restaurants);
        }
      } catch (err) {
        console.warn('Error fetching from Google Places:', err);
      }
    }

    // Remove duplicates and save to database
    const uniqueRestaurants = allRestaurants.filter((restaurant, index, self) =>
      index === self.findIndex(r => r.id === restaurant.id)
    );

    for (const restaurant of uniqueRestaurants) {
      try {
        await Restaurant.findOneAndUpdate({ id: restaurant.id }, restaurant, { upsert: true });
      } catch (err) {
        console.warn('Error saving restaurant:', err);
      }
    }

    res.json({ message: `Added ${uniqueRestaurants.length} restaurants to database` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function extractDistrict(address) {
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

function getCuisineType(types) {
  const cuisineMap = {
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

function convertPriceLevel(priceLevel) {
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

function getCategory(types) {
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

// Start server
app.listen(PORT, 'localhost', () => {
  console.log(`Server running on localhost:${PORT}`);
});
