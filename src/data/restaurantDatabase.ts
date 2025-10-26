import { Restaurant, GroupType } from '../types/restaurant';

export const restaurantDatabase: Restaurant[] = [
  // ANCÓN
  {
    id: '1',
    name: 'Restaurante El Pescador',
    address: 'Av. Ancón 123',
    district: 'Ancón',
    type_of_cuisine: 'Mariscos',
    gps_coordinates: { latitude: -11.7667, longitude: -77.1667 },
    opening_hours: '11:00 - 22:00',
    contact_number: '+51 1 552-1234',
    social_links: {},
    price_range: { min: 25, max: 50, currency: 'S/' },
    category: 'local',
    date_added: '2024-01-15',
    rating: 4.2,
    wait_time: '15-20 min',
    seating_capacity: 80,
    group_friendly: { solo: true, couple: true, family: true, large_group: true }
  },

  // ATE
  {
    id: '2',
    name: 'Pollería Don Pollo',
    address: 'Av. Nicolás Ayllón 2456',
    district: 'Ate',
    type_of_cuisine: 'Pollo a la Brasa',
    gps_coordinates: { latitude: -12.0333, longitude: -76.9167 },
    opening_hours: '11:00 - 23:00',
    contact_number: '+51 1 326-7890',
    social_links: {},
    price_range: { min: 18, max: 35, currency: 'S/' },
    category: 'local',
    date_added: '2024-01-15',
    rating: 4.1,
    wait_time: '12-18 min',
    seating_capacity: 120,
    group_friendly: { solo: true, couple: true, family: true, large_group: true }
  },
  {
    id: '3',
    name: 'KFC Ate',
    address: 'Av. Separadora Industrial 1234',
    district: 'Ate',
    type_of_cuisine: 'Pollo Frito',
    gps_coordinates: { latitude: -12.0289, longitude: -76.9234 },
    opening_hours: '10:00 - 23:00',
    contact_number: '+51 1 326-5555',
    social_links: {},
    price_range: { min: 12, max: 30, currency: 'S/' },
    category: 'fast_food',
    date_added: '2024-01-15',
    rating: 3.8,
    wait_time: '8-12 min',
    seating_capacity: 60,
    group_friendly: { solo: true, couple: true, family: true, large_group: true }
  },

  // BARRANCO
  {
    id: '4',
    name: 'Central',
    address: 'Av. Pedro de Osma 301',
    district: 'Barranco',
    type_of_cuisine: 'Alta Cocina Peruana',
    gps_coordinates: { latitude: -12.1456, longitude: -77.0208 },
    opening_hours: '19:00 - 24:00',
    contact_number: '+51 1 242-8515',
    social_links: {},
    price_range: { min: 280, max: 450, currency: 'S/' },
    category: 'gourmet',
    date_added: '2024-01-15',
    rating: 4.9,
    wait_time: '25-30 min',
    seating_capacity: 80,
    group_friendly: { solo: false, couple: true, family: true, large_group: false }
  },
  {
    id: '5',
    name: 'Isolina',
    address: 'Av. San Martín 101',
    district: 'Barranco',
    type_of_cuisine: 'Criolla',
    gps_coordinates: { latitude: -12.1456, longitude: -77.0175 },
    opening_hours: '12:00 - 23:00',
    contact_number: '+51 1 247-5075',
    social_links: {},
    price_range: { min: 40, max: 70, currency: 'S/' },
    category: 'local',
    date_added: '2024-01-15',
    rating: 4.6,
    wait_time: '20-25 min',
    seating_capacity: 70,
    group_friendly: { solo: true, couple: true, family: true, large_group: false }
  }
];

export const groupTypes: GroupType[] = [
  { id: 'solo', label: 'Solo', icon: '👤' },
  { id: 'couple', label: 'Pareja', icon: '👫' },
  { id: 'family', label: 'Familia', icon: '👨‍👩‍👧‍👦' },
  { id: 'large_group', label: 'Grupo Grande', icon: '👥' }
];
