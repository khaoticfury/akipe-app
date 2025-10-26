"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Navigation, Star, Clock, Car, User } from 'lucide-react';

interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  distance: number;
  walkTime: number;
  driveTime: number;
  isOpen: boolean;
  address: string;
  district: string;
  image: string;
  coordinates: { lat: number; lng: number };
}

const nearbyRestaurants: Restaurant[] = [
  {
    id: 1,
    name: "La Mar",
    cuisine: "Cevichería",
    rating: 4.8,
    priceRange: "$$$$",
    distance: 0.8,
    walkTime: 10,
    driveTime: 3,
    isOpen: true,
    address: "Av. La Mar 770",
    district: "Miraflores",
    image: "/api/placeholder/300/200",
    coordinates: { lat: -12.1203, lng: -77.0267 }
  },
  {
    id: 2,
    name: "Central",
    cuisine: "Alta Cocina Peruana",
    rating: 4.9,
    priceRange: "$$$$$",
    distance: 2.1,
    walkTime: 25,
    driveTime: 8,
    isOpen: true,
    address: "Av. Pedro de Osma 301",
    district: "Barranco",
    image: "/api/placeholder/300/200",
    coordinates: { lat: -12.1467, lng: -77.0208 }
  },
  {
    id: 3,
    name: "Maido",
    cuisine: "Nikkei",
    rating: 4.7,
    priceRange: "$$$$$",
    distance: 1.2,
    walkTime: 15,
    driveTime: 5,
    isOpen: false,
    address: "Calle San Martin 399",
    district: "Miraflores",
    image: "/api/placeholder/300/200",
    coordinates: { lat: -12.1198, lng: -77.0289 }
  },
  {
    id: 4,
    name: "El Mercado",
    cuisine: "Pescados y Mariscos",
    rating: 4.5,
    priceRange: "$$$",
    distance: 0.5,
    walkTime: 6,
    driveTime: 2,
    isOpen: true,
    address: "Hipólito Unanue 203",
    district: "Miraflores",
    image: "/api/placeholder/300/200",
    coordinates: { lat: -12.1189, lng: -77.0278 }
  },
  {
    id: 5,
    name: "Isolina",
    cuisine: "Criolla",
    rating: 4.6,
    priceRange: "$$$",
    distance: 2.3,
    walkTime: 28,
    driveTime: 9,
    isOpen: true,
    address: "Av. San Martin 101",
    district: "Barranco",
    image: "/api/placeholder/300/200",
    coordinates: { lat: -12.1456, lng: -77.0198 }
  }
];

const NearbySearch = () => {
  const [radius, setRadius] = useState(3);
  const [transport, setTransport] = useState<'walking' | 'driving'>('walking');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filters, setFilters] = useState({
    cuisine: '',
    priceRange: '',
    rating: 0,
    openNow: false
  });
  const [filteredRestaurants, setFilteredRestaurants] = useState(nearbyRestaurants);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let filtered = nearbyRestaurants.filter(restaurant => restaurant.distance <= radius);
    
    if (filters.cuisine) {
      filtered = filtered.filter(r => r.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase()));
    }
    if (filters.priceRange) {
      filtered = filtered.filter(r => r.priceRange === filters.priceRange);
    }
    if (filters.rating > 0) {
      filtered = filtered.filter(r => r.rating >= filters.rating);
    }
    if (filters.openNow) {
      filtered = filtered.filter(r => r.isOpen);
    }

    filtered.sort((a, b) => {
      if (transport === 'walking') {
        return a.walkTime - b.walkTime;
      }
      return a.driveTime - b.driveTime;
    });

    setFilteredRestaurants(filtered);
  }, [radius, transport, filters]);

  const getRouteToRestaurant = (restaurant: Restaurant) => {
    const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.coordinates.lat},${restaurant.coordinates.lng}&travelmode=${transport}`;
    window.open(mapUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Search Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Buscar Cerca</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter size={16} />
            <span className="text-sm">Filtros</span>
          </button>
        </div>

        {/* Radius Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Radio de búsqueda</label>
          <div className="flex space-x-2">
            {[1, 3, 5, 10].map((km) => (
              <button
                key={km}
                onClick={() => setRadius(km)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  radius === km
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>

        {/* Transport Mode */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Modo de transporte</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setTransport('walking')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                transport === 'walking'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <User size={16} />
              <span>Caminando</span>
            </button>
            <button
              onClick={() => setTransport('driving')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                transport === 'driving'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Car size={16} />
              <span>Conduciendo</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="border-t pt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cocina</label>
              <select
                value={filters.cuisine}
                onChange={(e) => setFilters({...filters, cuisine: e.target.value})}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Todos</option>
                <option value="Cevichería">Cevichería</option>
                <option value="Nikkei">Nikkei</option>
                <option value="Criolla">Criolla</option>
                <option value="Alta Cocina">Alta Cocina</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rango de precios</label>
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">Todos</option>
                <option value="$$">$$ - Económico</option>
                <option value="$$$">$$$ - Moderado</option>
                <option value="$$$$">$$$$ - Caro</option>
                <option value="$$$$$">$$$$$ - Muy caro</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="openNow"
                checked={filters.openNow}
                onChange={(e) => setFilters({...filters, openNow: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="openNow" className="text-sm text-gray-700">Solo abiertos ahora</label>
            </div>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">{filteredRestaurants.length} restaurantes encontrados</span>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Fotos
          </button>
        </div>
      </div>

      {/* Results */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{restaurant.cuisine}</span>
                    <span>•</span>
                    <span>{restaurant.district}</span>
                    <span>•</span>
                    <span>{restaurant.priceRange}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Star size={16} className="text-yellow-400 fill-current" />
                  <span className="font-medium">{restaurant.rating}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <MapPin size={14} />
                    <span>{restaurant.distance} km</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{transport === 'walking' ? restaurant.walkTime : restaurant.driveTime} min</span>
                  </div>
                  {restaurant.isOpen ? (
                    <span className="text-green-600 font-medium">Abierto</span>
                  ) : (
                    <span className="text-red-600 font-medium">Cerrado</span>
                  )}
                </div>
                
                <button
                  onClick={() => getRouteToRestaurant(restaurant)}
                  className="flex items-center space-x-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Navigation size={16} />
                  <span>Ruta</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-32 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Foto del restaurante</span>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm mb-1">{restaurant.name}</h3>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1">
                    <Star size={12} className="text-yellow-400 fill-current" />
                    <span className="text-xs font-medium">{restaurant.rating}</span>
                  </div>
                  <span className="text-xs text-gray-500">{restaurant.distance} km</span>
                </div>
                <button
                  onClick={() => getRouteToRestaurant(restaurant)}
                  className="w-full px-2 py-1 bg-black text-white rounded text-xs hover:bg-gray-800 transition-colors"
                >
                  Ver Ruta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbySearch;
