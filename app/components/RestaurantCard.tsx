'use client'

import { Restaurant } from '@/app/types'
import { Star, MapPin, Clock } from 'lucide-react'

interface RestaurantCardProps {
  restaurant: Restaurant
  isSelected: boolean
  onClick: () => void
}

export function RestaurantCard({ restaurant, isSelected, onClick }: RestaurantCardProps) {
  const getPriceLevelDisplay = (priceLevel?: number) => {
    if (!priceLevel) return null
    return '💰'.repeat(priceLevel)
  }

  const getRatingColor = (rating?: number) => {
    if (!rating) return 'text-gray-400'
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-yellow-600'
    if (rating >= 3.5) return 'text-orange-600'
    return 'text-red-600'
  }

  const getPhotoUrl = (photo?: google.maps.places.PlacePhoto) => {
    if (!photo) return null
    return photo.getUrl({ maxWidth: 200, maxHeight: 150 })
  }

  return (
    <div 
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* Restaurant Photo */}
        {restaurant.photos && restaurant.photos[0] && (
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={getPhotoUrl(restaurant.photos[0]) || '/placeholder-restaurant.jpg'} 
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {/* Restaurant Name */}
          <h4 className="font-semibold text-sm truncate text-gray-900 mb-1">
            {restaurant.name}
          </h4>
          
          {/* Rating and Price */}
          <div className="flex items-center gap-2 mb-1">
            {restaurant.rating && (
              <div className="flex items-center gap-1">
                <Star className={`w-3 h-3 fill-current ${getRatingColor(restaurant.rating)}`} />
                <span className="text-xs font-medium text-gray-700">
                  {restaurant.rating.toFixed(1)}
                </span>
              </div>
            )}
            
            {restaurant.price_level && (
              <span className="text-xs text-gray-600">
                {getPriceLevelDisplay(restaurant.price_level)}
              </span>
            )}
          </div>
          
          {/* Address */}
          <div className="flex items-start gap-1 mb-1">
            <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-gray-600 leading-tight">
              {restaurant.vicinity}
            </span>
          </div>
          
          {/* Opening Hours */}
          {restaurant.opening_hours && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className={`text-xs ${
                restaurant.opening_hours.open_now ? 'text-green-600' : 'text-red-600'
              }`}>
                {restaurant.opening_hours.open_now ? 'Abierto ahora' : 'Cerrado'}
              </span>
            </div>
          )}
          
          {/* Restaurant Types */}
          <div className="mt-1">
            <div className="flex flex-wrap gap-1">
              {restaurant.types
                .filter(type => !type.includes('point_of_interest') && !type.includes('establishment'))
                .slice(0, 2)
                .map((type) => (
                  <span 
                    key={type} 
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                  >
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
