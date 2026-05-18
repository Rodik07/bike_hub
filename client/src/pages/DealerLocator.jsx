import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import axios from 'axios';
import toast from 'react-hot-toast';
import DestinationAutocomplete from '../components/DestinationAutocomplete';
import DealerBikesModal from '../components/DealerBikesModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaMapMarkerAlt, FaFilter, FaStore, FaEye } from 'react-icons/fa';
import { useBikeHubGoogleMaps } from '../hooks/useBikeHubGoogleMaps';
import { DEFAULT_MAP_CENTER } from '../config/googleMaps';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const mapOptions = {
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  gestureHandling: 'greedy',
  clickableIcons: false
};

function parseDealerLatLng(dealer) {
  const lat = Number(dealer?.location?.latitude);
  const lng = Number(dealer?.location?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

const DealerLocator = () => {
  const [dealers, setDealers] = useState([]);
  const [filteredDealers, setFilteredDealers] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    city: '',
    brand: ''
  });
  const [loading, setLoading] = useState(true);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [showBikesModal, setShowBikesModal] = useState(false);
  const [selectedDealerForBikes, setSelectedDealerForBikes] = useState(null);
  const mapRef = useRef(null);
  const { isLoaded, loadError } = useBikeHubGoogleMaps();

  useEffect(() => {
    fetchDealers();
  }, []);

  useEffect(() => {
    filterDealers();
  }, [filters, dealers]);

  const fetchDealers = async () => {
    try {
      const { data } = await axios.get('/api/dealers');
      setDealers(data);
      setFilteredDealers(data);
    } catch {
      toast.error('Failed to load dealers');
    } finally {
      setLoading(false);
    }
  };

  const filterDealers = () => {
    let filtered = [...dealers];

    if (filters.type) {
      filtered = filtered.filter((d) => d.type === filters.type);
    }
    if (filters.city) {
      filtered = filtered.filter((d) =>
        d.address?.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }
    if (filters.brand) {
      filtered = filtered.filter((d) => d.brands?.includes(filters.brand));
    }

    setFilteredDealers(filtered);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const dealersWithLocation = useMemo(
    () =>
      filteredDealers
        .map((d) => {
          const pos = parseDealerLatLng(d);
          return pos ? { ...d, _mapPos: pos } : null;
        })
        .filter(Boolean),
    [filteredDealers]
  );

  const mapCenter = useMemo(() => {
    if (dealersWithLocation.length > 0) {
      return dealersWithLocation[0]._mapPos;
    }
    return DEFAULT_MAP_CENTER;
  }, [dealersWithLocation]);

  const fitBoundsToDealers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps || dealersWithLocation.length === 0) return;

    if (dealersWithLocation.length === 1) {
      const { lat, lng } = dealersWithLocation[0]._mapPos;
      map.setCenter({ lat, lng });
      map.setZoom(12);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    dealersWithLocation.forEach((d) => bounds.extend(d._mapPos));
    map.fitBounds(bounds, 64);
  }, [dealersWithLocation]);

  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      fitBoundsToDealers();
    },
    [fitBoundsToDealers]
  );

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    fitBoundsToDealers();
  }, [isLoaded, fitBoundsToDealers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedDealer) return;
    const pos = parseDealerLatLng(selectedDealer);
    if (!pos) return;
    map.panTo(pos);
    const z = map.getZoom();
    if (z < 11) map.setZoom(12);
  }, [selectedDealer]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size={200} text="Loading dealers…" />
      </div>
    );
  }

  const mapBlock = () => {
    if (loadError) {
      return (
        <div className="h-96 rounded-lg bg-gray-100 flex flex-col items-center justify-center text-center px-6 text-gray-700 border border-gray-200">
          <p className="font-semibold mb-2">Google Maps could not load</p>
          <p className="text-sm max-w-md">
            Set <code className="bg-gray-200 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in{' '}
            <code className="bg-gray-200 px-1 rounded">client/.env</code> and enable the Maps JavaScript API for your
            project.
          </p>
        </div>
      );
    }
    if (!isLoaded) {
      return (
        <div className="h-96 rounded-lg bg-gray-50 flex flex-col items-center justify-center gap-3 border border-gray-200">
          <LoadingSpinner size={48} inline />
          <p className="text-sm text-gray-600">Loading Google Maps…</p>
        </div>
      );
    }
    return (
      <div className="h-[28rem] min-h-[22rem] rounded-lg overflow-hidden shadow-md border border-gray-200 google-map-shell relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={dealersWithLocation.length ? 7 : 7}
          onLoad={onMapLoad}
          options={mapOptions}
        >
          {dealersWithLocation.map((dealer) => (
            <Marker
              key={dealer._id}
              position={dealer._mapPos}
              title={dealer.name}
              onClick={() => setSelectedDealer(dealer)}
            >
              {selectedDealer?._id === dealer._id && (
                <InfoWindow onCloseClick={() => setSelectedDealer(null)}>
                  <div className="max-w-[220px]">
                    <h3 className="font-bold text-gray-900 mb-1">{dealer.name}</h3>
                    <p className="text-xs text-gray-600 mb-1">{dealer.address?.city}</p>
                    <p className="text-xs text-gray-600 mb-2">Phone: {dealer.phone}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDealerForBikes(dealer);
                        setShowBikesModal(true);
                      }}
                      className="w-full mt-1 bg-primary-600 text-white px-2 py-1.5 rounded text-xs font-semibold hover:bg-primary-700"
                    >
                      View bikes
                    </button>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          ))}
        </GoogleMap>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 flex items-center space-x-3">
          <FaMapMarkerAlt className="text-primary-600" />
          <span>Dealer &amp; Service Center Locator</span>
        </h1>
        <p className="text-gray-600">Find authorized dealers and service centers across Nepal</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-gray-100">
        <div className="flex items-center space-x-2 mb-4">
          <FaFilter className="text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-800">Search filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
          >
            <option value="">All types</option>
            <option value="showroom">Showroom</option>
            <option value="service_type">Service type</option>
          </select>
          <DestinationAutocomplete
            value={filters.city}
            onChange={handleFilterChange}
            placeholder="Search destination in Nepal…"
          />
          <input
            type="text"
            name="brand"
            placeholder="Filter by brand…"
            value={filters.brand}
            onChange={handleFilterChange}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
            <FaStore className="text-primary-600" />
            <span>
              {filteredDealers.length} {filteredDealers.length === 1 ? 'location' : 'locations'} found
            </span>
          </h2>
          <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
            {filteredDealers.map((dealer) => (
              <div
                key={dealer._id}
                className={`bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer border ${
                  selectedDealer?._id === dealer._id ? 'ring-2 ring-primary-500 border-primary-200' : 'border-transparent'
                }`}
                onClick={() => setSelectedDealer(dealer)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedDealer(dealer);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div>
                  <h3 className="font-bold">{dealer.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{dealer.type.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-600">
                    {dealer.address?.street}, {dealer.address?.city}
                  </p>
                  <p className="text-sm text-gray-600">Phone: {dealer.phone}</p>
                  {dealer.brands && dealer.brands.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">Brands: {dealer.brands.join(', ')}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDealerForBikes(dealer);
                    setShowBikesModal(true);
                  }}
                  className="mt-3 w-full flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  <FaEye />
                  <span>View listed bikes</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {mapBlock()}

          {selectedDealer && (
            <div className="mt-4 bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <h3 className="text-xl font-bold mb-2">{selectedDealer.name}</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Type:</span>{' '}
                  {selectedDealer.type.replace('_', ' ').toUpperCase()}
                </p>
                <p>
                  <span className="font-semibold">Address:</span>{' '}
                  {selectedDealer.address?.street}, {selectedDealer.address?.city},{' '}
                  {selectedDealer.address?.state}
                </p>
                <p>
                  <span className="font-semibold">Phone:</span> {selectedDealer.phone}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {selectedDealer.email}
                </p>
                {selectedDealer.brands && selectedDealer.brands.length > 0 && (
                  <p>
                    <span className="font-semibold">Brands:</span> {selectedDealer.brands.join(', ')}
                  </p>
                )}
                {selectedDealer.services && selectedDealer.services.length > 0 && (
                  <p>
                    <span className="font-semibold">Services:</span> {selectedDealer.services.join(', ')}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedDealerForBikes(selectedDealer);
                  setShowBikesModal(true);
                }}
                className="mt-4 w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-accent-500 text-white px-4 py-3 rounded-lg hover:from-primary-700 hover:to-accent-600 transition-all font-semibold"
              >
                <FaEye />
                <span>View all listed bikes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <DealerBikesModal
        isOpen={showBikesModal}
        onClose={() => {
          setShowBikesModal(false);
          setSelectedDealerForBikes(null);
        }}
        dealer={selectedDealerForBikes}
      />
    </div>
  );
};

export default DealerLocator;
