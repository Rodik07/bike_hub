import { useJsApiLoader } from '@react-google-maps/api';
import {
  getGoogleMapsApiKey,
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_LOADER_ID
} from '../config/googleMaps';

export function useBikeHubGoogleMaps() {
  const apiKey = getGoogleMapsApiKey();
  const opts = {
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: apiKey,
    version: 'weekly'
  };
  if (GOOGLE_MAPS_LIBRARIES.length > 0) {
    opts.libraries = GOOGLE_MAPS_LIBRARIES;
  }
  return useJsApiLoader(opts);
}
