import { useState, useEffect } from 'react';
import { Restaurant } from '../types/restaurant';

interface EditRestaurantModalProps {
  restaurant: Restaurant;
  onClose: () => void;
  onSubmit: (updatedRestaurant: Restaurant) => void;
}

export default function EditRestaurantModal({ restaurant, onClose, onSubmit }: EditRestaurantModalProps) {
  const [name, setName] = useState(restaurant.name);
  const [address, setAddress] = useState(restaurant.address);
  const [district, setDistrict] = useState(restaurant.district);
  const [typeOfCuisine, setTypeOfCuisine] = useState(restaurant.type_of_cuisine);
  const [latitude, setLatitude] = useState(restaurant.gps_coordinates.latitude);
  const [longitude, setLongitude] = useState(restaurant.gps_coordinates.longitude);

  const handleSubmit = () => {
    onSubmit({
      ...restaurant,
      name,
      address,
      district,
      type_of_cuisine: typeOfCuisine,
      gps_coordinates: { latitude, longitude }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Editar Restaurante</h3>
        <div className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre"
            className="w-full p-3 border border-gray-300 rounded"
          />
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Dirección"
            className="w-full p-3 border border-gray-300 rounded"
          />
          <input
            type="text"
            value={district}
            onChange={e => setDistrict(e.target.value)}
            placeholder="Distrito"
            className="w-full p-3 border border-gray-300 rounded"
          />
          <input
            type="text"
            value={typeOfCuisine}
            onChange={e => setTypeOfCuisine(e.target.value)}
            placeholder="Tipo de Cocina"
            className="w-full p-3 border border-gray-300 rounded"
          />
          <div className="flex space-x-2">
            <input
              type="number"
              value={latitude}
              onChange={e => setLatitude(parseFloat(e.target.value))}
              placeholder="Latitud"
              className="flex-1 p-3 border border-gray-300 rounded"
            />
            <input
              type="number"
              value={longitude}
              onChange={e => setLongitude(parseFloat(e.target.value))}
              placeholder="Longitud"
              className="flex-1 p-3 border border-gray-300 rounded"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-black text-white p-3 rounded hover:bg-gray-800 transition-colors"
            >
              Guardar
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 p-3 rounded hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
