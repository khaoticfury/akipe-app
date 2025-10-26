'use client'

import { useState } from 'react'
import { SearchFilters as SearchFiltersType } from '@/app/types'
import { Sliders, Star, MapPin, Clock, DollarSign } from 'lucide-react'

interface SearchFiltersProps {
  filters: SearchFiltersType
  onFiltersChange: (filters: SearchFiltersType) => void
}

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const radiusOptions = [
    { value: 500, label: '500m' },
    { value: 1000, label: '1km' },
    { value: 2000, label: '2km' },
    { value: 5000, label: '5km' }
  ]

  const typeOptions = [
    { value: 'restaurant', label: 'Todos los restaurantes' },
    { value: 'meal_takeaway', label: 'Para llevar' },
    { value: 'meal_delivery', label: 'Delivery' },
    { value: 'cafe', label: 'Cafeterías' },
    { value: 'bar', label: 'Bares' },
    { value: 'bakery', label: 'Panaderías' }
  ]

  const ratingOptions = [
    { value: undefined, label: 'Cualquier calificación' },
    { value: 3, label: '3+ estrellas' },
    { value: 4, label: '4+ estrellas' },
    { value: 4.5, label: '4.5+ estrellas' }
  ]

  const priceLevelOptions = [
    { value: 1, label: '$' },
    { value: 2, label: '$$' },
    { value: 3, label: '$$$' },
    { value: 4, label: '$$$$' }
  ]

  const handleRadiusChange = (radius: number) => {
    onFiltersChange({ ...filters, radius })
  }

  const handleTypeChange = (type: string) => {
    onFiltersChange({ ...filters, type })
  }

  const handleRatingChange = (minRating?: number) => {
    onFiltersChange({ ...filters, minRating })
  }

  const handlePriceLevelChange = (priceLevel: number, checked: boolean) => {
    const currentPriceLevels = filters.priceLevel || []
    const newPriceLevels = checked 
      ? [...currentPriceLevels, priceLevel]
      : currentPriceLevels.filter(level => level !== priceLevel)
    
    onFiltersChange({ 
      ...filters, 
      priceLevel: newPriceLevels.length > 0 ? newPriceLevels : undefined 
    })
  }

  const handleOpenNowChange = (openNow: boolean) => {
    onFiltersChange({ ...filters, openNow })
  }

  return (
    <div className="border-b border-gray-200 pb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left font-medium text-gray-900 hover:text-blue-600 transition-colors"
      >
        <Sliders className="w-4 h-4" />
        Filtros de búsqueda
        <span className="text-sm text-gray-500 ml-auto">
          {isExpanded ? '−' : '+'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Radius Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4" />
              Radio de búsqueda
            </label>
            <div className="grid grid-cols-2 gap-2">
              {radiusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRadiusChange(option.value)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    filters.radius === option.value
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Tipo de establecimiento
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Star className="w-4 h-4" />
              Calificación mínima
            </label>
            <div className="space-y-1">
              {ratingOptions.map((option) => (
                <label key={option.value || 'any'} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.minRating === option.value}
                    onChange={() => handleRatingChange(option.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Level Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4" />
              Rango de precios
            </label>
            <div className="space-y-1">
              {priceLevelOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(filters.priceLevel || []).includes(option.value)}
                    onChange={(e) => handlePriceLevelChange(option.value, e.target.checked)}
                    className="text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Open Now Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.openNow || false}
                onChange={(e) => handleOpenNowChange(e.target.checked)}
                className="text-blue-600 focus:ring-blue-500 rounded"
              />
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700">Solo mostrar lugares abiertos ahora</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
