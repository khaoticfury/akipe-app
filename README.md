# Restaurant Finder App 🍽️

Una aplicación web moderna para encontrar restaurantes cerca de tu ubicación usando Google Maps y Places API.

## 🌟 Características

- **Mapa interactivo** con Google Maps
- **Búsqueda automática** de restaurantes cercanos
- **Geolocalización** para encontrar tu posición actual
- **Filtros avanzados**:
  - Radio de búsqueda (500m - 5km)
  - Tipo de establecimiento (restaurantes, cafeterías, bares, etc.)
  - Calificación mínima
  - Rango de precios
  - Solo lugares abiertos
- **Información detallada** de cada restaurante:
  - Calificaciones y reseñas
  - Fotos del lugar
  - Horarios de apertura
  - Dirección exacta
  - Tipos de comida
- **Interfaz responsive** para móvil y escritorio
- **Marcadores interactivos** en el mapa

## 🚀 Tecnologías Utilizadas

- **Next.js 15** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **Google Maps JavaScript API** - Mapas interactivos
- **Google Places API** - Datos de restaurantes
- **Lucide React** - Iconos modernos

## 📋 Requisitos Previos

1. **Node.js** (versión 18 o superior)
2. **API Key de Google Maps** con los siguientes servicios habilitados:
   - Maps JavaScript API
   - Places API
   - Geolocation API

## ⚙️ Configuración

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd restaurant-finder-app
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### 4. Obtener API Key de Google Maps

1. Ve a la [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las siguientes APIs:
   - Maps JavaScript API
   - Places API
   - Geolocation API
4. Crea credenciales (API Key)
5. Configura las restricciones de la API Key (opcional pero recomendado)

## 🎯 Uso

### Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`

### Producción
```bash
npm run build
npm start
```

## 🗂️ Estructura del Proyecto

```
restaurant-finder-app/
├── app/
│   ├── components/
│   │   ├── GoogleMap.tsx      # Componente principal del mapa
│   │   ├── RestaurantCard.tsx # Tarjeta de restaurante
│   │   └── SearchFilters.tsx  # Filtros de búsqueda
│   ├── types/
│   │   └── index.ts          # Definiciones de tipos TypeScript
│   ├── globals.css           # Estilos globales
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Página principal
├── public/                  # Archivos estáticos
├── .env.local              # Variables de entorno (no incluido en git)
└── README.md               # Este archivo
```

## 🎨 Funcionalidades Detalladas

### Mapa Interactivo
- Visualización en tiempo real de restaurantes cercanos
- Marcadores clickeables con información del restaurante
- Zoom automático al seleccionar un restaurante
- Indicador de ubicación del usuario

### Sistema de Filtros
- **Radio**: Controla la distancia de búsqueda
- **Tipo**: Filtra por tipo de establecimiento
- **Calificación**: Muestra solo lugares con calificación mínima
- **Precio**: Filtra por rango de precios ($ a $$$$)
- **Abierto ahora**: Muestra solo lugares abiertos

### Información de Restaurantes
- Nombre y dirección
- Calificación con estrellas
- Fotos del establecimiento
- Estado de apertura (abierto/cerrado)
- Tipos de comida servida
- Nivel de precios

## 🔧 Personalización

### Modificar el Centro Predeterminado
Edita la constante `DEFAULT_CENTER` en `GoogleMap.tsx`:
```typescript
const DEFAULT_CENTER: MapCenter = { lat: 19.4326, lng: -99.1332 } // Ciudad de México
```

### Agregar Nuevos Tipos de Filtros
Modifica el array `typeOptions` en `SearchFilters.tsx`:
```typescript
const typeOptions = [
  { value: 'restaurant', label: 'Todos los restaurantes' },
  { value: 'nuevo_tipo', label: 'Nuevo Tipo' },
  // ...
]
```

### Personalizar Estilos del Mapa
Modifica la configuración de `styles` en la inicialización del mapa:
```typescript
const map = new google.maps.Map(mapRef.current, {
  // ...
  styles: [
    // Tus estilos personalizados aquí
  ]
})
```

## 🐛 Solución de Problemas

### Error: "Google Maps API key not found"
- Verifica que `.env.local` existe y contiene la API key correcta
- Asegúrate de que la variable se llame `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Reinicia el servidor de desarrollo

### Error: "This API project is not authorized to use this API"
- Verifica que Maps JavaScript API y Places API estén habilitadas
- Revisa las restricciones de tu API key
- Asegúrate de que el dominio esté autorizado

### No se muestran restaurantes
- Verifica que Places API esté habilitada
- Comprueba que la geolocalización esté permitida en el navegador
- Revisa la consola del navegador para errores

## 📱 Compatibilidad

- ✅ Chrome (versión 90+)
- ✅ Firefox (versión 88+)
- ✅ Safari (versión 14+)
- ✅ Edge (versión 90+)
- ✅ Dispositivos móviles (iOS/Android)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- Google Maps Platform por las APIs
- Next.js team por el excelente framework
- Tailwind CSS por el sistema de utilidades
- Lucide por los iconos
