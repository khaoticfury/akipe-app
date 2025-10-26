"use client";

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  address: string;
  district: string;
  rating: number;
}

const restaurants: Restaurant[] = [
  {
    id: 1,
    name: "La Mar",
    cuisine: "Cevichería",
    address: "Av. La Mar 770",
    district: "Miraflores",
    rating: 4.8
  },
  {
    id: 2,
    name: "Central",
    cuisine: "Alta Cocina Peruana",
    address: "Av. Pedro de Osma 301",
    district: "Barranco",
    rating: 4.9
  },
  {
    id: 3,
    name: "Maido",
    cuisine: "Nikkei",
    address: "Calle San Martin 399",
    district: "Miraflores",
    rating: 4.7
  },
  {
    id: 4,
    name: "Astrid y Gastón",
    cuisine: "Contemporánea Peruana",
    address: "Av. Paz Soldán 290",
    district: "San Isidro",
    rating: 4.6
  },
  {
    id: 5,
    name: "El Mercado",
    cuisine: "Pescados y Mariscos",
    address: "Hipólito Unanue 203",
    district: "Miraflores",
    rating: 4.5
  },
  {
    id: 6,
    name: "Isolina",
    cuisine: "Criolla",
    address: "Av. San Martin 101",
    district: "Barranco",
    rating: 4.7
  },
  {
    id: 7,
    name: "Rafael",
    cuisine: "Mediterránea Peruana",
    address: "Calle San Martin 300",
    district: "Miraflores",
    rating: 4.6
  },
  {
    id: 8,
    name: "Mayta",
    cuisine: "Contemporánea Peruana",
    address: "Av. Mariscal La Mar 1285",
    district: "Miraflores",
    rating: 4.8
  }
];

const RestaurantSearch = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Restaurant[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (query.length > 1) {
      const searchTerms = query.toLowerCase().split(' ');
      const filtered = restaurants.filter(restaurant => {
        const searchText = `${restaurant.name} ${restaurant.cuisine} ${restaurant.district} ${restaurant.address}`.toLowerCase();
        return searchTerms.every(term => searchText.includes(term));
      });
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSelect = (restaurant: Restaurant) => {
    setQuery(restaurant.name);
    setShowSuggestions(false);
  };

  const handleClickOutside = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 1 && setShowSuggestions(true)}
          onBlur={handleClickOutside}
          placeholder="Buscar restaurantes en Lima..."
          className="w-full p-4 pr-12 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
        />
        <Search className="absolute right-4 top-4 text-gray-400" size={20} />
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto">
          {suggestions.map((restaurant) => (
            <button
              key={restaurant.id}
              onClick={() => handleSelect(restaurant)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{restaurant.name}</span>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                  {restaurant.rating}★
                </span>
              </div>
              <div className="text-sm text-gray-600">{restaurant.cuisine}</div>
              <div className="text-xs text-gray-500">{restaurant.address}, {restaurant.district}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantSearch;
