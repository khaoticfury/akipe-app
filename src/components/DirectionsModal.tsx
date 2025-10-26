import React from 'react';

interface DirectionsModalProps {
  restaurantName: string;
  restaurantAddress: string;
  restaurantDistrict: string;
  onClose: () => void;
  onSelectMode: (mode: 'walking' | 'driving') => void;
}

const DirectionsModal: React.FC<DirectionsModalProps> = ({
  restaurantName,
  restaurantAddress,
  restaurantDistrict,
  onClose,
  onSelectMode,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">{restaurantName}</h3>
        <p className="mb-4">{restaurantAddress}, {restaurantDistrict}</p>
        <div className="flex space-x-4">
          <button
            onClick={() => onSelectMode('walking')}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
          >
            🚶 Walk
          </button>
          <button
            onClick={() => onSelectMode('driving')}
            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
          >
            🚗 Drive
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DirectionsModal;
