// Geolocation API error types and constants
export interface GeolocationPositionError {
  code: number;
  message: string;
  PERMISSION_DENIED?: number;
  POSITION_UNAVAILABLE?: number;
  TIMEOUT?: number;
}

// Geolocation error codes (standard values)
export const GEOLOCATION_ERROR_CODES = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
} as const;

// User-friendly error messages
export const GEOLOCATION_ERROR_MESSAGES = {
  [GEOLOCATION_ERROR_CODES.PERMISSION_DENIED]:
    "Acceso a la ubicación denegado. Por favor, permite el acceso a la ubicación en la configuración del navegador y recarga la página.",

  [GEOLOCATION_ERROR_CODES.POSITION_UNAVAILABLE]:
    "La información de ubicación no está disponible. Verifica que tu dispositivo tenga GPS activado y una conexión a internet.",

  [GEOLOCATION_ERROR_CODES.TIMEOUT]:
    "La ubicación está tardando más de lo esperado. Intentando con configuración alternativa... Si persiste, verifica tu conexión GPS o intenta manualmente.",

  UNKNOWN_ERROR:
    "Error desconocido al obtener la ubicación. Por favor, verifica tu conexión a internet y los permisos de ubicación.",
} as const;

export type GeolocationErrorCode = typeof GEOLOCATION_ERROR_CODES[keyof typeof GEOLOCATION_ERROR_CODES];
