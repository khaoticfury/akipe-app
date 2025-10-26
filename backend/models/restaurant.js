const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  place_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  rating: { type: Number },
  user_ratings_total: { type: Number },
  types: { type: [String] },
  photos: { type: [Object] },
  opening_hours: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);
