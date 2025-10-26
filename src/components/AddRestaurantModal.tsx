import { useState } from 'react';
import { Restaurant } from '../types/restaurant';

interface AddRestaurantModalProps {
  onClose: () => void;
  onSubmit: (restaurant: Omit<Restaurant, 'id' | 'date_added'>) => void;
}

export default function AddRestaurantModal({ onClose, onSubmit }: AddRestaurantModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    district: '',
    type_of_cuisine: '',
    opening_hours: '',
    contact_number: '',
    website: '',
    instagram: '',
    price_min: '',
    price_max: '',
    category: 'local',
    gps_latitude: '',
    gps_longitude: '',
    group_solo: false,
    group_couple: false,
    group_family: false,
    group_large: false
  });

  const districts = [
    'Miraflores',
    'San Isidro',
    'Barranco',
    'La Molina',
    'Surco',
    'San Borja',
    'Jesús María',
    'Lince',
    'Magdalena',
    'Pueblo Libre'
  ];

  const categories = [
    { value: 'local', label: 'Local' },
    { value: 'fast_food', label: 'Fast Food' },
    { value: 'gourmet', label: 'Gourmet' },
    { value: 'street_food', label: 'Street Food' },
    { value: 'cafe', label: 'Café' },
    { value: 'bakery', label: 'Panadería' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const restaurant: Omit<Restaurant, 'id' | 'date_added'> = {
      name: formData.name,
      address: formData.address,
      district: formData.district,
      type_of_cuisine: formData.type_of_cuisine,
      gps_coordinates: {
        latitude: parseFloat(formData.gps_latitude) || 0,
        longitude: parseFloat(formData.gps_longitude) || 0
      },
      opening_hours: formData.opening_hours,
      contact_number: formData.contact_number || undefined,
      social_links: {
        website: formData.website || undefined,
        instagram: formData.instagram || undefined
      },
      price_range: {
        min: parseInt(formData.price_min) || 0,
        max: parseInt(formData.price_max) || 0,
        currency: 'S/'
      },
      category: formData.category as Restaurant['category'],
      rating: 0,
      wait_time: '15-20 min',
      group_friendly: {
        solo: formData.group_solo,
        couple: formData.group_couple,
        family: formData.group_family,
        large_group: formData.group_large
      }
    };

    onSubmit(restaurant);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-black">Agregar Nuevo Restaurante</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Nombre del restaurante *"
              required
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-black"
              value={formData.name}
              onChange={handleInputChange}
            />

            <select
              name="district"
              required
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-black"
              value={formData.district}
              onChange={handleInputChange}
            >
              <option value="">Seleccionar distrito *</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          <textarea
            name="address"
            placeholder="Dirección exacta *"
            required
            rows={2}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-black"
            value={formData.address}
            onChange={handleInputChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="type_of_cuisine"
              placeholder="Tipo de comida *"
              required
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-black"
              value={formData.type_of_cuisine}
              onChange={handleInputChange}
            />

            <select
              name="category"
              required
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-black"
              value={formData.category}
              onChange={handleInputChange}
            >
              <option value="">Seleccionar categoría *</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </div>

          {/* Contact & Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="opening_hours"
              placeholder="Horarios (ej: 12:00 - 22:00) *"
              required
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-black"
              value={formData.opening_hours}
              onChange={handleInputChange}
            />

            <input
              type="tel"
              name="contact_number"
              placeholder="Número de contacto (opcional)"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-black"
              value={formData.contact_number}
              onChange={handleInputChange}
            />
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="url"
              name="website"
              placeholder="Sitio web (opcional)"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-black"
              value={formData.website}
              onChange={handleInputChange}
            />

            <input
              type="text"
              name="instagram"
              placeholder="Instagram (opcional)"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-black"
              value={formData.instagram}
              onChange={handleInputChange}
            />
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="number"
              name="price_min"
              placeholder="Precio mínimo (S/) *"
              required
              min="0"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-black"
              value={formData.price_min}
              onChange={handleInputChange}
            />

            <input
              type="number"
              name="price_max"
              placeholder="Precio máximo (S/) *"
              required
              min="0"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-black"
              value={formData.price_max}
              onChange={handleInputChange}
            />
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="gps_latitude"
              placeholder="Latitud GPS (opcional)"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-black"
              value={formData.gps_latitude}
              onChange={handleInputChange}
            />

            <input
              type="text"
              name="gps_longitude"
              placeholder="Longitud GPS (opcional)"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-black"
              value={formData.gps_longitude}
              onChange={handleInputChange}
            />
          </div>

          {/* Group Types */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 text-black">Ideal para:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="group_solo"
                  checked={formData.group_solo}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span>👤 Solo</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="group_couple"
                  checked={formData.group_couple}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span>👫 Parejas</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="group_family"
                  checked={formData.group_family}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span>👨‍👩‍👧‍👦 Familias</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="group_large"
                  checked={formData.group_large}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span>👥 Grupos</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Agregar Restaurante
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors border border-gray-200 rounded-lg text-black"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
