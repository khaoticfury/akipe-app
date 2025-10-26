import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'Cargando...',
  className = ''
}) => {
  const { actualTheme } = useTheme();

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <div
        className={`animate-spin rounded-full border-b-2 mx-auto ${sizeClasses[size]} ${
          actualTheme === 'dark' ? 'border-white' : 'border-gray-900'
        }`}
      />
      {message && (
        <p className={`mt-2 text-sm ${
          actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
};
