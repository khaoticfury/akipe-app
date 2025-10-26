import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  onRetry,
  className = ''
}) => {
  const { actualTheme } = useTheme();

  return (
    <div className={`text-center py-8 ${className}`}>
      <div className={`flex flex-col items-center space-y-4 ${
        actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'
      }`}>
        <AlertCircle size={48} className="opacity-60" />
        <div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm opacity-80 max-w-md">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              actualTheme === 'dark'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
};
