import React from 'react';
import { MapPin, Search, Plus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: 'map' | 'search' | 'plus';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Sin resultados',
  message,
  icon = 'search',
  action,
  className = ''
}) => {
  const { actualTheme } = useTheme();

  const icons = {
    map: MapPin,
    search: Search,
    plus: Plus
  };

  const IconComponent = icons[icon];

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className={`flex flex-col items-center space-y-4 ${
        actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        <IconComponent size={64} className="opacity-40" />
        <div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-sm opacity-80 max-w-md">{message}</p>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium ${
              actualTheme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};
