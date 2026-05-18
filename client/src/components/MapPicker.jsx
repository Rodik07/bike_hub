import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import { useBikeHubGoogleMaps } from '../hooks/useBikeHubGoogleMaps';
import { getGoogleMapsApiKey } from '../config/googleMaps';
import LoadingSpinner from './LoadingSpinner';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0 0 1rem 1rem'
};

function triggerMapResize(map) {
  if (!map || !window.google?.maps?.event) return;
  window.google.maps.event.trigger(map, 'resize');
}

const MapPicker = ({ isOpen, onClose, onSelect, initialLat = 27.7172, initialLng = 85.3240 }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [center, setCenter] = useState({ lat: initialLat, lng: initialLng });
  const mapRef = useRef(null);
  const resizeTimersRef = useRef([]);
  const { isLoaded, loadError } = useBikeHubGoogleMaps();
  const apiKey = getGoogleMapsApiKey();

  const mapOptions = useMemo(
    () => ({
      streetViewControl: false,
      mapTypeControl: true,
      fullscreenControl: true,
      gestureHandling: 'greedy',
      clickableIcons: false
    }),
    []
  );

  const clearResizeTimers = useCallback(() => {
    resizeTimersRef.current.forEach((id) => window.clearTimeout(id));
    resizeTimersRef.current = [];
  }, []);

  const scheduleResize = useCallback(
    (map) => {
      clearResizeTimers();
      if (!map) return;
      const target = { lat: initialLat, lng: initialLng };
      const apply = () => {
        triggerMapResize(map);
        map.setCenter(target);
      };
      apply();
      requestAnimationFrame(() => {
        requestAnimationFrame(apply);
      });
      resizeTimersRef.current = [
        window.setTimeout(apply, 120),
        window.setTimeout(apply, 400)
      ];
    },
    [initialLat, initialLng, clearResizeTimers]
  );

  useEffect(() => {
    if (!isOpen) {
      clearResizeTimers();
      mapRef.current = null;
    }
  }, [isOpen, clearResizeTimers]);

  useEffect(() => () => clearResizeTimers(), [clearResizeTimers]);

  useEffect(() => {
    if (isOpen) {
      setSelectedLocation(null);
      setCenter({ lat: initialLat, lng: initialLng });
    }
  }, [isOpen, initialLat, initialLng]);

  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      map.panTo({ lat: initialLat, lng: initialLng });
      scheduleResize(map);
    },
    [initialLat, initialLng, scheduleResize]
  );

  useEffect(() => {
    if (mapRef.current && isOpen) {
      mapRef.current.panTo(center);
    }
  }, [center, isOpen]);

  const handleMapClick = useCallback((e) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setSelectedLocation({ lat, lng });
    setCenter({ lat, lng });
  }, []);

  const handleConfirm = () => {
    if (selectedLocation) {
      const mapLink = `https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`;
      onSelect(selectedLocation.lat, selectedLocation.lng, mapLink);
      onClose();
    }
  };

  const renderMapBody = () => {
    if (!apiKey.trim()) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-amber-50 text-amber-900 px-6 text-center border border-amber-200 rounded-lg">
          <p className="font-semibold mb-2">Google Maps API key missing</p>
          <p className="text-sm">
            Add <code className="bg-white px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to{' '}
            <code className="bg-white px-1 rounded">client/.env</code> and restart the dev server.
          </p>
        </div>
      );
    }
    if (loadError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-100 text-gray-700 px-6 text-center">
          <p className="font-semibold mb-2">Could not load Google Maps</p>
          <p className="text-sm mb-1">
            Enable <strong>Maps JavaScript API</strong> for your key and check referrer restrictions (e.g.{' '}
            <code className="bg-gray-200 px-1 rounded text-xs">http://localhost:3000/*</code>).
          </p>
          <p className="text-xs text-gray-500 break-all max-w-full mt-2">{String(loadError.message || loadError)}</p>
        </div>
      );
    }
    if (!isLoaded) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 gap-3">
          <LoadingSpinner size={48} inline />
          <p className="text-sm text-gray-600">Loading map…</p>
        </div>
      );
    }
    return (
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={14}
        onLoad={onMapLoad}
        onClick={handleMapClick}
        options={mapOptions}
      >
        {selectedLocation && (
          <Marker
            position={selectedLocation}
            draggable
            onDragEnd={(e) => {
              if (!e.latLng) return;
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              setSelectedLocation({ lat, lng });
              setCenter({ lat, lng });
            }}
            animation={window.google.maps.Animation.DROP}
          />
        )}
      </GoogleMap>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            onAnimationComplete={() => {
              if (mapRef.current) triggerMapResize(mapRef.current);
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-primary-600 to-accent-500 p-2 rounded-lg">
                  <FaMapMarkerAlt className="text-white text-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Pick location</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Tap the map or drag the pin to fine-tune</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div
              className="relative google-map-shell w-full bg-gray-100 shrink-0"
              style={{ minHeight: '400px', height: 'min(500px, 50vh)', minWidth: '280px' }}
            >
              {renderMapBody()}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 shrink-0 overflow-y-auto max-h-[40vh]">
              <div className="mb-4">
                {selectedLocation ? (
                  <div className="bg-white p-4 rounded-lg border-2 border-primary-500">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-xs font-semibold text-gray-600 mb-1">Latitude</span>
                          <p className="text-lg font-bold text-primary-600">{selectedLocation.lat.toFixed(6)}</p>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-gray-600 mb-1">Longitude</span>
                          <p className="text-lg font-bold text-primary-600">{selectedLocation.lng.toFixed(6)}</p>
                        </div>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-gray-600 mb-1">Maps link</span>
                        <p className="text-sm text-primary-600 break-all font-medium">
                          https://www.google.com/maps?q={selectedLocation.lat.toFixed(6)},{selectedLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 text-center">Tap the map to drop a pin, then drag it if needed</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  disabled={!selectedLocation}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-accent-500 text-white px-6 py-3 rounded-xl font-bold hover:from-primary-700 hover:to-accent-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  Confirm location
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MapPicker;
