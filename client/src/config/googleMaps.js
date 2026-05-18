/** @type {import('@react-google-maps/api').Library[]} */
export const GOOGLE_MAPS_LIBRARIES = [];

export const GOOGLE_MAPS_LOADER_ID = 'bikehub-google-maps';

export function getGoogleMapsApiKey() {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
}

export const DEFAULT_MAP_CENTER = { lat: 27.7172, lng: 85.3240 };
