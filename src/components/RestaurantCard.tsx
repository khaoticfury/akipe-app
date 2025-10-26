import { Heart, Star, Clock, Navigation, MapPin } from 'lucide-react';
import { Restaurant } from '../types/restaurant';
import { useTheme } from '../contexts/ThemeContext';

interface RestaurantCardProps {
  restaurant: Restaurant & { isManual?: boolean };
  isFavorite: boolean;
  onFavoriteClick: (id: string) => void;
  onRestaurantClick: (restaurant: Restaurant) => void;
  onEditClick?: (restaurant: Restaurant) => void;
}

export default function RestaurantCard({
  restaurant,
  isFavorite,
  onFavoriteClick,
  onRestaurantClick,
  onEditClick
}: RestaurantCardProps) {
  const { actualTheme } = useTheme();
  const {
    name,
    type_of_cuisine,
    district,
    address,
    rating,
    wait_time,
    contact_number,
    opening_hours,
    price_range,
    group_friendly
  } = restaurant;

  const getGroupIcons = () => {
    const icons = [];
    if (group_friendly.solo) icons.push('👤');
    if (group_friendly.couple) icons.push('👫');
    if (group_friendly.family) icons.push('👨‍👩‍👧‍👦');
    if (group_friendly.large_group) icons.push('👥');
    return icons.join(' ');
  };

  const handleNavigation = (mode: 'walking' | 'driving') => {
    const destination = encodeURIComponent(
      `${address}, ${district}, Lima, Peru`
    );
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${mode}`,
      '_blank'
    );
  };

  return (
    <div className={`backdrop-blur-md p-4 rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 ${
      actualTheme === 'dark'
        ? 'bg-gray-800/80 border-gray-700/50 hover:bg-gray-800/90'
        : 'bg-white/80 border-gray-200/50 hover:bg-white/90'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <button
            onClick={() => onRestaurantClick(restaurant)}
            className={`font-semibold text-lg text-left transition-all duration-200 w-full p-2 rounded-lg hover:shadow-md cursor-pointer group ${
              actualTheme === 'dark'
                ? 'text-white hover:text-blue-400 hover:bg-gray-700/30'
                : 'text-black hover:text-blue-600 hover:bg-gray-100/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {name}
              <span className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                👆 Toca para ver detalles
              </span>
            </div>
          </button>
          <div className="flex items-center space-x-2 mt-1">
            <p className={`text-sm ${
              actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>{type_of_cuisine}</p>
            <span className={`${
              actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>•</span>
            <p className={`text-sm ${
              actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>{district}</p>
          </div>
          <p className={`text-sm mt-1 ${
            actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>{address}</p>

          {/* Price Range */}
          <p className={`text-sm mt-2 ${
            actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            💰 {price_range.currency}{price_range.min} - {price_range.currency}{price_range.max} por persona
          </p>

          {/* Contact & Hours */}
          {contact_number && (
            <p className={`text-sm ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>📞 {contact_number}</p>
          )}
          {opening_hours && (
            <p className={`text-sm ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>🕒 {opening_hours}</p>
          )}

          {/* Group Types */}
          <p className="text-sm mt-2" title="Ideal para">
            {getGroupIcons()}
          </p>
        </div>

        <div className="flex flex-col items-end space-y-2">
          {/* Rating */}
          <div className="flex items-center space-x-1">
            <Star size={16} className="text-yellow-400 fill-current" />
            <span className="font-medium">{rating}</span>
          </div>

          {/* Favorite Button */}
          <button
            onClick={() => onFavoriteClick(restaurant.id)}
            className={`p-2 rounded-full transition-colors ${
              actualTheme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/50'
            }`}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              size={24}
              className={`transition-colors ${
                isFavorite
                  ? "fill-red-500 text-red-500"
                  : actualTheme === 'dark'
                    ? "text-gray-400 hover:text-red-400"
                    : "text-gray-400 hover:text-red-500"
              }`}
            />
          </button>
          {/* Edit Button for manual restaurants */}
          {restaurant.isManual && onEditClick && (
            <button
              onClick={() => onEditClick(restaurant)}
              className={`ml-2 p-2 rounded-md transition-colors shadow-sm ${
                actualTheme === 'dark'
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              aria-label="Edit restaurant"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Wait Time */}
      <div className={`mt-2 flex items-center text-sm ${
        actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <Clock size={14} className={`mr-1 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
        <span>{wait_time}</span>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => handleNavigation('walking')}
          className="flex-1 flex items-center justify-center gap-2 p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
        >
          <Navigation size={14} className="text-white" />
          Caminar
        </button>
        <button
          onClick={() => handleNavigation('driving')}
          className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg hover:opacity-90 transition-colors text-sm ${
            actualTheme === 'dark'
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gray-200 text-black hover:bg-gray-300'
          }`}
        >
          <MapPin size={14} className={actualTheme === 'dark' ? 'text-white' : 'text-black'} />
          Auto
        </button>
      </div>
    </div>
  );
}
