import {
  GeolocationPositionError,
  GEOLOCATION_ERROR_CODES,
  GEOLOCATION_ERROR_MESSAGES,
  GeolocationErrorCode
} from '../types/geolocation';

export interface GeolocationErrorResult {
  errorMessage: string;
  errorCode?: GeolocationErrorCode;
  originalError?: any;
}

/**
 * Safely handles geolocation errors and provides meaningful error messages
 * @param error - The error object from geolocation API (may be empty)
 * @param fallbackMessage - Custom fallback message if error object is empty
 * @returns Object with user-friendly error message and error details
 */
export function handleGeolocationError(
  error: any,
  fallbackMessage?: string
): GeolocationErrorResult {
  // Log the original error for debugging
  console.error("Geolocation error details:", error);

  // If error object is null, undefined, or not an object
  if (!error || typeof error !== 'object') {
    const errorMessage = fallbackMessage || GEOLOCATION_ERROR_MESSAGES.UNKNOWN_ERROR;
    return {
      errorMessage,
      originalError: error
    };
  }

  // If error object is empty (no properties)
  if (Object.keys(error).length === 0) {
    const errorMessage = fallbackMessage || GEOLOCATION_ERROR_MESSAGES.UNKNOWN_ERROR;
    return {
      errorMessage,
      originalError: error
    };
  }

  // Try to extract error code and message
  const errorCode = error.code as GeolocationErrorCode;
  const errorMessage = error.message || '';

  // Check if it's a standard geolocation error code
  if (errorCode && errorCode in GEOLOCATION_ERROR_MESSAGES) {
    return {
      errorMessage: GEOLOCATION_ERROR_MESSAGES[errorCode],
      errorCode,
      originalError: error
    };
  }

  // For non-standard errors, provide a generic message with details
  const userMessage = errorMessage
    ? `Error de ubicación: ${errorMessage}`
    : GEOLOCATION_ERROR_MESSAGES.UNKNOWN_ERROR;

  return {
    errorMessage: userMessage,
    errorCode,
    originalError: error
  };
}

/**
 * Checks if an error is a geolocation permission error
 * @param error - The error object from geolocation API
 * @returns True if the error is a permission-related error
 */
export function isPermissionError(error: any): boolean {
  if (!error || typeof error !== 'object') return false;

  return error.code === GEOLOCATION_ERROR_CODES.PERMISSION_DENIED;
}

/**
 * Checks if an error is a timeout error
 * @param error - The error object from geolocation API
 * @returns True if the error is a timeout error
 */
export function isTimeoutError(error: any): boolean {
  if (!error || typeof error !== 'object') return false;

  return error.code === GEOLOCATION_ERROR_CODES.TIMEOUT;
}
