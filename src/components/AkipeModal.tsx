import { useState } from 'react';
import { groupTypes } from '../data/restaurantDatabase';
import { useTheme } from '../contexts/ThemeContext';

interface AkipeModalProps {
  onClose: () => void;
  onSelect: (radius: number, groupType: string) => void;
}

export default function AkipeModal({ onClose, onSelect }: AkipeModalProps) {
  const { actualTheme } = useTheme();
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [selectedGroupType, setSelectedGroupType] = useState<string | null>(null);

  const radiusOptions = [
    { value: 0.3, label: '300 metros' },
    { value: 0.5, label: '500 metros' },
    { value: 1, label: '1 km' },
    { value: 3, label: '3 km' },
    { value: 5, label: '5 km' }
  ];

  const handleConfirm = () => {
    if (selectedRadius !== null && selectedGroupType !== null) {
      onSelect(selectedRadius, selectedGroupType);
      onClose();
    } else {
      alert("Por favor, seleccione un radio y un tipo de grupo antes de continuar.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg max-w-sm w-full mx-4 shadow-2xl backdrop-blur-xl ${
        actualTheme === 'dark'
          ? 'bg-gray-800/95 text-white'
          : 'bg-white/95 text-black'
      }`}>
        <h3 className="text-lg font-semibold mb-4">Selecciona tus preferencias</h3>
        
        {/* Radio Selection */}
        <div className="mb-6">
        <h4 className={`text-sm font-medium mb-3 ${
          actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}>Radio de búsqueda</h4>
          <div className="space-y-2">
            {radiusOptions.map((option: { value: number; label: string }) => (
              <button
                key={option.value}
                onClick={() => setSelectedRadius(option.value)}
                className={`w-full px-4 py-3 rounded-lg transition-colors ${
                  selectedRadius === option.value
                    ? 'bg-black text-white shadow-md'
                    : actualTheme === 'dark'
                      ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Group Type Selection */}
        <div className="mb-6">
        <h4 className={`text-sm font-medium mb-3 ${
          actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}>Tipo de grupo</h4>
          <div className="grid grid-cols-2 gap-2">
            {groupTypes.map((type: { id: string; label: string; icon: string }) => (
              <button
                key={type.id}
                onClick={() => setSelectedGroupType(type.id)}
                className={`p-3 rounded-lg flex flex-col items-center transition-colors ${
                  selectedGroupType === type.id
                    ? 'bg-black text-white shadow-md'
                    : actualTheme === 'dark'
                      ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-2xl mb-1">{type.icon}</span>
                <span className="text-sm">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleConfirm}
            className="w-full px-4 py-3 rounded-lg bg-black text-white hover:bg-gray-800"
          >
            Buscar restaurantes
          </button>
          <button
            onClick={onClose}
            className={`w-full px-4 py-3 transition-colors ${
              actualTheme === 'dark'
                ? 'text-gray-300 hover:text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
