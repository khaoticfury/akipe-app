"use client";

import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  History,
  Heart,
  Bell,
  HelpCircle,
  Shield,
  LogOut,
  Edit3,
  MapPin,
  Star,
  Clock,
  Award,
  ChevronRight,
  Camera,
  Phone,
  Mail,
  Globe,
  Moon,
  Sun,
  Monitor,
  Navigation,
  Car,
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  profilePicture: string;
  joinDate: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    navigation: 'walking' | 'driving';
    language: string;
  };
  stats: {
    restaurantsVisited: number;
    favorites: number;
    reviews: number;
    badges: number;
  };
}

interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
  type: 'restaurant' | 'address';
}

interface FavoriteRestaurant {
  id: string;
  name: string;
  district: string;
  lastVisited: string;
  rating: number;
}

const Profile: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { theme, setTheme, actualTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // Mock user data - in a real app, this would come from an API
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '1',
    name: 'Usuario Demo',
    email: 'usuario@demo.com',
    phone: '+51 999 999 999',
    profilePicture: '',
    joinDate: '2024-01-15',
    preferences: {
      theme: theme,
      navigation: 'walking',
      language: 'es'
    },
    stats: {
      restaurantsVisited: 24,
      favorites: 8,
      reviews: 12,
      badges: 3
    }
  });

  const [searchHistory] = useState<SearchHistory[]>([
    { id: '1', query: 'Restaurante vegetariano Miraflores', timestamp: '2024-01-20T10:30:00Z', type: 'restaurant' },
    { id: '2', query: 'Pizza cerca de mi', timestamp: '2024-01-19T18:45:00Z', type: 'restaurant' },
    { id: '3', query: 'Av. Larco 123, Miraflores', timestamp: '2024-01-18T14:20:00Z', type: 'address' },
  ]);

  const [favoriteRestaurants] = useState<FavoriteRestaurant[]>([
    { id: '1', name: 'La Mar', district: 'Miraflores', lastVisited: '2024-01-15', rating: 4.5 },
    { id: '2', name: 'Central', district: 'Barranco', lastVisited: '2024-01-10', rating: 5.0 },
    { id: '3', name: 'Maido', district: 'Miraflores', lastVisited: '2024-01-08', rating: 4.8 },
  ]);

  const badges = [
    { id: '1', name: 'Explorador', description: 'Visitaste 10 restaurantes', icon: '🗺️', earned: true },
    { id: '2', name: 'Gourmet', description: 'Probaste 5 tipos diferentes de cocina', icon: '👨‍🍳', earned: true },
    { id: '3', name: 'Local Guide', description: 'Dejaste 10 reseñas', icon: '⭐', earned: true },
    { id: '4', name: 'Aventurero', description: 'Visitaste restaurantes en 5 distritos', icon: '🏔️', earned: false },
  ];

  const handleSaveProfile = () => {
    setUserProfile(prev => ({
      ...prev,
      preferences: { ...prev.preferences, theme }
    }));
    setIsEditing(false);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    setUserProfile(prev => ({
      ...prev,
      preferences: { ...prev.preferences, theme: newTheme }
    }));
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="text-center">
        <div className="relative inline-block mb-4">
          <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-bold ${
            actualTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-200 border-gray-300 text-gray-700'
          }`}>
            {userProfile.profilePicture ? (
              <img src={userProfile.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              userProfile.name.charAt(0)
            )}
          </div>
          <button className={`absolute bottom-0 right-0 p-2 rounded-full border-2 ${
            actualTheme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'
          }`}>
            <Camera size={16} />
          </button>
        </div>
        <h2 className="text-2xl font-bold mb-2">{userProfile.name}</h2>
        <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Miembro desde {new Date(userProfile.joinDate).toLocaleDateString('es-PE')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Restaurantes', value: userProfile.stats.restaurantsVisited, icon: <MapPin size={20} /> },
          { label: 'Favoritos', value: userProfile.stats.favorites, icon: <Heart size={20} /> },
          { label: 'Reseñas', value: userProfile.stats.reviews, icon: <Star size={20} /> },
          { label: 'Insignias', value: userProfile.stats.badges, icon: <Award size={20} /> },
        ].map((stat, index) => (
          <div key={index} className={`p-4 rounded-xl ${
            actualTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {stat.label}
              </span>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <button
          onClick={() => setActiveSection('favorites')}
          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
            actualTheme === 'dark'
              ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
              : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Heart className="text-red-500" size={20} />
            <span>Mis Favoritos</span>
          </div>
          <ChevronRight size={20} className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
        </button>

        <button
          onClick={() => setActiveSection('history')}
          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
            actualTheme === 'dark'
              ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
              : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <History className="text-blue-500" size={20} />
            <span>Historial de Búsquedas</span>
          </div>
          <ChevronRight size={20} className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
        </button>
      </div>
    </div>
  );

  const renderUserInfo = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Información Personal</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`p-2 rounded-lg transition-colors ${
            actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Edit3 size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {[
          { icon: <User size={20} />, label: 'Nombre', value: userProfile.name, key: 'name' },
          { icon: <Mail size={20} />, label: 'Email', value: userProfile.email, key: 'email' },
          { icon: <Phone size={20} />, label: 'Teléfono', value: userProfile.phone, key: 'phone' },
        ].map((field, index) => (
          <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${
            actualTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <div className={`p-2 rounded-lg ${
              actualTheme === 'dark' ? 'bg-gray-700 text-blue-400' : 'bg-blue-100 text-blue-600'
            }`}>
              {field.icon}
            </div>
            <div className="flex-1">
              <div className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {field.label}
              </div>
              <div className="font-medium">{field.value}</div>
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSaveProfile}
            className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Guardar Cambios
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className={`flex-1 py-3 rounded-lg transition-colors ${
              actualTheme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
            }`}
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Preferencias</h3>

      <div className="space-y-4">
        {/* Theme Selection */}
        <div className={`p-4 rounded-xl border ${
          actualTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${
              actualTheme === 'dark' ? 'bg-gray-700 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
            }`}>
              {theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <Monitor size={20} />}
            </div>
            <div>
              <div className="font-medium">Tema</div>
              <div className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Automático'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'light', label: 'Claro', icon: <Sun size={16} /> },
              { key: 'dark', label: 'Oscuro', icon: <Moon size={16} /> },
              { key: 'auto', label: 'Auto', icon: <Monitor size={16} /> },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => handleThemeChange(option.key as 'light' | 'dark' | 'auto')}
                className={`p-3 rounded-lg border transition-colors ${
                  theme === option.key
                    ? 'bg-black text-white border-black'
                    : actualTheme === 'dark'
                      ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {option.icon}
                  <span className="text-sm">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Preference */}
        <div className={`p-4 rounded-xl border ${
          actualTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${
              actualTheme === 'dark' ? 'bg-gray-700 text-green-400' : 'bg-green-100 text-green-600'
            }`}>
              <Navigation size={20} />
            </div>
            <div>
              <div className="font-medium">Navegación Preferida</div>
              <div className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {userProfile.preferences.navigation === 'walking' ? 'Caminando' : 'En Auto'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'walking', label: 'Caminar', icon: '🚶' },
              { key: 'driving', label: 'Auto', icon: '🚗' },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setUserProfile(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, navigation: option.key as 'walking' | 'driving' }
                }))}
                className={`p-3 rounded-lg border transition-colors ${
                  userProfile.preferences.navigation === option.key
                    ? 'bg-black text-white border-black'
                    : actualTheme === 'dark'
                      ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{option.icon}</span>
                  <span className="text-sm">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Historial de Búsquedas</h3>
      <div className="space-y-3">
        {searchHistory.map((item) => (
          <div key={item.id} className={`p-4 rounded-xl border ${
            actualTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  {item.type === 'restaurant' ? <MapPin size={16} /> : <Globe size={16} />}
                </div>
                <div>
                  <div className="font-medium">{item.query}</div>
                  <div className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {new Date(item.timestamp).toLocaleDateString('es-PE')} • {item.type === 'restaurant' ? 'Restaurante' : 'Dirección'}
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFavorites = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Restaurantes Favoritos</h3>
      <div className="space-y-3">
        {favoriteRestaurants.map((restaurant) => (
          <div key={restaurant.id} className={`p-4 rounded-xl border ${
            actualTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Heart className="text-red-500" size={16} />
                </div>
                <div>
                  <div className="font-medium">{restaurant.name}</div>
                  <div className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {restaurant.district} • Última visita: {new Date(restaurant.lastVisited).toLocaleDateString('es-PE')}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="text-yellow-500" size={12} />
                    <span className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {restaurant.rating}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBadges = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Insignias y Logros</h3>
      <div className="grid grid-cols-2 gap-4">
        {badges.map((badge) => (
          <div key={badge.id} className={`p-4 rounded-xl border ${
            actualTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } ${badge.earned ? 'opacity-100' : 'opacity-50'}`}>
            <div className="text-center">
              <div className="text-3xl mb-2">{badge.icon}</div>
              <div className="font-medium">{badge.name}</div>
              <div className={`text-sm mt-1 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {badge.description}
              </div>
              {badge.earned && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span className="text-xs text-green-500">Obtenida</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Configuración</h3>

      <div className="space-y-4">
        <button
          onClick={() => setShowNotificationSettings(!showNotificationSettings)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
            actualTheme === 'dark'
              ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
              : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Bell className="text-blue-500" size={20} />
            <span>Notificaciones</span>
          </div>
          <ChevronRight size={20} className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
        </button>

        <button className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
          actualTheme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
            : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
        }`}>
          <div className="flex items-center gap-3">
            <Shield className="text-green-500" size={20} />
            <span>Privacidad y Seguridad</span>
          </div>
          <ChevronRight size={20} className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
        </button>

        <button className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
          actualTheme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
            : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
        }`}>
          <div className="flex items-center gap-3">
            <HelpCircle className="text-purple-500" size={20} />
            <span>Ayuda y Soporte</span>
          </div>
          <ChevronRight size={20} className={actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
        </button>
      </div>

      {showNotificationSettings && (
        <div className={`p-4 rounded-xl border ${
          actualTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h4 className="font-medium mb-3">Configuración de Notificaciones</h4>
          <div className="space-y-3">
            {[
              { label: 'Ofertas y promociones', enabled: true },
              { label: 'Nuevos restaurantes', enabled: true },
              { label: 'Recordatorios de ubicación', enabled: false },
              { label: 'Actualizaciones de la app', enabled: true },
            ].map((notification, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className={`text-sm ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {notification.label}
                </span>
                <button className={`w-12 h-6 rounded-full transition-colors ${
                  notification.enabled ? 'bg-black' : actualTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notification.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return renderOverview();
      case 'info': return renderUserInfo();
      case 'preferences': return renderPreferences();
      case 'history': return renderHistory();
      case 'favorites': return renderFavorites();
      case 'badges': return renderBadges();
      case 'settings': return renderSettings();
      default: return renderOverview();
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Resumen', icon: <User size={20} /> },
    { id: 'info', label: 'Información', icon: <Edit3 size={20} /> },
    { id: 'preferences', label: 'Preferencias', icon: <Settings size={20} /> },
    { id: 'history', label: 'Historial', icon: <History size={20} /> },
    { id: 'favorites', label: 'Favoritos', icon: <Heart size={20} /> },
    { id: 'badges', label: 'Insignias', icon: <Award size={20} /> },
    { id: 'settings', label: 'Configuración', icon: <Settings size={20} /> },
  ];

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${
      actualTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-6 border-b ${
        actualTheme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
      }`}>
        <h1 className="text-2xl font-bold">Perfil</h1>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${
            actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex h-full" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Sidebar */}
        <div className={`w-64 border-r p-4 overflow-y-auto ${
          actualTheme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-black text-white'
                    : actualTheme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="absolute bottom-6 left-4 right-4">
            <button className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              actualTheme === 'dark'
                ? 'text-red-400 hover:bg-red-900/20'
                : 'text-red-600 hover:bg-red-50'
            }`}>
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Profile;
